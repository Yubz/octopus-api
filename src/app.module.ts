import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from './services/prisma.service';
import { EkuboService } from './services/ekubo.service';
import { PositionController } from './controllers/position.controller';
import { UtilsService } from './services/utils.service';
import { PositionSchedule } from './schedules/position.schedule';
import { EkuboSchedule } from './schedules/ekubo.schedule';
import { PositionService } from './services/position.service';

@Module({
	imports: [ScheduleModule.forRoot(), HttpModule],
	controllers: [PositionController],
	providers: [PrismaService, EkuboService, UtilsService, PositionService, PositionSchedule, EkuboSchedule],
})
export class AppModule {}
