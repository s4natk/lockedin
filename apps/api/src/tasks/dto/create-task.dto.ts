import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(1)
  categoryId: string;

  @IsInt()
  @Min(1)
  @Max(20)
  estimatedSessions: number;
}
