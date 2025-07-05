/* eslint-disable @next/next/no-img-element */
import React, { useRef, useEffect, useState } from 'react';
import { Linkedin, User } from 'lucide-react';
import { BaseCard, CardHeader, TagsContainer } from './base-card';

interface LinkedInCardData {
  id: string;
  title?: string;
  author: string;
  role?: string;
  profileImage?: string;
  content: string;
  url: string;
  tags: string[];
  createdAt: string;
}

interface LinkedInCardProps {
  data: LinkedInCardData;
  onCardClick?: (data: LinkedInCardData) => void;
}

export const LinkedInCard: React.FC<LinkedInCardProps> = ({ data, onCardClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const authorRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const [displayLines, setDisplayLines] = useState(4);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Calculate optimal text display based on available space
  useEffect(() => {
    const calculateOptimalLines = () => {
      if (cardRef.current && headerRef.current && titleRef.current && authorRef.current) {
        const cardHeight = cardRef.current.offsetHeight;
        const headerHeight = headerRef.current.offsetHeight;
        const titleHeight = titleRef.current.offsetHeight;
        const authorHeight = authorRef.current.offsetHeight;
        
        // Estimate tags height (if they exist)
        const tagsHeight = data.tags.length > 0 ? 45 : 0;
        
        // Calculate margins and padding (approximately 32px total)
        const margins = 32;
        
        // Calculate available height for content text
        const usedHeight = headerHeight + titleHeight + authorHeight + tagsHeight + margins;
        const availableHeight = cardHeight - usedHeight;
        
        // Line height for text-sm leading-relaxed is approximately 20px
        const lineHeight = 20;
        const maxPossibleLines = Math.floor(availableHeight / lineHeight);
        
        // Set reasonable bounds: minimum 3 lines, maximum 12 lines
        const optimalLines = Math.max(3, Math.min(maxPossibleLines, 12));
        
        setDisplayLines(optimalLines);
      }
    };

    // Initial calculation with delay to ensure DOM is ready
    const timer = setTimeout(calculateOptimalLines, 100);

    // Recalculate on resize
    const handleResize = () => {
      setTimeout(calculateOptimalLines, 150);
    };

    window.addEventListener('resize', handleResize);

    // Use ResizeObserver for more accurate detection
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(calculateOptimalLines, 100);
    });

    if (cardRef.current) {
      resizeObserver.observe(cardRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [data.tags.length, data.title, data.content]);

  const handleCardClick = () => {
    onCardClick?.(data);
  };

  return (
    <div ref={cardRef} className="h-full">
      <BaseCard onClick={handleCardClick}>
        {/* Header */}
        <div ref={headerRef}>
          <CardHeader 
            iconComponent={<Linkedin className="w-4 h-4 text-blue-500" />}
            sourceName="LinkedIn"
            date={formatDate(data.createdAt)}
          />
        </div>

        {/* Title */}
        <div ref={titleRef}>
          <h3 className="text-white font-bold text-base mb-4 line-clamp-2 leading-tight">
            {data.title || data.content.slice(0, 80) + (data.content.length > 80 ? '...' : '')}
          </h3>
        </div>

        {/* Author Info */}
        <div ref={authorRef} className="mb-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
              {data.profileImage ? (
                <>
                  <img
                    src={data.profileImage}
                    alt={data.author}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-700">
                    <User className="w-5 h-5" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-700">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold line-clamp-1">{data.author}</p>
              {data.role && (
                <p className="text-gray-400 text-xs leading-tight mt-1 line-clamp-2">
                  {data.role}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Preview - Expands to fill remaining space */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1">
            <p 
              className="text-gray-300 text-sm leading-relaxed"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: displayLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.25rem',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                marginBottom: data.tags.length > 0 ? '1rem' : '0'
              }}
            >
              {data.content}
            </p>
          </div>
        </div>

        {/* Tags - Always at bottom */}
        {data.tags.length > 0 && (
          <div ref={tagsRef} className="mt-auto">
            <TagsContainer tags={data.tags} />
          </div>
        )}
      </BaseCard>
    </div>
  );
};