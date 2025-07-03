/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Youtube, Clock } from "lucide-react";
import { useSummary } from "@/hooks/use-summaries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/additional";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tab";
import { formatRelativeTime } from "@/lib/utils";

interface YouTubeDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function YouTubeDetailPage({ params }: YouTubeDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("summary");
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  );
  const { summary, isLoading, error } = useSummary(
    resolvedParams ? resolvedParams.id : ""
  );

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const handleBack = () => {
    router.back();
  };

  const handleOpenVideo = () => {
    if (summary?.videoMetadata.url) {
      window.open(summary.videoMetadata.url, "_blank");
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

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="p-6">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-12">
            <p className="text-red-400">Failed to load video summary</p>
            <p className="text-gray-400 text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Video Info */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              {/* Thumbnail */}
              {summary.videoMetadata.thumbnailUrl && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={summary.videoMetadata.thumbnailUrl}
                    alt={summary.videoMetadata.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* Video Title */}
              <h1 className="text-xl font-semibold mb-3 leading-tight">
                {summary.videoMetadata.title}
              </h1>

              {/* Source & External Link */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-gray-400">
                    {summary.videoMetadata.channelName}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenVideo}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  YouTube Link
                </Button>
              </div>

              {/* Duration & Date */}
              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                {summary.videoMetadata.duration && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{summary.videoMetadata.duration}</span>
                  </div>
                )}
                <span>{formatRelativeTime(summary.createdAt)}</span>
              </div>

              {/* Tags */}
              {summary.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {summary.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs border-orange-500/30 text-orange-400 bg-orange-500/10"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-gray-700">
                <TabsTrigger
                  value="summary"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                >
                  Summary
                </TabsTrigger>
                <TabsTrigger
                  value="transcript"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                >
                  Transcript
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-6">
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                  <div className="p-6">
                    {/* Summary Title */}
                    <h2 className="text-lg font-semibold mb-4">
                      {summary.title}
                    </h2>

                    {/* Key Points */}
                    {summary.keyPoints.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-orange-400 mb-3">
                          Key Points
                        </h3>
                        <ul className="space-y-2">
                          {summary.keyPoints.map((point, index) => (
                            <li
                              key={index}
                              className="flex items-start space-x-3"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                              <span className="text-gray-300 text-sm leading-relaxed">
                                {point}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Full Summary */}
                    {summary.fullSummary && (
                      <div>
                        <h3 className="text-sm font-medium text-orange-400 mb-3">
                          Full Summary
                        </h3>
                        <div className="prose prose-invert prose-sm max-w-none">
                          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {summary.fullSummary}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="transcript" className="mt-6">
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Transcript</h2>

                    {summary.transcript && summary.transcript.length > 0 ? (
                      <div className="max-h-96 overflow-y-auto space-y-4">
                        {summary.transcript.map((segment, index) => (
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
                        ))}
                      </div>
                    ) : summary.transcriptText ? (
                      <div className="max-h-96 overflow-y-auto">
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
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
