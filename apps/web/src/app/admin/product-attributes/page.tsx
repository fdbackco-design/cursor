'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { 
  ArrowLeft,
  Save,
  Settings,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { useToast, toast } from '@/components/ui/toast';

export default function ProductAttributesPage() {
  const { showToast } = useToast();
  const [shortDescription, setShortDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 공통속성 데이터 로드
  const loadAttributes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/product-attributes', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShortDescription(data.data?.shortDescription || '');
        }
      }
    } catch (error) {
      console.error('공통속성 로드 실패:', error);
      showToast(toast.error('로드 실패', '공통속성을 불러오는데 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // 공통속성 저장
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch('/api/admin/product-attributes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          shortDescription: shortDescription
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showToast(toast.success('저장 완료', '상품 공통속성이 성공적으로 저장되었습니다.'));
        } else {
          throw new Error(data.error || '저장에 실패했습니다.');
        }
      } else {
        throw new Error('저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 실패:', error);
      showToast(toast.error('저장 실패', error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadAttributes();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 py-0">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">상품 공통속성 관리</h1>
            </div>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>상품 공통 설명</span>
              </CardTitle>
              <CardDescription>
                이 설명은 모든 상품의 상세 페이지에 공지사항으로 표시됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="h-4 w-4 inline mr-1" />
                    공통 설명
                  </label>
                  <textarea
                    id="shortDescription"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="모든 상품에 공통으로 표시될 설명을 입력하세요..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    이 내용은 상품 상세 페이지의 "공지사항" 섹션에 표시됩니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 미리보기 */}
          {shortDescription && (
            <Card>
              <CardHeader>
                <CardTitle>미리보기</CardTitle>
                <CardDescription>
                  상품 상세 페이지에서 어떻게 표시될지 미리보기입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-2xl font-semibold leading-none tracking-tight">공지사항</h3>
                  </div>
                  <div className="p-6 pt-0">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {shortDescription}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
