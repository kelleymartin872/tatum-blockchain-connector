import axios from 'axios';
import {PinoLogger} from 'nestjs-pino';
import BigNumber from 'bignumber.js';
import * as fcl from '@onflow/fcl';
import * as sdk from '@onflow/sdk';
import {Currency as C, mintSolanaNft, SolanaMintNft, transferSolanaNft} from '@tatumio/tatum-solana';

import {
    TransferErc721 as CoreTransferErc721, 
    MintErc721 as CoreMintErc721,
    BurnErc721 as CoreBurnErc721,
    DeployErc721 as CoreDeployErc721,
} from '@tatumio/tatum-core';
import {
    prepareKcsBurnErc721SignedTransaction,
    prepareKcsDeployErc721SignedTransaction,
    prepareKcsMintErc721SignedTransaction, 
    prepareKcsTransferErc721SignedTransaction,
    prepareKcsUpdateCashbackForAuthorErc721SignedTransaction
} from '@tatumio/tatum-kcs';

import {Connection, programs} from '@metaplex/js';
import {NftError} from './NftError';
import {HarmonyAddress} from '@harmony-js/crypto';
import erc721Provenance_abi from '@tatumio/tatum/dist/src/contracts/erc721Provenance/erc721Provenance_abi';
import erc721_abi from '@tatumio/tatum/dist/src/contracts/erc721/erc721_abi';
import Web3 from 'web3';
import {Transaction, TransactionReceipt} from 'web3-eth';
import {FlowTxType,} from '@tatumio/tatum/dist/src/transaction/flow';
import {
    prepareOneBurn721SignedTransaction,
    prepareOneDeploy721SignedTransaction,
    prepareOneMint721SignedTransaction,
    prepareOneMintCashback721SignedTransaction,
    prepareOneMintMultiple721SignedTransaction,
    prepareOneMintMultipleCashback721SignedTransaction,
    prepareOneTransfer721SignedTransaction,
    prepareOneUpdateCashbackForAuthor721SignedTransaction
} from '@tatumio/tatum/dist/src/transaction/one';
import {ChainEgldEsdtTransaction} from './dto/ChainEgldEsdtTransaction';
import {
    AddMinter,
    BurnErc721,
    CeloBurnErc721,
    CeloDeployErc721,
    CeloMintErc721,
    CeloMintMultipleErc721,
    CeloTransferErc721,
    CeloUpdateCashbackErc721,
    convertAddressFromHex,
    Currency,
    DeployErc721,
    EgldEsdtTransaction,
    egldGetTransaction,
    EgldTransaction,
    EthBurnErc721,
    EthDeployErc721,
    EthMintErc721,
    EthMintMultipleErc721,
    EthTransferErc721,
    FlowBurnNft,
    FlowDeployNft,
    FlowMintMultipleNft,
    FlowMintNft,
    FlowTransferNft,
    getAlgoClient,
    getFlowNftMetadata,
    getFlowNftTokenByAddress,
    OneBurn721,
    OneDeploy721,
    OneMint721,
    OneMintMultiple721,
    OneTransfer721,
    OneUpdateCashback721,
    prepareAddNFTMinter,
    prepareAlgoBurnNFTSignedTransaction,
    prepareAlgoCreateNFTSignedTransaction,
    prepareAlgoTransferNFTSignedTransaction,
    prepareBscBurnBep721SignedTransaction,
    prepareBscDeployBep721SignedTransaction,
    prepareBscMintBep721ProvenanceSignedTransaction,
    prepareBscMintBep721SignedTransaction,
    prepareBscMintBepCashback721SignedTransaction,
    prepareBscMintMultipleBep721ProvenanceSignedTransaction,
    prepareBscMintMultipleBep721SignedTransaction,
    prepareBscMintMultipleCashbackBep721SignedTransaction,
    prepareBscTransferBep721SignedTransaction,
    prepareBscUpdateCashbackForAuthorErc721SignedTransaction,
    prepareCeloBurnErc721SignedTransaction,
    prepareCeloDeployErc721SignedTransaction,
    prepareCeloMintCashbackErc721SignedTransaction,
    prepareCeloMintErc721ProvenanceSignedTransaction,
    prepareCeloMintErc721SignedTransaction,
    prepareCeloMintMultipleCashbackErc721SignedTransaction,
    prepareCeloMintMultipleErc721ProvenanceSignedTransaction,
    prepareCeloMintMultipleErc721SignedTransaction,
    prepareCeloTransferErc721SignedTransaction,
    prepareCeloUpdateCashbackForAuthorErc721SignedTransaction,
    prepareEgldAddOrBurnNftQuantitySignedTransaction,
    prepareEgldCreateNftOrSftSignedTransaction,
    prepareEgldDeployNftOrSftSignedTransaction,
    prepareEgldTransferNftSignedTransaction,
    prepareEthBurnErc721SignedTransaction,
    prepareEthDeployErc721SignedTransaction,
    prepareEthMintCashbackErc721SignedTransaction,
    prepareEthMintErc721ProvenanceSignedTransaction,
    prepareEthMintErc721SignedTransaction,
    prepareEthMintMultipleCashbackErc721SignedTransaction,
    prepareEthMintMultipleErc721ProvenanceSignedTransaction,
    prepareEthMintMultipleErc721SignedTransaction,
    prepareEthTransferErc721SignedTransaction,
    prepareEthUpdateCashbackForAuthorErc721SignedTransaction,
    prepareOneMint721ProvenanceSignedTransaction,
    prepareOneMintMultiple721ProvenanceSignedTransaction,
    preparePolygonBurnErc721SignedTransaction,
    preparePolygonDeployErc721SignedTransaction,
    preparePolygonMintCashbackErc721SignedTransaction,
    preparePolygonMintErc721ProvenanceSignedTransaction,
    preparePolygonMintErc721SignedTransaction,
    preparePolygonMintMultipleCashbackErc721SignedTransaction,
    preparePolygonMintMultipleErc721ProvenanceSignedTransaction,
    preparePolygonMintMultipleErc721SignedTransaction,
    preparePolygonTransferErc721SignedTransaction,
    preparePolygonUpdateCashbackForAuthorErc721SignedTransaction,
    prepareTronBurnTrc721SignedTransaction,
    prepareTronDeployTrc721SignedTransaction,
    prepareTronMintCashbackTrc721SignedTransaction,
    prepareTronMintMultipleTrc721SignedTransaction,
    prepareTronMintTrc721SignedTransaction,
    prepareTronTransferTrc721SignedTransaction,
    prepareTronUpdateCashbackForAuthorTrc721SignedTransaction,
    sendBscSmartContractReadMethodInvocationTransaction,
    sendCeloSmartContractReadMethodInvocationTransaction,
    sendFlowNftBurnToken,
    sendFlowNftMintMultipleToken,
    sendFlowNftMintToken,
    sendFlowNftTransferToken,
    sendOneSmartContractReadMethodInvocationTransaction,
    sendPolygonSmartContractReadMethodInvocationTransaction,
    sendSmartContractReadMethodInvocationTransaction,
    SmartContractReadMethodInvocation,
    TransactionHash,
    TransferErc721,
    TronBurnTrc721,
    TronDeployTrc721,
    TronMintMultipleTrc721,
    TronMintTrc721,
    TronTransferTrc721,
    TronUpdateCashbackTrc721,
    UpdateCashbackErc721
} from '@tatumio/tatum';

