/* eslint-disable @next/next/no-img-element */
// components/layout/sidebar.tsx - FIXED HOVER AND ACTIVE STATE
"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Youtube,
  Linkedin,
  Globe,
  Twitter,
  Menu,
  X,
  BarChart3,
  LogOut,

  Tag,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useSummaries } from "@/hooks/use-summaries";
import { useLinkedinPosts } from "@/hooks/use-linkedin-posts";
import { Button } from "@/components/ui/button";

export function GlobalSidebar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get current filter from URL
  const currentFilter = searchParams.get("filter");

  // Get data for counts
  const { summaries } = useSummaries({ limit: 1000 });
  const { posts: linkedinPosts } = useLinkedinPosts({ limit: 1000 });

  // Don't show sidebar on auth pages or landing page for non-authenticated users
  const hideSidebar =
    !isAuthenticated ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/landing") ||
    (pathname === "/" && !isAuthenticated);

  if (hideSidebar) return null;

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
  };

  // Navigation items with filter values
  const navigationItems = [
    {
      name: "All Knuggets",
      href: "/dashboard",
      icon: BarChart3,
      count: (summaries?.length || 0) + (linkedinPosts?.length || 0),
      color: "text-white",
      bgColor: "bg-white",
      filter: null, // No filter = all content
    },
    {
      name: "YouTube",
      href: "/dashboard?filter=youtube",
      icon: Youtube,
      count: summaries?.length || 0,
      color: "text-white",
      bgColor: "bg-white",
      filter: "youtube",
    },
    {
      name: "LinkedIn",
      href: "/dashboard?filter=linkedin",
      icon: Linkedin,
      count: linkedinPosts?.length || 0,
      color: "text-white",
      bgColor: "bg-white",
      filter: "linkedin",
    },
    {
      name: "Websites",
      href: "/dashboard?filter=website",
      icon: Globe,
      count: 0,
      color: "text-white",
      bgColor: "bg-white",
      filter: "website",
    },
    {
      name: "X",
      href: "/dashboard?filter=twitter",
      icon: Twitter,
      count: 0,
      color: "text-white",
      bgColor: "bg-white",
      filter: "twitter",
    },
  ];

  // FIXED: Improved active path detection
  const isActivePath = (item: (typeof navigationItems)[0]) => {
    // Check if we're on dashboard page
    if (pathname !== "/dashboard") return false;

    // Compare the filter values
    return currentFilter === item.filter;
  };

  // Get all unique tags for the topics section
  const allTags = Array.from(
    new Set([
      ...(summaries?.flatMap((s) => s.tags) || []),
      // Add other content types when available
    ])
  ).slice(0, 20);

  // Handle tag clicks with proper search
  const handleTagClick = (tag: string) => {
    router.push(`/dashboard?search=${encodeURIComponent(tag)}`);
  };

  return (
    <div
      className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-[#151515] flex flex-col transition-all duration-300 fixed left-0 top-0 h-full z-50`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-r flex items-center justify-center">
                <img src="/logo.png" alt="Knugget" className="h-10 w-10" />
              </div>
              <span className="text-lg font-semibold text-white">Knugget</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-400 hover:text-white"
          >
            {sidebarCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Sources */}
        <div>
          {!sidebarCollapsed && (
            <h3 className="text-sm font-medium text-gray-400 mb-3">Sources</h3>
          )}
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gray-800 text-orange-500 border-l-2 border-orange-500"
                      : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  <div
                    className={`flex items-center ${sidebarCollapsed ? "" : "space-x-3 w-full"}`}
                  >
                    <Icon
                      className={`w-4 h-4 ${isActive ? "text-orange-500" : item.color} flex-shrink-0`}
                    />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {item.count > 0 && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              isActive
                                ? "bg-orange-500/20 text-orange-300"
                                : "bg-gray-700 text-gray-400"
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Topics */}
        {!sidebarCollapsed && allTags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              Topics
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
              {allTags.map((tag, index) => (
                <button
                  key={index}
                  onClick={() => handleTagClick(tag)}
                  className="w-full text-left px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                >
                  <span className="text-orange-500 mr-2">#</span>
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Profile */}
      {!sidebarCollapsed && user && (
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.name
                  ? user.name[0].toUpperCase()
                  : user.email[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name || user.email}
              </p>
              <p className="text-xs text-gray-400">{user.plan} Plan</p>
            </div>
          </div>

          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
            >
              <LogOut className="w-3 h-3 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}

      {/* Collapsed User Profile */}
      {sidebarCollapsed && user && (
        <div className="p-2 border-t border-gray-800">
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.name
                  ? user.name[0].toUpperCase()
                  : user.email[0].toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
