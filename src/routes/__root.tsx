import * as React from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider } from '@blinkdotnew/ui'
import '../index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'WorkConnect Network — Find Work, Hire Talent' },
      {
        name: 'description',
        content:
          'WorkConnect connects skilled workers with customers across Nigeria. Find jobs, hire talent, and get work done.',
      },
    ],
    links: [
      {
        rel: 'icon',
        href: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  }),
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <BlinkUIProvider>
            <Outlet />
          </BlinkUIProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
