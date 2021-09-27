import { Length } from 'class-validator';

export class Pagination {
  @Length(0, 50)
  public limit: string;

  @Length(0, 50)
  public next: string;
}
