import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { PositionDto } from '../dto/position.dto';
import { PositionCardDto } from '../dto/position-card.dto';
import { PositionService } from '../services/position.service';

@Controller('position')
export class PositionController {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly positionService: PositionService,
	) {}

	@Get('id/:id')
	getPosition(@Param('id') id: string): Promise<PositionDto> {
		return this.prismaService.getPositionById(Number(id));
	}

	@Get('address/:address')
	async getPositionsByAddress(@Param('address') address: string): Promise<Array<PositionCardDto>> {
		const positions = await this.prismaService.getPositionsByAddress(address);
		return await this.positionService.getPositionCards(positions);
	}

	@Get('explore')
	getExplorePositions(): Promise<Array<PositionDto>> {
		return this.prismaService.getExplorePositions();
	}
}
