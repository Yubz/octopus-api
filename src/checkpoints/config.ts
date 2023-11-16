import { env } from 'process';

export const CHECKPOINTS_CONFIG = {
	network_node_url: env.STARKNET_RPC_URL,
	sources: [
		{
			contract: '0x02e0af29598b407c8716b17f6d2795eca1b471413fa03fb145a5e33722184067',
			start: 169817,
			deploy_fn: 'handleDeploy',
			events: [
				{
					name: 'Deposit',
					fn: 'handleDeposit',
				},
				{
					name: 'Withdraw',
					fn: 'handleWithdraw',
				},
			],
		},
	],
};
