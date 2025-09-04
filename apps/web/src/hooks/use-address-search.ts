'use client';

import { useCallback } from 'react';
import { DaumPostcodeData, DaumPostcodeOptions } from '@/types/daum-postcode';

// 🔹 export 추가
export interface AddressSearchResult {
  zonecode: string;      // 우편번호
  address: string;       // 기본 주소
  roadAddress: string;   // 도로명 주소
  jibunAddress: string;  // 지번 주소
  buildingName: string;  // 건물명
  sido: string;          // 시도
  sigungu: string;       // 시군구
  bname: string;         // 법정동명
}

interface UseAddressSearchOptions {
  onComplete: (result: AddressSearchResult) => void;
  onClose?: () => void;
  onError?: (error: string) => void;
}

export const useAddressSearch = ({ onComplete, onClose, onError }: UseAddressSearchOptions) => {
  const openAddressSearch = useCallback(() => {
    if (typeof window === 'undefined' || !window.daum?.Postcode) {
      onError?.('주소 검색 서비스를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    const options: DaumPostcodeOptions = {
      oncomplete: (data: DaumPostcodeData) => {
        const selectedAddress =
          data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;

        const result: AddressSearchResult = {
          zonecode: data.zonecode,
          address: selectedAddress,
          roadAddress: data.roadAddress,
          jibunAddress: data.jibunAddress,
          buildingName: data.buildingName,
          sido: data.sido,
          sigungu: data.sigungu,
          bname: data.bname,
        };

        onComplete(result);
      },
      onclose: (state) => {
        if (state === 'FORCE_CLOSE') {
          onClose?.();
        }
      },
      width: 500,
      height: 600,
      animation: true,
      focusInput: true,
      theme: {
        bgColor: '#FFFFFF',
        searchBgColor: '#F8F9FA',
        contentBgColor: '#FFFFFF',
        pageBgColor: '#FAFAFA',
        textColor: '#333333',
        queryTextColor: '#222222',
        postcodeTextColor: '#FA4256',
        emphTextColor: '#008BD3',
        outlineColor: '#E0E0E0',
      },
    };

    try {
      new window.daum.Postcode(options).open({
        autoClose: true,
        left: window.screen.width / 2 - 250,
        top: window.screen.height / 2 - 300,
      });
    } catch (error) {
      console.error('주소 검색 창 열기 실패:', error);
      onError?.('주소 검색 창을 열 수 없습니다. 잠시 후 다시 시도해주세요.');
    }
  }, [onComplete, onClose, onError]);

  return {
    openAddressSearch,
  };
};

// 🔹 export 유지
export const convertToAddressFormData = (result: AddressSearchResult) => {
  return {
    zone_number: result.zonecode,
    base_address: result.address,
    detail_address: '',
    road_address: result.roadAddress,
    jibun_address: result.jibunAddress,
    building_name: result.buildingName,
    sido: result.sido,
    sigungu: result.sigungu,
    bname: result.bname,
  };
};