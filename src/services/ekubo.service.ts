import { Injectable } from '@nestjs/common';
import { constants, Provider, Contract } from 'starknet';
import { GetTokenInfoRequest, GetTokenInfoResult, Token, TokenPrice } from '../models/ekubo.model';
import { env } from 'process';
import { Position } from '@prisma/client';

@Injectable()
export class EkuboService {
	private readonly POSITIONS_NFT = '0x07b696af58c967c1b14c9dde0ace001720635a660a8e90c565ea459345318b30';
	private readonly POSITIONS = '0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067';

	/******************************************************************************************************************************/
	/* Ekubo SC *******************************************************************************************************************/
	/******************************************************************************************************************************/

	getNextTokenId = async (): Promise<bigint> => {
		const ekuboContract = await this.initEkuboContract(this.POSITIONS_NFT);

		return ekuboContract.get_next_token_id();
	};

	getPositionInfo = async (request: Array<GetTokenInfoRequest>): Promise<Array<GetTokenInfoResult>> => {
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
		const tokens = await fetch('https://mainnet-api.ekubo.org/tokens').then((res) => res.json());
		tokens.forEach(async (token: Token) => {
			token.price = await this.getTokenPriceUsd(token.l2_token_address);
		});
		return tokens;
	};

	private getTokenPriceUsd = async (address: string): Promise<TokenPrice> => {
		return await fetch('https://mainnet-api.ekubo.org/price/' + address + '/0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8').then((res) => res.json());
	};

	/******************************************************************************************************************************/
	/* Ekubo Mappers **************************************************************************************************************/
	/******************************************************************************************************************************/

	map(position: Position): GetTokenInfoRequest {
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
