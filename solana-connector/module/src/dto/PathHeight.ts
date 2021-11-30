import { IsNumberString, Matches, IsNotEmpty } from 'class-validator';

export class PathHeight {
    @IsNotEmpty()
    @IsNumberString()
    @Matches(/[0-9]+/)
    public height: string;
}