import { FOCUS_MODE_IDS, type FocusModeId } from '@lockedin/shared';
import { IsIn, IsInt, IsString, Max, Min, MinLength, ValidateIf } from 'class-validator';

export class StartSessionDto {
  @IsIn([...FOCUS_MODE_IDS])
  mode: FocusModeId;

  @IsString()
  @MinLength(1)
  taskId: string;

  @ValidateIf((dto: StartSessionDto) => dto.mode === 'custom')
  @IsInt()
  @Min(1)
  @Max(180)
  focusMinutes?: number;
}
