import axios, {AxiosRequestConfig} from 'axios';
import BigNumber from 'bignumber.js';
import {PinoLogger} from 'nestjs-pino';
import {Request} from 'express';
import {
    Currency,
    SignatureId,
    EgldTransaction,
    egldGetGasPrice,
    egldGetGasLimit,
    generateAddressFromXPub,
    generatePrivateKeyFromMnemonic,
    generateWallet,
    TransactionHash,
    EgldEsdtTransaction,
    EgldSendTransaction,
    prepareEgldSignedTransaction,
    prepareEgldDeployEsdtSignedTransaction,
    prepareEgldMintEsdtSignedTransaction,
    prepareEgldBurnEsdtSignedTransaction,
    prepareEgldPauseEsdtSignedTransaction,
    prepareEgldSpecialRoleEsdtOrNftSignedTransaction,
    prepareEgldFreezeOrWipeOrOwvershipEsdtSignedTransaction,
    prepareEgldControlChangesEsdtSignedTransaction,
    prepareEgldTransferEsdtSignedTransaction,
    prepareEgldDeployNftOrSftSignedTransaction,
    prepareEgldCreateNftOrSftSignedTransaction,
    prepareEgldTransferNftCreateRoleSignedTransaction,
    prepareEgldStopNftCreateSignedTransaction,
    prepareEgldAddOrBurnNftQuantitySignedTransaction,
    prepareEgldFreezeNftSignedTransaction,
    prepareEgldWipeNftSignedTransaction,
    prepareEgldTransferNftSignedTransaction,
} from '@tatumio/tatum';
import {BroadcastOrStoreKMSTransaction} from '@tatumio/blockchain-connector-common'
import {EgldError} from './EgldError';

export abstract class EgldService {

    private static mapBlock(block: any) {
        return {
            nonce: block.nonce,
            round: block.round,
            hash: block.hash,
            prevBlockHash: block.prevBlockHash,
            epoch: block.epoch,
            numTxs: block.numTxs,
            shardBlocks: block.shardBlocks.map(EgldService.mapShardBlock),
            transactions:  block.transactions.map(EgldService.mapInBlockTransaction),     
        };
    }

    private static mapShardBlock(block: any) {
        return {
            hash: block.hash,
            nonce: block.nonce,
            shard: block.shard,
        };
    }

    private static mapInBlockTransaction(tx: any) {
        return {
            type: tx.type,
            hash: tx.hash,
            nonce: tx.nonce,
            value: tx.value,
            receiver: tx.receiver,
            sender: tx.sender,
            gasPrice: tx.gasPrice,
            gasLimit: tx.gasLimit,
            data: tx.data,
            signature: tx.signature,
            status: tx.status,
        };
    };

    private static mapTransaction(tx: any) {
        return {
            type: tx.type,
            nonce: tx.nonce,
            round: tx.round,
            epoch: tx.epoch,
            value: tx.value,
            receiver: tx.receiver,
            sender: tx.sender,
            gasPrice: tx.gasPrice,
            gasLimit: tx.gasLimit,
            data: tx.data,
            signature: tx.signature,
            sourceShard: tx.sourceShard,
            destinationShard: tx.destinationShard,
            blockNonce: tx.blockNonce,
            blockHash: tx.blockHash,
            miniblockHash: tx.miniblockHash,
            timestamp: tx.timestamp,
            status: tx.status,
            hyperblockNonce: tx.hyperblockNonce,
            hyperblockHash: tx.hyperblockHash,
            receipt: EgldService.mapReceipt(tx.receipt || []),
            smartContractResults: (tx.smartContractResults || []).map(EgldService.mapSmartContractResults)        
        };
    };

    private static mapReceipt(rx: any) {
        return {
          value: rx.value,
          sender: rx.sender,
          data: rx.data,
          txHash: rx.txHash,
        };
    }

    private static mapSmartContractResults(sx: any) {
        return {
            hash: sx.hash,
            nonce: sx.nonce,
            value: sx.value,
            receiver: sx.receiver,
            sender: sx.sender,
            data: sx.data,
            prevTxHash: sx.prevTxHash,
            originalTxHash: sx.originalTxHash,
            gasLimit: sx.gasLimit,
            gasPrice: sx.gasPrice,
            callType: sx.callType,
            logs: sx.logs || null,
        };
    }

