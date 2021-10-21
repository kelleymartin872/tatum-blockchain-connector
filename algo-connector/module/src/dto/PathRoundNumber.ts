import { IsNotEmpty, MaxLength } from 'class-validator';

export class PathRountNumber {

  @IsNotEmpty()
  @MaxLength(500)
  public roundNumber: string;

}
