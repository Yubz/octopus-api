import { PositionEventDto } from './position-event.dto';
import { PositionInfoDto } from './position-info.dto';

export class PositionDto {
	id: number;
	owner: string;
	mintTimestamp: number;
	token0: string;
	token1: string;
	fee: string;
	tickSpacing: string;
	extension: string;
	boundLowerMag: string;
	boundLowerSign: string;
	boundUpperMag: string;
	boundUpperSign: string;
	positionInfo?: PositionInfoDto;
	positionEvents?: PositionEventDto[];
}
