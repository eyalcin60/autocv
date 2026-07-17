import React from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutDashboard, User, FileText, Briefcase, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/documents', label: 'Source Library', icon: FileText },
    { href: '/applications', label: 'Applications', icon: Briefcase },
    { href: '/chat', label: 'AI Coach', icon: MessageSquare },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background font-sans">
      <aside className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 text-sidebar-primary-foreground">
            <div className="bg-primary w-8 h-8 rounded-md flex items-center justify-center font-bold font-mono">
              CV
            </div>
            <span className="font-semibold tracking-tight text-lg">Command Center</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/50 font-mono">
          System v1.0.0
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
