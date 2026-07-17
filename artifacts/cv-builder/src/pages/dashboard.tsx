import React from 'react';
import { Link } from 'wouter';
import { 
  useGetDashboardStats, 
  useGetRecentApplications, 
  getGetDashboardStatsQueryKey,
  getGetRecentApplicationsQueryKey 
} from '@workspace/api-client-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Briefcase, ChevronRight, Activity, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() }
  });
  
  const { data: recentApps, isLoading: isRecentLoading } = useGetRecentApplications({
    query: { queryKey: getGetRecentApplicationsQueryKey() }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-in fade-in zoom-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground mt-1">Overview of your career operations.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/documents">
            <Button variant="outline" className="gap-2 font-mono text-xs font-semibold uppercase tracking-wider">
              <FileText className="w-4 h-4" /> Add Document
            </Button>
          </Link>
          <Link href="/applications/new">
            <Button className="gap-2 font-mono text-xs font-semibold uppercase tracking-wider">
              <Plus className="w-4 h-4" /> New Application
            </Button>
          </Link>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-none border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" /> Total Applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono">
              {isStatsLoading ? <Skeleton className="h-10 w-16" /> : stats?.totalApplications || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-none border-t-4 border-t-sidebar-accent shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" /> Source Materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono">
              {isStatsLoading ? <Skeleton className="h-10 w-16" /> : stats?.totalDocuments || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-t-4 border-t-muted-foreground shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="font-mono text-xs uppercase tracking-widest font-semibold flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Recent Activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-mono">
              {isStatsLoading ? <Skeleton className="h-10 w-16" /> : stats?.recentActivityCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Applications</h2>
            <Link href="/applications" className="text-sm font-semibold text-primary hover:underline flex items-center">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <Card className="rounded-none shadow-sm">
            <div className="divide-y divide-border">
              {isRecentLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 space-y-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ))
              ) : recentApps?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No applications found.</p>
                  <Link href="/applications/new">
                    <Button variant="link" className="mt-2 text-primary font-mono text-xs uppercase">Start one now</Button>
                  </Link>
                </div>
              ) : (
                recentApps?.map((app) => (
                  <Link key={app.id} href={`/applications/${app.id}`}>
                    <div className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group cursor-pointer">
                      <div>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {app.jobTitle}
                        </h3>
                        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                          <span className="font-medium text-foreground">{app.company}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(app.updatedAt), 'MMM d, yyyy')}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={app.status === 'offer' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'} className="font-mono text-[10px] uppercase rounded-sm">
                          {app.status}
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold">Pipeline Status</h2>
          <Card className="rounded-none shadow-sm p-5 space-y-4">
            {isStatsLoading ? (
               Array.from({ length: 5 }).map((_, i) => (
                 <Skeleton key={i} className="h-8 w-full" />
               ))
            ) : (
              <>
                <StatusRow label="Draft" count={stats?.applicationsByStatus.draft || 0} total={stats?.totalApplications || 1} />
                <StatusRow label="Applied" count={stats?.applicationsByStatus.applied || 0} total={stats?.totalApplications || 1} />
                <StatusRow label="Interview" count={stats?.applicationsByStatus.interview || 0} total={stats?.totalApplications || 1} />
                <StatusRow label="Offer" count={stats?.applicationsByStatus.offer || 0} total={stats?.totalApplications || 1} />
                <StatusRow label="Rejected" count={stats?.applicationsByStatus.rejected || 0} total={stats?.totalApplications || 1} />
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusRow({ label, count, total }: { label: string; count: number; total: number }) {
  const percentage = Math.max(2, Math.round((count / Math.max(1, total)) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{count}</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary/80 rounded-full" 
          style={{ width: `${count === 0 ? 0 : percentage}%` }} 
        />
      </div>
    </div>
  );
}
