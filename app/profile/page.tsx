/* eslint-disable @typescript-eslint/no-unused-vars */
// app/profile/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Settings,
  CreditCard,
  BarChart3,
  Shield,
  Trash2,
  AlertTriangle,
  Crown,
  CheckCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useProfile, useUserStats, useUpgrade } from '@/hooks/profile-hooks'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/additional'
import { Separator } from '@/components/ui/additional'
import { Progress } from '@/components/ui/additional'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EditProfileForm } from '@/components/profile/edit-profile-form'
import { UpgradePlanModal } from '@/components/profile/upgrade-plan-modal'
import { DeleteAccountDialog } from '@/components/profile/delete-account-dialog'

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    updateProfile,
    isUpdating,
  } = useProfile()

  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
  } = useUserStats()

  const {
    upgradePlan,
    isUpgrading,
    error: upgradeError,
  } = useUpgrade()

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    router.push('/login?returnUrl=/profile')
    return null
  }

  // Loading state
  if (authLoading || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="space-y-4 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-knugget-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const planData = {
    FREE: {
      name: 'Free',
      color: 'bg-gray-500',
      icon: User,
      maxCredits: 10,
      features: ['10 AI summaries/month', 'Chrome extension', 'Basic support']
    },
    PREMIUM: {
      name: 'Premium',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      icon: Crown,
      maxCredits: 1000,
      features: ['Unlimited summaries', 'Priority support', 'Advanced features', 'Export options']
    }
  }

  const currentPlan = planData[user.plan]
  const creditUsagePercent = stats ? Math.round((stats.creditsUsed / currentPlan.maxCredits) * 100) : 0

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Error Alerts */}
      {(profileError || statsError || upgradeError) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {profileError || statsError || upgradeError}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Profile Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                disabled={isUpdating}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </Button>
            </CardHeader>
            <CardContent>
              {isEditingProfile ? (
                <EditProfileForm
                  profile={profile}
                  onSave={async (data) => {
                    await updateProfile(data)
                    setIsEditingProfile(false)
                  }}
                  onCancel={() => setIsEditingProfile(false)}
                  isLoading={isUpdating}
                />
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <p className="text-lg">{profile.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-lg">{profile.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                      <p className="text-lg">{formatDate(profile.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                      <p className="text-lg">
                        {profile.lastLoginAt ? formatRelativeTime(profile.lastLoginAt) : 'Never'}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Download all your summaries and data
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Privacy Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage your privacy preferences
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950">
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100">Delete Account</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white ${currentPlan.color}`}>
                  <currentPlan.icon className="h-5 w-5" />
                  <span className="font-semibold">{currentPlan.name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Credits Used</span>
                  <span>{stats?.creditsUsed || 0} / {currentPlan.maxCredits}</span>
                </div>
                <Progress value={creditUsagePercent} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {currentPlan.maxCredits - (stats?.creditsUsed || 0)} credits remaining
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Plan Features</h4>
                <ul className="space-y-1">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {user.plan === 'FREE' && (
                <Button 
                  className="w-full" 
                  onClick={() => setShowUpgradeModal(true)}
                  disabled={isUpgrading}
                >
                  {isUpgrading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Upgrading...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Premium
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Usage Stats */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-knugget-600">{stats.totalSummaries}</div>
                    <div className="text-xs text-muted-foreground">Total Summaries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.summariesThisMonth}</div>
                    <div className="text-xs text-muted-foreground">This Month</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Credits Used</span>
                    <Badge variant="outline">{stats.creditsUsed}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Length</span>
                    <Badge variant="outline">{stats.averageSummaryLength} words</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <Badge variant="outline" className="text-green-600">
                      {Math.round((stats.completedSummaries / stats.totalSummaries) * 100)}%
                    </Badge>
                  </div>
                </div>

                {stats.recentActivity && stats.recentActivity.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Recent Activity</h4>
                      <div className="space-y-2">
                        {stats.recentActivity.slice(0, 3).map((activity) => (
                          <div key={activity.id} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-knugget-500" />
                            <span className="flex-1 truncate">{activity.summaryTitle}</span>
                            <span className="text-muted-foreground">
                              {formatRelativeTime(activity.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={upgradePlan}
        isLoading={isUpgrading}
        currentPlan={user.plan}
      />

      <DeleteAccountDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        userEmail={user.email}
      />
    </div>
  )
}