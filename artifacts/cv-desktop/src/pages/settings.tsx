import { useState, useEffect } from "react";
import { useSettings } from "@/lib/store";
import { Settings as SettingsIcon, Save, Key, Cpu, ExternalLink, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const { settings, setSettings, loading } = useSettings();
  
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [showKey, setShowKey] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setApiKey(settings.openaiApiKey || "");
      setModel(settings.model || "gpt-4o");
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await setSettings({ openaiApiKey: apiKey, model });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const isConfigured = !!settings?.openaiApiKey;

  if (loading) return null;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <header className="space-y-2 border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" />
          Sistem Ayarları
        </h1>
        <p className="text-muted-foreground text-sm">
          AI motoru bağlantı ayarlarını ve model tercihlerini yapılandırın.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Status Card */}
        <div className="p-4 rounded-sm border bg-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">OpenAI Bağlantı Durumu</p>
              <p className="text-xs text-muted-foreground">İçerik üretimi için gereklidir</p>
            </div>
          </div>
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-success bg-success/10 rounded-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Yapılandırıldı
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-destructive bg-destructive/10 rounded-sm">
              <XCircle className="w-3.5 h-3.5" />
              Yapılandırılmadı
            </span>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground" />
              OpenAI API Anahtarı
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
                className="w-full bg-input border rounded-sm pl-3 pr-10 py-2.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
              <Key className="w-3.5 h-3.5 flex-none mt-0.5" />
              <p>
                API anahtarınız yalnızca cihazınızda (<span className="font-mono">electron-store</span>) saklanır, hiçbir sunucuya gönderilmez.
                <br />
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
                >
                  API anahtarı almak için platform.openai.com <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Cpu className="w-4 h-4 text-muted-foreground" />
              Yapay Zeka Modeli
            </label>
            <select
              value={model}
              onChange={(e) => { setModel(e.target.value); setSaved(false); }}
              className="w-full bg-input border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
            >
              <option value="gpt-4o">GPT-4o (Önerilen, en hızlı ve akıllı)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (Daha ekonomik)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between border-t">
          <div>
            {saved && (
              <span className="text-success text-sm flex items-center gap-1.5 animate-in slide-in-from-left-4">
                <CheckCircle2 className="w-4 h-4" />
                Ayarlar kaydedildi
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
