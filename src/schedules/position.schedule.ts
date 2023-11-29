import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { concatMap, from, map } from 'rxjs';
import { EkuboService } from '../services/ekubo.service';
import { PrismaService } from '../services/prisma.service';
import { UtilsService } from '../services/utils.service';
import { GetTokenInfoRequest, GetTokenInfoResult } from '../models/ekubo.model';
import { PositionDto } from '../dto/position.dto';

@Injectable()
export class PositionSchedule {
	constructor(
		private readonly ekuboService: EkuboService,
		private readonly prismaService: PrismaService,
		private readonly utilsService: UtilsService,
	) {}

	//@Cron('0 49 * * * *')
	private async fetchPositions(): Promise<void> {
		console.log('Fetching positions...');
		const tokens = await this.ekuboService.getTokens();
		from(this.prismaService.getPositions())
			.pipe(
				map((positions: Array<PositionDto>) => {
					return positions.filter((position) => {
						return this.utilsService.totalDepositedAmountUsd(position, tokens) - this.utilsService.totalWithdrawedAmountUsd(position, tokens) > 500;
					});
				}),
				map((positions: Array<PositionDto>) => {
					return this.utilsService.chunkArray(
						positions.map((position) => this.ekuboService.map(position)),
						50,
					);
				}),
				concatMap((requests: Array<Array<GetTokenInfoRequest>>) => from(requests)),
				concatMap((requests: Array<GetTokenInfoRequest>) => this.ekuboService.getPositionInfo(requests)),
				concatMap((positionsInfos: Array<GetTokenInfoResult>) => positionsInfos.map((positionInfos) => this.prismaService.updatePosition(positionInfos, tokens))),
			)
			.subscribe({
				next: () => {},
				error: (error) => {
					console.log(error);
				},
				complete: () => {
					console.log('Fetching positions done.');
				},
			});
	}
}
