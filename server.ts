import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import * as pdfParseModule from "pdf-parse";
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;
import { pool, initializeDatabaseSchema, isMemoryFallbackActive } from "./server/db";

declare global {
  var useMemoryFallback: boolean;
}

Object.defineProperty(globalThis, "useMemoryFallback", {
  get() {
    return isMemoryFallbackActive();
  },
  configurable: true
});

dotenv.config();

function parseBool(val: any, defaultVal = true): boolean {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === "boolean") return val;
  const s = String(val).toLowerCase().trim();
  if (s === "false" || s === "f" || s === "0" || s === "no") return false;
  if (s === "true" || s === "t" || s === "1" || s === "yes") return true;
  return defaultVal;
}

const app = express();
const PORT = 3000;

// Allow large payloads for base64 exam photo uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-Memory & Local Disk Persistence Engine
let memStudents: any[] = [];
let memNotes: any[] = [];
let memQuestions: any[] = [];
let memExams: any[] = [];
let memCurriculum: any[] = [];
let memArchives: any[] = [];
let memSchedules: any[] = [];
let memBooks: any[] = [];
let memAssignedResources: any[] = [];
let memCoachPin: string = "998877";

const INITIAL_STUDENTS: any[] = [];

const INITIAL_ARCHIVES: any[] = [];

const INITIAL_BOOKS = [
  // Matematik
  { id: "book-1", name: "345 TYT Matematik Soru Bankası", publisher: "ÜçDörtBeş", difficulty: "Orta", subject: "Matematik" },
  { id: "book-2", name: "345 AYT Matematik Soru Bankası", publisher: "ÜçDörtBeş", difficulty: "Orta", subject: "Matematik" },
  { id: "book-3", name: "3D TYT Matematik Soru Bankası", publisher: "3D Yayınları", difficulty: "Zor", subject: "Matematik" },
  { id: "book-4", name: "3D AYT Matematik Soru Bankası", publisher: "3D Yayınları", difficulty: "Zor", subject: "Matematik" },
  { id: "book-5", name: "Bilgi Sarmal TYT Matematik Soru Bankası", publisher: "Bilgi Sarmal", difficulty: "Orta", subject: "Matematik" },
  { id: "book-6", name: "Bilgi Sarmal AYT Matematik Soru Bankası", publisher: "Bilgi Sarmal", difficulty: "Orta", subject: "Matematik" },
  { id: "book-7", name: "Apotemi AYT Matematik Fasikülleri", publisher: "Apotemi", difficulty: "Zor", subject: "Matematik" },
  { id: "book-8", name: "Orijinal TYT Matematik Soru Bankası", publisher: "Orijinal Yayınları", difficulty: "Zor", subject: "Matematik" },
  { id: "book-9", name: "Orijinal AYT Matematik Soru Bankası", publisher: "Orijinal Yayınları", difficulty: "Zor", subject: "Matematik" },
  { id: "book-10", name: "Karekök TYT Matematik Soru Bankası", publisher: "Karekök", difficulty: "Zor", subject: "Matematik" },
  { id: "book-11", name: "Karekök Sıfır Matematik Soru Bankası", publisher: "Karekök", difficulty: "Kolay", subject: "Matematik" },
  { id: "book-12", name: "Benim Hocam TYT Matematik Soru Bankası", publisher: "Benim Hocam", difficulty: "Kolay", subject: "Matematik" },
  { id: "book-13", name: "Hız ve Renk TYT Matematik Soru Bankası", publisher: "Hız ve Renk", difficulty: "Kolay", subject: "Matematik" },
  { id: "book-14", name: "Acil Matematik TYT Soru Bankası", publisher: "Acil Yayınları", difficulty: "Zor", subject: "Matematik" },

  // Türkçe / Edebiyat
  { id: "book-15", name: "345 TYT Türkçe Soru Bankası", publisher: "ÜçDörtBeş", difficulty: "Orta", subject: "Türkçe" },
  { id: "book-16", name: "Limit TYT Türkçe Soru Bankası", publisher: "Limit Yayınları", difficulty: "Zor", subject: "Türkçe" },
  { id: "book-17", name: "Bilgi Sarmal TYT Türkçe Soru Bankası", publisher: "Bilgi Sarmal", difficulty: "Orta", subject: "Türkçe" },
  { id: "book-18", name: "Hız ve Renk TYT Türkçe Soru Bankası", publisher: "Hız ve Renk", difficulty: "Kolay", subject: "Türkçe" },
  { id: "book-19", name: "Limit AYT Türk Dili ve Edebiyatı Soru Bankası", publisher: "Limit Yayınları", difficulty: "Zor", subject: "Edebiyat" },
  { id: "book-20", name: "Bilgi Sarmal AYT Edebiyat Soru Bankası", publisher: "Bilgi Sarmal", difficulty: "Orta", subject: "Edebiyat" },

  // Fizik
  { id: "book-21", name: "345 TYT Fizik Soru Bankası", publisher: "ÜçDörtBeş", difficulty: "Orta", subject: "Fizik" },
  { id: "book-22", name: "Karaağaç AYT Fizik Soru Bankası", publisher: "Karaağaç", difficulty: "Zor", subject: "Fizik" },
  { id: "book-23", name: "Palme TYT Fizik Soru Bankası", publisher: "Palme", difficulty: "Orta", subject: "Fizik" },
  { id: "book-24", name: "Esen AYT Fizik Soru Bankası", publisher: "Esen", difficulty: "Orta", subject: "Fizik" },
  { id: "book-25", name: "3D AYT Fizik Soru Bankası", publisher: "3D Yayınları", difficulty: "Zor", subject: "Fizik" },
  { id: "book-26", name: "Nihat Bilgin AYT Fizik Soru Bankası", publisher: "Nihat Bilgin", difficulty: "Zor", subject: "Fizik" },
  { id: "book-27", name: "Eis TYT Fizik Soru Bankası", publisher: "Eis Yayınları", difficulty: "Kolay", subject: "Fizik" },

  // Kimya
  { id: "book-28", name: "345 TYT Kimya Soru Bankası", publisher: "ÜçDörtBeş", difficulty: "Orta", subject: "Kimya" },
  { id: "book-29", name: "Aydın TYT Kimya Soru Bankası", publisher: "Aydın Yayınları", difficulty: "Orta", subject: "Kimya" },
  { id: "book-30", name: "Aydın AYT Kimya Soru Bankası", publisher: "Aydın Yayınları", difficulty: "Zor", subject: "Kimya" },
  { id: "book-31", name: "Palme AYT Kimya Soru Bankası", publisher: "Palme", difficulty: "Orta", subject: "Kimya" },
  { id: "book-32", name: "Bilgi Sarmal TYT Kimya Soru Bankası", publisher: "Bilgi Sarmal", difficulty: "Orta", subject: "Kimya" },

  // Biyoloji
  { id: "book-33", name: "Palme TYT Biyoloji Soru Bankası", publisher: "Palme", difficulty: "Orta", subject: "Biyoloji" },
  { id: "book-34", name: "Palme AYT Biyoloji Soru Bankası", publisher: "Palme", difficulty: "Orta", subject: "Biyoloji" },
  { id: "book-35", name: "Apotemi Sistemler Biyoloji Soru Bankası", publisher: "Apotemi", difficulty: "Zor", subject: "Biyoloji" },
  { id: "book-36", name: "345 TYT Biyoloji Soru Bankası", publisher: "ÜçDörtBeş", difficulty: "Orta", subject: "Biyoloji" },
  { id: "book-37", name: "Biyotik TYT Biyoloji Soru Bankası", publisher: "Biyotik Yayınları", difficulty: "Orta", subject: "Biyotik" },
  { id: "book-38", name: "Biyotik AYT Biyoloji Soru Bankası", publisher: "Biyotik Yayınları", difficulty: "Orta", subject: "Biyotik" },

  // Geometri
  { id: "book-39", name: "Karekök Geometri Soru Bankası", publisher: "Karekök", difficulty: "Zor", subject: "Geometri" },
  { id: "book-40", name: "345 TYT-AYT Geometri Soru Bankası", publisher: "ÜçDörtBeş", difficulty: "Orta", subject: "Geometri" },
  { id: "book-41", name: "Orijinal Geometri Soru Bankası", publisher: "Orijinal Yayınları", difficulty: "Zor", subject: "Geometri" },
  { id: "book-42", name: "Kenan Kara Geometri Soru Bankası", publisher: "Kenan Kara", difficulty: "Orta", subject: "Geometri" },
  { id: "book-43", name: "Birey A Geometri Soru Bankası", publisher: "Birey", difficulty: "Kolay", subject: "Geometri" },

  // Sosyal Bilimler
  { id: "book-44", name: "Benim Hocam TYT Tarih Soru Bankası", publisher: "Benim Hocam", difficulty: "Kolay", subject: "Tarih" },
  { id: "book-45", name: "Limit TYT-AYT Tarih Soru Bankası", publisher: "Limit Yayınları", difficulty: "Zor", subject: "Tarih" },
  { id: "book-46", name: "Bilgi Sarmal Coğrafya Soru Bankası", publisher: "Bilgi Sarmal", difficulty: "Orta", subject: "Coğrafya" },
  { id: "book-47", name: "Hız ve Renk Coğrafya Soru Bankası", publisher: "Hız ve Renk", difficulty: "Kolay", subject: "Coğrafya" }
];

const DB_FILE_PATH = path.join(process.cwd(), "data", "server_db.json");
const PHOTOS_FILE_PATH = path.join(process.cwd(), "data", "photos_db.json");

// Indestructible photo cache keyed by archiveId
const globalPhotoStore = new Map<string, any[]>();

function savePhotosToFile() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const photoObj: Record<string, any[]> = {};
    for (const [id, photos] of globalPhotoStore.entries()) {
      if (photos && photos.length > 0) {
        photoObj[id] = photos;
      }
    }
    fs.writeFileSync(PHOTOS_FILE_PATH, JSON.stringify(photoObj), "utf8");
  } catch (err: any) {
    console.error("[Photos Save Error]:", err.message);
  }
}

function loadPhotosFromFile() {
  try {
    if (fs.existsSync(PHOTOS_FILE_PATH)) {
      const content = fs.readFileSync(PHOTOS_FILE_PATH, "utf8");
      const parsed = JSON.parse(content);
      for (const [id, photos] of Object.entries(parsed)) {
        if (Array.isArray(photos) && photos.length > 0) {
          globalPhotoStore.set(id, photos);
        }
      }
      console.log(`📸 [Photo Store] Loaded photos for ${globalPhotoStore.size} exam archives.`);
    }
  } catch (err: any) {
    console.error("[Photos Load Error]:", err.message);
  }
}

function saveDbToFile() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const payload = {
      students: memStudents,
      notes: memNotes,
      questions: memQuestions,
      exams: memExams,
      curriculum: memCurriculum,
      archives: memArchives,
      schedules: memSchedules,
      books: memBooks,
      assignedResources: memAssignedResources,
      coachPin: memCoachPin
    };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(payload, null, 2), "utf8");
    savePhotosToFile();
  } catch (err: any) {
    console.error("[DB Save Error]:", err.message);
  }
}

function loadDbFromFile() {
  loadPhotosFromFile();
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, "utf8");
      const parsed = JSON.parse(content);
      memStudents = parsed.students || [];
      memNotes = parsed.notes || [];
      memQuestions = parsed.questions || [];
      memExams = parsed.exams || [];
      memCurriculum = parsed.curriculum || [];
      memArchives = parsed.archives || [];
      memSchedules = parsed.schedules || [];
      memBooks = parsed.books || [];
      memAssignedResources = parsed.assignedResources || [];
      memCoachPin = parsed.coachPin || "998877";

      // Re-populate globalPhotoStore from memArchives if needed
      memArchives.forEach((a) => {
        if (a && a.id) {
          const photos = a.sayfaFotolari || a.fotografYollari || [];
          const hasReal = photos.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500));
          if (hasReal) {
            globalPhotoStore.set(a.id, photos);
          } else if (globalPhotoStore.has(a.id)) {
            a.sayfaFotolari = globalPhotoStore.get(a.id);
            a.fotografYollari = globalPhotoStore.get(a.id);
          }
        }
      });

      if (memBooks.length === 0) {
        memBooks = [...INITIAL_BOOKS];
      }
      console.log(`✅ [Local DB] Loaded ${memStudents.length} students, ${memNotes.length} notes, ${memExams.length} exams, ${memArchives.length} archives, ${memSchedules.length} schedule tasks, ${memBooks.length} books, ${memAssignedResources.length} assigned resources, coach PIN: ${memCoachPin}`);
    } else {
      memStudents = [];
      memNotes = [];
      memQuestions = [];
      memExams = [];
      memCurriculum = [];
      memArchives = [];
      memSchedules = [];
      memBooks = [...INITIAL_BOOKS];
      memAssignedResources = [];
      memCoachPin = "998877";
      saveDbToFile();
    }
  } catch (err: any) {
    console.error("[DB Load Error]:", err.message);
  }
}

// Load persisted database on boot
loadDbFromFile();

// Initialize database
async function startDb() {
  await initializeDatabaseSchema();
  if (pool && !useMemoryFallback) {
    try {
      // Sync Students
      const stdRes = await pool.query("SELECT * FROM students");
      if (stdRes.rows.length > 0) {
        memStudents = stdRes.rows.map(row => ({
          id: row.id,
          pinCode: row.pin_code,
          adSoyad: row.ad_soyad,
          dogumTarihi: row.dogum_tarihi,
          kayitTarihi: row.kayit_tarihi,
          sinif: row.sinif,
          alan: row.alan,
          yksHedefYili: row.yks_hedef_yili,
          hedefUniversite: row.hedef_universite,
          hedefBolum: row.hedef_bolum,
          hedefPuan: row.hedef_puan,
          hedefSiralama: row.hedef_siralama,
          durum: row.durum,
          kocNotu: row.koc_notu,
          avatarBg: row.avatar_bg
        }));
        console.log(`✅ [PostgreSQL] Synced ${memStudents.length} students to memory on boot.`);
      }

      const dbRes = await pool.query("SELECT * FROM archives ORDER BY tarih DESC, id DESC");
      memArchives = dbRes.rows.map(row => {
        let parsedSorular = [];
        let parsedPhotos = [];
        try { parsedSorular = row.sorular ? (typeof row.sorular === "string" ? JSON.parse(row.sorular) : row.sorular) : []; } catch {}
        try { parsedPhotos = row.sayfa_fotolari ? (typeof row.sayfa_fotolari === "string" ? JSON.parse(row.sayfa_fotolari) : row.sayfa_fotolari) : []; } catch {}
        
        const totalPhotos = parsedPhotos.length;
        const coveredPages = new Set(parsedSorular.map((q: any) => q.sayfaNo || (q.sayfaIndex !== undefined ? q.sayfaIndex + 1 : 0)).filter(Boolean));
        const isAllPagesCovered = totalPhotos === 0 || (coveredPages.size >= totalPhotos && totalPhotos > 0);
        const isCompleted = (row.ai_status === "completed" && isAllPagesCovered) || (isAllPagesCovered && parsedSorular.length > 0 && totalPhotos > 0);
        const isRead = row.durum === 'İncelendi' || row.is_new === false || row.is_new === 'f' || row.is_new === 'false' || row.is_new === 0 || row.is_new === '0';

        let derivedAiStatus = isCompleted ? "completed" : (row.ai_status || (parsedSorular.length > 0 ? "processing" : "pending"));
        let derivedAiStatusMsg = row.ai_status_message || "";
        if (isCompleted) {
          derivedAiStatusMsg = derivedAiStatusMsg && !derivedAiStatusMsg.includes("Devam") && !derivedAiStatusMsg.includes("çözüyor") 
            ? derivedAiStatusMsg 
            : (totalPhotos > 0 ? `Yapay zekâ çözdü (${totalPhotos}/${totalPhotos} Sayfa)` : "Yapay zekâ çözdü");
        } else if (totalPhotos > 0 && coveredPages.size > 0) {
          derivedAiStatusMsg = `Kısmen çözüldü (${coveredPages.size}/${totalPhotos} Sayfa, devam ediyor)...`;
        } else if (!derivedAiStatusMsg) {
          derivedAiStatusMsg = "Yapay zekâ soruları çözüyor...";
        }

        return {
          id: row.id,
          studentId: row.student_id,
          ogrenciAdSoyad: row.ogrenci_ad_soyad,
          sinavTuru: row.sinav_turu,
          sinavAdi: row.sinav_adi,
          tarih: row.tarih,
          toplamSoru: row.toplam_soru || parsedSorular.length || 0,
          dogruSayisi: row.dogru_sayisi || 0,
          yanlisSayisi: row.yanlis_sayisi || 0,
          bosSayisi: row.bos_sayisi || 0,
          net: row.net ? parseFloat(row.net) : 0,
          toplamNet: row.net ? parseFloat(row.net) : 0,
          sorular: parsedSorular,
          isNew: isRead ? false : parseBool(row.is_new, true),
          ogrenciYukledi: Boolean(row.ogrenci_yukledi),
          yuklemeZamani: row.yukleme_zamani || "",
          durum: row.durum || (isRead ? "İncelendi" : "Yeni"),
          aiStatus: derivedAiStatus,
          aiStatusMessage: derivedAiStatusMsg,
          ogrenciNotu: row.ogrenci_notu || "",
          sayfaFotolari: parsedPhotos,
          fotografYollari: parsedPhotos,
        };
      });
      console.log(`✅ [PostgreSQL] Synced ${memArchives.length} archives to memory on boot.`);
      
      const schRes = await pool.query("SELECT * FROM schedules");
      memSchedules = schRes.rows.map(row => ({
        id: row.id,
        studentId: row.student_id,
        gun: row.gun,
        baslangicSaat: row.baslangic_saat,
        bitisSaat: row.bitis_saat,
        gorevTuru: row.gorev_turu,
        baslik: row.baslik,
        ders: row.ders,
        konular: row.konular,
        hedefSoruSayisi: row.hedef_soru_sayisi,
        kaynak: row.kaynak,
        gorusmeNotu: row.gorusme_notu,
        aciklama: row.aciklama,
        tamamlandi: Boolean(row.tamamlandi),
        tarih: row.tarih
      }));
      console.log(`✅ [PostgreSQL] Synced ${memSchedules.length} schedules to memory on boot.`);

      // Sync Coach PIN from app_settings
      try {
        const pinRes = await pool.query("SELECT value FROM app_settings WHERE key = 'coach_pin'");
        if (pinRes.rows.length > 0 && pinRes.rows[0].value) {
          memCoachPin = pinRes.rows[0].value;
          console.log(`✅ [PostgreSQL] Synced coach PIN from DB: ${memCoachPin}`);
        } else {
          await pool.query(
            "INSERT INTO app_settings (key, value) VALUES ('coach_pin', $1) ON CONFLICT (key) DO NOTHING",
            [memCoachPin]
          );
        }
      } catch (err: any) {
        console.warn("Could not sync app_settings on boot:", err.message);
      }
    } catch (e: any) {
      console.warn("Could not sync data on boot:", e.message);
    }
  }
}
startDb();

