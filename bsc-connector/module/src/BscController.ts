import {BadRequestException, Body, Get, HttpCode, HttpStatus, Param, Post, Query,} from '@nestjs/common';
import {BscService} from './BscService';
import {QueryMnemonic} from './dto/QueryMnemonic';
import {GeneratePrivateKey} from './dto/GeneratePrivateKey';
import {PathXpubI} from './dto/PathXpubI';
import {
  BroadcastTx,
  DeployErc20,
  EstimateGasEth,
  SmartContractMethodInvocation,
  SmartContractReadMethodInvocation,
  TransferBscBep20,
  TransferErc20,
} from '@tatumio/tatum';
import {PathAddress} from './dto/PathAddress';
import {QueryCurrencyContractAddress} from './dto/QueryCurrencyContractAddress';
import {PathHash} from './dto/PathHash';
import {BscError} from './BscError';

export abstract class BscController {
  protected constructor(protected readonly service: BscService) {
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
      if (e.constructor.name === 'TatumError' || e.constructor.name === BscError.name) {
        throw e;
      }
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
    }
  }

  @Get('/wallet')
  @HttpCode(HttpStatus.OK)
  async generateWallet(@Query() { mnemonic }: QueryMnemonic) {
    try {
      return await this.service.generateWallet(mnemonic)
    } catch (e) {
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
    }
  }

  @Post('/wallet/priv')
  @HttpCode(HttpStatus.OK)
  async generatePrivateKey(@Body() { mnemonic, index }: GeneratePrivateKey) {
    try {
      return await this.service.generatePrivateKey(mnemonic, index)
    } catch (e) {
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
    }
  }

  @Post('/transaction')
  @HttpCode(HttpStatus.OK)
  public async sendBscOrBep20Transaction(@Body() body: TransferBscBep20) {
    try {
      return await this.service.sendBscOrBep20Transaction(body);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === BscError.name) {
        throw e;
      }
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
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
      if (e.constructor.name === 'TatumError' || e.constructor.name === BscError.name) {
        throw e;
      }
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
    }
  }

  @Get('/transaction/count/:address')
  @HttpCode(HttpStatus.OK)
  public async countTransactions(@Param() param: PathAddress) {
    try {
      return await this.service.getTransactionCount(param.address);
    } catch (e) {
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
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
      if (e.constructor.name === 'TatumError' || e.constructor.name === BscError.name) {
        throw e;
      }
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
    }
  }

  @Post('/bep20/transaction')
  @HttpCode(HttpStatus.OK)
  public async transferBep20Blockchain(@Body() body: TransferErc20) {
    try {
      return await this.service.sendCustomBep20Transaction(body);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === BscError.name) {
        throw e;
      }
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
    }
  }

  @Post('/bep20/deploy')
  @HttpCode(HttpStatus.OK)
  public async deployBep20(@Body() body: DeployErc20) {
    try {
      return await await this.service.deployBep20(body);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === BscError.name) {
        throw e;
      }
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
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
      if (e.constructor.name === 'TatumError' || e.constructor.name === BscError.name) {
        throw e;
      }
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
    }
  }

  @Get('/block/current')
  @HttpCode(HttpStatus.OK)
  public async getCurrentBlock() {
    try {
      return await this.service.getCurrentBlock();
    } catch (e) {
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
    }
  }

  @Get('/block/:hash')
  @HttpCode(HttpStatus.OK)
  public async getBlock(@Param() path: PathHash) {
    try {
      return await this.service.getBlock(path.hash);
    } catch (e) {
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
    }
  }

  @Get('/account/balance/:address')
  @HttpCode(HttpStatus.OK)
  public async getAccountBalance(@Param() path: PathAddress) {
    try {
      return await this.service.getBalance(path.address);
    } catch (e) {
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
    }
  }

  @Get('/account/balance/bep20/:address')
  @HttpCode(HttpStatus.OK)
  public async getBep20Balance(@Param() path: PathAddress, @Query() query: QueryCurrencyContractAddress) {
    try {
      return await this.service.getBep20Balance(path.address, query.currency, query.contractAddress);
    } catch (e) {
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
    }
  }

  @Get('/address/:xpub/:i')
  @HttpCode(HttpStatus.OK)
  public async generateAddress(@Param() { xpub, i }: PathXpubI) {
    try {
      return await this.service.generateAddress(xpub, i);
    } catch (e) {
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
    }
  }

  @Get('/transaction/:hash')
  public async getTransaction(@Param() path: PathHash) {
    try {
      return await this.service.getTransaction(path.hash);
    } catch (e) {
      throw new BscError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'bsc.error');
    }
  }
}