export abstract class NftService {

    protected constructor(protected readonly logger: PinoLogger) {
    }

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract isTestnet(): Promise<boolean>;

    protected abstract wrapFlowCall(operation: (proposer: any, payer: any) => Promise<any>): Promise<any>;

    protected abstract getTronClient(testnet: boolean): Promise<any>;

    protected abstract getNodesUrl(chain: Currency | C, testnet: boolean): Promise<string[]>;

    protected abstract broadcast(chain: Currency | C, txData: string, signatureId?: string);

    protected abstract deployFlowNft(testnet: boolean, body: FlowDeployNft): Promise<TransactionHash>;

    protected abstract getMintBuiltInData(body: CeloMintErc721 | EthMintErc721 | TronMintTrc721 | OneMint721): Promise<CeloMintErc721 | EthMintErc721 | TronMintTrc721 | OneMint721 | CoreMintErc721 | undefined>;

    public async getMetadataErc721(chain: Currency, token: string, contractAddress: string, account?: string, nonce?: string): Promise<{ data?: string, onchainData?: any }> {
        if (chain === Currency.FLOW) {
            if (!account) {
                throw new NftError(`Account address must be present.`, 'nft.erc721.failed');
            }
            try {
                return {data: await getFlowNftMetadata(await this.isTestnet(), account, token, contractAddress)};
            } catch (e) {
                this.logger.error(e);
                throw new NftError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
            }
        } else if (chain === Currency.TRON) {
            const client = await this.getClient(chain, await this.isTestnet());
            client.setAddress(contractAddress);
            const c = await client.contract().at(contractAddress);
            try {
                return {data: await c.tokenURI(token).call()};
            } catch (e) {
                this.logger.error(e);
                throw new NftError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
            }
        } else if (chain === Currency.EGLD) {
            return await this.getElrondNftDataForAddress(chain, token, contractAddress, nonce, await this.isTestnet())
        } else if (chain === C.SOL.toString()) {
            const connection = new Connection((await this.getNodesUrl(C.SOL, await this.isTestnet()))[0]);
            const metadata = await programs.metadata.Metadata.findMany(connection, {mint: contractAddress});
            if (metadata?.length > 0) {
                return {onchainData: metadata[0].data}
            }
            throw new NftError(`Unable to obtain information for token.`, 'nft.erc721.failed');
        }
        // @ts-ignore
        const c = new (await this.getClient(chain, await this.isTestnet())).eth.Contract(erc721_abi, chain === Currency.ONE ? new HarmonyAddress(contractAddress).basicHex : contractAddress);
        try {
            return {data: await c.methods.tokenURI(token).call()};
        } catch (e) {
            this.logger.error(e);
            throw new NftError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
        }
    }

