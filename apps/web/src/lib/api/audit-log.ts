const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface AuditLogResponse {
  success: boolean;
  message: string;
  data: AuditLog[];
}

// 최근 활동 조회
export async function getRecentActivities(limit?: number): Promise<AuditLog[]> {
  try {
    const url = `${API_URL}/api/v1/audit-logs/recent${limit ? `?limit=${limit}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: AuditLogResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '최근 활동 조회에 실패했습니다.');
    }
    
    return result.data;
  } catch (error) {
    console.error('최근 활동 조회 API 호출 실패:', error);
    throw new Error(`최근 활동 조회에 실패했습니다. ${error instanceof Error ? error.message : ''}`);
  }
}

// 사용자별 감사 로그 조회
export async function getAuditLogsByUser(userId: string, limit?: number): Promise<AuditLog[]> {
  try {
    const url = `${API_URL}/api/v1/audit-logs/user/${userId}${limit ? `?limit=${limit}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: AuditLogResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '사용자별 감사 로그 조회에 실패했습니다.');
    }
    
    return result.data;
  } catch (error) {
    console.error('사용자별 감사 로그 조회 API 호출 실패:', error);
    throw new Error(`사용자별 감사 로그 조회에 실패했습니다. ${error instanceof Error ? error.message : ''}`);
  }
}

// 엔티티별 감사 로그 조회
export async function getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
  try {
    const url = `${API_URL}/api/v1/audit-logs/entity/${entityType}/${entityId}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: AuditLogResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '엔티티별 감사 로그 조회에 실패했습니다.');
    }
    
    return result.data;
  } catch (error) {
    console.error('엔티티별 감사 로그 조회 API 호출 실패:', error);
    throw new Error(`엔티티별 감사 로그 조회에 실패했습니다. ${error instanceof Error ? error.message : ''}`);
  }
}
