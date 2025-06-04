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
  CheckCircle2,
  Clock,
  TrendingUp,
  Grid,
  List,
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useSummaries, useSummaryActions, useSummaryStats, usePopularTags } from '@/hooks/use-summaries'
import { Summary, UpdateSummaryRequest } from '@/types/summary'
import { formatUserName } from '@/lib/utils'
import { SummaryCard } from '@/components/summary-card'
import { SummaryFilters } from '@/components/summary-filters'
import { SummaryModal } from '@/components/summary-model'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Summary hooks
  const {
    summaries,
    pagination,
    isLoading: summariesLoading,
    error: summariesError,
    params,
    search,
    filterByStatus,
    sort,
    changePage,
    refresh,
    clearFilters,
  } = useSummaries()

  const {
    updateSummary,
    deleteSummary,
    bulkDeleteSummaries,
    isLoading: actionLoading,
    error: actionError,
    clearError,
  } = useSummaryActions()

  const { stats, isLoading: statsLoading, refresh: refreshStats } = useSummaryStats()
  const { tags: popularTags, refresh: refreshTags } = usePopularTags(15)

  // UI state
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selectedSummaries, setSelectedSummaries] = useState<string[]>([])
  const [modal, setModal] = useState<{
    isOpen: boolean
    mode: 'view' | 'edit' | 'create'
    summary: Summary | null
  }>({
    isOpen: false,
    mode: 'view',
    summary: null,
  })

  // Show delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    summary: Summary | null
    isBulk: boolean
  }>({
    isOpen: false,
    summary: null,
    isBulk: false,
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?returnUrl=/dashboard')
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

  // Listen for Chrome extension sync events
  useEffect(() => {
    const handleExtensionSync = () => {
      refresh()
      refreshStats()
      refreshTags()
    }

    // Listen for summary sync events from extension
    window.addEventListener('summarySync', handleExtensionSync)
    return () => window.removeEventListener('summarySync', handleExtensionSync)
  }, [refresh, refreshStats, refreshTags])

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

  // Handle summary actions
  const handleViewSummary = (summary: Summary) => {
    setModal({
      isOpen: true,
      mode: 'view',
      summary,
    })
  }

  const handleEditSummary = (summary: Summary) => {
    setModal({
      isOpen: true,
      mode: 'edit',
      summary,
    })
  }

  const handleDeleteSummary = (summary: Summary) => {
    setDeleteConfirm({
      isOpen: true,
      summary,
      isBulk: false,
    })
  }

  const handleCreateNew = () => {
    setModal({
      isOpen: true,
      mode: 'create',
      summary: null,
    })
  }

  const handleSelectSummary = (summary: Summary, selected: boolean) => {
    if (selected) {
      setSelectedSummaries([...selectedSummaries, summary.id])
    } else {
      setSelectedSummaries(selectedSummaries.filter(id => id !== summary.id))
    }
  }

  const handleSelectAll = () => {
    if (selectedSummaries.length === summaries.length) {
      setSelectedSummaries([])
    } else {
      setSelectedSummaries(summaries.map((s: Summary) => s.id))
    }
  }

  const handleBulkDelete = () => {
    if (selectedSummaries.length > 0) {
      setDeleteConfirm({
        isOpen: true,
        summary: null,
        isBulk: true,
      })
    }
  }

  const confirmDelete = async () => {
    try {
      if (deleteConfirm.isBulk) {
        const success = await bulkDeleteSummaries(selectedSummaries)
        if (success) {
          setSelectedSummaries([])
          refresh()
          refreshStats()
        }
      } else if (deleteConfirm.summary) {
        const success = await deleteSummary(deleteConfirm.summary.id)
        if (success) {
          refresh()
          refreshStats()
        }
      }
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setDeleteConfirm({ isOpen: false, summary: null, isBulk: false })
    }
  }

  const handleSaveSummary = async (data: UpdateSummaryRequest) => {
    if (!modal.summary) {
      // Handle create new summary case
      // For now, we'll just close the modal since create functionality
      // would typically require additional API endpoints for creating from scratch
      setModal({ isOpen: false, mode: 'view', summary: null })
      return
    }

    try {
      const updatedSummary = await updateSummary(modal.summary.id, data)
      if (updatedSummary) {
        refresh()
        refreshStats()
        setModal({ isOpen: false, mode: 'view', summary: null })
      }
    } catch (error) {
      console.error('Save failed:', error)
      // Error is handled by the hook and displayed in the UI
    }
  }

  const handleExport = async () => {
    try {
      const summariesToExport = selectedSummaries.length > 0
        ? summaries.filter((s: Summary) => selectedSummaries.includes(s.id))
        : summaries

      if (summariesToExport.length === 0) {
        return
      }

      const exportData = {
        summaries: summariesToExport,
        metadata: {
          exportedAt: new Date().toISOString(),
          totalCount: summariesToExport.length,
          version: '1.0',
          exportedBy: user.email,
        }
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement('a')
      link.href = url
      link.download = `knugget-summaries-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      // Clear selection after export
      if (selectedSummaries.length > 0) {
        setSelectedSummaries([])
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleRefresh = () => {
    refresh()
    refreshStats()
    refreshTags()
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Welcome back, {formatUserName(user.name, user.email)}!
        </h1>
        <p className="text-muted-foreground">
          Manage your AI-powered video summaries and insights.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Summaries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Spinner size="sm" />
              ) : (
                stats?.totalSummaries || summaries.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              All time generated
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
                stats?.summariesThisMonth || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Spinner size="sm" />
              ) : (
                stats?.completedSummaries ||
                summaries.filter((s: Summary) => s.status === 'COMPLETED').length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Left</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.credits}</div>
            <p className="text-xs text-muted-foreground">
              {user.plan} plan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {(summariesError || actionError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {summariesError || actionError}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Actions */}
      <SummaryFilters
        params={params}
        onSearch={search}
        onFilterByStatus={filterByStatus}
        onSort={sort}
        onClearFilters={clearFilters}
        onViewChange={setView}
        onExport={handleExport}
        onCreateNew={handleCreateNew}
        view={view}
        isLoading={summariesLoading}
        popularTags={popularTags}
      />

      {/* Bulk Actions */}
      {selectedSummaries.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {selectedSummaries.length} summary{selectedSummaries.length === 1 ? '' : 'ies'} selected
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedSummaries.length === summaries.length ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={selectedSummaries.length === 0}
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
        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Your Summaries ({pagination.total})
          </h2>
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
              disabled={summariesLoading}
            >
              <RefreshCw className={`h-4 w-4 ${summariesLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {summariesLoading && summaries.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty State */}
        {!summariesLoading && summaries.length === 0 && !summariesError && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No summaries yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first video summary
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Summary
            </Button>
          </div>
        )}

        {/* Summaries Grid/List */}
        {summaries.length > 0 && (
          <div className={
            view === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }>
            {summaries.map((summary: Summary) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                onView={handleViewSummary}
                onEdit={handleEditSummary}
                onDelete={handleDeleteSummary}
                onSelect={handleSelectSummary}
                isSelected={selectedSummaries.includes(summary.id)}
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
              {pagination.total} summaries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changePage(pagination.page - 1)}
                disabled={!pagination.hasPrev || summariesLoading}
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
                disabled={!pagination.hasNext || summariesLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Modal */}
      <SummaryModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ isOpen: false, mode: 'view', summary: null })}
        summary={modal.summary}
        mode={modal.mode}
        onSave={handleSaveSummary}
        isLoading={actionLoading}
      />

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
                      {deleteConfirm.isBulk ? 'Delete Multiple Summaries' : 'Delete Summary'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {deleteConfirm.isBulk
                        ? `Are you sure you want to delete ${selectedSummaries.length} summaries? This action cannot be undone.`
                        : 'Are you sure you want to delete this summary? This action cannot be undone.'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirm({ isOpen: false, summary: null, isBulk: false })}
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