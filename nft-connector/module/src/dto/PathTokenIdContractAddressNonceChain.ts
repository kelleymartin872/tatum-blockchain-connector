import {IsOptional} from 'class-validator';
import {PathTokenIdContractAddressChain} from './PathTokenIdContractAddressChain';

export class PathTokenIdContractAddressNonceChain extends PathTokenIdContractAddressChain {

    @IsOptional()
    public nonce?: string;
}
