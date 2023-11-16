import { Controller, Get } from '@nestjs/common';
import { PositionsService } from '../services/positions.service';
import { Position } from '../models/entities/position';

@Controller('positions')
export class PositionsController {
	constructor(private readonly positionsService: PositionsService) {}

	@Get()
	getPositions(): Promise<Array<Position>> {
		return this.positionsService['positions'].findMany({ where: { total_current_amount_usd: { gt: 500 } }, orderBy: { total_current_amount_usd: 'asc' } });
	}
}