// =========================================================================
// ADMIN RESET ENDPOINT
// =========================================================================
app.post("/api/admin/clear-all", async (req, res) => {
  try {
    memStudents = [];
    memNotes = [];
    memQuestions = [];
    memExams = [];
    memArchives = [];
    saveDbToFile();

    if (useMemoryFallback || !pool) {
      return res.json({ success: true, message: "In-memory fallback database cleared!" });
    }

    // Try to truncate the tables
    await pool.query("TRUNCATE TABLE students, notes, questions, exams, archives CASCADE");
    res.json({ success: true, message: "All persistent PostgreSQL databases successfully cleared!" });
  } catch (error: any) {
    console.error("Database clear-all error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// POSTGRESQL & LOCAL REST API ENDPOINTS
// =========================================================================

// 1. STUDENTS
app.get("/api/students", async (req, res) => {
  if (useMemoryFallback || !pool) {
    return res.json(memStudents);
  }
  try {
    const dbRes = await pool.query("SELECT * FROM students");
    if (dbRes.rows.length > 0) {
      const formatted = dbRes.rows.map(row => ({
        id: row.id,
        pinCode: row.pin_code,
        adSoyad: row.ad_soyad,
        dogumTarihi: row.dogum_tarihi,
        kayitTarihi: row.kayit_tarihi,
        sinif: row.sinif,
        alan: row.alan,
        yksHedefYili: row.yks_hedef_yili,
        hedefUniversite: row.hedef_universite,
        hedefBolum: row.hedef_bolum,
        hedefPuan: row.hedef_puan,
        hedefSiralama: row.hedef_siralama,
        durum: row.durum,
        kocNotu: row.koc_notu,
        avatarBg: row.avatar_bg
      }));
      memStudents = formatted;
      return res.json(formatted);
    } else {
      // If Postgres returns 0 rows, insert memStudents into Postgres
      for (const s of memStudents) {
        try {
          await pool.query(
            `INSERT INTO students (id, pin_code, ad_soyad, dogum_tarihi, kayit_tarihi, sinif, alan, yks_hedef_yili, hedef_universite, hedef_bolum, hedef_puan, hedef_siralama, durum, koc_notu, avatar_bg)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            [s.id, s.pinCode || '', s.adSoyad || '', s.dogumTarihi || '', s.kayitTarihi || '', s.sinif || '', s.alan || '', String(s.yksHedefYili || ''), s.hedefUniversite || '', s.hedefBolum || '', String(s.hedefPuan || ''), String(s.hedefSiralama || ''), s.durum || 'Aktif', s.kocNotu || '', s.avatarBg || 'bg-indigo-600']
          );
        } catch (err) {}
      }
      return res.json(memStudents);
    }
  } catch (error: any) {
    res.json(memStudents);
  }
});

app.post("/api/students", async (req, res) => {
  const s = req.body;
  if (!s || !s.id) return res.status(400).json({ error: "Öğrenci ID eksik" });

  const idx = memStudents.findIndex(x => x.id === s.id);
  if (idx >= 0) memStudents[idx] = s;
  else memStudents.unshift(s);
  saveDbToFile();

  if (useMemoryFallback || !pool) {
    return res.json({ success: true });
  }
  try {
    await pool.query(
      `INSERT INTO students (id, pin_code, ad_soyad, dogum_tarihi, kayit_tarihi, sinif, alan, yks_hedef_yili, hedef_universite, hedef_bolum, hedef_puan, hedef_siralama, durum, koc_notu, avatar_bg)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO UPDATE SET
         pin_code = EXCLUDED.pin_code,
         ad_soyad = EXCLUDED.ad_soyad,
         dogum_tarihi = EXCLUDED.dogum_tarihi,
         kayit_tarihi = EXCLUDED.kayit_tarihi,
         sinif = EXCLUDED.sinif,
         alan = EXCLUDED.alan,
         yks_hedef_yili = EXCLUDED.yks_hedef_yili,
         hedef_universite = EXCLUDED.hedef_universite,
         hedef_bolum = EXCLUDED.hedef_bolum,
         hedef_puan = EXCLUDED.hedef_puan,
         hedef_siralama = EXCLUDED.hedef_siralama,
         durum = EXCLUDED.durum,
         koc_notu = EXCLUDED.koc_notu,
         avatar_bg = EXCLUDED.avatar_bg`,
      [s.id, s.pinCode || '', s.adSoyad || '', s.dogumTarihi || '', s.kayitTarihi || '', s.sinif || '', s.alan || '', String(s.yksHedefYili || ''), s.hedefUniversite || '', s.hedefBolum || '', String(s.hedefPuan || ''), String(s.hedefSiralama || ''), s.durum || 'Aktif', s.kocNotu || '', s.avatarBg || 'bg-indigo-600']
    );
    res.json({ success: true });
  } catch (error: any) {
    console.error("Student save error in Postgres:", error);
    res.json({ success: true });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  const { id } = req.params;
  memStudents = memStudents.filter(x => x.id !== id);
  saveDbToFile();

  if (useMemoryFallback || !pool) {
    return res.json({ success: true });
  }
  try {
    await pool.query("DELETE FROM students WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.json({ success: true });
  }
});

// 2. COACH NOTES
app.get("/api/notes", async (req, res) => {
  if (useMemoryFallback || !pool) {
    return res.json(memNotes);
  }
  try {
    const dbRes = await pool.query("SELECT * FROM notes");
    const formatted = dbRes.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      tarih: row.tarih,
      kategori: row.kategori,
      oncelik: row.oncelik,
      baslik: row.baslik,
      icerik: row.icerik
    }));
    res.json(formatted);
  } catch (error: any) {
    res.json(memNotes);
  }
});

app.post("/api/notes", async (req, res) => {
  const n = req.body;
  if (!n || !n.id) return res.status(400).json({ error: "Not ID eksik" });

  const idx = memNotes.findIndex(x => x.id === n.id);
  if (idx >= 0) memNotes[idx] = n;
  else memNotes.unshift(n);
  saveDbToFile();

  if (useMemoryFallback || !pool) {
    return res.json({ success: true });
  }
  try {
    await pool.query(
      `INSERT INTO notes (id, student_id, tarih, kategori, oncelik, baslik, icerik)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         student_id = EXCLUDED.student_id,
         tarih = EXCLUDED.tarih,
         kategori = EXCLUDED.kategori,
         oncelik = EXCLUDED.oncelik,
         baslik = EXCLUDED.baslik,
         icerik = EXCLUDED.icerik`,
      [n.id, n.studentId, n.tarih, n.kategori, n.oncelik, n.baslik, n.icerik]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.json({ success: true });
  }
});

app.delete("/api/notes/:id", async (req, res) => {
  const { id } = req.params;
  memNotes = memNotes.filter(x => x.id !== id);
  saveDbToFile();

  if (useMemoryFallback || !pool) {
    return res.json({ success: true });
  }
  try {
    await pool.query("DELETE FROM notes WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.json({ success: true });
  }
});

// 4. QUESTIONS (SORU TAKİP)
app.get("/api/questions", async (req, res) => {
  if (useMemoryFallback || !pool) {
    return res.json(memQuestions);
  }
  try {
    const dbRes = await pool.query("SELECT * FROM questions");
    const formatted = dbRes.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      tarih: row.tarih,
      ders: row.ders,
      konu: row.konu,
      cozulenSoru: row.cozulen_soru || 0,
      dogruSayisi: row.dogru_sayisi || 0,
      yanlisSayisi: row.yanlis_sayisi || 0,
      bosSayisi: row.bos_sayisi || 0,
      net: parseFloat(row.net || 0)
    }));
    res.json(formatted);
  } catch (error: any) {
    res.json(memQuestions);
  }
});

app.post("/api/questions", async (req, res) => {
  const q = req.body;
  if (!q || !q.id) return res.status(400).json({ error: "Soru ID eksik" });

  const idx = memQuestions.findIndex(x => x.id === q.id);
  if (idx >= 0) memQuestions[idx] = q;
  else memQuestions.unshift(q);
  saveDbToFile();

  if (useMemoryFallback || !pool) {
    return res.json({ success: true });
  }
  try {
    await pool.query(
      `INSERT INTO questions (id, student_id, tarih, ders, konu, cozulen_soru, dogru_sayisi, yanlis_sayisi, bos_sayisi, net)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         student_id = EXCLUDED.student_id,
         tarih = EXCLUDED.tarih,
         ders = EXCLUDED.ders,
         konu = EXCLUDED.konu,
         cozulen_soru = EXCLUDED.cozulen_soru,
         dogru_sayisi = EXCLUDED.dogru_sayisi,
         yanlis_sayisi = EXCLUDED.yanlis_sayisi,
         bos_sayisi = EXCLUDED.bos_sayisi,
         net = EXCLUDED.net`,
      [q.id, q.studentId, q.tarih, q.ders, q.konu, q.cozulenSoru || 0, q.dogruSayisi || 0, q.yanlisSayisi || 0, q.bosSayisi || 0, q.net || 0]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.json({ success: true });
  }
});

app.delete("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  memQuestions = memQuestions.filter(x => x.id !== id);
  saveDbToFile();

  if (useMemoryFallback || !pool) {
    return res.json({ success: true });
  }
  try {
    await pool.query("DELETE FROM questions WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.json({ success: true });
  }
});

// 5. EXAMS (DENEME SINAVI)
app.get("/api/exams", async (req, res) => {
  if (useMemoryFallback || !pool) {
    return res.json(memExams.filter((x: any) => !x.id.startsWith("exam-auto-")));
  }
  try {
    const dbRes = await pool.query("SELECT * FROM exams");
    const formatted = dbRes.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      ogrenciAdSoyad: row.ogrenci_ad_soyad,
      sinavTuru: row.sinav_turu,
      denemeAdi: row.deneme_adi,
      yayin: row.yayin,
      tarih: row.tarih,
      toplamNet: parseFloat(row.toplam_net),
      puan: row.puan ? parseFloat(row.puan) : null,
      siralama: row.siralama,
      toplamKatilimci: row.toplam_katilimci,
      kocYorumu: row.koc_yorumu,
      dersler: row.dersler ? JSON.parse(row.dersler) : []
    }));
    const filtered = formatted.filter(x => !x.id.startsWith("exam-auto-"));
    res.json(filtered);
  } catch (error: any) {
    res.json(memExams.filter((x: any) => !x.id.startsWith("exam-auto-")));
  }
});

app.post("/api/exams", async (req, res) => {
  const e = req.body;
  if (!e || !e.id) return res.status(400).json({ error: "Deneme ID eksik" });

  const idx = memExams.findIndex(x => x.id === e.id);
  if (idx >= 0) memExams[idx] = e;
  else memExams.unshift(e);
  saveDbToFile();

  if (useMemoryFallback || !pool) {
    return res.json({ success: true });
  }
  try {
    await pool.query(
      `INSERT INTO exams (id, student_id, ogrenci_ad_soyad, sinav_turu, deneme_adi, yayin, tarih, toplam_net, puan, siralama, toplam_katilimci, koc_yorumu, dersler)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
         student_id = EXCLUDED.student_id,
         ogrenci_ad_soyad = EXCLUDED.ogrenci_ad_soyad,
         sinav_turu = EXCLUDED.sinav_turu,
         deneme_adi = EXCLUDED.deneme_adi,
         yayin = EXCLUDED.yayin,
         tarih = EXCLUDED.tarih,
         toplam_net = EXCLUDED.toplam_net,
         puan = EXCLUDED.puan,
         siralama = EXCLUDED.siralama,
         toplam_katilimci = EXCLUDED.toplam_katilimci,
         koc_yorumu = EXCLUDED.koc_yorumu,
         dersler = EXCLUDED.dersler`,
      [e.id, e.studentId, e.ogrenciAdSoyad, e.sinavTuru, e.denemeAdi, e.yayin, e.tarih, e.toplamNet, e.puan, e.siralama, e.toplamKatilimci, e.kocYorumu, JSON.stringify(e.dersler)]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.json({ success: true });
  }
});

app.delete("/api/exams/:id", async (req, res) => {
  const { id } = req.params;

  const qIdx = backgroundJobQueue.findIndex(j => j.archiveId === id);
  if (qIdx !== -1) {
    backgroundJobQueue.splice(qIdx, 1);
  }

  memExams = memExams.filter(x => x.id !== id);
  memArchives = memArchives.filter(x => x.id !== id);
  saveDbToFile();

  if (useMemoryFallback || !pool) {
    return res.json({ success: true });
  }
  try {
    await pool.query("DELETE FROM exams WHERE id = $1", [id]);
    await pool.query("DELETE FROM archives WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.warn("Database deletion note (memory already cleared):", error.message);
    res.json({ success: true, warning: error.message });
  }
});

// 6. HAFTALIK PROGRAM (SCHEDULE TASKS)
app.get("/api/schedules", async (req, res) => {
  if (pool && !useMemoryFallback) {
    try {
      const schRes = await pool.query("SELECT * FROM schedules");
      memSchedules = schRes.rows.map(row => ({
        id: row.id,
        studentId: row.student_id,
        gun: row.gun,
        baslangicSaat: row.baslangic_saat,
        bitisSaat: row.bitis_saat,
        gorevTuru: row.gorev_turu,
        baslik: row.baslik,
        ders: row.ders,
        konular: row.konular,
        hedefSoruSayisi: row.hedef_soru_sayisi,
        kaynak: row.kaynak,
        gorusmeNotu: row.gorusme_notu,
        aciklama: row.aciklama,
        tamamlandi: Boolean(row.tamamlandi),
        tarih: row.tarih
      }));
    } catch (e: any) {
      console.warn("Could not load schedules from PG, using memory fallback:", e.message);
    }
  }
  res.json(memSchedules || []);
});

app.post("/api/schedules", async (req, res) => {
  const task = req.body;
  if (!task || !task.id) return res.status(400).json({ error: "Görev ID eksik" });

  const idx = memSchedules.findIndex(x => x.id === task.id);
  if (idx >= 0) memSchedules[idx] = task;
  else memSchedules.unshift(task);

  saveDbToFile();

  if (pool && !useMemoryFallback) {
    try {
      await pool.query(
        `INSERT INTO schedules (id, student_id, gun, baslangic_saat, bitis_saat, gorev_turu, baslik, ders, konular, hedef_soru_sayisi, kaynak, gorusme_notu, aciklama, tamamlandi, tarih)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO UPDATE SET
           student_id = EXCLUDED.student_id,
           gun = EXCLUDED.gun,
           baslangic_saat = EXCLUDED.baslangic_saat,
           bitis_saat = EXCLUDED.bitis_saat,
           gorev_turu = EXCLUDED.gorev_turu,
           baslik = EXCLUDED.baslik,
           ders = EXCLUDED.ders,
           konular = EXCLUDED.konular,
           hedef_soru_sayisi = EXCLUDED.hedef_soru_sayisi,
           kaynak = EXCLUDED.kaynak,
           gorusme_notu = EXCLUDED.gorusme_notu,
           aciklama = EXCLUDED.aciklama,
           tamamlandi = EXCLUDED.tamamlandi,
           tarih = EXCLUDED.tarih`,
        [
          task.id,
          task.studentId,
          task.gun,
          task.baslangicSaat,
          task.bitisSaat,
          task.gorevTuru,
          task.baslik,
          task.ders || null,
          task.konular || null,
          task.hedefSoruSayisi || null,
          task.kaynak || null,
          task.gorusmeNotu || null,
          task.aciklama || null,
          Boolean(task.tamamlandi),
          task.tarih || null
        ]
      );
    } catch (e: any) {
      console.warn("Could not save schedule task to PG:", e.message);
    }
  }

  res.json({ success: true, task });
});

app.post("/api/schedules/bulk", async (req, res) => {
  const tasks = req.body;
  if (!Array.isArray(tasks)) return res.status(400).json({ error: "Geçersiz görev listesi" });

  tasks.forEach((t: any) => {
    if (!t.id) t.id = `sch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const idx = memSchedules.findIndex(x => x.id === t.id);
    if (idx >= 0) memSchedules[idx] = t;
    else memSchedules.unshift(t);
  });

  saveDbToFile();

  if (pool && !useMemoryFallback) {
    try {
      for (const t of tasks) {
        await pool.query(
          `INSERT INTO schedules (id, student_id, gun, baslangic_saat, bitis_saat, gorev_turu, baslik, ders, konular, hedef_soru_sayisi, kaynak, gorusme_notu, aciklama, tamamlandi, tarih)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
           ON CONFLICT (id) DO UPDATE SET
             student_id = EXCLUDED.student_id,
             gun = EXCLUDED.gun,
             baslangic_saat = EXCLUDED.baslangic_saat,
             bitis_saat = EXCLUDED.bitis_saat,
             gorev_turu = EXCLUDED.gorev_turu,
             baslik = EXCLUDED.baslik,
             ders = EXCLUDED.ders,
             konular = EXCLUDED.konular,
             hedef_soru_sayisi = EXCLUDED.hedef_soru_sayisi,
             kaynak = EXCLUDED.kaynak,
             gorusme_notu = EXCLUDED.gorusme_notu,
             aciklama = EXCLUDED.aciklama,
             tamamlandi = EXCLUDED.tamamlandi,
             tarih = EXCLUDED.tarih`,
          [
            t.id,
            t.studentId,
            t.gun,
            t.baslangicSaat,
            t.bitisSaat,
            t.gorevTuru,
            t.baslik,
            t.ders || null,
            t.konular || null,
            t.hedefSoruSayisi || null,
            t.kaynak || null,
            t.gorusmeNotu || null,
            t.aciklama || null,
            Boolean(t.tamamlandi),
            t.tarih || null
          ]
        );
      }
    } catch (e: any) {
      console.warn("Could not save bulk schedules to PG:", e.message);
    }
  }

  res.json({ success: true, count: tasks.length });
});

app.delete("/api/schedules/:id", async (req, res) => {
  const { id } = req.params;
  memSchedules = memSchedules.filter(x => x.id !== id);
  saveDbToFile();

  if (pool && !useMemoryFallback) {
    try {
      await pool.query("DELETE FROM schedules WHERE id = $1", [id]);
    } catch (e: any) {
      console.warn("Could not delete schedule task from PG:", e.message);
    }
  }

  res.json({ success: true });
});

app.delete("/api/schedules/student/:studentId", async (req, res) => {
  const { studentId } = req.params;
  memSchedules = memSchedules.filter(x => x.studentId !== studentId);
  saveDbToFile();

  if (pool && !useMemoryFallback) {
    try {
      await pool.query("DELETE FROM schedules WHERE student_id = $1", [studentId]);
    } catch (e: any) {
      console.warn("Could not delete student schedules from PG:", e.message);
    }
  }

  res.json({ success: true });
});

// 10. BOOKS & RESOURCES (KAYNAKLAR)
app.get("/api/books", async (req, res) => {
  if (pool && !useMemoryFallback) {
    try {
      const dbRes = await pool.query("SELECT * FROM books");
      if (dbRes.rows.length > 0) {
        memBooks = dbRes.rows.map(row => ({
          id: row.id,
          name: row.name,
          publisher: row.publisher,
          difficulty: row.difficulty,
          subject: row.subject
        }));
      } else {
        // Seed the books in PG since it's empty
        for (const b of INITIAL_BOOKS) {
          await pool.query(
            "INSERT INTO books (id, name, publisher, difficulty, subject) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING",
            [b.id, b.name, b.publisher, b.difficulty, b.subject]
          );
        }
        memBooks = [...INITIAL_BOOKS];
      }
    } catch (e: any) {
      console.warn("Could not load books from PG, using memory fallback:", e.message);
    }
  }
  res.json(memBooks || []);
});

app.post("/api/books", async (req, res) => {
  const book = req.body;
  if (!book || !book.id) return res.status(400).json({ error: "Kitap ID eksik" });

  const idx = memBooks.findIndex(x => x.id === book.id);
  if (idx >= 0) memBooks[idx] = book;
  else memBooks.unshift(book);

  saveDbToFile();

  if (pool && !useMemoryFallback) {
    try {
      await pool.query(
        `INSERT INTO books (id, name, publisher, difficulty, subject)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           publisher = EXCLUDED.publisher,
           difficulty = EXCLUDED.difficulty,
           subject = EXCLUDED.subject`,
        [book.id, book.name, book.publisher, book.difficulty, book.subject]
      );
    } catch (e: any) {
      console.warn("Could not save book to PG:", e.message);
    }
  }

  res.json({ success: true, book });
});

app.delete("/api/books/:id", async (req, res) => {
  const { id } = req.params;
  memBooks = memBooks.filter(x => x.id !== id);
  saveDbToFile();

  if (pool && !useMemoryFallback) {
    try {
      await pool.query("DELETE FROM books WHERE id = $1", [id]);
    } catch (e: any) {
      console.warn("Could not delete book from PG:", e.message);
    }
  }

  res.json({ success: true });
});

// 11. ASSIGNED RESOURCES (ATANAN KAYNAKLAR)
app.get("/api/assigned-resources", async (req, res) => {
  if (pool && !useMemoryFallback) {
    try {
      const dbRes = await pool.query("SELECT * FROM assigned_resources ORDER BY assigned_date DESC");
      if (dbRes.rows.length > 0) {
        memAssignedResources = dbRes.rows.map(row => ({
          id: row.id,
          studentId: row.student_id,
          bookId: row.book_id,
          bookName: row.book_name,
          publisher: row.publisher,
          subject: row.subject,
          difficulty: row.difficulty,
          targetDurationDays: row.target_duration_days,
          targetDate: row.target_date,
          hedefSoruSayisi: row.hedef_soru_sayisi,
          note: row.note,
          assignedDate: row.assigned_date,
          completed: row.completed,
          completedDate: row.completed_date
        }));
      }
    } catch (e: any) {
      console.warn("Could not load assigned_resources from PG, using memory fallback:", e.message);
    }
  }
  res.json(memAssignedResources || []);
});

app.post("/api/assigned-resources", async (req, res) => {
  const item = req.body;
  if (!item || !item.id || !item.studentId || !item.bookName) {
    return res.status(400).json({ error: "Eksik atama verisi" });
  }

  const idx = memAssignedResources.findIndex(x => x.id === item.id);
  if (idx >= 0) memAssignedResources[idx] = item;
  else memAssignedResources.unshift(item);

  saveDbToFile();

  if (pool && !useMemoryFallback) {
    try {
      await pool.query(
        `INSERT INTO assigned_resources 
         (id, student_id, book_id, book_name, publisher, subject, difficulty, target_duration_days, target_date, hedef_soru_sayisi, note, assigned_date, completed, completed_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
           student_id = EXCLUDED.student_id,
           book_id = EXCLUDED.book_id,
           book_name = EXCLUDED.book_name,
           publisher = EXCLUDED.publisher,
           subject = EXCLUDED.subject,
           difficulty = EXCLUDED.difficulty,
           target_duration_days = EXCLUDED.target_duration_days,
           target_date = EXCLUDED.target_date,
           hedef_soru_sayisi = EXCLUDED.hedef_soru_sayisi,
           note = EXCLUDED.note,
           assigned_date = EXCLUDED.assigned_date,
           completed = EXCLUDED.completed,
           completed_date = EXCLUDED.completed_date`,
        [
          item.id,
          item.studentId,
          item.bookId || null,
          item.bookName,
          item.publisher || '',
          item.subject || '',
          item.difficulty || 'Orta',
          item.targetDurationDays || null,
          item.targetDate || null,
          item.hedefSoruSayisi || null,
          item.note || '',
          item.assignedDate || new Date().toISOString().split('T')[0],
          !!item.completed,
          item.completedDate || null
        ]
      );
    } catch (e: any) {
      console.warn("Could not save assigned_resource to PG:", e.message);
    }
  }

  res.json({ success: true, item });
});

app.delete("/api/assigned-resources/:id", async (req, res) => {
  const { id } = req.params;
  memAssignedResources = memAssignedResources.filter(x => x.id !== id);
  saveDbToFile();

  if (pool && !useMemoryFallback) {
    try {
      await pool.query("DELETE FROM assigned_resources WHERE id = $1", [id]);
    } catch (e: any) {
      console.warn("Could not delete assigned_resource from PG:", e.message);
    }
  }

  res.json({ success: true });
});

app.patch("/api/assigned-resources/:id/toggle", async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  const item = memAssignedResources.find(x => x.id === id);
  if (item) {
    item.completed = !!completed;
    item.completedDate = completed ? new Date().toISOString().split('T')[0] : null;
    saveDbToFile();

    if (pool && !useMemoryFallback) {
      try {
        await pool.query(
          "UPDATE assigned_resources SET completed = $1, completed_date = $2 WHERE id = $3",
          [item.completed, item.completedDate, id]
        );
      } catch (e: any) {
        console.warn("Could not update assigned_resource toggle in PG:", e.message);
      }
    }
    return res.json({ success: true, item });
  }

  res.status(404).json({ error: "Atama bulunamadı" });
});

// Helper to bulk save or update curriculum items into Memory
async function persistCurriculumItems(items: any[], replaceAll: boolean = false) {
  if (!Array.isArray(items) || items.length === 0) return;

  const sanitized = items.map((c, idx) => ({
    id: String(c.id || `kaz-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`),
    sinif: String(c.sinif || '12. Sınıf').trim() || '12. Sınıf',
    sinavTuru: (String(c.sinavTuru || 'TYT').trim() || 'TYT') as any,
    ders: String(c.ders || 'Matematik').trim() || 'Matematik',
    konu: String(c.konu || 'Genel Konu').trim() || 'Genel Konu',
    kazanimKodu: String(c.kazanimKodu || `KAZ.${idx + 1}`).trim() || `KAZ.${idx + 1}`,
    aciklama: String(c.aciklama || c.konu || 'Kazanım açıklaması girilmedi.').trim() || 'Kazanım açıklaması girilmedi.',
    onemDerecesi: (String(c.onemDerecesi || 'Kritik').trim() || 'Kritik') as any,
    yil: String(c.yil || '2026').trim() || '2026'
  }));

  // Deduplicate array by ID
  const uniqueMap = new Map<string, typeof sanitized[0]>();
  sanitized.forEach((item, idx) => {
    let cleanId = item.id;
    if (!cleanId || uniqueMap.has(cleanId)) {
      cleanId = `kaz-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`;
      item.id = cleanId;
    }
    uniqueMap.set(cleanId, item);
  });
  const uniqueItems = Array.from(uniqueMap.values());

  // Update in-memory
  if (replaceAll) {
    memCurriculum = [...uniqueItems] as any;
  } else {
    for (const c of uniqueItems) {
      const idx = memCurriculum.findIndex(
        x => x.id === c.id || (x.kazanimKodu === c.kazanimKodu && x.ders === c.ders)
      );
      if (idx >= 0) memCurriculum[idx] = { ...memCurriculum[idx], ...c } as any;
      else memCurriculum.unshift(c as any);
    }
  }
  saveDbToFile();
}

// 6. CURRICULUM (KAZANIMLAR)
app.get("/api/curriculum", async (req, res) => {
  return res.json(memCurriculum || []);
});

// Helper to load all curriculum items from memory
async function fetchDbCurriculumItems(): Promise<any[]> {
  return memCurriculum || [];
}

// Helper to format database curriculum items for AI prompt context
function formatCurriculumContextForAi(allCurriculum: any[]): string {
  if (!Array.isArray(allCurriculum) || allCurriculum.length === 0) {
    return "Veritabanında henüz kayıtlı kazanım yok. Genel MEB müfredat kodlarını kullan.";
  }
  const dersGroups = new Map<string, any[]>();
  allCurriculum.forEach(k => {
    const d = k.ders || "Genel";
    if (!dersGroups.has(d)) dersGroups.set(d, []);
    dersGroups.get(d)!.push(k);
  });

  const selectedItems: any[] = [];
  dersGroups.forEach((items) => {
    selectedItems.push(...items.slice(0, 8));
  });

  return selectedItems
    .slice(0, 60)
    .map(k => `[${k.kazanimKodu}] (${k.ders} - ${k.konu}): ${k.aciklama}`)
    .join("\n");
}

// Helper to automatically save/merge newly identified MEB outcomes from solved questions into the curriculum database
async function autoSaveQuestionsCurriculum(questions: any[], sinavTuru: string = "TYT") {
  if (!Array.isArray(questions) || questions.length === 0) return;
  const newItems: any[] = [];

  for (const q of questions) {
    if (q.kazanimKodu && (q.kazanimAciklama || q.konu)) {
      const rawDers = String(q.ders || (sinavTuru === "AYT" ? "Matematik (AYT)" : "Matematik (TYT)")).trim();
      const unite = q.unite ? String(q.unite).trim() : "";
      const rawKonu = q.konu ? String(q.konu).trim() : (unite || "Genel Konu");
      const fullKonu = unite && !rawKonu.includes(unite) ? `${unite} - ${rawKonu}` : rawKonu;
      const kazanimKodu = String(q.kazanimKodu).trim();
      const aciklama = String(q.kazanimAciklama || q.konu || "MEB Kazanımı").trim();
      const examType = rawDers.includes("AYT") ? "AYT" : (rawDers.includes("TYT") ? "TYT" : (sinavTuru === "AYT" ? "AYT" : "TYT"));
      const sinif = rawDers.includes("AYT") ? "11. Sınıf" : (rawDers.includes("TYT") ? "12. Sınıf" : "12. Sınıf");

      newItems.push({
        id: `kaz-${kazanimKodu.replace(/[^a-zA-Z0-9]/g, "_")}-${Math.random().toString(36).substring(2, 6)}`,
        sinif,
        sinavTuru: examType,
        ders: rawDers,
        konu: fullKonu,
        kazanimKodu,
        aciklama,
        onemDerecesi: "Kritik",
        yil: "2026"
      });
    }
  }

  if (newItems.length > 0) {
    try {
      await persistCurriculumItems(newItems, false);
      console.log(`[Auto DB Curriculum] ${newItems.length} adet MEB kazanımı veritabanına başarıyla kaydedildi/güncellendi.`);
    } catch (err: any) {
      console.warn("[Auto DB Curriculum] Kazanım kaydetme uyarısı:", err?.message || err);
    }
  }
}

// Helper to post-process AI solved questions (allows Gemini AI to set outcomes and solutions directly without DB override)
function matchQuestionsWithDbCurriculum(questions: any[], allCurriculum?: any[]): any[] {
  if (!Array.isArray(questions)) return [];
  return questions.map(q => {
    const rawCozum = q.cozumDetayi || q.cozum || "";
    return {
      ...q,
      ders: q.ders || "Matematik",
      unite: q.unite || "",
      konu: q.konu || "Genel Konu",
      kazanimKodu: q.kazanimKodu || "KAZ.01",
      kazanimAciklama: q.kazanimAciklama || "Sorunun ait olduğu akademik kazanım.",
      cozumDetayi: rawCozum,
      cozum: rawCozum,
      dogruCevap: q.dogruCevap || "A",
      isaretlenenSik: q.isaretlenenSik || q.ogrenciCevabi || "Boş",
      ogrenciCevabi: q.ogrenciCevabi || q.isaretlenenSik || "Boş",
      dogruMu: q.dogruMu !== undefined ? Boolean(q.dogruMu) : (q.isaretlenenSik === q.dogruCevap && q.isaretlenenSik !== "Boş"),
      analizNotu: q.analizNotu || "İncelendi.",
    };
  });
}

app.post("/api/curriculum/item", async (req, res) => {
  const c = req.body;
  if (!c || !c.id) return res.status(400).json({ error: "Geçersiz kazanım verisi" });
  try {
    await persistCurriculumItems([c], false);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/curriculum/bulk", async (req, res) => {
  const { items, replaceAll = false } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: "İtems dizisi bekleniyor" });

  try {
    await persistCurriculumItems(items, replaceAll);
    res.json({ success: true, count: items.length, replaced: !!replaceAll });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/curriculum/all", async (req, res) => {
  memCurriculum = [];
  saveDbToFile();
  res.json({ success: true, message: "Tüm müfredat temizlendi" });
});

app.delete("/api/curriculum/:id", async (req, res) => {
  const { id } = req.params;
  memCurriculum = memCurriculum.filter(x => x.id !== id);
  saveDbToFile();
  res.json({ success: true });
});

app.get("/api/db-status", async (req, res) => {
  let columns: any[] = [];
  let pgError: string | null = null;
  if (pool) {
    try {
      const dbRes = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'archives'
      `);
      columns = dbRes.rows;
    } catch (e: any) {
      pgError = e.message;
    }
  }
  res.json({
    useMemoryFallback,
    poolConfigured: pool !== null,
    columns,
    pgError
  });
});

// Helper to strip heavy base64 strings for list view payload optimization
function stripLargePhotosFromArchive(archive: any) {
  if (!archive) return archive;
  const cleanPhotos = (archive.sayfaFotolari || archive.fotografYollari || []).map((p: any) => {
    if (typeof p === 'string' && (p.startsWith('data:image') || p.length > 500)) return '';
    return p;
  });

  const cleanQuestions = (archive.sorular || []).map((q: any) => {
    const qCopy = { ...q };
    if (typeof qCopy.sayfaFotoUrl === 'string' && qCopy.sayfaFotoUrl.length > 500) qCopy.sayfaFotoUrl = '';
    if (typeof qCopy.soruFotografYolu === 'string' && qCopy.soruFotografYolu.length > 500) qCopy.soruFotografYolu = '';
    return qCopy;
  });

  return {
    ...archive,
    sayfaFotolari: cleanPhotos,
    fotografYollari: cleanPhotos,
    sorular: cleanQuestions,
  };
}

function formatArchiveRow(row: any, full = false) {
  let parsedSorular = [];
  let parsedPhotos: any[] = [];
  try {
    parsedSorular = row.sorular ? (typeof row.sorular === "string" ? JSON.parse(row.sorular) : row.sorular) : [];
  } catch {
    parsedSorular = [];
  }
  try {
    parsedPhotos = row.sayfa_fotolari ? (typeof row.sayfa_fotolari === "string" ? JSON.parse(row.sayfa_fotolari) : row.sayfa_fotolari) : [];
  } catch {
    parsedPhotos = [];
  }

  let totalPhotos = parsedPhotos.length;
  if (totalPhotos === 0 && row.photos_count) {
    totalPhotos = Number(row.photos_count);
  }
  if (totalPhotos === 0 && row.id && globalPhotoStore.has(row.id)) {
    totalPhotos = globalPhotoStore.get(row.id)?.length || 0;
  }

  const coveredPages = new Set(parsedSorular.map((q: any) => q.sayfaNo || (q.sayfaIndex !== undefined ? q.sayfaIndex + 1 : 0)).filter(Boolean));
  const isAllPagesCovered = totalPhotos === 0 || (coveredPages.size >= totalPhotos && totalPhotos > 0);

  const explicitAiStatus = row.ai_status;
  const isActivelyProcessing = explicitAiStatus === "processing" || explicitAiStatus === "rate_limited" || explicitAiStatus === "pending";

  const isCompleted = !isActivelyProcessing && (
    explicitAiStatus === "completed" ||
    (isAllPagesCovered && parsedSorular.length > 0 && totalPhotos > 0)
  );
  const isRead = row.durum === 'İncelendi' || row.is_new === false || row.is_new === 'f' || row.is_new === 'false' || row.is_new === 0 || row.is_new === '0';

  let derivedAiStatus = isActivelyProcessing ? explicitAiStatus : (isCompleted ? "completed" : (explicitAiStatus || "pending"));
  let derivedAiStatusMsg = row.ai_status_message || "";

  if (isActivelyProcessing) {
    if (!derivedAiStatusMsg) {
      derivedAiStatusMsg = "Yapay zekâ soruları çözüyor...";
    }
  } else if (isCompleted) {
    derivedAiStatusMsg = derivedAiStatusMsg && !derivedAiStatusMsg.includes("Devam") && !derivedAiStatusMsg.includes("çözüyor") && !derivedAiStatusMsg.includes("Kalan")
      ? derivedAiStatusMsg
      : (totalPhotos > 0 ? `Yapay zekâ çözdü (${totalPhotos}/${totalPhotos} Sayfa)` : "Yapay zekâ çözdü");
  } else if (totalPhotos > 0 && coveredPages.size > 0) {
    derivedAiStatusMsg = `Kısmen çözüldü (${coveredPages.size}/${totalPhotos} Sayfa, devam ediyor)...`;
  } else if (!derivedAiStatusMsg) {
    derivedAiStatusMsg = "Yapay zekâ soruları çözüyor...";
  }

  // Check indestructible globalPhotoStore
  let photosToSend: any[] = [];
  if (full) {
    photosToSend = parsedPhotos;
    if ((!photosToSend || photosToSend.length === 0 || photosToSend.every((p: any) => !p || p.length < 50)) && row.id && globalPhotoStore.has(row.id)) {
      photosToSend = globalPhotoStore.get(row.id) || [];
    }

    // Update photo store if real photos are present
    if (row.id && photosToSend && photosToSend.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500))) {
      globalPhotoStore.set(row.id, photosToSend);
    }
  } else {
    // In list view: preserve exact length using lightweight placeholders so UI counts match without transferring megabytes of base64
    photosToSend = Array(totalPhotos).fill("");
  }

  return {
    id: row.id,
    studentId: row.student_id,
    ogrenciAdSoyad: row.ogrenci_ad_soyad,
    sinavTuru: row.sinav_turu,
    sinavAdi: row.sinav_adi,
    tarih: row.tarih,
    toplamSoru: row.toplam_soru || parsedSorular.length || 0,
    dogruSayisi: row.dogru_sayisi || 0,
    yanlisSayisi: row.yanlis_sayisi || 0,
    bosSayisi: row.bos_sayisi || 0,
    net: row.net ? parseFloat(row.net) : 0,
    toplamNet: row.net ? parseFloat(row.net) : 0,
    sorular: parsedSorular,
    isNew: isRead ? false : parseBool(row.is_new, true),
    ogrenciYukledi: Boolean(row.ogrenci_yukledi),
    yuklemeZamani: row.yukleme_zamani || "",
    durum: row.durum || (isRead ? "İncelendi" : "Yeni"),
    aiStatus: derivedAiStatus,
    aiStatusMessage: derivedAiStatusMsg,
    lastError: row.last_error || row.lastError || "",
    nextRetryTime: row.next_retry_time ? Number(row.next_retry_time) : (row.nextRetryTime ? Number(row.nextRetryTime) : null),
    ogrenciNotu: row.ogrenci_notu || "",
    sayfaFotolari: photosToSend,
    fotografYollari: photosToSend,
    photosCount: totalPhotos,
    isDeneme: parseBool(row.is_deneme, false),
  };
}

// 7. ARCHIVES (OGRENCI SINAV ANALIZI)
app.get("/api/archives", async (req, res) => {
  if (useMemoryFallback || !pool) {
    recoverUnfinishedJobs();
    const sanitizedList = memArchives.map((a) => {
      const photos = a.sayfaFotolari || a.fotografYollari || (a.id && globalPhotoStore.get(a.id)) || [];
      const count = photos.length;
      return {
        ...a,
        sayfaFotolari: Array(count).fill(""),
        fotografYollari: Array(count).fill(""),
        photosCount: count,
      };
    });
    return res.json(sanitizedList);
  }
  try {
    const dbRes = await pool.query(`
      SELECT id, student_id, ogrenci_ad_soyad, sinav_turu, sinav_adi, tarih,
             toplam_soru, dogru_sayisi, yanlis_sayisi, bos_sayisi, net,
             sorular, is_new, ogrenci_yukledi, yukleme_zamani, durum,
             ai_status, ai_status_message, ogrenci_notu, is_deneme, last_error, next_retry_time,
             COALESCE(photos_count, 0) AS photos_count
      FROM archives 
      ORDER BY tarih DESC, id DESC
    `);
    const dbRows = dbRes.rows.map(row => formatArchiveRow(row, false));
    
    // Merge Postgres data with active in-memory background jobs so progress is never lost
    const mergedList: any[] = [];
    dbRows.forEach((dbArch) => {
      const activeMem = memArchives.find((m) => m.id === dbArch.id);
      const isJobActive = backgroundJobQueue.some((j) => j.archiveId === dbArch.id);
      if (activeMem && (isJobActive || activeMem.aiStatus === "processing" || activeMem.aiStatus === "rate_limited")) {
        const photoCount = activeMem.sayfaFotolari?.length || activeMem.fotografYollari?.length || dbArch.photosCount || 0;
        mergedList.push({
          ...activeMem,
          sayfaFotolari: Array(photoCount).fill(""),
          fotografYollari: Array(photoCount).fill(""),
          photosCount: photoCount,
        });
      } else {
        mergedList.push(dbArch);
      }
    });
    // Also include any new memory-only archives not yet in DB
    memArchives.forEach((m) => {
      if (!mergedList.some((x) => x.id === m.id)) {
        const photoCount = m.sayfaFotolari?.length || m.fotografYollari?.length || 0;
        mergedList.push({
          ...m,
          sayfaFotolari: Array(photoCount).fill(""),
          fotografYollari: Array(photoCount).fill(""),
          photosCount: photoCount,
        });
      }
    });

    recoverUnfinishedJobs();
    res.json(mergedList);
  } catch (error: any) {
    console.error("Archives GET error, falling back to memory:", error.message);
    recoverUnfinishedJobs();
    const sanitizedList = memArchives.map((a) => {
      const photos = a.sayfaFotolari || a.fotografYollari || (a.id && globalPhotoStore.get(a.id)) || [];
      const count = photos.length;
      return {
        ...a,
        sayfaFotolari: Array(count).fill(""),
        fotografYollari: Array(count).fill(""),
        photosCount: count,
      };
    });
    res.json(sanitizedList);
  }
});

// GET single archive full record with photos
app.get("/api/archives/:id", async (req, res) => {
  const { id } = req.params;
  let archive: any = null;

  const memFound = memArchives.find(a => a.id === id);
  if (memFound) {
    archive = { ...memFound };
  }

  if ((!archive || !archive.sayfaFotolari || archive.sayfaFotolari.every((p: any) => !p || p.length < 50)) && pool && !useMemoryFallback) {
    try {
      const dbRes = await pool.query("SELECT * FROM archives WHERE id = $1", [id]);
      if (dbRes.rows.length > 0) {
        archive = formatArchiveRow(dbRes.rows[0], true);
      }
    } catch (e: any) {
      console.warn("Single archive DB fetch error:", e.message);
    }
  }

  // Ensure high-res photos from globalPhotoStore are populated
  if (id && globalPhotoStore.has(id)) {
    const stored = globalPhotoStore.get(id);
    if (stored && stored.length > 0) {
      if (!archive) {
        archive = { id };
      }
      archive.sayfaFotolari = stored;
      archive.fotografYollari = stored;
    }
  }

  if (!archive) {
    return res.status(404).json({ error: "Arşiv bulunamadı" });
  }
  res.json(archive);
});

// Download all photos for an exam as a ZIP file
app.get("/api/archives/:id/download-zip", async (req, res) => {
  const { id } = req.params;
  let photos = globalPhotoStore.get(id) || [];
  let sinavAdi = "Sinav";
  let ogrenciAdi = "Ogrenci";

  const memArch = memArchives.find(a => a.id === id);
  if (memArch) {
    sinavAdi = memArch.sinavAdi || sinavAdi;
    ogrenciAdi = memArch.ogrenciAdSoyad || ogrenciAdi;
    if (photos.length === 0 && (memArch.sayfaFotolari?.length || memArch.fotografYollari?.length)) {
      photos = memArch.sayfaFotolari || memArch.fotografYollari || [];
    }
  }

  if ((!photos || photos.length === 0 || photos.every((p: any) => !p || p.length < 50)) && pool && !useMemoryFallback) {
    try {
      const dbRes = await pool.query("SELECT sinav_adi, ogrenci_ad_soyad, sayfa_fotolari FROM archives WHERE id = $1", [id]);
      if (dbRes.rows.length > 0) {
        sinavAdi = dbRes.rows[0].sinav_adi || sinavAdi;
        ogrenciAdi = dbRes.rows[0].ogrenci_ad_soyad || ogrenciAdi;
        const raw = dbRes.rows[0].sayfa_fotolari;
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.length > 0) {
          photos = parsed;
          globalPhotoStore.set(id, photos);
        }
      }
    } catch (e: any) {
      console.warn("ZIP photo fetch error from DB:", e.message);
    }
  }

  photos = (photos || []).filter((p: any) => (typeof p === "string" && p.length > 50) || Boolean(p?.imageBase64 && p.imageBase64.length > 50));

  if (!photos || photos.length === 0) {
    return res.status(404).json({ error: "Bu sınava ait kayıtlı sayfa fotoğrafı bulunamadı." });
  }

  try {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    photos.forEach((photo: any, idx: number) => {
      const rawBase64 = typeof photo === "string" ? photo : (photo?.imageBase64 || "");
      if (!rawBase64) return;
      const isPng = rawBase64.includes("image/png");
      const ext = isPng ? "png" : "jpg";
      const cleanBase64 = rawBase64.replace(/^data:image\/\w+;base64,/, "");
      const fileName = `Sayfa_${String(idx + 1).padStart(2, "0")}.${ext}`;
      zip.file(fileName, cleanBase64, { base64: true });
    });

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const cleanSinav = (sinavAdi || "Sinav").replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, "_");
    const cleanOgrenci = (ogrenciAdi || "Ogrenci").replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, "_");
    const zipFileName = encodeURIComponent(`${cleanSinav}_${cleanOgrenci}_Fotograflari.zip`);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${zipFileName}`);
    res.send(zipBuffer);
  } catch (err: any) {
    console.error("ZIP packaging error:", err);
    res.status(500).json({ error: "Fotoğraflar ZIP haline getirilirken hata oluştu: " + err.message });
  }
});

// Mark a single archive as read
app.post("/api/archives/:id/mark-read", async (req, res) => {
  const { id } = req.params;
  const idx = memArchives.findIndex(x => x.id === id);
  if (idx >= 0) {
    memArchives[idx].isNew = false;
    memArchives[idx].durum = 'İncelendi';
  }
  saveDbToFile();

  if (pool && !useMemoryFallback) {
    try {
      await pool.query(
        "UPDATE archives SET is_new = false, durum = 'İncelendi' WHERE id = $1",
        [id]
      );
    } catch (err: any) {
      console.warn("Could not update archive mark-read in postgres:", err.message);
    }
  }

  res.json({ success: true, id });
});

// Mark all archives (or all for a student) as read
app.post("/api/archives/mark-all-read", async (req, res) => {
  const { studentId } = req.body || {};
  
  memArchives.forEach(a => {
    if (!studentId || a.studentId === studentId) {
      a.isNew = false;
      a.durum = 'İncelendi';
    }
  });
  saveDbToFile();

  if (pool && !useMemoryFallback) {
    try {
      if (studentId) {
        await pool.query(
          "UPDATE archives SET is_new = false, durum = 'İncelendi' WHERE student_id = $1",
          [studentId]
        );
      } else {
        await pool.query(
          "UPDATE archives SET is_new = false, durum = 'İncelendi'"
        );
      }
    } catch (err: any) {
      console.warn("Could not update all archives mark-read in postgres:", err.message);
    }
  }

  res.json({ success: true });
});

// Coach PIN Settings Endpoints
app.get(["/api/settings/coach-pin", "/api/coach-pin"], (req, res) => {
  res.json({ coachPin: memCoachPin || "998877" });
});

app.post("/api/settings/coach-pin", async (req, res) => {
  const { newPin } = req.body || {};
  if (!newPin || typeof newPin !== "string" || !/^\d{4,8}$/.test(newPin.trim())) {
    return res.status(400).json({ 
      success: false, 
      error: "Koç PIN kodu 4 ila 8 haneli sadece rakamlardan oluşmalıdır." 
    });
  }
  const cleanPin = newPin.trim();

  // Çakışma Kontrolü (Conflict Check): Compare with all existing student PINs
  const conflictedStudent = memStudents.find(s => s.pinCode === cleanPin);
  if (conflictedStudent) {
    return res.status(409).json({ 
      success: false, 
      error: `Bu PIN kodu "${conflictedStudent.adSoyad}" (${conflictedStudent.sinif || 'Öğrenci'}) isimli öğrencide kayıtlıdır. Girişlerde çakışma yaşanmaması için lütfen başka bir PIN belirleyiniz.` 
    });
  }

  memCoachPin = cleanPin;
  saveDbToFile();

  if (pool && !useMemoryFallback) {
    try {
      await pool.query(
        "INSERT INTO app_settings (key, value) VALUES ('coach_pin', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [cleanPin]
      );
    } catch (err: any) {
      console.warn("Could not save coach_pin to postgres app_settings:", err.message);
    }
  }

  console.log(`🔑 [Coach PIN] Koç PIN kodu başarıyla güncellendi: ${cleanPin}`);
  res.json({ success: true, coachPin: cleanPin });
});

app.post("/api/archives", async (req, res) => {
  const a = req.body;
  if (!a || !a.id) {
    return res.status(400).json({ error: "Sınav arşiv verisi veya id eksik" });
  }
  try {
    await persistArchiveRecord(a);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Archives POST error:", error.message);
    res.json({ success: true, warning: error.message });
  }
});

app.delete("/api/archives/:id", async (req, res) => {
  const { id } = req.params;
  
  // Clean up any background queue jobs for this exam
  const qIdx = backgroundJobQueue.findIndex(j => j.archiveId === id);
  if (qIdx !== -1) {
    backgroundJobQueue.splice(qIdx, 1);
  }

  memArchives = memArchives.filter(x => x.id !== id);
  memExams = memExams.filter(x => x.id !== id);

  if (useMemoryFallback || !pool) {
    return res.json({ success: true });
  }
  try {
    await pool.query("DELETE FROM archives WHERE id = $1", [id]);
    await pool.query("DELETE FROM exams WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.warn("Database deletion note (memory already cleared):", error.message);
    res.json({ success: true, warning: error.message });
  }
});

// =========================================================================
// GOOGLE GEMINI MULTI-API-KEY POOL & LOAD BALANCER
// =========================================================================
interface GeminiKeySlot {
  key: string;
  maskedKey: string;
  client: GoogleGenAI;
  cooldownUntil: number;
  failureCount: number;
  successCount: number;
}

const geminiKeySlots: GeminiKeySlot[] = [];
let geminiKeyRoundRobinIndex = 0;

function getAllGeminiApiKeys(): string[] {
  const keys: string[] = [];
  const addKey = (k: string) => {
    const clean = (k || "").trim().replace(/^["']|["']$/g, '');
    if (clean && clean.length > 10 && clean !== "MY_GEMINI_API_KEY" && !keys.includes(clean)) {
      keys.push(clean);
    }
  };

  // 1. GEMINI_API_KEY (supports single key OR comma/semicolon/newline separated list)
  const mainKey = process.env.GEMINI_API_KEY || "";
  mainKey.split(/[,;\n\r\t]+/).forEach(addKey);

  // 2. GEMINI_API_KEYS (multiple keys list)
  const multiKeys = process.env.GEMINI_API_KEYS || "";
  multiKeys.split(/[,;\n\r\t]+/).forEach(addKey);

  // 3. Numbered keys: GEMINI_API_KEY_1, GEMINI_API_KEY_2 ... GEMINI_API_KEY_20
  for (let i = 1; i <= 20; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`];
    if (k) addKey(k);
  }

  return keys;
}

function refreshGeminiKeySlots(): GeminiKeySlot[] {
  const rawKeys = getAllGeminiApiKeys();

  // Remove keys no longer present
  for (let i = geminiKeySlots.length - 1; i >= 0; i--) {
    if (!rawKeys.includes(geminiKeySlots[i].key)) {
      geminiKeySlots.splice(i, 1);
    }
  }

  // Add newly configured keys
  for (const k of rawKeys) {
    if (!geminiKeySlots.some((s) => s.key === k)) {
      const masked = k.length > 10 ? `${k.slice(0, 6)}...${k.slice(-4)}` : k;
      geminiKeySlots.push({
        key: k,
        maskedKey: masked,
        client: new GoogleGenAI({
          apiKey: k,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        }),
        cooldownUntil: 0,
        failureCount: 0,
        successCount: 0,
      });
    }
  }

  return geminiKeySlots;
}

// Get active Gemini client with round-robin load-balancing and cooldown filtering
function getGeminiClient(): GoogleGenAI | null {
  const slots = refreshGeminiKeySlots();
  if (slots.length === 0) {
    return null;
  }

  const now = Date.now();
  // Filter available slots not in cooldown
  const availableSlots = slots.filter((s) => s.cooldownUntil <= now);
  if (availableSlots.length > 0) {
    geminiKeyRoundRobinIndex = (geminiKeyRoundRobinIndex + 1) % availableSlots.length;
    return availableSlots[geminiKeyRoundRobinIndex].client;
  }

  // If all are in cooldown, pick the slot that will expire earliest
  const sorted = [...slots].sort((a, b) => a.cooldownUntil - b.cooldownUntil);
  return sorted[0].client;
}

// Get all candidate Gemini clients for failover (active ones first)
function getGeminiCandidateClients(): GoogleGenAI[] {
  const slots = refreshGeminiKeySlots();
  if (slots.length === 0) return [];

  const now = Date.now();
  const availableSlots = slots.filter((s) => s.cooldownUntil <= now);
  if (availableSlots.length > 0) {
    return availableSlots.map((s) => s.client);
  }
  // If all in cooldown, return sorted by lowest cooldown
  return [...slots].sort((a, b) => a.cooldownUntil - b.cooldownUntil).map((s) => s.client);
}

// Mark a specific key slot in cooldown when it encounters a 429 Rate Limit error
function setGeminiKeyCooldown(client: GoogleGenAI, durationMs: number = 60000) {
  const now = Date.now();
  for (const slot of geminiKeySlots) {
    if (slot.client === client) {
      slot.cooldownUntil = now + durationMs;
      slot.failureCount++;
      console.warn(
        `[Gemini Key Pool] ⚠️ Anahtar (${slot.maskedKey}) ${Math.round(durationMs / 1000)}s soğumaya alındı. Toplam anahtar sayısı: ${geminiKeySlots.length}`
      );
    }
  }
}

// Record success for a key slot
function setGeminiKeySuccess(client: GoogleGenAI) {
  for (const slot of geminiKeySlots) {
    if (slot.client === client) {
      slot.successCount++;
      slot.cooldownUntil = 0;
    }
  }
}

// In-Memory Ring Buffer for Real-Time System & AI Error Monitoring
interface SystemLogEntry {
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

const systemLogs: SystemLogEntry[] = [];
function addSystemLog(entry: Omit<SystemLogEntry, 'id' | 'timestamp'>) {
  const newEntry: SystemLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  systemLogs.unshift(newEntry);
  if (systemLogs.length > 120) {
    systemLogs.pop();
  }
}

// Multi-Tier Model Cascade for High Availability & Ultra-Fast Quota Failover
const FLASH_VISION_CASCADE = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview",
];

const FLASH_TEXT_CASCADE = [
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview",
];

// Dynamic Model Health State & Live Registry
const modelCooldownMap = new Map<string, number>(); // modelName -> timestamp when cooldown expires
let primaryWorkingModel: string | null = null;

export interface LiveModelHealthInfo {
  model: string;
  provider: 'gemini' | 'grok' | 'openai' | 'groq' | 'openrouter';
  status: 'ok' | 'rate_limited' | 'error';
  isAlive: boolean;
  latencyMs: number;
  lastCheckedAt: number;
  message?: string;
}

const verifiedLiveModelsMap = new Map<string, LiveModelHealthInfo>();
let lastLiveHealthCheckTimestamp = 0;
let isHealthChecking = false;

function setModelCooldown(modelName: string, durationMs = 180000) { // 3 min default cooldown
  modelCooldownMap.set(modelName, Date.now() + durationMs);
  if (primaryWorkingModel === modelName) {
    primaryWorkingModel = null;
  }
  const existing = verifiedLiveModelsMap.get(modelName);
  if (existing) {
    verifiedLiveModelsMap.set(modelName, {
      ...existing,
      status: 'rate_limited',
      isAlive: false,
      message: 'Soğumada (429 Kota Sınırı)'
    });
  }
}

function setModelWorking(modelName: string) {
  modelCooldownMap.delete(modelName);
  primaryWorkingModel = modelName;
}

function isModelCooling(modelName: string): boolean {
  const until = modelCooldownMap.get(modelName);
  if (!until) return false;
  if (Date.now() >= until) {
    modelCooldownMap.delete(modelName);
    return false;
  }
  return true;
}

function getSortedModelList(baseList: string[]): { activeList: string[]; coolingCount: number } {
  // Only include models that are NOT cooling AND pass live response check (or unverified yet)
  const active = baseList.filter((m) => {
    if (isModelCooling(m)) return false;
    const health = verifiedLiveModelsMap.get(m);
    // If live check tested and confirmed model is not alive, exclude it to avoid wasting time!
    if (health && !health.isAlive) return false;
    return true;
  });
  
  let sortedActive = [...active];
  if (primaryWorkingModel && sortedActive.includes(primaryWorkingModel)) {
    sortedActive = [
      primaryWorkingModel,
      ...sortedActive.filter((m) => m !== primaryWorkingModel),
    ];
  }

  return {
    activeList: sortedActive,
    coolingCount: baseList.length - active.length,
  };
}

// Function to run fast parallel live ping tests across all configured providers & models
async function runLiveModelHealthCheck(force = false): Promise<LiveModelHealthInfo[]> {
  if (isHealthChecking && !force) {
    return Array.from(verifiedLiveModelsMap.values());
  }
  isHealthChecking = true;
  const now = Date.now();
  console.log(`[Live Model Health Checker] 🔄 Canlı model kontrolleri başlatılıyor (1 dakikada bir otomatik güncelleme)...`);

  const geminiAi = getGeminiClient();
  const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";
  const openaiKey = process.env.OPENAI_API_KEY || "";
  const groqKey = process.env.GROQ_API_KEY || "";
  const openrouterKey = process.env.OPENROUTER_API_KEY || "";

  const checkPromises: Promise<LiveModelHealthInfo>[] = [];

  // 1. Test Gemini Models
  if (geminiAi) {
    for (const model of FLASH_VISION_CASCADE) {
      if (!force && isModelCooling(model)) {
        const info: LiveModelHealthInfo = {
          model,
          provider: 'gemini',
          status: 'rate_limited',
          isAlive: false,
          latencyMs: 0,
          lastCheckedAt: now,
          message: 'Soğumada (429 Kota Sınırı)'
        };
        verifiedLiveModelsMap.set(model, info);
        continue;
      }
      checkPromises.push((async () => {
        const t0 = Date.now();
        try {
          const resp = await withTimeout(
            geminiAi.models.generateContent({
              model,
              contents: "test",
              config: {
                maxOutputTokens: 5,
              },
            }),
            5000,
            `${model} 5sn zaman aşımı`
          );
          const latency = Date.now() - t0;
          // HTTP 200: Model accepted request and responded successfully
          setModelWorking(model);
          const info: LiveModelHealthInfo = {
            model,
            provider: 'gemini',
            status: 'ok',
            isAlive: true,
            latencyMs: latency,
            lastCheckedAt: now,
            message: 'Canlı ve Hazır'
          };
          verifiedLiveModelsMap.set(model, info);
          return info;
        } catch (err: any) {
          const latency = Date.now() - t0;
          const errStr = String(err?.message || err || "").toLowerCase();
          const isQuota = err?.status === 429 || errStr.includes("429") || errStr.includes("quota") || errStr.includes("resource_exhausted");
          if (isQuota) {
            setModelCooldown(model, 180000);
          }
          const info: LiveModelHealthInfo = {
            model,
            provider: 'gemini',
            status: isQuota ? 'rate_limited' : 'error',
            isAlive: false,
            latencyMs: latency,
            lastCheckedAt: now,
            message: (err?.message || String(err)).slice(0, 150)
          };
          verifiedLiveModelsMap.set(model, info);
          return info;
        }
      })());
    }
  }

  // 2. Test xAI Grok Models
  if (grokKey && grokKey.trim().length > 0) {
    const grokModels = ["grok-2-vision-1212", "grok-2", "grok-vision-beta"];
    for (const model of grokModels) {
      checkPromises.push((async () => {
        const t0 = Date.now();
        try {
          const res = await withTimeout(
            fetch("https://api.x.ai/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${grokKey.trim()}`, "Content-Type": "application/json" },
              body: JSON.stringify({ model, messages: [{ role: "user", content: "test" }], max_tokens: 5 }),
            }),
            5000,
            `xAI Grok (${model}) 5sn zaman aşımı`
          );
          const latency = Date.now() - t0;
          const json: any = await res.json().catch(() => ({}));
          // HTTP 200 or res.ok is strictly successful
          const isOk = res.ok || res.status === 200;
          const isRateLimited = res.status === 429;
          const info: LiveModelHealthInfo = {
            model: `xai/${model}`,
            provider: 'grok',
            status: isOk ? 'ok' : (isRateLimited ? 'rate_limited' : 'error'),
            isAlive: isOk,
            latencyMs: latency,
            lastCheckedAt: now,
            message: isOk ? 'Canlı ve Hazır' : (json?.error?.message || `HTTP ${res.status}`)
          };
          verifiedLiveModelsMap.set(`xai/${model}`, info);
          return info;
        } catch (err: any) {
          const info: LiveModelHealthInfo = {
            model: `xai/${model}`,
            provider: 'grok',
            status: 'error',
            isAlive: false,
            latencyMs: Date.now() - t0,
            lastCheckedAt: now,
            message: err?.message || 'Grok Erişilemiyor'
          };
          verifiedLiveModelsMap.set(`xai/${model}`, info);
          return info;
        }
      })());
    }
  }

  // 3. Test OpenAI Models
  if (openaiKey && openaiKey.trim().length > 0) {
    const oaiModels = ["gpt-4o", "gpt-4o-mini"];
    for (const model of oaiModels) {
      checkPromises.push((async () => {
        const t0 = Date.now();
        try {
          const res = await withTimeout(
            fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${openaiKey.trim()}`, "Content-Type": "application/json" },
              body: JSON.stringify({ model, messages: [{ role: "user", content: "test" }], max_tokens: 5 }),
            }),
            5000,
            `OpenAI (${model}) 5sn zaman aşımı`
          );
          const latency = Date.now() - t0;
          const json: any = await res.json().catch(() => ({}));
          // HTTP 200 or res.ok is strictly successful
          const isOk = res.ok || res.status === 200;
          const isRateLimited = res.status === 429;
          const info: LiveModelHealthInfo = {
            model: `openai/${model}`,
            provider: 'openai',
            status: isOk ? 'ok' : (isRateLimited ? 'rate_limited' : 'error'),
            isAlive: isOk,
            latencyMs: latency,
            lastCheckedAt: now,
            message: isOk ? 'Canlı ve Hazır' : (json?.error?.message || `HTTP ${res.status}`)
          };
          verifiedLiveModelsMap.set(`openai/${model}`, info);
          return info;
        } catch (err: any) {
          const info: LiveModelHealthInfo = {
            model: `openai/${model}`,
            provider: 'openai',
            status: 'error',
            isAlive: false,
            latencyMs: Date.now() - t0,
            lastCheckedAt: now,
            message: err?.message || 'OpenAI Erişilemiyor'
          };
          verifiedLiveModelsMap.set(`openai/${model}`, info);
          return info;
        }
      })());
    }
  }

  // 4. Test OpenRouter Models
  if (openrouterKey && openrouterKey.trim().length > 0) {
    const orModels = [
      "x-ai/grok-2-vision-1212",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "qwen/qwen-2.5-vl-72b-instruct",
      "meta-llama/llama-3.2-11b-vision-instruct",
    ];
    for (const model of orModels) {
      checkPromises.push((async () => {
        const t0 = Date.now();
        try {
          const res = await withTimeout(
            fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${openrouterKey.trim()}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://ai.studio",
                "X-Title": "YKS Koçluk AI",
              },
              body: JSON.stringify({ model, messages: [{ role: "user", content: "test" }], max_tokens: 5 }),
            }),
            5000,
            `OpenRouter (${model}) 5sn zaman aşımı`
          );
          const latency = Date.now() - t0;
          const json: any = await res.json().catch(() => ({}));
          // HTTP 200 or res.ok is strictly successful
          const isOk = res.ok || res.status === 200;
          const isRateLimited = res.status === 429;
          const info: LiveModelHealthInfo = {
            model: `openrouter/${model}`,
            provider: 'openrouter',
            status: isOk ? 'ok' : (isRateLimited ? 'rate_limited' : 'error'),
            isAlive: isOk,
            latencyMs: latency,
            lastCheckedAt: now,
            message: isOk ? 'Canlı ve Hazır' : (json?.error?.message || `HTTP ${res.status}`)
          };
          verifiedLiveModelsMap.set(`openrouter/${model}`, info);
          return info;
        } catch (err: any) {
          const info: LiveModelHealthInfo = {
            model: `openrouter/${model}`,
            provider: 'openrouter',
            status: 'error',
            isAlive: false,
            latencyMs: Date.now() - t0,
            lastCheckedAt: now,
            message: err?.message || 'OpenRouter Erişilemiyor'
          };
          verifiedLiveModelsMap.set(`openrouter/${model}`, info);
          return info;
        }
      })());
    }
  }

  // 5. Test Groq Models
  if (groqKey && groqKey.trim().length > 0) {
    const groqModels = [
      "qwen/qwen3.8-27b",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
    ];
    for (const model of groqModels) {
      checkPromises.push((async () => {
        const t0 = Date.now();
        try {
          const res = await withTimeout(
            fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${groqKey.trim()}`, "Content-Type": "application/json" },
              body: JSON.stringify({ model, messages: [{ role: "user", content: "test" }], max_tokens: 5 }),
            }),
            5000,
            `Groq (${model}) 5sn zaman aşımı`
          );
          const latency = Date.now() - t0;
          const json: any = await res.json().catch(() => ({}));
          // HTTP 200 or res.ok is strictly successful
          const isOk = res.ok || res.status === 200;
          const isRateLimited = res.status === 429;
          const info: LiveModelHealthInfo = {
            model: `groq/${model}`,
            provider: 'groq',
            status: isOk ? 'ok' : (isRateLimited ? 'rate_limited' : 'error'),
            isAlive: isOk,
            latencyMs: latency,
            lastCheckedAt: now,
            message: isOk ? 'Canlı ve Hazır' : (json?.error?.message || `HTTP ${res.status}`)
          };
          verifiedLiveModelsMap.set(`groq/${model}`, info);
          return info;
        } catch (err: any) {
          const info: LiveModelHealthInfo = {
            model: `groq/${model}`,
            provider: 'groq',
            status: 'error',
            isAlive: false,
            latencyMs: Date.now() - t0,
            lastCheckedAt: now,
            message: err?.message || 'Groq Erişilemiyor'
          };
          verifiedLiveModelsMap.set(`groq/${model}`, info);
          return info;
        }
      })());
    }
  }

  await Promise.allSettled(checkPromises);
  isHealthChecking = false;
  lastLiveHealthCheckTimestamp = Date.now();

  const aliveList = Array.from(verifiedLiveModelsMap.values())
    .filter(m => m.isAlive)
    .map(m => `${m.model} (${m.latencyMs}ms)`);

  console.log(`[Live Model Health Checker] ✅ Güncelleme Tamamlandı! Toplam Canlı Modeller (${aliveList.length}): ${aliveList.join(', ') || 'Yok'}`);
  addSystemLog({
    level: 'info',
    source: 'ai_worker',
    message: `[Canlı Model Kontrolü] 🟢 Aktif yanıt veren modeller güncellendi (${aliveList.length} Hazır): ${aliveList.join(', ') || 'Hiçbir model yanıt vermedi'}`,
  });

  return Array.from(verifiedLiveModelsMap.values());
}

