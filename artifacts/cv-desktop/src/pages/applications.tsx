import { useState } from "react";
import { Link } from "wouter";
import { useApplications } from "@/lib/store";
import { cn, STATUS_LABELS, STATUS_COLORS, formatDate } from "@/lib/utils";
import type { ApplicationStatus } from "@/lib/types";
import { Briefcase, Plus, Search, ChevronRight, Activity, Calendar } from "lucide-react";

export default function ApplicationsPage() {
  const { applications } = useApplications();
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filteredApps = applications
    .filter((a) => {
      if (filter !== "all" && a.status !== filter) return false;
      if (search) {
        const query = search.toLowerCase();
        return a.jobTitle.toLowerCase().includes(query) || a.company.toLowerCase().includes(query);
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const tabs: { id: ApplicationStatus | "all", label: string }[] = [
    { id: "all", label: "Tümü" },
    { id: "draft", label: "Taslak" },
    { id: "applied", label: "Başvuruldu" },
    { id: "interview", label: "Mülakat" },
    { id: "offer", label: "Teklif" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Başvurular
          </h1>
          <p className="text-muted-foreground text-sm mt-1">İş başvurularınızı ve doküman üretim süreçlerinizi takip edin.</p>
        </div>
        <Link 
          href="/applications/new" 
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm"
        >
          <Plus className="w-4 h-4" />
          Yeni Başvuru
        </Link>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex bg-muted/50 p-1 rounded-sm border overflow-x-auto whitespace-nowrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-sm transition-colors",
                filter === t.id 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pozisyon veya şirket ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-input border rounded-sm pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="bg-card border rounded-sm overflow-hidden">
        {filteredApps.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground">
            <Activity className="w-12 h-12 mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-1">Başvuru bulunamadı</h3>
            <p className="text-sm max-w-sm mb-4">Bu filtrelere uygun bir başvuru kaydı yok veya henüz bir başvuru oluşturmadınız.</p>
            <Link href="/applications/new" className="text-primary text-sm hover:underline">İlk başvurunuzu oluşturun</Link>
          </div>
        ) : (
          <div className="divide-y">
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-5 sm:col-span-4">Pozisyon / Şirket</div>
              <div className="col-span-3 hidden sm:block">Durum</div>
              <div className="col-span-3 hidden md:block">Oluşturulma</div>
              <div className="col-span-2 hidden md:block">Dokümanlar</div>
              <div className="col-span-7 sm:col-span-5 md:col-span-2 text-right">İşlem</div>
            </div>
            {filteredApps.map((app) => (
              <Link 
                key={app.id} 
                href={`/applications/${app.id}`}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors group cursor-pointer"
              >
                <div className="col-span-5 sm:col-span-4 min-w-0">
                  <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{app.jobTitle}</h3>
                  <p className="text-xs text-muted-foreground truncate">{app.company}</p>
                </div>
                
                <div className="col-span-3 hidden sm:flex items-center">
                  <span className={cn("px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded-sm inline-flex", STATUS_COLORS[app.status])}>
                    {STATUS_LABELS[app.status]}
                  </span>
                </div>

                <div className="col-span-3 hidden md:flex items-center text-xs text-muted-foreground font-mono gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(app.createdAt)}
                </div>

                <div className="col-span-2 hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="bg-secondary px-1.5 py-0.5 rounded-sm font-mono">{app.generatedDocs.length}</span> belge
                </div>

                <div className="col-span-7 sm:col-span-5 md:col-span-2 flex justify-end items-center text-muted-foreground group-hover:text-foreground">
                  <span className="text-xs mr-2 opacity-0 group-hover:opacity-100 transition-opacity">Çalışma Alanı</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
