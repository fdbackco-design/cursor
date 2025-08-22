import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">회사정보</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link href="/about" className="hover:text-gray-900 transition-colors duration-200">
                  브랜드 소개
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-gray-900 transition-colors duration-200">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-gray-900 transition-colors duration-200">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-2xl font-extrabold text-gray-900 tracking-[1.5px]">FEEDBACK</span>
            </div>
            <div className="text-sm text-gray-500">
              © 2024 Feedback Shop. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;