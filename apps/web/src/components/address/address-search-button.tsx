'use client';

import { Button } from '@repo/ui';
import { Search } from 'lucide-react';
import { useAddressSearch, convertToAddressFormData, type AddressSearchResult } from '@/hooks/use-address-search';
import { useToast, toast } from '@/components/ui/toast';

interface AddressSearchButtonProps {
  onAddressSelected: (data: {
    zone_number: string;
    base_address: string;
    road_address?: string;
    jibun_address?: string;
    building_name?: string;
    sido?: string;
    sigungu?: string;
    bname?: string;
  }) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  children?: React.ReactNode;
}

export function AddressSearchButton({
  onAddressSelected,
  onError,
  className,
  variant = 'outline',
  size = 'default',
  disabled = false,
  children,
}: AddressSearchButtonProps) {
  const { showToast } = useToast();
  const { openAddressSearch } = useAddressSearch({
    onComplete: (result: AddressSearchResult) => {
      //console.log('주소 검색 완료:', result);
      const addressData = convertToAddressFormData(result);
      onAddressSelected({
        zone_number: addressData.zone_number,
        base_address: addressData.base_address,
        road_address: addressData.road_address,
        jibun_address: addressData.jibun_address,
        building_name: addressData.building_name,
        sido: addressData.sido,
        sigungu: addressData.sigungu,
        bname: addressData.bname,
      });
    },
    onError: (error) => {
      console.error('주소 검색 에러:', error);
      if (onError) {
        onError(error);
      } else {
        showToast(toast.error('주소 검색 오류', error));
      }
    },
  });

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={openAddressSearch}
      disabled={disabled}
      className={className}
    >
      {children || (
        <>
          <Search className="h-4 w-4 mr-1" />
          주소 검색
        </>
      )}
    </Button>
  );
}
