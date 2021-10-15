import {IsIn, IsNotEmpty} from 'class-validator';
import {Currency, EgldEsdtTransaction} from '@tatumio/tatum';

export class ChainEgldEsdtTransaction extends EgldEsdtTransaction {
    @IsNotEmpty()
    @IsIn([Currency.EGLD])
    public chain: Currency;
}
