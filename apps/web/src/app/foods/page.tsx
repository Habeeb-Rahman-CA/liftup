'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FoodLibraryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/exercises?tab=foods');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  );
}
