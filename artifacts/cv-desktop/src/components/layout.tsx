import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, User, FolderOpen, Briefcase, Settings, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/documents", label: "Source Library", icon: FolderOpen },
  { href: "/applications", label: "Applications", icon: Briefcase },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-56 flex-none flex flex-col bg-sidebar border-r border-sidebar-border">
        {/* Logo / Title */}
        <div className="drag-region h-12 flex items-center px-4 border-b border-sidebar-border">
          <div className="no-drag flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-sm bg-primary flex items-center justify-center flex-none">
              <span className="text-primary-foreground font-bold text-xs font-mono">CV</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-sidebar-foreground">CV Builder</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <a
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-medium transition-colors group",
                    active
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="w-4 h-4 flex-none" />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="w-3 h-3 text-primary" />}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="px-2 py-3 border-t border-sidebar-border">
          <Link href="/settings">
            <a
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-medium transition-colors",
                location === "/settings"
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Settings className="w-4 h-4" />
              Settings
            </a>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
