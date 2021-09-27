import { Length } from 'class-validator';

export class Pagenation {
  @Length(0, 50)
  public limit: string;

  @Length(0, 50)
  public next: string;
}
