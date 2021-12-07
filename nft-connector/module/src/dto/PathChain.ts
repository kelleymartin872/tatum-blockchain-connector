import {Currency} from '@tatumio/tatum';
import {Currency as C} from '@tatumio/tatum-solana';
import {IsIn, IsNotEmpty} from 'class-validator';

export class PathChain {

    @IsNotEmpty()
    @IsIn([Currency.ETH, Currency.CELO, Currency.BSC, Currency.FLOW, Currency.XDC, Currency.TRON, Currency.ONE, Currency.KCS,
        Currency.MATIC, Currency.EGLD, C.SOL, Currency.ALGO])
    public chain: Currency;
}
