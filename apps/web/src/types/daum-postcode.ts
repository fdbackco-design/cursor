// Daum 우편번호 서비스 타입 정의

declare global {
  interface Window {
    daum: {
      Postcode: new (options: DaumPostcodeOptions) => DaumPostcodeService;
    };
  }
}

export interface DaumPostcodeData {
  zonecode: string;        // 새우편번호 (5자리)
  address: string;         // 기본주소
  addressEnglish: string;  // 기본주소(영문)
  addressType: 'R' | 'J';  // 주소타입 (R: 도로명, J: 지번)
  userSelectedType: 'R' | 'J'; // 사용자가 선택한 주소타입
  roadAddress: string;     // 도로명주소
  roadAddressEnglish: string; // 도로명주소(영문)
  jibunAddress: string;    // 지번주소
  jibunAddressEnglish: string; // 지번주소(영문)
  autoRoadAddress: string; // 도로명주소(법정동/법정리 표시)
  autoJibunAddress: string; // 지번주소(법정동/법정리 표시)
  buildingCode: string;    // 건물관리번호
  buildingName: string;    // 건물명
  apartment: 'Y' | 'N';    // 공동주택 여부
  sido: string;           // 시도
  sigungu: string;        // 시군구
  sigunguCode: string;    // 시군구코드
  roadnameCode: string;   // 도로명코드
  bcode: string;          // 법정동/법정리코드
  roadname: string;       // 도로명
  bname: string;          // 법정동/법정리명
  bname1: string;         // 법정리의 읍/면 이름
  bname2: string;         // 법정동/법정리명
  hname: string;          // 행정동명
  query: string;          // 검색어
}

export interface DaumPostcodeOptions {
  oncomplete?: (data: DaumPostcodeData) => void;
  onclose?: (state: 'FORCE_CLOSE' | 'COMPLETE_CLOSE') => void;
  onresize?: (size: { width: number; height: number }) => void;
  onsearch?: (data: { count: number; keyword: string; errorMessage: string }) => void;
  width?: number | string;
  height?: number | string;
  animation?: boolean;
  focusInput?: boolean;
  hideMapBtn?: boolean;
  hideEngBtn?: boolean;
  alwaysShowEngAddr?: boolean;
  zonecodeOnly?: boolean;
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

export interface DaumPostcodeService {
  open: (options?: { 
    popupName?: string; 
    left?: number; 
    top?: number; 
    autoClose?: boolean;
  }) => void;
  embed: (element: HTMLElement, options?: { autoClose?: boolean }) => void;
}
