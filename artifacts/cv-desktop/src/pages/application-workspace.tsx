import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useApplications, useProfile, useDocuments } from "@/lib/store";
import { useAIStream } from "@/lib/use-ai-stream";
import { cn, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import type { ApplicationStatus, DocxHeading } from "@/lib/types";
import { 
  ArrowLeft, Building2, Trash2, Cpu, FileDown, 
  RefreshCcw, Upload, FileText, CheckCircle2, ChevronDown, LayoutTemplate
} from "lucide-react";

export default function ApplicationWorkspace() {
  const [, params] = useRoute('/applications/:id');
  const [, setLocation] = useLocation();
  const appId = params?.id as string;
  
  const { applications, updateApplication, deleteApplication, addGeneratedDoc, updateGeneratedDoc } = useApplications();
  const { profile } = useProfile();
  const { documents } = useDocuments();
  
  const app = applications.find(a => a.id === appId);
  
  const aiStream = useAIStream();
  
  // Tabs: 'cv-industry', 'cv-academic', 'cover-letter'
  const [activeTab, setActiveTab] = useState<"cv-industry" | "cv-academic" | "cover-letter">("cv-industry");
  
  // Active document states
  const [content, setContent] = useState("");
  const [headings, setHeadings] = useState<DocxHeading[]>([]);
  
  // Auto-save logic
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Find latest docs for tabs
  const latestIndustryCv = app?.generatedDocs.filter(d => d.type === 'cv' && d.cvType === 'industry').at(-1);
  const latestAcademicCv = app?.generatedDocs.filter(d => d.type === 'cv' && d.cvType === 'academic').at(-1);
  const latestCoverLetter = app?.generatedDocs.filter(d => d.type === 'cover_letter').at(-1);

  // Switch content when tab changes or AI finishes
  useEffect(() => {
    if (aiStream.isGenerating) return; // Don't override while streaming
    
    let activeDoc;
    if (activeTab === "cv-industry") activeDoc = latestIndustryCv;
    else if (activeTab === "cv-academic") activeDoc = latestAcademicCv;
    else activeDoc = latestCoverLetter;

    if (activeDoc) {
      setContent(activeDoc.content);
      setHeadings(activeDoc.templateHeadings || []);
    } else {
      setContent("");
      setHeadings([]);
    }
  }, [activeTab, latestIndustryCv?.id, latestAcademicCv?.id, latestCoverLetter?.id, aiStream.isGenerating]);

  // Streaming content overrides local content
  useEffect(() => {
    if (aiStream.isGenerating && aiStream.content) {
      setContent(aiStream.content);
    }
  }, [aiStream.isGenerating, aiStream.content]);

  // Auto-save edited content
  useEffect(() => {
    if (!app || aiStream.isGenerating) return;

    let activeDoc;
    if (activeTab === "cv-industry") activeDoc = latestIndustryCv;
    else if (activeTab === "cv-academic") activeDoc = latestAcademicCv;
    else activeDoc = latestCoverLetter;

    if (activeDoc && content !== activeDoc.content) {
      setIsAutoSaving(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        await updateGeneratedDoc(app.id, activeDoc.id, content);
        setIsAutoSaving(false);
      }, 1500);
    }
  }, [content, app, activeTab, latestIndustryCv, latestAcademicCv, latestCoverLetter, updateGeneratedDoc, aiStream.isGenerating]);


  if (!app) return <div className="p-8 text-center">Başvuru bulunamadı.</div>;

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    await updateApplication(app.id, { status: newStatus });
  };

  const handleDelete = async () => {
    if (confirm("Bu başvuruyu silmek istediğinize emin misiniz?")) {
      await deleteApplication(app.id);
      setLocation("/applications");
    }
  };

  const handleUploadTemplate = async () => {
    try {
      const file = await window.electronAPI.openFile({
        title: "Şablon Seç (.docx)",
        filters: [{ name: "Word Belgesi", extensions: ["docx"] }]
      });
      if (file) {
        const extractedHeadings = await window.electronAPI.extractDocxHeadings(file.data);
        setHeadings(extractedHeadings);
      }
    } catch (e) {
      alert("Şablon okunamadı.");
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (!profile) {
      alert("Lütfen önce profilinizi doldurun.");
      return;
    }

    const type = activeTab.startsWith('cv') ? 'cv' : 'cover_letter';
    const cvType = activeTab === 'cv-academic' ? 'academic' : activeTab === 'cv-industry' ? 'industry' : undefined;

    try {
      await aiStream.generate({
        type,
        cvType,
        profile,
        documents,
        jobTitle: app.jobTitle,
        company: app.company,
        jobDescription: app.jobDescription,
        templateHeadings: headings.length > 0 ? headings : undefined,
      });

      // After generation, save as new doc
      if (aiStream.content) {
        // Wait for the stream to fully finish, then save.
        // Actually, the hook throws if error, resolves if done.
        // We capture the state AFTER resolution.
        // The hook's state might be slightly behind during resolve, so we wait a tick or rely on store.
      }
    } catch (e) {
      console.error(e);
    }
  };

  // We need to hook into when generation finishes to save it. 
  // We can do this in a useEffect watching isGenerating, or we can just fetch aiStream.content right after await.
  // Wait, aiStream.content inside the handleGenerate closure is stale. 
  // Let's use an effect to save when generation completes successfully.
  const prevGenerating = useRef(aiStream.isGenerating);
  useEffect(() => {
    if (prevGenerating.current && !aiStream.isGenerating && !aiStream.error && aiStream.content) {
      // Just finished generating
      const type = activeTab.startsWith('cv') ? 'cv' : 'cover_letter';
      const cvType = activeTab === 'cv-academic' ? 'academic' : activeTab === 'cv-industry' ? 'industry' : undefined;
      
      addGeneratedDoc(app.id, {
        type,
        cvType,
        content: aiStream.content,
        templateHeadings: headings.length > 0 ? headings : undefined,
      });
    }
    prevGenerating.current = aiStream.isGenerating;
  }, [aiStream.isGenerating, aiStream.error, aiStream.content, activeTab, app.id, headings, addGeneratedDoc]);


  const handleDownload = async () => {
    if (!content) return;
    const suffix = activeTab === 'cv-industry' ? 'Sektörel_CV' 
                 : activeTab === 'cv-academic' ? 'Akademik_CV' 
                 : 'Önyazı';
    
    try {
      const base64 = await window.electronAPI.generateDocx(content, `${profile?.fullName || 'CV'}`);
      await window.electronAPI.saveFile({
        data: base64,
        defaultName: `${app.jobTitle.replace(/\s+/g, '_')}_${app.company.replace(/\s+/g, '_')}_${suffix}.docx`,
        filters: [{ name: 'Word Belgesi', extensions: ['docx'] }]
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Top Header */}
      <header className="flex-none p-4 md:px-6 border-b bg-card flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/applications" className="p-2 -ml-2 rounded-sm text-muted-foreground hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{app.jobTitle}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              <Building2 className="w-4 h-4" />
              {app.company}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <select
              value={app.status}
              onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
              className={cn(
                "appearance-none pl-3 pr-8 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm border cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring transition-colors",
                STATUS_COLORS[app.status]
              )}
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val} className="text-foreground bg-background">{label}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
          </div>
          
          <button 
            onClick={handleDelete}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm transition-colors"
            title="Başvuruyu Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Col: Job Description */}
        <div className="w-full md:w-2/5 border-r flex flex-col bg-sidebar/30 flex-none">
          <div className="p-3 border-b bg-muted/20 flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">İş Tanımı (Job Description)</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {app.jobDescription || <span className="opacity-50 italic">İş tanımı eklenmemiş.</span>}
          </div>
        </div>

        {/* Right Col: AI Generator */}
        <div className="flex-1 flex flex-col bg-card overflow-hidden">
          
          {/* Tabs */}
          <div className="flex bg-muted/30 border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab("cv-industry")}
              className={cn(
                "px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === "cv-industry" ? "border-primary text-foreground bg-background" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Sektörel CV
            </button>
            <button
              onClick={() => setActiveTab("cv-academic")}
              className={cn(
                "px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === "cv-academic" ? "border-primary text-foreground bg-background" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Akademik CV
            </button>
            <button
              onClick={() => setActiveTab("cover-letter")}
              className={cn(
                "px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === "cover-letter" ? "border-primary text-foreground bg-background" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Önyazı
            </button>
          </div>

          {/* Tools bar */}
          <div className="p-3 border-b flex flex-wrap items-center justify-between gap-3 bg-background">
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={aiStream.isGenerating}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-sm hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
              >
                {aiStream.isGenerating ? (
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Cpu className="w-3.5 h-3.5" />
                )}
                {content ? "Yeniden Üret" : "Oluştur"}
              </button>
              
              {activeTab.startsWith('cv') && (
                <button
                  onClick={handleUploadTemplate}
                  disabled={aiStream.isGenerating}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium rounded-sm disabled:opacity-50 transition-colors"
                  title="Kelime başlıklarını şablondan alarak yapıyı korur"
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  Şablon Yükle (.docx)
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isAutoSaving && <span className="text-[10px] text-muted-foreground font-mono animate-pulse">Kayıt ediliyor...</span>}
              {!isAutoSaving && content && <span className="text-[10px] text-success font-mono flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Kaydedildi</span>}
              
              <button
                onClick={handleDownload}
                disabled={!content || aiStream.isGenerating}
                className="inline-flex items-center gap-2 px-3 py-1.5 border hover:bg-muted text-xs font-medium rounded-sm disabled:opacity-50 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                Word İndir
              </button>
            </div>
          </div>

          {/* Headings indicator */}
          {headings.length > 0 && activeTab.startsWith('cv') && (
            <div className="px-4 py-2 bg-muted/20 border-b flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap">
              <span className="font-semibold text-muted-foreground flex-none">Şablon Başlıkları:</span>
              {headings.slice(0, 5).map((h, i) => (
                <span key={i} className="bg-background border px-2 py-0.5 rounded-sm text-muted-foreground font-mono">{h.text}</span>
              ))}
              {headings.length > 5 && <span className="text-muted-foreground">+{headings.length - 5} daha</span>}
            </div>
          )}

          {/* Editor/Output area */}
          <div className="flex-1 relative bg-background">
            {aiStream.error && (
              <div className="absolute top-4 left-4 right-4 bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-sm text-sm z-10 flex justify-between items-center">
                <span>Üretim hatası: {aiStream.error}</span>
                <button onClick={() => aiStream.reset()} className="underline text-xs">Gizle</button>
              </div>
            )}
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={aiStream.isGenerating}
              className={cn(
                "absolute inset-0 w-full h-full p-6 bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed",
                aiStream.isGenerating ? "streaming-cursor opacity-80" : ""
              )}
              placeholder={
                aiStream.isGenerating 
                  ? "AI içeriği oluşturuyor, lütfen bekleyin..." 
                  : "İçerik henüz oluşturulmadı. Yukarıdaki 'Oluştur' butonuna basarak başlayın."
              }
            />
          </div>

        </div>
      </div>
    </div>
  );
}
