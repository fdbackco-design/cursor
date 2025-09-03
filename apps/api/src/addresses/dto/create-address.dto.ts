import { IsString, IsOptional, IsBoolean, IsNotEmpty, Length } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  name: string; // 배송지 별칭

  @IsString()
  @IsNotEmpty()
  receiverName: string; // 수령인 이름

  @IsString()
  @IsNotEmpty()
  @Length(10, 13)
  receiverPhoneNumber1: string; // 수령인 전화번호 1

  @IsString()
  @IsOptional()
  receiverPhoneNumber2?: string; // 수령인 전화번호 2

  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  zoneNumber: string; // 우편번호

  @IsString()
  @IsNotEmpty()
  baseAddress: string; // 기본 주소

  @IsString()
  @IsNotEmpty()
  detailAddress: string; // 상세 주소

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false; // 기본 배송지 여부
}
