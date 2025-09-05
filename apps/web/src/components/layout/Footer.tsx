import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* 고객센터 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">고객센터</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link href="/contact" className="hover:text-gray-900 transition-colors duration-200">
                  문의하기
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="hover:text-gray-900 transition-colors duration-200">
                  배송 안내
                </Link>
              </li>
              <li>
                <Link href="/return" className="hover:text-gray-900 transition-colors duration-200">
                  교환/반품
                </Link>
              </li>
            </ul>
          </div>

          {/* 회사정보 → 사업자 정보 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">사업자 정보</h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>상호명: 슛문벤쳐스</li>
              <li>사업자등록번호: 519-09-02179</li>
              <li>대표이사: 안성준</li>
              <li>사업장 위치: 인천광역시 연수구 랜드마크로20, 101동 2305호</li>
              <li>통신판매업신고번호: 제2025-인천연수구-2013호</li>
              <li>대표전화: 02-2088-4018</li>
            </ul>
          </div>
        </div>
        
        {/* 하단 바 */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* <div className="mb-4 md:mb-0">
              <span className="text-2xl font-extrabold text-gray-900 tracking-[1.5px]">FEEDBACK</span>
            </div> */}
            <Link href="/" className="flex items-center">
              <span className="text-lg sm:text-2xl font-normal text-black italic" style={{ 
                fontFamily: 'Georgia, "Times New Roman", serif',
                letterSpacing: '-0.5px'
              }}>
                feedbackmall
              </span>
            </Link>
            <div className="text-sm text-gray-500">
              © 2025 Feedbackmall. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;