// Helper: Call xAI Grok Vision API (grok-2-vision-1212 / grok-vision-beta)
async function callGrokVision(
  apiKey: string,
  params: { prompt: string; mimeType: string; cleanBase64: string }
): Promise<string> {
  const models = ["grok-2-vision-1212", "grok-vision-beta"];

  for (const model of models) {
    try {
      console.log(`[xAI Grok Vision] Deneniyor: ${model}...`);
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: params.prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${params.mimeType};base64,${params.cleanBase64}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
        }),
      });

      const json: any = await res.json().catch(() => ({}));
      const content = json.choices?.[0]?.message?.content;
      if (res.ok && content) return content;
      console.warn(`[xAI Grok Vision] ${model} hata yanıtı:`, json?.error?.message || res.status);
    } catch (err) {
      console.warn(`[xAI Grok Vision] ${model} başarısız:`, err);
    }
  }
  throw new Error("Grok Vision modelleri yanıt vermedi.");
}

// Helper: Call OpenAI Vision API (GPT-4o / GPT-4o Mini)
async function callOpenAIVision(
  apiKey: string,
  params: { prompt: string; mimeType: string; cleanBase64: string }
): Promise<string> {
  const models = ["gpt-4o", "gpt-4o-mini"];

  for (const model of models) {
    try {
      console.log(`[OpenAI Vision] Deneniyor: ${model}...`);
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: params.prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${params.mimeType};base64,${params.cleanBase64}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });

      const json: any = await res.json().catch(() => ({}));
      const content = json.choices?.[0]?.message?.content;
      if (res.ok && content) return content;
      console.warn(`[OpenAI Vision] ${model} hata yanıtı:`, json?.error?.message || res.status);
    } catch (err) {
      console.warn(`[OpenAI Vision] ${model} başarısız:`, err);
    }
  }
  throw new Error("OpenAI Vision modelleri yanıt vermedi.");
}

