import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class AddToCartDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
