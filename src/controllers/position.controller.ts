import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { PositionDto } from '../dto/position.dto';

@Controller('position')
export class PositionController {
	constructor(private readonly prismaService: PrismaService) {}

	@Get(':id')
	getPosition(@Param('id') id: string): Promise<PositionDto> {
		return this.prismaService.position.findUnique({ where: { id: Number(id) }, include: { positionInfo: true, positionEvents: true } });
	}

	@Get()
	getPositions(): Promise<Array<PositionDto>> {
		return this.prismaService.position.findMany({
			include: {
				positionInfo: true,
				positionEvents: true,
			},
			orderBy: { positionInfo: { totalApr: 'desc' } },
			where: {
				positionInfo: {
					totalCurrentAmountUsd: {
						gt: 100,
					},
				},
			},
		});
	}

	// return this.prismaService.position.findMany({ where: { total_current_amount_usd: { gt: 100 } }, orderBy: { total_current_amount_usd: 'asc' } });
}
