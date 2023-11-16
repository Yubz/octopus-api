import { BigNumber } from '@ethersproject/bignumber';
import { CheckpointWriter, CheckpointWriters } from '@snapshot-labs/checkpoint';

export const writers: CheckpointWriters = {
	// handleDeploy will get invoked when a contract deployment
	// is found at a block
	handleDeploy: async (args) => {
		// we won't do anything at this time.
	},

	// handleDeposit will get invoked when a `Deposit` event
	// is found at a block
	handleDeposit: async ({ block, tx, rawEvent, mysql }: Parameters<CheckpointWriter>[0]) => {
		if (!rawEvent) return;

		const position = {
			id: BigNumber.from(rawEvent?.data[0]).toNumber(),
			owner: `${tx['sender_address']}`,
			mint_timestamp: block.timestamp,
			token0: rawEvent?.data[1],
			token1: rawEvent?.data[2],
			fee: rawEvent?.data[3],
			tick_spacing: rawEvent?.data[4],
			extension: rawEvent?.data[5],
			bound_lower_mag: rawEvent?.data[6],
			bound_lower_sign: rawEvent?.data[7],
			bound_upper_mag: rawEvent?.data[8],
			bound_upper_sign: rawEvent?.data[9],
			initial_amount0: BigNumber.from(rawEvent?.data[11]).toBigInt(),
			initial_amount1: BigNumber.from(rawEvent?.data[13]).toBigInt(),
		};

		await mysql.queryAsync('INSERT IGNORE INTO positions SET ?', [position]);
	},

	// handleWithdraw will get invoked when a `Withdraw` event
	// is found at a block
	handleWithdraw: async ({ rawEvent, mysql }: Parameters<CheckpointWriter>[0]) => {
		if (!rawEvent) return;

		await mysql.queryAsync('DELETE IGNORE FROM positions WHERE id = ?', [BigNumber.from(rawEvent?.data[0]).toNumber()]);
	},
};
