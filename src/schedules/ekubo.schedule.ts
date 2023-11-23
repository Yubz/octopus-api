import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../services/prisma.service';
import { Event, RpcProvider, hash, num } from 'starknet';
import { env } from 'process';
import { BigNumber } from '@ethersproject/bignumber';

@Injectable()
export class EkuboSchedule {
	private readonly POSITIONS = '0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067';
	private readonly POSITION_MINTED_KEY = num.toHex(hash.starknetKeccak('PositionMinted'));
	private readonly DEPOSIT_KEY = num.toHex(hash.starknetKeccak('Deposit'));
	private readonly WITHDRAW_KEY = num.toHex(hash.starknetKeccak('Withdraw'));
	private readonly rpcProvider: RpcProvider;

	constructor(private readonly prismaService: PrismaService) {
		this.rpcProvider = new RpcProvider({ nodeUrl: env.STARKNET_RPC_URL });
	}

	@Interval(1000 * 60 * 5) // 5 minutes
	private async fetchPositions(): Promise<void> {
		let lastBlockSavedDatabase = (await this.prismaService.getLastBlockSaved())?.value;
		if (!lastBlockSavedDatabase) {
			await this.prismaService.createLastBlockSaved(Number(env.LAST_BLOCK_SAVED));
			lastBlockSavedDatabase = env.LAST_BLOCK_SAVED;
		}
		const lastBlockStarknet = (await this.rpcProvider.getBlock('latest')).block_number;
		const fromBlock = Number(lastBlockSavedDatabase);
		if (lastBlockStarknet <= fromBlock) return;
		const toBlock = Math.min(lastBlockStarknet, fromBlock + 999);
		const events = await this.fetchEvents(fromBlock, toBlock);

		console.log(`fetching from ${fromBlock} to block ${toBlock}`);
		for (let index = 0; index < events.length; index++) {
			const event = events[index];
			switch (event.keys[0]) {
				case this.POSITION_MINTED_KEY:
					await this.handlePositionMinted(event);
					break;
				case this.DEPOSIT_KEY:
					await this.handleDeposit(event);
					break;
				case this.WITHDRAW_KEY:
					await this.handleWithdraw(event);
					break;
				default:
					break;
			}
		}
		console.log(`done fetching`);
		await this.prismaService.updateLastBlockSaved(toBlock + 1);
	}

	private async fetchEvents(fromBlock: number, toBlock: number): Promise<Array<Event>> {
		const events: Event[] = [];
		let continuationToken: string | undefined;
		do {
			const result = await this.rpcProvider.getEvents({
				address: this.POSITIONS,
				from_block: { block_number: fromBlock },
				to_block: { block_number: toBlock },
				chunk_size: 1000,
				keys: [[this.POSITION_MINTED_KEY, this.DEPOSIT_KEY, this.WITHDRAW_KEY]],
				continuation_token: continuationToken,
			});

			events.push(...result.events);

			continuationToken = result.continuation_token;
		} while (continuationToken);

		return events;
	}

	private async handlePositionMinted(event: Event): Promise<void> {
		const tx = await this.rpcProvider.getTransactionByHash(event['transaction_hash']);
		const block = await this.rpcProvider.getBlock(event['block_number']);
		await this.prismaService.addPosition(
			BigNumber.from(event.data[0]).toNumber(),
			tx['sender_address'],
			block.timestamp,
			event.data[1],
			event.data[2],
			event.data[3],
			event.data[4],
			event.data[5],
			event.data[6],
			event.data[7],
			event.data[8],
			event.data[9],
		);
	}

	private async handleDeposit(event: Event): Promise<void> {
		await this.prismaService.addPositionEvent(
			BigNumber.from(event.data[0]).toNumber(),
			`${event['block_number']}_${event['transaction_hash']}_1`,
			event.data[11],
			event.data[13],
			true,
		);
	}

	private async handleWithdraw(event: Event): Promise<void> {
		await this.prismaService.addPositionEvent(
			BigNumber.from(event.data[0]).toNumber(),
			`${event['block_number']}_${event['transaction_hash']}_0`,
			event.data[11],
			event.data[13],
			false,
		);
	}
}
