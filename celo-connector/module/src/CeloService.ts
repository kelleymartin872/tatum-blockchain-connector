import {PinoLogger} from 'nestjs-pino';
import axios from 'axios';
import {CeloProvider} from '@celo-tools/celo-ethers-wrapper';
import {CeloError} from './CeloError';
import {
    BurnCeloErc20,
    CeloBurnErc721,
    CeloDeployErc721,
    CeloMintErc721,
    CeloMintMultipleErc721,
    CeloSmartContractMethodInvocation,
    CeloTransferErc721,
    CEUR_ADDRESS_MAINNET,
    CEUR_ADDRESS_TESTNET,
    Currency,
    CUSD_ADDRESS_MAINNET,
    CUSD_ADDRESS_TESTNET,
    DeployCeloErc20,
    generateAddressFromXPub,
    generatePrivateKeyFromMnemonic,
    generateWallet,
    MintCeloErc20,
    prepareCeloBurnErc20SignedTransaction,
    prepareCeloBurnErc721SignedTransaction,
    prepareCeloDeployErc20SignedTransaction,
    prepareCeloDeployErc721SignedTransaction,
    prepareCeloMintErc20SignedTransaction,
    prepareCeloMintErc721SignedTransaction,
    prepareCeloMintMultipleErc721SignedTransaction,
    prepareCeloOrCUsdSignedTransaction,
    prepareCeloSmartContractWriteMethodInvocation,
    prepareCeloTransferErc20SignedTransaction,
    prepareCeloTransferErc721SignedTransaction,
    sendCeloSmartContractReadMethodInvocationTransaction,
    SmartContractReadMethodInvocation,
    TransactionHash,
    TransferCeloOrCeloErc20Token,
} from '@tatumio/tatum';
import erc721_abi from '@tatumio/tatum/dist/src/contracts/erc721/erc721_abi';
import token_abi from '@tatumio/tatum/dist/src/contracts/erc20/token_abi';
import {fromWei} from 'web3-utils';
import {Block, Transaction, TransactionReceipt} from 'web3-eth';
import Web3 from 'web3';

export abstract class CeloService {

    protected constructor(protected readonly logger: PinoLogger) {
    }

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract completeKMSTransaction(txId: string, signatureId: string): Promise<void>;

    protected abstract isTestnet(): Promise<boolean>;

    protected abstract getNodesUrl(testnet: boolean): Promise<string[]>;

    public async broadcast(txData: string, signatureId?: string, withdrawalId?: string): Promise<{
        txId: string,
        failed?: boolean,
    }> {
        this.logger.info(`Broadcast tx for CELO with data '${txData}'`);
        let txId;
        try {
            const url = (await this.getNodesUrl(await this.isTestnet()))[0];
            const {result, error} = (await axios.post(url, {
                jsonrpc: '2.0',
                id: 0,
                method: 'eth_sendRawTransaction',
                params: [txData]
            }, {headers: {'Content-Type': 'application/json'}})).data;
            if (error) {
                throw new CeloError(`Unable to broadcast transaction due to ${error.message}.`, 'celo.broadcast.failed');
            }
            txId = result;
        } catch (e) {
            if (e.constructor.name === CeloError.name) {
                throw e;
            }
            this.logger.error(e);
            throw new CeloError(`Unable to broadcast transaction due to ${e.message}.`, 'celo.broadcast.failed');
        }

        if (signatureId) {
            try {
                await this.completeKMSTransaction(txId, signatureId);
            } catch (e) {
                this.logger.error(e);
                return {txId, failed: true};
            }
        }

        return {txId};
    }

    public async getCurrentBlock(testnet?: boolean): Promise<number> {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        return (await this.getClient(t)).eth.getBlockNumber();
    }

    public async getBalance(address: string, testnet?: boolean): Promise<{ celo: string, cUsd: string, cEur: string }> {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        const provider = new CeloProvider((await this.getNodesUrl(t))[0]);
        // @ts-ignore
        const cUsd = new ((await this.getClient(t))).eth.Contract(token_abi, t ? CUSD_ADDRESS_TESTNET : CUSD_ADDRESS_MAINNET);
        // @ts-ignore
        const cEur = new ((await this.getClient(t))).eth.Contract(token_abi, t ? CEUR_ADDRESS_TESTNET : CEUR_ADDRESS_MAINNET);
        return {
            celo: fromWei((await provider.getBalance(address)).toString(), 'ether'),
            cUsd: fromWei(await cUsd.methods.balanceOf(address).call(), 'ether'),
            cEur: fromWei(await cEur.methods.balanceOf(address).call(), 'ether'),
        };
    }

