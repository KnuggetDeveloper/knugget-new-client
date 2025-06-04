'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  MoreHorizontal,
  Edit3,
  Trash2,
  ExternalLink,
  Play,
  Clock,
  Calendar,
  Tag,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Summary } from '@/types/summary'
import { formatRelativeTime, truncate } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SummaryCardProps {
  summary: Summary
  onEdit?: (summary: Summary) => void
  onDelete?: (summary: Summary) => void
  onView?: (summary: Summary) => void
  isSelected?: boolean
  onSelect?: (summary: Summary, selected: boolean) => void
  showActions?: boolean
}

export function SummaryCard({
  summary,
  onEdit,
  onDelete,
  onView,
  isSelected = false,
  onSelect,
  showActions = true,
}: SummaryCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleCardClick = () => {
    if (onView) {
      onView(summary)
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onSelect) {
      onSelect(summary, !isSelected)
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(!isMenuOpen)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(false)
    if (onEdit) {
      onEdit(summary)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(false)
    if (onDelete) {
      onDelete(summary)
    }
  }

  const handleVideoLink = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(summary.videoMetadata.url, '_blank', 'noopener,noreferrer')
  }

  const getStatusIcon = () => {
    switch (summary.status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'FAILED':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (summary.status) {
      case 'COMPLETED':
        return 'Completed'
      case 'PROCESSING':
        return 'Processing'
      case 'FAILED':
        return 'Failed'
      default:
        return 'Pending'
    }
  }

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-knugget-500 bg-knugget-50 dark:bg-knugget-950' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="relative pb-3">
        {/* Selection Checkbox */}
        {onSelect && (
          <div className="absolute top-4 left-4 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => {}}
              onClick={handleCheckboxClick}
              className="h-4 w-4 rounded border-gray-300 text-knugget-600 focus:ring-knugget-500"
            />
          </div>
        )}

        {/* Actions Menu */}
        {showActions && (
          <div className="absolute top-4 right-4 z-10">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleMenuClick}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsMenuOpen(false)}
                  />
                  
                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-48 rounded-md border bg-popover shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={handleEdit}
                        className="flex w-full items-center px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <Edit3 className="mr-3 h-4 w-4" />
                        Edit Summary
                      </button>
                      <button
                        onClick={handleVideoLink}
                        className="flex w-full items-center px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <ExternalLink className="mr-3 h-4 w-4" />
                        Open Video
                      </button>
                      <div className="border-t my-1" />
                      <button
                        onClick={handleDelete}
                        className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      >
                        <Trash2 className="mr-3 h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Video Thumbnail */}
        <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {summary.videoMetadata.thumbnailUrl && !imageError ? (
            <Image
              src={summary.videoMetadata.thumbnailUrl}
              alt={summary.videoMetadata.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Play className="h-12 w-12 text-gray-400" />
            </div>
          )}

          {/* Video Duration Overlay */}
          {summary.videoMetadata.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {summary.videoMetadata.duration}
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              summary.status === 'COMPLETED' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : summary.status === 'PROCESSING'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : summary.status === 'FAILED'
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </div>
          </div>
        </div>

        {/* Title and Description */}
        <div className="space-y-2">
          <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-knugget-600 transition-colors">
            {summary.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground line-clamp-1">
            {summary.videoMetadata.channelName}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Points Preview */}
        {summary.keyPoints.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Key Points</span>
            </div>
            <ul className="space-y-1">
              {summary.keyPoints.slice(0, 3).map((point, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-knugget-500 mt-2 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground line-clamp-2">
                    {truncate(point, 100)}
                  </span>
                </li>
              ))}
              {summary.keyPoints.length > 3 && (
                <li className="text-sm text-muted-foreground ml-3.5">
                  +{summary.keyPoints.length - 3} more points
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Tags */}
        {summary.tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {summary.tags.slice(0, 4).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
              {summary.tags.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{summary.tags.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Summary Preview */}
        {summary.fullSummary && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Summary</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {truncate(summary.fullSummary, 200)}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatRelativeTime(summary.createdAt)}</span>
            </div>
            {summary.videoMetadata.duration && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{summary.videoMetadata.duration}</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleVideoLink}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleEdit}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}