import {Body, Get, Headers, HttpCode, HttpStatus, Param, Post, UseGuards} from '@nestjs/common';
import {QuorumService} from './QuorumService';
import {PathAddress} from './dto/PathAddress';
import {PathTxId} from './dto/PathTxId';
import {QuorumError} from './QuorumError';
import {EndpointGuard} from './EndpointGuard';
import {HEADER_ENDPOINT} from './index';
import { AccountPassword, TransferQuorum } from '@tatumio/tatum';

@UseGuards(EndpointGuard)
export abstract class QuorumController {
    protected constructor(protected readonly service: QuorumService) {
    }

    @Post('/web3/:xApiKey')
    @HttpCode(HttpStatus.OK)
    async web3Driver(@Body() body: any, @Headers() url: object) {
        return this.service.web3Method(body, url[HEADER_ENDPOINT]);
    }

    @Post('/account')
    async generateAccount(@Body() body: AccountPassword, @Headers() url: object) {
        try {
            return await this.service.generateAccount(body.password, url[HEADER_ENDPOINT]);
        } catch (e) {
            throw new QuorumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'quorum.error');
        }
    }

    @Get('/block/current')
    async getInfo(@Headers() url: object) {
        try {
            return await this.service.getBlockChainInfo(url[HEADER_ENDPOINT]);
        } catch (e) {
            throw new QuorumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'quorum.error');
        }
    }

    @Get('/block/:hashOrHeight')
    async getBlock(@Param('hashOrHeight') hashOrHeight: string, @Headers() url: object) {
        try {
            return await this.service.getBlock(hashOrHeight, url[HEADER_ENDPOINT]);
        } catch (e) {
            throw new QuorumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'quorum.error');
        }
    }

    @Post('/account/:address/unlock')
    async unlockAccount(@Body() body: AccountPassword, @Param() path: PathAddress, @Headers() url: object) {
        try {
            return await this.service.unlockAccount(path.address, body.password, url[HEADER_ENDPOINT]);
        } catch (e) {
            throw new QuorumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'quorum.error');
        }
    }

    @Get('/transaction/:txId')
    async getTransaction(@Param() path: PathTxId, @Headers() url: object) {
        try {
            return await this.service.getTransaction(path.txId, url[HEADER_ENDPOINT]);
        } catch (e) {
            throw new QuorumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'quorum.error');
        }
    }

    @Get('/transaction/:txId/receipt')
    async getTransactionReceipt(@Param() path: PathTxId, @Headers() url: object) {
        try {
            return await this.service.getTransactionReceipt(path.txId, url[HEADER_ENDPOINT]);
        } catch (e) {
            throw new QuorumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'quorum.error');
        }
    }

    @Post('/transaction')
    @HttpCode(HttpStatus.OK)
    async sendTransaction(@Body() body: TransferQuorum, @Headers() url: object) {
        try {
            return await this.service.sendTransaction(body, url[HEADER_ENDPOINT]);
        } catch (e) {
            throw new QuorumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'quorum.error');
        }
    }
}
