/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    X,
    Plus,
    Trash2,
    ExternalLink,
    Save,
    Edit3,
    Eye,
    Play,
    Calendar,
    FileText,
    Tag as TagIcon,
} from 'lucide-react'
import { Summary, UpdateSummaryRequest } from '@/types/summary'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/form'
import { Spinner } from '@/components/ui/spinner'

// Form validation schema
const summarySchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title must be less than 200 characters'),
    keyPoints: z
        .array(z.string().min(1, 'Key point cannot be empty'))
        .min(1, 'At least one key point is required')
        .max(10, 'Maximum 10 key points allowed'),
    fullSummary: z
        .string()
        .min(1, 'Summary is required')
        .max(5000, 'Summary must be less than 5000 characters'),
    tags: z
        .array(z.string().min(1, 'Tag cannot be empty'))
        .max(10, 'Maximum 10 tags allowed'),
})

type SummaryFormData = z.infer<typeof summarySchema>

interface SummaryModalProps {
    isOpen: boolean
    onClose: () => void
    summary: Summary | null
    mode: 'view' | 'edit' | 'create'
    onSave?: (data: UpdateSummaryRequest) => Promise<void>
    isLoading?: boolean
}

export function SummaryModal({
    isOpen,
    onClose,
    summary,
    mode,
    onSave,
    isLoading = false,
}: SummaryModalProps) {
    const [currentMode, setCurrentMode] = useState<'view' | 'edit'>(mode === 'create' ? 'edit' : mode)
    const [newTag, setNewTag] = useState('')

    // Form setup
    const form = useForm<SummaryFormData>({
        resolver: zodResolver(summarySchema),
        defaultValues: {
            title: '',
            keyPoints: [''],
            fullSummary: '',
            tags: [],
        },
    })

    const { fields: keyPointFields, append: appendKeyPoint, remove: removeKeyPoint } = useFieldArray({
        control: form.control,
        name: 'keyPoints',
    } as any)

    const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
        control: form.control,
        name: 'tags',
    } as any)

    // Load summary data when modal opens
    useEffect(() => {
        if (isOpen && summary) {
            form.reset({
                title: summary.title,
                keyPoints: summary.keyPoints.length > 0 ? summary.keyPoints : [''],
                fullSummary: summary.fullSummary,
                tags: summary.tags,
            })
            setCurrentMode(mode === 'create' ? 'edit' : mode)
        } else if (isOpen && mode === 'create') {
            form.reset({
                title: '',
                keyPoints: [''],
                fullSummary: '',
                tags: [],
            })
            setCurrentMode('edit')
        }

        // Reset new tag input when modal opens/closes
        if (!isOpen) {
            setNewTag('')
        }
    }, [isOpen, summary, mode, form])

    // Handle form submission
    const onSubmit = async (data: SummaryFormData) => {
        if (!onSave) return

        try {
            await onSave({
                title: data.title,
                keyPoints: data.keyPoints.filter(point => point.trim()),
                fullSummary: data.fullSummary,
                tags: data.tags.filter(tag => tag.trim()),
            })
            onClose()
        } catch (error) {
            console.error('Failed to save summary:', error)
        }
    }

    // Handle adding new tag
    const handleAddTag = () => {
        if (newTag.trim() && !form.getValues('tags').includes(newTag.trim())) {
            appendTag(newTag.trim())
            setNewTag('')
        }
    }

    // Handle tag input key press
    const handleTagKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddTag()
        }
    }

    // Switch between view and edit modes
    const toggleMode = () => {
        setCurrentMode(currentMode === 'view' ? 'edit' : 'view')
    }

    // Handle modal close
    const handleClose = () => {
        form.reset()
        setNewTag('')
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClose} />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-background shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center space-x-4">
                            <h2 className="text-xl font-semibold">
                                {mode === 'create' ? 'Create New Summary' :
                                    currentMode === 'edit' ? 'Edit Summary' : 'View Summary'}
                            </h2>
                            {summary && (
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDate(summary.createdAt)}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            {summary && mode !== 'create' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={toggleMode}
                                    disabled={isLoading}
                                >
                                    {currentMode === 'view' ? (
                                        <>
                                            <Edit3 className="h-4 w-4 mr-2" />
                                            Edit
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-4 w-4 mr-2" />
                                            View
                                        </>
                                    )}
                                </Button>
                            )}

                            {summary?.videoMetadata.url && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(summary.videoMetadata.url, '_blank')}
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Video
                                </Button>
                            )}

                            <Button variant="ghost" size="sm" onClick={handleClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                        {currentMode === 'view' && summary ? (
                            /* View Mode */
                            <div className="p-6 space-y-6">
                                {/* Video Info */}
                                {summary.videoMetadata && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-lg">
                                                <Play className="h-5 w-5 mr-2 text-knugget-500" />
                                                Video Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div>
                                                <Label className="text-sm font-medium">Title</Label>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {summary.videoMetadata.title}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium">Channel</Label>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {summary.videoMetadata.channelName}
                                                </p>
                                            </div>
                                            {summary.videoMetadata.duration && (
                                                <div>
                                                    <Label className="text-sm font-medium">Duration</Label>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {summary.videoMetadata.duration}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Summary Title */}
                                <div>
                                    <Label className="text-lg font-semibold">Summary Title</Label>
                                    <p className="text-base mt-2">{summary.title}</p>
                                </div>

                                {/* Key Points */}
                                {summary.keyPoints.length > 0 && (
                                    <div>
                                        <Label className="text-lg font-semibold flex items-center">
                                            <FileText className="h-5 w-5 mr-2" />
                                            Key Points
                                        </Label>
                                        <ul className="mt-3 space-y-2">
                                            {summary.keyPoints.map((point, index) => (
                                                <li key={index} className="flex items-start space-x-3">
                                                    <div className="w-2 h-2 rounded-full bg-knugget-500 mt-2 flex-shrink-0" />
                                                    <span className="text-sm">{point}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Full Summary */}
                                {summary.fullSummary && (
                                    <div>
                                        <Label className="text-lg font-semibold">Full Summary</Label>
                                        <div className="mt-3 p-4 bg-muted/50 rounded-lg">
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                {summary.fullSummary}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Tags */}
                                {summary.tags.length > 0 && (
                                    <div>
                                        <Label className="text-lg font-semibold flex items-center">
                                            <TagIcon className="h-5 w-5 mr-2" />
                                            Tags
                                        </Label>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {summary.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-knugget-100 text-knugget-800 dark:bg-knugget-900 dark:text-knugget-200"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Edit Mode */
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                                    {/* Title */}
                                    <FormItem>
                                        <FormLabel>Summary Title</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter a descriptive title for your summary"
                                                {...form.register('title')}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage>
                                            {form.formState.errors.title?.message}
                                        </FormMessage>
                                    </FormItem>

                                    {/* Key Points */}
                                    <div className="space-y-3">
                                        <FormLabel className="flex items-center">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Key Points
                                        </FormLabel>
                                        {keyPointFields.map((field, index) => (
                                            <div key={field.id} className="flex items-start space-x-2">
                                                <div className="flex-1">
                                                    <Input
                                                        placeholder={`Key point ${index + 1}`}
                                                        {...form.register(`keyPoints.${index}`)}
                                                        disabled={isLoading}
                                                    />
                                                    {form.formState.errors.keyPoints?.[index] && (
                                                        <p className="text-sm text-red-600 mt-1">
                                                            {form.formState.errors.keyPoints[index]?.message}
                                                        </p>
                                                    )}
                                                </div>
                                                {keyPointFields.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeKeyPoint(index)}
                                                        disabled={isLoading}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => appendKeyPoint('')}
                                            disabled={isLoading || keyPointFields.length >= 10}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Key Point
                                        </Button>
                                        {form.formState.errors.keyPoints?.root && (
                                            <p className="text-sm text-red-600">
                                                {form.formState.errors.keyPoints.root.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Full Summary */}
                                    <FormItem>
                                        <FormLabel>Full Summary</FormLabel>
                                        <FormControl>
                                            <textarea
                                                className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="Write a comprehensive summary of the video content..."
                                                {...form.register('fullSummary')}
                                                disabled={isLoading}
                                            />
                                        </FormControl>
                                        <FormMessage>
                                            {form.formState.errors.fullSummary?.message}
                                        </FormMessage>
                                    </FormItem>

                                    {/* Tags */}
                                    <div className="space-y-3">
                                        <FormLabel className="flex items-center">
                                            <TagIcon className="h-4 w-4 mr-2" />
                                            Tags
                                        </FormLabel>

                                        {/* Add Tag Input */}
                                        <div className="flex items-center space-x-2">
                                            <Input
                                                placeholder="Add a tag..."
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                onKeyPress={handleTagKeyPress}
                                                disabled={isLoading}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleAddTag}
                                                disabled={isLoading || !newTag.trim() || tagFields.length >= 10}
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Current Tags */}
                                        {tagFields.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {tagFields.map((field, index) => (
                                                    <div
                                                        key={field.id}
                                                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-knugget-100 text-knugget-800 dark:bg-knugget-900 dark:text-knugget-200"
                                                    >
                                                        <span>{form.watch(`tags.${index}`)}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTag(index)}
                                                            className="ml-2 hover:text-red-600 transition-colors"
                                                            disabled={isLoading}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {form.formState.errors.tags?.root && (
                                            <p className="text-sm text-red-600">
                                                {form.formState.errors.tags.root.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Form Actions */}
                                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleClose}
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Spinner size="sm" className="mr-2" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save Summary
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}