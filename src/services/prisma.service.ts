import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UtilsService } from './utils.service';
import { GetTokenInfoResult, Token } from '../models/ekubo.model';
import { PositionDto } from '../dto/position.dto';
import { MetadataDto } from '../dto/metadata.dto';
import { PositionEventDto } from '../dto/position-event.dto';
import { PositionService } from './position.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	private readonly METADATA_LAST_BLOCK_SAVED = 'last_bloc_saved';

	constructor(
		private readonly utilsService: UtilsService,
		private readonly positionService: PositionService,
	) {
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

	async getPositionById(id: number): Promise<PositionDto> {
		return this.position.findFirst({
			where: {
				id,
			},
			include: {
				positionEvents: true,
				positionInfo: true,
			},
		});
	}

	async getPositionsByAddress(owner: string): Promise<Array<PositionDto>> {
		return this.position.findMany({
			where: {
				owner,
			},
			include: {
				positionEvents: true,
				positionInfo: true,
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
		try {
			await this.position.delete({
				where: {
					id,
				},
			});
		} catch (error) {}
	}

	async updatePosition(positionInfos: GetTokenInfoResult, tokens: Array<Token>): Promise<void> {
		const position = await this.getPositionById(positionInfos.id);
		const positionCard = this.positionService.getPositionCard(position, positionInfos, tokens);
		if (!positionCard) return;

		const data = {
			amountUsd: positionCard.amountUsd,
			feesUsd: positionCard.feesUsd,
			pnlUsd: positionCard.pnlUsd,
			apr: positionCard.apr,
			feeApr: positionCard.feeApr,
			inRange: positionCard.inRange,
			durationInDays: positionCard.durationInDays,
		};

		await this.positionInfo.upsert({
			create: {
				...data,
				position: {
					connect: {
						id: position.id,
					},
				},
			},
			update: data,
			where: {
				positionId: position.id,
			},
		});
	}

	/******************************************************************************************************************************/
	/* PositionInfo ***************************************************************************************************************/
	/******************************************************************************************************************************/

	async deletePositionInfo(positionId: number): Promise<void> {
		try {
			await this.positionInfo.delete({
				where: {
					positionId,
				},
			});
		} catch (error) {}
	}

	/******************************************************************************************************************************/
	/* PositionEvent **************************************************************************************************************/
	/******************************************************************************************************************************/

	async deletePositionEvents(positionId: number): Promise<void> {
		try {
			await this.positionEvent.deleteMany({
				where: {
					positionId,
				},
			});
		} catch (error) {}
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
		} catch (error) {
			console.log(`Position ${positionId} not found.`);
		}
	}
}
