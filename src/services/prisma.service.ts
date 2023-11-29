import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UtilsService } from './utils.service';
import { GetTokenInfoResult, Token } from '../models/ekubo.model';
import { PositionDto } from '../dto/position.dto';
import { MetadataDto } from '../dto/metadata.dto';
import { PositionEventDto } from '../dto/position-event.dto';
import { PositionInfoDto } from '../dto/position-info.dto';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	private readonly METADATA_LAST_BLOCK_SAVED = 'last_bloc_saved';

	constructor(private readonly utilsService: UtilsService) {
		super();
	}

	async onModuleInit() {}

	/******************************************************************************************************************************/
	/* Metadata *******************************************************************************************************************/
	/******************************************************************************************************************************/

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

	/******************************************************************************************************************************/
	/* Position *******************************************************************************************************************/
	/******************************************************************************************************************************/

	async getPositions(): Promise<Array<PositionDto>> {
		return this.position.findMany({
			include: {
				positionInfo: true,
				positionEvents: true,
			},
		});
	}

	async getPosition(id: number): Promise<PositionDto> {
		return this.position.findFirst({
			where: {
				id,
			},
		});
	}

	async getExplorePositions(): Promise<Array<PositionDto>> {
		return this.position.findMany({
			include: {
				positionInfo: true,
			},
			orderBy: { positionInfo: { apr: 'desc' } },
			where: {
				positionInfo: {
					amountUsd: {
						gt: 500,
					},
				},
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

	async deletePosition(id: number): Promise<void> {
		await this.deletePositionEvents(id);
		await this.deletePositionInfo(id);
		await this.position.delete({
			where: {
				id,
			},
		});
	}

	async updatePosition(positionInfos: GetTokenInfoResult, tokens: Array<Token>): Promise<void> {
		const position = await this.getPosition(positionInfos.id);
		if (!position) return;
		const token0 = tokens.find((token) => token.l2_token_address.slice(-10) === position.token0.slice(-10)) as Token;
		const token1 = tokens.find((token) => token.l2_token_address.slice(-10) === position.token1.slice(-10)) as Token;
		if (!token0?.price?.price || !token1?.price?.price) return;
		const token0Price = Number(token0.price.price);
		const token1Price = Number(token1.price.price);

		const totalDepositedAmountUsd = this.utilsService.totalDepositedAmountUsd(position, tokens);
		const totalWithdrawedAmountUsd = this.utilsService.totalWithdrawedAmountUsd(position, tokens);

		const currentPrice = this.utilsService.sqrtRatioToPrice(positionInfos.pool_price.sqrt_ratio);
		const minPrice = this.utilsService.sqrtRatioToPrice(this.utilsService.tickToSqrtRatio(position.boundLowerMag));
		const maxPrice = this.utilsService.sqrtRatioToPrice(this.utilsService.tickToSqrtRatio(position.boundUpperMag));

		const amountUsd = (Number(positionInfos.amount0) / 10 ** token0.decimals) * token0Price + (Number(positionInfos.amount1) / 10 ** token1.decimals) * token1Price;
		const totalCurrentFeesUsd =
			(Number(positionInfos.fees0) / 10 ** token0.decimals) * token0Price + (Number(positionInfos.fees1) / 10 ** token1.decimals) * token1Price;
		const pnlUsd = amountUsd - totalDepositedAmountUsd + totalCurrentFeesUsd;
		const feesUsd = totalCurrentFeesUsd;
		const durationInDays = this.utilsService.daysBetweenDates(new Date(position.mintTimestamp * 1000), new Date());

		const data = {
			amountUsd,
			feesUsd,
			pnlUsd,
			apr: this.utilsService.calculateSimpleAPR(pnlUsd / totalDepositedAmountUsd, durationInDays),
			feeApr: this.utilsService.calculateSimpleAPR(feesUsd / totalDepositedAmountUsd, durationInDays),
			inRange: Number(currentPrice) >= Number(minPrice) && Number(currentPrice) <= Number(maxPrice),
			durationInDays: durationInDays,
		};

		if (amountUsd > 500) {
			await this.positionInfo.upsert({
				create: {
					...data,
					positionId: position.id,
				},
				update: data,
				where: {
					positionId: position.id,
				},
			});
		}
	}

	/******************************************************************************************************************************/
	/* PositionInfo ***************************************************************************************************************/
	/******************************************************************************************************************************/

	async deletePositionInfo(positionId: number): Promise<void> {
		await this.positionInfo.delete({
			where: {
				positionId,
			},
		});
	}

	/******************************************************************************************************************************/
	/* PositionEvent **************************************************************************************************************/
	/******************************************************************************************************************************/

	async deletePositionEvents(positionId: number): Promise<void> {
		await this.positionEvent.deleteMany({
			where: {
				positionId,
			},
		});
	}

	async getPositionEvents(positionId: number): Promise<Array<PositionEventDto>> {
		return this.positionEvent.findMany({
			where: {
				positionId,
			},
		});
	}

	async addPositionEvent(positionId: number, idEvent: string, liquidity: string, amount0: string, amount1: string, isDeposit: boolean): Promise<void> {
		try {
			await this.positionEvent.create({
				data: {
					id: idEvent,
					amount0,
					amount1,
					liquidity,
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
}
