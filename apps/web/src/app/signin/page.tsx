'use client';

import { Button } from '@repo/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui';
import { MessageCircle } from 'lucide-react';

export default function SignInPage() {
  const handleKakaoLogin = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/kakao`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">로그인</CardTitle>
          <CardDescription>
            카카오 계정으로 간편하게 로그인하세요
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            onClick={handleKakaoLogin}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
            </svg>
            카카오로 로그인
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>계정이 없으신가요?</p>
            <p>카카오 로그인으로 자동 가입됩니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
