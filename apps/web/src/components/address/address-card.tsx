'use client';

import { Button } from '@repo/ui';
import { Card, CardContent } from '@repo/ui';
import { MapPin, Phone, User, Edit, Trash2, Star } from 'lucide-react';
import { ShippingAddress } from '@/types/address';

interface AddressCardProps {
  address: ShippingAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isDefault?: boolean;
}

export function AddressCard({ 
  address, 
  onEdit, 
  onDelete, 
  onSetDefault,
  isDefault = false 
}: AddressCardProps) {
  return (
    <Card className={`relative ${isDefault ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''}`}>
      <CardContent className="p-4">
        {/* 기본 배송지 표시 */}
        {isDefault && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Star className="h-3 w-3 mr-1 fill-current" />
              기본 배송지
            </span>
          </div>
        )}

        <div className="space-y-3">
          {/* 배송지 이름 */}
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900">{address.name}</h3>
          </div>

          {/* 수령인 정보 */}
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">{address.receiver_name || address.receiverName}</span>
          </div>

          {/* 연락처 */}
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700">{address.receiver_phone_number1 || address.receiverPhoneNumber1}</span>
            {(address.receiver_phone_number2 || address.receiverPhoneNumber2) && (
              <span className="text-gray-500">/ {address.receiver_phone_number2 || address.receiverPhoneNumber2}</span>
            )}
          </div>

          {/* 주소 */}
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-gray-700">{address.base_address || address.baseAddress}</p>
              <p className="text-gray-700">{address.detail_address || address.detailAddress}</p>
              <p className="text-sm text-gray-500 mt-1">우편번호: {address.zone_number || address.zoneNumber}</p>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-3 w-3 mr-1" />
              수정
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
              <Trash2 className="h-3 w-3 mr-1" />
              삭제
            </Button>
          </div>
          
          {!isDefault && (
            <Button variant="ghost" size="sm" onClick={onSetDefault} className="text-blue-600 hover:text-blue-700">
              기본 배송지로 설정
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
