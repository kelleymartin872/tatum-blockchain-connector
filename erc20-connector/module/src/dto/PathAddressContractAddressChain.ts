import { IsNotEmpty, Length } from "class-validator";
import { PathChain } from "./PathChain";

export class PathAddressContractAddressChain extends PathChain {
  @IsNotEmpty()
  @Length(42, 62)
  public contractAddress: string;

  @IsNotEmpty()
  @Length(42, 62)
  public address: string;
}
