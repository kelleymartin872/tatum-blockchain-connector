import {BadRequestException, Body, Get, HttpCode, HttpStatus, Param, Post, Query, Req} from '@nestjs/common';
import {CeloService} from './CeloService';
import {PathAddress} from './dto/PathAddress';
import {CeloError} from './CeloError';
import {PathHash} from './dto/PathHash';
import {PathXpubI} from './dto/PathXpubI';
import {
    BroadcastTx,
    BurnCeloErc20,
    Currency,
    DeployCeloErc20,
    MintCeloErc20,
    TransferCeloOrCeloErc20Token,
    CeloSmartContractMethodInvocation,
    SmartContractReadMethodInvocation,
} from '@tatumio/tatum';
import {PathAddressContractAddressI} from './dto/PathAddressContractAddressI';
import {PathTokenContractAddress} from './dto/PathTokenContractAddress';
import {PathAddressContractAddress} from './dto/PathAddressContractAddress';
import {QueryMnemonic} from './dto/QueryMnemonic';
import {GeneratePrivateKey} from './dto/GeneratePrivateKey';
import {Request} from 'express';

export abstract class CeloController {
    protected constructor(protected readonly service: CeloService) {
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
            if (e.constructor.name === 'TatumError' || e.constructor.name === CeloError.name) {
                throw e;
            }
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Get('/wallet')
    public async createAccount(@Query() query: QueryMnemonic) {
        try {
            return await this.service.generateWallet(query.mnemonic);
        } catch (e) {
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Post('/wallet/priv')
    @HttpCode(HttpStatus.OK)
    public async generateAddressPrivateKey(@Body() body: GeneratePrivateKey) {
        try {
            return await this.service.generateAddressPrivateKey(body.index, body.mnemonic);
        } catch (e) {
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Post('/transaction')
    @HttpCode(HttpStatus.OK)
    public async transfer(@Body() body: TransferCeloOrCeloErc20Token) {
        try {
            return await this.service.transfer(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === CeloError.name) {
                throw e;
            }
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Get('/transaction/count/:address')
    public async countTransactions(@Param() param: PathAddress) {
        try {
            return await this.service.getTransactionCount(param.address);
        } catch (e) {
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Get('/erc721/balance/:address/:contractAddress')
    public async getBalanceErc721(@Param() path: PathAddressContractAddress) {
        try {
            return await this.service.getBalanceErc721(path.address, path.contractAddress);
        } catch (e) {
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Get('/erc721/owner/:token/:contractAddress')
    public async getOwnerErc721(@Param() path: PathTokenContractAddress) {
        try {
            return await this.service.getOwnerErc721(path.token, path.contractAddress);
        } catch (e) {
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Get('/erc721/metadata/:token/:contractAddress')
    public async getMetadataErc721(@Param() path: PathTokenContractAddress) {
        try {
            return await this.service.getMetadataErc721(path.token, path.contractAddress);
        } catch (e) {
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Get('/erc721/token/:address/:i/:contractAddress')
    public async getTokenErc721(@Param() path: PathAddressContractAddressI) {
        try {
            return await this.service.getTokenErc721(path.address, parseInt(path.i), path.contractAddress);
        } catch (e) {
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Get('/erc721/token/:address/:contractAddress')
    public async getTokensByAddress(@Param() path: PathAddressContractAddress) {
        try {
            return await this.service.getTokensOfOwner(path.address, path.contractAddress);
        } catch (e) {
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Post('/erc721/transaction')
    @HttpCode(HttpStatus.OK)
    public async transactionErc721(@Req() req: Request) {
        try {
            req.body.chain = Currency.CELO;
            return await this.service.transferErc721(req.body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === CeloError.name) {
                throw e;
            }
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Post('/erc721/mint')
    @HttpCode(HttpStatus.OK)
    public async mintErc721(@Req() req: Request) {
        try {
            req.body.chain = Currency.CELO;
            return await this.service.mintErc721(req.body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === CeloError.name) {
                throw e;
            }
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Post('/erc721/mint/batch')
    @HttpCode(HttpStatus.OK)
    public async mintMultipleErc721(@Req() req: Request) {
        try {
            req.body.chain = Currency.CELO;
            return await this.service.mintMultipleErc721(req.body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === CeloError.name) {
                throw e;
            }
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Post('/erc721/burn')
    @HttpCode(HttpStatus.OK)
    public async burnErc721(@Req() req: Request) {
        try {
            req.body.chain = Currency.CELO;
            return await this.service.burnErc721(req.body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === CeloError.name) {
                throw e;
            }
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Post('/erc721/deploy')
    @HttpCode(HttpStatus.OK)
    public async deployErc721(@Req() req: Request) {
        try {
            req.body.chain = Currency.CELO;
            return await this.service.deployErc721(req.body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === CeloError.name) {
                throw e;
            }
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Post('/erc20/transaction')
    @HttpCode(HttpStatus.OK)
    public async transactionErc20(@Body() body: TransferCeloOrCeloErc20Token) {
        try {
            return await this.service.transferErc20(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === CeloError.name) {
                throw e;
            }
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Post('/smartcontract')
    @HttpCode(HttpStatus.OK)
    public async invokeCeloSmartContractMethod(@Body() body: CeloSmartContractMethodInvocation | SmartContractReadMethodInvocation) {
      try {
        return await this.service.invokeSmartContractMethod(body);
      } catch (e) {
          if (['Array', 'ValidationError'].includes(e.constructor.name)) {
              throw new BadRequestException(e);
          }
          if (e.constructor.name === 'TatumError' || e.constructor.name === CeloError.name) {
              throw e;
          }
        throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
      }
    }

      @Post('/erc20/mint')
    @HttpCode(HttpStatus.OK)
    public async mintErc20(@Body() body: MintCeloErc20) {
        try {
            return await this.service.mintErc20(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === CeloError.name) {
                throw e;
            }
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Post('/erc20/burn')
    @HttpCode(HttpStatus.OK)
    public async burnErc20(@Body() body: BurnCeloErc20) {
        try {
            return await this.service.burnErc20(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === CeloError.name) {
                throw e;
            }
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Post('/erc20/deploy')
    @HttpCode(HttpStatus.OK)
    public async deployErc20(@Body() body: DeployCeloErc20) {
        try {
            return await this.service.deployErc20(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === CeloError.name) {
                throw e;
            }
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Get('/account/balance/erc20/:address/:contractAddress')
    public async getAccountErc20Balance(@Param() path: PathAddressContractAddress) {
        return this.service.getErc20Balance(path.address, path.contractAddress);
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
            if (e.constructor.name === 'TatumError' || e.constructor.name === CeloError.name) {
                throw e;
            }
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Get('/block/current')
    public async getCurrentBlock() {
        try {
            return await this.service.getCurrentBlock();
        } catch (e) {
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Get('/block/:hash')
    public async getBlock(@Param() path: PathHash) {
        try {
            return await this.service.getBlock(path.hash);
        } catch (e) {
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Get('/account/balance/:address')
    public async getAccountBalance(@Param() path: PathAddress) {
        try {
            return await this.service.getBalance(path.address);
        } catch (e) {
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Get('/transaction/:hash')
    public async getRawTransaction(@Param() path: PathHash) {
        try {
            return await this.service.getTransaction(path.hash);
        } catch (e) {
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }

    @Get('/address/:xpub/:i')
    public async generateAddress(@Param() path: PathXpubI) {
        try {
            return await this.service.generateAddress(path.xpub, parseInt(path.i));
        } catch (e) {
            throw new CeloError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'celo.error');
        }
    }
}
