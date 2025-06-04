// components/profile/edit-profile-form.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, X, Upload } from 'lucide-react'
import { UserProfile, UpdateProfileRequest } from '@/hooks/profile-hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

// Form validation schema
const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  avatar: z
    .string()
    .url('Avatar must be a valid URL')
    .optional()
    .or(z.literal('')),
})

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>

interface EditProfileFormProps {
  profile: UserProfile
  onSave: (data: UpdateProfileRequest) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function EditProfileForm({
  profile,
  onSave,
  onCancel,
  isLoading = false,
}: EditProfileFormProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar)

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: profile.name || '',
      avatar: profile.avatar || '',
    },
  })

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      const updateData: UpdateProfileRequest = {}
      
      if (data.name && data.name !== profile.name) {
        updateData.name = data.name
      }
      
      if (data.avatar && data.avatar !== profile.avatar) {
        updateData.avatar = data.avatar
      }

      await onSave(updateData)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setAvatarPreview(url || null)
    form.setValue('avatar', url)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real implementation, you'd upload to a cloud service
      // For now, we'll use a placeholder URL
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setAvatarPreview(result)
        form.setValue('avatar', result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarPreview || undefined} alt={profile.name || profile.email} />
          <AvatarFallback className="text-lg">
            {getInitials(profile.name, profile.email)}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-2">
          <Label htmlFor="avatar-upload" className="text-sm font-medium">
            Profile Picture
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              id="avatar-file"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('avatar-file')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <span className="text-xs text-muted-foreground">
              Or enter URL below
            </span>
          </div>
        </div>
      </div>

      {/* Avatar URL Input */}
      <div className="space-y-2">
        <Label htmlFor="avatar">Avatar URL</Label>
        <Input
          id="avatar"
          type="url"
          placeholder="https://example.com/avatar.jpg"
          {...form.register('avatar')}
          onChange={handleAvatarChange}
          disabled={isLoading}
        />
        {form.formState.errors.avatar && (
          <p className="text-sm text-red-600">
            {form.formState.errors.avatar.message}
          </p>
        )}
      </div>

      {/* Name Input */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Enter your full name"
          {...form.register('name')}
          disabled={isLoading}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Email (Read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={profile.email}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Email cannot be changed. Contact support if you need to update your email.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !form.formState.isDirty}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  )
}