import {BadRequestException, Body, Get, HttpCode, HttpStatus, Param, Post, Query} from '@nestjs/common';
import {TronService} from './TronService';
import {
    BroadcastTx,
    CreateTronTrc10,
    CreateTronTrc20,
    FreezeTron,
    TransferTron,
    TransferTronTrc10,
    TransferTronTrc20,
} from '@tatumio/tatum';
import {PathAddress} from './dto/PathAddress';
import {PathTxId} from './dto/PathTxId';
import {TronError} from './TronError';
import {PathTokenId} from './dto/PathTokenId';
import {QueryMnemonic} from './dto/QueryMnemonic';
import {GeneratePrivateKey} from './dto/GeneratePrivateKey';
import {PathXpubI} from './dto/PathXpubI';

export abstract class TronController {
    protected constructor(protected readonly service: TronService) {
    }

    @Post('/broadcast')
    @HttpCode(HttpStatus.OK)
    async broadcast(@Body() body: BroadcastTx) {
        try {
            return await this.service.broadcast(body.txData, body.signatureId);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Get('/wallet')
    async generateWallet(@Query() query: QueryMnemonic) {
        try {
            return await this.service.generateWallet(query.mnemonic);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Post('/wallet/priv')
    async generatePrivKey(@Body() body: GeneratePrivateKey) {
        try {
            return await this.service.generatePrivateKey(body.mnemonic, body.index);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Get('/address/:xpub/:i')
    async generateAccount(@Param() params: PathXpubI) {
        try {
            return await this.service.generateAddress(params.xpub, params.i);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Get('/info')
    async getInfo() {
        try {
            return await this.service.getBlockChainInfo();
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Get('/block/:hashOrHeight')
    async getBlock(@Param('hashOrHeight') hashOrHeight: string) {
        try {
            return await this.service.getBlock(hashOrHeight);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Get('/account/:address')
    async getAccount(@Param() path: PathAddress) {
        try {
            return await this.service.getAccount(path.address);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message}` || e.response?.data, 'tron.error');
        }
    }

    @Get('/transaction/:txId')
    async getTransaction(@Param() path: PathTxId) {
        try {
            return await this.service.getTransaction(path.txId);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Get('/transaction/account/:address')
    async getTransactionsByAccount(@Param() path: PathAddress, @Query('next') next?: string) {
        try {
            return await this.service.getTransactionsByAccount(path.address, next);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Get('/transaction/account/:address/trc20')
    async getTransactions20ByAccount(@Param() path: PathAddress, @Query('next') next?: string) {
        try {
            return await this.service.getTrc20TransactionsByAccount(path.address, next);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Post('/transaction')
    @HttpCode(HttpStatus.OK)
    async sendTransaction(@Body() body: TransferTron) {
        try {
            return await this.service.sendTransaction(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Post('/freezeBalance')
    @HttpCode(HttpStatus.OK)
    async freezeBalance(@Body() body: FreezeTron) {
        try {
            return await this.service.freezeBalance(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Get('/trc10/detail/:id')
    async getTrc10Detail(@Param() path: PathTokenId) {
        try {
            return await this.service.getTrc10Detail(path.id);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Post('/trc10/transaction')
    @HttpCode(HttpStatus.OK)
    async sendTrc10Transaction(@Body() body: TransferTronTrc10) {
        try {
            return await this.service.sendTrc10Transaction(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Post('/trc10/deploy')
    @HttpCode(HttpStatus.OK)
    async createTrc10(@Body() body: CreateTronTrc10) {
        try {
            return await this.service.createTrc10Transaction(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Post('/trc20/deploy')
    @HttpCode(HttpStatus.OK)
    async createTrc20(@Body() body: CreateTronTrc20) {
        try {
            return await this.service.createTrc20Transaction(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }

    @Post('/trc20/transaction')
    @HttpCode(HttpStatus.OK)
    async sendTrc20Transaction(@Body() body: TransferTronTrc20) {
        try {
            return await this.service.sendTrc20Transaction(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === TronError.name) {
                throw e;
            }
            throw new TronError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'tron.error');
        }
    }
}
