import {BadRequestException, Body, Get, HttpCode, HttpStatus, Param, Post, Query,} from '@nestjs/common';
import {PolygonService} from './PolygonService';
import {
  BroadcastTx,
  EstimateGasEth,
  SmartContractMethodInvocation,
  SmartContractReadMethodInvocation,
  TransferEthErc20,
} from '@tatumio/tatum';
import {PolygonError} from './PolygonError';
import {
  EthBasedBlockchainControllerInterface,
  GeneratePrivateKey,
  PathAddress,
  PathHash,
  PathXpub,
  QueryMnemonic
} from '@tatumio/blockchain-connector-common';

export abstract class PolygonController implements EthBasedBlockchainControllerInterface {
  protected constructor(protected readonly service: PolygonService) {
  }

  @Post('/web3/:xApiKey')
  @HttpCode(HttpStatus.OK)
  public async web3Driver(@Body() body: any) {
    try {
      return await this.service.web3Method(body);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === PolygonError.name) {
        throw e;
      }
      throw new PolygonError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'polygon.error');
    }
  }

  @Get('/wallet')
  @HttpCode(HttpStatus.OK)
  async generateWallet(@Query() { mnemonic }: QueryMnemonic) {
    try {
      return await this.service.generateWallet(mnemonic)
    } catch (e) {
      throw new PolygonError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'polygon.error');
    }
  }

  @Post('/wallet/priv')
  @HttpCode(HttpStatus.OK)
  async generatePrivateKey(@Body() { mnemonic, index }: GeneratePrivateKey) {
    try {
      return await this.service.generatePrivateKey(mnemonic, index)
    } catch (e) {
      throw new PolygonError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'polygon.error');
    }
  }

  @Post('/transaction')
  @HttpCode(HttpStatus.OK)
  public async sendTransaction(@Body() body: TransferEthErc20) {
    try {
      return await this.service.sendMatic(body);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === PolygonError.name) {
        throw e;
      }
      throw new PolygonError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'polygon.error');
    }
  }

  @Post('/gas')
  @HttpCode(HttpStatus.OK)
  public async estimateGas(@Body() body: EstimateGasEth) {
    try {
      return await this.service.estimateGas(body);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === PolygonError.name) {
        throw e;
      }
      throw new PolygonError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'polygon.error');
    }
  }

  @Get('/transaction/count/:address')
  @HttpCode(HttpStatus.OK)
  public async countTransactions(@Param() param: PathAddress) {
    try {
      return await this.service.getTransactionCount(param.address);
    } catch (e) {
      throw new PolygonError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'polygon.error');
    }
  }

  @Post('/smartcontract')
  @HttpCode(HttpStatus.OK)
  public async invokeSmartContractMethod(@Body() body: SmartContractMethodInvocation | SmartContractReadMethodInvocation) {
    try {
      return await this.service.invokeSmartContractMethod(body);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === PolygonError.name) {
        throw e;
      }
      throw new PolygonError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'polygon.error');
    }
  }

  @Post('/broadcast')
  @HttpCode(HttpStatus.OK)
  public async broadcast(@Body() body: BroadcastTx) {
    try {
      return await this.service.broadcast(body.txData, body.signatureId);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === PolygonError.name) {
        throw e;
      }
      throw new PolygonError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'polygon.error');
    }
  }

  @Get('/block/current')
  @HttpCode(HttpStatus.OK)
  public async getInfo() {
    try {
      return await this.service.getCurrentBlock();
    } catch (e) {
      throw new PolygonError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'polygon.error');
    }
  }

  @Get('/block/:hash')
  @HttpCode(HttpStatus.OK)
  public async getBlock(@Param() path: PathHash) {
    try {
      return await this.service.getBlock(path.hash);
    } catch (e) {
      throw new PolygonError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'polygon.error');
    }
  }

  @Get('/account/balance/:address')
  @HttpCode(HttpStatus.OK)
  public async getAccountBalance(@Param() path: PathAddress) {
    try {
      return await this.service.getBalance(path.address);
    } catch (e) {
      throw new PolygonError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'polygon.error');
    }
  }

  @Get('/address/:xpub/:i')
  @HttpCode(HttpStatus.OK)
  public async generateAddress(@Param() { xpub, i }: PathXpub) {
    try {
      return await this.service.generateAddress(xpub, i);
    } catch (e) {
      throw new PolygonError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'polygon.error');
    }
  }

  @Get('/transaction/:hash')
  public async getTransaction(@Param() path: PathHash) {
    try {
      return await this.service.getTransaction(path.hash);
    } catch (e) {
      throw new PolygonError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'polygon.error');
    }
  }
}
