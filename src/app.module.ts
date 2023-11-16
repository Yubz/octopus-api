import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { PositionsService } from './services/positions.service';
import { EkuboService } from './services/ekubo.service';
import { PositionsController } from './controllers/positions.controller';
import { UtilsService } from './services/utils.service';
import { PositionsSchedule } from './schedules/positions.schedule';

@Module({
	imports: [ScheduleModule.forRoot(), HttpModule],
	controllers: [PositionsController],
	providers: [PositionsService, EkuboService, UtilsService, PositionsSchedule],
})
export class AppModule {}
