/******************************************************************************************************************************/
/* Ekubo SC *******************************************************************************************************************/
/******************************************************************************************************************************/

export interface GetTokenInfoRequest {
	id: number;
	pool_key: PoolKey;
	bounds: Bounds;
}

export interface GetTokenInfoResult {
	id: number; // this property is not return by the Ekubo smart contract
	pool_price: PoolPrice;
	liquidity: bigint;
	amount0: bigint;
	amount1: bigint;
	fees0: bigint;
	fees1: bigint;
}

interface PoolPrice {
	sqrt_ratio: number;
	tick: Tick;
	call_points: CallPoints;
}

export interface CallPoints {
	after_initialize_pool: boolean;
	before_swap: boolean;
	after_swap: boolean;
	before_update_position: boolean;
	after_update_position: boolean;
}

interface Tick {
	mag: number;
	sign: boolean;
}

interface PoolKey {
	extension: string;
	fee: string;
	tick_spacing: string;
	token0: string;
	token1: string;
}

interface Bounds {
	lower: i129;
	upper: i129;
}

interface i129 {
	mag: string;
	sign: string;
}

/******************************************************************************************************************************/
/* Ekubo API ******************************************************************************************************************/
/******************************************************************************************************************************/

export interface Token {
	decimals: number;
	l2_token_address: string;
	name: string;
	sort_order: number;
	symbol: string;
	price: TokenPrice;
}

export interface TokenPrice {
	price: string;
	timestamp: Date;
}
