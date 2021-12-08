import Web3 from 'web3';
import {PinoLogger} from 'nestjs-pino';
import {Erc20Error} from './Erc20Error';
import {
    ChainBurnCeloErc20,
    ChainBurnErc20,
    ChainBurnKcsErc20,
    ChainDeployCeloErc20,
    ChainDeployErc20,
    ChainDeployKcsErc20,
    ChainEgldEsdtTransaction,
    ChainMintCeloErc20,
    ChainMintErc20,
    ChainMintKcsErc20,
    ChainTransferAlgoErc20,
    ChainTransferBscBep20,
    ChainTransferCeloErc20Token,
    ChainTransferErc20,
    ChainTransferEthErc20,
    ChainTransferHrm20,
    ChainTransferKcsErc20,
    ChainTransferPolygonErc20
} from './Erc20Base';
import {HarmonyAddress} from '@harmony-js/crypto';
import {
    ApproveErc20,
    BurnCeloErc20,
    BurnErc20,
    Currency,
    DeployCeloErc20,
    DeployErc20,
    EgldEsdtTransaction,
    egldGetAccountErc20Balance,
    fromXdcAddress,
    getAlgoClient,
    MintCeloErc20,
    MintErc20,
    OneBurn20,
    OneMint20,
    OneTransfer20,
    prepareAlgoBurnFTSignedTransaction,
    prepareAlgoCreateFTSignedTransaction,
    prepareAlgoTransferFTSignedTransaction,
    prepareAuctionApproveErc20Transfer,
    prepareBurnBep20SignedTransaction,
    prepareCeloBurnErc20SignedTransaction,
    prepareCeloDeployErc20SignedTransaction,
    prepareCeloMintErc20SignedTransaction,
    prepareCeloTransferErc20SignedTransaction,
    prepareCustomBep20SignedTransaction,
    prepareCustomErc20SignedTransaction,
    prepareDeployBep20SignedTransaction,
    prepareDeployErc20SignedTransaction,
    prepareEgldBurnEsdtSignedTransaction,
    prepareEgldDeployEsdtSignedTransaction,
    prepareEgldFreezeOrWipeOrOwvershipEsdtSignedTransaction,
    prepareEgldMintEsdtSignedTransaction,
    prepareEgldTransferEsdtSignedTransaction,
    prepareEthBurnErc20SignedTransaction,
    prepareEthMintErc20SignedTransaction,
    prepareEthOrErc20SignedTransaction,
    prepareMintBep20SignedTransaction,
    prepareOneBurn20SignedTransaction,
    prepareOneDeploy20SignedTransaction,
    prepareOneMint20SignedTransaction,
    prepareOneTransfer20SignedTransaction,
    preparePolygonBurnErc20SignedTransaction,
    preparePolygonDeployErc20SignedTransaction,
    preparePolygonMintErc20SignedTransaction,
    preparePolygonTransferErc20SignedTransaction,
    prepareXdcBurnErc20SignedTransaction,
    prepareXdcCustomErc20SignedTransaction,
    prepareXdcDeployErc20SignedTransaction,
    prepareXdcMintErc20SignedTransaction,
    TransactionHash,
    TransferCeloOrCeloErc20Token,
    TransferErc20
} from '@tatumio/tatum';
import erc20_abi from '@tatumio/tatum/dist/src/contracts/erc20/token_abi';
import {
    BurnErc20 as CoreBurnErc20,
    DeployErc20 as CoreDeployErc20,
    MintErc20 as CoreMintErc20,
    TransferErc20 as CoreTransferErc20
} from '@tatumio/tatum-core'
import {
    prepareKcsBurnErc20SignedTransaction,
    prepareKcsDeployErc20SignedTransaction,
    prepareKcsMintErc20SignedTransaction,
    prepareKcsTransferErc20SignedTransaction
} from '@tatumio/tatum-kcs'

export abstract class Erc20Service {

    protected constructor(protected readonly logger: PinoLogger) {
    }

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract isTestnet(): Promise<boolean>;

