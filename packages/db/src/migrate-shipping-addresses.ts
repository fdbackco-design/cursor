#!/usr/bin/env ts-node

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateShippingAddresses() {
  //console.log('🚀 기존 사용자들의 shippingAddress를 UserAddress 테이블로 마이그레이션 시작...');

  try {
    // shippingAddress가 있고 UserAddress가 없는 사용자들 조회
    const usersWithShippingAddress = await prisma.user.findMany({
      where: {
        shippingAddress: {
          not: Prisma.JsonNull,
        },
        addresses: {
          none: {}, // UserAddress가 없는 사용자들
        },
      },
      select: {
        id: true,
        name: true,
        shippingAddress: true,
      },
    });

    //console.log(`📋 마이그레이션 대상 사용자: ${usersWithShippingAddress.length}명`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const user of usersWithShippingAddress) {
      try {
        const shippingAddress = user.shippingAddress as any;
        
        // shippingAddress 데이터 검증
        if (!shippingAddress || typeof shippingAddress !== 'object') {
          //console.log(`⚠️  사용자 ${user.id} (${user.name}): shippingAddress 데이터가 올바르지 않음`);
          skipCount++;
          continue;
        }

        // 필수 필드 확인
        const zoneNumber = shippingAddress.zone_number || '';
        const baseAddress = shippingAddress.base_address || '';

        if (!zoneNumber || !baseAddress) {
          //console.log(`⚠️  사용자 ${user.id} (${user.name}): 필수 필드 누락 (우편번호: ${zoneNumber}, 주소: ${baseAddress})`);
          skipCount++;
          continue;
        }

        // UserAddress 생성
        const addressData = {
          userId: user.id,
          name: '기본 배송지',
          receiverName: shippingAddress.receiver_name || user.name,
          receiverPhoneNumber1: shippingAddress.receiver_phone_number1 || '',
          receiverPhoneNumber2: shippingAddress.receiver_phone_number2 || undefined,
          zoneNumber: shippingAddress.zone_number,
          baseAddress: shippingAddress.base_address,
          detailAddress: shippingAddress.detail_address || '',
          isDefault: true,
          isActive: true,
        };

        await prisma.userAddress.create({
          data: addressData,
        });

        //console.log(`✅ 사용자 ${user.id} (${user.name}): 기본 배송지 생성 완료`);
        successCount++;

      } catch (error) {
        console.error(`❌ 사용자 ${user.id} (${user.name}): 마이그레이션 실패`, error);
        errorCount++;
      }
    }

    // console.log('\n🏁 마이그레이션 완료!');
    // console.log(`✅ 성공: ${successCount}명`);
    // console.log(`⚠️  스킵: ${skipCount}명`);
    // console.log(`❌ 실패: ${errorCount}명`);
    // console.log(`📊 총 처리: ${successCount + skipCount + errorCount}명`);

  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 직접 실행 시에만 실행
if (require.main === module) {
  migrateShippingAddresses()
    .then(() => {
      //console.log('🎉 마이그레이션이 성공적으로 완료되었습니다!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 마이그레이션 실패:', error);
      process.exit(1);
    });
}

export default migrateShippingAddresses;
