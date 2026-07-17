import { useState } from "react";
import { useDocuments } from "@/lib/store";
import { cn, DOC_TYPE_LABELS, formatDate } from "@/lib/utils";
import type { DocumentType } from "@/lib/types";
import { 
  FolderOpen, Plus, FileText, Trash2, X, Upload, 
  Search, BookOpen, LayoutTemplate, MoreHorizontal
} from "lucide-react";

export default function DocumentsPage() {
  const { documents, addDocument, deleteDocument } = useDocuments();
  const [filter, setFilter] = useState<DocumentType | "all">("all");
  const [search, setSearch] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    type: "cv" as DocumentType,
    description: "",
    content: "",
  });
  const [isImporting, setIsImporting] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const filteredDocs = documents.filter((d) => {
    if (filter !== "all" && d.type !== filter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  const handleImportDocx = async () => {
    try {
      setIsImporting(true);
      const file = await window.electronAPI.openFile({
        title: "Word Belgesi Seç",
        filters: [{ name: "Word Belgesi", extensions: ["docx"] }]
      });
      if (file) {
        const text = await window.electronAPI.parseDocx(file.data);
        setModalData(prev => ({
          ...prev,
          title: prev.title || file.name.replace(".docx", ""),
          content: text
        }));
      }
    } catch (e) {
      console.error(e);
      alert("Belge okunamadı.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleSaveDoc = async () => {
    if (!modalData.title || !modalData.content) {
      alert("Başlık ve içerik zorunludur.");
      return;
    }
    await addDocument(modalData);
    setIsModalOpen(false);
    setModalData({ title: "", type: "cv", description: "", content: "" });
  };

  const getDocIcon = (type: string) => {
    switch (type) {
      case "cv": return <FileText className="w-4 h-4 text-blue-400" />;
      case "publication": return <BookOpen className="w-4 h-4 text-purple-400" />;
      case "project": return <LayoutTemplate className="w-4 h-4 text-green-400" />;
      default: return <MoreHorizontal className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
      {/* Header & Toolbar */}
      <div className="p-6 border-b flex-none space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" />
            Kaynak Belgeler
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm"
          >
            <Plus className="w-4 h-4" />
            Belge Ekle
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="flex bg-muted/50 p-1 rounded-sm border">
            {["all", "cv", "publication", "project", "other"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t as any)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                  filter === t 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "all" ? "Tümü" : DOC_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Belgelerde ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input border rounded-sm pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className={cn("flex-1 overflow-y-auto p-6", selectedDocId && "hidden md:block md:w-1/2 md:flex-none md:border-r")}>
          {filteredDocs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <FolderOpen className="w-12 h-12 mb-4 opacity-20" />
              <p>Belge bulunamadı.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-sm border transition-all hover:border-primary/50 group flex flex-col gap-2",
                    selectedDocId === doc.id ? "bg-muted border-primary shadow-sm" : "bg-card"
                  )}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-2">
                      {getDocIcon(doc.type)}
                      <span className="font-semibold text-sm">{doc.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted-foreground/10 px-2 py-0.5 rounded-sm">
                      {DOC_TYPE_LABELS[doc.type]}
                    </span>
                  </div>
                  {doc.description && <p className="text-xs text-muted-foreground truncate w-full">{doc.description}</p>}
                  <div className="flex justify-between items-center w-full mt-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{formatDate(doc.createdAt)}</span>
                    <div 
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm opacity-0 group-hover:opacity-100 transition-all"
                      onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); if (selectedDocId === doc.id) setSelectedDocId(null); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedDoc && (
          <div className="flex-1 flex flex-col bg-card overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <button className="md:hidden p-1 hover:bg-muted rounded-sm" onClick={() => setSelectedDocId(null)}>
                  <X className="w-4 h-4" />
                </button>
                {getDocIcon(selectedDoc.type)}
                <h3 className="font-semibold text-sm">{selectedDoc.title}</h3>
              </div>
              <button 
                onClick={() => { deleteDocument(selectedDoc.id); setSelectedDocId(null); }}
                className="text-xs text-destructive hover:underline"
              >
                Sil
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {selectedDoc.content}
            </div>
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-card border rounded-sm shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Yeni Belge Ekle
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Belge Adı</label>
                  <input
                    type="text"
                    value={modalData.title}
                    onChange={(e) => setModalData({...modalData, title: e.target.value})}
                    className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Örn: 2023 Özgeçmişim"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Belge Türü</label>
                  <select
                    value={modalData.type}
                    onChange={(e) => setModalData({...modalData, type: e.target.value as DocumentType})}
                    className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
                  >
                    <option value="cv">CV</option>
                    <option value="publication">Yayın</option>
                    <option value="project">Proje</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Açıklama (Opsiyonel)</label>
                <input
                  type="text"
                  value={modalData.description}
                  onChange={(e) => setModalData({...modalData, description: e.target.value})}
                  className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Kısa bir not..."
                />
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col min-h-[200px]">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Belge İçeriği</label>
                  <button 
                    type="button"
                    onClick={handleImportDocx}
                    disabled={isImporting}
                    className="text-xs flex items-center gap-1.5 text-primary hover:text-primary/80 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isImporting ? "Yükleniyor..." : "Word'den İçe Aktar (.docx)"}
                  </button>
                </div>
                <textarea
                  value={modalData.content}
                  onChange={(e) => setModalData({...modalData, content: e.target.value})}
                  className="w-full flex-1 bg-input border rounded-sm px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[200px]"
                  placeholder="Metni buraya yapıştırın veya bir Word belgesinden içe aktarın..."
                />
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-3 bg-muted/30">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-sm border hover:bg-muted transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleSaveDoc}
                className="px-4 py-2 text-sm font-medium rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