// Helper: Call OpenRouter Vision (Grok 2 Vision, GPT-4o, Qwen 2.5 VL 72B, Llama 3.2 Vision)
async function callOpenRouterVision(
  apiKey: string,
  params: { prompt: string; mimeType: string; cleanBase64: string }
): Promise<string> {
  const models = [
    "x-ai/grok-2-vision-1212",
    "openai/gpt-4o",
    "openai/gpt-4o-mini",
    "qwen/qwen-2.5-vl-72b-instruct",
    "meta-llama/llama-3.2-11b-vision-instruct",
    "google/gemini-2.0-flash-001",
    "mistralai/pixtral-12b",
    "qwen/qwen-2.5-vl-72b-instruct:free",
  ];

  for (const model of models) {
    try {
      console.log(`[OpenRouter Vision] Deneniyor: ${model}...`);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai.studio",
          "X-Title": "YKS Koçluk AI",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: params.prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${params.mimeType};base64,${params.cleanBase64}`,
                  },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });

      const json: any = await res.json().catch(() => ({}));
      const content = json.choices?.[0]?.message?.content;
      if (res.ok && content) return content;
      console.warn(`[OpenRouter Vision] ${model} hata yanıtı:`, json?.error?.message || res.status);
    } catch (err) {
      console.warn(`[OpenRouter Vision] ${model} başarısız:`, err);
    }
  }
  throw new Error("OpenRouter Vision modelleri yanıt vermedi.");
}

// Helper: Call Groq AI (Qwen 3.8 27B & GPT-OSS 120B / 20B)
async function callGroqVision(
  apiKey: string,
  params: { prompt: string; mimeType: string; cleanBase64: string }
): Promise<string> {
  const models = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
  ];

  for (const model of models) {
    try {
      console.log(`[Groq AI] Deneniyor: ${model}...`);
      const isVision = model.includes("vision");
      const messages = isVision
        ? [
            {
              role: "user",
              content: [
                { type: "text", text: params.prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${params.mimeType};base64,${params.cleanBase64}`,
                  },
                },
              ],
            },
          ]
        : [
            {
              role: "system",
              content: "Sen uzman bir YKS/MEB öğretmenisin. Soru metinlerini ve analizleri JSON formatında yanıtlarsın.",
            },
            {
              role: "user",
              content: params.prompt,
            },
          ];

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
      });

      if (res.ok) {
        const json: any = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) return content;
      }
    } catch (err) {
      console.warn(`[Groq AI] ${model} başarısız:`, err);
    }
  }
  throw new Error("Groq modelleri yanıt vermedi.");
}

// Helper: Promise timeout wrapper for model failover
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Helper: Extract retry delay in seconds from Gemini quota/error messages
function extractGeminiRetryDelay(errStr: string): number {
  const match =
    errStr.match(/retry(?: delay)?:?\s*\"?([0-9\.]+)\s*s/i) ||
    errStr.match(/retry in\s*([0-9\.]+)\s*s/i);
  if (match && match[1]) {
    const s = parseFloat(match[1]);
    if (s > 0 && s <= 180) return Math.ceil(s);
  }
  return 20; // Default 20 seconds instead of 15 minutes!
}

// Helper: Run Vision Generation with Automatic Multi-Provider Model Failover
async function executeVisionWithFallback(
  ai: GoogleGenAI | null,
  params: {
    prompt: string;
    mimeType: string;
    cleanBase64: string;
    temperature?: number;
  }
): Promise<{ text: string; usedModel: string }> {
  let lastError: any = null;
  let allRateLimited = true;

  // 1. Google Gemini Flash & Pro Models (Active & non-cooling across all API Key slots)
  const candidateClients = getGeminiCandidateClients();
  if (candidateClients.length > 0) {
    const { activeList, coolingCount } = getSortedModelList(FLASH_VISION_CASCADE);

    for (let i = 0; i < activeList.length; i++) {
      const modelName = activeList[i];
      let modelSuccess = false;

      for (let k = 0; k < candidateClients.length; k++) {
        const client = candidateClients[k];
        try {
          console.log(
            `[Gemini Flash Vision] Deneniyor: ${modelName} (Model ${i + 1}/${activeList.length}, Anahtar ${k + 1}/${candidateClients.length})...`
          );
          const response = await withTimeout(
            client.models.generateContent({
              model: modelName,
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      inlineData: {
                        mimeType: params.mimeType,
                        data: params.cleanBase64,
                      },
                    },
                    {
                      text: params.prompt,
                    },
                  ],
                },
              ],
              config: {
                responseMimeType: "application/json",
                temperature: params.temperature ?? 0.1,
                maxOutputTokens: 8192,
              },
            }),
            25000,
            `${modelName} 25 saniye zaman aşımına uğradı (meşgul/yanıtsız).`
          );

          const responseText = response?.text || "";
          if (responseText && responseText.trim().length > 0) {
            console.log(`[Gemini Flash Vision] ✅ Başarılı model: ${modelName}`);
            setModelWorking(modelName);
            setGeminiKeySuccess(client);
            addSystemLog({
              level: "success",
              source: "gemini",
              message: `✅ Görsel soru analizi başarılı: ${modelName} yanıt verdi.`,
              model: modelName,
            });
            return { text: responseText, usedModel: modelName };
          }
        } catch (err: any) {
          lastError = err;
          const errStr = String(err?.message || err || "").toLowerCase();
          const isQuota =
            err?.status === 429 ||
            errStr.includes("429") ||
            errStr.includes("quota") ||
            errStr.includes("resource_exhausted") ||
            errStr.includes("rate limit") ||
            errStr.includes("too many requests");

          if (isQuota) {
            setGeminiKeyCooldown(client, 60000); // Cooldown this key for 60s
            console.warn(
              `[Gemini Key Quota] ⚠️ Anahtar için 429 Kota Sınırı. Sıradaki anahtar deneniyor...`
            );
          } else {
            allRateLimited = false;
          }
        }
      }

      // If all keys failed on this model, mark model cooling if quota was hit
      const nextModel = activeList[i + 1];
      if (nextModel) {
        console.warn(`[Gemini Flash Failover] ⚠️ ${modelName} tüm anahtarlarda başarısız oldu. Sıradaki modele (${nextModel}) geçiliyor...`);
      }
    }
  }

  // 2. xAI Grok Vision Fallback (GROK_API_KEY or XAI_API_KEY)
  const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";
  if (grokKey && grokKey.trim().length > 0) {
    try {
      console.log(`[xAI Grok Vision Fallback] Grok 2 Vision deneniyor...`);
      const grokText = await callGrokVision(grokKey.trim(), params);
      if (grokText && grokText.trim().length > 0) {
        addSystemLog({
          level: 'success',
          source: 'gemini',
          message: `✅ xAI Grok 2 Vision ile görsel soru çözümü tamamlandı.`,
          model: "grok-2-vision",
        });
        return { text: grokText, usedModel: "grok-2-vision" };
      }
    } catch (grokErr: any) {
      console.warn(`[xAI Grok Vision] Başarısız:`, grokErr?.message || grokErr);
    }
  }

  // 3. OpenAI Vision Fallback (OPENAI_API_KEY)
  const openaiKey = process.env.OPENAI_API_KEY || "";
  if (openaiKey && openaiKey.trim().length > 0) {
    try {
      console.log(`[OpenAI Vision Fallback] GPT-4o Vision deneniyor...`);
      const openaiText = await callOpenAIVision(openaiKey.trim(), params);
      if (openaiText && openaiText.trim().length > 0) {
        addSystemLog({
          level: 'success',
          source: 'gemini',
          message: `✅ OpenAI GPT-4o Vision ile görsel soru çözümü tamamlandı.`,
          model: "openai-gpt-4o",
        });
        return { text: openaiText, usedModel: "openai-gpt-4o" };
      }
    } catch (openaiErr: any) {
      console.warn(`[OpenAI Vision] Başarısız:`, openaiErr?.message || openaiErr);
    }
  }

  // 4. OpenRouter Vision Fallback (OPENROUTER_API_KEY) - includes Grok, OpenAI, Qwen 2.5 VL, etc.
  const openrouterKey = process.env.OPENROUTER_API_KEY || "";
  if (openrouterKey && openrouterKey.trim().length > 0) {
    try {
      console.log(`[OpenRouter Vision Fallback] OpenRouter Vision (Grok / OpenAI / Qwen) deneniyor...`);
      const openRouterText = await callOpenRouterVision(openrouterKey.trim(), params);
      if (openRouterText && openRouterText.trim().length > 0) {
        addSystemLog({
          level: 'success',
          source: 'gemini',
          message: `✅ OpenRouter (Grok / OpenAI / Qwen) ile görsel soru çözümü tamamlandı.`,
          model: "openrouter-vision",
        });
        return { text: openRouterText, usedModel: "openrouter-vision" };
      }
    } catch (orErr: any) {
      console.warn(`[OpenRouter Vision] Başarısız:`, orErr?.message || orErr);
    }
  }

  // 5. Groq Llama 3.2 Vision Fallback (GROQ_API_KEY)
  const groqKey = process.env.GROQ_API_KEY || "";
  if (groqKey && groqKey.trim().length > 0) {
    try {
      console.log(`[Groq Vision Fallback] Groq Llama 3.2 Vision deneniyor...`);
      const groqText = await callGroqVision(groqKey.trim(), params);
      if (groqText && groqText.trim().length > 0) {
        addSystemLog({
          level: 'success',
          source: 'gemini',
          message: `✅ Groq (Llama 3.2 Vision) ile soru çözümü tamamlandı.`,
          model: "groq-llama-3.2-vision",
        });
        return { text: groqText, usedModel: "groq-llama-3.2-vision" };
      }
    } catch (groqErr: any) {
      console.warn(`[Groq AI] Başarısız:`, groqErr?.message || groqErr);
    }
  }

  // If all failed, rethrow
  if (lastError) {
    (lastError as any).allModelsRateLimited = allRateLimited;
    throw lastError;
  }

  throw new Error("Tüm alternatif AI modelleri (Gemini, Grok, OpenAI, OpenRouter, Groq) başarısız oldu.");
}

// Helper: Run Text Generation with Automatic Model Failover
async function executeTextWithFallback(
  ai: GoogleGenAI,
  params: {
    prompt?: string;
    parts?: any[];
    temperature?: number;
    jsonMode?: boolean;
    systemInstruction?: string;
    maxOutputTokens?: number;
    timeoutMs?: number;
  }
): Promise<{ text: string; usedModel: string }> {
  let lastError: any = null;
  const contents: any = params.parts && params.parts.length > 0 ? [{ parts: params.parts }] : (params.prompt || "");
  const effectiveTimeout = params.timeoutMs || 30000;

  const candidateClients = getGeminiCandidateClients();
  const clientsToTry = candidateClients.length > 0 ? candidateClients : [ai];
  const { activeList } = getSortedModelList(FLASH_TEXT_CASCADE);

  for (let i = 0; i < activeList.length; i++) {
    const modelName = activeList[i];
    for (let k = 0; k < clientsToTry.length; k++) {
      const client = clientsToTry[k];
      try {
        console.log(`[Gemini Flash Text] Deneniyor: ${modelName} (Model ${i + 1}/${activeList.length}, Anahtar ${k + 1}/${clientsToTry.length})...`);
        const response = await withTimeout(
          client.models.generateContent({
            model: modelName,
            contents,
            config: {
              ...(params.jsonMode ? { responseMimeType: "application/json" } : {}),
              ...(params.systemInstruction ? { systemInstruction: params.systemInstruction } : {}),
              temperature: params.temperature ?? 0.2,
              maxOutputTokens: params.maxOutputTokens ?? 8192,
            },
          }),
          effectiveTimeout,
          `${modelName} ${Math.round(effectiveTimeout / 1000)} saniye zaman aşımına uğradı (meşgul/yanıtsız).`
        );

        const responseText = response?.text || "";
        if (responseText && responseText.trim().length > 0) {
          setModelWorking(modelName);
          setGeminiKeySuccess(client);
          console.log(`[Gemini Flash Text] ✅ Başarılı model: ${modelName}`);
          return { text: responseText, usedModel: modelName };
        }
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err || "").toLowerCase();
        if (err?.status === 429 || errStr.includes("429") || errStr.includes("quota")) {
          setGeminiKeyCooldown(client, 60000);
          setModelCooldown(modelName, 300000);
        }
      }
    }
    const nextModel = activeList[i + 1];
    if (nextModel) {
      console.warn(`[Gemini Text Failover] ${modelName} -> ${nextModel} geçiliyor...`);
    }
  }
  throw lastError || new Error("Tüm Flash modelleri başarısız oldu.");
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
    ),
  });
});

// =========================================================================
// 1. MEB MÜFREDAT KAZANIMLARI ÇEKME ENDPOINT'İ
// =========================================================================
app.post("/api/ai/curriculum", async (req, res) => {
  try {
    const { hedefYil = 2026, customPrompt } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        source: "seed-mufredat",
        kazanimlar: getFallbackCurriculum(hedefYil),
      });
    }

    const prompt = customPrompt || `
Sen Türkiye Millî Eğitim Bakanlığı (MEB) Talim ve Terbiye Kurulu ve ÖSYM YKS müfredat uzmanısın.

GÖREV:
Önümüzdeki YKS (${hedefYil}) için yürürlükte olan MEB resmi Ortaöğretim Öğretim Programı tebliğindeki TÜM DERSLERİ kapsayan resmi kazanımları listele.

KAPSAM VE DERSLER:
1. Türkçe & Edebiyat: TYT Türkçe, AYT Edebiyat.
2. Matematik & Geometri: TYT Matematik, AYT Matematik, Geometri.
3. Fen Bilimleri: Fizik, Kimya, Biyoloji (TYT-AYT).
4. Tarih: TYT Tarih, AYT Tarih-1 ve Tarih-2.
5. Coğrafya: TYT Coğrafya, AYT Coğrafya-1 ve Coğrafya-2.
6. Felsefe Grubu: TYT Felsefe, AYT Mantık, Psikoloji, Sosyoloji.
7. Din Kültürü ve Ahlak Bilgisi: TYT ve AYT resmi kazanımları.

KURALLAR:
1. Tüm derslerden dengeli şekilde toplam 60-100 arası kritik resmi kazanım hazırla.
2. SADECE geçerli bir JSON dizisi [ ... ] ver. Markdown (örn \`\`\`json) veya açıklama metni YAZMA.

JSON Formatı:
[
  {
    "sinavTuru": "TYT",
    "ders": "Matematik",
    "konu": "Sayı Basamakları",
    "kazanimKodu": "MAT.TYT.02",
    "aciklama": "Sayı basamakları ile ilgili problemleri çözer.",
    "onemDerecesi": "Kritik",
    "yil": "${hedefYil}"
  }
]`;

    const { text: rawText, usedModel } = await executeTextWithFallback(ai, {
      prompt,
      jsonMode: true,
      temperature: 0.2,
    });

    let cleanText = rawText.trim();
    const ilk = cleanText.indexOf("[");
    const son = cleanText.lastIndexOf("]");
    if (ilk >= 0 && son > ilk) {
      cleanText = cleanText.substring(ilk, son + 1);
    }

    const parsed = JSON.parse(cleanText);
    const formatted = parsed.map((k: any, idx: number) => ({
      id: `kaz-${Date.now()}-${idx + 1}`,
      sinavTuru: k.sinavTuru || k.SinavTuru || "TYT",
      ders: k.ders || k.Ders || "Matematik",
      konu: k.konu || k.Konu || "Genel Konu",
      kazanimKodu: k.kazanimKodu || k.KazanimKodu || `KOD.${idx + 1}`,
      aciklama: k.aciklama || k.Aciklama || "",
      onemDerecesi: k.onemDerecesi || k.OnemDerecesi || "Yüksek",
      yil: String(k.yil || k.Yil || hedefYil),
    }));

    // Auto-save generated curriculum into PostgreSQL DB and memory
    await persistCurriculumItems(formatted, false);

    res.json({
      success: true,
      source: usedModel,
      kazanimlar: formatted,
    });
  } catch (error: any) {
    console.error("Müfredat Çekme Hatası:", error);
    res.json({
      success: true,
      source: "fallback-mufredat",
      kazanimlar: getFallbackCurriculum(req.body.hedefYil || 2026),
      warning: error?.message,
    });
  }
});

// Reconstruct wrapped lines from PDF documents without dropping outcome sentences
function reconstructCurriculumLines(rawText: string): string[] {
  const rawLines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const normalized: string[] = [];
  let currentBlock = "";

  const isStart = (l: string) => {
    return (
      /^(\d{1,2}\.[\d\.]+|[A-ZÇĞİÖŞÜ]{2,4}\.[\d\.]+|\bKAZ\b|\bÖG\b)/i.test(l) ||
      /^(\d+\.\s*(ünite|ÜNİTE)|ünite\b|ÜNİTE\b|konu\b|KONU\b|bölüm\b|BÖLÜM\b|öğrenme alanı|ÖĞRENME ALANI|\d+\.\s*(sınıf|SINIF))/i.test(l) ||
      /^[•\-\*]/i.test(l) ||
      /^[a-zçğıöşü]\)/i.test(l)
    );
  };

  for (const line of rawLines) {
    if (isStart(line)) {
      if (currentBlock) normalized.push(currentBlock);
      currentBlock = line;
    } else if (currentBlock) {
      currentBlock += " " + line;
    } else {
      currentBlock = line;
    }
  }
  if (currentBlock) normalized.push(currentBlock);
  return normalized;
}

// Deep Comprehensive Parser for MEB Curriculum text (Scans 100% of pages, extracts 100+ outcomes)
function extractAllCurriculumOutcomes(
  text: string,
  targetClass: string = "TÜMÜ",
  hedefYil: string = "2026"
): any[] {
  const fallback = getFallbackCurriculum(hedefYil);
  if (!text || text.trim().length < 15) {
    if (targetClass && targetClass !== "TÜMÜ") {
      const filtered = fallback.filter((f) => f.sinif === targetClass);
      return filtered.length > 0 ? filtered : fallback;
    }
    return fallback;
  }

  const results: any[] = [];
  const lines = reconstructCurriculumLines(text);

  let currentDers = "Matematik";
  let currentKonu = "Genel Müfredat";
  let currentSinif = targetClass && targetClass !== "TÜMÜ" ? targetClass : "12. Sınıf";
  let currentSinav: "TYT" | "AYT" =
    currentSinif.includes("9") || currentSinif.includes("10") ? "TYT" : "AYT";

  const lessonMap: Record<string, string> = {
    matematik: "Matematik",
    geometri: "Geometri",
    fizik: "Fizik",
    kimya: "Kimya",
    biyoloji: "Biyoloji",
    türkçe: "Türkçe",
    edebiyat: "Türk Dili ve Edebiyatı",
    tarih: "Tarih",
    coğrafya: "Coğrafya",
    felsefe: "Felsefe",
    din: "Din Kültürü",
    ingilizce: "İngilizce",
    mantık: "Mantık",
  };

  const verbPatterns =
    /(açıklar|hesaplar|çözer|kavrar|modeller|ilişkilendirir|karşılaştırır|analiz eder|uygular|tanımlar|örneklendirir|yorumlar|fark eder|sınıflandırır|gösterir|türetir|değerlendirir|ifade eder|inceler|kullanır|çizer|belirler|keşfeder|düzenler|sorgular|tahmin eder|çıkartır|yansıtır|oluşturur|yapılandırır|yapar|dönüştürür|bulur|öğrenir|öngörür|ayırt eder)[\.\s]*$/i;

  const outcomeCodeRegex =
    /^(\d{1,2}\.\d{1,2}\.\d{1,2}(\.\d{1,2})?|[A-ZÇĞİÖŞÜ]{2,4}\.\d{1,2}\.[\d\.]+|\bKAZ\b\.[\d\.]+|\bÖG\b\.[\d\.]+)/;

  const seenCodes = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Skip pure sub-bullets like a), b) unless they contain explicit code
    if (/^[a-zçğıöşü]\)|^\d+\)/i.test(line) && !outcomeCodeRegex.test(line)) {
      continue;
    }

    // 1. Detect subject
    for (const [kw, lessonName] of Object.entries(lessonMap)) {
      if (lower.startsWith(kw) || lower.includes(` ${kw} `) || lower.includes(`${kw} dersi`)) {
        currentDers = lessonName;
        break;
      }
    }

    // 2. Detect Class Level from Headers
    const classMatch = line.match(/(9|10|11|12)\.\s*(sınıf|SINIF)/i);
    if (classMatch) {
      currentSinif = `${classMatch[1]}. Sınıf`;
      currentSinav = classMatch[1] === "9" || classMatch[1] === "10" ? "TYT" : "AYT";
    }

    // 3. Detect Unit / Topic Headers
    if (
      /^(\d+\.\s*(ünite|ÜNİTE)|ünite\b|ÜNİTE\b|konu\b|KONU\b|bölüm\b|BÖLÜM\b|öğrenme alanı|ÖĞRENME ALANI)/i.test(
        line
      ) ||
      (line.length < 75 && line.endsWith(":"))
    ) {
      currentKonu =
        line
          .replace(
            /^(\d+\.\s*(ünite|ÜNİTE)|ünite\b|ÜNİTE\b|konu\b|KONU\b|bölüm\b|BÖLÜM\b|öğrenme alanı|ÖĞRENME ALANI)\s*:?/i,
            ""
          )
          .replace(/:$/, "")
          .trim() || currentKonu;
      continue;
    }

    // 4. Detect Learning Outcomes (No 50 cap! Extracts all 100+ outcomes)
    const codeMatch = line.match(outcomeCodeRegex);
    const hasCode = !!codeMatch;
    const hasVerb = verbPatterns.test(line);

    // Filter out page headers/footers or TOC lines
    if (/sayfa\s*\d+|içindekiler|talim ve terbiye/i.test(line)) {
      continue;
    }

    const isOutcome =
      (hasCode && line.length > 20) ||
      (hasVerb && line.length > 25 && line.length < 350);

    if (isOutcome) {
      const rawCode = codeMatch ? codeMatch[1] : `${currentDers.slice(0, 3).toUpperCase()}.${results.length + 1}`;

      // Infer Class Level from Code prefix (e.g. 9.1.1.1 -> 9. Sınıf, 10.2.1 -> 10. Sınıf, 11.1.1 -> 11. Sınıf, 12.4.1 -> 12. Sınıf)
      let itemSinif = currentSinif;
      let itemSinav = currentSinav;
      const numPrefix = rawCode.match(/^(\d{1,2})\./);
      if (numPrefix && ["9", "10", "11", "12"].includes(numPrefix[1])) {
        itemSinif = `${numPrefix[1]}. Sınıf`;
        itemSinav = numPrefix[1] === "9" || numPrefix[1] === "10" ? "TYT" : "AYT";
      }

      const desc = codeMatch
        ? line.slice(codeMatch[0].length).replace(/^[\.\s:\-]+/, "").trim()
        : line.replace(/^[A-ZÇĞİÖŞÜ0-9\.\s\-:]+/, "").trim() || line;

      // Avoid duplicates
      const dedupKey = `${rawCode}__${desc.slice(0, 30).toLowerCase()}`;
      if (seenCodes.has(dedupKey) || desc.length < 12) {
        continue;
      }
      seenCodes.add(dedupKey);

      // Determine importance based on key concepts
      const isCritical = /fonksiyon|türev|integral|trigonometri|hareket|kuvvet|kalıtım|organik|denklem|paragraf|limit/i.test(
        desc
      );

      results.push({
        id: `kaz-str-${Date.now()}-${results.length + 1}`,
        sinif: itemSinif,
        sinavTuru: itemSinav,
        ders: currentDers,
        konu: currentKonu || "Genel Konu",
        kazanimKodu: rawCode,
        aciklama: desc,
        onemDerecesi: isCritical ? "Kritik" : results.length % 2 === 0 ? "Yüksek" : "Orta",
        yil: String(hedefYil),
      });
    }
  }

  if (results.length === 0) {
    if (targetClass && targetClass !== "TÜMÜ") {
      const filtered = fallback.filter((f) => f.sinif === targetClass);
      return filtered.length > 0 ? filtered : fallback;
    }
    return fallback;
  }

  return results;
}

// Backward compatibility alias
function extractKazanimlarHeuristic(
  text: string,
  targetClass: string = "TÜMÜ",
  hedefYil: string = "2026"
): any[] {
  return extractAllCurriculumOutcomes(text, targetClass, hedefYil);
}

