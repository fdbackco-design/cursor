import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);
  
  constructor(private prisma: PrismaService) {}

  // 사용자의 모든 배송지 조회
  async findAllByUserId(userId: string) {
    this.logger.log(`배송지 목록 조회 시작: userId=${userId}`);
    
    const addresses = await this.prisma.userAddress.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' }, // 기본 배송지가 먼저
        { createdAt: 'desc' },  // 최신 순
      ],
    });

    this.logger.log(`배송지 목록 조회 완료: userId=${userId}, 조회된 배송지 수=${addresses.length}`);
    this.logger.log(`조회된 배송지 ID 목록: ${addresses.map(addr => `${addr.id}(userId: ${addr.userId})`).join(', ')}`);

    return addresses;
  }

  // 특정 배송지 조회
  async findOne(id: string, userId: string) {
    const address = await this.prisma.userAddress.findFirst({
      where: {
        id,
        userId,
        isActive: true,
      },
    });

    if (!address) {
      throw new NotFoundException('배송지를 찾을 수 없습니다.');
    }

    return address;
  }

  // 배송지 생성
  async create(userId: string, createAddressDto: CreateAddressDto) {
    const { isDefault, ...addressData } = createAddressDto;

    // 기본 배송지로 설정하는 경우, 기존 기본 배송지 해제
    if (isDefault) {
      await this.prisma.userAddress.updateMany({
        where: {
          userId,
          isDefault: true,
          isActive: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await this.prisma.userAddress.create({
      data: {
        ...addressData,
        userId,
        isDefault: isDefault || false,
      },
    });

    return address;
  }

  // 배송지 수정
  async update(id: string, userId: string, updateAddressDto: UpdateAddressDto) {
    // 배송지 존재 확인
    const existingAddress = await this.findOne(id, userId);

    const { isDefault, ...addressData } = updateAddressDto;

    // 기본 배송지로 설정하는 경우, 기존 기본 배송지 해제
    if (isDefault && !existingAddress.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: {
          userId,
          isDefault: true,
          isActive: true,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedAddress = await this.prisma.userAddress.update({
      where: { id },
      data: {
        ...addressData,
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return updatedAddress;
  }

  // 배송지 삭제 (소프트 삭제)
  async remove(id: string, userId: string) {
    const address = await this.findOne(id, userId);

    // 기본 배송지인 경우 삭제 불가
    if (address.isDefault) {
      throw new BadRequestException('기본 배송지는 삭제할 수 없습니다. 다른 배송지를 기본으로 설정한 후 시도해주세요.');
    }

    await this.prisma.userAddress.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return { message: '배송지가 삭제되었습니다.' };
  }

  // 기본 배송지 설정
  async setDefault(id: string, userId: string) {
    const address = await this.findOne(id, userId);

    // 기존 기본 배송지 해제
    await this.prisma.userAddress.updateMany({
      where: {
        userId,
        isDefault: true,
        isActive: true,
        id: { not: id },
      },
      data: {
        isDefault: false,
      },
    });

    // 새로운 기본 배송지 설정
    const updatedAddress = await this.prisma.userAddress.update({
      where: { id },
      data: {
        isDefault: true,
      },
    });

    return updatedAddress;
  }

  // 사용자의 기본 배송지 조회
  async findDefaultByUserId(userId: string) {
    const defaultAddress = await this.prisma.userAddress.findFirst({
      where: {
        userId,
        isDefault: true,
        isActive: true,
      },
    });

    return defaultAddress;
  }
}
