import { Injectable } from '@nestjs/common';
import { constants, Provider, Contract } from 'starknet';
import { GetTokenInfoRequest, GetTokenInfoResult, Token, TokenPrice } from '../models/ekubo.model';
import { env } from 'process';
import { PositionDto } from '../dto/position.dto';

@Injectable()
export class EkuboService {
	private readonly POSITIONS = '0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067';

	/******************************************************************************************************************************/
	/* Ekubo SC *******************************************************************************************************************/
	/******************************************************************************************************************************/

	getPositionsInfo = async (request: Array<GetTokenInfoRequest>): Promise<Array<GetTokenInfoResult>> => {
		const ekuboContract = await this.initEkuboContract(this.POSITIONS);
		const results = await ekuboContract.get_tokens_info(request);

		return results.map((result: GetTokenInfoResult, index: number) => {
			return { ...result, id: request[index].id };
		});
	};

	private initEkuboContract = async (ekuboAddress: string): Promise<Contract> => {
		const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_MAIN }, rpc: { nodeUrl: env.STARKNET_RPC_URL } });
		const { abi: ekuboAbi } = await provider.getClassAt(ekuboAddress);
		if (ekuboAbi === undefined) {
			throw new Error('no abi.');
		}
		return new Contract(ekuboAbi, ekuboAddress, provider);
	};

	/******************************************************************************************************************************/
	/* Ekubo API ******************************************************************************************************************/
	/******************************************************************************************************************************/

	getTokens = async (): Promise<Array<Token>> => {
		const tokens: Array<any> = await fetch('https://mainnet-api.ekubo.org/tokens').then((res) => res.json());
		for (let index = 0; index < tokens.length; index++) {
			tokens[index].price = await this.getTokenPriceUsd(tokens[index].l2_token_address);
		}
		return tokens;
	};

	private getTokenPriceUsd = async (address: string): Promise<TokenPrice> => {
		return await fetch('https://mainnet-api.ekubo.org/price/' + address + '/0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8').then((res) =>
			res.json(),
		);
	};

	/******************************************************************************************************************************/
	/* Ekubo Mappers **************************************************************************************************************/
	/******************************************************************************************************************************/

	map(position: PositionDto): GetTokenInfoRequest {
		return {
			id: position.id,
			pool_key: {
				extension: position.extension,
				fee: position.fee,
				tick_spacing: position.tickSpacing,
				token0: position.token0,
				token1: position.token1,
			},
			bounds: {
				lower: {
					mag: position.boundLowerMag,
					sign: position.boundLowerSign,
				},
				upper: {
					mag: position.boundUpperMag,
					sign: position.boundUpperSign,
				},
			},
		};
	}
}
