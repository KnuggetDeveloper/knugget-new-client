// components/profile/upgrade-plan-modal.tsx
'use client'

import { useState } from 'react'
import { Crown, Check, X, CreditCard, Zap, Shield, Star } from 'lucide-react'
import { UpgradePlanRequest } from '@/hooks/profile-hooks'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/additional'
import { Separator } from '@/components/ui/additional'
import { Spinner } from '@/components/ui/spinner'

interface UpgradePlanModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgrade: (data: UpgradePlanRequest) => Promise<boolean>
  isLoading?: boolean
  currentPlan: 'FREE' | 'PREMIUM'
}

export function UpgradePlanModal({
  isOpen,
  onClose,
  onUpgrade,
  isLoading = false,
  currentPlan,
}: UpgradePlanModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card')

  if (!isOpen) return null

  const handleUpgrade = async () => {
    const success = await onUpgrade({
      plan: 'PREMIUM',
      paymentMethod: selectedPaymentMethod,
    })
    
    if (success) {
      onClose()
    }
  }

  const plans = {
    FREE: {
      name: 'Free',
      price: '$0',
      period: 'forever',
      credits: 10,
      features: [
        '10 AI summaries per month',
        'Chrome extension access',
        'Basic transcript viewing',
        'Community support',
      ],
      limitations: [
        'Limited summaries',
        'Basic features only',
        'No priority support',
      ]
    },
    PREMIUM: {
      name: 'Premium',
      price: '$9.99',
      period: 'per month',
      credits: 1000,
      features: [
        'Unlimited AI summaries',
        'Advanced summarization',
        'Export to multiple formats',
        'Search and organize summaries',
        'Priority support',
        'Early access to new features',
        'Chrome extension premium features',
        'Bulk processing',
      ],
      highlights: [
        'Save 5+ hours per week',
        '10x more productive research',
        'Professional-grade features',
      ]
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl rounded-lg bg-background shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Upgrade to Premium</h2>
                <p className="text-sm text-muted-foreground">
                  Unlock unlimited summaries and advanced features
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Plan Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Current Plan */}
              <Card className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {plans.FREE.name}
                      {currentPlan === 'FREE' && (
                        <Badge variant="outline">Current</Badge>
                      )}
                    </CardTitle>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{plans.FREE.price}</div>
                      <div className="text-xs text-muted-foreground">{plans.FREE.period}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">What you get:</h4>
                    <ul className="space-y-1">
                      {plans.FREE.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">Limitations:</h4>
                    <ul className="space-y-1">
                      {plans.FREE.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <X className="h-3 w-3 text-red-500" />
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className="relative border-2 border-gradient-to-r from-purple-500 to-pink-500">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-purple-500" />
                      {plans.PREMIUM.name}
                    </CardTitle>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{plans.PREMIUM.price}</div>
                      <div className="text-xs text-muted-foreground">{plans.PREMIUM.period}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Everything in Free, plus:</h4>
                    <ul className="space-y-1">
                      {plans.PREMIUM.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-3 w-3 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-purple-700 dark:text-purple-300">
                      Why upgrade?
                    </h4>
                    <ul className="space-y-1">
                      {plans.PREMIUM.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm font-medium">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold">Choose Payment Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    selectedPaymentMethod === 'card'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Credit Card</div>
                      <div className="text-xs text-muted-foreground">Visa, MasterCard, etc.</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('paypal')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    selectedPaymentMethod === 'paypal'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">P</span>
                    </div>
                    <div>
                      <div className="font-medium">PayPal</div>
                      <div className="text-xs text-muted-foreground">Secure payment</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('crypto')}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    selectedPaymentMethod === 'crypto'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">₿</span>
                    </div>
                    <div>
                      <div className="font-medium">Crypto</div>
                      <div className="text-xs text-muted-foreground">Bitcoin, Ethereum</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg mb-6">
              <Shield className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">Secure Payment</div>
                <div className="text-muted-foreground">
                  Your payment information is encrypted and secure. Cancel anytime.
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-muted/30">
            <div className="text-sm text-muted-foreground">
              30-day money-back guarantee
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Maybe Later
              </Button>
              <Button onClick={handleUpgrade} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Premium
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}