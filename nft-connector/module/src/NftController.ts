import {BadRequestException, Body, Get, HttpCode, HttpStatus, Param, Post, Put, Query} from '@nestjs/common';
import {NftService} from './NftService';
import {NftError} from './NftError';
import {
    AddMinter,
    CeloBurnErc721,
    CeloDeployErc721,
    CeloMintErc721,
    CeloMintMultipleErc721,
    CeloTransferErc721,
    EthBurnErc721,
    EthDeployErc721,
    EthMintErc721,
    EthMintMultipleErc721,
    FlowBurnNft,
    FlowDeployNft,
    FlowMintMultipleNft,
    FlowMintNft,
    FlowTransferNft,
    EthTransferErc721,
    UpdateCashbackErc721,
    TronUpdateCashbackTrc721,
    CeloUpdateCashbackErc721,
    TronDeployTrc721,
    TronBurnTrc721,
    TronMintMultipleTrc721,
    TronTransferTrc721,
    OneDeploy721, OneBurn721, OneMintMultiple721, OneUpdateCashback721, TronMintTrc721, OneMint721, OneTransfer721,
    DeployErc721, BurnErc721, TransferErc721
} from '@tatumio/tatum';
import {PathTokenIdContractAddressChain} from './dto/PathTokenIdContractAddressChain';
import {ChainEgldEsdtTransaction} from './dto/ChainEgldEsdtTransaction'
import {PathChainTxId} from './dto/PathChainTxId';
import {PathAddressContractAddressChain} from "./dto/PathAddressContractAddressChain";
import {SolanaMintNft} from "@tatumio/tatum-solana";

export abstract class NftController {
    protected constructor(protected readonly service: NftService) {
    }

    @Get('/provenance/:chain/:contractAddress/:tokenId')
    public async getProvenanceData(@Param() path: any) {
        try {
            return await this.service.getProvenanceData(path.chain, path.contractAddress, path.tokenId);
        } catch (e) {
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Get('/balance/:chain/:contractAddress/:address')
    public async getBalanceErc721(@Param() path: PathAddressContractAddressChain, @Query('nonce') nonce?: string) {
        try {
            return await this.service.getTokensOfOwner(path.chain, path.address, path.contractAddress, nonce);
        } catch (e) {
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Get('/transaction/:chain/:txId')
    public async getTransaction(@Param() path: PathChainTxId) {
        try {
            return await this.service.getTransaction(path.chain, path.txId);
        } catch (e) {
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Get('/address/:chain/:txId')
    public async getContractAddress(@Param() path: PathChainTxId) {
        try {
            return await this.service.getContractAddress(path.chain, path.txId);
        } catch (e) {
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Get('/metadata/:chain/:contractAddress/:tokenId?')
    public async getMetadataErc721(@Param() path: PathTokenIdContractAddressChain, @Query('account') account: string, @Query('nonce') nonce?: string) {
        try {
            return await this.service.getMetadataErc721(path.chain, path.tokenId, path.contractAddress, account, nonce);
        } catch (e) {
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Get('/royalty/:chain/:contractAddress/:tokenId?')
    public async getRoyaltyErc721(@Param() path: PathTokenIdContractAddressChain, @Query('nonce') nonce?: string) {
        try {
            return await this.service.getRoyaltyErc721(path.chain, path.tokenId, path.contractAddress, nonce);
        } catch (e) {
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Post('/transaction')
    @HttpCode(HttpStatus.OK)
    public async transactionErc721(
        @Body() body: CeloTransferErc721 | EthTransferErc721 | FlowTransferNft | TronTransferTrc721 | OneTransfer721 | ChainEgldEsdtTransaction | TransferErc721
    ) {
        try {
            return await this.service.transferErc721(body);
        } catch (e) {
            if (['Array', 'NftError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Post('/mint')
    @HttpCode(HttpStatus.OK)
    public async mintErc721(
        @Body() body: CeloMintErc721 | EthMintErc721 | FlowMintNft | TronMintTrc721 | OneMint721 | ChainEgldEsdtTransaction | SolanaMintNft
    ) {
        try {
            return await this.service.mintErc721(body);
        } catch (e) {
            if (['Array', 'NftError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Post('/mint/add')
    @HttpCode(HttpStatus.OK)
    public async addMinter(
        @Body() body: AddMinter
    ) {
        try {
            return await this.service.addMinter(body);
        } catch (e) {
            if (['Array', 'NftError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Put('/royalty')
    @HttpCode(HttpStatus.OK)
    public async updateRoyaltyErc721(@Body() body: CeloUpdateCashbackErc721 | TronUpdateCashbackTrc721 | UpdateCashbackErc721 | OneUpdateCashback721) {
        try {
            return await this.service.updateCashbackForAuthor(body);
        } catch (e) {
            if (['Array', 'NftError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Post('/mint/batch')
    @HttpCode(HttpStatus.OK)
    public async mintMultipleErc721(@Body() body: CeloMintMultipleErc721 | TronMintMultipleTrc721 | EthMintMultipleErc721 | FlowMintMultipleNft | OneMintMultiple721) {
        try {
            return await this.service.mintMultipleErc721(body);
        } catch (e) {
            if (['Array', 'NftError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Post('/burn')
    @HttpCode(HttpStatus.OK)
    public async burnErc721(
        @Body() body: CeloBurnErc721 | TronBurnTrc721 | EthBurnErc721 | FlowBurnNft | OneBurn721 | ChainEgldEsdtTransaction | BurnErc721
    ) {
        try {
            return await this.service.burnErc721(body);
        } catch (e) {
            if (['Array', 'NftError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }

    @Post('/deploy')
    @HttpCode(HttpStatus.OK)
    public async deployErc721(
        @Body() body: CeloDeployErc721 | TronDeployTrc721 | EthDeployErc721 | FlowDeployNft | OneDeploy721 | ChainEgldEsdtTransaction | DeployErc721
    ) {
        try {
            return await this.service.deployErc721(body);
        } catch (e) {
            if (['Array', 'NftError', 'ValidationError'].includes(e.constructor.name)) {
                throw new BadRequestException(e);
            }
            if (e.constructor.name === 'TatumError') {
                throw e;
            }
            throw new NftError(`Unexpected error occurred. Reason: ${e.response?.message || e.response?.data || e.message || e}`, 'nft.error');
        }
    }
}
