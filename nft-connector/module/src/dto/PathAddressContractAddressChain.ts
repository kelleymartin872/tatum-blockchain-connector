import {IsNotEmpty, Length} from 'class-validator';
import {PathChain} from './PathChain';

export class PathAddressContractAddressChain extends PathChain {

    @IsNotEmpty()
    @Length(34, 43)
    public contractAddress: string;

    @IsNotEmpty()
    @Length(18, 62)
    public address: string;
}
