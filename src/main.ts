/* eslint-disable @typescript-eslint/no-var-requires */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from 'process';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		allowedHeaders: '*',
		origin: env.OCTOPUS_DAPP_URL,
		credentials: true,
	});

	await app.listen(3000);
}

bootstrap();