    public async getRoyaltyErc721(chain: Currency, token: string, contractAddress: string, nonce?: string) {
        if (chain === Currency.FLOW) {
            throw new NftError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        } else if (chain === Currency.TRON) {
            const client = await this.getClient(chain, await this.isTestnet());
            client.setAddress(contractAddress);
            const c = await client.contract().at(contractAddress);
            try {
                const [addresses, values] = await Promise.all([c.tokenCashbackRecipients(token).call(), c.tokenCashbackValues(token).call()]);
                return {
                    addresses: addresses.map(a => convertAddressFromHex(a)),
                    values: values.map(c => new BigNumber(c._hex).dividedBy(1e6).toString(10))
                };
            } catch (e) {
                this.logger.error(e);
                throw new NftError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
            }
        } else if (chain === Currency.EGLD) {
            const data = await this.getElrondNftDataForAddress(chain, token, contractAddress, nonce, await this.isTestnet())
            return {addresses: [token], values: [data?.royalties]}
        } else if (chain === C.SOL.toString()) {
            const connection = new Connection((await this.getNodesUrl(C.SOL, await this.isTestnet()))[0]);
            const metadata = await programs.metadata.Metadata.findMany(connection, {mint: contractAddress});
            if (metadata?.length > 0) {
                const creators = metadata[0].data.data.creators || [];
                return {addresses: creators.map(c => c.address), values: creators.map(c => c.share.toString())};
            }
            throw new NftError(`Unable to obtain information for token.`, 'nft.erc721.failed');
        }
        // @ts-ignore
        const c = new (await this.getClient(chain, await this.isTestnet())).eth.Contract(erc721_abi, chain === Currency.ONE ? new HarmonyAddress(contractAddress).basicHex : contractAddress);
        try {
            const [addresses, values] = await Promise.all([c.methods.tokenCashbackRecipients(token).call(), c.methods.tokenCashbackValues(token).call()]);
            return {addresses, values: values.map(c => new BigNumber(c).dividedBy(1e18).toString(10))};
        } catch (e) {
            this.logger.error(e);
            throw new NftError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
        }
    }

    public async getProvenanceData(chain: Currency, contractAddress: string, tokenId: string) {
        try {
            const testnet = await this.isTestnet();
            const provider = (await this.getNodesUrl(chain, testnet))[0];
            const body = new SmartContractReadMethodInvocation()
            const result = [];
            let txData;
            body.contractAddress = contractAddress
            body.params = [tokenId]
            body.methodName = 'getTokenData'
            body.methodABI = erc721Provenance_abi.find((a: any) => a.name === 'getTokenData')
            switch (chain) {
                case Currency.ETH:
                    txData = await sendSmartContractReadMethodInvocationTransaction(body);
                    break;
                case Currency.CELO:
                    txData = await sendCeloSmartContractReadMethodInvocationTransaction(testnet, body, provider);
                    break;
                case Currency.BSC:
                    txData = await sendBscSmartContractReadMethodInvocationTransaction(body);
                    break;
                case Currency.ONE:
                    txData = await sendOneSmartContractReadMethodInvocationTransaction(testnet, body, provider);
                    break;
                case Currency.MATIC:
                    txData = await sendPolygonSmartContractReadMethodInvocationTransaction(testnet, body, provider);
                    break;
                default:
                    throw new NftError(`Unsupported chain ${chain}.`, 'unsupported.chain');
            }
            for (let i = 0; i < txData.data.length; i++) {
                const t = txData.data[i].split("'''###'''", 2)
                result.push({provenanceData: t[0], tokenPrice: t[1]})
            }
            return result
        } catch (e) {
            this.logger.error(e);
            throw new NftError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
        }
    }

