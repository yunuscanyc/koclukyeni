export type SinifType = '9. Sınıf' | '10. Sınıf' | '11. Sınıf' | '12. Sınıf' | 'Mezun';
export type AlanType = 'Sayısal' | 'Eşit Ağırlık' | 'Sözel' | 'Dil' | 'Belirtilmemiş';
export type DurumType = 'Aktif' | 'Donduruldu' | 'Tamamlandı' | 'Pasif';

// 1. ÖĞRENCİ MODELİ
export interface Student {
  id: string;
  pinCode: string; // 6 haneli benzersiz öğrenci erişim PIN numarası
  adSoyad: string;
  dogumTarihi: string;
  kayitTarihi: string;
  sinif: SinifType;
  alan: AlanType;
  yksHedefYili: string;
  hedefUniversite: string;
  hedefBolum: string;
  hedefPuan: number | string;
  hedefSiralama: number | string;
  durum: DurumType;
  kocNotu: string;
  avatarBg?: string;
}

// Kimlik Doğrulama / PIN Rolleri
export type AuthRole = 'coach' | 'student';
export interface AuthSession {
  role: AuthRole;
  studentId?: string;
}

// 2. KOÇ NOTLARI
export type NoteKategori =
  | 'Haftalık Değerlendirme'
  | 'Hedef & Strateji'
  | 'Ödev & Görev'
  | 'Veli Görüşmesi'
  | 'Sınav Analizi'
  | 'Motivasyon & Rehberlik'
  | 'Genel';

export type NoteOncelik = 'Kritik' | 'Önemli' | 'Normal' | 'Düşük';

export interface CoachNote {
  id: string;
  studentId: string;
  tarih: string;
  kategori: NoteKategori;
  oncelik: NoteOncelik;
  baslik: string;
  icerik: string;
}

// 4. GÜNLÜK SORU TAKİBİ
export interface SoruTakipKaydi {
  id: string;
  studentId: string;
  tarih: string;
  ders: string;
  konu: string;
  cozulenSoru: number;
  dogruSayisi: number;
  yanlisSayisi: number;
  bosSayisi: number;
  net: number;
}

// 5. DENEMELER (TYT / AYT)
export interface DersNetDetay {
  dersAdi: string;
  dogru: number;
  yanlis: number;
  bos: number;
  net: number;
}

export interface DenemeSinavi {
  id: string;
  studentId: string;
  ogrenciAdSoyad?: string;
  sinavTuru: 'TYT' | 'AYT';
  denemeAdi: string;
  yayin: string;
  tarih: string;
  toplamNet: number;
  puan?: number | null;
  siralama?: number | null;
  toplamKatilimci?: number | null;
  kocYorumu?: string | null;
  dersler: DersNetDetay[];
}

// 6. MEB MÜFREDAT KAZANIMLARI
export type KazanimOnem = 'Kritik' | 'Yüksek' | 'Orta' | 'Temel';

export interface Kazanim {
  id: string;
  sinif?: SinifType | string;
  sinavTuru: 'TYT' | 'AYT' | 'TÜMÜ';
  ders: string;
  konu: string;
  kazanimKodu: string;
  aciklama: string;
  onemDerecesi: KazanimOnem;
  yil: string;
}

// 7. FOTOĞRAFLI SINAV & KAZANIM ANALİZİ
export type SinavSorusu = SoruAnalizDetay;

export interface SoruAnalizDetay {
  soruNo: number;
  sayfaNo?: number;
  sayfaIndex?: number;
  soruTuru?: 'coktan_secmeli' | 'bosluk_doldurma' | 'acik_uclu' | 'klasik' | 'dogru_yanlis';
  ders: string;
  unite?: string;
  konu: string;
  isaretlenenSik?: string; // "A", "B", "C", "D", "E", "Boş" veya Boşluk Doldurma cevabı
  ogrenciCevabi?: string;  // Boşluk doldurma / çoktan seçmeli öğrenci yanıtı
  dogruCevap: string;      // Doğru şık ("A", "B"..) veya beklenen metin cevabı
  dogruMu: boolean;
  durum?: 'dogru' | 'yanlis' | 'bos';
  kazanimKodu?: string;
  kazanimAciklama?: string;
  cozumDetayi?: string;   // Yapay zekâ adım adım çözüm adımları
  cozum?: string;         // Çözüm alternatifi
  soruOzeti?: string;
  analizNotu?: string;
  sayfaFotoUrl?: string;
  soruFotografYolu?: string; // base64 or photo URL
  kutu?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] percentage coordinates
}

