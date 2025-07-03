/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/additional";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tab";
import { formatRelativeTime } from "@/lib/utils";

// Mock data - replace with actual data fetching
const mockWebsiteData = {
  id: "1",
  title: "Behind the Scenes: Building a Robust Ads Event Processing Pipeline",
  source: "Netflix Tech Blog",
  url: "https://netflixtechblog.com/behind-the-scenes-building-a-robust-ads-event-processing-pipeline-123",
  thumbnail:
    "https://miro.medium.com/v2/resize:fit:1400/1*9J8J8J8J8J8J8J8J8J8J8A.png",
  tags: ["#productmanagement", "#productsense", "#distributedsystems"],
  createdAt: "2025-01-02T10:00:00Z",
  content: `In a digital advertising platform, a robust feedback system is essential for the lifecycle and success of an ad campaign. This system comprises of diverse sub-systems designed to monitor, measure, and optimize ad campaigns. At Netflix, we embarked on a journey to build a robust event processing platform that not only meets the current demands but also scales for future needs. This blog post delves into the architectural evolution and technical decisions that underpin our Ads event processing pipeline.

Ad serving acts like the "brain" - making decisions, optimizing delivery and ensuring right Ad is shown to the right member at the right time. Meanwhile, ad events, after an Ad is rendered, function like "heartbeats", continuously providing real-time feedback (oxygen/nutrients) that fuels better decision-making, optimizations, measurement, and billing. Expanding on this analogy.

Just as the brain relies on continuous blood flow, ad serving depends on a steady stream of ad events to adjust next ad serving decision, frequency capping, pacing, and personalization.

If the nervous system stops sending signals (ad events stop flowing), the brain (ad serving) lacks critical insights and starts making poor decisions or even fails.

The healthier and more accurate the event stream (just like strong heart function), the better the ad serving system can adapt, resulting in improved business outcomes.

Let's dive into the journey of building this pipeline.

THE PLAN

In November 2022, we launched a brand new basic ads plan. In partnership with Microsoft, The software systems extended the existing Netflix playbook systems to play ads. Initially, the system consisted of simplified. Netflix introduced a comprehensive advertising system within their platform. The implementation consisted of three main components: the Microsoft Ad Server, Netflix Ads Manager, and Ad Event Handler. Each ad served required tracking to ensure the feedback loop functioned effectively, providing the external ad server with insights on impressions, frequency capping (advertiser policy that limits the number of times a user sees a specific ad), and monetization processes.

Key features of this system include:

Client Request: Client identifies an ad spot that needs to be filled during the break from Netflix playbook systems, which is then decorated with information by ads manager to request ads from the ad server.

Server-Side Ad Insertion: The Ad Server sends ad responses using the VAST (Video Ad Serving Template) format.`,
  summary: `This technical blog post from Netflix describes their journey in building a robust ads event processing pipeline. The system is compared to a human circulatory system where ad serving acts as the "brain" making decisions, while ad events function as "heartbeats" providing continuous feedback.

Key aspects covered:
- The critical role of event processing in ad campaign optimization and measurement
- The partnership with Microsoft to extend Netflix's existing systems for ad serving
- Implementation of three main components: Microsoft Ad Server, Netflix Ads Manager, and Ad Event Handler
- Use of VAST (Video Ad Serving Template) format for ad responses
- The importance of tracking for feedback loops, impression monitoring, and frequency capping

The post emphasizes how a healthy event stream enables better ad serving decisions, similar to how proper blood flow supports brain function. When event processing fails, ad serving systems lose critical insights and performance degrades.`,
};

// Update the props interface to match the required Promise type
interface WebsiteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function WebsiteDetailPage({ params }: WebsiteDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("summary");
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(mockWebsiteData);
  // Add state for resolved params
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(
    null
  );

  useEffect(() => {
    // Resolve the params promise
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleOpenArticle = () => {
    if (data?.url) {
      window.open(data.url, "_blank");
    }
  };

  // Show loading spinner until params are resolved or while loading
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
          {/* Left Column - Article Info */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              {/* Logo/Thumbnail */}
              <div className="mb-4 flex items-center justify-center h-32 bg-red-600 rounded-lg">
                <span className="text-white font-bold text-2xl">NETFLIX</span>
              </div>

              {/* Article Title */}
              <h1 className="text-xl font-semibold mb-3 leading-tight">
                {data.title}
              </h1>

              {/* Source & External Link */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-400">{data.source}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenArticle}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Website Post Link
                </Button>
              </div>

              {/* Date */}
              <div className="flex items-center text-sm text-gray-400 mb-4">
                <Clock className="w-3 h-3 mr-1" />
                <span>{formatRelativeTime(data.createdAt)}</span>
              </div>

              {/* Tags */}
              {data.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag, index) => (
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
                  value="article"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                >
                  Article
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-6">
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">AI Summary</h2>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {data.summary}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="article" className="mt-6">
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Full Article</h2>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="prose prose-invert prose-sm max-w-none">
                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                          {data.content}
                        </div>
                      </div>
                    </div>
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
