/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Linkedin,
  User,
} from "lucide-react";
import { useLinkedinPost } from "@/hooks/use-linkedin-posts";
import { Button } from "@/components/ui/button";

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Extract tags from content (assuming hashtags in the content)
  const extractTags = (content: string) => {
    const hashtagRegex = /#\w+/g;
    const matches = content.match(hashtagRegex);
    return matches || [];
  };

  if (isLoading || !resolvedParams) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="p-6">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            className="mb-6 text-gray-400 hover:text-white"
          >
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
      <div className="min-h-screen bg-[#151515] text-white">
        <div className="p-6">
          <Button 
            variant="ghost" 
            onClick={handleBack} 
            className="mb-6 text-gray-400 hover:text-white"
          >
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

  const tags = extractTags(post.content);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with Back Button */}
      <div className="p-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Main Content Container */}
        <div className="max-w-4xl mx-auto">
          {/* Top Row Header: LinkedIn + Date */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-2">
              <Linkedin className="w-5 h-5 text-blue-500" />
              <span className="text-white font-medium">LinkedIn</span>
            </div>
            <div className="text-gray-400 text-sm">
              {formatDate(post.savedAt)}
            </div>
          </div>

          {/* Author Section */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
              {post.metadata?.authorImage ? (
                <img
                  src={String(post.metadata.authorImage)}
                  alt={post.author}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{post.author}</h1>
              {post.metadata && Boolean(post.metadata.authorAbout) && (
                <p className="text-gray-400 text-sm">
                  {String(post.metadata.authorAbout)}
                </p>
              )}
            </div>
          </div>

          {/* LinkedIn Post Link */}
          <div className="mb-6">
            <button
              onClick={handleOpenPost}
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span className="text-sm">LinkedIn Post Link</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 border border-yellow-500 text-yellow-500 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Content Box */}
          <div className="bg-[#313130] rounded-lg p-6">
            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>
        </div>  
      </div>
    </div>
  );
}