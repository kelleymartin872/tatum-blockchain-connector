import {PinoLogger} from 'nestjs-pino';
const axios = require('axios');
import {
  Currency,
  generateAlgoWallet,
  generateAlgodAddressFromPrivatetKey,
  getAlgoClient,
  getAlgoIndexerClient,
  AlgoTransaction,
  prepareAlgoSignedTransaction
} from '@tatumio/tatum';

import {BroadcastOrStoreKMSTransaction} from '@tatumio/blockchain-connector-common';
import {AlgoError} from './AlgoError';
export abstract class AlgoService {

  private static mapBlock(block: any) {
    return {
      genesisHash: block['genesis-hash'],
      genesisId: block['genesis-id'],
      previousBlockHash: block['previous-block-hash'],
      rewards: block.rewards,
      round: block.round,
      seed: block.seed,
      timestamp: block.timestamp,
      txns: block.transactions.map(AlgoService.mapTransaction),
      txn: block['transactions-root'],
      txnc: block['txn-counter'],
      upgradeState: block['upgrade-state'],
      upgradeVote: block['upgrade-vote']
    };
  }

  private static mapTransaction(tx: any) {
    return {
      closeRewards: tx['close-rewards'],
      closingAmount: tx['closing-amount'] ? tx['closing-amount'] / 1000000 : tx['closing-amount'],
      confirmedRound: tx['confirmed-round'],
      fee: tx.fee / 1000000,
      firstValid: tx['first-valid'],
      genesisHash: tx['genesis-hash'],
      genesisId: tx['genesis-id'],
      id: tx.id,
      intraRoundOffset: tx['intra-round-offset'],
      lastValid: tx['last-valid'],
      note: tx.note,
      paymentTransaction: tx['payment-transaction'] ? {...tx['payment-transaction'], amount: tx['payment-transaction'].amount / 1000000} : tx['payment-transaction'],
      receiverRewards: tx['receiver-rewards'],
      roundTime: tx['round-time'],
      sender: tx.sender,
      senderRewards: tx['sender-rewards'],
      signature: tx.signature,
      txType: tx['tx-type'],
    };
  };


  protected constructor(protected readonly logger: PinoLogger) {
  }

  protected abstract isTestnet(): Promise<boolean>;

  protected abstract getNodesUrl(testnet?: boolean): Promise<string[]>;

  protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

  protected abstract completeKMSTransaction(txId: string, signatureId: string): Promise<void>;

  public async getClient() {
    return getAlgoClient(await this.isTestnet(), (await this.getNodesUrl(await this.isTestnet()))[0] + '/ps2');
  }

  public async getIndexerClient() {
    return getAlgoIndexerClient(await this.isTestnet(), (await this.getNodesUrl(await this.isTestnet()))[0] + '/idx2');
  }

  public async generateWallet(mnem: string) {
    return generateAlgoWallet(mnem);
  }

  public async generateAddress(fromPrivateKey: string) {
    return generateAlgodAddressFromPrivatetKey(fromPrivateKey);
  }

  public async sendTransaction(tx: AlgoTransaction) {
    const txData = await prepareAlgoSignedTransaction(await this.isTestnet(), tx, (await this.getNodesUrl())[0]);
    return this.broadcastOrStoreKMSTransaction({transactionData: txData, signatureId: tx.signatureId, index: tx.index})
  }

  public async getBalance(address: string){
    const client = await this.getClient();
    const accountInfo = await client.accountInformation(address).do();
    return accountInfo.amount / 1000000;
  }

  private async broadcastOrStoreKMSTransaction({
      transactionData,
      signatureId,index
    }: BroadcastOrStoreKMSTransaction) {
    if (signatureId) {
      return {
        signatureId: await this.storeKMSTransaction(transactionData, Currency.ALGO, [signatureId], index),
      };
    }
    return this.broadcast(transactionData);
  }

  /**
   *
   * @param algodClient algorand Client
   * @param txId transaction id
   * @returns confirmed result
   */
  private async waitForConfirmation (algodClient: any, txId: string) {
    let lastround = (await algodClient.status().do())['last-round'];
    let limit = 0;
    while (limit < 2) {
        const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
        if (pendingInfo['confirmed-round']) {
            return true;
        } else if (pendingInfo['pool-error']) {
            return false;
        }
        lastround++;
        limit++;
        await algodClient.statusAfterBlock(lastround).do();
    }
    return false;
  }

  public async broadcast(txData: string, signatureId?: string): Promise<{txId: string,failed?: boolean,}> {
    this.logger.info(`Broadcast tx for ALGO with data '${txData}'`);
    const client = await this.getClient();
    const sendTx = await client.sendRawTransaction(txData).do();
    const confirm = await this.waitForConfirmation(client, sendTx.txId);

    if (confirm) {
      if (signatureId) {
        try {
            await this.completeKMSTransaction(sendTx.txId, signatureId);
        } catch (e) {
            this.logger.error(e);
            return {txId: sendTx.txId, failed: true};
        }
      }
      return sendTx.txId;
    } else {
      throw new AlgoError(`Failed Algo Transaction Signing`, 'algo.error');
    }
  }

  public async getCurrentBlock(): Promise<number> {
    const client = await this.getClient();
    return (await client.getTransactionParams().do()).firstRound;
  }

  public async getBlock(roundNumber: number) {
    try {
      const indexerClient = await this.getIndexerClient();
      const blockInfo = await indexerClient.lookupBlock(roundNumber).do()
      return AlgoService.mapBlock(blockInfo);
    } catch (_) {
        throw new AlgoError(`Failed Algo get block by round number`, 'algo.error');
    }
  }

  public async getTransaction(txid: string) {
    try {
      const indexerClient = await this.getIndexerClient();
      const transactionInfo = (await indexerClient.lookupTransactionByID(txid).do()).transaction;
      return AlgoService.mapTransaction(transactionInfo);
    } catch (_) {
      throw new AlgoError(`Failed Algo get transaction by transaction id`, 'algo.error');
    }
  }

  public async getPayTransactions(from: string, to: string, limit?:string, next?: string, testnet?: boolean) {
    const baseurl = (await this.getNodesUrl(testnet === undefined ? (await this.isTestnet()) : testnet))[0] + '/idx2';
    const apiurl = `${baseurl}/v2/transactions?tx-type=pay&after-time=${from}&before-time=${to}` + (limit ? `&limit=${limit}`: '') + (next ? `&next=${next}` : '');
    try {
      const res = (await axios({
        method: 'get',
        url: apiurl,
        headers: {
          'X-API-Key': `${process.env.ALGO_API_KEY}`
        }
      })).data;
      const transactions = res.transactions.map(AlgoService.mapTransaction);
      return {nextToken: res['next-token'], transactions: transactions}
    } catch (_) {
      throw new AlgoError(`Failed Algo get pay transactions by from and to`, 'algo.error');
    }
  }
}
