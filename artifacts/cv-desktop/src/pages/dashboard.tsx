import { Link } from "wouter";
import { useAppStats, useApplications } from "@/lib/store";
import { cn, STATUS_LABELS, STATUS_COLORS, formatDate } from "@/lib/utils";
import { Plus, FilePlus, Activity, Folder, Briefcase, ChevronRight, BarChart } from "lucide-react";

export default function Dashboard() {
  const stats = useAppStats();
  const { applications } = useApplications();

  const activeApps = applications.filter(
    (a) => a.status !== "rejected" && a.status !== "withdrawn"
  ).length;

  const recentApps = [...applications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const pipeline = [
    { id: "draft", label: "Taslak" },
    { id: "applied", label: "Başvuruldu" },
    { id: "interview", label: "Mülakat" },
    { id: "offer", label: "Teklif" },
    { id: "rejected", label: "Reddedildi" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground text-sm">Başvuru süreçlerinizi ve belgelerinizi yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/documents" className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-sm">
            <FilePlus className="w-4 h-4" />
            Belge Ekle
          </Link>
          <Link href="/applications/new" className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm">
            <Plus className="w-4 h-4" />
            Yeni Başvuru
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-sm border bg-card flex items-start gap-4">
          <div className="p-2.5 rounded-sm bg-primary/10 text-primary">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Toplam Başvuru</p>
            <p className="text-2xl font-mono font-bold mt-1">{stats.totalApplications}</p>
          </div>
        </div>
        <div className="p-5 rounded-sm border bg-card flex items-start gap-4">
          <div className="p-2.5 rounded-sm bg-blue-500/10 text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Aktif Süreçler</p>
            <p className="text-2xl font-mono font-bold mt-1">{activeApps}</p>
          </div>
        </div>
        <div className="p-5 rounded-sm border bg-card flex items-start gap-4">
          <div className="p-2.5 rounded-sm bg-purple-500/10 text-purple-400">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Kaynak Belgeler</p>
            <p className="text-2xl font-mono font-bold mt-1">{stats.totalDocuments}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-muted-foreground" />
            Son Başvurular
          </h2>
          <div className="rounded-sm border bg-card overflow-hidden">
            {recentApps.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <Briefcase className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">Henüz bir başvuru bulunmuyor.</p>
                <Link href="/applications/new" className="text-primary mt-2 text-sm hover:underline">İlk başvurunuzu oluşturun</Link>
              </div>
            ) : (
              <div className="divide-y">
                {recentApps.map((app) => (
                  <Link key={app.id} href={`/applications/${app.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate group-hover:text-primary transition-colors">{app.jobTitle}</h3>
                      <p className="text-xs text-muted-foreground truncate">{app.company}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-none">
                      <span className={cn("px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm", STATUS_COLORS[app.status])}>
                        {STATUS_LABELS[app.status]}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{formatDate(app.createdAt)}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart className="w-5 h-5 text-muted-foreground" />
            Boru Hattı
          </h2>
          <div className="rounded-sm border bg-card p-5 space-y-4">
            {pipeline.map((stage) => {
              const count = stats.byStatus[stage.id] || 0;
              const total = stats.totalApplications || 1;
              const percentage = Math.round((count / total) * 100);
              
              return (
                <div key={stage.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <span className="font-mono text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-sm overflow-hidden">
                    <div 
                      className={cn("h-full rounded-sm transition-all duration-1000", 
                        stage.id === 'rejected' ? 'bg-red-500/50' : 
                        stage.id === 'offer' ? 'bg-green-500/80' : 
                        'bg-primary/70')}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
