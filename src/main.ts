/* eslint-disable @typescript-eslint/no-var-requires */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from 'process';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	if (env.LOCALHOST) {
		app.enableCors({
			allowedHeaders: '*',
			origin: 'http://localhost:4200',
			credentials: true,
		});
	}

	await app.listen(3000);
}

bootstrap();
