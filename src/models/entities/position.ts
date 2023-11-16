export class Position {
	id: number;
	owner: string;
	mint_timestamp: number;
	token0: string;
	token1: string;
	fee: string;
	tick_spacing: string;
	extension: string;
	bound_lower_mag: string;
	bound_lower_sign: string;
	bound_upper_mag: string;
	bound_upper_sign: string;
	initial_amount0: string;
	initial_amount1: string;
	sqrt_ratio: string;
	fees0: string;
	fees1: string;
	amount0: string;
	amount1: string;
	total_initial_amount_usd: number;
	total_current_amount_usd: number;
	total_fees_amount_usd: number;
	total_pnl_usd: number;
	total_apr: number;
	fee_apr: number;
}
