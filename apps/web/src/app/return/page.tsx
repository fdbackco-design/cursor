'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ArrowLeft, AlertTriangle, Clock, CreditCard, Shield, FileText, Phone } from 'lucide-react';
import Link from 'next/link';

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">교환 · 반품 정책</h1>
          <p className="text-gray-600 mt-2">
            고객님의 권익 보호를 위한 교환 및 반품 정책을 안내드립니다.
          </p>
        </div>

        <div className="space-y-8">
          {/* 1. 취소 및 반품 구분 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                1. 취소 및 반품 구분
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-2">📋 주문 취소</h3>
                  <p className="text-blue-700 text-sm">
                    결제 후 상품 준비 또는 발송 전까지 가능합니다.
                  </p>
                  <p className="text-blue-600 text-sm font-medium mt-2">
                    ✅ 비용 발생하지 않음
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-900 mb-2">📦 반품 요청</h3>
                  <p className="text-orange-700 text-sm">
                    상품 준비 중 또는 배송 후에 가능합니다.
                  </p>
                  <p className="text-orange-600 text-sm font-medium mt-2">
                    ⚠️ 사유에 따라 비용 부담
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. 반품 사유별 비용 부담 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                2. 반품 사유별 비용 부담
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-green-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    판매자 귀책 사유
                  </h3>
                  <ul className="space-y-2 text-sm text-green-700">
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      상품 불량 및 품질 문제
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      오배송 (다른 상품 발송)
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      상품 설명과 상이한 경우
                    </li>
                  </ul>
                  <div className="mt-3 p-2 bg-green-100 rounded text-sm font-medium text-green-800">
                    💰 판매자가 왕복 배송비 부담
                  </div>
                </div>

                <div className="border border-red-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    고객 귀책 사유
                  </h3>
                  <ul className="space-y-2 text-sm text-red-700">
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      단순 변심 및 사이즈 불만족
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      색상, 디자인 불만족
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      고객 실수로 인한 주문
                    </li>
                  </ul>
                  <div className="mt-3 p-2 bg-red-100 rounded text-sm font-medium text-red-800">
                    💸 고객이 왕복 배송비 부담
                    <br />
                    <span className="text-xs">
                      * 무료 배송 시 초도 배송비도 환불 금액에서 차감
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. 환불 가능 기한 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-purple-600" />
                3. 환불 가능 기한
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                    7
                  </div>
                  <h3 className="font-semibold text-purple-900">수령일로부터 7일 이내</h3>
                </div>
                <ul className="space-y-2 text-sm text-purple-700 ml-11">
                  <li>• 반품 신청 가능 기간</li>
                  <li>• 물리적 또는 전자적 훼손이 없는 경우</li>
                  <li>• 해당 기간 내 신청 시 반품 절차 진행</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 4. 구매자 책임에 해당하는 상황 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                4. 반품 제한 대상
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-3">
                  🚫 다음의 경우 반품이 제한됩니다
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-sm text-red-700">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">×</span>
                      제품 또는 포장의 훼손
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">×</span>
                      구성품 누락
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">×</span>
                      사용 흔적이 있는 경우
                    </li>
                  </ul>
                  <ul className="space-y-2 text-sm text-red-700">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">×</span>
                      재판매 불가 상태
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">×</span>
                      고객님의 책임으로 가치 훼손
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-2">×</span>
                      맞춤 제작 상품
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. 자동 환불 시스템 안내 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-600" />
                5. 자동 환불 시스템 안내
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">🤖 자동 환불 처리</h3>
                <p className="text-blue-700 text-sm mb-3">
                  물품 회수가 지연되거나 시스템 오류 시, 일정 수준에서 자동 환불이 처리될 수 있습니다.
                </p>
                <div className="bg-blue-100 p-3 rounded text-sm">
                  <p className="text-blue-800 font-medium">
                    📋 판매자 이의 제기 권한
                  </p>
                  <p className="text-blue-700">
                    상태 확인 후 필요 시 증빙자료와 함께 이의 제기 가능
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 6. 예외 및 이의 제기 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-yellow-600" />
                6. 예외 및 이의 제기
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-3">
                  📸 검수 후 문제 발견 시
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-yellow-900">고객센터 접수</p>
                      <p className="text-yellow-700 text-sm">전화 또는 온라인 채널을 통해 문의</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-yellow-900">증빙자료 제출</p>
                      <p className="text-yellow-700 text-sm">사진, 영상 등 관련 자료 첨부</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-yellow-900">검토 및 처리</p>
                      <p className="text-yellow-700 text-sm">접수 후 신속한 검토 및 해결 진행</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 고객센터 안내 */}
          <Card className="bg-gray-900 text-white">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Phone className="h-5 w-5 mr-2" />
                고객센터 안내
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">📞 전화 문의</h3>
                  <p className="text-gray-300 text-sm mb-1">평일 10:00 - 19:00</p>
                  <p className="text-gray-300 text-sm">주말 및 공휴일 휴무</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">💬 온라인 문의</h3>
                  <p className="text-gray-300 text-sm mb-1">24시간 접수 가능</p>
                  <p className="text-gray-300 text-sm mb-1">영업일 내 답변</p>
                  <Link 
                    href="/contact" 
                    className="inline-block mt-2 bg-white text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    문의하기
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 페이지 하단 */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            본 정책은 전자상거래법 및 소비자보호법에 따라 운영됩니다.
          </p>
          <p className="text-gray-500 text-sm mt-1">
            마지막 업데이트: 2025년 9월 1일
          </p>
        </div>
      </div>
    </div>
  );
}
