import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { catchError, concatMap, from, map } from 'rxjs';
import { EkuboService } from '../services/ekubo.service';
import { PrismaService } from '../services/prisma.service';
import { UtilsService } from '../services/utils.service';
import { GetTokenInfoRequest, GetTokenInfoResult } from '../models/ekubo.model';
import { PositionDto } from '../dto/position.dto';

@Injectable()
export class PositionSchedule {
	private isJobRunning = false;

	constructor(
		private readonly ekuboService: EkuboService,
		private readonly prismaService: PrismaService,
		private readonly utilsService: UtilsService,
	) {}

	//@Cron('0 34 * * * *')
	private async fetchPositions(): Promise<void> {
		if (this.isJobRunning) return;
		console.log('Fetching positions...');
		this.isJobRunning = true;
		const tokens = await this.ekuboService.getTokens();
		from(this.prismaService.getPositions())
			.pipe(
				map((positions: Array<PositionDto>) => {
					return this.utilsService.chunkArray(
						positions.map((position) => this.ekuboService.map(position)),
						50,
					);
				}),
				concatMap((requests: Array<Array<GetTokenInfoRequest>>) => from(requests)),
				concatMap((requests: Array<GetTokenInfoRequest>) => this.ekuboService.getPositionsInfo(requests)),
				concatMap((positionsInfos: Array<GetTokenInfoResult>) => positionsInfos.map((positionInfos) => positionInfos)),
				concatMap((positionInfos: GetTokenInfoResult) => this.prismaService.updatePosition(positionInfos, tokens)),
			)
			.subscribe({
				next: () => {},
				error: (error) => {
					console.log('Error fetching positions', error);
				},
				complete: () => {
					console.log('Fetching positions done.');
					this.isJobRunning = false;
				},
			});
	}
}