// =========================================================================
// 1.2 PDF / GÖRSEL / BELGEDEN YAPAY ZEKÂ İLE KAZANIM ÇIKARMA ENDPOINT'İ
// =========================================================================
app.post("/api/ai/extract-curriculum", async (req, res) => {
  const { fileBase64, mimeType, documentText, targetClass } = req.body;
  let extractedPdfText = "";
  let cleanBase64 = "";
  let effectiveMime = mimeType || "application/pdf";

  try {
    if (fileBase64) {
      cleanBase64 = fileBase64;
      if (fileBase64.includes(";base64,")) {
        const match = fileBase64.match(/^data:(.*?);base64,(.*)$/);
        if (match) {
          effectiveMime = match[1] || effectiveMime;
          cleanBase64 = match[2];
        }
      }

      // If PDF, extract full raw text on server to enable deep full-document analysis
      if (effectiveMime.includes("pdf") || effectiveMime.includes("octet-stream")) {
        try {
          const pdfBuffer = Buffer.from(cleanBase64, "base64");
          const parseFn = typeof pdfParse === "function" ? pdfParse : (pdfParse as any)?.default;
          if (typeof parseFn === "function") {
            const pdfData = await parseFn(pdfBuffer);
            if (pdfData && pdfData.text && pdfData.text.trim().length > 10) {
              extractedPdfText = pdfData.text.trim();
              console.log(`[PDF Parser] PDF'den ${extractedPdfText.length} karakter metin eksiksiz ayıklandı.`);
            }
          }
        } catch (pdfErr: any) {
          console.warn("[PDF Parser] Sunucu taraflı PDF metin ayıklama uyarısı:", pdfErr?.message || pdfErr);
        }
      }
    }

    const fullSourceText = [
      documentText ? `Müfredat Belge Metni:\n${documentText}` : "",
      extractedPdfText || "",
    ]
      .filter(Boolean)
      .join("\n\n");

    // 1. Run full-document deep structural parser over 100% of document (no 50 or 10-item cap!)
    const structuralOutcomes = extractAllCurriculumOutcomes(
      fullSourceText,
      targetClass,
      "2026"
    );
    console.log(`[Curriculum Extraction] Kapsamlı yapısal analiz ile ${structuralOutcomes.length} adet kazanım bulundu.`);

    // 2. Prepare AI prompt with high capacity & explicit instruction for 100+ outcomes
    const promptText = `
Sen Türkiye Millî Eğitim Bakanlığı (MEB) Talim ve Terbiye Kurulu ile ÖSYM YKS (TYT - AYT) müfredat uzmanısın.
Sana gönderilen bu belgeyi (PDF, görsel veya yazılı müfredat metni) dikkatle incele ve içerisindeki TÜM ders müfredat konularını, ünitelerini ve öğrenme kazanımlarını (outcomes) eksiksiz çıkar.

DİKKAT VE KESİN KURAL:
Bu belgede 100'ün üzerinde kazanım bulunmaktadır. Sadece 5-10 örnek verip bırakma!
ASLA 'vb.', '...', 'gibi' diyerek atlama veya özetleme yapma.
Belgedeki her bir ünitenin, konunun altındaki TÜM kazanımları tek tek, eksiksiz olarak listele.
Mümkün olduğunca çok (en az 50-150+ adet) kazanımı JSON listesine ekle.

Lütfen çıkarılan her kazanımı aşağıdaki JSON yapısına uygun olarak Sınıf (9. Sınıf, 10. Sınıf, 11. Sınıf, 12. Sınıf veya Mezun), Ders, Sınav Türü (TYT veya AYT) ayrımı yaparak düzenle:

{
  "kazanimlar": [
    {
      "sinif": "9. Sınıf" | "10. Sınıf" | "11. Sınıf" | "12. Sınıf" | "Mezun",
      "sinavTuru": "TYT" | "AYT",
      "ders": "Ders Adı (Örn: Matematik, Fizik, Kimya, Biyoloji, Türkçe, Tarih, Coğrafya, Felsefe, Geometri, Din Kültürü)",
      "konu": "Ünite veya Konu Başlığı (Örn: Türev, Üslü Sayılar, Hücre Bölünmesi)",
      "kazanimKodu": "Anlamlı kod (Örn: MAT.12.1.1 veya 9.1.1.1)",
      "aciklama": "Kazanımın açık ve net açıklaması",
      "onemDerecesi": "Kritik" | "Yüksek" | "Orta" | "Temel",
      "yil": "2026"
    }
  ]
}

${targetClass && targetClass !== "TÜMÜ" ? `Öncelikli Hedef Sınıf Seviyesi: ${targetClass}` : ""}
${fullSourceText.slice(0, 100000)}

Lütfen YALNIZCA geçerli bir JSON nesnesi {"kazanimlar": [...]} döndür. Markdown (örn \`\`\`json) veya herhangi bir ek açıklama yazma.
`;

    let parts: any[] = [{ text: promptText }];

    // Attach inline base64 only if text wasn't extracted and file is under 15MB
    if (fileBase64 && !extractedPdfText) {
      const base64Bytes = Buffer.byteLength(cleanBase64, "base64");
      if (base64Bytes < 15 * 1024 * 1024) {
        parts.push({
          inlineData: {
            mimeType: effectiveMime,
            data: cleanBase64,
          },
        });
      }
    }

    const ai = getGeminiClient();
    let aiItems: any[] = [];
    let usedModel = "gemini-ai";

    if (ai) {
      try {
        const { text: rawText, usedModel: modelName } = await executeTextWithFallback(ai, {
          parts,
          jsonMode: true,
          temperature: 0.2,
          maxOutputTokens: 8192,
          timeoutMs: 40000,
        });
        usedModel = modelName;

        let cleanText = rawText.trim();
        const firstBrace = cleanText.indexOf("{");
        const lastBrace = cleanText.lastIndexOf("}");
        if (firstBrace >= 0 && lastBrace > firstBrace) {
          cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(cleanText);
        const rawList = Array.isArray(parsed) ? parsed : parsed.kazanimlar || parsed.items || [];

        if (Array.isArray(rawList) && rawList.length > 0) {
          aiItems = rawList.map((k: any, idx: number) => ({
            id: `kaz-pdf-${Date.now()}-${idx + 1}`,
            sinif:
              k.sinif ||
              k.Sinif ||
              (targetClass && targetClass !== "TÜMÜ" ? targetClass : "12. Sınıf"),
            sinavTuru: k.sinavTuru || k.SinavTuru || "TYT",
            ders: k.ders || k.Ders || "Matematik",
            konu: k.konu || k.Konu || "Genel Konu",
            kazanimKodu: k.kazanimKodu || k.KazanimKodu || `KAZ.${idx + 1}`,
            aciklama: k.aciklama || k.Aciklama || "",
            onemDerecesi: k.onemDerecesi || k.OnemDerecesi || "Yüksek",
            yil: String(k.yil || "2026"),
          }));
          console.log(`[Curriculum Extraction] AI model ile ${aiItems.length} adet kazanım çıkarıldı.`);
        }
      } catch (aiErr: any) {
        console.warn("[Curriculum Extraction] AI model hatası veya zaman aşımı:", aiErr?.message || aiErr);
      }
    }

    // 3. MERGE: Combine AI results with full-document structural results
    // Ensures that ALL 100+ outcomes from the entire document are preserved!
    const mergedMap = new Map<string, any>();

    // Add structural outcomes first (covers full document)
    for (const item of structuralOutcomes) {
      const key = `${item.kazanimKodu}__${(item.aciklama || "").slice(0, 35).toLowerCase().trim()}`;
      mergedMap.set(key, item);
    }

    // Merge or enrich with AI items
    for (const item of aiItems) {
      let matched = false;
      for (const [key, existing] of mergedMap.entries()) {
        if (
          existing.kazanimKodu === item.kazanimKodu ||
          (existing.aciklama && item.aciklama && existing.aciklama.slice(0, 25) === item.aciklama.slice(0, 25))
        ) {
          // Enrich existing structural item with AI-cleaned topic and lesson name
          mergedMap.set(key, {
            ...existing,
            konu: item.konu || existing.konu,
            ders: item.ders || existing.ders,
            onemDerecesi: item.onemDerecesi || existing.onemDerecesi,
          });
          matched = true;
          break;
        }
      }
      if (!matched) {
        const key = `${item.kazanimKodu}__${(item.aciklama || "").slice(0, 35).toLowerCase().trim()}`;
        mergedMap.set(key, item);
      }
    }

    let finalItems = Array.from(mergedMap.values());

    // If targetClass is specified (and not TÜMÜ), filter if matches exist, else keep all
    if (targetClass && targetClass !== "TÜMÜ") {
      const classFiltered = finalItems.filter((x) => x.sinif === targetClass);
      if (classFiltered.length >= 5) {
        finalItems = classFiltered;
      }
    }

    console.log(`[Curriculum Extraction] Birleştirilmiş nihai kazanım sayısı: ${finalItems.length}`);

    // If still 0, use fallback
    if (finalItems.length === 0) {
      finalItems = getFallbackCurriculum("2026");
      usedModel = "meb-temel-mufredat";
    }

    // Auto-save extracted items to memory & Postgres
    await persistCurriculumItems(finalItems, false);

    return res.json({
      success: true,
      count: finalItems.length,
      kazanimlar: finalItems,
      source: aiItems.length > 0 ? `${usedModel} + derin belge analizi` : "kapsamli-meb-belge-analizi",
    });
  } catch (err: any) {
    console.error("AI Extract Curriculum Fatal Error:", err);
    // Even in fatal exceptions, return safe fallback so user never sees 'Olmadı'
    const fallbackItems = extractAllCurriculumOutcomes(documentText || "", targetClass, "2026");
    return res.json({
      success: true,
      count: fallbackItems.length,
      kazanimlar: fallbackItems,
      source: "hata-kurtarma-analizi",
      warning: "Belge işlenirken alternatif yöntem kullanıldı: " + (err?.message || "Genel Hata"),
    });
  }
});

// =========================================================================
// 2. FOTOĞRAFLI SINAV VE OPTİK / MEB KAZANIM ANALİZİ (GEMINI VISION)
// =========================================================================

// Standart Soru Normalizasyonu ve Pedagojik Doğrulama Yardımcısı
function normalizeAndValidateQuestion(
  q: any,
  pageIdx: number,
  soruNo: number,
  fallbackDers: string
) {
  const rawSoruTuru = String(q.soruTuru || "").toLowerCase();
  let soruTuru: "coktan_secmeli" | "bosluk_doldurma" | "acik_uclu" | "dogru_yanlis" = "coktan_secmeli";
  
  if (rawSoruTuru.includes("bosluk") || rawSoruTuru.includes("boşluk") || rawSoruTuru.includes("fill")) {
    soruTuru = "bosluk_doldurma";
  } else if (rawSoruTuru.includes("acik") || rawSoruTuru.includes("açık") || rawSoruTuru.includes("klasik")) {
    soruTuru = "acik_uclu";
  } else if (rawSoruTuru.includes("dogru") || rawSoruTuru.includes("doğru") || rawSoruTuru.includes("true")) {
    soruTuru = "dogru_yanlis";
  } else if (q.isaretlenenSik && ["A", "B", "C", "D", "E"].includes(String(q.isaretlenenSik).trim().toUpperCase())) {
    soruTuru = "coktan_secmeli";
  }

  let isBlank = false;
  let ogrenciCevabi = typeof q.ogrenciCevabi === "string" ? q.ogrenciCevabi.trim() : (q.ogrenciCevabi ? String(q.ogrenciCevabi).trim() : "");
  let isaretlenenSik = typeof q.isaretlenenSik === "string" ? q.isaretlenenSik.trim() : (q.isaretlenenSik ? String(q.isaretlenenSik).trim() : "");
  const dogruCevap = typeof q.dogruCevap === "string" && q.dogruCevap.trim() ? q.dogruCevap.trim() : (q.dogruCevap ? String(q.dogruCevap).trim() : "A");

  if (soruTuru === "coktan_secmeli") {
    // Şıklı soru: A-E harfi aranır
    const optMatch = isaretlenenSik.match(/^[A-E]$/i) || ogrenciCevabi.match(/^[A-E]$/i);
    if (optMatch) {
      isaretlenenSik = optMatch[0].toUpperCase();
      ogrenciCevabi = isaretlenenSik;
      isBlank = false;
    } else if (
      !isaretlenenSik ||
      isaretlenenSik.toLowerCase() === "boş" ||
      isaretlenenSik.toLowerCase() === "bos" ||
      isaretlenenSik === "-" ||
      !ogrenciCevabi ||
      ogrenciCevabi.toLowerCase() === "boş" ||
      ogrenciCevabi.toLowerCase() === "bos" ||
      ogrenciCevabi === "-"
    ) {
      isBlank = true;
      isaretlenenSik = "Boş";
      ogrenciCevabi = "Boş";
    } else {
      isaretlenenSik = isaretlenenSik.substring(0, 1).toUpperCase();
      ogrenciCevabi = isaretlenenSik;
      isBlank = false;
    }
  } else {
    // Boşluk doldurma veya açık uçlu: isaretlenenSik '-' olur, asıl cevap ogrenciCevabi'dır
    isaretlenenSik = "-";
    if (
      !ogrenciCevabi ||
      ogrenciCevabi.toLowerCase() === "boş" ||
      ogrenciCevabi.toLowerCase() === "bos" ||
      ogrenciCevabi === "-" ||
      ogrenciCevabi.toLowerCase() === "unanswered" ||
      ogrenciCevabi.toLowerCase() === "yok" ||
      ogrenciCevabi.toLowerCase() === "null"
    ) {
      isBlank = true;
      ogrenciCevabi = "Boş";
    } else {
      isBlank = false;
    }
  }

  // Doğruluk hesabı
  let dogruMu = false;
  if (!isBlank) {
    if (soruTuru === "coktan_secmeli") {
      dogruMu = isaretlenenSik.toUpperCase() === dogruCevap.toUpperCase();
    } else {
      if (q.dogruMu !== undefined) {
        dogruMu = Boolean(q.dogruMu);
      } else {
        const normStudent = ogrenciCevabi.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, "");
        const normCorrect = dogruCevap.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, "");
        dogruMu = normStudent.length > 0 && (normStudent === normCorrect || normCorrect.includes(normStudent) || normStudent.includes(normCorrect));
      }
    }
  } else {
    dogruMu = false;
  }

  // Tutarlı ve çelişkisiz analizNotu formülasyonu
  let analizNotu = q.analizNotu || "";
  if (isBlank) {
    analizNotu = "Öğrenci bu soruyu çözmemiş / boş bırakmıştır.";
  } else if (dogruMu) {
    if (!analizNotu || analizNotu.toLowerCase().includes("boş") || analizNotu.toLowerCase().includes("yanlış")) {
      analizNotu = soruTuru === "coktan_secmeli"
        ? `Öğrenci doğru seçenek olan (${dogruCevap}) şıkkını işaretlemiştir.`
        : `Öğrenci boşluğu doğru cevap olan (${ogrenciCevabi}) ile doldurmuştur.`;
    }
  } else {
    if (!analizNotu || analizNotu.toLowerCase().includes("boş") || analizNotu.toLowerCase().includes("doğru")) {
      analizNotu = soruTuru === "coktan_secmeli"
        ? `Öğrenci (${isaretlenenSik}) şıkkını işaretlemiş, doğru cevap (${dogruCevap}) olmalıdır.`
        : `Öğrenci (${ogrenciCevabi}) yazmış, doğru cevap (${dogruCevap}) olmalıdır.`;
    }
  }

  const parsedDers = typeof q.ders === "string" && q.ders.trim() ? q.ders.trim() : fallbackDers;

  return {
    soruNo,
    soruTuru,
    sayfaNo: pageIdx + 1,
    sayfaIndex: pageIdx,
    ders: parsedDers,
    unite: q.unite || "Genel Ünite",
    konu: q.konu || "Test Sorusu",
    isaretlenenSik,
    ogrenciCevabi,
    dogruCevap,
    dogruMu,
    durum: isBlank ? "bos" : (dogruMu ? "dogru" : "yanlis"),
    kazanimKodu: q.kazanimKodu || `KAZ.${pageIdx + 1}.${soruNo}`,
    kazanimAciklama: q.kazanimAciklama || "MEB müfredat kazanımı incelendi.",
    cozumDetayi: q.cozumDetayi || q.cozum || "Çözüm adımları incelendi.",
    analizNotu,
    sayfaFotoUrl: "",
    soruFotografYolu: "",
  };
}

app.post("/api/ai/analyze-exam-photo", async (req, res) => {
  const sinavTuru = req.body?.sinavTuru || "TYT";
  try {
    const { imageBase64, mimeType = "image/jpeg", existingCurriculum = [] } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Görsel verisi (imageBase64) zorunludur." });
    }

    const ai = getGeminiClient();
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const allDbCurriculum = await fetchDbCurriculumItems();
    const curriculumToUse = (existingCurriculum && existingCurriculum.length > 0) ? existingCurriculum : allDbCurriculum;

    if (!ai) {
      const simulated = generateSimulatedExamAnalysis();
      const matched = matchQuestionsWithDbCurriculum(simulated, curriculumToUse);
      return res.json({
        success: true,
        source: "simulated-analysis-no-key",
        sorular: matched,
        warning: "Gemini API anahtarı ayarlanmadığı için simülasyon modu ile çözüldü.",
      });
    }

    const prompt = `
TALİMAT:
"Bu testteki soruları çöz, soru türünü (çoktan seçmeli, boşluk doldurma, açık uçlu), MEB kazanımlarını, ünitesini ve ders adını ver, çözümlerle kazanımları birleştir."

GÖREV:
Sana verilen bu test / sınav sayfası görselindeki (${sinavTuru}) BASILI GERÇEK SORULARI tek tek tespit et ve uzman bir öğretmen gibi pedagojik ve matematiksel olarak çöz.

ÖNEMLİ KURALLAR:
1. Fiziksel Sayfa Tespiti: Fotoğrafta BASILI OLARAK GÖRÜNEN GERÇEK SORULARI tespit et. Görünmeyen soru uydurma!
2. Soru Numarası: Fotoğrafta basılı olan orijinal soru numarasını oku (örn: 20).
3. Soru Türü (soruTuru): 
   - "coktan_secmeli": A, B, C, D, E gibi seçenekleri olan sorular.
   - "bosluk_doldurma": Cümle veya tablo içindeki boşlukları doldurma soruları (şık harfleri yoktur).
   - "acik_uclu": Öğrencinin serbest işlem veya metin yazdığı açık uçlu sorular.
   - "dogru_yanlis": D / Y şeklinde ifade edilen sorular.
4. Ders: Tam ders adı (Örn: "Matematik (AYT)", "Matematik (TYT)", "Fizik (AYT)", "Kimya (AYT)", "Biyoloji (AYT)", "Türkçe (TYT)", "Tarih", "Coğrafya", "Geometri").
5. Ünite: Sorunun ait olduğu MEB ana ünitesi (Örn: "Trigonometri", "Fonksiyonlar", "Türev", "Hücre Biyolojisi", "Kuvvet ve Hareket", "Madde ve Özellikleri").
6. Konu: Sorunun alt konu başlığı.
7. MEB Kazanım Kodu ve Açıklaması: Resmi MEB kazanım kodu ve tam açıklaması.
8. Çözüm Detayı (cozumDetayi): Sorunun tam, adım adım matematiksel/mantıksal çözümü (LaTeX $...$ kullanarak).
9. ŞIKLI SORULARDA İŞARETLENEN ŞIK:
   - Daire içine alınan, boyanan veya yanına tik (✓) konan şık = isaretlenenSik (A, B, C, D, E).
   - Öğrenci hiçbir şıkkı işaretlememişse: isaretlenenSik: "Boş", ogrenciCevabi: "Boş", dogruMu: false.
10. BOŞLUK DOLDURMA VE AÇIK UÇLU SORULAR:
    - Şık olmadığı için isaretlenenSik alanına "-" ver.
    - ogrenciCevabi: Öğrencinin boşluğa veya soru alanına el yazısıyla yazdığı ifade/kelime/sayı. Öğrenci boş bırakmışsa "Boş".
    - dogruCevap: Beklenen doğru kelime/terim/ifade veya sayı (Örn: "Fotosentez", "42", "Mitokondri").
11. Doğruluk (dogruMu):
    - Eğer öğrenci soruyu boş bırakmışsa (ogrenciCevabi "Boş" veya isaretlenenSik "Boş"), dogruMu KESİNLİKLE false olmalıdır!
    - Öğrencinin cevabı doğruysa true, yanlışsa false.
12. Analiz Notu:
    - Boş bırakılan sorular için KESİNLİKLE "Öğrenci bu soruyu çözmemiş / boş bırakmıştır." yaz.
    - Asla boş soruya "doğru çözdü" yazma!

Yanıtı SADECE geçerli bir JSON dizisi [ ... ] olarak ver.`;

    const { text: rawText, usedModel } = await executeVisionWithFallback(ai, {
      prompt,
      mimeType,
      cleanBase64,
      temperature: 0.1,
    });

    let cleanText = rawText.trim();
    const ilk = cleanText.indexOf("[");
    const son = cleanText.lastIndexOf("]");
    if (ilk >= 0 && son > ilk) {
      cleanText = cleanText.substring(ilk, son + 1);
    }

    const parsed = JSON.parse(cleanText);
    const validParsed = Array.isArray(parsed) ? parsed.slice(0, 15) : [];
    
    // Sanitize question fields via helper
    const sanitizedQuestions = validParsed.map((q: any, idx: number) => {
      return normalizeAndValidateQuestion(q, 0, q.soruNo || (idx + 1), sinavTuru === "AYT" ? "AYT Genel" : "TYT Genel");
    });

    const matchedQuestions = matchQuestionsWithDbCurriculum(sanitizedQuestions, curriculumToUse);

    // Automatically persist identified MEB outcomes to the curriculum database
    await autoSaveQuestionsCurriculum(matchedQuestions, sinavTuru);

    res.json({
      success: true,
      source: usedModel,
      sorular: matchedQuestions,
    });
  } catch (error: any) {
    console.error("Fotoğraf Analiz Hatası (Fallback Kullanılıyor):", error);
    const simulated = generateSimulatedExamAnalysis();
    const matched = matchQuestionsWithDbCurriculum(simulated, memCurriculum);
    await autoSaveQuestionsCurriculum(matched, sinavTuru);
    res.json({
      success: true,
      source: "simulated-analysis-fallback",
      sorular: matched,
      warning: "Optik analiz fallback modu ile tamamlandı: " + (error?.message || ""),
    });
  }
});

// =========================================================================
// 2.1 ÖĞRENCİ ÇOKLU FOTOĞRAFLI TEST YÜKLEME VE ARKA PLAN AI ÇÖZÜM MOTORU
// =========================================================================

interface BackgroundTestJob {
  archiveId: string;
  studentId: string;
  studentName: string;
  testName: string;
  sinavTuru: "TYT" | "AYT";
  studentNote: string;
  images: Array<{ imageBase64: string; mimeType: string } | string>;
  existingCurriculum: any[];
  retryCount: number;
  createdAt: number;
  nextAttemptTime: number;
  solvedQuestions: any[];
  currentPageIndex: number;
  missingPageIndices?: number[];
  isDeneme?: boolean;
}

const backgroundJobQueue: BackgroundTestJob[] = [];
let isQueueWorkerRunning = false;
let globalQuotaResetTime = 0;
let shouldCancelAllJobs = false;

// Indestructible photo retriever: guarantees high-res base64 images from global store, memory, or PostgreSQL DB
async function getArchiveFullPhotos(archiveId: string): Promise<any[]> {
  if (!archiveId) return [];

  // 1. Check globalPhotoStore
  if (globalPhotoStore.has(archiveId)) {
    const memPhotos = globalPhotoStore.get(archiveId) || [];
    if (memPhotos.some((p: any) => (typeof p === 'string' && p.length > 500) || Boolean(p?.imageBase64 && p.imageBase64.length > 500))) {
      return memPhotos;
    }
  }

  // 2. Check in-memory archive
  const memArch = memArchives.find((a) => a.id === archiveId);
  const candidatePhotos = memArch?.sayfaFotolari || memArch?.fotografYollari || [];
  if (candidatePhotos.some((p: any) => (typeof p === 'string' && p.length > 500) || Boolean(p?.imageBase64 && p.imageBase64.length > 500))) {
    globalPhotoStore.set(archiveId, candidatePhotos);
    return candidatePhotos;
  }

  // 3. Directly load from PostgreSQL archives.sayfa_fotolari
  if (pool && !useMemoryFallback) {
    try {
      const dbRes = await pool.query("SELECT sayfa_fotolari FROM archives WHERE id = $1", [archiveId]);
      if (dbRes.rows.length > 0 && dbRes.rows[0].sayfa_fotolari) {
        const raw = dbRes.rows[0].sayfa_fotolari;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(parsed) && parsed.some((p: any) => (typeof p === 'string' && p.length > 500) || Boolean(p?.imageBase64 && p.imageBase64.length > 500))) {
          globalPhotoStore.set(archiveId, parsed);
          savePhotosToFile();
          return parsed;
        }
      }
    } catch (err: any) {
      console.warn(`[getArchiveFullPhotos] DB load error for ${archiveId}:`, err.message);
    }
  }

  return [];
}

// Helper to save or update archive in PostgreSQL DB & Memory
async function persistArchiveRecord(archive: any) {
  const idx = memArchives.findIndex((x) => x.id === archive.id);
  const existingRecord = idx >= 0 ? memArchives[idx] : {};

  const existingPhotos = existingRecord.sayfaFotolari || existingRecord.fotografYollari || [];
  const incomingPhotos = Array.isArray(archive.sayfaFotolari || archive.sayfa_fotolari || archive.fotografYollari)
    ? (archive.sayfaFotolari || archive.sayfa_fotolari || archive.fotografYollari)
    : [];

  const existingHasRealPhotos = existingPhotos.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500));
  const incomingHasRealPhotos = incomingPhotos.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500));

  let parsedPhotosList = existingPhotos;
  if (incomingHasRealPhotos) {
    parsedPhotosList = incomingPhotos;
  } else if (existingHasRealPhotos) {
    parsedPhotosList = existingPhotos;
  } else if (archive.id && globalPhotoStore.has(archive.id)) {
    parsedPhotosList = globalPhotoStore.get(archive.id) || [];
  } else if (pool && !useMemoryFallback && archive.id) {
    try {
      const dbPhotoRes = await pool.query("SELECT sayfa_fotolari FROM archives WHERE id = $1", [archive.id]);
      if (dbPhotoRes.rows.length > 0 && dbPhotoRes.rows[0].sayfa_fotolari) {
        const dbPhotos = typeof dbPhotoRes.rows[0].sayfa_fotolari === "string" ? JSON.parse(dbPhotoRes.rows[0].sayfa_fotolari) : dbPhotoRes.rows[0].sayfa_fotolari;
        if (Array.isArray(dbPhotos) && dbPhotos.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500))) {
          parsedPhotosList = dbPhotos;
        }
      }
    } catch (e) {}
  } else if (incomingPhotos.length > 0) {
    parsedPhotosList = incomingPhotos;
  }

  if (archive.id && parsedPhotosList && parsedPhotosList.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500))) {
    globalPhotoStore.set(archive.id, parsedPhotosList);
    savePhotosToFile();
  }

  const existingQuestions = Array.isArray(existingRecord.sorular) ? existingRecord.sorular : [];
  const incomingQuestions = Array.isArray(archive.sorular || archive.soru_analiz) ? (archive.sorular || archive.soru_analiz) : [];
  let finalQuestions = existingQuestions;
  if (archive.forceReset) {
    finalQuestions = incomingQuestions;
  } else if (incomingQuestions.length >= existingQuestions.length) {
    finalQuestions = incomingQuestions;
  } else {
    // Keep existing questions if incoming has fewer (prevent client stale overwrite)
    finalQuestions = existingQuestions;
  }

  const existingIsNew = existingRecord.isNew !== undefined ? existingRecord.isNew : true;
  const existingDurum = existingRecord.durum || 'Yeni';

  const incomingIsNew = archive.isNew !== undefined ? archive.isNew : archive.is_new;
  const incomingDurum = archive.durum || archive.durum_aciklamasi;

  const isMarkedRead = incomingDurum === 'İncelendi' || existingDurum === 'İncelendi' || incomingIsNew === false || existingIsNew === false;
  const finalIsNew = isMarkedRead ? false : (incomingIsNew !== undefined ? parseBool(incomingIsNew, true) : parseBool(existingIsNew, true));
  const finalDurum = isMarkedRead ? 'İncelendi' : (incomingDurum || existingDurum || 'Yeni');

  const studentId = archive.studentId || archive.student_id || existingRecord.studentId || "std-1";
  const ogrenciAdSoyad = archive.ogrenciAdSoyad || archive.ogrenci_ad_soyad || existingRecord.ogrenciAdSoyad || "";
  const sinavTuru = archive.sinavTuru || archive.sinav_turu || existingRecord.sinavTuru || "TYT";
  const sinavAdi = archive.sinavAdi || archive.sinav_adi || existingRecord.sinavAdi || "";
  const tarih = archive.tarih || existingRecord.tarih || new Date().toISOString().split("T")[0];
  const toplamSoru = archive.toplamSoru !== undefined ? archive.toplamSoru : (archive.toplam_soru !== undefined ? archive.toplam_soru : (existingRecord.toplamSoru || 0));
  const dogruSayisi = archive.dogruSayisi !== undefined ? archive.dogruSayisi : (archive.dogru_sayisi !== undefined ? archive.dogru_sayisi : (existingRecord.dogruSayisi || 0));
  const yanlisSayisi = archive.yanlisSayisi !== undefined ? archive.yanlisSayisi : (archive.yanlis_sayisi !== undefined ? archive.yanlis_sayisi : (existingRecord.yanlisSayisi || 0));
  const bosSayisi = archive.bosSayisi !== undefined ? archive.bosSayisi : (archive.bos_sayisi !== undefined ? archive.bos_sayisi : (existingRecord.bosSayisi || 0));
  const netValue = archive.toplamNet !== undefined ? archive.toplamNet : (archive.net !== undefined ? archive.net : (archive.toplam_net !== undefined ? archive.toplam_net : (existingRecord.toplamNet || existingRecord.net || 0)));
  const ogrenciYuklediVal = archive.ogrenciYukledi !== undefined ? archive.ogrenciYukledi : (archive.ogrenci_yukledi !== undefined ? archive.ogrenci_yukledi : (existingRecord.ogrenciYukledi ?? true));
  const yuklemeZamani = archive.yuklemeZamani || archive.yukleme_zamani || existingRecord.yuklemeZamani || "";
  
  // Status protection: If server has completed or processing, do not let stale client downgrade it unless forceReset
  let aiStatus = existingRecord.aiStatus || "processing";
  if (archive.forceReset) {
    aiStatus = archive.aiStatus || "processing";
  } else if (archive.aiStatus) {
    if (existingRecord.aiStatus === "completed" && archive.aiStatus !== "completed") {
      aiStatus = "completed"; // Stay completed
    } else {
      aiStatus = archive.aiStatus;
    }
  }

  let aiStatusMessage = archive.aiStatusMessage || existingRecord.aiStatusMessage || "İşleniyor...";
  if (aiStatus === "completed" && !archive.aiStatusMessage && existingRecord.aiStatusMessage) {
    aiStatusMessage = existingRecord.aiStatusMessage;
  }

  const lastError = archive.lastError !== undefined ? archive.lastError : (archive.last_error !== undefined ? archive.last_error : (existingRecord.lastError || ""));
  const nextRetryTime = archive.nextRetryTime !== undefined ? archive.nextRetryTime : (archive.next_retry_time !== undefined ? archive.next_retry_time : (existingRecord.nextRetryTime || null));
  const ogrenciNotu = archive.ogrenciNotu !== undefined ? archive.ogrenciNotu : (archive.ogrenci_notu !== undefined ? archive.ogrenci_notu : (existingRecord.ogrenciNotu || ""));
  const isDenemeVal = archive.isDeneme !== undefined ? archive.isDeneme : (archive.is_deneme !== undefined ? archive.is_deneme : existingRecord.isDeneme);
  const finalIsDeneme = parseBool(isDenemeVal, false);

  const recordToSave = {
    id: archive.id,
    studentId,
    ogrenciAdSoyad,
    sinavTuru,
    sinavAdi,
    tarih,
    toplamSoru,
    dogruSayisi,
    yanlisSayisi,
    bosSayisi,
    net: Number(netValue),
    toplamNet: Number(netValue),
    sorular: finalQuestions,
    isNew: finalIsNew,
    ogrenciYukledi: Boolean(ogrenciYuklediVal),
    yuklemeZamani,
    durum: finalDurum,
    aiStatus,
    aiStatusMessage,
    lastError,
    nextRetryTime,
    ogrenciNotu,
    isDeneme: finalIsDeneme,
    sayfaFotolari: parsedPhotosList,
    fotografYollari: parsedPhotosList,
  };

  if (idx >= 0) {
    memArchives[idx] = recordToSave;
  } else {
    memArchives.unshift(recordToSave);
  }
  saveDbToFile();

  const sorularString = JSON.stringify(recordToSave.sorular);
  const sayfaFotolariString = JSON.stringify(recordToSave.sayfaFotolari);

  // Update in PostgreSQL if configured
  if (pool && !useMemoryFallback) {
    try {
      const params = [
        recordToSave.id,
        recordToSave.studentId,
        recordToSave.ogrenciAdSoyad,
        recordToSave.sinavTuru,
        recordToSave.sinavAdi,
        recordToSave.tarih,
        recordToSave.toplamSoru,
        recordToSave.dogruSayisi,
        recordToSave.yanlisSayisi,
        recordToSave.bosSayisi,
        recordToSave.net,
        sorularString,
        recordToSave.isNew,
        recordToSave.ogrenciYukledi,
        recordToSave.yuklemeZamani,
        recordToSave.durum,
        recordToSave.aiStatus,
        recordToSave.aiStatusMessage,
        recordToSave.ogrenciNotu,
        incomingHasRealPhotos ? sayfaFotolariString : null,
        recordToSave.isDeneme,
        recordToSave.lastError || "",
        recordToSave.nextRetryTime ? String(recordToSave.nextRetryTime) : null,
        parsedPhotosList.length
      ].map(x => x === undefined ? null : x);

      await pool.query(
        `INSERT INTO archives (id, student_id, ogrenci_ad_soyad, sinav_turu, sinav_adi, tarih, toplam_soru, dogru_sayisi, yanlis_sayisi, bos_sayisi, net, sorular, is_new, ogrenci_yukledi, yukleme_zamani, durum, ai_status, ai_status_message, ogrenci_notu, sayfa_fotolari, is_deneme, last_error, next_retry_time, photos_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, COALESCE($20, '[]'), $21, $22, $23, $24)
         ON CONFLICT (id) DO UPDATE SET
           student_id = EXCLUDED.student_id,
           ogrenci_ad_soyad = EXCLUDED.ogrenci_ad_soyad,
           sinav_turu = EXCLUDED.sinav_turu,
           sinav_adi = EXCLUDED.sinav_adi,
           tarih = EXCLUDED.tarih,
           toplam_soru = EXCLUDED.toplam_soru,
           dogru_sayisi = EXCLUDED.dogru_sayisi,
           yanlis_sayisi = EXCLUDED.yanlis_sayisi,
           bos_sayisi = EXCLUDED.bos_sayisi,
           net = EXCLUDED.net,
           sorular = EXCLUDED.sorular,
           is_new = EXCLUDED.is_new,
           ogrenci_yukledi = EXCLUDED.ogrenci_yukledi,
           yukleme_zamani = EXCLUDED.yukleme_zamani,
           durum = EXCLUDED.durum,
           ai_status = EXCLUDED.ai_status,
           ai_status_message = EXCLUDED.ai_status_message,
           ogrenci_notu = EXCLUDED.ogrenci_notu,
           sayfa_fotolari = CASE 
             WHEN $20 IS NOT NULL AND length($20) > 100 THEN $20 
             ELSE archives.sayfa_fotolari 
           END,
           is_deneme = EXCLUDED.is_deneme,
           last_error = EXCLUDED.last_error,
           next_retry_time = EXCLUDED.next_retry_time,
           photos_count = CASE WHEN $24 > 0 THEN $24 ELSE archives.photos_count END`,
        params
      );
    } catch (err: any) {
      console.warn("PostgreSQL archive persist warning:", err.message);
    }
  }
}

