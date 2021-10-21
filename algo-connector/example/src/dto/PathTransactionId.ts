import { IsNotEmpty, MaxLength } from 'class-validator';

export class PathTransactionId {

  @IsNotEmpty()
  @MaxLength(500)
  public txid: string;

}
