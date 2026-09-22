import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Use connection string if available, otherwise individual parameters
const isConfigured = Boolean(
  process.env.DATABASE_URL ||
  (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD)
);

let pool: pg.Pool | null = null;
let useMemoryFallback = !isConfigured;

if (isConfigured) {
  try {
    const isDatabaseUrlValid = Boolean(
      process.env.DATABASE_URL &&
      (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'))
    );

    const sslOption = (isDatabaseUrlValid && process.env.DATABASE_URL?.includes('sslmode=disable'))
      ? false
      : (process.env.PGSSL === 'true' || (isDatabaseUrlValid && process.env.DATABASE_URL?.includes('sslmode=require')))
        ? { rejectUnauthorized: false }
        : false;

    const config: pg.PoolConfig = isDatabaseUrlValid
      ? { connectionString: process.env.DATABASE_URL, ssl: sslOption }
      : {
          host: process.env.PGHOST,
          port: parseInt(process.env.PGPORT || '5432', 10),
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
          ssl: sslOption,
        };

    pool = new Pool({
      ...config,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });

    pool.on('error', (err) => {
      console.warn('Unexpected error on idle PostgreSQL client:', err.message);
      // Do NOT permanently set useMemoryFallback = true here. 
      // PostgreSQL pg Pool automatically handles spawning new clients/reconnecting on subsequent queries.
    });

    // Test connection on boot with automatic retries to allow sleeping databases (e.g. Neon, Supabase) to wake up
    const tryConnect = (retriesLeft = 3) => {
      if (!pool) return;
      pool.query('SELECT NOW()')
        .then(() => {
          console.log('✅ PostgreSQL remote database successfully connected!');
          useMemoryFallback = false;
        })
        .catch((err) => {
          console.warn(`PostgreSQL Connection attempt failed (${retriesLeft} retries left). Error:`, err.message);
          if (retriesLeft > 0) {
            setTimeout(() => tryConnect(retriesLeft - 1), 4000);
          } else {
            console.warn('❌ PostgreSQL Connection failed after all retries, falling back to memory database.');
            useMemoryFallback = true;
          }
        });
    };

    tryConnect(3);
  } catch (e: any) {
    console.warn('Failed to configure PostgreSQL pool, falling back to memory. Error:', e.message);
    useMemoryFallback = true;
  }
} else {
  console.log('PostgreSQL credentials not provided in env. Example seed memory database active.');
}

export { pool, useMemoryFallback };
export function isMemoryFallbackActive(): boolean {
  return useMemoryFallback;
}

/**
 * Automatically creates PostgreSQL tables if they don't exist yet.
 */
export async function initializeDatabaseSchema() {
  if (useMemoryFallback || !pool) {
    return;
  }

  let client: pg.PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Drop legacy tasks table if exists
    await client.query(`DROP TABLE IF EXISTS tasks CASCADE;`);

    // Drop legacy curriculum table
    await client.query(`DROP TABLE IF EXISTS curriculum CASCADE;`);

    // 1. Students Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(100) PRIMARY KEY,
        pin_code VARCHAR(10) NOT NULL,
        ad_soyad VARCHAR(150) NOT NULL,
        dogum_tarihi VARCHAR(50),
        kayit_tarihi VARCHAR(50),
        sinif VARCHAR(50) NOT NULL,
        alan VARCHAR(50) NOT NULL,
        yks_hedef_yili VARCHAR(10),
        hedef_universite VARCHAR(250),
        hedef_bolum VARCHAR(250),
        hedef_puan VARCHAR(50),
        hedef_siralama VARCHAR(50),
        durum VARCHAR(50) NOT NULL,
        koc_notu TEXT,
        avatar_bg VARCHAR(50)
      )
    `);

    // 2. Notes Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id VARCHAR(100) PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL,
        tarih VARCHAR(50) NOT NULL,
        kategori VARCHAR(100) NOT NULL,
        oncelik VARCHAR(50) NOT NULL,
        baslik VARCHAR(250) NOT NULL,
        icerik TEXT NOT NULL
      )
    `);

    // 4. Questions Table (Soru Takibi: cozulen_soru, dogru_sayisi, yanlis_sayisi, bos_sayisi, net)
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id VARCHAR(100) PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL,
        tarih VARCHAR(50) NOT NULL,
        ders VARCHAR(100) NOT NULL,
        konu VARCHAR(250) NOT NULL,
        cozulen_soru INTEGER NOT NULL DEFAULT 0,
        dogru_sayisi INTEGER NOT NULL DEFAULT 0,
        yanlis_sayisi INTEGER NOT NULL DEFAULT 0,
        bos_sayisi INTEGER NOT NULL DEFAULT 0,
        net NUMERIC(6, 2) NOT NULL DEFAULT 0
      )
    `);

    // 5. Exams Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id VARCHAR(100) PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL,
        ogrenci_ad_soyad VARCHAR(150),
        sinav_turu VARCHAR(20) NOT NULL,
        deneme_adi VARCHAR(250) NOT NULL,
        yayin VARCHAR(250),
        tarih VARCHAR(50) NOT NULL,
        toplam_net NUMERIC(6, 2) NOT NULL,
        puan NUMERIC(8, 2),
        siralama INTEGER,
        toplam_katilimci INTEGER,
        koc_yorumu TEXT,
        dersler TEXT -- Stores DersNetDetay[] as JSON string
      )
    `);

    // 7. Archives Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS archives (
        id VARCHAR(100) PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL,
        ogrenci_ad_soyad VARCHAR(150),
        sinav_turu VARCHAR(20) NOT NULL,
        sinav_adi VARCHAR(250) NOT NULL,
        tarih VARCHAR(50) NOT NULL,
        toplam_soru INTEGER,
        dogru_sayisi INTEGER,
        yanlis_sayisi INTEGER,
        bos_sayisi INTEGER,
        net NUMERIC(6, 2),
        sorular TEXT, -- Stores SoruAnalizDetay[] as JSON string
        is_new BOOLEAN DEFAULT true,
        ogrenci_yukledi BOOLEAN DEFAULT false,
        yukleme_zamani VARCHAR(50),
        durum VARCHAR(50) DEFAULT 'Yeni',
        ai_status VARCHAR(50) DEFAULT 'completed',
        ai_status_message TEXT,
        ogrenci_notu TEXT,
        sayfa_fotolari TEXT,
        is_deneme BOOLEAN DEFAULT false,
        last_error TEXT,
        next_retry_time VARCHAR(50)
      )
    `);

    await client.query(`ALTER TABLE archives ADD COLUMN IF NOT EXISTS is_deneme BOOLEAN DEFAULT false;`);

    // 8. Schedules Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id VARCHAR(100) PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL,
        gun VARCHAR(50) NOT NULL,
        baslangic_saat VARCHAR(20) NOT NULL,
        bitis_saat VARCHAR(20) NOT NULL,
        gorev_turu VARCHAR(50) NOT NULL,
        baslik VARCHAR(250) NOT NULL,
        ders VARCHAR(100),
        konular TEXT,
        hedef_soru_sayisi INTEGER,
        kaynak VARCHAR(250),
        gorusme_notu TEXT,
        aciklama TEXT,
        tamamlandi BOOLEAN DEFAULT false,
        tarih VARCHAR(50)
      )
    `);

    // 9. Books (Kaynak Kitaplar) Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(250) NOT NULL,
        publisher VARCHAR(150) NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        subject VARCHAR(100) NOT NULL
      )
    `);

    // 10. Assigned Resources (Atanan Kaynaklar) Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assigned_resources (
        id VARCHAR(100) PRIMARY KEY,
        student_id VARCHAR(100) NOT NULL,
        book_id VARCHAR(100),
        book_name VARCHAR(250) NOT NULL,
        publisher VARCHAR(150),
        subject VARCHAR(100),
        difficulty VARCHAR(50),
        target_duration_days INTEGER,
        target_date VARCHAR(50),
        hedef_soru_sayisi INTEGER,
        note TEXT,
        assigned_date VARCHAR(50) NOT NULL,
        completed BOOLEAN DEFAULT false,
        completed_date VARCHAR(50)
      )
    `);

    // 11. App Settings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Ensure backwards compatibility with any existing tables
    await client.query(`
      ALTER TABLE archives ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT true;
      ALTER TABLE archives ADD COLUMN IF NOT EXISTS ogrenci_yukledi BOOLEAN DEFAULT false;
      ALTER TABLE archives ADD COLUMN IF NOT EXISTS yukleme_zamani VARCHAR(50);
      ALTER TABLE archives ADD COLUMN IF NOT EXISTS durum VARCHAR(50) DEFAULT 'Yeni';
      ALTER TABLE archives ADD COLUMN IF NOT EXISTS ai_status VARCHAR(50) DEFAULT 'completed';
      ALTER TABLE archives ADD COLUMN IF NOT EXISTS ai_status_message TEXT;
      ALTER TABLE archives ADD COLUMN IF NOT EXISTS ogrenci_notu TEXT;
      ALTER TABLE archives ADD COLUMN IF NOT EXISTS sayfa_fotolari TEXT;
      ALTER TABLE archives ADD COLUMN IF NOT EXISTS last_error TEXT;
      ALTER TABLE archives ADD COLUMN IF NOT EXISTS next_retry_time VARCHAR(50);
      ALTER TABLE archives ADD COLUMN IF NOT EXISTS photos_count INTEGER DEFAULT 0;
      
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS cozulen_soru INTEGER DEFAULT 0;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS dogru_sayisi INTEGER DEFAULT 0;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS yanlis_sayisi INTEGER DEFAULT 0;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS bos_sayisi INTEGER DEFAULT 0;
      ALTER TABLE questions ADD COLUMN IF NOT EXISTS net NUMERIC(6, 2) DEFAULT 0;

      DO $$
      BEGIN
        BEGIN
          ALTER TABLE questions ALTER COLUMN kaynak_kitap DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE questions ALTER COLUMN hedef_soru DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('PostgreSQL database schemas successfully initialized.');
  } catch (error: any) {
    if (client) {
      try { await client.query('ROLLBACK'); } catch {}
    }
    console.error('Failed to initialize PostgreSQL database schema, falling back to memory database:', error.message);
    useMemoryFallback = true;
  } finally {
    if (client) {
      try { client.release(); } catch {}
    }
  }
}
