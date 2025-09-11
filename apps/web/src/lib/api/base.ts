const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://feedbackmall.com';

// 중복 요청 방지를 위한 캐시
const pendingRequests = new Map<string, Promise<ApiResponse<any>>>();

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 타임아웃을 지원하는 fetch 함수
function fetchWithTimeout(url: string, options: RequestInit, timeout = 30000): Promise<Response> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error('요청 시간이 초과되었습니다.'));
    }, timeout);

    fetch(url, { ...options, signal: controller.signal })
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          reject(new Error('요청 시간이 초과되었습니다.'));
        } else {
          reject(error);
        }
      });
  });
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}/api/v1${endpoint}`;
  const method = options.method || 'GET';
  const requestKey = `${method}:${url}:${JSON.stringify(options.body || {})}`;

  // GET 요청이 아닌 경우에만 중복 요청 방지 적용
  if (method !== 'GET' && pendingRequests.has(requestKey)) {

    return pendingRequests.get(requestKey)!;
  }

  const requestPromise = (async (): Promise<ApiResponse<T>> => {
    try {
      const defaultOptions: RequestInit = {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      const requestOptions = {
        ...defaultOptions,
        ...options,
        headers: {
          ...defaultOptions.headers,
          ...options.headers,
        },
      };


      
      const response = await fetchWithTimeout(url, requestOptions, 30000);
    


    if (!response.ok) {
      // 에러 응답도 JSON으로 파싱해서 메시지 추출
      try {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const data = await response.json();
    

    
    // 백엔드에서 이미 { success, data } 형태로 응답하는 경우 처리
    if (typeof data === 'object' && data !== null && 'success' in data) {
      return data;
    }
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API 요청 실패:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
})();

// POST/PUT/DELETE 요청의 경우 캐시에 저장하고 완료 후 제거
if (method !== 'GET') {
  pendingRequests.set(requestKey, requestPromise);
  
  // 요청 완료 후 캐시에서 제거
  requestPromise.finally(() => {
    pendingRequests.delete(requestKey);
  });
}

return requestPromise;
}
