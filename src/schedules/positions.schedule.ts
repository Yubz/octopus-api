import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { concatMap, from, map } from 'rxjs';
import { EkuboService } from '../services/ekubo.service';
import { PositionsService } from '../services/positions.service';
import { UtilsService } from '../services/utils.service';
import { Position } from '../models/entities/position';
import { GetTokenInfoRequest, GetTokenInfoResult } from '../models/protocols/ekubo.model';

@Injectable()
export class PositionsSchedule {
	constructor(
		private readonly ekuboService: EkuboService,
		private readonly positionsService: PositionsService,
		private readonly utilsService: UtilsService,
	) {}

	//@Cron('0 51 * * * *')
	async fetchPositions(): Promise<void> {
		const tokens = await this.ekuboService.getTokens();
		from(this.positionsService.getPositions())
			.pipe(
				map((positions: Array<Position>) =>
					this.utilsService.chunkArray(
						positions.map((position) => this.ekuboService.map(position)),
						50,
					),
				),
				concatMap((requests: Array<Array<GetTokenInfoRequest>>) => from(requests)),
				concatMap((requests: Array<GetTokenInfoRequest>) => this.ekuboService.getPositionInfos(requests)),
				concatMap((positionsInfos: Array<GetTokenInfoResult>) => positionsInfos.map((positionInfos) => this.positionsService.updatePosition(positionInfos, tokens))),
			)
			.subscribe({
				next: () => {},
				error: (error) => {},
				complete: () => {},
			});
	}
}
