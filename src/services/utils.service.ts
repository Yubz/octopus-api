import { Injectable } from '@nestjs/common';
import { PositionDto } from '../dto/position.dto';
import { Token } from '../models/ekubo.model';
import { PositionEventDto } from '../dto/position-event.dto';
import { BigNumber } from '@ethersproject/bignumber';
import Decimal from 'decimal.js-light';

@Injectable()
export class UtilsService {
	chunkArray(array: Array<any>, size: number): Array<Array<any>> {
		const chunkedArr = [];
		for (let i = 0; i < array.length; i += size) {
			chunkedArr.push(array.slice(i, i + size));
		}
		return chunkedArr;
	}

	depositedAmountUsd(position: PositionDto, tokens: Array<Token>): number {
		if (!position || !position.positionEvents) return 0;
		const token0 = tokens.find((token) => token.l2_token_address.slice(-10) === position.token0.slice(-10)) as Token;
		const token1 = tokens.find((token) => token.l2_token_address.slice(-10) === position.token1.slice(-10)) as Token;
		if (!token0?.price?.price || !token1?.price?.price) return 0;

		const totalDepositedAmount0Usd = position.positionEvents.reduce((amount0: number, event: PositionEventDto) => {
			const amount = (Number(event.amount0) / 10 ** token0.decimals) * Number(token0.price.price);
			return event.isDeposit ? amount0 + amount : amount0;
		}, 0);
		const totalDepositedAmount1Usd = position.positionEvents.reduce((amount1: number, event: PositionEventDto) => {
			const amount = (Number(event.amount1) / 10 ** token1.decimals) * Number(token1.price.price);
			return event.isDeposit ? amount1 + amount : amount1;
		}, 0);

		return totalDepositedAmount0Usd + totalDepositedAmount1Usd;
	}

	withdrawedAmountUsd(position: PositionDto, tokens: Array<Token>): number {
		if (!position || !position.positionEvents) return 0;
		const token0 = tokens.find((token) => token.l2_token_address.slice(-10) === position.token0.slice(-10)) as Token;
		const token1 = tokens.find((token) => token.l2_token_address.slice(-10) === position.token1.slice(-10)) as Token;
		if (!token0?.price?.price || !token1?.price?.price) return 0;

		const totalWithdrawedAmount0Usd = position.positionEvents.reduce((amount0: number, event: PositionEventDto) => {
			const amount = (Number(event.amount0) / 10 ** token0.decimals) * Number(token0.price.price);
			return event.isDeposit ? amount0 : amount0 + amount;
		}, 0);
		const totalWithdrawedAmount1Usd = position.positionEvents.reduce((amount1: number, event: PositionEventDto) => {
			const amount = (Number(event.amount1) / 10 ** token1.decimals) * Number(token1.price.price);
			return event.isDeposit ? amount1 : amount1 + amount;
		}, 0);

		return totalWithdrawedAmount0Usd + totalWithdrawedAmount1Usd;
	}

	getPositionLiquidity(positionEvents: Array<PositionEventDto>): BigNumber {
		let liquidity = BigNumber.from(0);
		positionEvents.forEach((positionEvent: PositionEventDto) => {
			if (positionEvent.isDeposit) {
				liquidity = liquidity.add(BigNumber.from(positionEvent.liquidity));
			} else {
				liquidity = liquidity.sub(BigNumber.from(positionEvent.liquidity));
			}
		});
		return liquidity;
	}

	// Fonction pour calculer l'APR à partir du ROI (0.1 = 10%) et de T (en jours) pour un ROI simple
	calculateSimpleAPR = (ROI: number, T: number): number => {
		return !ROI ? 0 : (ROI / (T / 365)) * 1;
	};

	// Fonction pour calculer l'APR à partir du ROI (0.1 = 10%) et de T (en jours) pour un ROI composé
	calculateCompoundAPR = (ROI: number, T: number): number => {
		return Math.pow(1 + ROI, 1 / (T / 365)) - 1;
	};

	daysBetweenDates = (startDate: Date, endDate: Date): number => {
		// Convertir les deux dates en millisecondes
		const start = startDate.getTime();
		const end = endDate.getTime();

		// Calculer la différence en millisecondes
		const diff = end - start;

		// Convertir la différence en jours
		const days = diff / (1000 * 60 * 60 * 24);

		return days;
	};

	sqrtRatioToPrice = (sqrt_ratio: number): string => {
		return (Number(sqrt_ratio) ** 2 / 2 ** 256).toFixed(7);
	};

	tickToSqrtRatio = (tick: string): number => {
		Decimal.set({ precision: 78 });
		return new Decimal('1.000001').sqrt().pow(Number(tick)).mul(new Decimal(2).pow(128)).toNumber();
	};
}
