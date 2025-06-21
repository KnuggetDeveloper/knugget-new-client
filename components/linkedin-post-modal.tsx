/* eslint-disable @next/next/no-img-element */
// components/linkedin-post-modal.tsx
"use client";

import { useState } from "react";
import {
  X,
  ExternalLink,
  User,
  Calendar,
  Globe,
  Heart,
  MessageCircle,
  Share,
  Copy,
} from "lucide-react";
import { LinkedinPost } from "@/lib/linkedin-service";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/additional";

interface LinkedinPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: LinkedinPost | null;
}

export function LinkedinPostModal({
  isOpen,
  onClose,
  post,
}: LinkedinPostModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !post) return null;

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(post.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy content:", error);
    }
  };

  const handleOpenPost = () => {
    window.open(post.postUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-lg bg-background shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold">
                {post.metadata?.authorImage ? (
                  <img
                    src={String(post.metadata.authorImage)}
                    alt={post.author}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {post.author}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    <Globe className="h-3 w-3 mr-1" />
                    LinkedIn
                  </Badge>
                </div>
                {Boolean(post.metadata?.authorAbout) && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {String(post.metadata?.authorAbout)}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatRelativeTime(post.savedAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>Saved {formatDate(post.savedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenPost}
                title="Open LinkedIn post"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Post Title */}
            {post.title && (
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  {post.title}
                </h4>
              </div>
            )}

            {/* Post Content */}
            <div className="space-y-4">
              <div className="relative">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {post.content}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyContent}
                  className="absolute top-0 right-0 opacity-75 hover:opacity-100"
                  title="Copy content"
                >
                  {copied ? (
                    <span className="text-green-600 text-xs">Copied!</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Engagement Stats */}
              {post.engagement && (
                <div className="flex items-center space-x-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Engagement:</span>
                  </div>
                  {post.engagement.likes !== undefined && (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>{post.engagement.likes}</span>
                    </div>
                  )}
                  {post.engagement.comments !== undefined && (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <span>{post.engagement.comments}</span>
                    </div>
                  )}
                  {post.engagement.shares !== undefined && (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Share className="h-4 w-4 text-green-500" />
                      <span>{post.engagement.shares}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Metadata */}
              {post.metadata && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">
                      Source Information
                    </h5>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Platform:</span>{" "}
                        <span className="font-medium">{post.platform}</span>
                      </div>
                      {post.metadata.source && (
                        <div>
                          <span className="text-muted-foreground">Source:</span>{" "}
                          <span className="font-medium">
                            {String(post.metadata.source)}
                          </span>
                        </div>
                      )}
                      {post.metadata.timestamp && (
                        <div>
                          <span className="text-muted-foreground">
                            Captured:
                          </span>{" "}
                          <span className="font-medium">
                            {formatDate(post.metadata.timestamp)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">
                      Post Details
                    </h5>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Post ID:</span>{" "}
                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                          {post.id.slice(-8)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Characters:
                        </span>{" "}
                        <span className="font-medium">
                          {post.content.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-muted/30">
            <div className="text-sm text-muted-foreground">
              Saved on {formatDate(post.savedAt)}
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handleCopyContent}>
                {copied ? "Copied!" : "Copy Content"}
              </Button>
              <Button onClick={handleOpenPost}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View on LinkedIn
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
