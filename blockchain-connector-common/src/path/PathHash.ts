import {IsNotEmpty, Length} from 'class-validator';

export class PathHash {
  @IsNotEmpty()
  @Length(1, 128)
  public hash: string;
}
