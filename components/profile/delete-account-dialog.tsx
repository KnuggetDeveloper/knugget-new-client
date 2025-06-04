// components/profile/delete-account-dialog.tsx
'use client'

import { useState } from 'react'
import { AlertTriangle, X, Trash2 } from 'lucide-react'
import { useDeleteAccount } from '@/hooks/profile-hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'

interface DeleteAccountDialogProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export function DeleteAccountDialog({
  isOpen,
  onClose,
  userEmail,
}: DeleteAccountDialogProps) {
  const { deleteAccount, isDeleting, error, clearError } = useDeleteAccount()
  const [confirmationEmail, setConfirmationEmail] = useState('')
  const [confirmationsChecked, setConfirmationsChecked] = useState({
    dataLoss: false,
    noRecovery: false,
    finalDecision: false,
  })

  if (!isOpen) return null

  const allConfirmationsChecked = Object.values(confirmationsChecked).every(Boolean)
  const emailMatches = confirmationEmail.toLowerCase() === userEmail.toLowerCase()
  const canDelete = allConfirmationsChecked && emailMatches

  const handleDelete = async () => {
    if (!canDelete) return

    try {
      clearError()
      const success = await deleteAccount(confirmationEmail)
      
      if (success) {
        // Account deleted successfully, user will be logged out automatically
        onClose()
      }
    } catch (error) {
      console.error('Delete account error:', error)
    }
  }

  const handleClose = () => {
    setConfirmationEmail('')
    setConfirmationsChecked({
      dataLoss: false,
      noRecovery: false,
      finalDecision: false,
    })
    clearError()
    onClose()
  }

  const handleConfirmationChange = (key: keyof typeof confirmationsChecked, checked: boolean) => {
    setConfirmationsChecked(prev => ({
      ...prev,
      [key]: checked,
    }))
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClose} />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-lg bg-background shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-red-900 dark:text-red-100">
                  Delete Account
                </h2>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Warning */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> Deleting your account will permanently remove all your data, 
                including summaries, settings, and account information. This action cannot be reversed.
              </AlertDescription>
            </Alert>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Data Loss Information */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">What will be deleted:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                  <span>All your video summaries and transcripts</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                  <span>Account settings and preferences</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                  <span>Usage statistics and history</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2" />
                  <span>Chrome extension sync data</span>
                </li>
              </ul>
            </div>

            {/* Confirmations */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Please confirm:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="data-loss"
                    checked={confirmationsChecked.dataLoss}
                    onCheckedChange={(checked: boolean) => 
                      handleConfirmationChange('dataLoss', checked as boolean)
                    }
                    disabled={isDeleting}
                  />
                  <Label 
                    htmlFor="data-loss" 
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    I understand that all my data will be permanently deleted
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="no-recovery"
                    checked={confirmationsChecked.noRecovery}
                    onCheckedChange={(checked: boolean) => 
                      handleConfirmationChange('noRecovery', checked as boolean)
                    }
                    disabled={isDeleting}
                  />
                  <Label 
                    htmlFor="no-recovery" 
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    I understand that this action cannot be undone or recovered
                  </Label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="final-decision"
                    checked={confirmationsChecked.finalDecision}
                    onCheckedChange={(checked: boolean) => 
                      handleConfirmationChange('finalDecision', checked as boolean)
                    }
                    disabled={isDeleting}
                  />
                  <Label 
                    htmlFor="final-decision" 
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    I want to permanently delete my Knugget account
                  </Label>
                </div>
              </div>
            </div>

            {/* Email Confirmation */}
            <div className="space-y-2">
              <Label htmlFor="confirmation-email" className="text-sm font-medium">
                Type your email address to confirm: <span className="font-mono text-xs">{userEmail}</span>
              </Label>
              <Input
                id="confirmation-email"
                type="email"
                placeholder="Enter your email address"
                value={confirmationEmail}
                onChange={(e) => setConfirmationEmail(e.target.value)}
                disabled={isDeleting}
                className={emailMatches && confirmationEmail ? 'border-green-500' : ''}
              />
              {confirmationEmail && !emailMatches && (
                <p className="text-xs text-red-600">
                  Email doesn&apos;t match. Please enter: {userEmail}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t bg-muted/30">
            <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Deleting Account...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}