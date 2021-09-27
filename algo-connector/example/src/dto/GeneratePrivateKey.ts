import { IsNotEmpty, MaxLength } from 'class-validator';

export class GeneratePrivateKey {

  @IsNotEmpty()
  @MaxLength(500)
  public fromPrivateKey: string;

}
