import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UtilsService } from './utils.service';
import { GetTokenInfoResult, Token } from '../models/ekubo.model';
import { PositionDto } from '../dto/position.dto';
import { MetadataDto } from '../dto/metadata.dto';
import { PositionEventDto } from '../dto/position-event.dto';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	private readonly METADATA_LAST_BLOCK_SAVED = 'last_bloc_saved';

	constructor(private readonly utilsService: UtilsService) {
		super();
	}

	async onModuleInit() {}

	async getLastBlockSaved(): Promise<MetadataDto> {
		return this.metadata.findFirst({
			where: { name: this.METADATA_LAST_BLOCK_SAVED },
		});
	}

	async createLastBlockSaved(blockNumber: number): Promise<void> {
		await this.metadata.create({
			data: { name: this.METADATA_LAST_BLOCK_SAVED, value: blockNumber.toString() },
		});
	}

	async updateLastBlockSaved(blockNumber: number): Promise<void> {
		await this.metadata.update({
			where: {
				name: this.METADATA_LAST_BLOCK_SAVED,
			},
			data: { value: blockNumber.toString() },
		});
	}

	async getPositions(): Promise<Array<PositionDto>> {
		return this.position.findMany();
	}

	async getExplorePositions(): Promise<Array<PositionDto>> {
		return this.position.findMany({
			include: {
				positionInfo: true,
				positionEvents: true,
			},
			orderBy: { positionInfo: { totalApr: 'desc' } },
			where: {
				positionInfo: {
					amountUsd: {
						gt: 500,
					},
				},
			},
		});
	}

	async getPosition(id: number): Promise<PositionDto> {
		return this.position.findFirst({
			where: {
				id,
			},
			include: {
				positionInfo: true,
				positionEvents: true,
			},
		});
	}

	async addPosition(
		id: number,
		owner: string,
		mintTimestamp: number,
		token0: string,
		token1: string,
		fee: string,
		tickSpacing: string,
		extension: string,
		boundLowerMag: string,
		boundLowerSign: string,
		boundUpperMag: string,
		boundUpperSign: string,
	): Promise<void> {
		try {
			await this.position.create({
				data: {
					id,
					owner,
					mintTimestamp,
					token0,
					token1,
					fee,
					tickSpacing,
					extension,
					boundLowerMag,
					boundLowerSign,
					boundUpperMag,
					boundUpperSign,
				},
			});
		} catch (error) {}
	}

	async addPositionEvent(positionId: number, idEvent: string, amount0: string, amount1: string, isDeposit: boolean): Promise<void> {
		try {
			await this.positionEvent.create({
				data: {
					id: idEvent,
					amount0,
					amount1,
					isDeposit,
					position: {
						connect: {
							id: positionId,
						},
					},
				},
			});
		} catch (error) {}
	}

	async updatePosition(positionsInfos: GetTokenInfoResult, tokens: Array<Token>): Promise<void> {
		const position = await this.getPosition(positionsInfos.id);
		if (!position) return;
		const token0 = tokens.find((token) => token.l2_token_address.slice(-10) === position.token0.slice(-10)) as Token;
		const token1 = tokens.find((token) => token.l2_token_address.slice(-10) === position.token1.slice(-10)) as Token;
		if (!token0?.price?.price || !token1?.price?.price) return;
		const token0Price = Number(token0.price.price);
		const token1Price = Number(token1.price.price);

		const totalDepositedAmount0Usd = position.positionEvents.reduce((amount0: number, event: PositionEventDto) => {
			const amount = (Number(event.amount0) / 10 ** token0.decimals) * token0Price;
			return event.isDeposit ? amount0 + amount : amount0;
		}, 0);
		const totalDepositedAmount1Usd = position.positionEvents.reduce((amount1: number, event: PositionEventDto) => {
			const amount = (Number(event.amount1) / 10 ** token1.decimals) * token1Price;
			return event.isDeposit ? amount1 + amount : amount1;
		}, 0);
		const totalWithdrawedAmount0Usd = position.positionEvents.reduce((amount0: number, event: PositionEventDto) => {
			const amount = (Number(event.amount0) / 10 ** token0.decimals) * token0Price;
			return event.isDeposit ? amount0 : amount0 + amount;
		}, 0);
		const totalWithdrawedAmount1Usd = position.positionEvents.reduce((amount1: number, event: PositionEventDto) => {
			const amount = (Number(event.amount1) / 10 ** token1.decimals) * token1Price;
			return event.isDeposit ? amount1 : amount1 + amount;
		}, 0);
		const totalDepositedAmountUsd = totalDepositedAmount0Usd + totalDepositedAmount1Usd;
		const totalWithdrawedAmountUsd = totalWithdrawedAmount0Usd + totalWithdrawedAmount1Usd;

		const amountUsd = (Number(positionsInfos.amount0) / 10 ** token0.decimals) * token0Price + (Number(positionsInfos.amount1) / 10 ** token1.decimals) * token1Price;
		const totalCurrentFeesUsd =
			(Number(positionsInfos.fees0) / 10 ** token0.decimals) * token0Price + (Number(positionsInfos.fees1) / 10 ** token1.decimals) * token1Price;
		const totalPnlUsd = totalWithdrawedAmountUsd + totalCurrentFeesUsd + amountUsd - totalDepositedAmountUsd;
		const totalFeesUsd = totalWithdrawedAmountUsd - totalDepositedAmountUsd + totalCurrentFeesUsd;
		const durationPositionInDays = this.utilsService.daysBetweenDates(new Date(position.mintTimestamp * 1000), new Date());

		const data = {
			sqrtRatio: positionsInfos.pool_price.sqrt_ratio.toString(),
			fees0: positionsInfos.fees0.toString(),
			fees1: positionsInfos.fees1.toString(),
			amount0: positionsInfos.amount0.toString(),
			amount1: positionsInfos.amount1.toString(),
			amountUsd: amountUsd,
			totalFeesUsd: totalFeesUsd,
			totalPnlUsd: totalPnlUsd,
			totalApr: this.utilsService.calculateSimpleAPR(totalPnlUsd / totalDepositedAmountUsd, durationPositionInDays),
			feeApr: this.utilsService.calculateSimpleAPR(totalFeesUsd / totalDepositedAmountUsd, durationPositionInDays),
		};
		await this.positionInfo.create({
			data: {
				...data,
				positionId: position.id,
			},
		});
	}
}
