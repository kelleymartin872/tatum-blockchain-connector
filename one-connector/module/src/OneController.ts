import {Body, Get, HttpCode, HttpStatus, Param, Post, Query,} from '@nestjs/common';
import {OneService} from './OneService';
import {QueryMnemonic} from './dto/QueryMnemonic';
import {GeneratePrivateKey} from './dto/GeneratePrivateKey';
import {PathXpubI} from './dto/PathXpubI';
import {BroadcastTx, EstimateGasEth, OneTransfer, SmartContractMethodInvocation,} from '@tatumio/tatum';
import {PathAddress} from './dto/PathAddress';
import {PathHash} from './dto/PathHash';
import {OneError} from './OneError';

export abstract class OneController {
    protected constructor(protected readonly service: OneService) {
    }

    @Post('v3/one/web3/:xApiKey')
    @HttpCode(HttpStatus.OK)
    public async web3Driver(@Body() body: any) {
        try {
            return await this.service.web3Method(body);
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }

    @Get('v3/one/wallet')
    @HttpCode(HttpStatus.OK)
    async generateWallet(@Query() {mnemonic}: QueryMnemonic) {
        try {
            return await this.service.generateWallet(mnemonic);
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }

    @Post('v3/one/wallet/priv')
    @HttpCode(HttpStatus.OK)
    async generatePrivateKey(@Body() {mnemonic, index}: GeneratePrivateKey) {
        try {
            return await this.service.generatePrivateKey(mnemonic, index);
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }

    @Post('v3/one/transaction')
    @HttpCode(HttpStatus.OK)
    public async sendOneTransaction(@Body() body: OneTransfer) {
        try {
            return await this.service.sendTransaction(body);
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }

    @Post('v3/one/gas')
    @HttpCode(HttpStatus.OK)
    public async estimateGas(@Body() body: EstimateGasEth) {
        try {
            return await this.service.estimateGas(body);
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }

    @Get('v3/one/transaction/count/:address')
    @HttpCode(HttpStatus.OK)
    public async countTransactions(@Param() param: PathAddress) {
        try {
            return await this.service.getTransactionCount(param.address);
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }

    @Post('v3/one/smartcontract')
    @HttpCode(HttpStatus.OK)
    public async invokeSmartContractMethod(@Body() body: SmartContractMethodInvocation) {
        try {
            return await this.service.invokeSmartContractMethod(body);
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }

    @Post('v3/one/broadcast')
    @HttpCode(HttpStatus.OK)
    public async broadcast(@Body() body: BroadcastTx) {
        try {
            return await this.service.broadcast(body.txData, body.signatureId);
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }

    @Get('v3/one/block/current')
    @HttpCode(HttpStatus.OK)
    public async getCurrentBlock() {
        try {
            return await this.service.getCurrentBlock();
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }

    @Get('v3/one/block/:hash')
    @HttpCode(HttpStatus.OK)
    public async getBlock(@Param() path: PathHash, @Query('shardID') shardID?: string) {
        try {
            return await this.service.getBlock(path.hash, shardID ? parseInt(shardID) : undefined);
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }

    @Get('v3/one/account/balance/:address')
    @HttpCode(HttpStatus.OK)
    public async getAccountBalance(@Param() path: PathAddress, @Query('shardID') shardID?: string) {
        try {
            return await this.service.getBalance(path.address, shardID ? parseInt(shardID) : undefined);
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }

    @Get('v3/one/address/:xpub/:i')
    @HttpCode(HttpStatus.OK)
    public async generateAddress(@Param() {xpub, i}: PathXpubI) {
        try {
            return await this.service.generateAddress(xpub, i);
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }

    @Get('v3/one/address/format/:address')
    @HttpCode(HttpStatus.OK)
    public async formatAddress(@Param() {address}: PathAddress) {
        try {
            return await this.service.formatAddress(address);
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }

    @Get('v3/one/transaction/:hash')
    public async getTransaction(@Param() path: PathHash, @Query('shardID') shardID?: string) {
        try {
            return await this.service.getTransaction(path.hash, shardID ? parseInt(shardID) : undefined);
        } catch (e) {
            throw new OneError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'one.error');
        }
    }
}
