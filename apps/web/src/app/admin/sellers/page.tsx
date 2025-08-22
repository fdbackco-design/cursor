'use client';

import { useState } from 'react';
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
  XCircle
} from 'lucide-react';
import Link from 'next/link';

const SellersPage = () => {
  const [sellers, setSellers] = useState([
    {
      id: 1,
      name: '테크스토어',
      email: 'tech@store.com',
      phone: '02-1234-5678',
      category: '전자제품',
      status: 'active',
      productsCount: 45,
      totalSales: 12500000,
      joinedAt: '2023-06-15',
      verified: true
    },
    {
      id: 2,
      name: '홈키친',
      email: 'home@kitchen.com',
      phone: '02-2345-6789',
      category: '주방용품',
      status: 'active',
      productsCount: 32,
      totalSales: 8900000,
      joinedAt: '2023-08-22',
      verified: true
    },
    {
      id: 3,
      name: '헬스스토어',
      email: 'health@store.com',
      phone: '02-3456-7890',
      category: '건강기능식품',
      status: 'pending',
      productsCount: 18,
      totalSales: 3200000,
      joinedAt: '2024-01-10',
      verified: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const handleDelete = (id: number) => {
    if (confirm('정말로 이 셀러를 삭제하시겠습니까?')) {
      setSellers(sellers.filter(seller => seller.id !== id));
    }
  };

  const handleStatusChange = (id: number, newStatus: string) => {
    setSellers(sellers.map(seller => 
      seller.id === id ? { ...seller, status: newStatus } : seller
    ));
  };

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seller.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || seller.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || seller.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = ['전자제품', '주방용품', '건강기능식품', '패션', '도서'];
  const statuses = ['active', 'pending', 'suspended'];

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
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              새 셀러 등록
            </Button>
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
                  placeholder="셀러명 또는 이메일 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">전체 카테고리</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="all">전체 상태</option>
                <option value="active">활성</option>
                <option value="pending">승인 대기</option>
                <option value="suspended">정지</option>
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
                    <th className="text-left py-3 px-4 font-medium text-gray-900">카테고리</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">상품 수</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">총 매출</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">상태</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">인증</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">가입일</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSellers.map((seller) => (
                    <tr key={seller.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{seller.name}</p>
                            <p className="text-sm text-gray-500">{seller.email}</p>
                            <p className="text-sm text-gray-500">{seller.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {seller.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{seller.productsCount}개</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {seller.totalSales.toLocaleString()}원
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            seller.status === 'active' ? 'bg-green-100 text-green-800' :
                            seller.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {seller.status === 'active' ? '활성' : 
                             seller.status === 'pending' ? '승인 대기' : '정지'}
                          </span>
                          {seller.status === 'pending' && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleStatusChange(seller.id, 'active')}
                            >
                              승인
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {seller.verified ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-500">{seller.joinedAt}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                            <Edit className="h-4 w-4" />
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellersPage;
