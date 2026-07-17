import { useState } from "react";
import { useLocation } from "wouter";
import { useApplications } from "@/lib/store";
import { Briefcase, Upload, Send, ArrowLeft } from "lucide-react";

export default function NewApplicationPage() {
  const [, setLocation] = useLocation();
  const { addApplication } = useApplications();
  
  const [formData, setFormData] = useState({
    jobTitle: "",
    company: "",
    jobUrl: "",
    jobDescription: ""
  });
  const [isImporting, setIsImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImportDocx = async () => {
    try {
      setIsImporting(true);
      const file = await window.electronAPI.openFile({
        title: "İş Tanımını Yükle (Word)",
        filters: [{ name: "Word Belgesi", extensions: ["docx"] }]
      });
      if (file) {
        const text = await window.electronAPI.parseDocx(file.data);
        setFormData(prev => ({ ...prev, jobDescription: text }));
      }
    } catch (e) {
      console.error(e);
      alert("Belge okunamadı.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jobTitle || !formData.company) return;
    
    setIsSubmitting(true);
    try {
      const app = await addApplication({
        jobTitle: formData.jobTitle,
        company: formData.company,
        jobUrl: formData.jobUrl,
        jobDescription: formData.jobDescription,
        status: "draft",
        notes: "",
      });
      setLocation(`/applications/${app.id}`);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <header className="space-y-2">
        <button 
          onClick={() => setLocation("/applications")}
          className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1.5 transition-colors mb-4 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri dön
        </button>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          Yeni Başvuru Oluştur
        </h1>
        <p className="text-muted-foreground text-sm">
          Başvuracağınız pozisyonun detaylarını girin. İş tanımını (job description) yapıştırmak, 
          AI'nin CV'nizi ve önyazınızı bu ilana özel optimize etmesini sağlar.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">İş Pozisyonu <span className="text-destructive">*</span></label>
            <input
              type="text"
              required
              value={formData.jobTitle}
              onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
              className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Örn: Senior Frontend Developer"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Şirket <span className="text-destructive">*</span></label>
            <input
              type="text"
              required
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
              className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Örn: Acme Corp"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">İlan URL (Opsiyonel)</label>
          <input
            type="url"
            value={formData.jobUrl}
            onChange={(e) => setFormData({...formData, jobUrl: e.target.value})}
            className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono"
            placeholder="https://linkedin.com/jobs/view/..."
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">İş Tanımı (Job Description)</label>
            <button 
              type="button"
              onClick={handleImportDocx}
              disabled={isImporting}
              className="text-xs flex items-center gap-1.5 text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {isImporting ? "Yükleniyor..." : "Word'den Yükle (.docx)"}
            </button>
          </div>
          <textarea
            value={formData.jobDescription}
            onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
            className="w-full bg-input border rounded-sm px-3 py-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring min-h-[300px] resize-y leading-relaxed text-muted-foreground focus:text-foreground transition-colors"
            placeholder="İlanın metnini buraya yapıştırın. AI, bu metindeki anahtar kelimeleri ve gereksinimleri analiz ederek belgelerinizi şekillendirecektir..."
          />
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !formData.jobTitle || !formData.company}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Oluşturuluyor..." : "Çalışma Alanına Git"}
          </button>
        </div>
      </form>
    </div>
  );
}
