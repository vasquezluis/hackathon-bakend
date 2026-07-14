import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../lib/database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';

@Injectable()
export class HackathonService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateHackathonDto) {
    return this.prisma.hackathon.create({
      data: {
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate,
        endDate: dto.endDate,
        isActive: dto.isActive ?? true,
        authorId: userId,
      },
    });
  }

  findAll() {
    return this.prisma.hackathon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.findHackathonEntity(id);
  }

  async findHackathonEntity(id: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id },
    });

    if (!hackathon) {
      throw new NotFoundException(`Hackathon with id "${id}" not found`);
    }

    return hackathon;
  }

  async join(hackathonId: string, userId: string) {
    const hackathon = await this.findHackathonEntity(hackathonId);

    if (!hackathon.isActive) {
      throw new BadRequestException(
        `Hackathon "${hackathon.name}" is not active`,
      );
    }

    if (new Date() > hackathon.endDate) {
      throw new BadRequestException(
        `Hackathon "${hackathon.name}" has already ended`,
      );
    }

    try {
      return await this.prisma.hackathonParticipant.create({
        data: {
          hackathonId,
          userId,
        },
        include: {
          hackathon: true,
          user: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'You have already joined this hackathon',
        );
      }
      throw error;
    }
  }

  update(id: string, dto: UpdateHackathonDto) {
    return this.prisma.hackathon.update({
      where: { id },
      data: dto,
    });
  }

  remove(id: string) {
    return this.prisma.hackathon.delete({ where: { id } });
  }
}
