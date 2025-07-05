// components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  User,
  Settings,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // Navigation items with counts
  const navigationItems = [
    {
      name: "All Knuggets",
      href: "/dashboard",
      icon: BarChart3,
      count: (summaries?.length || 0) + (linkedinPosts?.length || 0),
      color: "text-orange-500",
      bgColor: "bg-orange-500",
    },
    {
      name: "YouTube",
      href: "/summaries",
      icon: Youtube,
      count: summaries?.length || 0,
      color: "text-red-500",
      bgColor: "bg-red-500",
    },
    {
      name: "LinkedIn",
      href: "/linkedin-posts",
      icon: Linkedin,
      count: linkedinPosts?.length || 0,
      color: "text-blue-500",
      bgColor: "bg-blue-500",
    },
    {
      name: "Websites",
      href: "/websites",
      icon: Globe,
      count: 0, // Add when website summaries are implemented
      color: "text-green-500",
      bgColor: "bg-green-500",
    },
    {
      name: "X",
      href: "/twitter",
      icon: Twitter,
      count: 0, // Add when Twitter posts are implemented
      color: "text-blue-400",
      bgColor: "bg-blue-400",
    },
  ];

  // Check if current route is active
  const isActivePath = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  // Get all unique tags for the topics section
  const allTags = Array.from(
    new Set([
      ...(summaries?.flatMap((s) => s.tags) || []),
      // Add other content types when available
    ])
  ).slice(0, 20);

  return (
    <div
      className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 fixed left-0 top-0 h-full z-50`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
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
              const isActive = isActivePath(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  } ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                    {!sidebarCollapsed && (
                      <>
                        <span>{item.name}</span>
                        <span className="ml-auto text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                          {item.count}
                        </span>
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
                  onClick={() =>
                    router.push(`/dashboard?search=${encodeURIComponent(tag)}`)
                  }
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
              onClick={() => router.push("/profile")}
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800 text-xs"
            >
              <User className="w-3 h-3 mr-2" />
              Profile
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/settings")}
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800 text-xs"
            >
              <Settings className="w-3 h-3 mr-2" />
              Settings
            </Button>
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
