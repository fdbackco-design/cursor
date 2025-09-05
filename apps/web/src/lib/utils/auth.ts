import { useRouter } from 'next/navigation';

/**
 * 인증되지 않은 사용자를 로그인 페이지로 리다이렉트합니다.
 * 현재 URL을 redirect 쿼리 파라미터로 전달하여 로그인 후 원래 페이지로 돌아갈 수 있도록 합니다.
 */
export const redirectToSignin = (router: ReturnType<typeof useRouter>) => {
  const currentUrl = window.location.pathname;
  router.push(`/signin?redirect=${encodeURIComponent(currentUrl)}`);
};

/**
 * 승인되지 않은 사용자를 승인 대기 페이지로 리다이렉트합니다.
 */
export const redirectToApprovalPending = (router: ReturnType<typeof useRouter>) => {
  router.push('/approval-pending');
};
