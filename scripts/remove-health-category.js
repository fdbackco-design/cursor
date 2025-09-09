const { PrismaClient } = require('../packages/db/src/generated/client');

const prisma = new PrismaClient();

async function removeHealthCategory() {
  try {
    //console.log('건강기능식품 카테고리 및 관련 데이터 제거 시작...');

    // 1. 건강기능식품 카테고리 찾기
    const healthCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: 'health' },
          { name: '건강기능식품' },
          { name: '건강' }
        ]
      }
    });

    if (healthCategory) {
      //console.log(`건강기능식품 카테고리 발견: ${healthCategory.name} (ID: ${healthCategory.id})`);

      // 2. 해당 카테고리의 상품들 찾기
      const healthProducts = await prisma.product.findMany({
        where: {
          categoryId: healthCategory.id
        }
      });

      //console.log(`건강기능식품 상품 ${healthProducts.length}개 발견`);

      // 3. 상품들의 SKU 출력
      if (healthProducts.length > 0) {
        //console.log('제거될 상품들:');
        healthProducts.forEach(product => {
          //console.log(`- ${product.name} (SKU: ${product.sku})`);
        });
      }

      // 4. 상품들 삭제 (관련 데이터도 함께 삭제됨)
      if (healthProducts.length > 0) {
        await prisma.product.deleteMany({
          where: {
            categoryId: healthCategory.id
          }
        });
        //console.log(`${healthProducts.length}개의 건강기능식품 상품이 삭제되었습니다.`);
      }

      // 5. 건강기능식품 관련 벤더 찾기 및 삭제
      const healthVendors = await prisma.vendor.findMany({
        where: {
          OR: [
            { code: 'HEALTH' },
            { name: { contains: '헬스' } },
            { name: { contains: '건강' } }
          ]
        }
      });

      if (healthVendors.length > 0) {
        //console.log(`건강기능식품 관련 벤더 ${healthVendors.length}개 발견`);
        healthVendors.forEach(vendor => {
          //console.log(`- ${vendor.name} (Code: ${vendor.code})`);
        });

        await prisma.vendor.deleteMany({
          where: {
            OR: [
              { code: 'HEALTH' },
              { name: { contains: '헬스' } },
              { name: { contains: '건강' } }
            ]
          }
        });
        //console.log(`${healthVendors.length}개의 건강기능식품 관련 벤더가 삭제되었습니다.`);
      }

      // 6. 카테고리 삭제
      await prisma.category.delete({
        where: {
          id: healthCategory.id
        }
      });
      //console.log('건강기능식품 카테고리가 삭제되었습니다.');
    } else {
      //console.log('건강기능식품 카테고리를 찾을 수 없습니다.');
    }

    //console.log('건강기능식품 카테고리 및 관련 데이터 제거 완료!');
  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeHealthCategory();