    public async getTokensOfOwner(chain: Currency, address: string, contractAddress: string, nonce?: string | undefined) {
        if (chain === Currency.FLOW) {
            try {
                return (await getFlowNftTokenByAddress(await this.isTestnet(), address, contractAddress)).map(e => `${e}`);
            } catch (e) {
                this.logger.error(e);
                throw new NftError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
            }
        } else if (chain === Currency.TRON) {
            const client = await this.getClient(chain, await this.isTestnet());
            client.setAddress(contractAddress);
            const c = await client.contract().at(contractAddress);
            try {
                return {data: (await c.tokensOfOwner(address).call()).map(c => new BigNumber(c._hex).toString(10))};
            } catch (e) {
                this.logger.error(e);
                throw new NftError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
            }
        } else if (chain === Currency.EGLD) {
            return {data: [(await this.getElrondNftDataForAddress(chain, address, contractAddress, nonce, await this.isTestnet()))?.creator]}
        }
        // @ts-ignore
        const c = new (await this.getClient(chain, await this.isTestnet())).eth.Contract(erc721_abi, chain === Currency.ONE ? new HarmonyAddress(contractAddress).basicHex : contractAddress);
        try {
            return {data: await c.methods.tokensOfOwner(address).call()};
        } catch (e) {
            this.logger.error(e);
            throw new NftError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
        }
    }