export type AIProcessingStatus = 'pending' | 'processing' | 'completed' | 'rate_limited' | 'error';

export interface OgrenciSinavKaydi {
  id: string;
  studentId: string;
  ogrenciAdSoyad?: string;
  sinavTuru: 'TYT' | 'AYT';
  sinavAdi: string;
  tarih: string;
  toplamSoru: number;
  dogruSayisi: number;
  yanlisSayisi: number;
  bosSayisi: number;
  net?: number;
  toplamNet: number;
  sorular: SoruAnalizDetay[];
  fotografYollari?: string[];
  sayfaFotolari?: string[];
  isNew?: boolean; // Koç ekranında "YENİ" uyarısı için
  goruldu?: boolean; // Koç tarafından incelendi / görüldü mü?
  ogrenciYukledi?: boolean; // Öğrenci portalından yüklendiğini belirtir
  yuklemeZamani?: string; // "12.09.2026 14:30" gibi detaylı yükleme zamanı
  durum?: 'Yeni' | 'İncelendi' | 'Değerlendirildi';
  aiStatus?: AIProcessingStatus; // 'completed' | 'processing' | 'rate_limited' | 'pending' | 'error'
  aiStatusMessage?: string; // e.g. "Yapay zekâ çözdü", "Devam ediyor", "Kota sıfırlanması bekleniyor..."
  lastError?: string; // Tam ve ham hata metni (429, Quota Exceeded, vb.)
  nextRetryTime?: number; // Bir sonraki otomatik deneme zaman damgası (ms)
  ogrenciNotu?: string; // Öğrencinin testle ilgili koça yazdığı not
  kocGeriBildirimi?: string; // Koçun bu teste özel geri bildirimi
  isDeneme?: boolean; // Bu sınav bir denemedir işaretlendiyse true
  forceReset?: boolean; // Soruları sıfırlama bayrağı (mevcut soruları ezmek için)
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  source: 'ai_worker' | 'gemini' | 'db' | 'api';
  message: string;
  details?: string;
  archiveId?: string;
  testName?: string;
  studentName?: string;
  model?: string;
  durationMs?: number;
}

export interface ModelHealthStatus {
  model: string;
  provider?: 'gemini' | 'grok' | 'openai' | 'groq' | 'openrouter';
  status: 'ok' | 'rate_limited' | 'error' | 'deprecated';
  latencyMs?: number;
  message?: string;
}

export interface AiSystemStatus {
  geminiKeyPresent: boolean;
  geminiKeyLength: number;
  geminiKeyCount?: number;
  geminiKeys?: Array<{ masked: string; isCooldown: boolean; cooldownSec: number }>;
  grokKeyPresent?: boolean;
  openaiKeyPresent?: boolean;
  groqKeyPresent?: boolean;
  openrouterKeyPresent?: boolean;
  modelCascade: string[];
  activeQueueCount: number;
  activeJobs: Array<{
    archiveId: string;
    testName: string;
    studentName: string;
    currentPageIndex: number;
    totalPages: number;
    retryCount: number;
    nextAttemptTime: number;
  }>;
  isQueueWorkerRunning: boolean;
  globalQuotaResetTime: number;
  isQuotaBlocked: boolean;
  quotaWaitSecondsRemaining: number;
  recentLogs: SystemLogEntry[];
  failedArchives: Array<{
    id: string;
    sinavAdi: string;
    ogrenciAdSoyad: string;
    aiStatus: string;
    aiStatusMessage: string;
    lastError: string;
    nextRetryTime?: number;
    photosCount: number;
  }>;
}

// Aliases for WinForms simulator or other legacy references
export type ExamRecord = DenemeSinavi;
export type QuestionEntry = SoruTakipKaydi;
export type OutcomeItem = Kazanim;

// Kazanım İstatistik Modeli (Raporlar için)
export interface KazanimIstatistik {
  kazanimKodu: string;
  kazanimAciklama: string;
  ders: string;
  konu: string;
  toplamSoru: number;
  dogruSayisi: number;
  yanlisSayisi: number;
  bosSayisi: number;
  basariYuzdesi: number;
}