    protected abstract getNodesUrl(chain: Currency, testnet: boolean): Promise<string[]>;

    protected abstract broadcast(chain: Currency, txData: string, signatureId?: string): Promise<TransactionHash>;

    private async getFirstNodeUrl(chain: Currency, testnet: boolean): Promise<string> {
        const nodes = await this.getNodesUrl(chain, testnet);
        if (nodes.length === 0) {
            new Erc20Error('Nodes url array must have at least one element.', 'erc20.nodes.url');
        }
        return nodes[0];
    }

    private async getClient(chain: Currency, testnet: boolean) {
        if ([Currency.ETH, Currency.BSC, Currency.CELO, Currency.XDC, Currency.ONE, Currency.MATIC, Currency.KCS].includes(chain)) {
            return new Web3((await this.getFirstNodeUrl(chain, testnet)));
        } else if (chain === Currency.ALGO) {
            return await getAlgoClient(await this.isTestnet(), await this.getFirstNodeUrl(chain, testnet));
        }

        throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsupported.chain');
    }

    public async getErc20Balance(chain: Currency, address: string, contractAddress: string): Promise<{ balance: string }> {
        let contractOrAddress;
        switch (chain) {
            case Currency.ETH:
            case Currency.BSC:
            case Currency.CELO:
            case Currency.MATIC:
            case Currency.KCS:
                contractOrAddress = contractAddress;
                break;
            case Currency.ONE:
                contractOrAddress = new HarmonyAddress(contractAddress).basicHex;
                break;
            case Currency.EGLD:
                return { balance: `${await egldGetAccountErc20Balance(address, contractAddress)}` };
            case Currency.XDC:
                contractOrAddress = fromXdcAddress(contractAddress);
                break;
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }

        const _address = chain === Currency.XDC ? fromXdcAddress(address) : address;

        const client = await this.getClient(chain, await this.isTestnet());
        // @ts-ignore
        const contract = new client.eth.Contract(erc20_abi, contractOrAddress);
        return {balance: await contract.methods.balanceOf(_address).call()};
    }

