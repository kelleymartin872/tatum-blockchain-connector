import {Body, Get, Param, Post, Query} from '@nestjs/common';
import {QtumService} from './QtumService';
import {QtumError} from './QtumError';
import {
    QtumIRawTransactionInfo,
    QtumIRawTransactions,
    generateAddressFromPrivatekey,
    generateAddressFromXPub,
    generatePrivateKeyFromMnemonic,
    Currency,
} from '@tatumio/tatum';
import {GeneratePrivateKey, Pagination, PathAddress, PathHash, PathXpub} from '@tatumio/blockchain-connector-common';
import {PathKey} from './dto/PathKey';

export abstract class QtumController {
    protected constructor(protected readonly service: QtumService) {
    }

    @Post('v3/qtum/wallet/priv')
    async generatePrivateKey(@Body() body: GeneratePrivateKey) {
        try {
            return await generatePrivateKeyFromMnemonic(Currency.QTUM, await this.service.isTestnet(), body.mnemonic, body.index);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

    @Get('v3/qtum/address/:xpub/:i')
    async generateAddress(@Param() {xpub, i}: PathXpub) {
        try {
            return {address: await generateAddressFromXPub(Currency.QTUM, await this.service.isTestnet(), xpub, Number(i))};
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

    @Get('v3/qtum/block/current')
    async getCurrentBlock() {
        try {
            return await this.service.getCurrentBlock();
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

    @Get('v3/qtum/block/:hash')
    async getBlock(@Param() {hash}: PathHash) {
        try {
            return await this.service.getBlock(hash);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

    @Get('v3/qtum/address/:key')
    async generateAddressPrivateKey(@Param() {key}: PathKey) {
        try {
            return await generateAddressFromPrivatekey(Currency.QTUM, await this.service.isTestnet(), key);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

    @Post('v3/qtum/broadcast')
    async broadcast(@Body() body: { rawtx: string }) {
        try {
            return await this.service.broadcast(body.rawtx);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

    @Get('/v3/qtum/utxo/:address')
    async getQtumUTXOs(@Param() {address}: PathAddress) {
        try {
            return await this.service.getQtumUTXOs(address);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

    @Get('/v3/qtum/address/:address/balance')
    async getInfo(@Param() {address}: PathAddress) {
        try {
            return await this.service.getInfo(address);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

    @Get('/v3/qtum/transaction/:hash')
    async getQtumTransaction(@Param() {hash}: PathHash): Promise<QtumIRawTransactionInfo> {
        try {
            return await this.service.getQtumTransaction(hash);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

    @Get('/v3/qtum/transactions/address/:address')
    async getQtumTransactions(@Query() {pageSize, offset}: Pagination, @Param() {address}: PathAddress): Promise<QtumIRawTransactions> {
        try {
            return await this.service.getQtumTransactions(address, parseInt(pageSize), offset ? parseInt(offset) : undefined);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

    @Get('/v3/qtum/transactions/gas/:nblocks')
    async estimateFee(@Param() nblocks: number): Promise<any> {
        try {
            return await this.service.estimateFee(nblocks);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

    @Get('/v3/qtum/transactions/gasbytes/:nblocks')
    async estimateFeePerByte(@Param() nblocks: number): Promise<any> {
        try {
            return await this.service.estimateFeePerByte(nblocks);
        } catch (e) {
            throw new QtumError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'qtum.error');
        }
    }

}
