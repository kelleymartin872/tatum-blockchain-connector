import { IsNotEmpty, Length } from 'class-validator';

export class PathFromTo {
  @IsNotEmpty()
  @Length(5, 50)
  public from: string;

  @IsNotEmpty()
  @Length(5, 50)
  public to: string;
}
