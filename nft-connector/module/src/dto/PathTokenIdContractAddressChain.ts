import {IsNotEmpty, Length, ValidateIf} from 'class-validator';
import {PathChain} from './PathChain';
import {Currency} from '@tatumio/tatum';
export class PathTokenIdContractAddressChain extends PathChain {

    @IsNotEmpty()
    @Length(34, 62)
    public contractAddress: string;

    @ValidateIf(o => o.chain !== Currency.SOL)
    @IsNotEmpty()
    @Length(1, 256)
    public tokenId: string;
}
