import { Injectable } from '@nestjs/common';
import { PositionCardDto } from '../dto/position-card.dto';
import { PositionDto } from '../dto/position.dto';
import { EkuboService } from './ekubo.service';
import { GetTokenInfoResult, Token } from '../models/ekubo.model';
import { UtilsService } from './utils.service';

@Injectable()
export class PositionService {
	constructor(
		private readonly ekuboService: EkuboService,
		private readonly utilsService: UtilsService,
	) {}

	async getPositionCards(positions: Array<PositionDto>): Promise<Array<PositionCardDto>> {
		const tokens = await this.ekuboService.getTokens();
		const requests = positions.map((position) => this.ekuboService.map(position));
		const positionsInfo = await this.ekuboService.getPositionsInfo(requests);

		const positionCards: Array<PositionCardDto> = [];
		positions.forEach((position: PositionDto, index: number) => {
			const positionCard = this.getPositionCard(position, positionsInfo[index], tokens);
			if (positionCard) positionCards.push(positionCard);
		});

		return positionCards;
	}

	getPositionCard(position: PositionDto, getTokenInfoResult: GetTokenInfoResult, tokens: Array<Token>): PositionCardDto {
		if (!position || !position.positionEvents || !position.positionEvents.length) return null;
		const token0 = tokens.find((token) => token.l2_token_address.slice(-10) === position.token0.slice(-10)) as Token;
		const token1 = tokens.find((token) => token.l2_token_address.slice(-10) === position.token1.slice(-10)) as Token;
		if (!token0?.price?.price || !token1?.price?.price) return null;
		const token0Price = Number(token0.price.price);
		const token1Price = Number(token1.price.price);
		const amount0 = Number(getTokenInfoResult.amount0) / 10 ** token0.decimals;
		const amount1 = Number(getTokenInfoResult.amount1) / 10 ** token1.decimals;
		const currentPrice = this.utilsService.sqrtRatioToPrice(getTokenInfoResult.pool_price.sqrt_ratio);
		const minPrice = this.utilsService.sqrtRatioToPrice(BigInt(this.utilsService.tickToSqrtRatio(position.boundLowerMag)));
		const maxPrice = this.utilsService.sqrtRatioToPrice(BigInt(this.utilsService.tickToSqrtRatio(position.boundUpperMag)));
		const positionEventDeposit = position.positionEvents.find((positionEvent) => positionEvent.isDeposit);
		const depositedAmountUsd = this.utilsService.depositedAmountUsd(position, tokens);
		const withdrawedAmountUsd = this.utilsService.withdrawedAmountUsd(position, tokens);
		const amountUsd =
			(Number(getTokenInfoResult.amount0) / 10 ** token0.decimals) * token0Price + (Number(getTokenInfoResult.amount1) / 10 ** token1.decimals) * token1Price;
		const feesUsd =
			(Number(getTokenInfoResult.fees0) / 10 ** token0.decimals) * token0Price + (Number(getTokenInfoResult.fees1) / 10 ** token1.decimals) * token1Price;
		let pnlUsd = amountUsd - depositedAmountUsd + feesUsd;
		if (withdrawedAmountUsd > 0) pnlUsd += withdrawedAmountUsd;
		const durationInDays = this.utilsService.daysBetweenDates(new Date(position.mintTimestamp * 1000), new Date());

		return {
			id: position.id,
			owner: position.owner,
			token0Symbol: token0.symbol,
			token1Symbol: token1.symbol,
			fee: this.utilsService.getPoolFee(position.fee),
			tickSpacing: this.utilsService.getPoolTickSpacing(position.tickSpacing),
			currentPrice: currentPrice,
			minPrice: minPrice,
			maxPrice: maxPrice,
			amount0: amount0,
			amount1: amount1,
			amountUsd: amount0 * token0Price + amount1 * token1Price,
			feesUsd: feesUsd,
			pnlUsd: pnlUsd,
			depositedAmount0: Number(positionEventDeposit.amount0) / 10 ** token0.decimals,
			depositedAmount1: Number(positionEventDeposit.amount1) / 10 ** token1.decimals,
			apr: this.utilsService.calculateSimpleAPR(pnlUsd / depositedAmountUsd, durationInDays),
			feeApr: this.utilsService.calculateSimpleAPR(feesUsd / depositedAmountUsd, durationInDays),
			inRange: Number(currentPrice) >= Number(minPrice) && Number(currentPrice) <= Number(maxPrice),
			durationInDays: durationInDays,
		};
	}
}
