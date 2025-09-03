'use client';

import { useState } from 'react';
import { AddressSearchButton } from './address-search-button';
import { useToast, toast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';

export function AddressSearchDemo() {
  const { showToast } = useToast();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>주소 검색 데모</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주소 검색 결과
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={selectedAddress?.zone_number || ''}
              placeholder="우편번호"
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <AddressSearchButton
              onAddressSelected={(data) => {
                setSelectedAddress(data);
                //console.log('선택된 주소:', data);
              }}
              onError={(error) => {
                console.error('주소 검색 오류:', error);
                showToast(toast.error('주소 검색 오류', error));
              }}
            />
          </div>
        </div>

        {selectedAddress && (
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">기본 주소</label>
              <input
                type="text"
                value={selectedAddress.base_address}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">상세 주소</label>
              <input
                type="text"
                placeholder="상세 주소를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {selectedAddress.building_name && (
              <div className="text-sm text-gray-600">
                건물명: {selectedAddress.building_name}
              </div>
            )}
            
            {selectedAddress.sido && selectedAddress.sigungu && (
              <div className="text-sm text-gray-600">
                지역: {selectedAddress.sido} {selectedAddress.sigungu}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