    public async getContractAddress(chain: Currency, txId: string) {
        if (chain === Currency.FLOW) {
            try {
                await this.getClient(chain, await this.isTestnet());
                const tx = await sdk.send(sdk.build([sdk.getTransaction(txId)]));
                const {args} = await sdk.decode(tx);
                if (args && args.length) {
                    return {contractAddress: args[0].value};
                }
            } catch (e) {
                this.logger.error(e);
            }
            throw new NftError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        } else if (chain === Currency.TRON) {
            try {
                const tx = await (await this.getClient(chain, await this.isTestnet())).trx.getTransactionInfo(txId);
                return {contractAddress: convertAddressFromHex(tx.contract_address)};
            } catch (e) {
                this.logger.error(e);
                throw new NftError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
            }
        } else if (chain === Currency.EGLD) {
            throw new NftError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        try {
            const web3 = await this.getClient(chain, await this.isTestnet());
            const {contractAddress} = await web3.eth.getTransactionReceipt(txId);
            return {contractAddress};
        } catch (e) {
            this.logger.error(e);
            throw new NftError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        }
    }

    public async getTransaction(chain: Currency, txId: string): Promise<Transaction & TransactionReceipt | EgldTransaction> {
        if (chain === Currency.FLOW) {
            try {
                await this.getClient(chain, await this.isTestnet());
                const tx = await sdk.send(sdk.build([sdk.getTransaction(txId)]));
                const decoded = await sdk.decode(tx);

                try {
                    const txStatus = await sdk.send(sdk.build([sdk.getTransactionStatus(txId)]));
                    return {...decoded, ...await sdk.decode(txStatus)};
                } catch (e) {
                    this.logger.warn(e);
                }
                return decoded;
            } catch (e) {
                this.logger.error(e);
            }
            throw new NftError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        } else if (chain === Currency.TRON) {
            try {
                return await (await this.getClient(chain, await this.isTestnet())).trx.getTransactionInfo(txId);
            } catch (e) {
                this.logger.error(e);
                throw new NftError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
            }
        } else if (chain === Currency.EGLD) {
            try {
                return await egldGetTransaction(txId);
            } catch (e) {
                this.logger.error(e);
                throw new NftError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
            }
        }
        try {
            const web3 = await this.getClient(chain, await this.isTestnet());
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
            throw new NftError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        }
    }

    public async transferErc721(
        body: CeloTransferErc721 | EthTransferErc721 | FlowTransferNft | TronTransferTrc721 | OneTransfer721 | ChainEgldEsdtTransaction | TransferErc721 | CoreTransferErc721
    ): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        const provider = (await this.getNodesUrl(chain, testnet))[0];
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthTransferErc721SignedTransaction(body as EthTransferErc721, provider);
                break;
            case Currency.ONE:
                txData = await prepareOneTransfer721SignedTransaction(testnet, body as OneTransfer721, provider);
                break;
            case Currency.MATIC:
                txData = await preparePolygonTransferErc721SignedTransaction(testnet, body as EthTransferErc721, provider);
                break;
            case Currency.KCS:
                txData = await prepareKcsTransferErc721SignedTransaction(body as CoreTransferErc721, provider);
                break;
            case C.SOL.toString():
                txData = await transferSolanaNft(body as TransferErc721, provider);
                if (body.signatureId) {
                    txData = JSON.stringify(txData);
                }
                break;
            case Currency.TRON:
                await this.getClient(chain, await this.isTestnet());
                txData = await prepareTronTransferTrc721SignedTransaction(testnet, body as TronTransferTrc721);
                break;
            case Currency.BSC:
                txData = await prepareBscTransferBep721SignedTransaction(body as EthTransferErc721, provider);
                break;
            case Currency.CELO:
                txData = await prepareCeloTransferErc721SignedTransaction(testnet, body as CeloTransferErc721, provider);
                break;
            case Currency.EGLD:
                txData = await prepareEgldTransferNftSignedTransaction(body as EgldEsdtTransaction, provider);
                break;
            case Currency.FLOW:
                if (body.signatureId) {
                    txData = JSON.stringify({type: FlowTxType.TRANSFER_NFT, body});
                } else {
                    return this.wrapFlowCall(async (proposer, payer) =>
                        await sendFlowNftTransferToken(testnet, body as FlowTransferNft, proposer, payer));
                }
                break;
            case Currency.ALGO:
                txData = await prepareAlgoTransferNFTSignedTransaction(testnet, body as TransferErc721, provider);
                break;
            // case Currency.XDC:
            //     txData = await prepareXdcTransferErc721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
            //     break;
            default:
                throw new NftError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async mintErc721(
        body: CeloMintErc721 | EthMintErc721 | FlowMintNft | TronMintTrc721 | OneMint721 | ChainEgldEsdtTransaction | SolanaMintNft | CoreMintErc721
    ): Promise<TransactionHash | { signatureId: string } | { txId: string, tokenId: number }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        const provider = (await this.getNodesUrl(chain, testnet))[0];
        switch (chain) {
            case Currency.ETH: {
                const builtInBody = await this.getMintBuiltInData(body as EthMintErc721)
                if ((body as EthMintErc721).provenance) {
                    txData = await prepareEthMintErc721ProvenanceSignedTransaction((builtInBody || body) as EthMintErc721, provider);
                } else {
                    if (!(body as EthMintErc721).authorAddresses) {
                        txData = await prepareEthMintErc721SignedTransaction((builtInBody || body) as EthMintErc721, provider);
                    } else {
                        txData = await prepareEthMintCashbackErc721SignedTransaction((builtInBody || body) as EthMintErc721, provider);
                    }
                }
                break;

            }
            case Currency.MATIC: {
                const builtInBody = await this.getMintBuiltInData(body as EthMintErc721)
                if ((body as EthMintErc721).provenance) {
                    txData = await preparePolygonMintErc721ProvenanceSignedTransaction(testnet, (builtInBody || body) as EthMintErc721, provider);
                } else {
                    if (!(body as EthMintErc721).authorAddresses) {
                        txData = await preparePolygonMintErc721SignedTransaction(testnet, (builtInBody || body) as EthMintErc721, provider);
                    } else {
                        txData = await preparePolygonMintCashbackErc721SignedTransaction(testnet, (builtInBody || body) as EthMintErc721, provider);
                    }
                }
                break;
            }
            case Currency.KCS: {
                const builtInBody = await this.getMintBuiltInData(body as CoreMintErc721)
                if ((body as CoreMintErc721).provenance) {
                } else {
                    if (!(body as CoreMintErc721).authorAddresses) {
                        txData = await prepareKcsMintErc721SignedTransaction((builtInBody || body) as CoreMintErc721, provider);
                    } else {
                    }
                }
                break;
            }
            case Currency.ONE: {
                const builtInBody = await this.getMintBuiltInData(body as OneMint721)
                if ((body as OneMint721).provenance) {
                    txData = await prepareOneMint721ProvenanceSignedTransaction(testnet, (builtInBody || body) as OneMint721, provider);
                } else {
                    if (!(body as OneMint721).authorAddresses) {
                        txData = await prepareOneMint721SignedTransaction(testnet, (builtInBody || body) as OneMint721, provider);
                    } else {
                        txData = await prepareOneMintCashback721SignedTransaction(testnet, (builtInBody || body) as OneMint721, provider);
                    }
                }
                break;
            }
            case Currency.BSC: {
                const builtInBody = await this.getMintBuiltInData(body as EthMintErc721)
                if ((body as EthMintErc721).provenance) {
                    txData = await prepareBscMintBep721ProvenanceSignedTransaction((builtInBody || body) as EthMintErc721, provider);
                } else {
                    if (!(body as EthMintErc721).authorAddresses) {
                        txData = await prepareBscMintBep721SignedTransaction((builtInBody || body) as EthMintErc721, provider);
                    } else {
                        txData = await prepareBscMintBepCashback721SignedTransaction((builtInBody || body) as EthMintErc721, provider);
                    }
                }
                break;
            }
            case Currency.TRON:
                await this.getClient(Currency.TRON, await this.isTestnet());
                if (!(body as TronMintTrc721).authorAddresses) {
                    txData = await prepareTronMintTrc721SignedTransaction(testnet, body as TronMintTrc721);
                } else {
                    txData = await prepareTronMintCashbackTrc721SignedTransaction(testnet, body as TronMintTrc721);
                }
                break;
            case Currency.CELO: {
                const builtInBody = await this.getMintBuiltInData(body as CeloMintErc721)
                if ((body as CeloMintErc721).provenance) {
                    txData = await prepareCeloMintErc721ProvenanceSignedTransaction(testnet, (builtInBody || body) as CeloMintErc721, provider);
                } else {
                    if (!(body as CeloMintErc721).authorAddresses) {
                        txData = await prepareCeloMintErc721SignedTransaction(testnet, (builtInBody || body) as CeloMintErc721, provider);
                    } else {
                        txData = await prepareCeloMintCashbackErc721SignedTransaction(testnet, (builtInBody || body) as CeloMintErc721, provider);
                    }
                }
                break;
            }
            case Currency.EGLD:
                txData = await prepareEgldCreateNftOrSftSignedTransaction(body as EgldEsdtTransaction, provider)
                break;
            case C.SOL:
                txData = await mintSolanaNft(body as SolanaMintNft, provider);
                if (body.signatureId) {
                    txData = JSON.stringify(txData);
                }
                break;
            case Currency.FLOW:
                if (body.signatureId) {
                    txData = JSON.stringify({type: FlowTxType.MINT_NFT, body});
                } else {
                    return this.wrapFlowCall(async (proposer, payer) => await sendFlowNftMintToken(testnet, body as FlowMintNft, proposer, payer));
                }
                break;
            // case Currency.XDC:
            //     if (!(body as EthMintErc721).authorAddresses) {
            //         txData = await prepareXdcMintErc721SignedTransaction(body as EthMintErc721, provider);
            //     } else {
            //         txData = await prepareXdcMintErcCashback721SignedTransaction(body as EthMintErc721, provider);
            //     }
            //     break;
            default:
                throw new NftError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }


    public async addMinter(body: AddMinter): Promise<TransactionHash | { signatureId: string } | { txId: string, tokenId: number }> {
        const testnet = await this.isTestnet();
        const {chain} = body;
        const provider = (await this.getNodesUrl(chain, testnet))[0];
        const txData = await prepareAddNFTMinter(testnet, body, provider);
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async mintMultipleErc721(
        body: CeloMintMultipleErc721 | EthMintMultipleErc721 | FlowMintMultipleNft | TronMintMultipleTrc721 | OneMintMultiple721
    ): Promise<TransactionHash | { signatureId: string } | { txId: string, tokenId: number[] }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        const provider = (await this.getNodesUrl(chain, testnet))[0];
        switch (chain) {
            case Currency.ETH:
                if ((body as EthMintMultipleErc721).provenance) {
                    txData = await prepareEthMintMultipleErc721ProvenanceSignedTransaction(body as EthMintMultipleErc721, provider);
                } else {
                    if (!(body as EthMintMultipleErc721).authorAddresses) {
                        txData = await prepareEthMintMultipleErc721SignedTransaction(body as EthMintMultipleErc721, provider);
                    } else {
                        txData = await prepareEthMintMultipleCashbackErc721SignedTransaction(body as EthMintMultipleErc721, provider);
                    }
                }
                break;
            case Currency.MATIC:
                if ((body as EthMintMultipleErc721).provenance) {
                    txData = await preparePolygonMintMultipleErc721ProvenanceSignedTransaction(testnet, body as EthMintMultipleErc721, provider);
                } else {
                    if (!(body as EthMintMultipleErc721).authorAddresses) {
                        txData = await preparePolygonMintMultipleErc721SignedTransaction(testnet, body as EthMintMultipleErc721, provider);
                    } else {
                        txData = await preparePolygonMintMultipleCashbackErc721SignedTransaction(testnet, body as EthMintMultipleErc721, provider);
                    }
                }
                break;
            case Currency.ONE:
                if ((body as OneMintMultiple721).provenance) {
                    txData = await prepareOneMintMultiple721ProvenanceSignedTransaction(testnet, body as OneMintMultiple721, provider);
                } else {
                    if (!(body as OneMintMultiple721).authorAddresses) {
                        txData = await prepareOneMintMultiple721SignedTransaction(testnet, body as OneMintMultiple721, provider);
                    } else {
                        txData = await prepareOneMintMultipleCashback721SignedTransaction(testnet, body as OneMintMultiple721, provider);
                    }
                }
                break;
            case Currency.TRON:
                await this.getClient(chain, await this.isTestnet());
                if (!(body as TronMintMultipleTrc721).authorAddresses) {
                    txData = await prepareTronMintMultipleTrc721SignedTransaction(testnet, body as TronMintMultipleTrc721);
                } else {
                    throw new NftError(`Unsupported chain ${chain}.`, 'unsupported.chain');
                }
                break;
            case Currency.BSC:
                if ((body as EthMintMultipleErc721).provenance) {
                    txData = await prepareBscMintMultipleBep721ProvenanceSignedTransaction(body as EthMintMultipleErc721, provider);
                } else {
                    if (!(body as EthMintMultipleErc721).authorAddresses) {
                        txData = await prepareBscMintMultipleBep721SignedTransaction(body as EthMintMultipleErc721, provider);
                    } else {
                        txData = await prepareBscMintMultipleCashbackBep721SignedTransaction(body as EthMintMultipleErc721, provider);
                    }
                }
                break;
            case Currency.CELO:
                if ((body as CeloMintMultipleErc721).provenance) {
                    txData = await prepareCeloMintMultipleErc721ProvenanceSignedTransaction(testnet, body as CeloMintMultipleErc721, provider);
                } else {
                    if (!(body as CeloMintMultipleErc721).authorAddresses) {
                        txData = await prepareCeloMintMultipleErc721SignedTransaction(testnet, body as CeloMintMultipleErc721, provider);
                    } else {
                        txData = await prepareCeloMintMultipleCashbackErc721SignedTransaction(testnet, body as CeloMintMultipleErc721, provider);
                    }
                }
                break;
            case Currency.EGLD:
                // txData = await prepareEgldCreateNftOrSftSignedTransaction(body as EgldEsdtTransaction, provider)
                throw new NftError(`Unsupported chain ${chain}.`, 'unsupported.chain');
            case Currency.FLOW:
                if (body.signatureId) {
                    txData = JSON.stringify({type: FlowTxType.MINT_MULTIPLE_NFT, body});
                } else {
                    return this.wrapFlowCall(async (proposer, payer) => await sendFlowNftMintMultipleToken(testnet, body as FlowMintMultipleNft, proposer, payer));
                }
                break;
            // case Currency.XDC:
            //     if (!(body as EthMintMultipleErc721).authorAddresses) {
            //         txData = await prepareXdcMintMultipleErc721SignedTransaction(body as EthMintMultipleErc721, provider);
            //     } else {
            //         txData = await prepareXdcMintMultipleCashbackErc721SignedTransaction(body as EthMintMultipleErc721, provider);
            //     }
            //     break;
            default:
                throw new NftError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async updateCashbackForAuthor(body: CeloUpdateCashbackErc721 | UpdateCashbackErc721 | TronUpdateCashbackTrc721 | OneUpdateCashback721): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthUpdateCashbackForAuthorErc721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.MATIC:
                txData = await preparePolygonUpdateCashbackForAuthorErc721SignedTransaction(testnet, body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.KCS:
                txData = await prepareKcsUpdateCashbackForAuthorErc721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.ONE:
                txData = await prepareOneUpdateCashbackForAuthor721SignedTransaction(testnet, body as OneUpdateCashback721, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.TRON:
                await this.getClient(chain, await this.isTestnet());
                txData = await prepareTronUpdateCashbackForAuthorTrc721SignedTransaction(testnet, body as TronUpdateCashbackTrc721);
                break;
            case Currency.BSC:
                txData = await prepareBscUpdateCashbackForAuthorErc721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloUpdateCashbackForAuthorErc721SignedTransaction(testnet, body as CeloUpdateCashbackErc721, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.EGLD:
                throw new NftError(`Unsupported chain ${chain}.`, 'unsupported.chain');
            // case Currency.XDC:
            //     txData = await prepareXdcUpdateCashbackForAuthorErc721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
            //     break;
            default:
                throw new NftError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async burnErc721(
        body: CeloBurnErc721 | EthBurnErc721 | FlowBurnNft | TronBurnTrc721 | OneBurn721 | ChainEgldEsdtTransaction | BurnErc721 | CoreBurnErc721
    ): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        const provider = (await this.getNodesUrl(chain, testnet))[0];
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthBurnErc721SignedTransaction(body as EthBurnErc721, provider);
                break;
            case Currency.MATIC:
                txData = await preparePolygonBurnErc721SignedTransaction(testnet, body as EthBurnErc721, provider);
                break;
            case Currency.KCS:
                txData = await prepareKcsBurnErc721SignedTransaction(body as CoreBurnErc721, provider);
                break;
            case Currency.ONE:
                txData = await prepareOneBurn721SignedTransaction(testnet, body as OneBurn721, provider);
                break;
            case Currency.TRON:
                await this.getClient(chain, await this.isTestnet());
                txData = await prepareTronBurnTrc721SignedTransaction(testnet, body as TronBurnTrc721);
                break;
            case Currency.BSC:
                txData = await prepareBscBurnBep721SignedTransaction(body as EthBurnErc721, provider);
                break;
            case Currency.CELO:
                txData = await prepareCeloBurnErc721SignedTransaction(testnet, body as CeloBurnErc721, provider);
                break;
            case Currency.EGLD:
                txData = await prepareEgldAddOrBurnNftQuantitySignedTransaction(body as EgldEsdtTransaction, provider)
                break;
            case Currency.FLOW:
                if (body.signatureId) {
                    txData = JSON.stringify({type: FlowTxType.BURN_NFT, body});
                } else {
                    return this.wrapFlowCall(async (proposer, payer) => await sendFlowNftBurnToken(testnet, body as FlowBurnNft, proposer, payer));
                }
                break;
            case Currency.ALGO:
                txData = await prepareAlgoBurnNFTSignedTransaction(testnet, body as BurnErc721, provider);
                break;
            // case Currency.XDC:
            //     txData = await prepareXdcBurnErc721SignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
            //     break;
            default:
                throw new NftError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async deployErc721(
        body: CeloDeployErc721 | EthDeployErc721 | FlowDeployNft | TronDeployTrc721 | OneDeploy721 | ChainEgldEsdtTransaction | DeployErc721 | CoreDeployErc721
    ): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        const provider = (await this.getNodesUrl(chain, testnet))[0];
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthDeployErc721SignedTransaction(body as EthDeployErc721, provider);
                break;
            case Currency.MATIC:
                txData = await preparePolygonDeployErc721SignedTransaction(testnet, body as EthDeployErc721, provider);
                break;
            case Currency.KCS:
                txData = await prepareKcsDeployErc721SignedTransaction(body as CoreDeployErc721, provider);
                break;
            case Currency.ONE:
                txData = await prepareOneDeploy721SignedTransaction(testnet, body as OneDeploy721, provider);
                break;
            case Currency.BSC:
                txData = await prepareBscDeployBep721SignedTransaction(body as EthDeployErc721, provider);
                break;
            case Currency.TRON:
                await this.getClient(chain, await this.isTestnet());
                txData = await prepareTronDeployTrc721SignedTransaction(testnet, body as TronDeployTrc721);
                break;
            case Currency.CELO:
                txData = await prepareCeloDeployErc721SignedTransaction(testnet, body as CeloDeployErc721, provider);
                break;
            case Currency.EGLD:
                txData = await prepareEgldDeployNftOrSftSignedTransaction(body as EgldEsdtTransaction, provider)
                break;
            case Currency.FLOW:
                return await this.deployFlowNft(testnet, body as FlowDeployNft);
                break;
            case Currency.ALGO:
                txData = await prepareAlgoCreateNFTSignedTransaction(testnet, body as DeployErc721, provider)
                break;
            // case Currency.XDC:
            //     txData = await prepareXdcDeployErc721SignedTransaction(body as EthDeployErc721, (await this.getNodesUrl(chain, testnet))[0]);
            //     break;
            default:
                throw new NftError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return await this.broadcast(chain, txData);
        }
    }

    private async getElrondNftDataForAddress(
        chain: Currency, address: string, contractAddress: string, nonce: string | undefined, testnet: boolean
    ): Promise<any> {
        const provider = (await this.getNodesUrl(chain, testnet))[0];
        try {
            const {tokenData} = (await axios.get(`${provider}/address/${address}/nft/${contractAddress}/nonce/${nonce}`,
                {headers: {'Content-Type': 'application/json'}})).data.data;
            return {data: tokenData};
        } catch (e) {
            this.logger.error(e);
            throw new NftError('Get NFT data for an address not found.', 'nft.not.found');
        }
    }

    private async getClient(chain: Currency, testnet: boolean): Promise<any> {
        const url = (await this.getNodesUrl(chain, testnet))[0];
        if (chain === Currency.FLOW) {
            fcl.config().put('accessNode.api', url);
            return;
        } else if (chain === Currency.TRON) {
            return this.getTronClient(testnet);
        } else if (chain === Currency.ALGO) {
            return await getAlgoClient(await this.isTestnet(), (await this.getNodesUrl(chain, testnet))[0]);
        }
        return new Web3(url);
    }
}
