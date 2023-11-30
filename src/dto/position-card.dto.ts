export class PositionCardDto {
	id: number;
	owner: string;
	token0Symbol: string;
	token1Symbol: string;
	fee: number;
	tickSpacing: number;
	minPrice: string;
	maxPrice: string;
	currentPrice: string;
	amount0: number;
	amount1: number;
	amountUsd: number;
	depositedAmount0: number;
	depositedAmount1: number;
	inRange: boolean;
	feesUsd: number;
	pnlUsd: number;
	durationInDays: number;
	apr: number;
	feeApr: number;
}
