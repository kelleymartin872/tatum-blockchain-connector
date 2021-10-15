import {BadRequestException, Body, Get, HttpCode, HttpStatus, Param, Post} from '@nestjs/common';
import {Erc20Service} from './Erc20Service';
import {Erc20Error} from './Erc20Error';
import {
    ChainBurnCeloErc20,
    ChainBurnErc20,
    ChainDeployCeloErc20,
    ChainDeployErc20,
    ChainMintCeloErc20,
    ChainMintErc20,
    ChainTransferBscBep20,
    ChainTransferCeloErc20Token,
    ChainTransferErc20,
    ChainTransferEthErc20,
    ChainTransferHrm20,
    ChainTransferPolygonErc20,
    ChainEgldEsdtTransaction,
} from './Erc20Base';
import {ApproveErc20} from '@tatumio/tatum';
import {PathAddressContractAddressChain} from './dto/PathAddressContractAddressChain';

export abstract class Erc20Controller {
    protected constructor(protected readonly service: Erc20Service) {
    }

    @Get('/balance/:chain/:contractAddress/:address')
    public async getBalanceErc20(@Param() path: PathAddressContractAddressChain) {
        try {
            return await this.service.getErc20Balance(path.chain, path.address, path.contractAddress)
        } catch (e) {
            throw new Erc20Error(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'erc20.error');
        }
    }

    @Post('/transaction')
    @HttpCode(HttpStatus.OK)
    public async transactionErc20(
      @Body() body: ChainTransferEthErc20 | ChainTransferBscBep20 | ChainTransferCeloErc20Token | ChainTransferErc20
        | ChainTransferHrm20 | ChainTransferPolygonErc20 | ChainEgldEsdtTransaction
    ) {
        try {
            return await this.service.transferErc20(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === Erc20Error.name) {
                throw e;
            }
            throw new Erc20Error(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'erc20.error');
        }
    }

    @Post('/burn')
    @HttpCode(HttpStatus.OK)
    public async burnErc20(@Body() body: ChainBurnErc20 | ChainBurnCeloErc20 | ChainEgldEsdtTransaction) {
        try {
            return await this.service.burnErc20(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === Erc20Error.name) {
                throw e;
            }
            throw new Erc20Error(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'erc20.error');
        }
    }

    @Post('/mint')
    @HttpCode(HttpStatus.OK)
    public async mintErc20(@Body() body: ChainMintErc20 | ChainMintCeloErc20 | ChainEgldEsdtTransaction) {
        try {
            return await this.service.mintErc20(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === Erc20Error.name) {
                throw e;
            }
            throw new Erc20Error(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'erc20.error');
        }
    }

    @Post('/approve')
    @HttpCode(HttpStatus.OK)
    public async approveErc20(@Body() body: ApproveErc20 | ChainEgldEsdtTransaction) {
        try {
            return await this.service.approveErc20(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === Erc20Error.name) {
                throw e;
            }
            throw new Erc20Error(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'erc20.error');
        }
    }

    @Post('/deploy')
    @HttpCode(HttpStatus.OK)
    public async deployErc20(@Body() body: ChainDeployErc20 | ChainDeployCeloErc20 | ChainEgldEsdtTransaction ) {
        try {
            return await this.service.deployErc20(body);
        } catch (e) {
            if (['Array', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError' || e.constructor.name === Erc20Error.name) {
                throw e;
            }
            throw new Erc20Error(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'erc20.error');
        }
    }
}