    public async getBlock(hash: string | number, testnet?: boolean): Promise<Block> {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        return (await this.getClient(t)).eth.getBlock(hash, true);
    }

    public async getTransaction(txId: string, testnet?: boolean): Promise<Transaction & TransactionReceipt> {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        try {
            const web3 = await this.getClient(t);
            const {r, s, v, hash, ...transaction} = (await web3.eth.getTransaction(txId)) as any;
            let receipt: TransactionReceipt = undefined;
            try {
                receipt = await web3.eth.getTransactionReceipt(hash);
            } catch (_) {
                transaction.transactionHash = hash;
            }
            return {...transaction, ...receipt};
        } catch (e) {
            this.logger.error(e);
            throw new CeloError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        }
    }

    public async transfer(body: TransferCeloOrCeloErc20Token): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const txData = await prepareCeloOrCUsdSignedTransaction(testnet, body, (await this.getNodesUrl(testnet))[0]);
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, Currency.CELO, [body.signatureId], body.index)};
        } else {
            return this.broadcast(txData);
        }
    }

    public async transferErc20(body: TransferCeloOrCeloErc20Token): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const txData = await prepareCeloTransferErc20SignedTransaction(testnet, body, (await this.getNodesUrl(testnet))[0]);
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, Currency.CELO, [body.signatureId], body.index)};
        } else {
            return this.broadcast(txData);
        }
    }

    public async invokeSmartContractMethod(body: CeloSmartContractMethodInvocation | SmartContractReadMethodInvocation) {
        const testnet = await this.isTestnet();
        if (body.methodABI.stateMutability === 'view') {
            return sendCeloSmartContractReadMethodInvocationTransaction(testnet, body, (await this.getNodesUrl(testnet))[0]);
        }
        const txData = await prepareCeloSmartContractWriteMethodInvocation(testnet, body as CeloSmartContractMethodInvocation, (await this.getNodesUrl(testnet))[0]);
        if ((body as CeloSmartContractMethodInvocation).signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, Currency.CELO, [(body as CeloSmartContractMethodInvocation).signatureId], (body as CeloSmartContractMethodInvocation).index)};
        } else {
            return this.broadcast(txData);
        }
    }

    public async mintErc20(body: MintCeloErc20): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const txData = await prepareCeloMintErc20SignedTransaction(testnet, body, (await this.getNodesUrl(testnet))[0]);
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, Currency.CELO, [body.signatureId], body.index)};
        } else {
            return this.broadcast(txData);
        }
    }

    public async burnErc20(body: BurnCeloErc20): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const txData = await prepareCeloBurnErc20SignedTransaction(testnet, body, (await this.getNodesUrl(testnet))[0]);
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, Currency.CELO, [body.signatureId], body.index)};
        } else {
            return this.broadcast(txData);
        }
    }

    public async deployErc20(body: DeployCeloErc20): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const txData = await prepareCeloDeployErc20SignedTransaction(testnet, body, (await this.getNodesUrl(testnet))[0]);
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, Currency.CELO, [body.signatureId], body.index)};
        } else {
            return this.broadcast(txData);
        }
    }

    public async getErc20Balance(address: string, contractAddress: string) {
        // @ts-ignore
        const c = new ((await this.getClient(await this.isTestnet()))).eth.Contract(token_abi, contractAddress);
        return {balance: await c.methods.balanceOf(address).call()};
    }

    // TODO: call any SC method
    // TODO: store data / get data
    // TODO: estimate gas

    public async getTransactionCount(address: string, c?: Web3) {
        const client = c || await this.getClient(await this.isTestnet());
        return client.eth.getTransactionCount(address, 'pending');
    }

    public async getBalanceErc721(address: string, contractAddress: string): Promise<{ data: string }> {
        // @ts-ignore
        const c = new (await this.getClient(await this.isTestnet())).eth.Contract(erc721_abi, contractAddress);
        try {
            return {data: await c.methods.balanceOf(address).call()};
        } catch (e) {
            this.logger.error(e);
            throw new CeloError(`Unable to obtain information for token. ${e}`, 'celo.erc721.failed');
        }
    }

    public async getTokenErc721(address: string, index: number, contractAddress: string): Promise<{ data: string }> {
        // @ts-ignore
        const c = new (await this.getClient(await this.isTestnet())).eth.Contract(erc721_abi, contractAddress);
        try {
            return {data: await c.methods.tokenOfOwnerByIndex(address, index).call()};
        } catch (e) {
            this.logger.error(e);
            throw new CeloError(`Unable to obtain information for token. ${e}`, 'celo.erc721.failed');
        }
    }

    public async getMetadataErc721(token: string, contractAddress: string): Promise<{ data: string }> {
        // @ts-ignore
        const c = new (await this.getClient(await this.isTestnet())).eth.Contract(erc721_abi, contractAddress);
        try {
            return {data: await c.methods.tokenURI(token).call()};
        } catch (e) {
            this.logger.error(e);
            throw new CeloError(`Unable to obtain information for token. ${e}`, 'celo.erc721.failed');
        }
    }

    public async getOwnerErc721(token: string, contractAddress: string): Promise<{ data: string }> {
        // @ts-ignore
        const c = new (await this.getClient(await this.isTestnet())).eth.Contract(erc721_abi, contractAddress);
        try {
            return {data: await c.methods.ownerOf(token).call()};
        } catch (e) {
            this.logger.error(e);
            throw new CeloError(`Unable to obtain information for token. ${e}`, 'celo.erc721.failed');
        }
    }

    public async getTokensOfOwner(address: string, contractAddress: string): Promise<{ data: string }> {
        // @ts-ignore
        const c = new (await this.getClient(await this.isTestnet())).eth.Contract(erc721_abi, contractAddress);
        try {
            return {data: await c.methods.tokensOfOwner(address).call()};
        } catch (e) {
            this.logger.error(e);
            throw new CeloError(`Unable to obtain information for token. ${e}`, 'celo.erc721.failed');
        }
    }

    public async transferErc721(body: CeloTransferErc721): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const txData = await prepareCeloTransferErc721SignedTransaction(testnet, body, (await this.getNodesUrl(testnet))[0]);
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, Currency.CELO, [body.signatureId], body.index)};
        } else {
            return this.broadcast(txData);
        }
    }

    public async mintErc721(body: CeloMintErc721): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const txData = await prepareCeloMintErc721SignedTransaction(testnet, body, (await this.getNodesUrl(testnet))[0]);
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, Currency.CELO, [body.signatureId], body.index)};
        } else {
            return this.broadcast(txData);
        }
    }

    public async mintMultipleErc721(body: CeloMintMultipleErc721): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const txData = await prepareCeloMintMultipleErc721SignedTransaction(testnet, body, (await this.getNodesUrl(testnet))[0]);
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, Currency.CELO, [body.signatureId], body.index)};
        } else {
            return this.broadcast(txData);
        }
    }

    public async burnErc721(body: CeloBurnErc721): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const txData = await prepareCeloBurnErc721SignedTransaction(testnet, body, (await this.getNodesUrl(testnet))[0]);
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, Currency.CELO, [body.signatureId], body.index)};
        } else {
            return this.broadcast(txData);
        }
    }

    public async deployErc721(body: CeloDeployErc721): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const txData = await prepareCeloDeployErc721SignedTransaction(testnet, body, (await this.getNodesUrl(testnet))[0]);
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, Currency.CELO, [body.signatureId], body.index)};
        } else {
            return this.broadcast(txData);
        }
    }

    public async web3Method(body: any) {
        try {
            return (await axios.post((await this.getNodesUrl(await this.isTestnet()))[0], body, {headers: {'Content-Type': 'application/json'}})).data;
        } catch (e) {
            this.logger.error(e);
            throw e;
        }
    }

    public async generateAddress(xpub: string, i: number) {
        return {address: await generateAddressFromXPub(Currency.CELO, await this.isTestnet(), xpub, i)};
    }

    public async generateWallet(mnemonic?: string) {
        return generateWallet(Currency.CELO, await this.isTestnet(), mnemonic);
    }

    public async generateAddressPrivateKey(index: number, mnemonic: string) {
        return {key: await generatePrivateKeyFromMnemonic(Currency.CELO, await this.isTestnet(), mnemonic, index)};
    }

    protected async getClient(testnet: boolean): Promise<Web3> {
        return new Web3((await this.getNodesUrl(testnet))[0]);
    }
}
