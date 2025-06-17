'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  Menu, 
  X, 
  LogOut, 
  User, 
  FileText, 
  BarChart3,
  Settings,
  Chrome,
  Linkedin
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/additional'
import { getInitials } from '@/lib/utils'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Summaries', href: '/summaries', icon: FileText },
    { name: 'LinkedIn Posts', href: '/linkedin-posts', icon: Linkedin },
  ]

  const isActivePath = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg knugget-gradient flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold knugget-gradient-text">
                Knugget AI
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated && (
              <>
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActivePath(item.href)
                          ? 'text-knugget-600 bg-knugget-50 dark:bg-knugget-900 dark:text-knugget-400'
                          : 'text-gray-700 dark:text-gray-300 hover:text-knugget-600 dark:hover:text-knugget-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </>
            )}

            {/* Chrome Extension Badge */}
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 dark:bg-blue-900 rounded-full">
              <Chrome className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                Extension Active
              </span>
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <div className="h-8 w-8 rounded-full bg-knugget-500 flex items-center justify-center text-white font-medium text-sm">
                      {getInitials(user?.name || '', user?.email || '')}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {user?.credits} credits
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          user?.plan === 'PREMIUM' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {user?.plan}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-knugget-600 dark:hover:text-knugget-400 px-3 py-2 text-sm font-medium"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-knugget-600 hover:bg-knugget-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="space-y-2">
              {isAuthenticated && (
                <>
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                          isActivePath(item.href)
                            ? 'text-knugget-600 bg-knugget-50 dark:bg-knugget-900 dark:text-knugget-400'
                            : 'text-gray-700 dark:text-gray-300 hover:text-knugget-600 dark:hover:text-knugget-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center px-3 py-2">
                      <div className="h-8 w-8 rounded-full bg-knugget-500 flex items-center justify-center text-white font-medium text-sm mr-3">
                        {getInitials(user?.name || '', user?.email || '')}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {user?.name || 'User'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user?.email}
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}