// 8. HAFTALIK DERS PROGRAMI & GÖREVLER
export type ScheduleTaskType =
  | 'soru-cozumu'       // Soru Çözümü
  | 'konu-calismasi'    // Konu Çalışması / Ders Çalışma
  | 'deneme-sinavi'     // Deneme Sınavı
  | 'koc-gorusmesi'     // Koç Görüşmesi
  | 'rehberlik'         // Rehber Öğretmen Görüşmesi
  | 'tekrar-analiz'     // Tekrar & Soru Analizi
  | 'mola-serbest';     // Serbest Zaman / Mola

export type DayOfWeek = 'pazartesi' | 'sali' | 'carsamba' | 'persembe' | 'cuma' | 'cumartesi' | 'pazar';

export interface WeeklyScheduleTask {
  id: string;
  studentId: string;
  gun: DayOfWeek;
  baslangicSaat: string; // e.g. "08:00"
  bitisSaat: string;     // e.g. "09:30"
  gorevTuru: ScheduleTaskType;
  baslik: string;        // e.g. "Matematik Soru Çözümü"
  ders?: string;         // e.g. "Matematik"
  konular?: string;      // e.g. "Trigonometri"
  hedefSoruSayisi?: number;
  kaynak?: string;       // e.g. "345 Yayınları"
  gorusmeNotu?: string;  // Koç / Rehber öğretmen notu
  aciklama?: string;
  tamamlandi?: boolean;
  tarih?: string; // Sınav/görev tarihi e.g. "YYYY-MM-DD"
}

// Tab navigation keys
export type StudentProfileTab =
  | 'genel'
  | 'koc-notlari'
  | 'soru-takibi'
  | 'haftalik-program'
  | 'denemeler'
  | 'raporlar'
  | 'sinav-gecmisi'
  | 'atanan-kaynaklar';

export type MainViewMode = 'students' | 'student-detail' | 'analytics' | 'ai-coach' | 'winforms-simulator' | 'resources' | 'curriculum';

export type BookDifficulty = 'Kolay' | 'Orta' | 'Zor';

export interface CurriculumTopicItem {
  id: string;
  name: string;
  kazanimKodu?: string;
  onem: 'Kritik' | 'Yüksek' | 'Orta' | 'Temel';
  osymCikmaAirligi?: string; // e.g. "TYT'de 1-2 soru", "AYT'de 3 soru"
  hedefSoruOnerisi?: number; // e.g. 150
  tahminiCalismaSaati?: number; // e.g. 6
  kocNotu?: string;
}

export interface CurriculumUnitItem {
  id: string;
  uniteNo: number;
  uniteAdi: string;
  aciklama?: string;
  topics: CurriculumTopicItem[];
}

export interface CurriculumSubjectItem {
  id: string;
  dersAdi: string;
  iconName?: string;
  colorTheme?: string;
  sinavTuru: 'TYT' | 'AYT' | 'TYT & AYT' | 'YDT';
  units: CurriculumUnitItem[];
}

export interface CurriculumGradeLevel {
  gradeId: '9' | '10' | '11' | '12' | 'tyt' | 'ayt';
  title: string;
  subtitle: string;
  description: string;
  subjects: CurriculumSubjectItem[];
}

export interface BookResource {
  id: string;
  name: string;
  publisher: string;
  difficulty: BookDifficulty;
  subject: string;
}

export interface StudentAssignedResource {
  id: string;
  studentId: string;
  bookId?: string;
  bookName: string;
  publisher: string;
  subject: string;
  difficulty?: BookDifficulty;
  targetDurationDays?: number; // e.g. 14 (gün)
  targetDate?: string;         // e.g. "2026-10-15"
  hedefSoruSayisi?: number;    // e.g. 250 (soru)
  note?: string;               // Koç'un özel açıklaması / talimatı
  assignedDate: string;        // Atanma Tarihi (ISO YYYY-MM-DD)
  completed: boolean;          // Öğrenci bitirdi mi?
  completedDate?: string;      // Tamamlanma tarihi
}

export interface YoloServiceConfig {
  enabled: boolean;
  serviceUrl: string;
  confThreshold: number;
  margin: number;
  minSize: number;
  autoDewarp: boolean;
  lastOnlineCheck?: string;
  lastOnlineStatus?: boolean;
  lastModelName?: string;
}

export interface YoloDetectedQuestion {
  soru_no: number;
  normalized_box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  pixel_coords?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export interface YoloDetectResponse {
  success: boolean;
  process_time_ms?: number;
  total_questions?: number;
  questions?: YoloDetectedQuestion[];
  preview_image?: string;
  model?: string;
  error?: string;
}