    public async transferErc20(body: ChainTransferEthErc20 | ChainTransferBscBep20 | ChainTransferCeloErc20Token |
        ChainTransferErc20 | ChainTransferHrm20 | ChainTransferPolygonErc20 | ChainEgldEsdtTransaction | ChainTransferAlgoErc20 | ChainTransferKcsErc20):
        Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const {chain, ..._body} = body;
        let txData;
        switch (chain) {
            case Currency.ETH:
                if ((_body as TransferErc20).currency) {
                    txData = await prepareEthOrErc20SignedTransaction(_body as TransferErc20, (await this.getFirstNodeUrl(chain, testnet)));
                } else {
                    txData = await prepareCustomErc20SignedTransaction(_body as TransferErc20, (await this.getFirstNodeUrl(chain, testnet)));
                }
                break;
            case Currency.ONE:
                txData = await prepareOneTransfer20SignedTransaction(testnet, _body as OneTransfer20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.MATIC:
                txData = await preparePolygonTransferErc20SignedTransaction(testnet, _body as TransferErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.KCS:
                txData = await prepareKcsTransferErc20SignedTransaction(_body as CoreTransferErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.BSC:
                txData = await prepareCustomBep20SignedTransaction(_body as TransferErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.CELO:
                txData = await prepareCeloTransferErc20SignedTransaction(testnet, _body as TransferCeloOrCeloErc20Token, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.EGLD:
                txData = await prepareEgldTransferEsdtSignedTransaction(_body as EgldEsdtTransaction, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.XDC:
                txData = await prepareXdcCustomErc20SignedTransaction(_body as TransferErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.ALGO:
                txData = await prepareAlgoTransferFTSignedTransaction(testnet, _body as TransferErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async burnErc20(body: ChainBurnErc20 | ChainBurnCeloErc20 | ChainEgldEsdtTransaction | ChainBurnKcsErc20): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const {chain, ..._body} = body;
        let txData;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthBurnErc20SignedTransaction(_body as BurnErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.ONE:
                txData = await prepareOneBurn20SignedTransaction(testnet, _body as OneBurn20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.MATIC:
                txData = await preparePolygonBurnErc20SignedTransaction(testnet, _body as BurnErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.KCS:
                txData = await prepareKcsBurnErc20SignedTransaction(_body as CoreBurnErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.BSC:
                txData = await prepareBurnBep20SignedTransaction(_body as BurnErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.CELO:
                txData = await prepareCeloBurnErc20SignedTransaction(testnet, _body as BurnCeloErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.EGLD:
                txData = await prepareEgldBurnEsdtSignedTransaction(_body as EgldEsdtTransaction, (await this.getFirstNodeUrl(chain, testnet)));
                break;                
            case Currency.XDC:
                txData = await prepareXdcBurnErc20SignedTransaction(_body as BurnErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.ALGO:
                txData = await prepareAlgoBurnFTSignedTransaction(testnet, _body as BurnErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async mintErc20(body: ChainMintErc20 | ChainMintCeloErc20 | ChainEgldEsdtTransaction | ChainMintKcsErc20): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const {chain, ..._body} = body;
        let txData;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthMintErc20SignedTransaction(_body as MintErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.ONE:
                txData = await prepareOneMint20SignedTransaction(testnet, _body as OneMint20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.MATIC:
                txData = await preparePolygonMintErc20SignedTransaction(testnet, _body as MintErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.KCS:
                txData = await prepareKcsMintErc20SignedTransaction(_body as CoreMintErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.BSC:
                txData = await prepareMintBep20SignedTransaction(_body as MintErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.CELO:
                txData = await prepareCeloMintErc20SignedTransaction(testnet, _body as MintCeloErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;                
            case Currency.EGLD:
                txData = await prepareEgldMintEsdtSignedTransaction(_body as EgldEsdtTransaction, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.XDC:
                txData = await prepareXdcMintErc20SignedTransaction(_body as MintErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async deployErc20(body: ChainDeployErc20 | ChainDeployCeloErc20 | ChainEgldEsdtTransaction | ChainDeployKcsErc20): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const {chain, ..._body} = body;
        let txData;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareDeployErc20SignedTransaction(_body as DeployErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.ONE:
                txData = await prepareOneDeploy20SignedTransaction(testnet, _body as DeployErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.MATIC:
                txData = await preparePolygonDeployErc20SignedTransaction(testnet, _body as DeployErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.KCS:
                txData = await prepareKcsDeployErc20SignedTransaction(_body as CoreDeployErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.BSC:
                txData = await prepareDeployBep20SignedTransaction(_body as DeployErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.CELO:
                txData = await prepareCeloDeployErc20SignedTransaction(testnet, _body as DeployCeloErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.EGLD:
                txData = await prepareEgldDeployEsdtSignedTransaction(_body as EgldEsdtTransaction, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.XDC:
                const tx = {
                  ..._body,
                  address: fromXdcAddress((_body as DeployErc20).address),
                };

                txData = await prepareXdcDeployErc20SignedTransaction(tx as DeployErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            case Currency.ALGO:
                txData = await prepareAlgoCreateFTSignedTransaction(testnet, _body as DeployErc20, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            default:
                throw new Erc20Error(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async approveErc20(body: ApproveErc20 | ChainEgldEsdtTransaction): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        const {chain, ..._body} = body;
        let txData;
        switch (chain) {
            case Currency.EGLD:
                txData = await prepareEgldFreezeOrWipeOrOwvershipEsdtSignedTransaction(_body as EgldEsdtTransaction, (await this.getFirstNodeUrl(chain, testnet)));
                break;
            default:
                txData = await prepareAuctionApproveErc20Transfer(testnet, body as ApproveErc20, await this.getFirstNodeUrl(body.chain, testnet));
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, body.chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(body.chain, txData);
        }
    }
}
