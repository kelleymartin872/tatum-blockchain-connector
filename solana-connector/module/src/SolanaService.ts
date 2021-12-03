import {PinoLogger} from 'nestjs-pino';
import {BlockResponse, Connection, PublicKey, TransactionResponse} from '@solana/web3.js'
import {BroadcastOrStoreKMSTransaction} from '@tatumio/blockchain-connector-common';
import axios from 'axios';
import {SolanaError} from './SolanaError';
import {
    Currency,
    generateWallet,
    getSolanaClient,
    sendSolana,
    SignatureId,
    TransferSolana,
    TransactionHash
} from '@tatumio/tatum-solana';
import BigNumber from "bignumber.js";

export abstract class SolanaService {

    protected constructor(protected readonly logger: PinoLogger) {
    }

    protected abstract isTestnet(): Promise<boolean>

    protected abstract getNodesUrl(testnet: boolean): Promise<string[]>

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract completeKMSTransaction(txId: string, signatureId: string): Promise<void>;

    public async getFirstNodeUrl(testnet: boolean): Promise<string> {
        const nodes = await this.getNodesUrl(testnet);
        if (nodes.length === 0) {
            new SolanaError('Nodes url array must have at least one element.', 'sol.nodes.url');
        }
        return nodes[0];
    }

    public async getClient(testnet: boolean): Promise<Connection> {
        return getSolanaClient(await this.getFirstNodeUrl(testnet));
    }

    public async broadcast(txData: { txId: string, nftAddress?: string, nftAccountAddress?: string }, signatureId?: string): Promise<{
        txId: string,
        failed?: boolean,
    }> {
        this.logger.info(`Broadcast tx for SOL with data '${txData}'`);
        if (signatureId) {
            try {
                await this.completeKMSTransaction(JSON.stringify(txData), signatureId);
            } catch (e) {
                this.logger.error(e);
                return {...txData, failed: true};
            }
        }

        return txData;
    }

    public async getCurrentBlock(testnet?: boolean): Promise<number> {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        return (await (await this.getClient(t)).getRecentBlockhashAndContext()).context.slot;
    }

    public async getBlock(height: number, testnet?: boolean): Promise<BlockResponse> {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        try {
            const connection = await this.getClient(t);
            return await connection.getBlock(height)
        } catch (e) {
            this.logger.error(e);
            throw e;
        }
    }

    public async getTransaction(txId: string, testnet?: boolean): Promise<TransactionResponse> {
        const t = testnet === undefined ? await this.isTestnet() : testnet;
        try {
            const connection = await this.getClient(t);
            return await connection.getTransaction(txId);
        } catch (e) {
            this.logger.error(e);
            throw new SolanaError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        }
    }

    public async web3Method(body: any) {
        const node = await this.getFirstNodeUrl(await this.isTestnet());
        return (await axios.post(node, body, {headers: {'Content-Type': 'application/json'}})).data;
    }

    public async generateWallet() {
        return generateWallet();
    }

    public async getBalance(address: string): Promise<{ balance: string }> {
        const connection = await this.getClient(await this.isTestnet());
        return {balance: new BigNumber(await connection.getBalance(new PublicKey(address))).dividedBy(1e9).toString()};
    }

    public async sendSOL(body: TransferSolana): Promise<TransactionHash | SignatureId> {
        const transactionData = await sendSolana(body, await this.getFirstNodeUrl(await this.isTestnet()));
        if (body.signatureId) {
            return {
                signatureId: await this.storeKMSTransaction(JSON.stringify(transactionData), Currency.SOL, [body.signatureId], body.index),
            };
        }
        return this.broadcast({txId: transactionData.txId});
    }
}
