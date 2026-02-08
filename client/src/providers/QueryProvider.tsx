/**
 * React Query Provider
 * Configures React Query client and provides query context
 */

import React, { ReactNode } from 'react'
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// ==================== Query Client Configuration ====================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long before data is considered stale
      staleTime: 1000 * 60 * 5, // 5 minutes

      // Cache time - how long inactive data stays in cache
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)

      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          return false
        }
        // Retry up to 2 times for other errors
        return failureCount < 2
      },

      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch configuration
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on network errors
      retry: (failureCount, error: any) => {
        if (error?.statusCode >= 400 && error?.statusCode < 500) {
          return false
        }
        return failureCount < 1
      },
    },
  },

  // Query cache - handles query lifecycle events
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Global error handling for queries
      console.error('Query error:', error, 'Query key:', query.queryKey)

      // You can dispatch a global error event here
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const apiError = error as { statusCode: number; error: { message: string } }

        // Handle specific error codes globally
        if (apiError.statusCode === 401) {
          // Unauthorized - handled by API interceptor
          return
        }

        if (apiError.statusCode === 403) {
          // Forbidden
          console.warn('Access forbidden:', apiError.error.message)
        }

        if (apiError.statusCode >= 500) {
          // Server error
          console.error('Server error:', apiError.error.message)
        }
      }
    },
    onSuccess: (data) => {
      // Global success handling if needed
      // console.log('Query success:', data)
    },
  }),

  // Mutation cache - handles mutation lifecycle events
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      // Global error handling for mutations
      console.error('Mutation error:', error)

      // You can show a toast notification here
      if (error && typeof error === 'object' && 'error' in error) {
        const apiError = error as { error: { message: string } }
        console.error('Mutation failed:', apiError.error.message)
      }
    },
    onSuccess: (data, variables, context, mutation) => {
      // Global success handling
      // console.log('Mutation success:', data)
    },
  }),
})

// ==================== Provider Props ====================

interface QueryProviderProps {
  children: ReactNode
  enableDevtools?: boolean
}

// ==================== Provider Component ====================

export const QueryProvider: React.FC<QueryProviderProps> = ({
  children,
  enableDevtools = import.meta.env.DEV, // Enable in development by default
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {enableDevtools && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}

// ==================== Export Query Client ====================

export { queryClient }
export default QueryProvider
