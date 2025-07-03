/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Youtube, Linkedin, Globe, Twitter, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useSummaries } from '@/hooks/use-summaries'
import { useLinkedinPosts } from '@/hooks/use-linkedin-posts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/additional'
import { formatRelativeTime } from '@/lib/utils'

interface KnuggetItem {
  id: string
  type: 'youtube' | 'linkedin' | 'website' | 'twitter'
  title: string
  source: string
  author?: string
  content?: string
  thumbnail?: string
  url: string
  tags: string[]
  createdAt: string
}

const sourceIcons = {
  youtube: Youtube,
  linkedin: Linkedin,
  website: Globe,
  twitter: Twitter,
}

const sourceColors = {
  youtube: 'text-red-500',
  linkedin: 'text-blue-500',
  website: 'text-green-500',
  twitter: 'text-blue-400',
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const router = useRouter()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSource, setSelectedSource] = useState('all')
  // const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [allItems, setAllItems] = useState<KnuggetItem[]>([])
  
  // Fetch data from hooks
  const { summaries, isLoading: summariesLoading } = useSummaries({ limit: 50 })
  const { posts: linkedinPosts, isLoading: linkedinLoading } = useLinkedinPosts({ limit: 50 })

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  // Combine all data sources
  useEffect(() => {
    const items: KnuggetItem[] = []

    // Add summaries (YouTube)
    summaries.forEach(summary => {
      items.push({
        id: summary.id,
        type: 'youtube',
        title: summary.videoMetadata.title,
        source: summary.videoMetadata.channelName,
        thumbnail: summary.videoMetadata.thumbnailUrl,
        url: summary.videoMetadata.url,
        tags: summary.tags,
        createdAt: summary.createdAt,
      })
    })

    // Add LinkedIn posts
    linkedinPosts.forEach(post => {
      items.push({
        id: post.id,
        type: 'linkedin',
        title: post.title || `Post by ${post.author}`,
        source: 'LinkedIn',
        author: post.author,
        content: post.content,
        url: post.postUrl,
        tags: [], // LinkedIn posts don't have tags in current structure
        createdAt: post.savedAt,
      })
    })

    // Sort by creation date (newest first)
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    setAllItems(items)
  }, [summaries, linkedinPosts])

  // Filter items based on selected source and search
  const filteredItems = allItems.filter(item => {
    const matchesSource = selectedSource === 'all' || item.type === selectedSource
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesSource && matchesSearch
  })

  // Get all unique tags
  const allTags = Array.from(new Set(allItems.flatMap(item => item.tags)))
    .slice(0, 20) // Limit to top 20 tags

  // Get source counts
  const sourceCounts = {
    all: allItems.length,
    youtube: allItems.filter(item => item.type === 'youtube').length,
    linkedin: allItems.filter(item => item.type === 'linkedin').length,
    website: allItems.filter(item => item.type === 'website').length,
    twitter: allItems.filter(item => item.type === 'twitter').length,
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  const handleItemClick = (item: KnuggetItem) => {
    switch (item.type) {
      case 'youtube':
        router.push(`/knugget/youtube/${item.id}`)
        break
      case 'linkedin':
        router.push(`/knugget/linkedin/${item.id}`)
        break
      case 'website':
        router.push(`/knugget/website/${item.id}`)
        break
      case 'twitter':
        router.push(`/knugget/twitter/${item.id}`)
        break
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <span className="text-lg font-semibold">Knugget</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-gray-400 hover:text-white"
            >
              {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Sources */}
        <div className="flex-1 p-4 space-y-6">
          <div>
            {!sidebarCollapsed && <h3 className="text-sm font-medium text-gray-400 mb-3">Sources</h3>}
            <div className="space-y-1">
              <Button
                variant={selectedSource === 'all' ? 'secondary' : 'ghost'}
                className={`w-full ${sidebarCollapsed ? 'px-3' : 'justify-start'} text-sm`}
                onClick={() => setSelectedSource('all')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded bg-orange-500 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span>All Knuggets</span>
                      <span className="ml-auto text-xs text-gray-400">({sourceCounts.all})</span>
                    </>
                  )}
                </div>
              </Button>

              <Button
                variant={selectedSource === 'youtube' ? 'secondary' : 'ghost'}
                className={`w-full ${sidebarCollapsed ? 'px-3' : 'justify-start'} text-sm`}
                onClick={() => setSelectedSource('youtube')}
              >
                <div className="flex items-center space-x-3">
                  <Youtube className="w-4 h-4 text-red-500 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span>YouTube</span>
                      <span className="ml-auto text-xs text-gray-400">({sourceCounts.youtube})</span>
                    </>
                  )}
                </div>
              </Button>

              <Button
                variant={selectedSource === 'linkedin' ? 'secondary' : 'ghost'}
                className={`w-full ${sidebarCollapsed ? 'px-3' : 'justify-start'} text-sm`}
                onClick={() => setSelectedSource('linkedin')}
              >
                <div className="flex items-center space-x-3">
                  <Linkedin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span>LinkedIn</span>
                      <span className="ml-auto text-xs text-gray-400">({sourceCounts.linkedin})</span>
                    </>
                  )}
                </div>
              </Button>

              <Button
                variant={selectedSource === 'website' ? 'secondary' : 'ghost'}
                className={`w-full ${sidebarCollapsed ? 'px-3' : 'justify-start'} text-sm`}
                onClick={() => setSelectedSource('website')}
              >
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span>Websites</span>
                      <span className="ml-auto text-xs text-gray-400">({sourceCounts.website})</span>
                    </>
                  )}
                </div>
              </Button>

              <Button
                variant={selectedSource === 'twitter' ? 'secondary' : 'ghost'}
                className={`w-full ${sidebarCollapsed ? 'px-3' : 'justify-start'} text-sm`}
                onClick={() => setSelectedSource('twitter')}
              >
                <div className="flex items-center space-x-3">
                  <Twitter className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span>X</span>
                      <span className="ml-auto text-xs text-gray-400">({sourceCounts.twitter})</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </div>

          {/* Topics */}
          {!sidebarCollapsed && allTags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Topics</h3>
              <div className="space-y-1">
                {allTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={() => setSearchQuery(tag)}
                  >
                    <span className="text-orange-500 mr-2">#</span>
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        {!sidebarCollapsed && user && (
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                <p className="text-xs text-gray-400">{user.plan} Plan</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
            >
              <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-2">
              {selectedSource === 'all' ? 'All Knuggets' : 
               selectedSource === 'youtube' ? 'YouTube' :
               selectedSource === 'linkedin' ? 'LinkedIn' :
               selectedSource === 'website' ? 'Websites' : 'X'}
            </h1>
            <p className="text-gray-400 text-sm">
              {filteredItems.length} items
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>

          {/* Loading State */}
          {(summariesLoading || linkedinLoading) && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          )}

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const IconComponent = sourceIcons[item.type]
              const iconColor = sourceColors[item.type]
              
              return (
                <Card
                  key={item.id}
                  className="bg-gray-800 border-gray-700 hover:border-gray-600 cursor-pointer transition-all duration-200 hover:shadow-lg"
                  onClick={() => handleItemClick(item)}
                >
                  <CardContent className="p-4">
                    {/* Source Icon & Date */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <IconComponent className={`w-4 h-4 ${iconColor}`} />
                        <span className="text-xs text-gray-400">{item.source}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    {/* Thumbnail for YouTube */}
                    {item.type === 'youtube' && item.thumbnail && (
                      <div className="mb-3 rounded-lg overflow-hidden">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-32 object-cover"
                        />
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-white font-medium mb-2 line-clamp-2 leading-tight">
                      {item.title}
                    </h3>

                    {/* Content preview for LinkedIn */}
                    {item.type === 'linkedin' && item.content && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {item.content}
                      </p>
                    )}

                    {/* Author for LinkedIn */}
                    {item.author && (
                      <p className="text-gray-500 text-xs mb-3">by {item.author}</p>
                    )}

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs border-gray-600 text-gray-300 bg-gray-700/50"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-xs border-gray-600 text-gray-400 bg-gray-700/50"
                          >
                            +{item.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Empty State */}
          {!summariesLoading && !linkedinLoading && filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No knuggets found</p>
                <p className="text-sm">
                  {searchQuery ? `No results for "${searchQuery}"` : 'Start by adding some content'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}