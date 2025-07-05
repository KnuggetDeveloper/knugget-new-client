"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useSummaries } from "@/hooks/use-summaries";
import { useLinkedinPosts } from "@/hooks/use-linkedin-posts";
import { Input } from "@/components/ui/input";
import { YouTubeCard, LinkedInCard } from "@/components/content-cards";

interface KnuggetItem {
  id: string;
  type: "youtube" | "linkedin" | "website" | "twitter";
  title: string;
  source: string;
  author?: string;
  content?: string;
  thumbnail?: string;
  url: string;
  tags: string[];
  createdAt: string;
  // Additional fields for different content types
  videoMetadata?: {
    duration?: string;
    channelName: string;
    thumbnailUrl?: string;
  };
  metadata?: {
    authorImage?: string;
    authorAbout?: string;
    siteLogo?: string;
  };
  summary?: string;
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [allItems, setAllItems] = useState<KnuggetItem[]>([]);

  // Fetch data from hooks
  const { summaries, isLoading: summariesLoading } = useSummaries({
    limit: 50,
  });
  const { posts: linkedinPosts, isLoading: linkedinLoading } = useLinkedinPosts(
    { limit: 50 }
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Combine all data sources
  useEffect(() => {
    const items: KnuggetItem[] = [];

    // Add summaries (YouTube)
    summaries.forEach((summary) => {
      items.push({
        id: summary.id,
        type: "youtube",
        title: summary.videoMetadata.title,
        source: summary.videoMetadata.channelName,
        thumbnail: summary.videoMetadata.thumbnailUrl,
        url: summary.videoMetadata.url,
        tags: summary.tags,
        createdAt: summary.createdAt,
        videoMetadata: {
          duration: summary.videoMetadata.duration,
          channelName: summary.videoMetadata.channelName,
          thumbnailUrl: summary.videoMetadata.thumbnailUrl,
        },
        summary: summary.fullSummary,
      });
    });

    // Add LinkedIn posts
    linkedinPosts.forEach((post) => {
      items.push({
        id: post.id,
        type: "linkedin",
        title: post.title || "",
        source: "LinkedIn",
        author: post.author,
        content: post.content,
        url: post.postUrl,
        tags: [], // LinkedIn posts don't have tags in current structure
        createdAt: post.savedAt,
        metadata: {
          authorImage: post.metadata?.authorImage as string,
          authorAbout: post.metadata?.authorAbout as string,
        },
      });
    });

    // Sort by creation date (newest first)
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setAllItems(items);
  }, [summaries, linkedinPosts]);

  // Filter items based on search
  const filteredItems = allItems.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.author &&
        item.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.content &&
        item.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesSearch;
  });



  const handleItemClick = (item: KnuggetItem) => {
    switch (item.type) {
      case "youtube":
        router.push(`/knugget/youtube/${item.id}`);
        break;
      case "linkedin":
        router.push(`/knugget/linkedin/${item.id}`);
        break;
      case "website":
        router.push(`/knugget/website/${item.id}`);
        break;
      case "twitter":
        router.push(`/knugget/twitter/${item.id}`);
        break;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
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
        </div>

        {/* Content Grid */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-2">All Knuggets</h1>
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

          {/* Items Grid - Fixed Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {filteredItems.map((item) => {
              switch (item.type) {
                case "youtube":
                  return (
                    <YouTubeCard
                      key={item.id}
                      data={{
                        id: item.id,
                        title: item.title,
                        source: item.source,
                        thumbnail: item.thumbnail,
                        url: item.url,
                        tags: item.tags,
                        createdAt: item.createdAt,
                        duration: item.videoMetadata?.duration,
                      }}
                      onCardClick={() => handleItemClick(item)}
                    />
                  );
                case "linkedin":
                  return (
                    <LinkedInCard
                      key={item.id}
                      data={{
                        id: item.id,
                        title: item.title,
                        author: item.author || "Unknown Author",
                        role: item.metadata?.authorAbout,
                        profileImage: item.metadata?.authorImage,
                        content: item.content || "",
                        url: item.url,
                        tags: item.tags,
                        createdAt: item.createdAt,
                      }}
                      onCardClick={() => handleItemClick(item)}
                    />
                  );
                default:
                  return null;
              }
            })}
          </div>

          {/* Empty State */}
          {!summariesLoading &&
            !linkedinLoading &&
            filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No knuggets found</p>
                  <p className="text-sm">
                    {searchQuery
                      ? `No results for "${searchQuery}"`
                      : "Start by adding some content"}
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