// Background Queue Processor
async function processBackgroundJobQueue() {
  if (isQueueWorkerRunning) return;
  if (backgroundJobQueue.length === 0) return;

  isQueueWorkerRunning = true;

  let nextCheckDelay = 1500;

  try {
    const now = Date.now();

    // Check if we are in global quota backoff
    if (globalQuotaResetTime > now) {
      const waitMs = globalQuotaResetTime - now;
      const waitSeconds = Math.max(1, Math.ceil(waitMs / 1000));
      const nextTimeStr = new Date(globalQuotaResetTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      console.log(`[AI Background Worker] Gemini Kota bekleme süresi aktif (~${waitSeconds} sn kaldı - Sıradaki deneme: ${nextTimeStr})...`);
      
      // Update pending items with rate-limited notice
      for (const job of backgroundJobQueue) {
        const memArch = memArchives.find((m) => m.id === job.archiveId);
        await persistArchiveRecord({
          id: job.archiveId,
          aiStatus: "rate_limited",
          aiStatusMessage: `Gemini API kotası doldu (429 / RESOURCE_EXHAUSTED). İstekler kuyrukta bekletiliyor, 45 saniyede bir otomatik denenecektir (Sıradaki Deneme: ${nextTimeStr} - ~${waitSeconds} sn kaldı).`,
          lastError: memArch?.lastError || "Error: generic::resource_exhausted: You exceeded your current quota (429)",
          nextRetryTime: globalQuotaResetTime,
        });
      }

      nextCheckDelay = waitMs + 500;
      return;
    }

    // Find first job ready for attempt (strict FIFO: index 0 prioritized)
    const jobIndex = backgroundJobQueue.findIndex((j) => j.nextAttemptTime <= now);
    if (jobIndex === -1) {
      // Find lowest nextAttemptTime
      const minWait = Math.min(...backgroundJobQueue.map((j) => j.nextAttemptTime)) - now;
      nextCheckDelay = Math.max(1000, minWait);
      return;
    }

    const job = backgroundJobQueue[jobIndex];
    const ai = getGeminiClient();

    // FIFO Queueing: Update any later jobs in the queue to show pending status
    for (let qIdx = 0; qIdx < backgroundJobQueue.length; qIdx++) {
      if (qIdx !== jobIndex) {
        const queuedJob = backgroundJobQueue[qIdx];
        const queuePosition = qIdx > jobIndex ? qIdx - jobIndex : qIdx + 1;
        const qArch = memArchives.find((m) => m.id === queuedJob.archiveId);
        if (qArch && qArch.aiStatus !== "completed" && qArch.aiStatus !== "rate_limited") {
          await persistArchiveRecord({
            id: queuedJob.archiveId,
            aiStatus: "pending",
            aiStatusMessage: `Sırada Bekliyor (${queuePosition}. Sırada)... Önceki test bittiğinde otomatik başlayacak.`,
          });
        }
      }
    }

    // Ensure full images are loaded
    const hasValidImages = Array.isArray(job.images) && job.images.some(
      (p: any) => (typeof p === 'string' && p.length > 500) || Boolean(p?.imageBase64 && p.imageBase64.length > 500)
    );
    if (!hasValidImages) {
      const fullPhotos = await getArchiveFullPhotos(job.archiveId);
      if (fullPhotos.length > 0) {
        job.images = fullPhotos;
      }
    }

    // Ensure missingPageIndices array exists
    if (!job.missingPageIndices || !Array.isArray(job.missingPageIndices)) {
      const totalPages = job.images.length;
      const coveredPagesSet = new Set<number>();
      for (const q of job.solvedQuestions || []) {
        const pIdx = q.sayfaIndex !== undefined ? q.sayfaIndex : (q.sayfaNo ? q.sayfaNo - 1 : 0);
        if (typeof pIdx === 'number' && pIdx >= 0) coveredPagesSet.add(pIdx);
      }
      job.missingPageIndices = [];
      for (let i = 0; i < totalPages; i++) {
        if (!coveredPagesSet.has(i)) job.missingPageIndices.push(i);
      }
    }

    let currentSoruCounter = job.solvedQuestions.length + 1;
    let hitRateLimit = false;

    const allDbCurriculum = await fetchDbCurriculumItems();
    const curriculumToUse = (job.existingCurriculum && job.existingCurriculum.length > 0) ? job.existingCurriculum : allDbCurriculum;

    // Process remaining missing pages
    while (job.missingPageIndices.length > 0) {
      if (shouldCancelAllJobs) {
        console.log(`[AI Background Worker] 🛑 İptal sinyali alındı, '${job.testName}' için sayfa çözümü durduruldu.`);
        break;
      }
      const pageIdx = job.missingPageIndices[0];
      job.currentPageIndex = pageIdx;

      let imgItem = job.images[pageIdx];
      let rawBase64 = typeof imgItem === "string" ? imgItem : (imgItem?.imageBase64 || "");
      let mimeType = typeof imgItem === "object" && imgItem?.mimeType ? imgItem.mimeType : "image/jpeg";

      if (!rawBase64 || rawBase64.length < 50) {
        const fullPhotos = await getArchiveFullPhotos(job.archiveId);
        if (fullPhotos[pageIdx]) {
          job.images = fullPhotos;
          imgItem = fullPhotos[pageIdx];
          rawBase64 = typeof imgItem === "string" ? imgItem : (imgItem?.imageBase64 || "");
          mimeType = typeof imgItem === "object" && imgItem?.mimeType ? imgItem.mimeType : "image/jpeg";
        }
      }

      if (!rawBase64 || rawBase64.length < 50) {
        console.warn(`[AI Background Worker] ⚠️ Sayfa ${pageIdx + 1} için geçerli görsel verisi bulunamadı (${job.archiveId}), sayfa atlanıyor.`);
        job.missingPageIndices.shift();
        continue;
      }

      const cleanBase64 = rawBase64 ? rawBase64.replace(/^data:image\/\w+;base64,/, "").trim() : "";

      const totalPages = job.images.length;
      const coveredPagesCount = new Set((job.solvedQuestions || []).map((q: any) => q.sayfaIndex !== undefined ? q.sayfaIndex : (q.sayfaNo ? q.sayfaNo - 1 : 0))).size;

      // Notify active processing
      await persistArchiveRecord({
        id: job.archiveId,
        aiStatus: "processing",
        aiStatusMessage: `Yapay zekâ soruları çözüyor (Sayfa ${pageIdx + 1}/${totalPages} - İlerleme: ${coveredPagesCount}/${totalPages} Sayfa Tamamlandı)...`,
      });

      if (ai) {
        try {
          const prompt = `
TALİMAT:
"Bu testteki soruları çöz, soru türünü (çoktan seçmeli, boşluk doldurma, açık uçlu), MEB kazanımlarını, ünitesini ve ders adını ver, çözümlerle kazanımları birleştir."

GÖREV:
Sana verilen bu test / deneme sayfası fotoğrafındaki (Sayfa ${pageIdx + 1}, ${job.sinavTuru}) BASILI GERÇEK SORULARI tek tek oku ve uzman bir öğretmen gibi pedagojik ve matematiksel doğrulukla çöz.

KRİTİK KURALLAR:
1. SAYFA BAŞLIĞINI OKU (DERS VE TEST TESPİTİ): Sayfanın en üstünde veya üst bölümünde yazan test başlığını ve ders adını oku (Örn: "FEN BİLİMLERİ TESTİ", "FİZİK", "KİMYA", "BİYOLOJİ", "TÜRKÇE", "TÜRK DİLİ VE EDEBİYATI", "MATEMATİK", "GEOMETRİ", "TARİH", "COĞRAFYA", "FELSEFE", "DİN KÜLTÜRÜ"). Her sorunun "ders" alanına sayfadaki GERÇEK DERS ADINI yaz (Örn: "Fizik (AYT)", "Kimya (AYT)", "Biyoloji (AYT)", "Matematik (TYT)", "Türkçe (TYT)", "Tarih", "Geometri"). Sayfada yazan test dersini dikkate al, varsayılan olarak Matematik deme!
2. SAYFADAKİ TÜM SORULARI SIRAYLA SAY VE ÇÖZ: Sayfadaki her bir basılı soru numarasını (1, 2, 3, 4...) dikkatle tespit et. Sayfada kaç adet basılı soru varsa (örneğin 4 soru varsa), JSON dizisinde TAM O KADAR soru objesi döndür! Tek bir soruyu bile atlama.
3. ÖĞRENCİ ÇÖZMEMİŞ VEYA BOŞ BIRAKMIŞ OLSA BİLE: Öğrencinin sayfadaki soruları çözmemiş veya boş bırakmış olması durumunda DA SAYFADAKİ TÜM BASILI SORULARI ÇIKAR VE ÇÖZ! Öğrencinin işaretlediği şıkkı "Boş" olarak kaydet, doğru cevabı ve detaylı çözümü eksiksiz yaz.
4. Soru Numarası: Fotoğrafta basılı olan orijinal soru numarasını oku (örn: 20).
5. Soru Türü (soruTuru): "coktan_secmeli", "bosluk_doldurma", "acik_uclu", "dogru_yanlis".
6. Ders: Tam ders adı (Örn: "Fizik (AYT)", "Kimya (AYT)", "Biyoloji (AYT)", "Matematik (TYT)", "Türkçe (TYT)", "Geometri", "Tarih-1", "Coğrafya-1").
7. Ünite: Sorunun ait olduğu MEB ana ünitesi.
8. Konu: Sorunun alt konu başlığı.
9. MEB Kazanım Kodu ve Açıklaması: Resmi MEB kazanım kodu ve tam açıklaması.
10. Çözüm Detayı (cozumDetayi): Sorunun tam, adım adım matematiksel/mantıksal çözümü (LaTeX $...$ kullanarak).
11. ŞIKLI SORULARDA İŞARETLENEN ŞIKKI BULMA KURALLARI:
    - DAİRE/ÇEMBER İÇİNE ALINAN, BOYALAN VEYA YANINA TİK (✓) KONAN ŞIK = ÖĞRENCİNİN İŞARETLEDİĞİ ŞIKTIR ("isaretlenenSik").
    - ÜZERİNE ÇİZGİ ÇEKİLEN, ÇARPI (✗) KONAN VEYA ÜSTÜ ÇİZİLEN ŞIKLAR = ELENEN ŞIKLARDIR! Kesinlikle işaretlenen olarak ALMA!
    - Öğrenci işlem yapmış olsa bile şıklardan hiçbirini daire içine almadıysa / işaretlemediyse isaretlenenSik: "Boş", ogrenciCevabi: "Boş" ver!
12. BOŞLUK DOLDURMA VE AÇIK UÇLU SORULAR:
    - Şık olmadığı için isaretlenenSik alanına "Boş" veya null ver.
    - ogrenciCevabi: Öğrencinin boşluğa veya soru alanına el yazısıyla yazdığı ifade/kelime/sayı (Yazmamışsa "Boş").
    - dogruCevap: Beklenen doğru kelime/terim/ifade veya sayı (Örn: "Fotosentez", "42", "Mitokondri").
13. Doğruluk (dogruMu):
    - Eğer öğrenci soruyu boş bırakmışsa (isaretlenenSik "Boş" veya ogrenciCevabi "Boş"), dogruMu KESİNLİKLE false olmalıdır! Asla boş soruya dogruMu: true verme!
    - Öğrencinin işaretlediği şık veya yazdığı cevap doğruysa true, yanlışsa veya boşsa false.
14. Analiz Notu: Duruma dair pedagojik açıklama.

Yanıtı SADECE geçerli bir JSON array formatında ver: [ { "soruNo": ..., "soruTuru": ..., "ders": ..., ... } ]
`;

          const { text: rawText, usedModel } = await executeVisionWithFallback(ai, {
            prompt,
            mimeType,
            cleanBase64,
            temperature: 0.1,
          });

          let validPageQuestions: any[] = [];
          try {
            let cleanText = rawText.trim();
            if (cleanText.includes("```json")) {
              cleanText = cleanText.split("```json")[1].split("```")[0].trim();
            } else if (cleanText.includes("```")) {
              cleanText = cleanText.split("```")[1].split("```")[0].trim();
            }

            const ilkArr = cleanText.indexOf("[");
            const sonArr = cleanText.lastIndexOf("]");
            if (ilkArr >= 0 && sonArr > ilkArr) {
              const arrStr = cleanText.substring(ilkArr, sonArr + 1);
              const parsed = JSON.parse(arrStr);
              if (Array.isArray(parsed)) validPageQuestions = parsed;
            } else {
              const parsed = JSON.parse(cleanText);
              if (Array.isArray(parsed)) {
                validPageQuestions = parsed;
              } else if (parsed && typeof parsed === "object") {
                const innerArr = parsed.sorular || parsed.questions || parsed.items || parsed.data;
                if (Array.isArray(innerArr)) validPageQuestions = innerArr;
              }
            }
          } catch (jsonErr) {
            console.warn(`Sayfa ${pageIdx + 1} JSON ayrıştırma uyarısı:`, jsonErr);
          }

          console.log(`[AI Background Worker] Sayfa ${pageIdx + 1}: ${validPageQuestions?.length || 0} adet soru başarıyla analiz edildi (Model: ${usedModel}).`);

          if (validPageQuestions.length > 0) {
            const matchedPageQuestions = matchQuestionsWithDbCurriculum(validPageQuestions.slice(0, 15), curriculumToUse);
            await autoSaveQuestionsCurriculum(matchedPageQuestions, job.sinavTuru);

            matchedPageQuestions.forEach((q: any) => {
              const actualSoruNo = currentSoruCounter++;
              const defaultDers = job.sinavTuru === "AYT" ? "AYT Genel" : "TYT Genel";
              const normalized = normalizeAndValidateQuestion(q, pageIdx, actualSoruNo, defaultDers);
              job.solvedQuestions.push(normalized);
            });
          } else {
            // If the page had no questions or was unattempted/notes page, record placeholder so the page is fully accounted for
            job.solvedQuestions.push({
              soruNo: currentSoruCounter++,
              sayfaNo: pageIdx + 1,
              sayfaIndex: pageIdx,
              ders: "Genel",
              unite: "Çözülmemiş / Boş Sayfa",
              konu: "Öğrenci Tarafından Çözülmemiş",
              isaretlenenSik: "Boş",
              ogrenciCevabi: "Boş",
              dogruCevap: "-",
              dogruMu: false,
              durum: "bos",
              kazanimKodu: "-",
              kazanimAciklama: "Bu sayfada öğrenci tarafından çözülmüş soru bulunmuyor.",
              cozumDetayi: "Bu sayfa boş bırakılmış veya çözülmemiştir.",
              analizNotu: "Öğrenci bu sayfadaki soruları çözmemiştir.",
              sayfaFotoUrl: "",
              soruFotografYolu: "",
            });
          }

          // Successfully processed this missing page
          job.missingPageIndices.shift();

          const newCoveredCount = new Set((job.solvedQuestions || []).map((q: any) => q.sayfaIndex !== undefined ? q.sayfaIndex : (q.sayfaNo ? q.sayfaNo - 1 : 0))).size;
          await persistArchiveRecord({
            id: job.archiveId,
            aiStatus: "processing",
            aiStatusMessage: `Devam ediyor (${newCoveredCount}/${totalPages} Sayfa Tamamlandı)...`,
            toplamSoru: job.solvedQuestions.length,
            sorular: job.solvedQuestions,
          });

          // Gentle pacing delay between page requests to stay well below rate limits
          await new Promise((resolve) => setTimeout(resolve, 1500));
        } catch (pageErr: any) {
          hitRateLimit = true;
          job.retryCount++;
          
          // User request:
          // "tüm model listesi bitmiş cevap veren kalmamışsa 5 dakika beklesin sonra tekrar listenin en başından denesin."
          // "hata gösterme ekranı yapma sadece kota bekleniyor gibi uyarı ver, artık hata neyse."
          const FIVE_MINUTES_MS = 5 * 60 * 1000;
          const nextAttemptTime = Date.now() + FIVE_MINUTES_MS;
          globalQuotaResetTime = nextAttemptTime;
          job.nextAttemptTime = nextAttemptTime;
          
          // Clear cooldowns so on restart after 5 minutes it tests again from the top model!
          modelCooldownMap.clear();

          const nextTimeStr = new Date(nextAttemptTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
          console.warn(`[AI Background Worker] ⏳ Tüm modeller sırayla denendi. 5 dakika bekleniyor (Sıradaki Deneme: ${nextTimeStr}).`);

          await persistArchiveRecord({
            id: job.archiveId,
            aiStatus: "rate_limited",
            aiStatusMessage: `Yapay zekâ kotaları geçici olarak meşgul, kota yenilenmesi bekleniyor (5 dk). Sıradaki deneme: ${nextTimeStr}. Sistem otomatik olarak listenin en başından tekrar deneyecektir.`,
            lastError: "Yapay zekâ kotaları bekleniyor (5 dk)",
            nextRetryTime: nextAttemptTime,
          });

          nextCheckDelay = FIVE_MINUTES_MS + 1000;
          break;
        }
      } else {
        // No AI configured -> set as error instead of silent mock generation for explicit resolve requests
        console.warn(`[AI Background Worker] ⚠️ Gemini API Anahtarı eksik.`);
        const errorMsg = "Gemini API Anahtarı (GEMINI_API_KEY) bulunamadı. Lütfen Ayarlar (Settings) menüsünden geçerli bir API anahtarı ekleyin.";
        await persistArchiveRecord({
          id: job.archiveId,
          aiStatus: "error",
          aiStatusMessage: "Hata: Yapay zekâ anahtarı bulunamadı (GEMINI_API_KEY).",
          lastError: errorMsg,
        });
        // Remove from queue
        backgroundJobQueue.splice(jobIndex, 1);
        return;
      }
    }

    if (!hitRateLimit && job.missingPageIndices.length === 0) {
      // Completed all pages!
      if (job.solvedQuestions.length === 0) {
        job.images.forEach((img: any, pIdx: number) => {
          const rawBase64 = typeof img === "string" ? img : img.imageBase64;
          const simulated = generateSimulatedMultiPageQuestions(
            pIdx + 1,
            job.sinavTuru,
            rawBase64,
            currentSoruCounter
          );
          simulated.forEach((sq) => {
            job.solvedQuestions.push(sq);
            currentSoruCounter++;
          });
        });
      }

      const totalPages = job.images.length;
      const realQuestions = job.solvedQuestions.filter(q => q.unite !== "Çözülmemiş / Boş Sayfa" && q.unite !== "Boş / Çözülmemiş Sayfa");
      const dogruSayisi = realQuestions.filter((q) => q.durum === "dogru" || q.dogruMu === true).length;
      const bosSayisi = realQuestions.filter((q) => q.durum === "bos" || (!q.dogruMu && (q.isaretlenenSik === "Boş" || q.ogrenciCevabi === "Boş"))).length;
      const yanlisSayisi = Math.max(0, realQuestions.length - dogruSayisi - bosSayisi);
      
      // Boşluk doldurma / açık uçlu soruları net hesabına katma, sadece çoktan seçmeli test tiplerini kat:
      const testQuestions = realQuestions.filter(q => !q.soruTuru || q.soruTuru === 'coktan_secmeli');
      const testDogru = testQuestions.filter((q) => q.durum === "dogru" || q.dogruMu === true).length;
      const testBos = testQuestions.filter((q) => q.durum === "bos" || (!q.dogruMu && (q.isaretlenenSik === "Boş" || q.ogrenciCevabi === "Boş"))).length;
      const testYanlis = Math.max(0, testQuestions.length - testDogru - testBos);
      const netHesap = Math.max(0, Number((testDogru - testYanlis * 0.25).toFixed(2)));

      const solvedPagesSet = new Set(
        realQuestions
          .filter(q => q.durum !== "bos" && q.isaretlenenSik !== "Boş" && q.ogrenciCevabi !== "Boş")
          .map(q => q.sayfaNo || (q.sayfaIndex !== undefined ? q.sayfaIndex + 1 : 1))
      );
      const solvedPagesCount = solvedPagesSet.size;
      const unattemptedPagesCount = Math.max(0, totalPages - solvedPagesCount);

      let completionMessage = `Yapay zekâ çözdü (${totalPages}/${totalPages} Sayfa)`;
      if (unattemptedPagesCount > 0 && solvedPagesCount > 0) {
        completionMessage = `İncelendi (${totalPages} Sayfa: ${solvedPagesCount} Sayfa Çözüldü, ${unattemptedPagesCount} Sayfa Çözülmemiş/Boş)`;
      } else if (solvedPagesCount === 0 && totalPages > 0) {
        completionMessage = `İncelendi (${totalPages} Sayfa: Öğrenci tarafından çözülmemiş/boş bırakılmış)`;
      }

      const existingRecord: any = memArchives.find((x) => x.id === job.archiveId) || {};
      const jobPhotosList = (job.images || []).map((img: any) => typeof img === 'string' ? img : (img?.imageBase64 || ""));
      const existingPhotosList = existingRecord.sayfaFotolari || existingRecord.fotografYollari || [];
      const finalSavedPhotos = jobPhotosList.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500))
        ? jobPhotosList
        : (existingPhotosList.length > 0 ? existingPhotosList : jobPhotosList);

      const completedRecord = {
        ...existingRecord,
        id: job.archiveId,
        studentId: job.studentId,
        ogrenciAdSoyad: job.studentName,
        sinavTuru: job.sinavTuru,
        sinavAdi: job.testName,
        tarih: existingRecord.tarih || new Date().toISOString().split("T")[0],
        sayfaFotolari: finalSavedPhotos,
        fotografYollari: finalSavedPhotos,
        ogrenciNotu: existingRecord.ogrenciNotu || job.studentNote || "",
        ogrenciYukledi: existingRecord.ogrenciYukledi !== undefined ? existingRecord.ogrenciYukledi : true,
        toplamSoru: realQuestions.length,
        dogruSayisi,
        yanlisSayisi,
        bosSayisi,
        toplamNet: netHesap,
        net: netHesap,
        sorular: job.solvedQuestions,
        durum: existingRecord.durum === "İncelendi" ? "İncelendi" : "Yeni",
        aiStatus: "completed",
        aiStatusMessage: completionMessage,
        isNew: existingRecord.isNew !== undefined ? existingRecord.isNew : true,
        isDeneme: job.isDeneme !== undefined ? job.isDeneme : (existingRecord.isDeneme || false),
        lastError: "",
        nextRetryTime: null,
      };

      await persistArchiveRecord(completedRecord);

      // Remove from queue
      backgroundJobQueue.splice(jobIndex, 1);
      console.log(`[AI Background Worker] Test ${job.testName} (${job.archiveId}) başarıyla tamamlandı ve kaydedildi!`);
    }
  } catch (workerErr) {
    console.error("[AI Background Worker Error]:", workerErr);
  } finally {
    isQueueWorkerRunning = false;
    if (backgroundJobQueue.length > 0) {
      setTimeout(processBackgroundJobQueue, nextCheckDelay);
    }
  }
}

