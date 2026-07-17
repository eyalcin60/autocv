import { useState, useEffect } from "react";
import { useProfile } from "@/lib/store";
import { Save, CheckCircle2, Info, UserCircle } from "lucide-react";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const { profile, setProfile, loading } = useProfile();
  const [formData, setFormData] = useState<Profile>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedinUrl: "",
    githubUrl: "",
    websiteUrl: "",
    summary: "",
    skills: "",
    languages: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await setProfile(formData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <header>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-primary" />
          Ana Profil
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kişisel ve profesyonel bilgileriniz, AI tarafından CV oluşturulurken temel kaynak olarak kullanılacaktır.
        </p>
      </header>

      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-sm flex items-start gap-3 text-sm">
        <Info className="w-5 h-5 flex-none mt-0.5" />
        <p>
          Profil bilgileriniz tüm CV üretimlerinde varsayılan olarak kullanılır. Hedeflenen pozisyona göre 
          özel ayarlar yapmak isterseniz, "Uygulama Çalışma Alanı"ndan düzenleyebilirsiniz.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Kişisel Bilgiler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Ad Soyad</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                placeholder="Örn: Ahmet Yılmaz"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">E-posta</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                placeholder="Örn: ahmet@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Telefon</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                placeholder="Örn: +90 555 123 4567"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Şehir / Konum</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                placeholder="Örn: İstanbul, Türkiye"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">LinkedIn URL</label>
              <input
                type="url"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">GitHub URL</label>
              <input
                type="url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                placeholder="https://github.com/..."
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Kişisel Website URL</label>
              <input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleChange}
                className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Professional Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Profesyonel Profil</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Profesyonel Özet</label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                rows={4}
                className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow font-mono resize-y"
                placeholder="Kendinizi kısaca tanıtın..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Beceriler (Virgülle ayırın)</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow font-mono"
                placeholder="React, TypeScript, Node.js..."
              />
              {formData.skills && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.skills.split(',').map((skill, i) => (
                    skill.trim() && (
                      <span key={i} className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-sm font-mono border">
                        {skill.trim()}
                      </span>
                    )
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Diller (Virgülle ayırın)</label>
              <input
                type="text"
                name="languages"
                value={formData.languages}
                onChange={handleChange}
                className="w-full bg-input border rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-shadow font-mono"
                placeholder="İngilizce (İleri), Türkçe (Anadil)..."
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-4 border-t">
          {saved && (
            <span className="text-success text-sm flex items-center gap-1.5 animate-in slide-in-from-right-4">
              <CheckCircle2 className="w-4 h-4" />
              Başarıyla kaydedildi
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
