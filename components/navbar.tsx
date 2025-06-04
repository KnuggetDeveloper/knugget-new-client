'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User, Settings, CreditCard, BarChart3, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { formatUserName, getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar'

interface NavbarProps {
  showAuthButtons?: boolean
}

export function Navbar({ showAuthButtons = true }: NavbarProps) {
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect even if logout fails
      router.push('/login')
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }

  const closeMenus = () => {
    setIsMenuOpen(false)
    setIsProfileMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2" onClick={closeMenus}>
            <div className="h-8 w-8 rounded-lg knugget-gradient flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-xl font-bold knugget-gradient-text">
              Knugget AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={closeMenus}
                >
                  Dashboard
                </Link>
                <Link
                  href="/summaries"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={closeMenus}
                >
                  Summaries
                </Link>
              </>
            )}
            
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={closeMenus}
            >
              Pricing
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : isAuthenticated && user ? (
              <div className="relative">
                {/* User Avatar and Credits */}
                <div className="flex items-center space-x-3">
                  {/* Credits Display */}
                  <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-muted text-sm">
                    <CreditCard className="h-4 w-4 text-knugget-500" />
                    <span className="font-medium">{user.credits}</span>
                    <span className="text-muted-foreground">credits</span>
                  </div>

                  {/* User Menu Button */}
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center space-x-2 rounded-full p-1 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-knugget-500 focus:ring-offset-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} alt={user.name || user.email} />
                      <AvatarFallback className="bg-knugget-500 text-white text-sm">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:block text-sm font-medium">
                      {formatUserName(user.name, user.email)}
                    </span>
                  </button>
                </div>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover shadow-lg z-50">
                      <div className="p-3 border-b">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || undefined} alt={user.name || user.email} />
                            <AvatarFallback className="bg-knugget-500 text-white">
                              {getInitials(user.name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {formatUserName(user.name, user.email)}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                            <div className="flex items-center space-x-1 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-knugget-100 text-knugget-800">
                                {user.plan}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {user.credits} credits
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          className="flex items-center px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={closeMenus}
                        >
                          <BarChart3 className="mr-3 h-4 w-4" />
                          Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          className="flex items-center px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={closeMenus}
                        >
                          <User className="mr-3 h-4 w-4" />
                          Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center px-3 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={closeMenus}
                        >
                          <Settings className="mr-3 h-4 w-4" />
                          Settings
                        </Link>
                      </div>
                      
                      <div className="border-t py-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : showAuthButtons ? (
              <div className="flex items-center space-x-3">
                <Link href="/login" onClick={closeMenus}>
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/auth/signup" onClick={closeMenus}>
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            ) : null}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-knugget-500 focus:ring-offset-2"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {isAuthenticated && (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={closeMenus}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/summaries"
                    className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={closeMenus}
                  >
                    Summaries
                  </Link>
                </>
              )}
              
              <Link
                href="/pricing"
                className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                onClick={closeMenus}
              >
                Pricing
              </Link>

              {!isAuthenticated && showAuthButtons && (
                <div className="pt-4 border-t space-y-2">
                  <Link href="/login" className="block" onClick={closeMenus}>
                    <Button variant="ghost" className="w-full justify-start">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="block" onClick={closeMenus}>
                    <Button className="w-full justify-start">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}

              {isAuthenticated && user && (
                <div className="pt-4 border-t">
                  <div className="flex items-center px-3 py-2 space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || undefined} alt={user.name || user.email} />
                      <AvatarFallback className="bg-knugget-500 text-white text-sm">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {formatUserName(user.name, user.email)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.credits} credits • {user.plan}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <Link
                      href="/profile"
                      className="flex items-center px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                      onClick={closeMenus}
                    >
                      <User className="mr-3 h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                      onClick={closeMenus}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}