    protected constructor(protected readonly logger: PinoLogger) {
    }

    protected abstract isTestnet(): Promise<boolean>

    protected abstract getNodesUrl(testnet: boolean): Promise<string[]>

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract completeKMSTransaction(txId: string, signatureId: string): Promise<void>;

    private async getFirstNodeUrl(testnet: boolean): Promise<string> {
        const nodes = await this.getNodesUrl(testnet);
        if (nodes.length === 0) {
            new EgldError('Nodes url array must have at least one element.', 'egld.nodes.url');
        }
        return nodes[0];
    }

    public async getClient(testnet: boolean): Promise<string> {
        return await this.getFirstNodeUrl(testnet);
    }

    public async broadcast(txData: string, signatureId?: string, withdrawalId?: string): Promise<{
        txId: string,
        failed?: boolean,
    }> {
        this.logger.info(`Broadcast tx for EGLD with data '${txData}'`);

        const t = await this.isTestnet();
        let result;
        try {
            const {txHash} = (await axios.post(`${await this.getFirstNodeUrl(t)}/transaction/send`,
                txData,
                {headers: {'content-type': 'text/plain'}})).data.data;
            result.txId = txHash;
        } catch (e) {
            new EgldError(`Unable to broadcast transaction due to ${e.message}.`, 'egld.broadcast.failed');
            throw e;
        }

        if (signatureId) {
            try {
                await this.completeKMSTransaction(result.txId, signatureId);
            } catch (e) {
                this.logger.error(e);
                return {txId: result.txId, failed: true};
            }
        }

        return result;
    }

    public async getCurrentBlock(testnet?: boolean): Promise<number> {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        try {
            const {status} = (await axios.get(`${await this.getFirstNodeUrl(t)}/network/status/4294967295`,
                {headers: {'Content-Type': 'application/json'}})).data.data;
            return status?.erd_highest_final_nonce;
        } catch (e) {
            this.logger.error(e);
            throw e;
        }
    }

    public async getBlock(hash: string | number, testnet?: boolean) {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        try {
            const isHash = typeof hash === 'string' && hash.length >= 64;
            const block = (await axios.get(`${await this.getFirstNodeUrl(t)}/hyperblock/${isHash ? 'by-hash' : 'by-nonce'}/${hash}`,
                {headers: {'Content-Type': 'application/json'}})).data.data.hyperblock;
            return EgldService.mapBlock(block);
        } catch (e) {
            this.logger.error(e);
            throw e;
        }
    }

    public async getTransaction(txId: string, testnet?: boolean) {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        try {
            const { transaction } = (await axios.get(`${await this.getFirstNodeUrl(t)}/transaction/${txId}?withResults=true`,
                {headers: {'Content-Type': 'application/json'}})).data.data;
            return EgldService.mapTransaction({...transaction, hash: txId});
        } catch (e) {
            this.logger.error(e);
            throw new EgldError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        }
    }

    public async getTransactionCount(address: string) {
        const t = await this.isTestnet();
        try {
            const {nonce} = (await axios.get(`${await this.getFirstNodeUrl(t)}/address/${address}/nonce`,
                {headers: {'Content-Type': 'application/json'}})).data.data;
            return nonce;
        } catch (e) {
            this.logger.error(e);
            throw new EgldError('Transactions count for account not found.', 'accountNonceTx.not.found');
        }
    }

    public async getTransactionsByAccount(address: string, pageSize?: string, offset?: string, count?: string) {
        const t = await this.isTestnet();
        try {
            const {transactions} = (await axios.get(`${await this.getFirstNodeUrl(t)}/address/${address}/transactions`,
                {headers: {'Content-Type': 'application/json'}})).data.data;
            return transactions;
        } catch (e) {
            this.logger.error(e);
            throw new EgldError('Transactions count for account not found.', 'accountNonceTx.not.found');
        }
    }

