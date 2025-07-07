/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Youtube, Play } from "lucide-react";
import { BaseCard, CardHeader, CardTitle, TagsContainer } from "./base-card";

interface YouTubeCardData {
  id: string;
  title: string;
  source: string;
  thumbnail?: string;
  url: string;
  tags: string[];
  createdAt: string;
  duration?: string;
}

interface YouTubeCardProps {
  data: YouTubeCardData;
  onCardClick?: (data: YouTubeCardData) => void;
}

export const YouTubeCard: React.FC<YouTubeCardProps> = ({
  data,
  onCardClick,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleCardClick = () => {
    onCardClick?.(data);
  };

  return (
    <BaseCard onClick={handleCardClick} style={{ backgroundColor: "#151515" }}>
      <CardHeader
        iconComponent={<Youtube className="w-4 h-4 text-red-500" />}
        sourceName="YouTube"
        date={formatDate(data.createdAt)}
      />

      <CardTitle title={data.title} />

      {/* Thumbnail */}
      <div
        className="relative mb-4 rounded-lg overflow-hidden flex-shrink-0"
        style={{ backgroundColor: "#151515" }}
      >
        <div className="aspect-video w-full relative">
          {data.thumbnail ? (
            <>
              <img
                src={data.thumbnail}
                alt={data.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const fallback = target.parentElement?.querySelector(
                    ".fallback-container"
                  ) as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div
                className="fallback-container hidden w-full h-full absolute inset-0 items-center justify-center text-gray-400"
                style={{ backgroundColor: "#151515" }}
              >
                <Play className="w-12 h-12" />
              </div>
            </>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-gray-400"
              style={{ backgroundColor: "#151515" }}
            >
              <Play className="w-12 h-12" />
            </div>
          )}

          {/* Duration Badge */}
          {data.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium">
              {data.duration}
            </div>
          )}
        </div>
      </div>

      {/* Channel Name */}
      <p className="text-gray-400 text-sm mb-3 font-medium">{data.source}</p>

      {/* Tags */}
      <TagsContainer tags={data.tags} />
    </BaseCard>
  );
};
