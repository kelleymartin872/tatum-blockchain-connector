import {Body, Get, HttpCode, HttpStatus, Param, Post, Query, Req} from '@nestjs/common';
import {Request} from 'express';
import {PathHash, GeneratePrivateKey, PathAddress, QueryMnemonic, Pagination, PathXpub} from '@tatumio/blockchain-connector-common';
import {
  BroadcastTx,
  EgldTransaction,
  EgldEsdtTransaction,
  EgldBasicTransaction,
} from '@tatumio/tatum';
import {EgldError} from './EgldError';
import {EgldService} from './EgldService';

export abstract class EgldController {
  protected constructor(protected readonly service: EgldService) {
  }

  @Post('egld/node/:xApiKey/*')
  @HttpCode(HttpStatus.OK)
  public async nodeMethodPost(@Req() req: Request, @Param() param: { xApiKey: string }) {
    try {
      return await this.service.nodeMethod(req, param.xApiKey);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Get('egld/node/:xApiKey/*')
  @HttpCode(HttpStatus.OK)
  public async nodeMethodGet(@Req() req: Request, @Param() param: { xApiKey: string }) {
    try {
      return await this.service.nodeMethod(req, param.xApiKey);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/transaction')
  @HttpCode(HttpStatus.OK)
  public async sendEgldTransaction(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.sendEgldTransaction(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/gas')
  @HttpCode(HttpStatus.OK)
  public async estimateGas(@Body() body: EgldBasicTransaction) {
    try {
      return await this.service.estimateGas(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Get('egld/transaction/count/:address')
  @HttpCode(HttpStatus.OK)
  public async countTransactions(@Param() param: PathAddress) {
    try {
      return await this.service.getTransactionCount(param.address);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/broadcast')
  @HttpCode(HttpStatus.OK)
  public async broadcast(@Body() body: BroadcastTx) {
    try {
      return await this.service.broadcast(body.txData, body.signatureId);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Get('egld/block/current')
  @HttpCode(HttpStatus.OK)
  public async getCurrentBlock() {
    try {
      return await this.service.getCurrentBlock();
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Get('egld/account/balance/:address')
  @HttpCode(HttpStatus.OK)
  public async getAccountBalance(@Param() path: PathAddress) {
    try {
      return await this.service.getBalance(path.address);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Get('egld/address/:mnem/:i')
  @HttpCode(HttpStatus.OK)
  public async generateAddress(@Param() { mnem, i }: {mnem: string, i: string}) {
    try {
      return await this.service.generateAddress(mnem, i);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Get('egld/wallet')
  @HttpCode(HttpStatus.OK)
  async generateWallet(@Query() { mnemonic }: QueryMnemonic) {
    try {
      return await this.service.generateWallet(mnemonic)
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/wallet/priv')
  @HttpCode(HttpStatus.OK)
  async generatePrivateKey(@Body() { mnemonic, index }: GeneratePrivateKey) {
    try {
      return await this.service.generatePrivateKey(mnemonic, index)
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }
    
  @Get('egld/block/:hash')
  @HttpCode(HttpStatus.OK)
  public async getBlock(@Param() path: PathHash) {
    try {
      return await this.service.getBlock(path.hash);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Get('egld/transaction/:hash')
  public async getTransaction(@Param() path: PathHash) {
    try {
      return await this.service.getTransaction(path.hash);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Get('egld/transaction/address/:address')
  async getTransactionsByAccount(@Param() path: PathAddress, @Query() query: Pagination): Promise<EgldTransaction[]> {
    try {
      return await this.service.getTransactionsByAccount(
        path.address,
        query?.pageSize,
        query?.offset,
        query?.count,
      );
    } catch (e) {
        throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/esdt/deploy')
  @HttpCode(HttpStatus.OK)
  public async deploySmartContract(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.deploySmartContract(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/esdt/mint')
  @HttpCode(HttpStatus.OK)
  public async mintSmartContract(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.mintSmartContract(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/esdt/burn')
  @HttpCode(HttpStatus.OK)
  public async burnSmartContract(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.burnSmartContract(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/esdt/pause')
  @HttpCode(HttpStatus.OK)
  public async pauseSmartContract(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.pauseSmartContract(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/esdt/role')
  @HttpCode(HttpStatus.OK)
  public async specialRoleSmartContract(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.specialRoleSmartContract(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/esdt/freeze')
  @HttpCode(HttpStatus.OK)
  public async freezeSmartContract(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.freezeOrWipeOrOwvershipSmartContract(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/esdt/wipe')
  @HttpCode(HttpStatus.OK)
  public async wipeSmartContract(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.freezeOrWipeOrOwvershipSmartContract(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/esdt/owner')
  @HttpCode(HttpStatus.OK)
  public async ownerSmartContract(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.freezeOrWipeOrOwvershipSmartContract(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }
  
  @Post('egld/esdt/control')
  @HttpCode(HttpStatus.OK)
  public async controlChangesSmartContract(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.controlChangesSmartContract(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/esdt/transfer')
  @HttpCode(HttpStatus.OK)
  public async invokeSmartContractMethod(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.invokeSmartContractMethod(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/nft/deploy')
  @HttpCode(HttpStatus.OK)
  public async deployNft(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.deployNft(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/nft/create')
  @HttpCode(HttpStatus.OK)
  public async createNft(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.createNft(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/nft/role-transfer')
  @HttpCode(HttpStatus.OK)
  public async roleTransferNft(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.roleTransferNft(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }
  
  @Post('egld/nft/stop-create')
  @HttpCode(HttpStatus.OK)
  public async stopNftCreate(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.stopNftCreate(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }
  
  @Post('egld/nft/add')
  @HttpCode(HttpStatus.OK)
  public async addNftQuantity(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.addOrBurnNftQuantity(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }
  
  @Post('egld/nft/burn')
  @HttpCode(HttpStatus.OK)
  public async burnNftQuantity(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.addOrBurnNftQuantity(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/nft/freeze')
  @HttpCode(HttpStatus.OK)
  public async freezeNft(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.freezeNft(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/nft/wipe')
  @HttpCode(HttpStatus.OK)
  public async wipeNft(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.wipeNft(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }

  @Post('egld/nft/transfer')
  @HttpCode(HttpStatus.OK)
  public async transferNft(@Body() body: EgldEsdtTransaction) {
    try {
      return await this.service.transferNft(body);
    } catch (e) {
      throw new EgldError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'egld.error');
    }
  }
}
