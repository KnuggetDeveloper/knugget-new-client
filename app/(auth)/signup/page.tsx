'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, Chrome, ArrowLeft, CheckCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useSignup } from '@/hooks/use-auth-form'
import { Suspense } from 'react'


// Form validation schema
const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

function SignupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { signup, isLoading, error, clearError } = useSignup()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Get return URL and source from query params
  const returnUrl = searchParams.get('returnUrl')
  const source = searchParams.get('source')
  const isFromExtension = source === 'extension'

  // Form setup
  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Watch password for strength indicator
  const password = form.watch('password')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push(returnUrl || '/dashboard')
    }
  }, [isAuthenticated, authLoading, router, returnUrl])

  // Clear error when form changes
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [error, clearError])

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup(data.email, data.password, data.name)
      // Navigation is handled by the auth context
    } catch (err) {
      // Error is handled by the useSignup hook
      console.error('Signup error:', err)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    let strength = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    Object.values(checks).forEach(check => {
      if (check) strength++
    })

    return { strength, checks }
  }

  const passwordStrength = getPasswordStrength(password || '')

  // Show loading spinner if checking auth state
  if (authLoading) {
    return (
      <div className="auth-container">
        <div className="flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <CardHeader className="space-y-4">
          {/* Back to website link for extension users */}
          {isFromExtension && (
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to website
            </Link>
          )}

          {/* Logo */}
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl knugget-gradient flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">
              Create your Knugget account
            </CardTitle>
            <CardDescription>
              {isFromExtension ? (
                <>
                  Sign up to sync your account with the Chrome extension
                  <div className="flex items-center justify-center mt-2 text-knugget-600">
                    <Chrome className="mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">Chrome Extension Signup</span>
                  </div>
                </>
              ) : (
                'Start generating AI-powered summaries in seconds'
              )}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Signup Form */}
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Field */}
              <FormItem>
                <FormLabel htmlFor="name">Full name</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      className="pl-10"
                      {...form.register('name')}
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage>
                  {form.formState.errors.name?.message}
                </FormMessage>
              </FormItem>

              {/* Email Field */}
              <FormItem>
                <FormLabel htmlFor="email">Email address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      {...form.register('email')}
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage>
                  {form.formState.errors.email?.message}
                </FormMessage>
              </FormItem>

              {/* Password Field */}
              <FormItem>
                <FormLabel htmlFor="password">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      className="pl-10 pr-10"
                      {...form.register('password')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage>
                  {form.formState.errors.password?.message}
                </FormMessage>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength.strength >= level
                            ? passwordStrength.strength < 3
                              ? 'bg-red-500'
                              : passwordStrength.strength < 4
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            : 'bg-gray-200'
                            }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className={`h-3 w-3 ${passwordStrength.checks.length ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={passwordStrength.checks.length ? 'text-green-600' : 'text-gray-500'}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className={`h-3 w-3 ${passwordStrength.checks.lowercase ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-500'}>
                          One lowercase letter
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className={`h-3 w-3 ${passwordStrength.checks.uppercase ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-500'}>
                          One uppercase letter
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className={`h-3 w-3 ${passwordStrength.checks.number ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={passwordStrength.checks.number ? 'text-green-600' : 'text-gray-500'}>
                          One number
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </FormItem>

              {/* Confirm Password Field */}
              <FormItem>
                <FormLabel htmlFor="confirmPassword">Confirm password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10"
                      {...form.register('confirmPassword')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage>
                  {form.formState.errors.confirmPassword?.message}
                </FormMessage>
              </FormItem>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>
          </FormProvider>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {/* Divider */}
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <Link
              href={`/register${isFromExtension ? '?source=extension' : ''}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
              className="text-sm text-knugget-600 hover:text-knugget-500 transition-colors font-medium"
            >
              Sign in to your account
            </Link>
          </div>

          {/* Free Plan Benefits */}
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
              What&apos;s included in your free account:
            </h4>
            <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
              <li>• 10 free AI summaries per month</li>
              <li>• Chrome extension access</li>
              <li>• Summary history and search</li>
              <li>• Key insights extraction</li>
            </ul>
          </div>

          {/* Extension Benefits */}
          {isFromExtension && (
            <div className="p-4 bg-knugget-50 dark:bg-knugget-950 rounded-lg border border-knugget-200 dark:border-knugget-800">
              <div className="flex items-start space-x-3">
                <Chrome className="h-5 w-5 text-knugget-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-knugget-900 dark:text-knugget-100">
                    Chrome Extension Benefits
                  </h4>
                  <ul className="text-xs text-knugget-700 dark:text-knugget-300 space-y-1">
                    <li>• Generate summaries directly on YouTube</li>
                    <li>• Sync across all your devices</li>
                    <li>• Access your saved summaries anywhere</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="auth-container">
        <div className="flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  )
}