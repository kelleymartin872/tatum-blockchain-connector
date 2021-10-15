import {IsOptional} from 'class-validator';
import {PathAddressContractAddressChain} from './PathAddressContractAddressChain';

export class PathAddressContractAddressNonceChain extends PathAddressContractAddressChain {
    @IsOptional()
    public nonce?: string;
}
