import { toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-modal';
import { usePrompt } from '@/components/ui/prompt-modal';

// Toast 함수들
export const showToast = {
  success: (title: string, message?: string) => {
    // 이 함수는 React 컴포넌트 내에서 useToast hook을 사용해야 합니다
    console.warn('showToast는 React 컴포넌트 내에서 useToast hook을 사용하세요');
  },
  error: (title: string, message?: string) => {
    console.warn('showToast는 React 컴포넌트 내에서 useToast hook을 사용하세요');
  },
  warning: (title: string, message?: string) => {
    console.warn('showToast는 React 컴포넌트 내에서 useToast hook을 사용하세요');
  },
  info: (title: string, message?: string) => {
    console.warn('showToast는 React 컴포넌트 내에서 useToast hook을 사용하세요');
  },
};

// 기존 alert, confirm, prompt를 대체하는 함수들
export const customAlert = (message: string) => {
  console.warn('customAlert는 React 컴포넌트 내에서 useToast hook을 사용하세요');
  // 임시로 기본 alert 사용
  alert(message);
};

export const customConfirm = (message: string): Promise<boolean> => {
  console.warn('customConfirm은 React 컴포넌트 내에서 useConfirm hook을 사용하세요');
  // 임시로 기본 confirm 사용
  return Promise.resolve(confirm(message));
};

export const customPrompt = (message: string, defaultValue?: string): Promise<string | null> => {
  console.warn('customPrompt는 React 컴포넌트 내에서 usePrompt hook을 사용하세요');
  // 임시로 기본 prompt 사용
  const result = prompt(message, defaultValue);
  return Promise.resolve(result);
};