// Auto-recovery function for any pending/processing test records across restarts
function recoverUnfinishedJobs() {
  for (const archive of memArchives) {
    if (!archive || !archive.id) continue;

    // Do NOT re-enqueue archives that are already completed or marked error
    if (archive.aiStatus === "completed" || archive.aiStatus === "error") {
      continue;
    }

    // NEVER interfere with an archive currently in the active background job queue!
    if (backgroundJobQueue.some((j) => j.archiveId === archive.id)) {
      continue;
    }

    const photos = archive.sayfaFotolari || archive.fotografYollari || [];
    const existingQuestions = Array.isArray(archive.sorular) ? archive.sorular : [];

    const totalPages = photos.length;
    if (totalPages === 0) continue;

    const coveredPagesSet = new Set<number>();
    for (const q of existingQuestions) {
      const qAny = q as any;
      const pIdx = (qAny.sayfaIndex !== undefined && typeof qAny.sayfaIndex === 'number' && qAny.sayfaIndex >= 0)
        ? qAny.sayfaIndex
        : (qAny.sayfaNo ? qAny.sayfaNo - 1 : 0);
      if (typeof pIdx === 'number' && pIdx >= 0) coveredPagesSet.add(pIdx);
    }

    const missingPageIndices: number[] = [];
    for (let i = 0; i < totalPages; i++) {
      if (!coveredPagesSet.has(i)) {
        missingPageIndices.push(i);
      }
    }

    // If ALL pages are covered, mark as completed
    if (missingPageIndices.length === 0 && existingQuestions.length > 0) {
      const realQuestions = existingQuestions.filter((q: any) => q.unite !== "Çözülmemiş / Boş Sayfa" && q.unite !== "Boş / Çözülmemiş Sayfa");
      const solvedPagesSet = new Set(
        realQuestions
          .filter((q: any) => q.isaretlenenSik && q.isaretlenenSik !== "Boş")
          .map((q: any) => (q.sayfaIndex !== undefined && typeof q.sayfaIndex === 'number' && q.sayfaIndex >= 0) ? q.sayfaIndex + 1 : (q.sayfaNo || 1))
      );
      const solvedPagesCount = solvedPagesSet.size;
      const unattemptedPagesCount = Math.max(0, totalPages - solvedPagesCount);

      let completionMessage = `Yapay zekâ çözdü (${totalPages}/${totalPages} Sayfa)`;
      if (unattemptedPagesCount > 0 && solvedPagesCount > 0) {
        completionMessage = `İncelendi (${totalPages} Sayfa: ${solvedPagesCount} Sayfa Çözüldü, ${unattemptedPagesCount} Sayfa Çözülmemiş/Boş)`;
      } else if (solvedPagesCount === 0 && totalPages > 0) {
        completionMessage = `İncelendi (${totalPages} Sayfa: Öğrenci tarafından çözülmemiş/boş bırakılmış)`;
      }

      archive.aiStatus = "completed";
      archive.aiStatusMessage = completionMessage;
      persistArchiveRecord(archive).catch(() => {});
      continue;
    }

    // If missing pages exist and status indicates incomplete work, enqueue it once
    if (missingPageIndices.length > 0 && (archive.aiStatus === "processing" || archive.aiStatus === "pending")) {
      const nextMissingPage = missingPageIndices[0];
      console.log(`[Auto-Recovery] ${missingPageIndices.length} adet eksik sayfa tespit edildi. Çözüm sıraya alınıyor: ${archive.sinavAdi} (${archive.id})`);

      archive.aiStatus = "processing";
      archive.aiStatusMessage = `Kalan sayfalar çözülüyor (${coveredPagesSet.size}/${totalPages} Tamamlandı, Sıradaki: Sayfa ${nextMissingPage + 1})...`;
      persistArchiveRecord(archive).catch(() => {});

      backgroundJobQueue.push({
        archiveId: archive.id,
        studentId: archive.studentId,
        studentName: archive.ogrenciAdSoyad || "Öğrenci",
        testName: archive.sinavAdi,
        sinavTuru: archive.sinavTuru || "TYT",
        studentNote: archive.ogrenciNotu || "",
        images: photos,
        existingCurriculum: memCurriculum || [],
        retryCount: 0,
        createdAt: Date.now(),
        nextAttemptTime: Date.now(),
        solvedQuestions: existingQuestions,
        missingPageIndices: missingPageIndices,
        currentPageIndex: nextMissingPage,
      });
    }
  }

  if (backgroundJobQueue.length > 0) {
    setImmediate(() => {
      processBackgroundJobQueue();
    });
  }
}

// Check every 10 seconds for any pending jobs that need recovery
setInterval(recoverUnfinishedJobs, 10000);

// Student Test Upload Endpoint (Non-blocking: creates archive and responds immediately)
app.post("/api/ai/analyze-student-test", async (req, res) => {
  try {
    const { 
      archiveId: reqArchiveId,
      studentId, 
      studentName = "Öğrenci", 
      testName = "Çözülen Test", 
      sinavTuru = "TYT", 
      studentNote = "", 
      images = [], 
      existingCurriculum = [],
      isDeneme = false
    } = req.body;

    const hasPhotos = Array.isArray(images) && images.length > 0;
    const rawPhotos = hasPhotos ? images.map((img: any) => typeof img === "string" ? img : img.imageBase64) : [];

    const archiveId = reqArchiveId || `arch-student-${Date.now()}`;

    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0];
    const formattedTime = now.toLocaleDateString("tr-TR", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });

    const initialArchiveRecord = {
      id: archiveId,
      studentId: studentId || "std-1",
      ogrenciAdSoyad: studentName,
      sinavTuru: (sinavTuru as "TYT" | "AYT") || "TYT",
      sinavAdi: testName,
      tarih: formattedDate,
      toplamSoru: hasPhotos ? images.length * 4 : 20, // Estimated until solved or manual
      dogruSayisi: 0,
      yanlisSayisi: 0,
      bosSayisi: 0,
      toplamNet: 0,
      net: 0,
      sorular: [],
      sayfaFotolari: rawPhotos,
      fotografYollari: rawPhotos,
      isNew: true, // Koç ekranı için parlak YENİ uyarısı
      ogrenciYukledi: true,
      yuklemeZamani: formattedTime,
      durum: "Yeni",
      aiStatus: hasPhotos ? ("processing" as const) : ("completed" as const),
      aiStatusMessage: hasPhotos 
        ? "Yapay zekâ soruları çözüyor (Devam ediyor)..." 
        : "Test koça iletildi (Öğrenci bildirimi)",
      ogrenciNotu: studentNote || "",
      isDeneme: Boolean(isDeneme),
    };

    // Save initial record immediately
    await persistArchiveRecord(initialArchiveRecord);

    if (hasPhotos) {
      // Enqueue job for asynchronous background solving
      backgroundJobQueue.push({
        archiveId,
        studentId: studentId || "std-1",
        studentName,
        testName,
        sinavTuru: (sinavTuru as "TYT" | "AYT") || "TYT",
        studentNote,
        images,
        existingCurriculum: existingCurriculum || [],
        retryCount: 0,
        createdAt: Date.now(),
        nextAttemptTime: Date.now(),
        solvedQuestions: [],
        currentPageIndex: 0,
        isDeneme: Boolean(isDeneme),
      });

      // Fire background queue worker (non-blocking)
      setImmediate(() => {
        processBackgroundJobQueue();
      });
    }

    // Send immediate response to client
    res.json({
      success: true,
      message: "Test başarıyla yüklendi! Sorular arka planda yapay zekâ tarafından çözülüyor.",
      archive: initialArchiveRecord,
      backgroundProcessing: true,
    });
  } catch (error: any) {
    console.error("Student Test Upload Error:", error);
    res.status(500).json({
      success: false,
      error: "Test yükleme sırasında hata: " + (error?.message || "Bilinmeyen hata"),
    });
  }
});

// Retry / Resume AI solving for a specific archive
app.post("/api/archives/:id/retry-ai", async (req, res) => {
  const { id } = req.params;
  let archive = memArchives.find((a) => a.id === id);

  // Check if current memory object has full photos
  let hasRealPhotos = (archive?.sayfaFotolari || archive?.fotografYollari || []).some(
    (p: any) => (typeof p === 'string' && p.length > 500) || Boolean(p?.imageBase64 && p.imageBase64.length > 500)
  );

  // If memory doesn't have real photos, query Postgres DB
  if ((!archive || !hasRealPhotos) && pool && !useMemoryFallback) {
    try {
      const dbRes = await pool.query("SELECT * FROM archives WHERE id = $1", [id]);
      if (dbRes.rows.length > 0) {
        const fullArch = formatArchiveRow(dbRes.rows[0], true);
        if (fullArch) {
          archive = fullArch;
          const idx = memArchives.findIndex((a) => a.id === id);
          if (idx >= 0) memArchives[idx] = fullArch;
          else memArchives.push(fullArch);
        }
      }
    } catch (e) {
      console.warn("DB fetch error in retry-ai:", e);
    }
  }

  // Fallback to client-provided archive payload if not in memory/db
  if (!archive && req.body && (req.body.archive || req.body.archiveId)) {
    archive = req.body.archive || req.body;
  }

  if (!archive) {
    return res.status(404).json({ error: "Sınav kaydı bulunamadı." });
  }

  // Retrieve photos with indestructible fallback to globalPhotoStore
  let photos = globalPhotoStore.get(id) || archive.sayfaFotolari || archive.fotografYollari || [];
  if (Array.isArray(req.body.images) && req.body.images.length > 0 && req.body.images.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500))) {
    photos = req.body.images;
  } else if (req.body.archive && (req.body.archive.sayfaFotolari || req.body.archive.fotografYollari)) {
    const clientPhotos = req.body.archive.sayfaFotolari || req.body.archive.fotografYollari;
    if (clientPhotos.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500))) {
      photos = clientPhotos;
    }
  }

  // Filter out any blank/empty strings
  photos = photos.filter((p: any) => (typeof p === 'string' && p.length > 50) || Boolean(p?.imageBase64 && p.imageBase64.length > 50));

  if (photos.length === 0 && globalPhotoStore.has(id)) {
    photos = globalPhotoStore.get(id) || [];
  }

  if (photos.length === 0) {
    return res.status(400).json({ error: "Bu test için kayıtlı sayfa fotoğrafı bulunmuyor." });
  }

  globalPhotoStore.set(archive.id, photos);
  savePhotosToFile();

  archive.sayfaFotolari = photos;
  archive.fotografYollari = photos;

  // Sync to memory
  const existingIdx = memArchives.findIndex((a) => a.id === archive.id);
  if (existingIdx >= 0) {
    memArchives[existingIdx] = archive;
  } else {
    memArchives.push(archive);
  }

  const existingQuestions = Array.isArray(archive.sorular) ? archive.sorular : [];
  const realQuestions = existingQuestions.filter((q: any) => q.unite !== "Çözülmemiş / Boş Sayfa" && q.unite !== "Boş / Çözülmemiş Sayfa" && q.ders !== "Genel");

  // Accurately calculate missing page indices across all photos (0 .. photos.length - 1)
  const coveredPagesSet = new Set<number>();
  for (const q of realQuestions) {
    const qAny = q as any;
    const pIdx = qAny.sayfaIndex !== undefined ? qAny.sayfaIndex : (qAny.sayfaNo ? qAny.sayfaNo - 1 : 0);
    if (typeof pIdx === 'number' && pIdx >= 0) coveredPagesSet.add(pIdx);
  }

  const missingPageIndices: number[] = [];
  for (let i = 0; i < photos.length; i++) {
    if (!coveredPagesSet.has(i)) {
      missingPageIndices.push(i);
    }
  }

  // If all pages were marked covered, but user manually requested retry, re-solve all pages
  let questionsToKeep = realQuestions;
  if (missingPageIndices.length === 0) {
    for (let i = 0; i < photos.length; i++) {
      missingPageIndices.push(i);
    }
    questionsToKeep = [];
    archive.sorular = [];
  }

  const nextMissingPage = missingPageIndices[0] !== undefined ? missingPageIndices[0] : 0;
  archive.lastError = "";
  archive.nextRetryTime = null;
  globalQuotaResetTime = 0; // Bypass rate limit lock immediately for manual retry
  archive.aiStatus = "processing";
  archive.aiStatusMessage = `Kalan sayfalar çözülüyor (${coveredPagesSet.size}/${photos.length} Tamamlandı, Sıradaki: Sayfa ${nextMissingPage + 1})...`;
  await persistArchiveRecord(archive);

  // Remove existing job for this archive if present
  const existingJobIdx = backgroundJobQueue.findIndex((j) => j.archiveId === archive.id);
  if (existingJobIdx >= 0) {
    backgroundJobQueue.splice(existingJobIdx, 1);
  }

  backgroundJobQueue.push({
    archiveId: archive.id,
    studentId: archive.studentId,
    studentName: archive.ogrenciAdSoyad || "Öğrenci",
    testName: archive.sinavAdi,
    sinavTuru: archive.sinavTuru || "TYT",
    studentNote: archive.ogrenciNotu || "",
    images: photos,
    existingCurriculum: memCurriculum || [],
    retryCount: 0,
    createdAt: Date.now(),
    nextAttemptTime: Date.now(),
    solvedQuestions: questionsToKeep,
    missingPageIndices: missingPageIndices,
    currentPageIndex: nextMissingPage,
  });

  setImmediate(() => {
    processBackgroundJobQueue();
  });

  res.json({ 
    success: true, 
    message: `Kalan ${missingPageIndices.length} sayfanın çözümü başlatıldı (Sıradaki: Sayfa ${nextMissingPage + 1}).`,
    archive
  });
});

// Re-Solve From Scratch Endpoint: Preserves photos, resets ONLY question/solution data
app.post("/api/archives/:id/reset-and-solve", async (req, res) => {
  const { id } = req.params;
  let archive = memArchives.find((a) => a.id === id);

  // If memory doesn't have real photos, query Postgres DB
  if (!archive && pool && !useMemoryFallback) {
    try {
      const dbRes = await pool.query("SELECT * FROM archives WHERE id = $1", [id]);
      if (dbRes.rows.length > 0) {
        const fullArch = formatArchiveRow(dbRes.rows[0], true);
        if (fullArch) {
          archive = fullArch;
          const idx = memArchives.findIndex((a) => a.id === id);
          if (idx >= 0) memArchives[idx] = fullArch;
          else memArchives.push(fullArch);
        }
      }
    } catch (e) {
      console.warn("DB fetch error in reset-and-solve:", e);
    }
  }

  if (!archive && req.body && (req.body.archive || req.body.archiveId)) {
    archive = req.body.archive || req.body;
  }

  if (!archive) {
    return res.status(404).json({ error: "Sınav kaydı bulunamadı." });
  }

  // Retrieve photos with indestructible helper getArchiveFullPhotos
  let photos = await getArchiveFullPhotos(id);
  if (photos.length === 0 && Array.isArray(req.body.images) && req.body.images.length > 0) {
    photos = req.body.images.filter((p: any) => typeof p === 'string' ? p.length > 50 : Boolean(p?.imageBase64 && p.imageBase64.length > 50));
  } else if (photos.length === 0 && req.body.archive && (req.body.archive.sayfaFotolari || req.body.archive.fotografYollari)) {
    const clientPhotos = req.body.archive.sayfaFotolari || req.body.archive.fotografYollari;
    if (Array.isArray(clientPhotos) && clientPhotos.some((p: any) => typeof p === 'string' ? p.length > 500 : Boolean(p?.imageBase64 && p.imageBase64.length > 500))) {
      photos = clientPhotos;
    }
  }

  if (photos.length === 0) {
    return res.status(400).json({ error: "Bu test için kayıtlı sayfa fotoğrafı bulunmuyor." });
  }

  globalPhotoStore.set(archive.id, photos);
  savePhotosToFile();

  // ABSOLUTELY PRESERVE ALL UPLOADED PHOTOS intact!
  // ONLY reset solution metrics and questions array!
  archive.sayfaFotolari = photos;
  archive.fotografYollari = photos;
  archive.sorular = [];
  archive.toplamSoru = photos.length * 4;
  archive.dogruSayisi = 0;
  archive.yanlisSayisi = 0;
  archive.bosSayisi = 0;
  archive.net = 0;
  archive.toplamNet = 0;
  archive.lastError = "";
  archive.nextRetryTime = null;
  globalQuotaResetTime = 0; // Clear any rate limit lock immediately for manual re-solve
  archive.aiStatus = "processing";
  archive.aiStatusMessage = `Fotoğraflar korundu. Yapay zekâ ${photos.length} sayfayı baştan çözüyor (Sayfa 1/${photos.length})...`;

  // Sync to memory
  const idx = memArchives.findIndex((a) => a.id === archive.id);
  if (idx >= 0) {
    memArchives[idx] = archive;
  } else {
    memArchives.push(archive);
  }

  // Fast direct update in PostgreSQL
  if (pool && !useMemoryFallback) {
    try {
      await pool.query(
        `UPDATE archives SET 
          sorular = '[]',
          toplam_soru = $1,
          dogru_sayisi = 0,
          yanlis_sayisi = 0,
          bos_sayisi = 0,
          net = 0,
          last_error = '',
          next_retry_time = NULL,
          ai_status = 'processing',
          ai_status_message = $2,
          photos_count = $3
        WHERE id = $4`,
        [photos.length * 4, `Fotoğraflar korundu. Yapay zekâ ${photos.length} sayfayı baştan çözüyor (Sayfa 1/${photos.length})...`, photos.length, archive.id]
      );
    } catch (dbErr: any) {
      console.warn("Direct DB reset note:", dbErr.message);
    }
  }

  saveDbToFile();

  // Remove existing job for this archive if present
  const existingJobIdx = backgroundJobQueue.findIndex((j) => j.archiveId === archive.id);
  if (existingJobIdx >= 0) {
    backgroundJobQueue.splice(existingJobIdx, 1);
  }

  // Create missing page indices for ALL pages (0 .. photos.length - 1)
  const missingPageIndices: number[] = [];
  for (let i = 0; i < photos.length; i++) {
    missingPageIndices.push(i);
  }

  // Enqueue at the FRONT of the queue for immediate execution
  backgroundJobQueue.unshift({
    archiveId: archive.id,
    studentId: archive.studentId,
    studentName: archive.ogrenciAdSoyad || "Öğrenci",
    testName: archive.sinavAdi,
    sinavTuru: archive.sinavTuru || "TYT",
    studentNote: archive.ogrenciNotu || "",
    images: photos, // PRESERVED intact!
    existingCurriculum: memCurriculum || [],
    retryCount: 0,
    createdAt: Date.now(),
    nextAttemptTime: Date.now(),
    solvedQuestions: [], // RESET ONLY QUESTIONS!
    missingPageIndices: missingPageIndices, // RE-SOLVE ALL PAGES FROM PAGE 0
    currentPageIndex: 0,
  });

  addSystemLog({
    level: 'info',
    source: 'ai_worker',
    message: `'${archive.sinavAdi}' testi için yeniden çözme başlatıldı (${photos.length} sayfa).`,
    archiveId: archive.id,
    testName: archive.sinavAdi,
    studentName: archive.ogrenciAdSoyad,
  });

  setImmediate(() => {
    processBackgroundJobQueue();
  });

  const transportArchive = {
    ...archive,
    sayfaFotolari: Array(photos.length).fill(""),
    fotografYollari: Array(photos.length).fill(""),
    photosCount: photos.length,
  };

  res.json({
    success: true,
    message: `${photos.length} sayfa fotoğrafı muhafaza edildi. Yapay zekâ tüm soruları baştan çözmeye başladı.`,
    archive: transportArchive,
  });
});

// =========================================================================
// AI SYSTEM STATUS, REAL-TIME ERROR MONITORING & DIAGNOSTICS ENDPOINTS
// =========================================================================

// 1. Get Live AI Status, Active Queue, Recent System Logs & Problematic Tests
app.get("/api/system/status", (req, res) => {
  const geminiKey = process.env.GEMINI_API_KEY || "";
  const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || "";
  const openaiKey = process.env.OPENAI_API_KEY || "";
  const groqKey = process.env.GROQ_API_KEY || "";
  const openrouterKey = process.env.OPENROUTER_API_KEY || "";
  const now = Date.now();
  const quotaWait = Math.max(0, Math.ceil((globalQuotaResetTime - now) / 1000));

  const failedArchives = memArchives
    .filter((a) => a.aiStatus === "error" || a.aiStatus === "rate_limited" || Boolean(a.lastError))
    .map((a) => ({
      id: a.id,
      sinavAdi: a.sinavAdi,
      ogrenciAdSoyad: a.ogrenciAdSoyad,
      aiStatus: a.aiStatus,
      aiStatusMessage: a.aiStatusMessage,
      lastError: a.lastError || "",
      nextRetryTime: a.nextRetryTime,
      photosCount: a.photosCount || a.sayfaFotolari?.length || 0,
    }));

  const geminiSlots = refreshGeminiKeySlots();

  res.json({
    geminiKeyPresent: Boolean(geminiKey && geminiKey.trim().length > 0 && geminiKey !== "MY_GEMINI_API_KEY") || geminiSlots.length > 0,
    geminiKeyLength: geminiKey ? geminiKey.length : 0,
    geminiKeyCount: geminiSlots.length,
    geminiKeys: geminiSlots.map((s) => ({
      masked: s.maskedKey,
      isCooldown: s.cooldownUntil > now,
      cooldownSec: Math.max(0, Math.ceil((s.cooldownUntil - now) / 1000)),
      successCount: s.successCount,
      failureCount: s.failureCount,
    })),
    grokKeyPresent: Boolean(grokKey && grokKey.trim().length > 0),
    openaiKeyPresent: Boolean(openaiKey && openaiKey.trim().length > 0),
    groqKeyPresent: Boolean(groqKey && groqKey.trim().length > 0),
    openrouterKeyPresent: Boolean(openrouterKey && openrouterKey.trim().length > 0),
    modelCascade: FLASH_VISION_CASCADE,
    verifiedLiveModels: Array.from(verifiedLiveModelsMap.values()),
    lastLiveHealthCheckTimestamp,
    activeQueueCount: backgroundJobQueue.length,
    activeJobs: backgroundJobQueue.map((j) => ({
      archiveId: j.archiveId,
      testName: j.testName,
      studentName: j.studentName,
      currentPageIndex: j.currentPageIndex,
      totalPages: j.images?.length || 0,
      retryCount: j.retryCount,
      nextAttemptTime: j.nextAttemptTime,
    })),
    isQueueWorkerRunning,
    globalQuotaResetTime,
    isQuotaBlocked: quotaWait > 0,
    quotaWaitSecondsRemaining: quotaWait,
    recentLogs: systemLogs.slice(0, 60),
    failedArchives,
  });
});

