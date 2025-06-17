/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Plus,
  Trash2,
  Download,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  User,
  Calendar,
  TrendingUp,
  Grid,
  List,
  Search,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLinkedinPosts, useLinkedinPostActions, useLinkedinPostStats } from '@/hooks/use-linkedin-posts'
import { LinkedinPost } from '@/lib/linkedin-service'
import { formatRelativeTime } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/additional'

// LinkedIn Post Card Component
interface LinkedinPostCardProps {
  post: LinkedinPost
  onView: (post: LinkedinPost) => void
  onEdit: (post: LinkedinPost) => void
  onDelete: (post: LinkedinPost) => void
  onSelect: (post: LinkedinPost, selected: boolean) => void
  isSelected: boolean
}

function LinkedinPostCard({
  post,
  onView,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
}: LinkedinPostCardProps) {
  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-knugget-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(post, e.target.checked)}
              className="rounded border-gray-300"
            />
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">
                {post.title || `Post by ${post.author}`}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{post.author}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(post.postUrl, '_blank')}
              title="Open LinkedIn post"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(post)}
              title="Edit post"
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(post)}
              title="Delete post"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {post.content}
          </p>
          
          {post.engagement && (
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              {post.engagement.likes !== undefined && (
                <span>👍 {post.engagement.likes}</span>
              )}
              {post.engagement.comments !== undefined && (
                <span>💬 {post.engagement.comments}</span>
              )}
              {post.engagement.shares !== undefined && (
                <span>🔄 {post.engagement.shares}</span>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatRelativeTime(post.savedAt)}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {post.platform}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LinkedinPostsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  const {
    posts,
    pagination,
    isLoading: postsLoading,
    error: postsError,
    params,
    search,
    filterByAuthor,
    sort,
    changePage,
    refresh,
    clearFilters,
  } = useLinkedinPosts()

  const {
    deletePost,
    bulkDeletePosts,
    isLoading: actionLoading,
    error: actionError,
    clearError,
  } = useLinkedinPostActions()

  const { stats, isLoading: statsLoading, refresh: refreshStats } = useLinkedinPostStats()

  // UI state
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all')
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    post: LinkedinPost | null
    isBulk: boolean
  }>({
    isOpen: false,
    post: null,
    isBulk: false,
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?returnUrl=/linkedin-posts')
    }
  }, [isAuthenticated, authLoading, router])

  // Clear action errors after 5 seconds
  useEffect(() => {
    if (actionError) {
      const timeout = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [actionError, clearError])

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null
  }

  // Handle post actions
  const handleViewPost = (post: LinkedinPost) => {
    window.open(post.postUrl, '_blank')
  }

  const handleEditPost = (post: LinkedinPost) => {
    // TODO: Implement edit modal
    console.log('Edit post:', post.id)
  }

  const handleDeletePost = (post: LinkedinPost) => {
    setDeleteConfirm({
      isOpen: true,
      post,
      isBulk: false,
    })
  }

  const handleSelectPost = (post: LinkedinPost, selected: boolean) => {
    if (selected) {
      setSelectedPosts([...selectedPosts, post.id])
    } else {
      setSelectedPosts(selectedPosts.filter(id => id !== post.id))
    }
  }

  const handleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([])
    } else {
      setSelectedPosts(posts.map((p: LinkedinPost) => p.id))
    }
  }

  const handleBulkDelete = () => {
    if (selectedPosts.length > 0) {
      setDeleteConfirm({
        isOpen: true,
        post: null,
        isBulk: true,
      })
    }
  }

  const confirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk) {
        const success = await bulkDeletePosts(selectedPosts)
        if (success) {
          setSelectedPosts([])
          refresh()
          refreshStats()
        }
      } else if (deleteConfirm.post) {
        const success = await deletePost(deleteConfirm.post.id)
        if (success) {
          refresh()
          refreshStats()
        }
      }
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setDeleteConfirm({ isOpen: false, post: null, isBulk: false })
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    search(query)
  }

  const handleAuthorFilter = (author: string) => {
    setSelectedAuthor(author)
    filterByAuthor(author)
  }

  const handleExport = async () => {
    try {
      const postsToExport = selectedPosts.length > 0
        ? posts.filter((p: LinkedinPost) => selectedPosts.includes(p.id))
        : posts

      if (postsToExport.length === 0) {
        return
      }

      const exportData = {
        posts: postsToExport,
        metadata: {
          exportedAt: new Date().toISOString(),
          totalCount: postsToExport.length,
          version: '1.0',
          exportedBy: user.email,
        }
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement('a')
      link.href = url
      link.download = `knugget-linkedin-posts-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      // Clear selection after export
      if (selectedPosts.length > 0) {
        setSelectedPosts([])
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleRefresh = () => {
    refresh()
    refreshStats()
  }

  // Get unique authors for filter
  const uniqueAuthors = Array.from(new Set(posts.map(p => p.author))).slice(0, 10)

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          LinkedIn Posts
        </h1>
        <p className="text-muted-foreground">
          Manage your saved LinkedIn posts and insights.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Spinner size="sm" />
              ) : (
                stats?.totalPosts || posts.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              All time saved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Spinner size="sm" />
              ) : (
                stats?.postsThisMonth || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Spinner size="sm" />
              ) : (
                stats?.postsThisWeek || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Past 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Authors</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Spinner size="sm" />
              ) : (
                stats?.topAuthors?.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique authors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {(postsError || actionError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {postsError || actionError}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Author Filter */}
          <select
            value={selectedAuthor}
            onChange={(e) => handleAuthorFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background text-sm rounded-md"
          >
            <option value="all">All Authors</option>
            {uniqueAuthors.map((author) => (
              <option key={author} value={author}>
                {author}
              </option>
            ))}
          </select>

          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={view === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={postsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${postsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPosts.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {selectedPosts.length} post{selectedPosts.length === 1 ? '' : 's'} selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedPosts.length === posts.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={selectedPosts.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={actionLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {/* Loading State */}
        {postsLoading && posts.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty State */}
        {!postsLoading && posts.length === 0 && !postsError && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No LinkedIn posts yet</h3>
            <p className="text-muted-foreground mb-4">
              Posts saved from LinkedIn will appear here
            </p>
            <Button onClick={() => window.open('https://linkedin.com', '_blank')}>
              <Plus className="h-4 w-4 mr-2" />
              Visit LinkedIn
            </Button>
          </div>
        )}

        {/* Posts Grid/List */}
        {posts.length > 0 && (
          <div className={
            view === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {posts.map((post: LinkedinPost) => (
              <LinkedinPostCard
                key={post.id}
                post={post}
                onView={handleViewPost}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                onSelect={handleSelectPost}
                isSelected={selectedPosts.includes(post.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} posts
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(pagination.page - 1)}
                disabled={!pagination.hasPrev || postsLoading}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(pagination.page + 1)}
                disabled={!pagination.hasNext || postsLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50 transition-opacity" />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md rounded-lg bg-background shadow-xl">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">
                      {deleteConfirm.isBulk ? 'Delete Multiple Posts' : 'Delete Post'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {deleteConfirm.isBulk
                        ? `Are you sure you want to delete ${selectedPosts.length} posts? This action cannot be undone.`
                        : 'Are you sure you want to delete this post? This action cannot be undone.'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirm({ isOpen: false, post: null, isBulk: false })}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Spinner size="sm" className="mr-2" />}
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}