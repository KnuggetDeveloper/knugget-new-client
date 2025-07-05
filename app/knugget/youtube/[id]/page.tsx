/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Youtube } from "lucide-react";
import { useSummary } from "@/hooks/use-summaries";
import { Button } from "@/components/ui/button";

interface YouTubeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function YouTubeDetailPage({ params }: YouTubeDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("summary");
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  );

  // This hook fetches real data from your backend API
  const { summary, isLoading, error } = useSummary(
    resolvedParams ? resolvedParams.id : ""
  );

  // Resolve the params Promise
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // Debug: Log the real data being fetched
  useEffect(() => {
    if (summary) {
      console.log("✅ Real summary data loaded:", summary);
    }
    if (error) {
      console.error("❌ Error fetching summary:", error);
    }
  }, [summary, error]);

  const handleBack = () => {
    router.back();
  };

  const handleOpenVideo = () => {
    if (summary?.videoMetadata.url) {
      window.open(summary.videoMetadata.url, "_blank");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Loading state - shows while fetching real data
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

  // Error state - shows if API call fails
  if (error || !summary) {
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
          <div className="text-center py-12">
            <p className="text-red-400">
              Failed to load video summary from API
            </p>
            <p className="text-gray-400 text-sm mt-2">{error}</p>
            <p className="text-gray-500 text-xs mt-2">
              API Endpoint: {process.env.NEXT_PUBLIC_API_BASE_URL}/summary/
              {resolvedParams?.id}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state - renders real data from API
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
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-2">
              <Youtube className="w-5 h-5 text-red-500" />
              <span className="text-white font-medium">YouTube</span>
            </div>
            <div className="text-gray-400 text-sm">
              {formatDate(summary.createdAt)}
            </div>
          </div>

          {/* Video Thumbnail */}
          <div className="relative mb-6">
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800">
              {summary.videoMetadata.thumbnailUrl ? (
                <img
                  src={summary.videoMetadata.thumbnailUrl}
                  alt={summary.videoMetadata.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log(
                      "❌ Thumbnail failed to load:",
                      summary.videoMetadata.thumbnailUrl
                    );
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <Youtube className="w-16 h-16 text-gray-600" />
                  <p className="text-gray-500 ml-4">No thumbnail available</p>
                </div>
              )}
              {/* Duration Badge */}
              {summary.videoMetadata.duration && (
                <div className="absolute bottom-3 right-3 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded">
                  {summary.videoMetadata.duration}
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3 leading-tight">
            {summary.videoMetadata.title}
          </h1>

          {/* Channel */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {summary.videoMetadata.channelName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-gray-300">
              {summary.videoMetadata.channelName}
            </span>
          </div>

          {/* Tags */}
          {summary.tags && summary.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {summary.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 border border-yellow-500 text-yellow-500 rounded-full text-sm"
                >
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          {/* YouTube Link */}
          <div className="mb-6">
            <button
              onClick={handleOpenVideo}
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span className="text-sm">YouTube Link</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex space-x-8 border-b border-gray-700">
              <button
                onClick={() => setActiveTab("transcript")}
                className={`pb-3 text-sm font-semibold transition-colors relative ${
                  activeTab === "transcript"
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Transcript
                {activeTab === "transcript" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("summary")}
                className={`pb-3 text-sm font-semibold transition-colors relative ${
                  activeTab === "summary"
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Summary
                {activeTab === "summary" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></div>
                )}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-gray-900 rounded-lg p-6">
            {activeTab === "summary" ? (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">
                  Key Takeaways
                </h2>
                <div className="space-y-4">
                  {summary.keyPoints && summary.keyPoints.length > 0 ? (
                    summary.keyPoints.map((point, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-white mt-2 flex-shrink-0"></div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {point}
                        </p>
                      </div>
                    ))
                  ) : summary.fullSummary ? (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full bg-white mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {summary.fullSummary}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">
                        No summary available for this video.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">
                  Transcript
                </h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {summary.transcript && summary.transcript.length > 0 ? (
                    summary.transcript.map((segment, index) => (
                      <div
                        key={index}
                        className="border-l-2 border-gray-600 pl-4"
                      >
                        <div className="text-xs text-orange-400 mb-1">
                          {segment.timestamp}
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {segment.text}
                        </p>
                      </div>
                    ))
                  ) : summary.transcriptText ? (
                    <div className="border-l-2 border-gray-600 pl-4">
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {summary.transcriptText}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No transcript available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