    private async broadcastOrStoreKMSTransaction({
                                                     transactionData,
                                                     signatureId,
                                                     index
                                                 }: BroadcastOrStoreKMSTransaction) {
        if (signatureId) {
            return {
                signatureId: await this.storeKMSTransaction(transactionData, Currency.EGLD, [signatureId], index),
            };
        }
        return this.broadcast(transactionData);
    }

    public async nodeMethod(req: Request, key: string) {
        const node = await this.getFirstNodeUrl(await this.isTestnet());
        const path = req.url;
        const testnet = await this.isTestnet();
        const baseURL = node;
        const [_, url] = path.split(`/${key}/`);
        const config = {
            method: req.method || 'GET',
            url,
            baseURL,
            headers: {
                'content-type': 'application/json',
            },
            ...(Object.keys(req.body).length ? {data: req.body} : {}),
        };
        try {
            return (await axios.request(config as AxiosRequestConfig)).data;
        } catch (e) {
            this.logger.error(e.response ? e.response.data?.message : e);
            throw new EgldError(`Unable to communicate with blockchain. ${e.response ? e.response.data?.message : e}`, 'egld.failed');
        }
    }

    public async generateWallet(mnemonic?: string) {
        return generateWallet(Currency.EGLD, await this.isTestnet(), mnemonic);
    }

    public async generatePrivateKey(mnemonic: string, index: number) {
        const key = await generatePrivateKeyFromMnemonic(Currency.EGLD, await this.isTestnet(), mnemonic, index);
        return {key};
    }

    public async generateAddress(mnem: string, derivationIndex: string): Promise<{ address: string }> {
        const address = await generateAddressFromXPub(Currency.EGLD, await this.isTestnet(), mnem, parseInt(derivationIndex));
        return {address};
    }

    public async estimateGas(body: EgldSendTransaction) {
        return {
            gasLimit: await egldGetGasLimit(body),
            gasPrice: await egldGetGasPrice(),
        };
    }

    public async getBalance(address: string): Promise<{ balance: string }> {
        const t = await this.isTestnet();
        try {
            const {balance} = (await axios.get(`${await this.getFirstNodeUrl(t)}/address/${address}/balance`,
                {headers: {'Content-Type': 'application/json'}})).data.data;
            return {balance: new BigNumber(balance).dividedBy(1e+18).toString()};
        } catch (e) {
            this.logger.error(e);
            throw new EgldError('Balance for account not found.', 'accountBalance.not.found');
        }
    }

    public async sendEgldTransaction(transfer: EgldEsdtTransaction): Promise<TransactionHash | SignatureId> {
        const transactionData = await prepareEgldSignedTransaction(transfer, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: transfer.signatureId,
            index: transfer.index
        });
    }

    public async deploySmartContract(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldDeployEsdtSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }
    
    public async mintSmartContract(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldMintEsdtSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }
    
    public async burnSmartContract(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldBurnEsdtSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }
    
    public async pauseSmartContract(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldPauseEsdtSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }

    public async specialRoleSmartContract(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldSpecialRoleEsdtOrNftSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }
    
    public async freezeOrWipeOrOwvershipSmartContract(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldFreezeOrWipeOrOwvershipEsdtSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }
    
    public async controlChangesSmartContract(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldControlChangesEsdtSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }

    public async invokeSmartContractMethod(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldTransferEsdtSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }

    public async deployNft(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldDeployNftOrSftSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }

    public async createNft(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldCreateNftOrSftSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }

    public async roleTransferNft(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldTransferNftCreateRoleSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }
    
    public async stopNftCreate(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldStopNftCreateSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }
    
    public async addOrBurnNftQuantity(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldAddOrBurnNftQuantitySignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }
    
    public async freezeNft(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldFreezeNftSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }
  
    public async wipeNft(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldWipeNftSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }

    public async transferNft(tx: EgldEsdtTransaction) {
        const transactionData = await prepareEgldTransferNftSignedTransaction(tx, await this.getFirstNodeUrl(await this.isTestnet()));
        return this.broadcastOrStoreKMSTransaction({
            transactionData,
            signatureId: tx.signatureId,
            index: tx.index
        });
    }
}
