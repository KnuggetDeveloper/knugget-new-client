/* eslint-disable @typescript-eslint/no-empty-object-type */
// Authentication types matching backend API structure

export interface User {
    id: string
    email: string
    name: string | null
    avatar: string | null
    plan: 'FREE' | 'PREMIUM'
    credits: number
    emailVerified: boolean
    createdAt: string
    lastLoginAt: string | null
  }
  
  export interface AuthData {
    user: User
    accessToken: string
    refreshToken: string
    expiresAt: number
  }
  
  export interface LoginResponse {
    user: User
    accessToken: string
    refreshToken: string
    expiresAt: number
  }
  
  export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
  }
  
  // Request DTOs matching backend validation schemas
  export interface RegisterRequest {
    email: string
    password: string
    name?: string
  }
  
  export interface LoginRequest {
    email: string
    password: string
  }
  
  export interface RefreshTokenRequest {
    refreshToken: string
  }
  
  export interface ForgotPasswordRequest {
    email: string
  }
  
  export interface ResetPasswordRequest {
    token: string
    password: string
  }
  
  export interface UpdateProfileRequest {
    name?: string
    avatar?: string
  }
  
  // Auth state for context
  export interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
  }
  
  // Auth actions
  export type AuthAction =
    | { type: 'AUTH_START' }
    | { type: 'AUTH_SUCCESS'; payload: User }
    | { type: 'AUTH_ERROR'; payload: string }
    | { type: 'AUTH_LOGOUT' }
    | { type: 'AUTH_CLEAR_ERROR' }
    | { type: 'AUTH_UPDATE_USER'; payload: Partial<User> }
  
  // Form validation schemas (using zod)
  export interface LoginFormData {
    email: string
    password: string
  }
  
  export interface SignupFormData {
    email: string
    password: string
    confirmPassword: string
    name?: string
  }
  
  export interface ResetPasswordFormData {
    email: string
  }
  
  export interface NewPasswordFormData {
    password: string
    confirmPassword: string
  }
  
  // Chrome extension sync data structure
  export interface ExtensionAuthData {
    token: string
    refreshToken: string
    user: {
      id: string
      name: string | null
      email: string
      credits: number
      plan: string
    }
    expiresAt: number
    loginTime: string
  }
  
  // Token management
  export interface TokenData {
    accessToken: string
    refreshToken: string
    expiresAt: number
  }
  
  // Auth hook return types
  export interface UseAuthReturn {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
    login: (email: string, password: string) => Promise<void>
    signup: (email: string, password: string, name?: string) => Promise<void>
    logout: () => Promise<void>
    refreshAuth: () => Promise<void>
    clearError: () => void
    updateProfile: (data: UpdateProfileRequest) => Promise<void>
  }
  
  export interface UseLoginReturn {
    login: (email: string, password: string) => Promise<void>
    isLoading: boolean
    error: string | null
    clearError: () => void
  }
  
  export interface UseSignupReturn {
    signup: (email: string, password: string, name?: string) => Promise<void>
    isLoading: boolean
    error: string | null
    clearError: () => void
  }
  
  // Auth context type
  export interface AuthContextType extends UseAuthReturn {
    // Additional context-specific methods if needed
  }
  
  // Session storage keys
  export const AUTH_STORAGE_KEYS = {
    ACCESS_TOKEN: 'knugget_access_token',
    REFRESH_TOKEN: 'knugget_refresh_token',
    USER_DATA: 'knugget_user_data',
    EXPIRES_AT: 'knugget_expires_at',
  } as const
  
  // Chrome extension storage keys (matching extension codebase)
  export const EXTENSION_STORAGE_KEYS = {
    AUTH_DATA: 'knugget_auth',
    USER_PREFERENCES: 'knugget_preferences',
    CACHED_SUMMARIES: 'knugget_summaries_cache',
    LAST_SYNC: 'knugget_last_sync',
  } as const
  
  // API endpoints
  export const AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  } as const
  
  // Error codes that might come from the backend
  export const AUTH_ERROR_CODES = {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
  } as const
  
  // User plan types and limits
  export const USER_PLANS = {
    FREE: {
      name: 'Free',
      credits: 10,
      features: ['Basic summaries', 'Chrome extension'],
    },
    PREMIUM: {
      name: 'Premium',
      credits: 1000,
      features: ['Unlimited summaries', 'Priority support', 'Advanced features'],
    },
  } as const
  
  export type UserPlan = keyof typeof USER_PLANS