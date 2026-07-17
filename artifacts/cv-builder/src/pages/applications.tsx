import React, { useState } from 'react';
import { Link } from 'wouter';
import { useListApplications, getListApplicationsQueryKey, Application, ApplicationStatus } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Filter, Building, Calendar, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Applications() {
  const { data: applications, isLoading } = useListApplications({
    query: { queryKey: getListApplicationsQueryKey() }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredApps = applications?.filter(app => {
    const matchesSearch = app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: ApplicationStatus) => {
    switch(status) {
      case 'offer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200';
      case 'interview': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200';
      case 'applied': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200';
      case 'withdrawn': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200';
      default: return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground mt-1">Track your job applications and generate tailored documents.</p>
        </div>
        <Link href="/applications/new">
          <Button className="gap-2 font-mono text-xs font-semibold uppercase tracking-wider rounded-sm">
            <Plus className="w-4 h-4" /> New Application
          </Button>
        </Link>
      </header>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search by role or company..." 
            className="pl-9 rounded-sm bg-card border-card-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="text-muted-foreground w-4 h-4" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] rounded-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-none" />
          ))
        ) : filteredApps.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground border-2 border-dashed border-muted flex flex-col items-center">
            <Building className="w-12 h-12 mb-4 text-muted" />
            <h3 className="text-lg font-semibold text-foreground">No applications found</h3>
            <p className="mt-1">You haven't added any applications yet, or none match your filters.</p>
            <Link href="/applications/new">
              <Button variant="outline" className="mt-6 font-mono text-xs uppercase rounded-sm">
                Start an Application
              </Button>
            </Link>
          </div>
        ) : (
          filteredApps.map((app) => (
            <Link key={app.id} href={`/applications/${app.id}`}>
              <Card className="rounded-none border-l-4 border-l-primary hover:border-l-sidebar-primary shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-xl group-hover:text-primary transition-colors">{app.jobTitle}</h3>
                      <Badge variant="outline" className={`font-mono text-[10px] uppercase rounded-sm tracking-wider ${getStatusColor(app.status)}`}>
                        {app.status}
                      </Badge>
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm gap-4">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Building className="w-3.5 h-3.5 text-muted-foreground" /> {app.company}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3.5 h-3.5" /> {format(new Date(app.updatedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-muted-foreground group-hover:text-primary transition-colors font-mono text-xs font-semibold uppercase tracking-wider">
                    Open Workspace <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
