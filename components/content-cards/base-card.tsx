import React from 'react';
import { Calendar } from 'lucide-react';

interface BaseCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const BaseCard: React.FC<BaseCardProps> = ({ children, onClick, className = '' }) => (
  <div 
    className={`bg-gray-900 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-black/20 h-full flex flex-col ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

interface CardHeaderProps {
  iconComponent: React.ReactNode;
  sourceName: string;
  date: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ iconComponent, sourceName, date }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center space-x-2">
      {iconComponent}
      <span className="text-sm text-gray-400 font-medium">{sourceName}</span>
    </div>
    <div className="flex items-center space-x-1 text-xs text-gray-500">
      <Calendar className="w-3 h-3" />
      <span>{date}</span>
    </div>
  </div>
);

interface CardTitleProps {
  title: string;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ title, className = '' }) => (
  <h3 className={`text-white font-bold text-base mb-3 line-clamp-2 leading-tight ${className}`}>
    {title}
  </h3>
);

interface TagProps {
  children: React.ReactNode;
}

export const Tag: React.FC<TagProps> = ({ children }) => (
  <span className="text-xs border border-yellow-500 text-yellow-400 px-2 py-1 rounded-md bg-yellow-500/5 whitespace-nowrap">
    #{children}
  </span>
);

interface TagsContainerProps {
  tags: string[];
  maxTags?: number;
}

export const TagsContainer: React.FC<TagsContainerProps> = ({ tags, maxTags = 6 }) => (
  <div className="flex flex-wrap gap-2 mt-auto pt-3">
    {tags.slice(0, maxTags).map((tag, index) => (
      <Tag key={index}>{tag}</Tag>
    ))}
    {tags.length > maxTags && (
      <span className="text-xs text-gray-500 px-2 py-1">+{tags.length - maxTags} more</span>
    )}
  </div>
);
