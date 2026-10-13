'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15000,
            gcTime: 5 * 60 * 1000,
            retry: (failureCount, error) => {
              if (error instanceof Error && 'status' in error) {
                const status = Number((error as Error & { status?: number }).status);
                if (status >= 400 && status < 500 && status !== 408 && status !== 429) return false;
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
