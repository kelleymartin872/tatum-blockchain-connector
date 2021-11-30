import {BadRequestException, Body, Get, HttpCode, HttpStatus, Param, Post,} from '@nestjs/common';
import {SolanaService} from './SolanaService';
import {SolanaError} from './SolanaError';
import {PathHeight} from "./dto/PathHeight";
import {PathAddress, PathHash} from "@tatumio/blockchain-connector-common";
import { TransferSolana } from '@tatumio/tatum-solana';

export abstract class SolanaController {
  protected constructor(protected readonly service: SolanaService) {
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
      if (e.constructor.name === 'TatumError' || e.constructor.name === SolanaError.name) {
        throw e;
      }
      throw new SolanaError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'sol.error');
    }
  }

  @Get('/wallet')
  @HttpCode(HttpStatus.OK)
  async generateWallet() {
    try {
      return await this.service.generateWallet()
    } catch (e) {
      throw new SolanaError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'sol.error');
    }
  }

  @Post('/transaction')
  @HttpCode(HttpStatus.OK)
  public async sendTransaction(@Body() body: TransferSolana) {
    try {
      return await this.service.sendSOL(body);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === SolanaError.name) {
        throw e;
      }
      throw new SolanaError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'sol.error');
    }
  }
  @Get('/block/current')
  @HttpCode(HttpStatus.OK)
  public async getInfo() {
    try {
      return await this.service.getCurrentBlock();
    } catch (e) {
      throw new SolanaError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'sol.error');
    }
  }

  @Get('/block/:height')
  @HttpCode(HttpStatus.OK)
  public async getBlock(@Param() path: PathHeight) {
    try {
      return await this.service.getBlock(parseInt(path.height));
    } catch (e) {
      throw new SolanaError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'sol.error');
    }
  }

  @Get('/account/balance/:address')
  @HttpCode(HttpStatus.OK)
  public async getAccountBalance(@Param() path: PathAddress) {
    try {
      return await this.service.getBalance(path.address);
    } catch (e) {
      throw new SolanaError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'sol.error');
    }
  }

  @Get('/transaction/:hash')
  public async getTransaction(@Param() path: PathHash) {
    try {
      return await this.service.getTransaction(path.hash);
    } catch (e) {
      throw new SolanaError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'sol.error');
    }
  }
}
