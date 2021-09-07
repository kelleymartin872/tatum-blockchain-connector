import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'pino-logger';
import { InjectPinoLogger } from 'nestjs-pino';
import { NftService } from '../../module';
import {
  celoBroadcast,
  CeloMintErc721,
  Currency,
  EthMintErc721,
  FlowDeployNft,
  OneMint721,
  TransactionHash,
  TronMintTrc721,
} from '@tatumio/tatum';

@Injectable()
export class AppService extends NftService {
  protected broadcast(chain: Currency, txData: string, signatureId?: string) {
    // enter your test API KEY here to make broadcast work
    // process.env.TATUM_API_KEY = '';
    return celoBroadcast(txData, signatureId);
  }
  constructor(@InjectPinoLogger(AppService.name) logger: PinoLogger) {
    super(logger);
  }

  protected getNodesUrl(chain: Currency, testnet: boolean): Promise<string[]> {
    return Promise.resolve(['https://alfajores-forno.celo-testnet.org']);
  }

  protected isTestnet(): Promise<boolean> {
    return Promise.resolve(true);
  }

  protected storeKMSTransaction(
    txData: string,
    currency: string,
    signatureId: string[],
    index: number,
  ): Promise<string> {
    return Promise.resolve(txData);
  }

  protected deployFlowNft(
    testnet: boolean,
    body: FlowDeployNft,
  ): Promise<TransactionHash> {
    return Promise.resolve(undefined);
  }

  protected getTronClient(testnet: boolean): Promise<any> {
    return Promise.resolve(undefined);
  }

  protected setMintBuiltInData(
    body: CeloMintErc721 | EthMintErc721 | TronMintTrc721 | OneMint721,
  ): void {
    if (!body.signatureId && !body.fromPrivateKey) {
      body.fromPrivateKey =
        '0x89f09a62c9601d660dcdbeab15fbecfc07933971465fab3ba9fe1354035d805d';
      body.tokenId = '20';
      body.contractAddress = '0x45871ED5F15203C0ce791eFE5f4B5044833aE10e';
    }
  }
}
