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
    console.log('주소 검색 버튼 클릭됨');
    
    if (typeof window === 'undefined') {
      console.error('window 객체가 없음 (SSR 환경)');
      onError?.('주소 검색 서비스를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // Daum 우편번호 서비스가 로드될 때까지 기다림
    const waitForDaumPostcode = (retries = 0): void => {
      console.log(`Daum Postcode 로드 확인 시도 ${retries + 1}/10`);
      console.log('window.daum:', window.daum);
      console.log('window.daum?.Postcode:', window.daum?.Postcode);
      
      if (window.daum?.Postcode) {
        console.log('Daum Postcode 서비스 로드 완료, 주소 검색 실행');
        // 서비스가 로드되었으면 주소 검색 실행
        executeAddressSearch();
      } else if (retries < 10) {
        console.log(`Daum Postcode 서비스 로드 대기 중... (${retries + 1}/10)`);
        // 10번까지 재시도 (총 1초 대기)
        setTimeout(() => waitForDaumPostcode(retries + 1), 100);
      } else {
        console.log('Daum Postcode 서비스 로드 실패, 동적 로드 시도');
        // 최대 재시도 횟수 초과 - 스크립트를 동적으로 로드 시도
        loadDaumPostcodeScript();
      }
    };

    // Daum 우편번호 서비스 스크립트 동적 로드
    const loadDaumPostcodeScript = (): void => {
      console.log('Daum Postcode 스크립트 동적 로드 시작');
      
      // 이미 스크립트가 로드 중인지 확인
      if (document.querySelector('script[src*="postcode.v2.js"]')) {
        console.log('기존 스크립트 발견, 로드 대기 중...');
        // 스크립트가 있지만 아직 로드되지 않은 경우, 다시 대기
        setTimeout(() => waitForDaumPostcode(0), 500);
        return;
      }

      console.log('새로운 Daum Postcode 스크립트 로드 시작');
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      script.onload = () => {
        console.log('Daum Postcode 스크립트 로드 완료');
        // 스크립트 로드 완료 후 주소 검색 실행
        setTimeout(() => executeAddressSearch(), 100);
      };
      script.onerror = () => {
        console.error('Daum Postcode 스크립트 로드 실패');
        onError?.('주소 검색 서비스를 불러올 수 없습니다. 네트워크 연결을 확인해주세요.');
      };
      
      document.head.appendChild(script);
    };

    const executeAddressSearch = () => {
      console.log('주소 검색 실행 시작');
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
        console.log('Daum Postcode 창 열기 시도');
        new window.daum.Postcode(options).open({
          autoClose: true,
          left: window.screen.width / 2 - 250,
          top: window.screen.height / 2 - 300,
        });
        console.log('Daum Postcode 창 열기 성공');
      } catch (error) {
        console.error('주소 검색 창 열기 실패:', error);
        onError?.('주소 검색 창을 열 수 없습니다. 잠시 후 다시 시도해주세요.');
      }
    };

    // Daum 우편번호 서비스 로드 대기 시작
    waitForDaumPostcode();
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