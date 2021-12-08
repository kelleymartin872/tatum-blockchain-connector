import {IsIn, IsNotEmpty} from 'class-validator';

import {
  BurnCeloErc20,
  BurnErc20,
  Currency,
  DeployCeloErc20,
  DeployErc20,
  MintCeloErc20,
  MintErc20, OneTransfer20,
  TransferCeloOrCeloErc20Token,
  TransferErc20,
  EgldEsdtTransaction,
} from '@tatumio/tatum';

import {
  BurnErc20 as CoreBurnErc20,
  DeployErc20 as CoreDeployErc20,
  MintErc20 as CoreMintErc20,
  TransferErc20 as CoreTransferErc20
} from '@tatumio/tatum-core'
export class ChainBurnErc20 extends BurnErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC, Currency.XDC, Currency.ONE, Currency.MATIC, Currency.ALGO, Currency.KCS])
  public chain: Currency;
}

export class ChainDeployErc20 extends DeployErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC, Currency.XDC, Currency.ONE, Currency.ALGO, Currency.KCS])
  public chain: Currency;
}

export class ChainMintErc20 extends MintErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC, Currency.XDC, Currency.ONE])
  public chain: Currency;
}

export class ChainTransferErc20 extends TransferErc20 {
  @IsNotEmpty()
  @IsIn([Currency.XDC])
  public chain: Currency;
}

export class ChainTransferAlgoErc20 extends TransferErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ALGO])
  public chain: Currency;
}
export class ChainTransferHrm20 extends OneTransfer20 {
  @IsNotEmpty()
  @IsIn([Currency.ONE])
  public chain: Currency;
}

export class ChainTransferEthErc20 extends TransferErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC])
  public chain: Currency;
}

export class ChainTransferPolygonErc20 extends TransferErc20 {
  @IsNotEmpty()
  @IsIn([Currency.MATIC])
  public chain: Currency;
}

export class ChainTransferBscBep20 extends TransferErc20 {
  @IsNotEmpty()
  @IsIn([Currency.ETH, Currency.BSC])
  public chain: Currency;
}

export class ChainBurnCeloErc20 extends BurnCeloErc20 {
  @IsNotEmpty()
  @IsIn([Currency.CELO])
  public chain: Currency;
}

export class ChainDeployCeloErc20 extends DeployCeloErc20 {
  @IsNotEmpty()
  @IsIn([Currency.CELO])
  public chain: Currency;
}

export class ChainMintCeloErc20 extends MintCeloErc20 {
  @IsNotEmpty()
  @IsIn([Currency.CELO])
  public chain: Currency;
}

export class ChainTransferCeloErc20Token extends TransferCeloOrCeloErc20Token {
  @IsNotEmpty()
  @IsIn([Currency.CELO])
  public chain: Currency;
}

export class ChainEgldEsdtTransaction extends EgldEsdtTransaction {
  @IsNotEmpty()
  @IsIn([Currency.EGLD])
  public chain: Currency;
}

export class ChainBurnKcsErc20 extends CoreBurnErc20 {
  @IsNotEmpty()
  @IsIn([Currency.KCS])
  public chain: Currency
}

export class ChainDeployKcsErc20 extends CoreDeployErc20 {
  @IsNotEmpty()
  @IsIn([Currency.KCS])
  public chain: Currency
}

export class ChainMintKcsErc20 extends CoreMintErc20 {
  @IsNotEmpty()
  @IsIn([Currency.KCS])
  public chain: Currency
}

export class ChainTransferKcsErc20 extends CoreTransferErc20 {
  @IsNotEmpty()
  @IsIn([Currency.KCS])
  public chain: Currency
}