'use client';

import { useState } from 'react';
import { Button } from '@repo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { X, MapPin } from 'lucide-react';
import { AddressFormData } from '@/types/address';
import { AddressSearchButton } from './address-search-button';
import { useToast, toast } from '@/components/ui/toast';

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => Promise<void>;
  initialData?: AddressFormData;
  title?: string;
}

export function AddressFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData,
  title = "배송지 추가"
}: AddressFormModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<AddressFormData>(
    initialData || {
      name: '',
      receiver_name: '',
      receiver_phone_number1: '',
      receiver_phone_number2: '',
      zone_number: '',
      base_address: '',
      detail_address: '',
      is_default: false,
    }
  );
  const [loading, setLoading] = useState(false);

  // 주소 검색 결과 처리
  const handleAddressSelected = (addressData: {
    zone_number: string;
    base_address: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      zone_number: addressData.zone_number,
      base_address: addressData.base_address,
    }));
    
    // 주소 검색 후 상세 주소 입력 필드에 포커스
    setTimeout(() => {
      const detailAddressInput = document.querySelector('input[placeholder="상세 주소를 입력하세요"]') as HTMLInputElement;
      if (detailAddressInput) {
        detailAddressInput.focus();
      }
    }, 100);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('배송지 저장 실패:', error);
      showToast(toast.error('배송지 저장 실패', '배송지 저장에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              {title}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 배송지 기본 정보 */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">배송지 정보</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    배송지 이름 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="배송지 이름을 입력하세요 (예: 집, 회사)"
                  />
                </div>
              </div>

              {/* 수령인 정보 */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">수령인 정보</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    수령인 이름 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.receiver_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, receiver_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="수령인 이름을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    휴대폰 번호 *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.receiver_phone_number1}
                    onChange={(e) => setFormData(prev => ({ ...prev, receiver_phone_number1: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="010-0000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    추가 연락처
                  </label>
                  <input
                    type="tel"
                    value={formData.receiver_phone_number2 || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, receiver_phone_number2: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="추가 연락처 (선택사항)"
                  />
                </div>
              </div>

              {/* 주소 정보 */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">배송 주소</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    우편번호 *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      required
                      value={formData.zone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, zone_number: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="우편번호"
                      readOnly
                    />
                    <AddressSearchButton 
                      onAddressSelected={handleAddressSelected}
                      onError={(error) => showToast(toast.error('주소 검색 오류', error))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    기본 주소 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.base_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, base_address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="기본 주소"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상세 주소 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.detail_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, detail_address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="상세 주소를 입력하세요"
                  />
                </div>
              </div>

              {/* 기본 배송지 설정 */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_default" className="text-sm text-gray-700">
                  기본 배송지로 설정
                </label>
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={loading}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? '저장 중...' : '저장'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
