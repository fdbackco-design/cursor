import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 피드백몰',
  description: '피드백몰의 개인정보처리방침입니다.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              슛문벤쳐스(이하 "회사")는 「개인정보 보호법」, 「정보통신망법」 등 관련 법령을 준수하며, 이용자의 개인정보를 안전하게 처리합니다.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. 수집·이용 목적</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>회원관리 및 본인확인(카카오 로그인)</li>
                <li>주문/결제/배송 및 고객지원</li>
                <li>서비스 개선, 부정이용 방지</li>
                <li>(선택) 이벤트·마케팅 정보 제공</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. 수집 항목</h2>
              <div className="space-y-6 text-gray-700">
                <div>
                  <h3 className="font-semibold mb-3 text-lg">(카카오 로그인) 카카오에서 제공받는 정보:</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <p>• <strong>이름</strong>: 필수</p>
                      <p>• <strong>카카오계정(전화번호)</strong>: 필수</p>
                      <p>• <strong>배송지정보</strong>:</p>
                      <div className="ml-4 space-y-1">
                        <p>  - 수령인명: 필수</p>
                        <p>  - 배송지 주소: 필수</p>
                        <p>  - 전화번호: 필수</p>
                      </div>
                      <p>• <strong>마케팅 수신 동의 (문자/알림톡)</strong>: 선택</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">(서비스 이용 시)</h3>
                  <p>주문/결제/배송 정보, 상담 기록, 접속 로그/기기 정보(쿠키 포함)</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">(선택)</h3>
                  <p>카카오 <strong>톡 메시지 수신 동의</strong> 상태</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <p className="text-sm text-blue-800">
                    <strong>※ 선택 항목 미동의 시에도 필수 서비스 이용은 가능하나, 일부 기능은 제한될 수 있습니다.</strong>
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. 보유·이용 기간</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>회원 탈퇴 시 지체 없이 파기</li>
                <li>단, 다음은 법령에 따라 보관</li>
              </ul>
              <div className="ml-6 mt-4 space-y-2 text-gray-700">
                <p>• 계약/청약철회/대금결제/재화공급 기록: <strong>5년</strong> (전자상거래법)</p>
                <p>• 소비자 불만/분쟁처리 기록: <strong>3년</strong> (전자상거래법)</p>
                <p>• 전자금융 거래 기록: <strong>5년</strong> (전자금융거래법)</p>
                <p>• 접속 로그 등 서비스 이용기록: <strong>3개월</strong> (통신비밀보호법)</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. 제3자 제공</h2>
              <p className="text-gray-700">
                회사는 원칙적으로 이용자 정보를 외부에 제공하지 않습니다. 다만 법령에 따른 요청 등 예외가 있을 수 있습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 처리위탁</h2>
              <p className="text-gray-700 mb-4">
                서비스 제공을 위해 다음 업체에 업무를 위탁하며, 계약 시 개인정보 보호 관련 제반 사항을 규정하고 준수합니다.
              </p>
              <div className="space-y-2 text-gray-700">
                <p>• 결제대행: <strong>토스페이먼츠(주)</strong> – 결제 처리 및 환불</p>
                <p>• 클라우드/저장: <strong>Amazon Web Services(AWS)</strong> – 인프라 운영(S3/EC2 등)</p>
                <p>• 배송사: 택배사(주문 시 안내) – 배송 업무</p>
                <p>• 메시지/알림: <strong>카카오(알림톡/톡 메시지)</strong> – 공지/안내 발송</p>
                <p>• 소셜 로그인: <strong>카카오</strong> – 회원 인증 및 로그인 서비스</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. 국외 이전</h2>
              <div className="space-y-2 text-gray-700">
                <p>• 현재 회사는 개인정보를 <strong>국외로 이전하지 않습니다.</strong> (AWS 서울 리전 사용)</p>
                <p>• 추후 국외 이전이 발생할 경우, 이전 항목·목적·보관 위치·기간 등을 사전 고지하고 동의를 받겠습니다.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. 이용자 권리</h2>
              <p className="text-gray-700">
                이용자는 언제든지 자신의 개인정보에 대해 열람·정정·삭제·처리정지 등을 요청할 수 있습니다.<br />
                <a href="mailto:joon@feedbackteams.com" className="text-blue-600 hover:text-blue-800 underline">연락처</a>를 통해 요청하시면 지체 없이 조치하겠습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. 파기 절차 및 방법</h2>
              <p className="text-gray-700">
                보유기간 경과 또는 처리 목적 달성 시 지체 없이 파기합니다.<br />
                전자파일은 복구·재생이 불가능한 방법으로 삭제합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. 쿠키의 사용</h2>
              <p className="text-gray-700">
                서비스 품질 개선을 위해 쿠키를 사용할 수 있으며, 브라우저 설정을 통해 저장을 거부할 수 있습니다. 다만 일부 기능이 제한될 수 있습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. 안전성 확보조치</h2>
              <p className="text-gray-700">
                접근권한 관리, 암호화 전송(HTTPS), 저장 데이터 보호, 접근기록 보관, 침입차단 등 기술·관리적 보호조치를 시행합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. 개인정보 보호책임자</h2>
              <div className="space-y-2 text-gray-700">
                <p>• 성명: <strong>안성준</strong></p>
                <p>• 연락처: <strong><a href="mailto:joon@feedbackteams.com" className="text-blue-600 hover:text-blue-800 underline">joon@feedbackteams.com</a> / 02-2088-4018</strong></p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. 고지 의무</h2>
              <p className="text-gray-700">
                본 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 웹사이트 공지를 통해 안내합니다.
              </p>
            </section>

            <div className="border-t pt-6 mt-8">
              <div className="flex justify-between text-sm text-gray-600">
                <p>시행일: <strong>2025-09-08</strong></p>
                <p>최종 개정일: <strong>2025-09-08</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
