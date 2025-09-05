// app/search/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SearchClient from './search-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const token = cookies().get('access_token'); // ✅ 백엔드가 내려주는 쿠키만 기준
  if (!token) {
    const back = '/search' + (searchParams?.q ? `?q=${encodeURIComponent(searchParams.q)}` : '');
    redirect(`/signin?redirect=${encodeURIComponent(back)}`);
  }

  return <SearchClient initialQuery={searchParams?.q ?? ''} />;
}