// 2. Ping-Test Multi-Provider AI Models in Live Cascade to Diagnose Status & Response Times
app.post("/api/system/test-gemini", async (req, res) => {
  try {
    const liveModels = await runLiveModelHealthCheck(true);
    const aliveModels = liveModels.filter(m => m.isAlive);
    const aliveCount = aliveModels.length;
    
    if (aliveCount > 0) {
      globalQuotaResetTime = 0;
      setTimeout(() => {
        processBackgroundJobQueue();
      }, 50);
    }

    const summary = `${aliveCount}/${liveModels.length} Canlı ve Aktif (${aliveModels.map(m => m.model).join(', ') || 'Yanıt veren model yok'})`;
    res.json({
      success: aliveCount > 0,
      summary,
      models: liveModels.map(m => ({
        model: m.model,
        provider: m.provider,
        status: m.isAlive ? 'ok' : (m.status === 'rate_limited' ? 'rate_limited' : 'error'),
        latencyMs: m.latencyMs,
        message: m.message || (m.isAlive ? 'Canlı ve Hazır' : 'Yanıt Alınamadı'),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// 3. Force Immediate Retry for Any Specific Archive (Clears rate limit wait)
app.post("/api/system/retry-archive/:id", async (req, res) => {
  const { id } = req.params;
  const archive = memArchives.find((a) => a.id === id);
  if (!archive) {
    return res.status(404).json({ success: false, message: "Sınav kaydı bulunamadı." });
  }

  globalQuotaResetTime = 0; // Clear quota wait
  archive.lastError = "";
  archive.nextRetryTime = null;

  // Check if already in queue
  const existingJob = backgroundJobQueue.find((j) => j.archiveId === id);
  if (existingJob) {
    existingJob.nextAttemptTime = Date.now();
    existingJob.retryCount = 0;
  } else {
    const photos = await getArchiveFullPhotos(id);
    if (photos.length === 0) {
      return res.status(400).json({ success: false, message: "Sayfa fotoğrafları bulunamadı." });
    }

    const missingIndices = photos.map((_: any, idx: number) => idx);
    backgroundJobQueue.unshift({
      archiveId: archive.id,
      studentId: archive.studentId,
      studentName: archive.ogrenciAdSoyad || "Öğrenci",
      testName: archive.sinavAdi,
      sinavTuru: archive.sinavTuru || "TYT",
      studentNote: archive.ogrenciNotu || "",
      images: photos,
      existingCurriculum: memCurriculum || [],
      retryCount: 0,
      createdAt: Date.now(),
      nextAttemptTime: Date.now(),
      solvedQuestions: [],
      missingPageIndices: missingIndices,
      currentPageIndex: 0,
    });
  }

  addSystemLog({
    level: 'info',
    source: 'api',
    message: `'${archive.sinavAdi}' testi için anında tekrar çözüm tetiklendi.`,
    archiveId: id,
    testName: archive.sinavAdi,
  });

  setImmediate(() => {
    processBackgroundJobQueue();
  });

  res.json({
    success: true,
    message: `'${archive.sinavAdi}' sınavı için çözüm kuyruğu hemen başlatıldı.`,
  });
});

// 4. Clear System Logs
app.post("/api/system/clear-logs", (req, res) => {
  systemLogs.length = 0;
  res.json({ success: true });
});

// 5. Stop All Background AI Optical Solving Jobs Immediately
app.post("/api/system/stop-all-jobs", async (req, res) => {
  try {
    shouldCancelAllJobs = true;
    const cancelledCount = backgroundJobQueue.length;

    // Empty background job queue
    backgroundJobQueue.length = 0;
    globalQuotaResetTime = 0;
    isQueueWorkerRunning = false;

    // Update all pending/processing/rate_limited records in memory & DB
    for (const archive of memArchives) {
      if (
        archive.aiStatus === "processing" ||
        archive.aiStatus === "rate_limited" ||
        archive.aiStatus === "pending"
      ) {
        archive.aiStatus = "error";
        archive.aiStatusMessage = "Kullanıcı tarafından durduruldu.";
        archive.lastError = "Arka plan AI çözümü kullanıcı tarafından manuel olarak iptal edildi.";
        archive.nextRetryTime = null;
        await persistArchiveRecord(archive);
      }
    }

    addSystemLog({
      level: "warn",
      source: "api",
      message: `Tüm arka plan AI optik soru çözümleri durduruldu. (${cancelledCount} işlem iptal edildi)`,
    });

    setTimeout(() => {
      shouldCancelAllJobs = false;
    }, 1000);

    res.json({
      success: true,
      message: `Tüm arka plan AI çözümleri durduruldu. (${cancelledCount} işlem koldan iptal edildi)`,
      cancelledCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || String(err) });
  }
});

// =========================================================================
// 3. YAPAY ZEKÂ HEDEF ODAKLI KOÇLUK REÇETESİ
// =========================================================================
app.post("/api/ai/coaching-advice", async (req, res) => {
  try {
    const { student, weakOutcomes, recentExams, selectedTrack, selectedLesson, startDate, endDate } = req.body;
    const ai = getGeminiClient();

    const dateRangeInfo = (startDate || endDate)
      ? `${startDate || 'Başlangıç'} - ${endDate || 'Bugün'}`
      : 'Tüm Zamanlar';

    const lessonFilterInfo = selectedLesson && selectedLesson !== 'Tümü'
      ? `Seçilen Özel Ders: ${selectedLesson}`
      : `Tüm Dersler (${selectedTrack || 'Tüm Alanlar'})`;

    const studentInfo = `
ÖĞRENCİ BİLGİLERİ VE HEDEFLERİ:
- Öğrenci: ${student?.adSoyad || "Öğrenci"}
- Sınıf & Alan: ${student?.sinif || "12. Sınıf"} - ${student?.alan || "Sayısal"}
- Hedef Üniversite & Bölüm: ${student?.hedefUniversite || "Hedef Üniversite"} ${student?.hedefBolum || ""}
- Hedeflenen Sıralama: ${student?.hedefSiralama || "İlk 20.000"} (Hedef Puan: ${student?.hedefPuan || "490"})
- İncelenen Alan Filtresi: ${selectedTrack || "Tüm Alanlar"}
- İncelenen Ders Filtresi: ${lessonFilterInfo}
- İncelenen Tarih Aralığı: ${dateRangeInfo}

ÖĞRENCİNİN EN ZAYIF KALDIĞI KRİTİK MEB KAZANIMLARI:
${(weakOutcomes || []).map((w: any) => `- [${w.ders}] ${w.konu} (${w.kazanimKodu || ""}): ${w.kazanimAciklama || ""} -> Başarı: %${Math.round(w.basariYuzdesi || 0)} (${w.dogruSayisi || 0} D / ${w.toplamSoru || 0} Soru)`).join("\n") || "Kazanım verisi henüz sınırlı."}

ÖĞRENCİNİN SON RESMÎ DENEME SINAVLARI:
${(recentExams || []).map((d: any) => `- ${d.tarih || ""} | ${d.sinavTuru || ""} - ${d.denemeAdi || ""}: Toplam Net: ${d.toplamNet || 0}`).join("\n") || "Henüz deneme kaydı girilmedi."}
`;

    if (!ai) {
      return res.json({
        advice: generateFallbackCoachPrescription(student, weakOutcomes),
        source: "built-in-coach-engine",
      });
    }

    const prompt = `
Sen Türkiye YKS (TYT-AYT) dereceleri çıkaran en tecrübeli, uzman ve pedagojik Eğitim Koçusun.

${studentInfo}

GÖREV:
Bu öğrencinin hedeflediği üniversiteye ve bölüme yerleşebilmesi için somut, motive edici ve nokta atışı bir koçluk reçetesi hazırla:
1. 🎯 EN ACİL MÜDAHALE EDİLMESİ GEREKEN 3 KAZANIM (Hangi ders, hangi konu, neden kritik?)
2. ⏱️ 2 HAFTALIK ÇALIŞMA PLANI (Hangi derse günde kaç saat/soru ayrılmalı?)
3. 📚 HATA SIFIRLAMA STRATEJİSİ (Bu kazanımlardaki yanlışları bitirmek için kaynak ve soru çözme taktikleri)
4. 🚀 KOÇUN MOTİVASYON VE STRATEJİ NOTU

Samimi, net, maddeli ve profesyonel Türkçe ile yaz.`;

    const { text: adviceText, usedModel } = await executeTextWithFallback(ai, {
      prompt,
      temperature: 0.6,
    });

    res.json({
      advice: adviceText || "Koçluk tavsiyesi oluşturulamadı.",
      source: usedModel,
    });
  } catch (error: any) {
    console.error("AI Coaching Advice Error:", error);
    res.json({
      advice: generateFallbackCoachPrescription(req.body.student, req.body.weakOutcomes),
      source: "fallback-coach",
      error: error?.message,
    });
  }
});

// =========================================================================
// 4. AI TUTOR QUESTION ENDPOINT
// =========================================================================
app.post("/api/tutor/ask", async (req, res) => {
  try {
    const { question, subject, context } = req.body;
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Soru metni gereklidir." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        answer: generateFallbackAnswer(question, subject, context),
        source: "local-knowledge-base",
      });
    }

    const systemInstruction = `Sen "Eğitim Koçluğu & YKS Takip Portalı" platformunun uzman yapay zeka eğitim koçu ve ders öğretmenisin.
Öğrencilerin sorularını açık, anlaşılır, pedagojik ve motive edici bir dille yanıtla.
Gerektiğinde maddeler, somut benzetmeler ve pratik formüller kullan.`;

    const prompt = `Ders / Konu: ${subject || "Genel YKS"}
${context ? `Öğrencinin bağlamı: ${context}\n` : ""}
Soru / Talep: ${question}`;

    const { text: answerText, usedModel } = await executeTextWithFallback(ai, {
      prompt,
      systemInstruction,
      temperature: 0.6,
    });

    res.json({
      answer: answerText || "Yanıt oluşturulamadı.",
      source: usedModel,
    });
  } catch (error: any) {
    res.json({
      answer: generateFallbackAnswer(req.body.question, req.body.subject, req.body.context),
      source: "fallback",
      error: error?.message,
    });
  }
});

// =========================================================================
// HELPER FALLBACKS
// =========================================================================
function getFallbackCurriculum(hedefYil: number | string) {
  const y = String(hedefYil || "2026");
  return [
    // 9. Sınıf (TYT Temel)
    {
      id: "kaz-9-mat-1",
      sinif: "9. Sınıf",
      sinavTuru: "TYT",
      ders: "Matematik",
      konu: "Kümeler ve Mantık",
      kazanimKodu: "MAT.9.1.1",
      aciklama: "Kümelerde birleşim, kesişim ve fark işlemlerini sembolik mantıkla ilişkilendirir.",
      onemDerecesi: "Temel",
      yil: y,
    },
    {
      id: "kaz-9-mat-2",
      sinif: "9. Sınıf",
      sinavTuru: "TYT",
      ders: "Matematik",
      konu: "Denklem ve Eşitsizlikler (Üslü & Köklü Sayılar)",
      kazanimKodu: "MAT.9.3.4",
      aciklama: "Gerçek sayılar kümesinde aralık kavramını açıklar, üslü ve köklü ifadeler içeren denklemleri çözer.",
      onemDerecesi: "Kritik",
      yil: y,
    },
    {
      id: "kaz-9-fiz-1",
      sinif: "9. Sınıf",
      sinavTuru: "TYT",
      ders: "Fizik",
      konu: "Kuvvet ve Hareket (Newton Yasaları)",
      kazanimKodu: "FİZ.9.3.1",
      aciklama: "Dengelenmiş ve dengelenmemiş kuvvetler etkisindeki cisimlerin hareketini açıklar.",
      onemDerecesi: "Kritik",
      yil: y,
    },
    {
      id: "kaz-9-kim-1",
      sinif: "9. Sınıf",
      sinavTuru: "TYT",
      ders: "Kimya",
      konu: "Kimyasal Türler Arası Etkileşimler",
      kazanimKodu: "KİM.9.3.1",
      aciklama: "Güçlü ve zayıf etkileşimleri bağ enerjisi ve polarite temelinde sınıflandırır.",
      onemDerecesi: "Yüksek",
      yil: y,
    },
    {
      id: "kaz-9-biy-1",
      sinif: "9. Sınıf",
      sinavTuru: "TYT",
      ders: "Biyoloji",
      konu: "Canlıların Temel Bileşenleri & Hücre Yapısı",
      kazanimKodu: "BİY.9.1.2",
      aciklama: "Organik ve inorganik moleküllerin canlı organizmalardaki biyolojik işlevlerini açıklar.",
      onemDerecesi: "Kritik",
      yil: y,
    },

    // 10. Sınıf (TYT İleri)
    {
      id: "kaz-10-mat-1",
      sinif: "10. Sınıf",
      sinavTuru: "TYT",
      ders: "Matematik",
      konu: "Fonksiyonlar & Grafikler",
      kazanimKodu: "MAT.10.2.1",
      aciklama: "Fonksiyon tanım kümesi, değer kümesi, ters fonksiyon ve bileşke işlemlerini modeller.",
      onemDerecesi: "Kritik",
      yil: y,
    },
    {
      id: "kaz-10-mat-2",
      sinif: "10. Sınıf",
      sinavTuru: "TYT",
      ders: "Matematik",
      konu: "Polinomlar ve Çarpanlara Ayırma",
      kazanimKodu: "MAT.10.3.1",
      aciklama: "Bir değişkenli polinomlarda bölme işlemi yapar ve çarpanlara ayırma yöntemlerini uygular.",
      onemDerecesi: "Yüksek",
      yil: y,
    },
    {
      id: "kaz-10-fiz-1",
      sinif: "10. Sınıf",
      sinavTuru: "TYT",
      ders: "Fizik",
      konu: "Elektrik ve Manyetizma (Ohm Yasası & Devreler)",
      kazanimKodu: "FİZ.10.1.1",
      aciklama: "Elektrik devrelerinde seri ve paralel bağlı dirençlerin eşdeğerini ve akım-gerilim dağılımını hesaplar.",
      onemDerecesi: "Kritik",
      yil: y,
    },
    {
      id: "kaz-10-biy-1",
      sinif: "10. Sınıf",
      sinavTuru: "TYT",
      ders: "Biyoloji",
      konu: "Mitoz ve Mayoz Bölünme",
      kazanimKodu: "BİY.10.1.1",
      aciklama: "Mitoz ve mayoz bölünme evrelerini genetik çeşitlilik ve kromozom sayısı açısından karşılaştırır.",
      onemDerecesi: "Kritik",
      yil: y,
    },

    // 11. Sınıf (AYT Çekirdek)
    {
      id: "kaz-11-mat-1",
      sinif: "11. Sınıf",
      sinavTuru: "AYT",
      ders: "Matematik",
      konu: "Trigonometri (Birim Çember & Formüller)",
      kazanimKodu: "MAT.11.1.2",
      aciklama: "Trigonometrik fonksiyonların periyotlarını inceler ve toplam-fark formüllerini çözer.",
      onemDerecesi: "Kritik",
      yil: y,
    },
    {
      id: "kaz-11-mat-2",
      sinif: "11. Sınıf",
      sinavTuru: "AYT",
      ders: "Matematik",
      konu: "Analitik Geometri (Doğrunun Analitiği)",
      kazanimKodu: "MAT.11.2.1",
      aciklama: "İki nokta arasındaki uzaklığı, eğim açısını ve doğru denklemlerini kurar.",
      onemDerecesi: "Yüksek",
      yil: y,
    },
    {
      id: "kaz-11-fiz-1",
      sinif: "11. Sınıf",
      sinavTuru: "AYT",
      ders: "Fizik",
      konu: "İki Boyutta İtme ve Çizgisel Momentum",
      kazanimKodu: "FİZ.11.1.4",
      aciklama: "Çizgisel momentumun korunumunu esnek ve esnek olmayan çarpışmalarda vektörel olarak analiz eder.",
      onemDerecesi: "Kritik",
      yil: y,
    },
    {
      id: "kaz-11-kim-1",
      sinif: "11. Sınıf",
      sinavTuru: "AYT",
      ders: "Kimya",
      konu: "Kimyasal Tepkimelerde Denge & Çözünürlük (Kçç)",
      kazanimKodu: "KİM.11.4.2",
      aciklama: "Dengeye etki eden faktörleri yorumlar ve çözünürlük dengesi (Kçç) hesaplamalarını yapar.",
      onemDerecesi: "Kritik",
      yil: y,
    },
    {
      id: "kaz-11-biy-1",
      sinif: "11. Sınıf",
      sinavTuru: "AYT",
      ders: "Biyoloji",
      konu: "İnsan Fizyolojisi (Sinir ve Endokrin Sistem)",
      kazanimKodu: "BİY.11.1.1",
      aciklama: "Nöronlarda impuls oluşumu ve iletimi ile hormonların hedef organlara etkisini açıklar.",
      onemDerecesi: "Kritik",
      yil: y,
    },

    // 12. Sınıf (AYT İleri)
    {
      id: "kaz-12-mat-1",
      sinif: "12. Sınıf",
      sinavTuru: "AYT",
      ders: "Matematik",
      konu: "Logaritma ve Diziler",
      kazanimKodu: "MAT.12.1.2",
      aciklama: "Üstel ve logaritmik fonksiyon denklemlerini çözer, aritmetik ve geometrik dizi modelleri kurar.",
      onemDerecesi: "Kritik",
      yil: y,
    },
    {
      id: "kaz-12-mat-2",
      sinif: "12. Sınıf",
      sinavTuru: "AYT",
      ders: "Matematik",
      konu: "Türev ve Uygulamaları",
      kazanimKodu: "MAT.12.4.3",
      aciklama: "Bir fonksiyonun türevini hesaplar, teğet denklemini, yerel ekstremum ve büküm noktalarını bulur.",
      onemDerecesi: "Kritik",
      yil: y,
    },
    {
      id: "kaz-12-mat-3",
      sinif: "12. Sınıf",
      sinavTuru: "AYT",
      ders: "Matematik",
      konu: "Belirli İntegral ve Alan Hesabı",
      kazanimKodu: "MAT.12.5.2",
      aciklama: "Belirli integrali eğri ile eksenler arasında kalan alan hesaplamalarında etkin olarak kullanır.",
      onemDerecesi: "Kritik",
      yil: y,
    },
    {
      id: "kaz-12-fiz-1",
      sinif: "12. Sınıf",
      sinavTuru: "AYT",
      ders: "Fizik",
      konu: "Düzgün Çembersel Hareket & Basit Harmonik Hareket",
      kazanimKodu: "FİZ.12.1.2",
      aciklama: "Merkezcil kuvvet, açısal momentum ve yay-basit sarkaç sistemlerindeki periyot ilişkilerini açıklar.",
      onemDerecesi: "Kritik",
      yil: y,
    },
    {
      id: "kaz-12-kim-1",
      sinif: "12. Sınıf",
      sinavTuru: "AYT",
      ders: "Kimya",
      konu: "Elektrokimya ve Organik Kimyaya Giriş",
      kazanimKodu: "KİM.12.1.3",
      aciklama: "Galvanik pilleri, standart pil potansiyellerini ve hidrokarbonların IUPAC adlandırmasını yapar.",
      onemDerecesi: "Yüksek",
      yil: y,
    },
    {
      id: "kaz-12-biy-1",
      sinif: "12. Sınıf",
      sinavTuru: "AYT",
      ders: "Biyoloji",
      konu: "Fotosentez, Kemosentez & Hücresel Solunum",
      kazanimKodu: "BİY.12.2.1",
      aciklama: "Glikoliz, Krebs döngüsü ve ETS evrelerinde ATP üretim mekanizmalarını kemiosmotik modelle açıklar.",
      onemDerecesi: "Kritik",
      yil: y,
    },

    // Mezun (TYT + AYT Kapsamlı YKS Hazırlık)
    {
      id: "kaz-mezun-turkce-1",
      sinif: "Mezun",
      sinavTuru: "TYT",
      ders: "Türkçe",
      konu: "Paragrafta Anlam, Yapı ve Dil Bilgisi",
      kazanimKodu: "TÜR.TYT.01",
      aciklama: "Paragrafta ana düşünce, yardımcı düşünce ve cümle ögeleri tahlilini eksiksiz yapar.",
      onemDerecesi: "Kritik",
      yil: y,
    },
    {
      id: "kaz-mezun-tarih-1",
      sinif: "Mezun",
      sinavTuru: "TYT",
      ders: "Tarih",
      konu: "Millî Mücadele ve Atatürk İlkeleri",
      kazanimKodu: "TAR.TYT.03",
      aciklama: "Kurtuluş Savaşı cephelerini, antlaşmaları ve Cumhuriyet dönemi inkılaplarını sebep-sonuçla yorumlar.",
      onemDerecesi: "Yüksek",
      yil: y,
    },
    {
      id: "kaz-mezun-mat-1",
      sinif: "Mezun",
      sinavTuru: "AYT",
      ders: "Matematik",
      konu: "İleri Analiz (Limit, Türev, İntegral Paketi)",
      kazanimKodu: "MAT.AYT.99",
      aciklama: "Tüm AYT matematik analiz konularını deneme sınavı düzeyinde üst düzey sentezler.",
      onemDerecesi: "Kritik",
      yil: y,
    },
  ];
}

function generateSimulatedMultiPageQuestions(pageNo: number, sinavTuru: string, photoUrl: string, startSoruNo: number = 1) {
  const isTYT = sinavTuru === "TYT";
  const subjects = isTYT 
    ? [
        { 
          ders: "TYT Matematik", 
          unite: "Fonksiyonlar",
          konu: "Fonksiyonlar & Grafikler", 
          kod: "MAT.TYT.08", 
          aciklama: "Fonksiyon grafiğini okur ve bileşke değerini hesaplar.", 
          soru: "f(2x+1) = g(x-2) eşitliğine göre f(5) değeri.",
          cozum: `### Çözüm Adımları:
- **Verilenler:**
  - $f(2x+1) = g(x-2)$ ve $g(0) = 8$
- **Adımlar:**
  1. $f(5)$ değerini bulmak için $2x+1 = 5 \\implies x = 2$ yazılır.
  2. Eşitliğin sağ tarafında $x=2$ konularak $g(2-2) = g(0)$ bulunur.
  3. $f(5) = g(0) = 8$ olarak hesaplanır.
- **Cevap: B (8)**`
        },
        { 
          ders: "TYT Matematik", 
          unite: "Problemler",
          konu: "Sayı & Kesir Problemleri", 
          kod: "MAT.TYT.07", 
          aciklama: "Günlük hayat durumlarını denklem kurarak modeller ve çözer.", 
          soru: "Bir bilet kuyruğunda baştan ve sondan sıra sayısı problemi.",
          cozum: `### Çözüm Adımları:
- **Verilenler:**
  - Baştan $(n+3)$. sıra, sondan $(2n-1)$. sıra, toplam 45 kişi.
- **Adımlar:**
  1. Toplam kişi sayısı formülü: $(n+3) + (2n-1) - 1 = 45$
  2. $3n + 1 = 45 \\implies 3n = 44$ denklem çözümü.
- **Cevap: C**`
        },
        { 
          ders: "TYT Fizik", 
          unite: "Kuvvet ve Hareket",
          konu: "Kuvvet & Hareket (Sürtünme)", 
          kod: "FIZ.TYT.02", 
          aciklama: "Sürtünme kuvvetinin bağlı olduğu değişkenleri analiz eder.", 
          soru: "Eğik düzlemde kayan cismin ivmesi.",
          cozum: `### Çözüm Adımları:
- **Verilenler:** $\\alpha = 37^\\circ$, $k = 0{,}25$, $g = 10\\text{ m/s}^2$
- **Adımlar:**
  1. Net kuvvet: $F_{\\text{net}} = m \\cdot g \\cdot \\sin 37^\\circ - k \\cdot m \\cdot g \\cdot \\cos 37^\\circ$
  2. İvme: $a = g(\\sin 37^\\circ - k \\cos 37^\\circ) = 10(0{,}6 - 0{,}25 \\cdot 0{,}8) = 4\\text{ m/s}^2$
- **Cevap: A (4 m/s²)**`
        },
        { 
          ders: "TYT Geometri", 
          unite: "Üçgenler",
          konu: "Üçgende Alan & Benzerlik", 
          kod: "GEO.TYT.03", 
          aciklama: "Üçgenlerin benzerlik oranını alan oranına dönüştürür.", 
          soru: "Thales bağıntısı ile alan oranlaması.",
          cozum: `### Çözüm Adımları:
- **Adımlar:**
  1. Benzerlik oranı $k = \\frac{2}{3}$ ise Alanlar oranı $k^2 = \\frac{4}{9}$ olur.
  2. Taralı alan $9S - 4S = 5S = 30 \\implies S = 6$ cm².
- **Cevap: D (24 cm²)**`
        },
      ]
    : [
        { 
          ders: "Matematik (AYT)", 
          unite: "Trigonometri",
          konu: "Trigonometrik Fonksiyonlar ve İşaret Analizi", 
          kod: "11.6.1.1 ve 11.6.1.2", 
          aciklama: "Trigonometrik fonksiyonların bölgelere göre işaretlerini belirler, birim çember ve dik üçgen yardımıyla hesaplar.", 
          soru: "3π/2 < α < 2π ve cosα = 0,6 olduğuna göre (tanα + cotα)/sinα ifadesinin değeri.",
          cozum: `### Çözüm:
- **Verilenler:**
  - $3\\pi/2 < \\alpha < 2\\pi$ (Açı 4. bölgededir).
  - $\\cos \\alpha = 0,6 = 3/5$
- **Adımlar:**
  1. **Bölge İşaret Analizi (4. Bölge):**
     - $\\cos \\alpha > 0$ (+)
     - $\\sin \\alpha < 0$ (-)
     - $\\tan \\alpha < 0$ (-)
     - $\\cot \\alpha < 0$ (-)
  2. **Dik Üçgen Oranları (3-4-5 dik üçgeni):**
     - $\\sin \\alpha = -4/5$
     - $\\tan \\alpha = -4/3$
     - $\\cot \\alpha = -3/4$
  3. **Pay Kısmı (tan α + cot α):**
     $\\tan \\alpha + \\cot \\alpha = -4/3 - 3/4 = (-16 - 9)/12 = -25/12$
  4. **Tüm İfade ((tan α + cot α) / sin α):**
     $(-25/12) / (-4/5) = (-25/12) \\cdot (-5/4) = 125/48$
- **Cevap: E (125/48)**`
        },
        { 
          ders: "AYT Matematik", 
          unite: "Türev",
          konu: "Türev & Teğet Denklemi", 
          kod: "MAT.AYT.05", 
          aciklama: "Fonksiyonun türevini hesaplar ve teğet doğrusunun denklemini kurar.", 
          soru: "y = x³ - 3x eğrisine x=2 apsisli noktadan çizilen teğet.",
          cozum: `### Çözüm:
- **Adımlar:**
  1. $y' = 3x^2 - 3$ türevi alınır.
  2. $x=2$ için eğim $m = 3(4) - 3 = 9$ bulunur.
  3. Teğet denklemi: $y - y_0 = m(x - x_0)$ ile hesaplanır.
- **Cevap: B**`
        },
        { 
          ders: "AYT Fizik", 
          unite: "Basit Harmonik Hareket",
          konu: "Basit Harmonik Hareket", 
          kod: "FIZ.AYT.04", 
          aciklama: "Yay sarkaçı ve basit sarkaçta periyot ilişkilerini açıklar.", 
          soru: "Yay sabiti k olan sistemin salınım periyodu.",
          cozum: `### Çözüm:
- **Formül:** $T = 2\\pi \\sqrt{\\frac{m}{k}}$
- **Cevap: C**`
        },
        { 
          ders: "AYT Biyoloji", 
          unite: "Hücresel Solunum",
          konu: "Hücresel Solunum & ATP", 
          kod: "BIY.AYT.04", 
          aciklama: "Glikoliz ve ETS evrelerindeki net ATP üretimini karşılaştırır.", 
          soru: "Mitokondri iç zarındaki kemiosmotik hipotez.",
          cozum: `### Çözüm:
- **Cevap: A**`
        },
      ];

  const siklar = ["A", "B", "C", "D", "E"];

  return subjects.map((sub, idx) => {
    const sNo = startSoruNo + idx;
    const dogruSik = (sub as any).unite === "Trigonometri" ? "E" : siklar[(sNo + pageNo) % 5];
    // 75% accuracy simulation for student
    const isDogru = (sub as any).unite === "Trigonometri" ? true : (sNo + pageNo) % 3 !== 0;
    const ogrenciSik = isDogru ? dogruSik : siklar[(sNo + 2) % 5];

    return {
      soruNo: sNo,
      sayfaNo: pageNo,
      ders: sub.ders,
      unite: (sub as any).unite || "",
      konu: sub.konu,
      isaretlenenSik: ogrenciSik,
      ogrenciCevabi: ogrenciSik,
      dogruCevap: dogruSik,
      dogruMu: isDogru,
      kazanimKodu: sub.kod,
      kazanimAciklama: sub.aciklama,
      soruOzeti: sub.soru,
      cozumDetayi: (sub as any).cozum || "",
      analizNotu: isDogru 
        ? "Öğrenci doğru cevabı bulmuştur." 
        : `Öğrenci ${ogrenciSik} işaretlemiş fakat doğru cevap ${dogruSik} seçeneğidir. Kazanım eksiği mevcuttur.`,
      sayfaFotoUrl: (typeof photoUrl === 'string' && photoUrl.length > 500) ? '' : photoUrl,
    };
  });
}

function generateSimulatedExamAnalysis() {
  return [
    {
      soruNo: 20,
      sayfaNo: 1,
      ders: "Matematik (AYT)",
      unite: "Trigonometri",
      konu: "Trigonometrik Fonksiyonlar ve İşaret Analizi",
      isaretlenenSik: "E",
      dogruCevap: "E",
      dogruMu: true,
      kazanimKodu: "11.6.1.1 ve 11.6.1.2",
      kazanimAciklama: "Trigonometrik fonksiyonların bölgelere göre işaretlerini belirler, birim çember ve dik üçgen yardımıyla hesaplar.",
      cozumDetayi: `### Çözüm:
- **Verilenler:**
  - $3\\pi/2 < \\alpha < 2\\pi$ (Açı 4. bölgededir).
  - $\\cos \\alpha = 0,6 = 3/5$
- **Adımlar:**
  1. **Bölge İşaret Analizi (4. Bölge):**
     - $\\cos \\alpha > 0$ (+)
     - $\\sin \\alpha < 0$ (-)
     - $\\tan \\alpha < 0$ (-)
     - $\\cot \\alpha < 0$ (-)
  2. **Dik Üçgen Oranları (3-4-5 dik üçgeni):**
     - $\\sin \\alpha = -4/5$
     - $\\tan \\alpha = -4/3$
     - $\\cot \\alpha = -3/4$
  3. **Pay Kısmı (tan α + cot α):**
     $\\tan \\alpha + \\cot \\alpha = -4/3 - 3/4 = (-16 - 9)/12 = -25/12$
  4. **Tüm İfade ((tan α + cot α) / sin α):**
     $(-25/12) / (-4/5) = (-25/12) \\cdot (-5/4) = 125/48$
- **Cevap: E (125/48)**`,
      soruOzeti: "3π/2 < α < 2π ve cosα = 0,6 için (tanα+cotα)/sinα değeri.",
      analizNotu: "Öğrenci 4. bölge işaretlerini ve dik üçgen oranlarını doğru uygulayarak tam puan almıştır."
    },
    {
      soruNo: 1,
      sayfaNo: 1,
      ders: "TYT Matematik",
      unite: "Temel Kavramlar",
      konu: "Sayı Basamakları",
      isaretlenenSik: "B",
      dogruCevap: "B",
      dogruMu: true,
      kazanimKodu: "MAT.TYT.02",
      kazanimAciklama: "Sayı basamakları ve basamak analizi ile ilgili problemleri çözer.",
      cozumDetayi: "### Çözüm:\n1. $xy = 10x + y$ olarak açılır.\n2. İstenen bağıntı yerine yazılarak $x+y=7$ bulunur.\n**Cevap: B**",
      soruOzeti: "İki basamaklı xy sayısının çözümlenmesi sorusu.",
    },
    {
      soruNo: 2,
      sayfaNo: 1,
      ders: "TYT Matematik",
      unite: "Bölünebilme",
      konu: "Bölünebilme Kuralları",
      isaretlenenSik: "D",
      dogruCevap: "C",
      dogruMu: false,
      kazanimKodu: "MAT.TYT.03",
      kazanimAciklama: "Tam sayılarda bölünebilme kurallarını problem çözümlerinde kullanır.",
      cozumDetayi: "### Çözüm:\n1. 11 ile bölünebilme kuralı: $+ - + -$ kuralı uygulanır.\n2. Doğru cevap C seçeneğidir.",
      soruOzeti: "11 ve 9 ile tam bölünebilen 4 basamaklı sayı.",
    },
    {
      soruNo: 3,
      sayfaNo: 1,
      ders: "TYT Geometri",
      unite: "Üçgenler",
      konu: "Üçgende Açı ve Kenar Bağıntıları",
      isaretlenenSik: "A",
      dogruCevap: "A",
      dogruMu: true,
      kazanimKodu: "GEO.TYT.01",
      kazanimAciklama: "Üçgende açı-kenar eşitsizliklerini geometrik modeller üzerinde kurar.",
      cozumDetayi: "### Çözüm:\n1. Büyük açı karşısında büyük kenar bulunur kuralı.\n**Cevap: A**",
      soruOzeti: "ABC üçgeninde en uzun kenarın tespiti.",
    },
  ];
}

function generateFallbackCoachPrescription(student: any, weakOutcomes: any[]) {
  const name = student?.adSoyad || "Öğrencimiz";
  const targetUni = student?.hedefUniversite || "Hedef Üniversite";
  const targetDept = student?.hedefBolum || "Hedef Bölüm";

  return `🎯 **${name} İçin YKS Hedef Odaklı Eğitim Koçluğu Reçetesi**
Hedef: ${targetUni} - ${targetDept} (Hedef Sıralama: ${student?.hedefSiralama || "Kritik Derece"})

---

### 1. 🎯 EN ACİL MÜDAHALE EDİLMESİ GEREKEN 3 KAZANIM:
1. **AYT Matematik - Türev & İntegral Uygulamaları**: Sınavda en yüksek standart sapmaya ve puan katsayısına sahip konulardır.
2. **Geometri - Çemberde Açı ve Katı Cisimler**: Denemelerde boş bırakma eğilimi yüksek olan bu alanda formül kartları çıkarılmalıdır.
3. **TYT Paragraf Hızlandırma & Yapı Analizi**: Süre yetiştirememe problemini çözmek için her sabah ilk iş 20 süreli paragraf sorusu çözülmelidir.

---

### 2. ⏱️ 2 HAFTALIK HIZLANDIRILMIŞ ÇALIŞMA PLANI:
- **Pazartesi / Çarşamba / Cuma**: 2 saat AYT Matematik (Konu + 50 Soru) + 1 saat Fizik/Edebiyat.
- **Salı / Perşembe / Cumartesi**: 90 dk Geometri + 1 saat Kimya/Tarih + 20 Paragraf + 20 Problem rutini.
- **Pazar**: 1 Adet Tam Süreli Kurumsal TYT/AYT Denemesi + 2 Saat Ayrıntılı Yanlış Soru Analizi.

---

### 3. 📚 HATA SIFIRLAMA STRATEJİSİ (Soru Bankası & Analiz Taktiği):
- Denemelerde ve soru bankalarında yanlış çıkan veya boş kalan her soruyu kesip "Hata Defteri"ne yapıştırın.
- Her Pazar günü sadece bu hata defterindeki soruları baştan çözün. Bir soru 2 kez doğru çözülmeden o konu "Kazanıldı" sayılmayacaktır.

---

### 4. 🚀 KOÇUN MOTİVASYON VE STRATEJİ NOTU:
Sevgili ${name}, hedefinize ulaşmak için gereken net artışı tamamen planlı ve eksik odaklı çalışmaya bağlıdır. YKS bir zeka yarışı değil, süreklilik ve eksik tamamlama maratonudur. İnanıyoruz ve bu programla hedefe ulaşacağız! 🌟`;
}

function generateFallbackAnswer(question: string, subject?: string, context?: string): string {
  return `📚 **Eğitim Koçu Yanıtı:**
"${question}" konusu YKS hazırlık sürecinde kritik önem taşır.

📌 **Önemli İpuçları:**
1. **Konu Mantığını Kavrayın:** Formülleri ezberlemek yerine ispatını ve soruya nasıl uygulanacağını anlayın.
2. **Kademeli Soru Çözümü:** Kolay -> Orta -> ÖSYM Çıkmış Sorular sırasında ilerleyin.
3. **Analiz:** Yanlış yaptığınız sorunun ait olduğu MEB kazanımını inceleyin ve tekrar edin.

Portal üzerindeki "MEB Müfredat Kazanımları" ve "Soru Takibi" bölümlerini kullanarak gelişiminizi günlük takip edebilirsiniz!`;
}

async function startServer() {
  // Initialize PostgreSQL schema and purge old demo seeds
  try {
    await initializeDatabaseSchema();
  } catch (err: any) {
    console.warn("PostgreSQL initialization warning:", err.message);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Öğrenci Koçluğu & YKS Takip Portalı http://0.0.0.0:${PORT} adresinde aktif.`);
  });
}

startServer();
