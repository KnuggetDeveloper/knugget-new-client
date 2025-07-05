// components/layout/main-layout.tsx
'use client'

import { useAuth } from '@/contexts/auth-context'
import { usePathname } from 'next/navigation'
import { GlobalSidebar } from './sidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()

  // Don't show sidebar layout on auth pages or landing page for non-authenticated users
  const hideSidebar = !isAuthenticated || 
    pathname.startsWith('/login') || 
    pathname.startsWith('/signup') || 
    pathname.startsWith('/landing') ||
    (pathname === '/' && !isAuthenticated)

  if (hideSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <GlobalSidebar />
      <main className="flex-1 ml-64 overflow-hidden">
        <div className="h-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}