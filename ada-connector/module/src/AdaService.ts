import { Block, PaymentAddress, Transaction } from '@cardano-graphql/client-ts';
import {
  AdaUtxo,
  Currency, FromAddress, FromUTXO,
  generateAddressFromXPub,
  generatePrivateKeyFromMnemonic,
  generateWallet, To,
  TransferBtcBasedBlockchain,
} from '@tatumio/tatum';
import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';
import { AdaBlockchainInfo } from './constants';
import {
  Address,
  BigNum, Bip32PrivateKey, hash_transaction,
  LinearFee, make_vkey_witness, TransactionBody,
  TransactionBuilder, TransactionHash, Transaction as AdaTransaction,
  TransactionInput, TransactionOutput, TransactionWitnessSet, Value, Vkeywitnesses,
} from '@emurgo/cardano-serialization-lib-nodejs'
import BigNumber from 'bignumber.js'
import { AdaError } from './AdaError'
import {
    BroadcastOrStoreKMSBtcBasedTransaction,
    TransactionKMSResponse,
    TransactionResponse, TxData,
} from '@tatumio/blockchain-connector-common';

const TX_FIELDS = '{block{number} includedAt fee hash inputs {address sourceTxHash sourceTxIndex txHash value} outputs {address index txHash value}}';

export abstract class AdaService {
  protected constructor(protected readonly logger: PinoLogger) {
  }

  protected abstract isTestnet(isTestnet?: boolean): Promise<boolean>;

  protected abstract getNodesUrl(isTestnet?: boolean): Promise<string[]>;

  protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[]): Promise<string>;

  protected abstract completeKMSTransaction(txId: string, signatureId: string): Promise<void>;

  public async getGraphQLEndpoint(isTestnet?: boolean): Promise<string> {
    const [url] = await this.getNodesUrl(isTestnet)
    return `${url}/graphql`;
  }

  async generateWallet(mnemonic?: string) {
    return generateWallet(Currency.ADA, await this.isTestnet(), mnemonic);
  }

  async generateAddress(
    xpub: string,
    i: number,
  ): Promise<{ address: string }> {
    const testnet = await this.isTestnet();
    const address = await generateAddressFromXPub(
      Currency.ADA,
      testnet,
      xpub,
      i,
    );
    return { address };
  }

  async generatePrivateKey(
    mnemonic: string,
    i: number,
  ): Promise<{ key: string }> {
    const testnet = await this.isTestnet();
    const key = await generatePrivateKeyFromMnemonic(
      Currency.ADA,
      testnet,
      mnemonic,
      i,
    );
    return { key };
  }

  public async getBlockChainInfo(isTestnet?: boolean): Promise<AdaBlockchainInfo> {
    const testnet = isTestnet === undefined ? await this.isTestnet() : isTestnet
    const response = await this.sendNodeRequest({
      query: '{ cardano { tip { number slotNo epoch { number } }} }',
    }, isTestnet)
    const { tip } = response.data.data.cardano;
    return {
      testnet,
      tip,
    };
  }


  public async getBlock(hash: string, isTestnet?: boolean): Promise<Block> {
    const testnet = isTestnet === undefined ? await this.isTestnet() : isTestnet
    let where
    if(/^\d+$/.test(hash)) {
      const blockNumber = new BigNumber(hash)
      where = `(where: { number: { _eq: ${blockNumber.toNumber()} } })`
    } else {
      where = `(where: { hash: { _eq: "${hash}" } })`
    }
    const response = await this.sendNodeRequest({
      query: `{ blocks ${where} {
          fees
          slotLeader { description, hash }
          forgedAt
          number
          opCert
          slotInEpoch
          slotNo
          protocolVersion
          size
          transactionsCount
          transactions { hash }
          nextBlock { hash, number }
          previousBlock { hash, number  }
          vrfKey
        } }`,
    }, testnet)
    const [block] = response.data.data.blocks
    return block;
  }

  public async getTransaction(hash: string, isTestnet?: boolean): Promise<Transaction> {
    const testnet = isTestnet === undefined ? await this.isTestnet() : isTestnet
    const response = await this.sendNodeRequest({
      query: `{ transactions (where: { hash: { _eq: "${hash}" } }) {
          block { hash number }
          blockIndex
          deposit
          fee
          inputs { address sourceTxHash sourceTxIndex }
          inputs_aggregate { aggregate { count } }
          outputs { address index txHash value }
          outputs_aggregate { aggregate { count }}
          invalidBefore
          invalidHereafter
          size
          totalOutput
          includedAt
          withdrawals { address amount transaction { hash }}
          withdrawals_aggregate { aggregate { count } }
        } }`,
    }, testnet)
    const [transaction] = response.data.data.transactions;
    return transaction;
  }

  public async getAccount(address: string): Promise<PaymentAddress> {
    const response = await this.sendNodeRequest({
      query: `{ paymentAddresses (addresses: "${address}") {
          summary {
            utxosCount
            assetBalances {
              asset { assetId assetName name description logo metadataHash url }
              quantity
            }
          }
        } }`,
    })
    const [account] = response.data.data.paymentAddresses;
    return account;
  }

  public async getTransactionsByAccount(
    address: string,
    pageSize: string,
    offset: string,
  ): Promise<Transaction[]> {
    const limit = pageSize && !isNaN(Number(pageSize)) ? Number(pageSize) : 0
    const offsetTransaction = offset && !isNaN(Number(offset)) ? Number(offset) : 0
    const response = await this.sendNodeRequest({
      query: `{ transactions (
          limit: ${limit}
          offset: ${offsetTransaction}
          where: {
            _or: [
              { inputs: { address: { _eq: "${address}" } } }
              { outputs: { address: { _eq: "${address}" } } }
            ]
          }) {
            block { hash number }
            blockIndex
            deposit
            fee
            inputs { address sourceTxHash sourceTxIndex }
            inputs_aggregate { aggregate { count } }
            outputs { address index txHash value }
            outputs_aggregate { aggregate { count }}
            invalidBefore
            invalidHereafter
            size
            totalOutput
            includedAt
            withdrawals { address amount transaction { hash }}
            withdrawals_aggregate { aggregate { count } }
          }
        }`,
    })
    const { transactions } = response.data.data;
    return transactions;
  }


  public async broadcast({txData, signatureId}: TxData): Promise<TransactionResponse> {
    const response = await this.sendNodeRequest({
      query: `mutation {
        submitTransaction(transaction: "${txData}") {
          hash
        }
      }`,
    })
    const txId = response.data.data.submitTransaction.hash
    if (signatureId) {
      try {
        await this.completeKMSTransaction(txId, signatureId)
      } catch (e) {
        this.logger.error(e);
        return { txId, failed: true };
      }
    }

    return { txId };
  }

  public async getUtxosByAddress(
    address: string,
  ): Promise<AdaUtxo[]> {
    const response = await this.sendNodeRequest({
      query: `{ utxos (where: {
        address: {
          _eq: "${address}"
        }
      }) {
        txHash
        index
        value
      }
    }`,
    })
    return response.data.data.utxos;
  }

  public async sendTransaction(
    body: TransferBtcBasedBlockchain,
  ): Promise<TransactionResponse | TransactionKMSResponse> {
    const transactionData = await this.prepareAdaTransaction(body);
    const signatureIds = [];
    if (body.fromUTXO) {
      const signatureId = body.fromUTXO.filter(utxo => utxo.signatureId).map(utxo => utxo.signatureId)
      if (signatureId.length > 0) {
        signatureIds.push(signatureId);
      }
    }
    if (body.fromAddress) {
      const signatureId = body.fromAddress.filter(address => address.signatureId).map(address => address.signatureId)
      if (signatureId.length > 0) {
        signatureIds.push(signatureId);
      }
    }
    return await this.broadcastOrStoreKMSTransaction({
      transactionData,
      signatureIds: signatureIds.length > 0 ? signatureIds : undefined,
    });
  }

  public async getTransactionsFromBlockTillNow(blockNumber: number, isTestnet?: boolean, limit?: number, offset?: number): Promise<Transaction[]> {
    try {
      const query = new BigNumber(limit).isPositive() && new BigNumber(offset).isPositive() ? `{transactions(limit: ${limit}, offset: ${offset}, where:{block:{number:{_gte:${blockNumber}}}})${TX_FIELDS}}` : `{transactions(where:{block:{number:{_gte:${blockNumber}}}})${TX_FIELDS}}`

      const response = await this.sendNodeRequest({query}, isTestnet)
      const { data } = response.data;
      return (data?.transactions || []);
    } catch (e) {
      this.logger.error(e.response);
      throw new AdaError('Unable to find transaction.', 'tx.not.found');
    }
  }

  private async prepareAdaTransaction(transferBtcBasedBlockchain: TransferBtcBasedBlockchain) {
    const txBuilder = await this.initTransactionBuilder()
    const { to } = transferBtcBasedBlockchain
    const { privateKeysToSign, amount: fromAmount } = await this.addInputs(txBuilder, transferBtcBasedBlockchain)
    const toAmount = this.addOutputs(txBuilder, to)
    await this.processFeeAndRest(txBuilder, fromAmount, toAmount, transferBtcBasedBlockchain)
    return this.signTransaction(txBuilder, transferBtcBasedBlockchain, privateKeysToSign)
  }

  public async initTransactionBuilder() {
    const txBuilder = TransactionBuilder.new(
      LinearFee.new(
        BigNum.from_str('44'),
        BigNum.from_str('155381'),
      ),
      BigNum.from_str('1000000'),
      BigNum.from_str('500000000'),
      BigNum.from_str('2000000'),
    );
    const { tip: { slotNo } } = await this.getBlockChainInfo();
    txBuilder.set_ttl(slotNo + 200);
    return txBuilder
  }

  public async processFeeAndRest(transactionBuilder: TransactionBuilder, fromAmount: BigNumber, toAmount: BigNumber,
                                  transferBtcBasedBlockchain: TransferBtcBasedBlockchain) {
    const { fromAddress, fromUTXO } = transferBtcBasedBlockchain
    if (fromAddress) {
      this.addFeeAndRest(transactionBuilder, fromAddress[0].address, fromAmount, toAmount)
    } else if (fromUTXO) {
      const txHash = fromUTXO[0].txHash
      const transaction = await this.getTransaction(txHash)
      const output = transaction.outputs.find(output => output.index === fromUTXO[0].index)
      if (output) {
        this.addFeeAndRest(transactionBuilder, output.address, fromAmount, toAmount)
      }
    } else {
      throw new Error('Field fromAddress or fromUTXO is not filled.')
    }
  }

  public async addInputs(transactionBuilder: TransactionBuilder, transferBtcBasedBlockchain: TransferBtcBasedBlockchain) {
    const { fromUTXO, fromAddress } = transferBtcBasedBlockchain
    if (fromAddress) {
      return this.addAddressInputs(transactionBuilder, fromAddress)
    }
    if (fromUTXO) {
      return this.addUtxoInputs(transactionBuilder, fromUTXO)
    }
    throw new Error('Field fromAddress or fromUTXO is not filled.')
  }

  public async addAddressInputs(transactionBuilder: TransactionBuilder, fromAddresses: FromAddress[]) {
    let amount = new BigNumber(0)
    const privateKeysToSign: string[] = [];
    for (const fromAddress of fromAddresses) {
      const { address, privateKey } = fromAddress
      const utxos: AdaUtxo[] = await this.getUtxosByAddress(address)
      for (const utxo of utxos) {
        amount = amount.plus(utxo.value);
        this.addInput(transactionBuilder, privateKey, utxo, address)
        privateKeysToSign.push(fromAddress.signatureId || fromAddress.privateKey)
      }
    }
    return { amount, privateKeysToSign }
  }

  public async addUtxoInputs(transactionBuilder: TransactionBuilder, fromUTXOs: FromUTXO[]) {
    let amount = new BigNumber(0)
    const privateKeysToSign: string[] = [];
    for (const utxo of fromUTXOs) {
      const transaction = await this.getTransaction(utxo.txHash)
      const output = transaction.outputs.find(output => output.index === utxo.index)
      if (output) {
        const value = output.value;
        amount = amount.plus(value);
        await this.addInput(transactionBuilder, utxo.privateKey, { value, ...utxo }, output.address)
        privateKeysToSign.push(utxo.signatureId || utxo.privateKey)
      }
    }
    return { amount, privateKeysToSign }
  }

  public addInput(transactionBuilder: TransactionBuilder, privateKey: string, utxo: AdaUtxo, address: string) {
    transactionBuilder.add_input(
      Address.from_bech32(address),
      TransactionInput.new(
        TransactionHash.from_bytes(Buffer.from(utxo.txHash, 'hex')),
        utxo.index,
      ),
      Value.new(BigNum.from_str(utxo.value)),
    )
  }

  public addFeeAndRest = (transactionBuilder: TransactionBuilder, address: string, fromAmount: BigNumber, toAmount: BigNumber) => {
    const fromRest = Address.from_bech32(address);
    const tmpOutput = TransactionOutput.new(
      fromRest,
      Value.new(BigNum.from_str(String('1000000'))),
    );
    const fee = parseInt(transactionBuilder.min_fee().to_str()) + parseInt(transactionBuilder.fee_for_output(tmpOutput).to_str());
    this.addOutput(transactionBuilder, address, fromAmount.minus(toAmount).minus(fee).toString())
    transactionBuilder.set_fee(BigNum.from_str(String(fee)));
  }

  public addOutput = (transactionBuilder: TransactionBuilder, address: string, amount: string) => {
    transactionBuilder.add_output(TransactionOutput.new(
      Address.from_bech32(address),
      Value.new(BigNum.from_str(amount)),
    ));
  }

  public signTransaction(transactionBuilder: TransactionBuilder, transferBtcBasedBlockchain: TransferBtcBasedBlockchain, privateKeysToSign: string[]) {
    const txBody = transactionBuilder.build();
    const { fromAddress, fromUTXO } = transferBtcBasedBlockchain

    if ((fromAddress && fromAddress[0].signatureId) || (fromUTXO && fromUTXO[0].signatureId)) {
      return JSON.stringify({ txData: transferBtcBasedBlockchain, privateKeysToSign });
    }

    const witnesses = this.createWitnesses(txBody, transferBtcBasedBlockchain)

    return Buffer.from(
      AdaTransaction.new(txBody, witnesses).to_bytes(),
    ).toString('hex')
  }

  public createWitnesses(transactionBody: TransactionBody, transferBtcBasedBlockchain: TransferBtcBasedBlockchain) {
    const { fromAddress, fromUTXO } = transferBtcBasedBlockchain
    const txHash = hash_transaction(transactionBody);
    const vKeyWitnesses = Vkeywitnesses.new();
    if (fromAddress) {
      for (const address of fromAddress) {
        this.makeWitness(address.privateKey, txHash, vKeyWitnesses)
      }
    } else if (fromUTXO) {
      for (const utxo of fromUTXO) {
        this.makeWitness(utxo.privateKey, txHash, vKeyWitnesses)
      }
    } else {
      throw new Error('No private key for witness found.')
    }
    const witnesses = TransactionWitnessSet.new();
    witnesses.set_vkeys(vKeyWitnesses);
    return witnesses
  }

  public makeWitness(privateKey: string, txHash: TransactionHash, vKeyWitnesses: Vkeywitnesses) {
    const privateKeyCardano = Bip32PrivateKey.from_128_xprv(
      Buffer.from(privateKey, 'hex'),
    ).to_raw_key();
    vKeyWitnesses.add(make_vkey_witness(txHash, privateKeyCardano));
  }

  public addOutputs(transactionBuilder: TransactionBuilder, tos: To[]) {
    let amount = new BigNumber(0)
    for (const to of tos) {
      const value = new BigNumber(1000000).times(to.value)
      amount = value.plus(amount)
      this.addOutput(transactionBuilder, to.address, value.toString())
    }
    return amount
  }

  private async broadcastOrStoreKMSTransaction({ transactionData, signatureIds }: BroadcastOrStoreKMSBtcBasedTransaction) {
    if (signatureIds) {
      return {
        signatureId: await this.storeKMSTransaction(transactionData, Currency.ADA, signatureIds),
      }
    }
    return this.broadcast({ txData: transactionData })
  }

  private async sendNodeRequest(body: any, isTestnet?: boolean) {
    const graphQLUrl = await this.getGraphQLEndpoint(isTestnet)
    const response = await axios.post(graphQLUrl, body)
    if(response?.data?.errors?.length > 0 ) {
      if(response.data.errors[0].message) {
        throw new AdaError(response.data.errors[0].message, 'ada.error')
      } else {
        throw new AdaError('Ada error dont have message.', 'ada.error')
      }
    }
    return response
  }
}

