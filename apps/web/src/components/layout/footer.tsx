const Footer = () => {
  return (
    <footer className="bg-[#000000] text-white">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 회사 기본 정보 */}
          <div>
            <h3 className="text-[20px] font-[700] mb-4 text-white font-['Noto_Sans_KR',sans-serif]">
              🛍️ FeedbackMall
            </h3>
            <div className="space-y-2 text-[14px] font-[400] text-[#999999] font-['Noto_Sans_KR',sans-serif]">
              <p>사업자등록번호: 519-09-02179 | 대표: 안성준</p>
              <p>상호명 및 호스팅 서비스 제공: 슛문벤쳐스</p>
              <p>인천광역시 연수구 랜드마크로 20</p>
              <p>대표: 안성준</p>
            </div>
          </div>

          {/* 고객 지원 */}
          <div>
            <h4 className="text-[16px] font-[500] mb-4 text-white font-['Noto_Sans_KR',sans-serif]">
              고객 지원
            </h4>
            <ul className="space-y-2 text-[14px] font-[400] text-[#999999] font-['Noto_Sans_KR',sans-serif]">
              <li className="hover:text-[#00A651] transition-colors duration-200 cursor-pointer">
                고객센터
              </li>
              <li className="hover:text-[#00A651] transition-colors duration-200 cursor-pointer">
                배송 안내
              </li>
              <li className="hover:text-[#00A651] transition-colors duration-200 cursor-pointer">
                반품/교환
              </li>
              <li className="hover:text-[#00A651] transition-colors duration-200 cursor-pointer">
                자주 묻는 질문
              </li>
            </ul>
          </div>

          {/* 회사 정보 */}
          <div>
            <h4 className="text-[16px] font-[500] mb-4 text-white font-['Noto_Sans_KR',sans-serif]">
              회사 정보
            </h4>
            <ul className="space-y-2 text-[14px] font-[400] text-[#999999] font-['Noto_Sans_KR',sans-serif]">
              <li className="hover:text-[#00A651] transition-colors duration-200 cursor-pointer">
                회사 소개
              </li>
              <li className="hover:text-[#00A651] transition-colors duration-200 cursor-pointer">
                이용약관
              </li>
              <li className="hover:text-[#00A651] transition-colors duration-200 cursor-pointer">
                개인정보처리방침
              </li>
              <li className="hover:text-[#00A651] transition-colors duration-200 cursor-pointer">
                채용 정보
              </li>
            </ul>
          </div>

          {/* 연락처 */}
          <div>
            <h4 className="text-[16px] font-[500] mb-4 text-white font-['Noto_Sans_KR',sans-serif]">
              연락처
            </h4>
            <ul className="space-y-2 text-[14px] font-[400] text-[#999999] font-['Noto_Sans_KR',sans-serif]">
              <li>📧 support@feedbackmall.com</li>
              <li>📞 1588-0000</li>
              <li>🕒 평일 09:00 - 18:00</li>
            </ul>
          </div>
        </div>

        {/* 하단 저작권 정보 */}
        <div className="border-t border-[#333333] mt-8 pt-8 text-center text-[12px] font-[500] text-[#999999] font-['Noto_Sans_KR',sans-serif]">
          <p>&copy; {new Date().getFullYear()} FeedbackMall. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;