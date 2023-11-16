import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UtilsService } from './utils.service';
import { Position } from '../models/entities/position';
import { GetTokenInfoResult, Token } from '../models/protocols/ekubo.model';

@Injectable()
export class PositionsService extends PrismaClient implements OnModuleInit {
	constructor(private readonly utilsService: UtilsService) {
		super();
	}

	async onModuleInit() {}

	async getPositions(): Promise<Array<Position>> {
		return this['positions'].findMany() as unknown as Promise<Array<Position>>;
	}

	async getPosition(id: number): Promise<Position> {
		return this['positions'].findFirst({
			where: {
				id,
			},
		}) as unknown as Promise<Position>;
	}

	async updatePosition(positionsInfos: GetTokenInfoResult, tokens: Array<Token>): Promise<void> {
		const position = await this.getPosition(positionsInfos.id);
		if (!position) {
			console.log('Position not found', positionsInfos.id);
			return;
		}
		const token0 = tokens.find((token) => token.l2_token_address.slice(-10) === position.token0.slice(-10)) as Token;
		const token1 = tokens.find((token) => token.l2_token_address.slice(-10) === position.token1.slice(-10)) as Token;
		if (!token0 || !token1) {
			console.log('Tokens not found', positionsInfos.id);
			return;
		}
		const token0Price = Number(token0.price.price);
		const token1Price = Number(token1.price.price);
		const initialAmount0 = Number(position.initial_amount0) / 10 ** token0.decimals;
		const initialAmount1 = Number(position.initial_amount1) / 10 ** token1.decimals;
		const totalInitialAmountUsd = initialAmount0 * token0Price + initialAmount1 * token1Price;
		const totalCurrentAmountUsd =
			(Number(positionsInfos.amount0) / 10 ** token0.decimals) * token0Price + (Number(positionsInfos.amount1) / 10 ** token1.decimals) * token1Price;
		const totalFeesAmountUsd = (Number(positionsInfos.fees0) / 10 ** token0.decimals) * token0Price + (Number(positionsInfos.fees1) / 10 ** token1.decimals) * token1Price;
		const totalPnlUsd = totalCurrentAmountUsd + totalFeesAmountUsd - totalInitialAmountUsd;
		const durationPositionInDays = this.utilsService.daysBetweenDates(new Date(position.mint_timestamp * 1000), new Date());

		await this['positions'].update({
			where: {
				id: positionsInfos.id,
			},
			data: {
				sqrt_ratio: positionsInfos.pool_price.sqrt_ratio.toString(),
				fees0: positionsInfos.fees0.toString(),
				fees1: positionsInfos.fees1.toString(),
				amount0: positionsInfos.amount0.toString(),
				amount1: positionsInfos.amount1.toString(),
				total_initial_amount_usd: totalInitialAmountUsd,
				total_current_amount_usd: totalCurrentAmountUsd,
				total_fees_amount_usd: totalFeesAmountUsd,
				total_pnl_usd: totalPnlUsd,
				total_apr: this.utilsService.calculateSimpleAPR(totalPnlUsd / totalInitialAmountUsd, durationPositionInDays),
				fee_apr: this.utilsService.calculateSimpleAPR(totalFeesAmountUsd / totalInitialAmountUsd, durationPositionInDays),
			},
		});
	}
}
