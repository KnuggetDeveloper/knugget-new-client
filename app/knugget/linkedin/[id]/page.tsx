/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Linkedin,
  User,
  Heart,
  MessageCircle,
  Share,
} from "lucide-react";
import { useLinkedinPost } from "@/hooks/use-linkedin-posts";
import { Button } from "@/components/ui/button";
// import { Badge } from '@/components/ui/additional'
import { formatRelativeTime } from "@/lib/utils";

interface LinkedInDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function LinkedInDetailPage({
  params,
}: LinkedInDetailPageProps) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = React.useState<{
    id: string;
  } | null>(null);

  React.useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const { post, isLoading, error } = useLinkedinPost(
    resolvedParams ? resolvedParams.id : ""
  );

  const handleBack = () => {
    router.back();
  };

  const handleOpenPost = () => {
    if (post?.postUrl) {
      window.open(post.postUrl, "_blank");
    }
  };

  if (isLoading || !resolvedParams) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="p-6">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="p-6">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-12">
            <p className="text-red-400">Failed to load LinkedIn post</p>
            <p className="text-gray-400 text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6">
            {/* Author Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  {post.metadata?.authorImage ? (
                    <img
                      src={String(post.metadata.authorImage)}
                      alt={post.author}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-semibold">{post.author}</h1>
                  {post.metadata && Boolean(post.metadata.authorAbout) && (
                    <p className="text-sm text-gray-400 line-clamp-1">
                      {String(post.metadata.authorAbout)}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    <Linkedin className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-400">LinkedIn</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(post.savedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenPost}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                LinkedIn Post Link
              </Button>
            </div>

            {/* Post Title */}
            {post.title && (
              <h2 className="text-xl font-semibold mb-4">{post.title}</h2>
            )}

            {/* Post Content */}
            <div className="mb-6">
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            </div>

            {/* Engagement Stats */}
            {post.engagement && (
              <div className="flex items-center space-x-6 py-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  <span className="font-medium">Engagement:</span>
                </div>
                {post.engagement.likes !== undefined && (
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-gray-300">
                      {post.engagement.likes}
                    </span>
                  </div>
                )}
                {post.engagement.comments !== undefined && (
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-300">
                      {post.engagement.comments}
                    </span>
                  </div>
                )}
                {post.engagement.shares !== undefined && (
                  <div className="flex items-center space-x-2">
                    <Share className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-300">
                      {post.engagement.shares}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-700">
              <div>
                <h3 className="text-sm font-medium text-orange-400 mb-3">
                  Source Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Platform:</span>
                    <span className="text-gray-300">{post.platform}</span>
                  </div>
                  {post.metadata?.source && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Source:</span>
                      <span className="text-gray-300">
                        {String(post.metadata.source)}
                      </span>
                    </div>
                  )}
                  {post.metadata?.timestamp && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Captured:</span>
                      <span className="text-gray-300">
                        {new Date(post.metadata.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-orange-400 mb-3">
                  Post Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Post ID:</span>
                    <span className="text-gray-300 font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                      {post.id.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Characters:</span>
                    <span className="text-gray-300">{post.content.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Saved:</span>
                    <span className="text-gray-300">
                      {new Date(post.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
