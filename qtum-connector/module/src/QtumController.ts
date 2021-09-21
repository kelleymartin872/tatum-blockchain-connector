import {Body, Get, HttpCode, HttpStatus, Param, Post, Query,} from '@nestjs/common';
import { QtumService } from './QtumService';
import { QtumError } from './QtumError';
import {
    QtumIRawTransactionInfo,
    QtumIRawTransactions,
    generateAddressFromPrivatekey,
    generateAddressFromXPub,
    generatePrivateKeyFromMnemonic,
    generateWallet,
    Currency,
} from '@tatumio/tatum';
import {GeneratePrivateKey, PathAddress, PathHash, PathXpub, Pagination} from '@tatumio/blockchain-connector-common';
import { PathKey } from './dto/PathKey';
export abstract class QtumController {
    protected constructor(protected readonly service: QtumService) {
    }
    @Post('/wallet/priv')
    @HttpCode(HttpStatus.OK)
    async generatePrivateKey(@Body() body: GeneratePrivateKey) {
        try {
            return await generatePrivateKeyFromMnemonic(Currency.QTUM, await this.service.isTestnet(), body.mnemonic, body.index);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'qtum.error');
        }
    }
    @Get('/wallet')
    @HttpCode(HttpStatus.OK)
    async generateWallet(@Query('mnemonic') mnemonic: string) {
        try {
            return await generateWallet(Currency.QTUM,await this.service.isTestnet(), mnemonic);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'qtum.error');
        }
    }

    @Get('/address/:xpub/:i')
    @HttpCode(HttpStatus.OK)
    async generateAddress(@Param() {xpub, i}: PathXpub) {
        try {
            return {address: await generateAddressFromXPub(Currency.QTUM, await this.service.isTestnet(), xpub, Number(i))};
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'qtum.error');
        }
    }
    @Get('/block/current')
    @HttpCode(HttpStatus.OK)
    async getCurrentBlock() {
        try {
            return await this.service.getCurrentBlock();
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'qtum.error');
        }
    }
    @Get('/block/:hash')
    @HttpCode(HttpStatus.OK)
    async getBlock(@Param() { hash }: PathHash) {
        try {
            return await this.service.getBlock(hash);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'qtum.error');
        }
    }
    @Get('/address/:key')
    @HttpCode(HttpStatus.OK)
    async generateAddressPrivatekey(@Param() { key }: PathKey) {
        try {
            return await generateAddressFromPrivatekey(Currency.QTUM,  await this.service.isTestnet(), key);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'qtum.error');
        }
    }
    @Post('/broadcast')
    @HttpCode(HttpStatus.OK)
    async broadcast(@Body() body: { rawtx: string }) {
        try {
            return await this.service.broadcast(body.rawtx);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'qtum.error');
        }
    }

    @Get('/utxo/:address')
    @HttpCode(HttpStatus.OK)
    async getQtumUTXOs(@Param() { address }: PathAddress) {
        try {
            return await this.service.getQtumUTXOs(address);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'qtum.error');
        }
    }
    @Get('/account/balance/:address')
    @HttpCode(HttpStatus.OK)
    async getInfo(@Param() { address }: PathAddress) {
        try {
            return await this.service.getInfo(address);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'qtum.error');
        }
    }
    @Get('/transaction/:hash')
    @HttpCode(HttpStatus.OK)
    async getQtumTransaction(@Param() { hash }: PathHash): Promise<QtumIRawTransactionInfo> {
        try {
            return await this.service.getQtumTransaction(hash);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'qtum.error');
        }
    }

    @Get('/transactions/address/:address')
    @HttpCode(HttpStatus.OK)
    async getQtumTransactions(@Query() {pageSize, offset}: Pagination, @Param() {address}: PathAddress): Promise<QtumIRawTransactions> {
        try {
            return await this.service.getQtumTransactions(address, parseInt(pageSize), offset ? parseInt(offset) : undefined);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'qtum.error');
        }
    }
    @Get('/transactions/gas/:nblocks')
    @HttpCode(HttpStatus.OK)
    async estimateFee(@Param('nblocks') nblocks: number): Promise<any> {
        try {
            return await this.service.estimateFee(nblocks);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'qtum.error');
        }
    }
    @Get('/transactions/gasbytes/:nblocks')
    @HttpCode(HttpStatus.OK)
    async estimateFeePerByte(@Param('nblocks') nblocks: number): Promise<any> {
        try {
            return await this.service.estimateFeePerByte(nblocks);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'qtum.error');
        }
    }

}
