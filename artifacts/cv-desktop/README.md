# CV Builder — Masaüstü Uygulama

AI destekli, yerel çalışan CV ve ön yazı oluşturma aracı. Tüm veriler bilgisayarında saklanır; yalnızca üretim aşamasında OpenAI API'sine bağlanır.

---

## İçindekiler

- [Özellikler](#özellikler)
- [Kurulum](#kurulum)
  - [Gereksinimler](#gereksinimler)
  - [Adım 1 — Projeyi İndir](#adım-1--projeyi-indir)
  - [Adım 2 — Bağımlılıkları Yükle](#adım-2--bağımlılıkları-yükle)
  - [Adım 3 — Paketi Oluştur](#adım-3--paketi-oluştur)
  - [Adım 4 — Kur ve Aç](#adım-4--kur-ve-aç)
- [İlk Yapılandırma](#ilk-yapılandırma)
- [Kullanım Kılavuzu](#kullanım-kılavuzu)
  - [1. Profil Oluştur](#1-profil-oluştur)
  - [2. Kaynak Materyal Ekle](#2-kaynak-materyal-ekle)
  - [3. Başvuru Aç](#3-başvuru-aç)
  - [4. CV veya Ön Yazı Üret](#4-cv-veya-ön-yazı-üret)
  - [5. İndir ve Düzenle](#5-i̇ndir-ve-düzenle)
- [Şablon Kullanımı](#şablon-kullanımı)
- [Sık Sorulan Sorular](#sık-sorulan-sorular)
- [Geliştirici Notları](#geliştirici-notları)

---

## Özellikler

| Özellik | Açıklama |
|---|---|
| **Sektörel CV** | Özel sektör başvuruları için optimize — akademik içerik olmadan |
| **Akademik CV** | Yayınlar, projeler, araştırma deneyimi dahil |
| **Ön Yazı** | Şirkete ve pozisyona özel, insan sesi taşıyan yazı |
| **Şablon koruma** | Kendi CV formatını yükle — başlıklar korunur, AI yalnızca içeriği yazar |
| **ATS optimizasyonu** | İş ilanındaki anahtar kelimeler doğal biçimde yerleştirilir |
| **Gerçek zamanlı akış** | Üretim sırasında cümle cümle izle |
| **Tam yerel** | Hiçbir verin buluta gitmez; API anahtarın bile yalnızca cihazında saklanır |

---

## Kurulum

### Gereksinimler

- **Node.js** v20 veya üzeri → [nodejs.org](https://nodejs.org/)
- **pnpm** v10 → kurulum: `npm install -g pnpm`
- **Git** → [git-scm.com](https://git-scm.com/)
- **OpenAI API Anahtarı** → [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **İşletim sistemi:** Windows 10/11 (x64), macOS 12+, Ubuntu 20.04+

---

### Adım 1 — Projeyi İndir

**Replit'ten ZIP olarak:**

Replit arayüzünde sağ üst köşedeki **⋮** menüsünden → **Download as zip** seçeneğini kullan. ZIP'i bir klasöre çıkar.

**Git ile:**

```bash
git clone <repo-url>
cd <proje-klasoru>
```

---

### Adım 2 — Bağımlılıkları Yükle

Proje **kök dizininde** (en üst klasörde) çalıştır:

```bash
pnpm install
```

> İlk kurulumda Electron binary'si (~100 MB) indirilir, biraz zaman alabilir.

---

### Adım 3 — Paketi Oluştur

**Windows için (.exe kurulum dosyası):**

```bash
pnpm --filter @workspace/cv-desktop run dist:win
```

**macOS için (.dmg):**

```bash
pnpm --filter @workspace/cv-desktop run dist:mac
```

**Linux için (.AppImage):**

```bash
pnpm --filter @workspace/cv-desktop run dist:linux
```

Çıktı dosyası `artifacts/cv-desktop/release/` klasöründe oluşur.

> **Windows build nerede?**
> `CV Builder Setup 1.0.0.exe` — bu dosyayı çift tıklayarak kurabilirsin.

---

### Adım 4 — Kur ve Aç

- **Windows:** `CV Builder Setup 1.0.0.exe` dosyasını çift tıkla → kurulum sihirbazını izle → masaüstü kısayolundan aç.
- **macOS:** `.dmg` dosyasını aç → uygulamayı Applications klasörüne sürükle.
- **Linux:** `.AppImage` dosyasına çalıştırma izni ver (`chmod +x *.AppImage`), çift tıklayarak aç.

---

## İlk Yapılandırma

Uygulamayı ilk açtığında sol menüden **Settings** sayfasına git:

1. **OpenAI API Key** alanına anahtarını gir
2. **Model** seç — `gpt-4o` önerilir (daha kaliteli çıktı), `gpt-4o-mini` daha hızlı ve ucuz
3. **Kaydet** butonuna bas

> API anahtarın yalnızca kendi bilgisayarında, şifreli bir yerel dosyada saklanır. Hiçbir sunucuya gönderilmez.

---

## Kullanım Kılavuzu

### Tam İş Akışı

```
Profil Doldur → Kaynak Materyal Ekle → Başvuru Aç → CV / Ön Yazı Üret → İndir
```

---

### 1. Profil Oluştur

Sol menüden **Profile** sayfasını aç:

- Adı soyadı, e-posta, telefon, şehir bilgilerini gir
- LinkedIn ve kişisel web sitesi bağlantılarını ekle (isteğe bağlı)
- Bu bilgiler her belgede otomatik olarak kullanılır

---

### 2. Kaynak Materyal Ekle

Sol menüden **Source Library** sayfasına git:

Burada AI'ın senden **öğreneceği** materyalleri topluyorsun. Ne kadar çok materyal eklersen, çıktı o kadar sana özgü olur.

**Eklenebilecekler:**

| Materyal | Nasıl Eklenir | Açıklama |
|---|---|---|
| Geçmiş CV | Metni yapıştır veya `.docx` yükle | AI buradan deneyim ve başarıları çeker |
| Yayınlar listesi | Metni yapıştır | Akademik CV için şart |
| Bitirme/yüksek lisans tezi | Başlık ve özet yeterli | Araştırma geçmişini gösterir |
| Projeler | Metni yapıştır | İş ve yan projeler |
| Yazım taslağı | Kendi yazdığın bir metin | AI yazım tonunu buradan öğrenir |
| Referans mektupları | Metni yapıştır | İçerik zenginliği için |

**İpucu:** Bir "Yazım Taslağı" belgesi ekle — kendi yazdığın bir kapak mektubu ya da motivasyon mektubu taslağı. AI senin cümle yapını ve sesini kopyalar; çıktılar "AI yazdı" gibi değil, sen yazmışsın gibi gelir.

---

### 3. Başvuru Aç

Sol menüden **Applications → Yeni Başvuru** butonuna tıkla:

1. **Şirket adı** ve **pozisyon başlığını** gir
2. **İş ilanını** yapıştır — tüm metni olduğu gibi yapıştırabilirsin
   - Alternatif: `.docx` dosyası yükle
3. **Kaydet**

---

### 4. CV veya Ön Yazı Üret

Başvuru listesinden ilgili başvuruya tıkla. Sağ tarafta üretim paneli açılır:

#### CV Üretimi

1. **CV Türü Seç:**
   - **Sektörel CV** — özel sektör, şirket başvuruları için. Akademik içerik (yayın, tez) yer almaz.
   - **Akademik CV** — akademi, araştırma kurumu, burs başvuruları için. Yayınlar ve araştırma detaylı yer alır.

2. **Şablon (isteğe bağlı):**
   Kendi CV formatını korumak istiyorsan bir `.docx` şablon yükle.
   - Başlık sırası ve isimleri aynen korunur
   - AI yalnızca her başlığın altındaki içeriği yazar
   - Şablon yüklemezsen standart format kullanılır

3. **Oluştur** butonuna bas
   - Üretim gerçek zamanlı akar, cümle cümle izleyebilirsin
   - Ortalama süre: 30–60 saniye

#### Ön Yazı Üretimi

1. **Ön Yazı** sekmesine geç
2. **Oluştur** butonuna bas
   - AI şirket adını, pozisyonu ve iş ilanındaki gereksinimleri otomatik entegre eder
   - Kaynak materyallerinden ilgili deneyimler seçilerek kullanılır

---

### 5. İndir ve Düzenle

Üretim tamamlandıktan sonra:

- **İndir (.docx)** butonuna bas → Word formatında kaydet
- Dosyayı Word, LibreOffice veya Google Docs'ta açarak son rötuşları yap
- ATS sistemleri için PDF'e dönüştürebilirsin (Word → Farklı Kaydet → PDF)

---

## Şablon Kullanımı

Kendi CV formatını korumak için şablon özelliğini kullan:

**Şablon hazırlama:**
1. Mevcut Word CV'ini aç
2. İçerikleri sil — yalnızca **başlık satırlarını** bırak (ör. "İş Deneyimi", "Eğitim", "Beceriler")
3. Başlıklar **Heading 1** veya **Heading 2** stiliyle biçimlendirilmişse sistem otomatik algılar; yoksa normal metin de çalışır
4. Dosyayı `.docx` olarak kaydet
5. Başvuru sayfasında "Şablon Yükle" ile sisteme ver

**Ne olur:**
- AI her başlığı sırayla işler
- Her bölüm için ayrı içerik üretir
- Başlık adları ve sıraları değişmez
- Çıktı dosyasını açtığında aynı format yapısı olur, içerikler güncel olur

---

## Sık Sorulan Sorular

**Verilerim nerede saklanıyor?**
Tüm veriler bilgisayarında, işletim sisteminin standart uygulama veri klasöründe saklanır:
- Windows: `C:\Users\<kullanıcı>\AppData\Roaming\cv-builder\`
- macOS: `~/Library/Application Support/cv-builder/`
- Linux: `~/.config/cv-builder/`

**API maliyeti ne kadar?**
Her tam CV üretimi yaklaşık 3.000–6.000 token kullanır. GPT-4o ile bu yaklaşık $0.03–0.06 (3–6 sent) eder. OpenAI faturanı [platform.openai.com/usage](https://platform.openai.com/usage) adresinden takip edebilirsin.

**İnternet olmadan çalışır mı?**
Mevcut verileri görüntülemek ve yönetmek için evet. Ancak yeni CV veya ön yazı üretmek için OpenAI API bağlantısı gerekir.

**Çıktı gerçekten insan gibi mi görünüyor?**
Sistem "leveraged", "spearheaded", "dynamic", "passionate" gibi tipik AI kalıplarını kullanmaktan kaçınır. Yazım taslağı materyali eklersen AI senin sesini ve cümle yapını kopyalar — çıktılar bariz AI metni gibi görünmez. Yine de son okumayı her zaman kendin yapmanı öneririz.

**Şablon yüklemeden de çalışır mı?**
Evet. Şablon olmadan standart bir CV yapısı oluşturulur.

---

## Geliştirici Notları

Geliştirme modunda çalıştırmak için (arayüz + Electron birlikte):

```bash
# Önce renderer'ı build et
pnpm --filter @workspace/cv-desktop run build:electron

# Sonra geliştirme modunu başlat
pnpm --filter @workspace/cv-desktop run dev
```

Yalnızca arayüzü tarayıcıda test etmek için:

```bash
pnpm --filter @workspace/cv-desktop run dev:renderer
# → http://localhost:5174
```

TypeScript kontrol:

```bash
pnpm --filter @workspace/cv-desktop run typecheck
```
