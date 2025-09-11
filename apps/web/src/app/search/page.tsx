// app/search/page.tsx
import SearchClient from './search-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  return <SearchClient initialQuery={searchParams?.q ?? ''} />;
}