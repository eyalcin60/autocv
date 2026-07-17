# CV Builder — Masaüstü Uygulama Build Talimatları

## Gereksinimler

- [Node.js](https://nodejs.org/) v20 veya üzeri
- [pnpm](https://pnpm.io/) v10 (`npm install -g pnpm`)
- Git

## Kurulum

```bash
# Replit projesini klonla
git clone <repo-url>
cd <proje-klasoru>

# Tüm bağımlılıkları yükle
pnpm install
```

## Windows için Build (.exe installer)

```bash
pnpm --filter @workspace/cv-desktop run dist:win
```

Çıktı: `artifacts/cv-desktop/release/CV Builder Setup X.X.X.exe`

Bu dosyayı çift tıklayarak kur, masaüstüne kısayol oluşturulur.

## macOS için Build (.dmg)

```bash
pnpm --filter @workspace/cv-desktop run dist:mac
```

Çıktı: `artifacts/cv-desktop/release/CV Builder-X.X.X.dmg`

## Linux için Build (.AppImage)

```bash
pnpm --filter @workspace/cv-desktop run dist:linux
```

Çıktı: `artifacts/cv-desktop/release/CV Builder-X.X.X.AppImage`

## Otomatik Build (GitHub Actions)

Projeyi GitHub'a push edip bir tag oluştur:

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions otomatik olarak Windows (.exe), macOS (.dmg) ve Linux (.AppImage) kurulumcularını oluşturur.
Actions sekmesinden "Build Desktop App" iş akışını manuel olarak da başlatabilirsin.

## İkon Ekleme (İsteğe Bağlı)

`artifacts/cv-desktop/assets/` klasörüne şu dosyaları ekle:
- `icon.ico` — Windows (256×256 önerilen)
- `icon.icns` — macOS
- `icon.png` — Linux (512×512 önerilen)

[icoconverter.com](https://www.icoconverter.com/) veya [electron-icon-builder](https://github.com/safu9/electron-icon-builder) kullanabilirsin.

## İlk Çalıştırma

1. Uygulamayı aç
2. Sol menüden **Settings** (Ayarlar) sayfasına git
3. OpenAI API anahtarını gir ([platform.openai.com](https://platform.openai.com/api-keys))
4. Modeli seç (gpt-4o önerilen)
5. Kaydet

**Not:** API anahtarın yalnızca cihazında saklanır, hiçbir sunucuya gönderilmez.

## Kullanım Akışı

1. **Profile** — Ad, e-posta, beceriler gibi kişisel bilgilerini gir
2. **Source Library** — Geçmiş CV'lerini, yayınlarını, projelerini yapıştır veya .docx olarak yükle
3. **Applications → Yeni Başvuru** — İş ilanını yapıştır veya .docx olarak yükle
4. İş ilanı sayfasında:
   - **Sektörel CV** veya **Akademik CV** seç
   - İsterersen kendi CV şablonunu (.docx) yükle — başlıklar korunur, içerik güncellenir
   - **Oluştur** butonuna bas — AI gerçek zamanlı yazar
   - **İndir (.docx)** ile Word formatında kaydet
