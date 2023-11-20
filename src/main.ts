/* eslint-disable @typescript-eslint/no-var-requires */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import Checkpoint, { CheckpointOptions, LogLevel } from '@snapshot-labs/checkpoint';
import { writers } from './checkpoints/writers';
import { CHECKPOINTS_CONFIG } from './checkpoints/config';
const path = require('path');
const fs = require('fs');

const dir = __dirname.endsWith('dist/checkpoints') ? '../' : '';
const schemaFile = path.join(__dirname, `${dir}../src/checkpoints/schema.gql`);
const schema = fs.readFileSync(schemaFile, 'utf8');

async function bootstrap(checkpoint: Checkpoint) {
	const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

	/*
	app.enableCors({
		allowedHeaders: '*',
		origin: 'http://localhost:4200',
		credentials: true,
	});
	*/

	checkpoint.start();

	app.use('/graphql', checkpoint.graphql);

	await app.listen(3000);
}

async function checkpoint() {
	const checkpointOptions: CheckpointOptions = {
		logLevel: LogLevel.Info,
		prettifyLogs: true, // uncomment in dev local
	};

	const checkpoint = new Checkpoint(CHECKPOINTS_CONFIG, writers, schema, checkpointOptions);

	return checkpoint;
}

checkpoint().then((checkpoint) => bootstrap(checkpoint));
