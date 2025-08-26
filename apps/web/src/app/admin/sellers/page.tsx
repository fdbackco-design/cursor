'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { Button } from '@repo/ui';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  RefreshCw,
  Shield,
  ShieldOff
} from 'lucide-react';
import Link from 'next/link';
import { sellersApi } from '@/lib/api/sellers';
import { Seller } from '@/types/seller';

const SellersPage = () => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState('all');

  // 셀러 데이터 로드
  const loadSellers = async () => {
    try {
      setLoading(true);
      const data = await sellersApi.getAllSellers();
      setSellers(data);
    } catch (error) {
      console.error('셀러 로드 실패:', error);
      alert('셀러를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  // 셀러 삭제
  const handleDelete = async (id: string) => {
    if (confirm('정말로 이 셀러를 삭제하시겠습니까?')) {
      try {
        await sellersApi.deleteSeller(id);
        alert('셀러가 성공적으로 삭제되었습니다.');
        loadSellers(); // 목록 새로고침
      } catch (error) {
        console.error('셀러 삭제 실패:', error);
        alert('셀러 삭제에 실패했습니다.');
      }
    }
  };

  // 셀러 상태 토글
  const handleStatusChange = async (id: string) => {
    try {
      await sellersApi.toggleSellerStatus(id);
      alert('셀러 상태가 성공적으로 변경되었습니다.');
      loadSellers(); // 목록 새로고침
    } catch (error) {
      console.error('셀러 상태 변경 실패:', error);
      alert('셀러 상태 변경에 실패했습니다.');
    }
  };

  // 셀러 인증 상태 토글
  const handleVerificationChange = async (id: string) => {
    try {
      await sellersApi.toggleSellerVerification(id);
      alert('셀러 인증 상태가 성공적으로 변경되었습니다.');
      loadSellers(); // 목록 새로고침
    } catch (error) {
      console.error('셀러 인증 상태 변경 실패:', error);
      alert('셀러 인증 상태 변경에 실패했습니다.');
    }
  };

  // 필터링된 셀러 목록
  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = seller.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seller.representativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seller.phone.includes(searchTerm) ||
                         (seller.user?.email && seller.user.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' ? seller.isActive : !seller.isActive);
    const matchesVerification = selectedVerification === 'all' || 
                               (selectedVerification === 'verified' ? seller.isVerified : !seller.isVerified);
    
    return matchesSearch && matchesStatus && matchesVerification;
  });

  const statuses = ['all', 'active', 'inactive'];
  const verifications = ['all', 'verified', 'unverified'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">셀러를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                ← 뒤로가기
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">셀러 관리</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={loadSellers}
                className="flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                새로고침
              </Button>
              <Link href="/admin/sellers/new">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  새 셀러 등록
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="회사명, 대표자명, 전화번호, 이메일 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? '전체 상태' : status === 'active' ? '활성' : '비활성'}
                  </option>
                ))}
              </select>

              <select
                value={selectedVerification}
                onChange={(e) => setSelectedVerification(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {verifications.map(verification => (
                  <option key={verification} value={verification}>
                    {verification === 'all' ? '전체 인증' : verification === 'verified' ? '인증됨' : '미인증'}
                  </option>
                ))}
              </select>
              
              <Button variant="outline" className="flex items-center justify-center">
                <Filter className="h-4 w-4 mr-2" />
                필터 적용
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 셀러 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>셀러 목록 ({filteredSellers.length}개)</span>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ArrowUpDown className="h-4 w-4" />
                정렬
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">셀러 정보</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">연락처</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">추천 코드</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">상태</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">인증</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">등록일</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSellers.map((seller) => (
                    <tr key={seller.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{seller.companyName}</p>
                            <p className="text-sm text-gray-500">대표: {seller.representativeName}</p>
                            {seller.user && (
                              <p className="text-xs text-gray-400">{seller.user.name} ({seller.user.email})</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-900">{seller.phone}</p>
                          <p className="text-xs text-gray-500">{seller.address}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {seller.referralCodeCount || 0}개
                          </span>
                          <p className="text-xs text-gray-500">
                            총 사용: {seller.totalReferralUses || 0}회
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            seller.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {seller.isActive ? '활성' : '비활성'}
                          </span>
                          {seller.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            seller.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {seller.isVerified ? '인증됨' : '미인증'}
                          </span>
                          {seller.isVerified ? (
                            <Shield className="h-4 w-4 text-green-600" />
                          ) : (
                            <ShieldOff className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-500">
                          {new Date(seller.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Link href={`/admin/sellers/${seller.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/sellers/${seller.id}/edit`}>
                            <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-yellow-600 hover:text-yellow-700"
                            onClick={() => handleStatusChange(seller.id)}
                            title={seller.isActive ? '비활성화' : '활성화'}
                          >
                            {seller.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-purple-600 hover:text-purple-700"
                            onClick={() => handleVerificationChange(seller.id)}
                            title={seller.isVerified ? '인증 해제' : '인증 승인'}
                          >
                            {seller.isVerified ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(seller.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredSellers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">셀러가 없습니다.</p>
                <Link href="/admin/sellers/new">
                  <Button className="mt-4">첫 번째 셀러 등록하기</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellersPage;
