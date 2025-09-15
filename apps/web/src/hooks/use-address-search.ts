import { useCallback } from 'react';

// Daum 우편번호 서비스 타입 정의
interface DaumPostcodeData {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  sido: string;
  sigungu: string;
  bname: string;
  userSelectedType: 'R' | 'J';
}

interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeData) => void;
  onclose?: (state: string) => void;
  width?: number;
  height?: number;
  animation?: boolean;
  focusInput?: boolean;
  theme?: {
    bgColor?: string;
    searchBgColor?: string;
    contentBgColor?: string;
    pageBgColor?: string;
    textColor?: string;
    queryTextColor?: string;
    postcodeTextColor?: string;
    emphTextColor?: string;
    outlineColor?: string;
  };
}

export interface AddressSearchResult {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  sido: string;
  sigungu: string;
  bname: string;
}

// AddressSearchResult를 주소 폼 데이터로 변환하는 함수
export const convertToAddressFormData = (result: AddressSearchResult) => {
  return {
    zone_number: result.zonecode,
    base_address: result.address,
    road_address: result.roadAddress,
    jibun_address: result.jibunAddress,
    building_name: result.buildingName,
    sido: result.sido,
    sigungu: result.sigungu,
    bname: result.bname,
  };
};

interface UseAddressSearchOptions {
  onComplete: (result: AddressSearchResult) => void;
  onClose?: () => void;
  onError?: (error: string) => void;
}

export const useAddressSearch = ({ onComplete, onClose, onError }: UseAddressSearchOptions) => {
  const executeAddressSearch = useCallback(() => {
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
  }, [onComplete, onClose, onError]);

  const openAddressSearch = useCallback(() => {
    console.log('주소 검색 버튼 클릭됨');
    
    if (typeof window === 'undefined') {
      console.error('window 객체가 없음 (SSR 환경)');
      onError?.('주소 검색 서비스를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // Daum 우편번호 서비스가 이미 로드되어 있는지 확인
    if (window.daum?.Postcode) {
      console.log('Daum Postcode 서비스가 이미 로드됨, 주소 검색 실행');
      executeAddressSearch();
      return;
    }

    // 기존 스크립트가 있는지 확인하고 제거
    const existingScript = document.querySelector('script[src*="postcode.v2.js"]');
    if (existingScript) {
      console.log('기존 스크립트 제거');
      existingScript.remove();
    }

    console.log('Daum Postcode 스크립트 로드 시작');
    const script = document.createElement('script');
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
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
  }, [executeAddressSearch, onError]);

  return {
    openAddressSearch,
  };
};

// 🔹 export 유지
export default useAddressSearch;