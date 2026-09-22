import { CurriculumGradeLevel } from '../../types';

export const MEB_YKS_CURRICULUM: CurriculumGradeLevel[] = [
  // -------------------------------------------------------------
  // 9. SINIF (TYT Temel Hazırlık)
  // -------------------------------------------------------------
  {
    gradeId: '9',
    title: '9. Sınıf Müfredatı',
    subtitle: 'Lise Başlangıç & TYT Temel Konuları',
    description: 'Matematik, Fen ve Sosyal Bilimlerin temellerinin atıldığı, TYT sınavının yaklaşık %40-50 ağırlığını oluşturan MEB müfredatı.',
    subjects: [
      {
        id: '9-mat',
        dersAdi: 'Matematik',
        sinavTuru: 'TYT',
        colorTheme: 'indigo',
        units: [
          {
            id: '9-mat-u1',
            uniteNo: 1,
            uniteAdi: 'Mantık ve Önermeler',
            aciklama: 'Önermeler, bileşik önermeler, koşullu önermeler, açık önerme ve niceleyiciler.',
            topics: [
              { id: '9-mat-t1', name: 'Önermeler ve Doğruluk Değerleri', kazanimKodu: 'MAT.9.1.1', onem: 'Temel', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 80, tahminiCalismaSaati: 4, kocNotu: 'Koşullu ve iki yönlü koşullu önermelerin karşıt tersi iyi pekiştirilmeli.' },
              { id: '9-mat-t2', name: 'Bileşik Önermeler (Ve, Veya, Ya da, İse, Ancak ve Ancak)', kazanimKodu: 'MAT.9.1.2', onem: 'Orta', osymCikmaAirligi: 'TYT 1 Soru (Periyodik)', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5, kocNotu: 'De Morgan kuralları ve totoloji-çelişki kavramlarına dikkat edilmeli.' },
              { id: '9-mat-t3', name: 'Her ve Bazı Niceleyicileri ile İspat Yöntemleri', kazanimKodu: 'MAT.9.1.3', onem: 'Temel', osymCikmaAirligi: 'Temel Kavram', hedefSoruOnerisi: 60, tahminiCalismaSaati: 3 }
            ]
          },
          {
            id: '9-mat-u2',
            uniteNo: 2,
            uniteAdi: 'Kümeler',
            aciklama: 'Küme kavramı, alt küme, küme işlemleri ve küme problemleri.',
            topics: [
              { id: '9-mat-t4', name: 'Kümelerde Temel Kavramlar & Alt Küme', kazanimKodu: 'MAT.9.2.1', onem: 'Orta', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 90, tahminiCalismaSaati: 4 },
              { id: '9-mat-t5', name: 'Kümelerde Kesişim, Birleşim, Fark ve Tümleme', kazanimKodu: 'MAT.9.2.2', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 6, kocNotu: 'Venn şeması modelleme becerisi TYT için kritiktir.' },
              { id: '9-mat-t6', name: 'Kartezyen Çarpım ve Küme Problemleri', kazanimKodu: 'MAT.9.2.3', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 6, kocNotu: 'Problem kurguları TYT yeni nesil soruların vazgeçilmezidir.' }
            ]
          },
          {
            id: '9-mat-u3',
            uniteNo: 3,
            uniteAdi: 'Denklemler ve Eşitsizlikler',
            aciklama: 'Sayı kümeleri, bölünebilme, EBOB-EKOK, 1. dereceden denklem ve eşitsizlikler, mutlak değer, üslü-köklü sayılar, oran-orantı ve problemler.',
            topics: [
              { id: '9-mat-t7', name: 'Sayı Kümeleri, Asal Sayılar ve Faktöriyel', kazanimKodu: 'MAT.9.3.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 2-3 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 8, kocNotu: 'Pozitif-negatif, tek-çift sayı yorumları her TYT sınavında mutlaka gelir.' },
              { id: '9-mat-t8', name: 'Bölme, Bölünebilme Kuralları ve EBOB-EKOK', kazanimKodu: 'MAT.9.3.2', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1-2 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '9-mat-t9', name: 'Birinci Dereceden Denklemler ve Basit Eşitsizlikler', kazanimKodu: 'MAT.9.3.3', onem: 'Kritik', osymCikmaAirligi: 'TYT 1-2 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 6 },
              { id: '9-mat-t10', name: 'Mutlak Değerli İfadeler ve Denklemler', kazanimKodu: 'MAT.9.3.4', onem: 'Kritik', osymCikmaAirligi: 'TYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 7, kocNotu: 'Sayı doğrusu uzaklık tanımı ve grafik mantığı çok iyi bilinmeli.' },
              { id: '9-mat-t11', name: 'Üslü ve Köklü İfadeler', kazanimKodu: 'MAT.9.3.5', onem: 'Kritik', osymCikmaAirligi: 'TYT 2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 8 },
              { id: '9-mat-t12', name: 'Oran, Orantı ve Orantı Çeşitleri', kazanimKodu: 'MAT.9.3.6', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 5 },
              { id: '9-mat-t13', name: 'Sayı, Kesir, Yaş ve İşçi Problemleri', kazanimKodu: 'MAT.9.3.7', onem: 'Kritik', osymCikmaAirligi: 'TYT 4-5 Soru', hedefSoruOnerisi: 250, tahminiCalismaSaati: 12, kocNotu: 'Günlük en az 20 problem çözme rutini yerleştirilmeli.' },
              { id: '9-mat-t14', name: 'Hız, Yüzde, Kâr-Zarar, Karışım ve Grafik Problemleri', kazanimKodu: 'MAT.9.3.8', onem: 'Kritik', osymCikmaAirligi: 'TYT 4-6 Soru', hedefSoruOnerisi: 250, tahminiCalismaSaati: 12 }
            ]
          },
          {
            id: '9-mat-u4',
            uniteNo: 4,
            uniteAdi: 'Üçgenler (Geometri Temeli)',
            aciklama: 'Üçgende açılar, dik üçgen, trigonometrik oranlar, ikizkenar-eşkenar üçgen, eşlik, benzerlik, açıortay, kenarortay ve üçgende alan.',
            topics: [
              { id: '9-mat-t15', name: 'Doğruda ve Üçgende Açılar', kazanimKodu: 'MAT.9.4.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 1-2 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '9-mat-t16', name: 'Üçgenlerde Eşlik ve Benzerlik', kazanimKodu: 'MAT.9.4.2', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT 2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Benzerlik, tüm geometri sorularının anahtar çözüm aracıdır.' },
              { id: '9-mat-t17', name: 'Üçgende Yardımcı Elemanlar (Açıortay & Kenarortay)', kazanimKodu: 'MAT.9.4.3', onem: 'Yüksek', osymCikmaAirligi: 'TYT & AYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 6 },
              { id: '9-mat-t18', name: 'Dik Üçgen, Pisagor, Öklid ve Özel Açılı Üçgenler', kazanimKodu: 'MAT.9.4.4', onem: 'Kritik', osymCikmaAirligi: 'TYT 2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 8 },
              { id: '9-mat-t19', name: 'Üçgende Alan Bağıntıları', kazanimKodu: 'MAT.9.4.5', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT 1-2 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 }
            ]
          }
        ]
      },
      {
        id: '9-fizik',
        dersAdi: 'Fizik',
        sinavTuru: 'TYT',
        colorTheme: 'blue',
        units: [
          {
            id: '9-fiz-u1',
            uniteNo: 1,
            uniteAdi: 'Fizik Bilimine Giriş',
            aciklama: 'Fiziğin alt dalları, temel ve türetilmiş büyüklükler, vektörler, bilimsel araştırma merkezleri.',
            topics: [
              { id: '9-fiz-t1', name: 'Fiziğin Alt Dalları ve Fiziksel Büyüklükler (SI)', kazanimKodu: 'FIZ.9.1.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 90, tahminiCalismaSaati: 4 },
              { id: '9-fiz-t2', name: 'Vektörel & Skaler Büyüklükler ve Bilim Merkezleri', kazanimKodu: 'FIZ.9.1.2', onem: 'Temel', osymCikmaAirligi: 'TYT 1 Soru (Dönemsel)', hedefSoruOnerisi: 70, tahminiCalismaSaati: 3 }
            ]
          },
          {
            id: '9-fiz-u2',
            uniteNo: 2,
            uniteAdi: 'Madde ve Özellikleri',
            aciklama: 'Kütle, hacim, özkütle, dayanıklılık, adezyon, kohezyon, yüzey gerilimi ve kılcallık.',
            topics: [
              { id: '9-fiz-t3', name: 'Özkütle ve Karışımların Özkütlesi', kazanimKodu: 'FIZ.9.2.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 },
              { id: '9-fiz-t4', name: 'Dayanıklılık, Adezyon, Kohezyon ve Yüzey Gerilimi', kazanimKodu: 'FIZ.9.2.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 5, kocNotu: 'Günlük hayat örnekleri (böceklerin suda yürümesi, peçetenin suyu emmesi) çok sorulur.' }
            ]
          },
          {
            id: '9-fiz-u3',
            uniteNo: 3,
            uniteAdi: 'Hareket ve Kuvvet',
            aciklama: 'Konum, alınan yol, yer değiştirme, hız, sürat, düzgün doğrusal hareket, ivme, kuvvet, Newton hareket yasaları ve sürtünme.',
            topics: [
              { id: '9-fiz-t5', name: 'Doğrusal Hareket (Konum, Hız, Sürat ve İvme Grafikleri)', kazanimKodu: 'FIZ.9.3.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '9-fiz-t6', name: 'Newton’ın Hareket Yasaları (Eylemsizlik, Temel Yasa, Etki-Tepki)', kazanimKodu: 'FIZ.9.3.2', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT 1-2 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 },
              { id: '9-fiz-t7', name: 'Sürtünme Kuvveti (Statik ve Kinetik Sürtünme)', kazanimKodu: 'FIZ.9.3.3', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 110, tahminiCalismaSaati: 5 }
            ]
          },
          {
            id: '9-fiz-u4',
            uniteNo: 4,
            uniteAdi: 'Enerji, İş ve Güç',
            aciklama: 'Mekanik iş, kinetik enerji, potansiyel enerji, mekanik enerjinin korunumu ve verim.',
            topics: [
              { id: '9-fiz-t8', name: 'İş, Güç ve Enerji Kavramları', kazanimKodu: 'FIZ.9.4.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 },
              { id: '9-fiz-t9', name: 'Mekanik Enerjinin Korunumu ve Dönüşümleri', kazanimKodu: 'FIZ.9.4.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 6 }
            ]
          },
          {
            id: '9-fiz-u5',
            uniteNo: 5,
            uniteAdi: 'Isı ve Sıcaklık',
            aciklama: 'İç enerji, sıcaklık, ısı, öz ısı, ısı sığası, hâl değişimi, ısıl denge, ısı iletim yolları ve genleşme.',
            topics: [
              { id: '9-fiz-t10', name: 'Isı, Sıcaklık ve İç Enerji Kavram Farkları', kazanimKodu: 'FIZ.9.5.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 110, tahminiCalismaSaati: 5, kocNotu: '"Odanın ısısı arttı" gibi kavram yanılgıları ÖSYM\'nin en sevdiği tuzaklardandır.' },
              { id: '9-fiz-t11', name: 'Hâl Değişimi, Isıl Denge ve Isı İletim Yolları', kazanimKodu: 'FIZ.9.5.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '9-fiz-t12', name: 'Katı, Sıvı ve Gazlarda Genleşme', kazanimKodu: 'FIZ.9.5.3', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 }
            ]
          },
          {
            id: '9-fiz-u6',
            uniteNo: 6,
            uniteAdi: 'Elektrostatik',
            aciklama: 'Elektrik yükleri, sürtünme-dokunma-etki ile elektriklenme, elektroskop ve Coulomb yasası.',
            topics: [
              { id: '9-fiz-t13', name: 'Elektriklenme Çeşitleri ve İletken-Yalıtkan Maddeler', kazanimKodu: 'FIZ.9.6.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 90, tahminiCalismaSaati: 4 },
              { id: '9-fiz-t14', name: 'Elektroskop ve Coulomb Kuvveti', kazanimKodu: 'FIZ.9.6.2', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 110, tahminiCalismaSaati: 5 }
            ]
          }
        ]
      },
      {
        id: '9-kimya',
        dersAdi: 'Kimya',
        sinavTuru: 'TYT',
        colorTheme: 'teal',
        units: [
          {
            id: '9-kim-u1',
            uniteNo: 1,
            uniteAdi: 'Kimya Bilimi',
            aciklama: 'Simyadan kimyaya, kimya disiplinleri, element ve bileşikler, güvenlik uyarı işaretleri.',
            topics: [
              { id: '9-kim-t1', name: 'Simyadan Kimyaya & Kimya Disiplinleri', kazanimKodu: 'KIM.9.1.1', onem: 'Temel', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 80, tahminiCalismaSaati: 3 },
              { id: '9-kim-t2', name: 'Elementler, Bileşikler ve Güvenlik Sembolleri', kazanimKodu: 'KIM.9.1.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 4, kocNotu: 'Yaygın adlandırmalar (Zac yağı, Tuz ruhu, Sudkostik) ezberlenmeli.' }
            ]
          },
          {
            id: '9-kim-u2',
            uniteNo: 2,
            uniteAdi: 'Atom ve Periyodik Sistem',
            aciklama: 'Atom modelleri, atomun yapısı, izotop-izobar-izoton-izo縫ektronik, periyodik sistem ve periyodik özellikler.',
            topics: [
              { id: '9-kim-t3', name: 'Atom Modelleri ve Atom Altı Tanecikler', kazanimKodu: 'KIM.9.2.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 },
              { id: '9-kim-t4', name: 'Periyodik Sistem ve Periyodik Özelliklerin Değişimi', kazanimKodu: 'KIM.9.2.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 6, kocNotu: 'İyonlaşma enerjisi 3 aşağı 5 yukarı kuralı ve elektronegatiflik trendi.' }
            ]
          },
          {
            id: '9-kim-u3',
            uniteNo: 3,
            uniteAdi: 'Kimyasal Türler Arası Etkileşimler',
            aciklama: 'Güçlü etkileşimler (İyonik, Kovalent, Metalik) ve zayıf etkileşimler (Van der Waals, Hidrojen bağı).',
            topics: [
              { id: '9-kim-t5', name: 'Lewis Yapıları ve Güçlü Etkileşimler (İyonik, Kovalent)', kazanimKodu: 'KIM.9.3.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '9-kim-t6', name: 'Zayıf Etkileşimler (Dipol-Dipol, London, Hidrojen Bağı)', kazanimKodu: 'KIM.9.3.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 6, kocNotu: 'Kaynama noktası kıyaslama sorularında Hidrojen bağı belirleyicidir.' }
            ]
          },
          {
            id: '9-kim-u4',
            uniteNo: 4,
            uniteAdi: 'Maddenin Halleri ve Doğa-Kimya',
            aciklama: 'Katılar, sıvılar (viskozite, buhar basıncı), gazlar, plazma, su ve çevre kimyası.',
            topics: [
              { id: '9-kim-t7', name: 'Sıvılarda Viskozite ve Buhar Basıncı & Kaynama', kazanimKodu: 'KIM.9.4.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 5 },
              { id: '9-kim-t8', name: 'Katı Türleri (Kristal, Amorf) ve Gaz Davranışları', kazanimKodu: 'KIM.9.4.2', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 90, tahminiCalismaSaati: 4 },
              { id: '9-kim-t9', name: 'Su, Çevre Kimyası ve Sera Etkisi', kazanimKodu: 'KIM.9.4.3', onem: 'Temel', osymCikmaAirligi: 'TYT 1 Soru (Dönemsel)', hedefSoruOnerisi: 70, tahminiCalismaSaati: 3 }
            ]
          }
        ]
      },
      {
        id: '9-biyo',
        dersAdi: 'Biyoloji',
        sinavTuru: 'TYT',
        colorTheme: 'emerald',
        units: [
          {
            id: '9-bio-u1',
            uniteNo: 1,
            uniteAdi: 'Yaşam Bilimi Biyoloji',
            aciklama: 'Canlıların ortak özellikleri, inorganik bileşikler, organik bileşikler (karbonhidrat, yağ, protein, enzim, vitamin, nükleik asit, ATP).',
            topics: [
              { id: '9-bio-t1', name: 'Canlıların Ortak Özellikleri ve İnorganik Bileşikler', kazanimKodu: 'BIY.9.1.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 90, tahminiCalismaSaati: 4 },
              { id: '9-bio-t2', name: 'Organik Bileşikler (Karbonhidrat, Lipit, Protein)', kazanimKodu: 'BIY.9.1.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '9-bio-t3', name: 'Enzimler, Vitaminler, Nükleik Asitler ve ATP', kazanimKodu: 'BIY.9.1.3', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 6, kocNotu: 'Enzim hız grafiklerine etki eden faktörler (sıcaklık, pH, substrat) çok kritiktir.' }
            ]
          },
          {
            id: '9-bio-u2',
            uniteNo: 2,
            uniteAdi: 'Hücre ve Organelleri',
            aciklama: 'Hücre teorisi, prokaryot-ökaryot hücre, organeller ve hücre zarından madde geçişleri.',
            topics: [
              { id: '9-bio-t4', name: 'Hücre Zarının Yapısı ve Madde Geçişleri (Difüzyon, Osmoz, Aktif Taşıma, Endositoz, Ekzositoz)', kazanimKodu: 'BIY.9.2.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7, kocNotu: 'Turgor, plazmoliz ve osmotik basınç deney soruları kesin gelir.' },
              { id: '9-bio-t5', name: 'Sitoplazma ve Organeller (Mitokondri, Kloroplast, Ribozom, ER vb.)', kazanimKodu: 'BIY.9.2.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 6 }
            ]
          },
          {
            id: '9-bio-u3',
            uniteNo: 3,
            uniteAdi: 'Canlılar Dünyası ve Sınıflandırma',
            aciklama: 'Sınıflandırma ilkeleri, canlılar alemi (Bakteriler, Arkeler, Protistler, Bitkiler, Mantarlar, Hayvanlar) ve virüsler.',
            topics: [
              { id: '9-bio-t6', name: 'Sınıflandırma Basamakları ve İkili Adlandırma', kazanimKodu: 'BIY.9.3.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 },
              { id: '9-bio-t7', name: 'Canlılar Alemi ve Genel Özellikleri', kazanimKodu: 'BIY.9.3.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Omurgalı hayvan sınıfları (Balık, İki Yaşamlı, Sürüngen, Kuş, Memeli) tablosu.' },
              { id: '9-bio-t8', name: 'Virüsler ve Yapısal Özellikleri', kazanimKodu: 'BIY.9.3.3', onem: 'Orta', osymCikmaAirligi: 'TYT 1 Soru (Dönemsel)', hedefSoruOnerisi: 70, tahminiCalismaSaati: 3 }
            ]
          }
        ]
      },
      {
        id: '9-turkce',
        dersAdi: 'Türkçe & Edebiyat',
        sinavTuru: 'TYT',
        colorTheme: 'rose',
        units: [
          {
            id: '9-turk-u1',
            uniteNo: 1,
            uniteAdi: 'Anlam Bilgisi ve Paragraf Taktikleri',
            aciklama: 'Sözcükte anlam, cümlede anlam, paragrafta ana düşünce, yardımcı düşünce, anlatım biçimleri ve düşünceyi geliştirme yolları.',
            topics: [
              { id: '9-turk-t1', name: 'Sözcükte ve Söz Öbeklerinde Anlam', kazanimKodu: 'TUR.9.1.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 3-4 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 8 },
              { id: '9-turk-t2', name: 'Cümlede Anlam ve Kavramlar (Öznellik, Nesnellik, İma, Koşul)', kazanimKodu: 'TUR.9.1.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 3-4 Soru', hedefSoruOnerisi: 200, tahminiCalismaSaati: 8 },
              { id: '9-turk-t3', name: 'Paragrafta Yapı, Ana Düşünce ve Yardımcı Düşünceler', kazanimKodu: 'TUR.9.1.3', onem: 'Kritik', osymCikmaAirligi: 'TYT 22-26 Soru', hedefSoruOnerisi: 400, tahminiCalismaSaati: 20, kocNotu: 'Her gün eksiksiz 20-30 paragraf sorusu çözülmelidir.' }
            ]
          },
          {
            id: '9-turk-u2',
            uniteNo: 2,
            uniteAdi: 'Dil Bilgisi Temelleri',
            aciklama: 'Ses olayları, yazım kuralları, noktalama işaretleri ve sözcükte yapı.',
            topics: [
              { id: '9-turk-t4', name: 'Ses Bilgisi (Ünlü Düşmesi, Ünsüz Yumuşaması vb.)', kazanimKodu: 'TUR.9.2.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 5 },
              { id: '9-turk-t5', name: 'Yazım Kuralları (Bitişik/Ayrı Yazılanlar, Büyük Harfler, Sayılar)', kazanimKodu: 'TUR.9.2.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 7, kocNotu: 'TDK güncel yazım kılavuzu istisnalarına dikkat edilmeli.' },
              { id: '9-turk-t6', name: 'Noktalama İşaretleri', kazanimKodu: 'TUR.9.2.3', onem: 'Kritik', osymCikmaAirligi: 'TYT 2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 7 }
            ]
          }
        ]
      },
      {
        id: '9-sosyal',
        dersAdi: 'Tarih & Coğrafya & Din & Felsefe',
        sinavTuru: 'TYT',
        colorTheme: 'amber',
        units: [
          {
            id: '9-sos-u1',
            uniteNo: 1,
            uniteAdi: 'Tarih Bilimi ve İlk Türk Devletleri',
            aciklama: 'Tarih ve zaman, ilk uygarlıklar, Orta Asya Türk devletleri ve İslamiyet’in doğuşu.',
            topics: [
              { id: '9-sos-t1', name: 'Tarih ve Zaman & İlk Çağ Medeniyetleri', kazanimKodu: 'TAR.9.1.1', onem: 'Orta', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 80, tahminiCalismaSaati: 4 },
              { id: '9-sos-t2', name: 'İlk ve Orta Çağlarda Türk Dünyası (Hun, Göktürk, Uygur)', kazanimKodu: 'TAR.9.1.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 110, tahminiCalismaSaati: 5 }
            ]
          },
          {
            id: '9-sos-u2',
            uniteNo: 2,
            uniteAdi: 'Coğrafya: Doğal Sistemler & Harita Bilgisi',
            aciklama: 'Dünya’nın şekli ve hareketleri, harita bilgisi, iklim elemanları ve tipleri.',
            topics: [
              { id: '9-sos-t3', name: 'Dünya’nın Şekli ve Hareketleri & Koordinat Sistemi', kazanimKodu: 'COG.9.1.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 },
              { id: '9-sos-t4', name: 'Harita Bilgisi ve İzohips Yorumlama', kazanimKodu: 'COG.9.1.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 6 },
              { id: '9-sos-t5', name: 'İklim Bilgisi (Sıcaklık, Basınç, Rüzgarlar, Nem ve Yağış)', kazanimKodu: 'COG.9.1.3', onem: 'Kritik', osymCikmaAirligi: 'TYT 1-2 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 }
            ]
          }
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // 10. SINIF (TYT Tamamlama & AYT Altyapısı)
  // -------------------------------------------------------------
  {
    gradeId: '10',
    title: '10. Sınıf Müfredatı',
    subtitle: 'Fonksiyonlar, Polinomlar, Optik & Dalgalar',
    description: 'AYT matematiğinin ve TYT feninin en belirleyici konularının işlendiği kritik lise yılı.',
    subjects: [
      {
        id: '10-mat',
        dersAdi: 'Matematik',
        sinavTuru: 'TYT & AYT',
        colorTheme: 'indigo',
        units: [
          {
            id: '10-mat-u1',
            uniteNo: 1,
            uniteAdi: 'Sayma ve Olasılık',
            aciklama: 'Toplama ve çarpma prensibi, permütasyon, kombinasyon, binom açılımı ve basit olayların olasılığı.',
            topics: [
              { id: '10-mat-t1', name: 'Sayma Prensipleri ve Permütasyon (Tekrarlı Permütasyon)', kazanimKodu: 'MAT.10.1.1', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT 1-2 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 8 },
              { id: '10-mat-t2', name: 'Kombinasyon ve Geometrik Kombinasyon', kazanimKodu: 'MAT.10.1.2', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 },
              { id: '10-mat-t3', name: 'Binom Açılımı ve Katsayılar İlişkisi', kazanimKodu: 'MAT.10.1.3', onem: 'Yüksek', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 },
              { id: '10-mat-t4', name: 'Koşullu Olasılık ve Deneysel/Teorik Olasılık', kazanimKodu: 'MAT.10.1.4', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'ÖSYM’nin eleyici soru kalıplarının başında gelir.' }
            ]
          },
          {
            id: '10-mat-u2',
            uniteNo: 2,
            uniteAdi: 'Fonksiyonlar',
            aciklama: 'Fonksiyon kavramı, gösterimi, çeşitleri (bire bir, örten, sabit, birim, tek/çift), bileşke fonksiyon, ters fonksiyon ve grafikler.',
            topics: [
              { id: '10-mat-t5', name: 'Fonksiyon Tanım ve Değer Kümesi & Fonksiyon Türleri', kazanimKodu: 'MAT.10.2.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 },
              { id: '10-mat-t6', name: 'Bileşke Fonksiyon ve Fonksiyonun Tersi', kazanimKodu: 'MAT.10.2.2', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT 2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9, kocNotu: 'Fonksiyonlar tüm AYT analitik ve kalkülüs konularının temelidir.' },
              { id: '10-mat-t7', name: 'Fonksiyon Grafikleri ve Yorumlama', kazanimKodu: 'MAT.10.2.3', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT 1-2 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 8 }
            ]
          },
          {
            id: '10-mat-u3',
            uniteNo: 3,
            uniteAdi: 'Polinomlar ve Çarpanlara Ayırma',
            aciklama: 'Polinom tanımı, derecesi, katsayılar toplamı, sabit terim, polinom bölmesi, kalan bulma ve çarpanlara ayırma özdeşlikleri.',
            topics: [
              { id: '10-mat-t8', name: 'Polinomlarda Derece, Katsayı ve Temel İşlemler', kazanimKodu: 'MAT.10.3.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 6 },
              { id: '10-mat-t9', name: 'Polinomlarda Bölme ve Kalan Bulma Teoremi (P(x)/(x-a))', kazanimKodu: 'MAT.10.3.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 },
              { id: '10-mat-t10', name: 'Çarpanlara Ayırma Yöntemleri ve Özdeşlikler', kazanimKodu: 'MAT.10.3.3', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT 2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 8, kocNotu: 'Küp açılımları ve iki kare farkı refleks haline getirilmeli.' }
            ]
          },
          {
            id: '10-mat-u4',
            uniteNo: 4,
            uniteAdi: 'İkinci Dereceden Denklemler ve Karmaşık Sayılar',
            aciklama: 'İkinci dereceden bir bilinmeyenli denklemler, diskriminant (Delta), kök-katsayı bağıntıları ve karmaşık sayı kavramı.',
            topics: [
              { id: '10-mat-t11', name: 'İkinci Dereceden Denklemlerin Çözümü ve Diskriminant', kazanimKodu: 'MAT.10.4.1', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 },
              { id: '10-mat-t12', name: 'Kökler ile Katsayılar Arasındaki Bağıntılar', kazanimKodu: 'MAT.10.4.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 },
              { id: '10-mat-t13', name: 'Karmaşık Sayıların Tanımı ve i Kuvvetleri', kazanimKodu: 'MAT.10.4.3', onem: 'Orta', osymCikmaAirligi: 'AYT 1 Soru (Dönemsel)', hedefSoruOnerisi: 90, tahminiCalismaSaati: 4 }
            ]
          },
          {
            id: '10-mat-u5',
            uniteNo: 5,
            uniteAdi: 'Dörtgenler ve Çokgenler',
            aciklama: 'Dışbükey çokgenler, yamuk, paralelkenar, eşkenar dörtgen, dikdörtgen, kare, deltoid ve alan bağıntıları.',
            topics: [
              { id: '10-mat-t14', name: 'Çokgenlerde Açı ve Uzunluk Özellikleri', kazanimKodu: 'MAT.10.5.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT & AYT 1 Soru', hedefSoruOnerisi: 110, tahminiCalismaSaati: 5 },
              { id: '10-mat-t15', name: 'Yamuk ve Paralelkenar (Açı, Uzunluk, Alan)', kazanimKodu: 'MAT.10.5.2', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT 1-2 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 8 },
              { id: '10-mat-t16', name: 'Dikdörtgen ve Kare', kazanimKodu: 'MAT.10.5.3', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT 2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Yeni nesil katlama ve kesme soruları kare/dikdörtgende yoğunlaşır.' },
              { id: '10-mat-t17', name: 'Eşkenar Dörtgen ve Deltoid', kazanimKodu: 'MAT.10.5.4', onem: 'Yüksek', osymCikmaAirligi: 'TYT & AYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 }
            ]
          }
        ]
      },
      {
        id: '10-fizik',
        dersAdi: 'Fizik',
        sinavTuru: 'TYT',
        colorTheme: 'blue',
        units: [
          {
            id: '10-fiz-u1',
            uniteNo: 1,
            uniteAdi: 'Elektrik ve Manyetizma',
            aciklama: 'Elektrik akımı, potansiyel farkı, direnç, Ohm yasası, seri-paralel bağlama, lambaların parlaklığı, üreteçler, mıknatıslar ve manyetik alan.',
            topics: [
              { id: '10-fiz-t1', name: 'Elektrik Akımı, Direnç ve Ohm Yasası', kazanimKodu: 'FIZ.10.1.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 },
              { id: '10-fiz-t2', name: 'Devre Analizi ve Lamba Parlaklıkları', kazanimKodu: 'FIZ.10.1.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7, kocNotu: 'Direnç değişiminde parlaklık yorumlama soruları TYT klasiğidir.' },
              { id: '10-fiz-t3', name: 'Mıknatıs, Manyetik Alan ve Akımın Manyetik Etkisi', kazanimKodu: 'FIZ.10.1.3', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 }
            ]
          },
          {
            id: '10-fiz-u2',
            uniteNo: 2,
            uniteAdi: 'Basınç ve Kaldırma Kuvveti',
            aciklama: 'Katı basıncı, durgun sıvı basıncı, Pascal prensibi, açık hava basıncı, gaz basıncı ve Archimedes kaldırma kuvveti.',
            topics: [
              { id: '10-fiz-t4', name: 'Katı, Sıvı ve Gaz Basıncı (Bernoulli & Torricelli)', kazanimKodu: 'FIZ.10.2.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 },
              { id: '10-fiz-t5', name: 'Sıvıların Kaldırma Kuvveti ve Yüzme-Batma Dengesi', kazanimKodu: 'FIZ.10.2.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7, kocNotu: 'Ağırlaşma ve kap tabanındaki basınç değişimleri çok iyi analiz edilmeli.' }
            ]
          },
          {
            id: '10-fiz-u3',
            uniteNo: 3,
            uniteAdi: 'Dalgalar',
            aciklama: 'Dalgaların temel kavramları, yay dalgaları, su dalgaları, ses ve deprem dalgaları.',
            topics: [
              { id: '10-fiz-t6', name: 'Dalgalarda Temel Kavramlar & Yay Dalgaları', kazanimKodu: 'FIZ.10.3.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 110, tahminiCalismaSaati: 5 },
              { id: '10-fiz-t7', name: 'Su Dalgaları (Kırılma, Yansıma, Stroboskop)', kazanimKodu: 'FIZ.10.3.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '10-fiz-t8', name: 'Ses ve Deprem Dalgaları (Tını, Şiddet, Rezonans)', kazanimKodu: 'FIZ.10.3.3', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru (Dönemsel)', hedefSoruOnerisi: 90, tahminiCalismaSaati: 4 }
            ]
          },
          {
            id: '10-fiz-u4',
            uniteNo: 4,
            uniteAdi: 'Optik',
            aciklama: 'Aydınlanma, gölge, düzlem ayna, küresel aynalar, ışığın kırılması, tam yansıma ve mercekler.',
            topics: [
              { id: '10-fiz-t9', name: 'Aydınlanma, Işık Akısı ve Gölge Oluşumu', kazanimKodu: 'FIZ.10.4.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 },
              { id: '10-fiz-t10', name: 'Düzlem ve Küresel Aynalar (Çukur & Tümsek)', kazanimKodu: 'FIZ.10.4.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 },
              { id: '10-fiz-t11', name: 'Işığın Kırılması, Görünür Derinlik ve Tam Yansıma', kazanimKodu: 'FIZ.10.4.3', onem: 'Kritik', osymCikmaAirligi: 'TYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Snell yasası ve prizmalarda renk ayrımı soruları garantidir.' },
              { id: '10-fiz-t12', name: 'Mercekler ve Aydınlanma Cihazları (Büyüteç, Göz Kusurları)', kazanimKodu: 'FIZ.10.4.4', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 }
            ]
          }
        ]
      },
      {
        id: '10-kimya',
        dersAdi: 'Kimya',
        sinavTuru: 'TYT',
        colorTheme: 'teal',
        units: [
          {
            id: '10-kim-u1',
            uniteNo: 1,
            uniteAdi: 'Kimyanın Temel Kanunları ve Kimyasal Hesaplamalar',
            aciklama: 'Kütlenin korunumu, sabit oranlar, katlı oranlar, mol kavramı, kimyasal tepkime denklemleri ve sınırlayıcı bileşen hesaplamaları.',
            topics: [
              { id: '10-kim-t1', name: 'Kimyanın Temel Kanunları (Lavoisier, Proust, Dalton)', kazanimKodu: 'KIM.10.1.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 },
              { id: '10-kim-t2', name: 'Mol Kavramı ve Avogadro Sayısı', kazanimKodu: 'KIM.10.1.2', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT Temeli', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Mol hesaplama refleksleri tüm AYT kimyası için can damarıdır.' },
              { id: '10-kim-t3', name: 'Kimyasal Tepkimeler ve Hesaplamalar (Verim, Safsızlık)', kazanimKodu: 'KIM.10.1.3', onem: 'Kritik', osymCikmaAirligi: 'TYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 }
            ]
          },
          {
            id: '10-kim-u2',
            uniteNo: 2,
            uniteAdi: 'Karışımlar',
            aciklama: 'Homojen-heterojen karışımlar, çözünme süreci, kütlece/hacimce yüzde derişim, ppm, koligatif özellikler ve ayırma teknikleri.',
            topics: [
              { id: '10-kim-t4', name: 'Çözelti Derişimleri (Kütlece/Hacimce Yüzde, PPM)', kazanimKodu: 'KIM.10.2.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '10-kim-t5', name: 'Koligatif Özellikler (Kaynama Noktası Yükselmesi, Donma Noktası Alçalması)', kazanimKodu: 'KIM.10.2.2', onem: 'Kritik', osymCikmaAirligi: 'TYT & AYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 6 },
              { id: '10-kim-t6', name: 'Karışımları Ayırma Yöntemleri (Damıtma, Özütleme, Çöktürme)', kazanimKodu: 'KIM.10.2.3', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 5 }
            ]
          },
          {
            id: '10-kim-u3',
            uniteNo: 3,
            uniteAdi: 'Asitler, Bazlar ve Tuzlar',
            aciklama: 'Asit-baz tanımları, pH kavramı, indikatörler, asit-baz tepkimeleri, nötralleşme, metallerle tepkimeler ve tuzlar.',
            topics: [
              { id: '10-kim-t7', name: 'Asit ve Bazların Genel Özellikleri & pH Ölçeği', kazanimKodu: 'KIM.10.3.1', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 },
              { id: '10-kim-t8', name: 'Asit-Baz Tepkimeleri ve Metallerle Etkileşimleri (Aktif, Amfoter, Soy)', kazanimKodu: 'KIM.10.3.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7, kocNotu: 'Soy metaller (Cu, Ag, Hg, Pt, Au) hangi asitlerle tepkime verir tablosu.' },
              { id: '10-kim-t9', name: 'Önemli Tuzlar ve Kullanım Alanları (NaCl, NaHCO3, CaCO3)', kazanimKodu: 'KIM.10.3.3', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 90, tahminiCalismaSaati: 4 }
            ]
          },
          {
            id: '10-kim-u4',
            uniteNo: 4,
            uniteAdi: 'Kimya Her Yerde',
            aciklama: 'Temizlik maddeleri (sabun, deterjan, çamaşır suyu), polimerler, kozmetikler ve ilaç formları.',
            topics: [
              { id: '10-kim-t10', name: 'Temizlik Maddeleri ve Polimerler', kazanimKodu: 'KIM.10.4.1', onem: 'Orta', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 80, tahminiCalismaSaati: 4 }
            ]
          }
        ]
      },
      {
        id: '10-biyo',
        dersAdi: 'Biyoloji',
        sinavTuru: 'TYT',
        colorTheme: 'emerald',
        units: [
          {
            id: '10-bio-u1',
            uniteNo: 1,
            uniteAdi: 'Hücre Bölünmeleri',
            aciklama: 'Hücre döngüsü, mitoz bölünme, eşeysiz üreme çeşitleri, mayoz bölünme, eşeyli üreme ve crossing-over.',
            topics: [
              { id: '10-bio-t1', name: 'Hücre Döngüsü ve Mitoz Bölünme Evreleri', kazanimKodu: 'BIY.10.1.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '10-bio-t2', name: 'Eşeysiz Üreme Şekilleri (Tomurcuklanma, Rejenerasyon vb.)', kazanimKodu: 'BIY.10.1.2', onem: 'Yüksek', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 90, tahminiCalismaSaati: 4 },
              { id: '10-bio-t3', name: 'Mayoz Bölünme ve Eşeyli Üreme (Kromozom & DNA Sayısı Grafikleri)', kazanimKodu: 'BIY.10.1.3', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7, kocNotu: 'DNA miktarı ve kromatit sayısı grafikleri ÖSYM’nin vazgeçilmezidir.' }
            ]
          },
          {
            id: '10-bio-u2',
            uniteNo: 2,
            uniteAdi: 'Kalıtımın Genel Esasları',
            aciklama: 'Mendel genetiği, monohibrit-dihibrit çaprazlama, eş baskınlık, çok alellilik, kan grupları, eşeye bağlı kalıtım ve soyağaçları.',
            topics: [
              { id: '10-bio-t4', name: 'Mendel İlkeleri ve Çaprazlamalar', kazanimKodu: 'BIY.10.2.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 },
              { id: '10-bio-t5', name: 'Eş Baskınlık ve Kan Grupları (ABO & Rh)', kazanimKodu: 'BIY.10.2.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '10-bio-t6', name: 'Eşeye Bağlı Kalıtım (Hemofili, Renk Körlüğü) ve Soyağacı Analizleri', kazanimKodu: 'BIY.10.2.3', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9, kocNotu: 'Soyağacı soruları her yıl garantili 1 TYT sorusudur.' }
            ]
          },
          {
            id: '10-bio-u3',
            uniteNo: 3,
            uniteAdi: 'Ekosistem Ekolojisi ve Güncel Çevre Sorunları',
            aciklama: 'Ekosistem bileşenleri, besin zinciri ve besin ağı, enerji piramidi, madde döngüleri (Karbon, Azot, Su) ve biyoçeşitlilik.',
            topics: [
              { id: '10-bio-t7', name: 'Besin Zinciri, Enerji Piramidi ve Biyolojik Birikim', kazanimKodu: 'BIY.10.3.1', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 5 },
              { id: '10-bio-t8', name: 'Madde Döngüleri (Azot & Karbon Döngüsü) ve Çevre Sorunları', kazanimKodu: 'BIY.10.3.2', onem: 'Kritik', osymCikmaAirligi: 'TYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6, kocNotu: 'Azot döngüsündeki nitrifikasyon ve denitrifikasyon bakterilerinin rolleri.' }
            ]
          }
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // 11. SINIF (AYT Çekirdek Alan Müfredatı)
  // -------------------------------------------------------------
  {
    gradeId: '11',
    title: '11. Sınıf Müfredatı',
    subtitle: 'AYT’nin Kalbi: Trigonometri, Mekanik, Çözeltiler & Fizyoloji',
    description: 'YKS AYT sınav puanının yaklaşık %55-65’ini oluşturan, en kapsamlı ve en çok soru getiren lise müfredat yılı.',
    subjects: [
      {
        id: '11-mat',
        dersAdi: 'Matematik (AYT)',
        sinavTuru: 'AYT',
        colorTheme: 'indigo',
        units: [
          {
            id: '11-mat-u1',
            uniteNo: 1,
            uniteAdi: 'Trigonometri I',
            aciklama: 'Yönlü açılar, birim çember, trigonometrik fonksiyonlar, indirgeme formülleri, sinüs ve kosinüs teoremleri, periyot ve ters trigonometrik fonksiyonlar.',
            topics: [
              { id: '11-mat-t1', name: 'Yönlü Açılar ve Birim Çember Üzerinde Trigonometrik Fonksiyonlar', kazanimKodu: 'MAT.11.1.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 8 },
              { id: '11-mat-t2', name: 'Trigonometrik Özdeşlikler ve İndirgeme Formülleri (pi/2 ve pi dönüşümleri)', kazanimKodu: 'MAT.11.1.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9, kocNotu: 'İşaret ve isim değiştirme kurallarını şematik olarak çalışın.' },
              { id: '11-mat-t3', name: 'Kosinüs Teoremi, Sinüs Teoremi ve Alan Bağıntıları', kazanimKodu: 'MAT.11.1.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 },
              { id: '11-mat-t4', name: 'Trigonometrik Fonksiyon Grafiklerinin Periyotları ve Arcsin/Arccos', kazanimKodu: 'MAT.11.1.4', onem: 'Yüksek', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 6 }
            ]
          },
          {
            id: '11-mat-u2',
            uniteNo: 2,
            uniteAdi: 'Analitik Geometri',
            aciklama: 'Noktanın analitik incelenmesi, doğrunun eğimi, doğru denklemleri, paralel/dik doğrular ve noktanın doğruya uzaklığı.',
            topics: [
              { id: '11-mat-t5', name: 'Noktanın Analitiği (İki Nokta Arası Uzaklık, Orta Nokta, Orantılı Bölme)', kazanimKodu: 'MAT.11.2.1', onem: 'Yüksek', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 6 },
              { id: '11-mat-t6', name: 'Doğrunun Eğimi, Doğru Denklemleri ve Doğruların Birbirine Göre Durumları', kazanimKodu: 'MAT.11.2.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9, kocNotu: 'Dik kesişen doğruların eğimleri çarpımı = -1 kuralı.' },
              { id: '11-mat-t7', name: 'Noktanın Doğruya ve Paralel Doğrular Arası Uzaklık Formülleri', kazanimKodu: 'MAT.11.2.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 }
            ]
          },
          {
            id: '11-mat-u3',
            uniteNo: 3,
            uniteAdi: 'Fonksiyonlarda Uygulamalar ve Parabol',
            aciklama: 'İkinci dereceden fonksiyonlar (parabol), tepe noktası, simetri ekseni, parabol-doğru ilişkisi ve fonksiyon ötelemeleri/dönüşümleri.',
            topics: [
              { id: '11-mat-t8', name: 'Parabolün Grafiği, Tepe Noktası (r, k) ve En Büyük/En Küçük Değer', kazanimKodu: 'MAT.11.3.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9 },
              { id: '11-mat-t9', name: 'Parabol ile Doğrunun Durumları ve Ortak Çözüm', kazanimKodu: 'MAT.11.3.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 },
              { id: '11-mat-t10', name: 'Fonksiyon Dönüşümleri (f(x+a), f(x)+b, -f(x), f(-x), |f(x)|)', kazanimKodu: 'MAT.11.3.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7, kocNotu: 'Türev ve integral grafik sorularında doğrudan kullanılır.' }
            ]
          },
          {
            id: '11-mat-u4',
            uniteNo: 4,
            uniteAdi: 'Denklem ve Eşitsizlik Sistemleri',
            aciklama: 'İkinci dereceden iki bilinmeyenli denklem sistemleri, ikinci dereceden bir bilinmeyenli eşitsizlikler ve işaret tabloları.',
            topics: [
              { id: '11-mat-t11', name: 'İkinci Dereceden Eşitsizlikler ve İşaret İnceleme Tablosu', kazanimKodu: 'MAT.11.4.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 170, tahminiCalismaSaati: 8, kocNotu: 'Çift katlı kök ve mutlak değer köklerinde işaret değişmeme kuralı.' },
              { id: '11-mat-t12', name: 'Eşitsizlik Sistemleri ve Grafik Çözüm Bölgeleri', kazanimKodu: 'MAT.11.4.2', onem: 'Yüksek', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 }
            ]
          },
          {
            id: '11-mat-u5',
            uniteNo: 5,
            uniteAdi: 'Çember ve Daire',
            aciklama: 'Çemberde teğet-kiriş özellikleri, çemberde açılar (merkez, çevre, teğet-kiriş), çemberde uzunluk, dairenin çevresi ve alanı.',
            topics: [
              { id: '11-mat-t13', name: 'Çemberde Açılar (Merkez, Çevre, İç ve Dış Açı)', kazanimKodu: 'MAT.11.5.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 },
              { id: '11-mat-t14', name: 'Çemberde Teğet-Kiriş Bağıntıları ve Uzunluk', kazanimKodu: 'MAT.11.5.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 },
              { id: '11-mat-t15', name: 'Dairede Alan ve Daire Dilimi Alanı', kazanimKodu: 'MAT.11.5.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 }
            ]
          }
        ]
      },
      {
        id: '11-fizik',
        dersAdi: 'Fizik (AYT)',
        sinavTuru: 'AYT',
        colorTheme: 'blue',
        units: [
          {
            id: '11-fiz-u1',
            uniteNo: 1,
            uniteAdi: 'Kuvvet ve Hareket (Vektörler, Bağıl Hareket, Dinamik)',
            aciklama: 'İki ve üç boyutlu vektörler, bağıl hareket, nehir problemleri, Newton hareket yasaları, sabit ivmeli hareket ve serbest düşme/atışlar.',
            topics: [
              { id: '11-fiz-t1', name: 'Vektörler ve Bağıl Hareket (Nehir Problemleri)', kazanimKodu: 'FIZ.11.1.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '11-fiz-t2', name: 'Newton’ın Hareket Yasaları ve Sürtünmeli Eğik Düzlem', kazanimKodu: 'FIZ.11.1.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 },
              { id: '11-fiz-t3', name: 'Bir ve İki Boyutta Sabit İvmeli Hareket (Yatay ve Eğik Atış)', kazanimKodu: 'FIZ.11.1.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 170, tahminiCalismaSaati: 8, kocNotu: 'Eğik atışta hız bileşenlerinin korunumu ve maksimum yükseklik formülleri.' },
              { id: '11-fiz-t4', name: 'İş, Güç ve Mekanik Enerjinin Korunumu', kazanimKodu: 'FIZ.11.1.4', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 },
              { id: '11-fiz-t5', name: 'İtme ve Çizgisel Momentum (Esnek ve Esnek Olmayan Çarpışmalar)', kazanimKodu: 'FIZ.11.1.5', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Patlamalar ve 2 boyutlu momentum korunum vektörleri.' },
              { id: '11-fiz-t6', name: 'Tork, Denge ve Kütle/Ağırlık Merkezi', kazanimKodu: 'FIZ.11.1.6', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 },
              { id: '11-fiz-t7', name: 'Basit Makineler (Kaldıraç, Makara, Eğik Düzlem, Vida, Çıkrık, Dişli/Kasnak)', kazanimKodu: 'FIZ.11.1.7', onem: 'Yüksek', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 6 }
            ]
          },
          {
            id: '11-fiz-u2',
            uniteNo: 2,
            uniteAdi: 'Elektrik ve Manyetizma (AYT)',
            aciklama: 'Coulomb kuvveti, elektrik alan, elektriksel potansiyel enerji ve potansiyel, düzgün elektrik alan ve sığaçlar, manyetik alan, manyetik kuvvet, indüksiyon ve alternatif akım.',
            topics: [
              { id: '11-fiz-t8', name: 'Noktasal Yüklerde Elektriksel Kuvvet, Alan ve Potansiyel', kazanimKodu: 'FIZ.11.2.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 },
              { id: '11-fiz-t9', name: 'Düzgün Elektrik Alan (Paralel Levhalar) ve Sığaçlar (Kondansatör)', kazanimKodu: 'FIZ.11.2.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 8 },
              { id: '11-fiz-t10', name: 'Manyetik Alan ve Manyetik Kuvvet (Sağ El Kuralı)', kazanimKodu: 'FIZ.11.2.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Sağ el kuralı varyasyonları (Tel, Halka, Akım Taşıyan Çerçeve) üç boyutlu düşünülmeli.' },
              { id: '11-fiz-t11', name: 'Elektromanyetik İndüksiyon, Faraday ve Lenz Yasası & Öz-İndüksiyon', kazanimKodu: 'FIZ.11.2.4', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 170, tahminiCalismaSaati: 8 },
              { id: '11-fiz-t12', name: 'Alternatif Akım (R-L-C Devreleri, Empedans, Rezonans) ve Transformatörler', kazanimKodu: 'FIZ.11.2.5', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 }
            ]
          }
        ]
      },
      {
        id: '11-kimya',
        dersAdi: 'Kimya (AYT)',
        sinavTuru: 'AYT',
        colorTheme: 'teal',
        units: [
          {
            id: '11-kim-u1',
            uniteNo: 1,
            uniteAdi: 'Modern Atom Teorisi',
            aciklama: 'Bohr atom modelinin sınırları, kuantum sayıları (n, l, ml, ms), elektron dizilimleri (Aufbau, Pauli, Hund) ve periyodik özellikler.',
            topics: [
              { id: '11-kim-t1', name: 'Kuantum Sayıları ve Orbital Türleri (s, p, d, f)', kazanimKodu: 'KIM.11.1.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '11-kim-t2', name: 'Elektron Dizilimleri, Küresel Simetri ve Yükseltgenme Basamakları', kazanimKodu: 'KIM.11.1.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 }
            ]
          },
          {
            id: '11-kim-u2',
            uniteNo: 2,
            uniteAdi: 'Gazlar',
            aciklama: 'İdeal gaz yasası (P.V=n.R.T), gaz kanunları, kinetik teori, Graham difüzyon yasası, kısmi basınçlar, gaz karışımları ve gerçek gazlar.',
            topics: [
              { id: '11-kim-t3', name: 'İdeal Gaz Denklemi ve Gaz Yasaları (Boyle, Charles, Gay-Lussac, Avogadro)', kazanimKodu: 'KIM.11.2.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 },
              { id: '11-kim-t4', name: 'Kinetik Teori, Gazlarda Difüzyon/Efüzyon ve Kısmi Basınç', kazanimKodu: 'KIM.11.2.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Su üstünde toplanan gaz hesaplamalarında suyun buhar basıncı unutulmamalı.' },
              { id: '11-kim-t5', name: 'Gerçek Gazlar, Joule-Thomson Olayı ve Kritik Sıcaklık', kazanimKodu: 'KIM.11.2.3', onem: 'Yüksek', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 100, tahminiCalismaSaati: 5 }
            ]
          },
          {
            id: '11-kim-u3',
            uniteNo: 3,
            uniteAdi: 'Sıvı Çözeltiler ve Çözünürlük',
            aciklama: 'Molarite, molalite, kütlece/hacimce yüzde, ppm, mol kesri, çözeltilerin koligatif özellikleri (Raoult yasası) ve çözünürlüğe etki eden faktörler.',
            topics: [
              { id: '11-kim-t6', name: 'Derişim Birimleri (Molarite, Molalite, Mol Kesri)', kazanimKodu: 'KIM.11.3.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 },
              { id: '11-kim-t7', name: 'Koligatif Özellikler (Kaynama/Donma Noktası, Osmotik Basınç, Buhar Basıncı)', kazanimKodu: 'KIM.11.3.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 },
              { id: '11-kim-t8', name: 'Çözünürlük ve Çözünürlüğe Etki Eden Faktörler (Sıcaklık, Basınç, Ortak İyon)', kazanimKodu: 'KIM.11.3.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 }
            ]
          },
          {
            id: '11-kim-u4',
            uniteNo: 4,
            uniteAdi: 'Kimyasal Tepkimelerde Enerji, Hız ve Denge',
            aciklama: 'Tepkime ısısı (Entalpi - Delta H), Hess yasası, bağ enerjileri, çarpışma teorisi, tepkime hız bağıntısı, kimyasal denge (Kc, Kp), Le Chatelier ilkesi, asit-baz dengesi (Ka, Kb, tampon, hidroliz) ve KÇÇ.',
            topics: [
              { id: '11-kim-t9', name: 'Tepkime Entalpisi ve Hess Yasası', kazanimKodu: 'KIM.11.4.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 },
              { id: '11-kim-t10', name: 'Tepkime Hızına Etki Eden Faktörler ve Mekanizmalı Tepkimeler', kazanimKodu: 'KIM.11.4.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 },
              { id: '11-kim-t11', name: 'Kimyasal Denge ve Dengeye Etki Eden Faktörler (Le Chatelier)', kazanimKodu: 'KIM.11.4.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 170, tahminiCalismaSaati: 8, kocNotu: 'Denge grafikleri ve hacim değişiminin derişimlere anlık etkileri.' },
              { id: '11-kim-t12', name: 'Sulu Çözelti Dengeleri: Asit-Baz (pH, Titrasyon, Tampon) ve KÇÇ', kazanimKodu: 'KIM.11.4.4', onem: 'Kritik', osymCikmaAirligi: 'AYT 2 Soru', hedefSoruOnerisi: 200, tahminiCalismaSaati: 10, kocNotu: 'Ortak iyonun çözünürlüğe etkisi ve titrasyon eğrileri en kritik soru tipidir.' }
            ]
          }
        ]
      },
      {
        id: '11-biyo',
        dersAdi: 'Biyoloji (İnsan Fizyolojisi & Sistemler)',
        sinavTuru: 'AYT',
        colorTheme: 'emerald',
        units: [
          {
            id: '11-bio-u1',
            uniteNo: 1,
            uniteAdi: 'İnsan Fizyolojisi: Denetleyici ve Düzenleyici Sistemler',
            aciklama: 'Sinir sistemi (nöron yapısı, impuls iletimi, beyin, omurilik, sempatik-parasempatik), endokrin bezler ve hormonlar, duyu organları (göz, kulak, burun, dil, deri).',
            topics: [
              { id: '11-bio-t1', name: 'Sinir Dokusu, İmpuls Oluşumu ve İletimi (Polarizasyon, Depolarizasyon, Sinaps)', kazanimKodu: 'BIY.11.1.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 },
              { id: '11-bio-t2', name: 'Merkezi ve Çevresel Sinir Sistemi Bölümleri', kazanimKodu: 'BIY.11.1.2', onem: 'Yüksek', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 6 },
              { id: '11-bio-t3', name: 'Endokrin Sistem: Hipofiz, Tiroid, Pankreas, Böbrek Üstü Hormonları', kazanimKodu: 'BIY.11.1.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Geri bildirim (Feedback) mekanizmaları ve hormon yetersizliği hastalıkları.' },
              { id: '11-bio-t4', name: 'Duyu Organları Yapısı ve Görme/İşitme Mekanizması', kazanimKodu: 'BIY.11.1.4', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 }
            ]
          },
          {
            id: '11-bio-u2',
            uniteNo: 2,
            uniteAdi: 'Destek-Hareket, Sindirim, Dolaşım-Bağışıklık, Solunum ve Boşaltım',
            aciklama: 'Kemik-kıkırdak-eklem doku, kas kasılması mekanizması (Huxley kayan iplikler), sindirim organları ve enzimleri, kalp ve damarlar, kan dokusu ve bağışıklık, akciğer ve gaz taşınması, böbrek ve nefron yapısı.',
            topics: [
              { id: '11-bio-t5', name: 'Destek ve Hareket Sistemi (Kas Kasılması ve Sarkomer Değişimleri)', kazanimKodu: 'BIY.11.2.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 },
              { id: '11-bio-t6', name: 'Sindirim Sistemi Organları, Enzimleri ve Emilim Yolları', kazanimKodu: 'BIY.11.2.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Yağların lenf yoluyla ve glikoz/amino asitlerin kapı toplardamarıyla taşınma güzergahı.' },
              { id: '11-bio-t7', name: 'Dolaşım Sistemi (Kalbin Çalışması, Damarlar, Kan Hücreleri ve Lenf)', kazanimKodu: 'BIY.11.2.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 170, tahminiCalismaSaati: 8 },
              { id: '11-bio-t8', name: 'Bağışıklık Sistemi (Hümoral ve Hücresel Bağışıklık, Aşı ve Serum)', kazanimKodu: 'BIY.11.2.4', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '11-bio-t9', name: 'Solunum Sistemi ve Kanda Gazların (O2, CO2) Taşınması', kazanimKodu: 'BIY.11.2.5', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7, kocNotu: 'Bohr etkisi ve bikarbonat iyonları şeklinde CO2 taşınma reaksiyonları.' },
              { id: '11-bio-t10', name: 'Boşaltım Sistemi ve Nefronda İdrar Oluşumu (Süzülme, Geri Emilim, Salgılama)', kazanimKodu: 'BIY.11.2.6', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 }
            ]
          },
          {
            id: '11-bio-u3',
            uniteNo: 3,
            uniteAdi: 'Komünite ve Popülasyon Ekolojisi',
            aciklama: 'Komünitede tür içi ve türler arası rekabet, simbiyotik ilişkiler (mutualizm, kommensalizm, parazitizm), süksesyon, popülasyon dinamiği ve büyüme eğrileri.',
            topics: [
              { id: '11-bio-t11', name: 'Simbiyotik Yaşam Şekilleri ve Süksesyon', kazanimKodu: 'BIY.11.3.1', onem: 'Yüksek', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 110, tahminiCalismaSaati: 5 },
              { id: '11-bio-t12', name: 'Popülasyon Yoğunluğu, Yaş Dağılımı ve Büyüme Eğrileri (S ve J Tipi)', kazanimKodu: 'BIY.11.3.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 5 }
            ]
          }
        ]
      },
      {
        id: '11-edebiyat',
        dersAdi: 'Türk Dili ve Edebiyatı (AYT)',
        sinavTuru: 'AYT',
        colorTheme: 'rose',
        units: [
          {
            id: '11-edeb-u1',
            uniteNo: 1,
            uniteAdi: 'Tanzimat, Servetifünun ve Fecriati Edebiyatı',
            aciklama: 'Dönem özellikleri, sanatçıları, eserleri, şiir ve roman anlayışları.',
            topics: [
              { id: '11-edeb-t1', name: 'Tanzimat I. ve II. Dönem Edebiyatı (Şinasi, Namık Kemal, Recaizade vb.)', kazanimKodu: 'EDB.11.1.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 2-3 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 },
              { id: '11-edeb-t2', name: 'Servetifünun ve Fecriati Dönemi (Tevfik Fikret, Cenap Şahabettin, Ahmet Haşim)', kazanimKodu: 'EDB.11.1.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 2-3 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Ahmet Haşim Piyale ön sözü ve Saf Şiir anlayışı.' }
            ]
          },
          {
            id: '11-edeb-u2',
            uniteNo: 2,
            uniteAdi: 'Millî Edebiyat Dönemi',
            aciklama: 'Genç Kalemler, Yeni Lisan Hareketi, Millî Edebiyat romancıları ve şairleri.',
            topics: [
              { id: '11-edeb-t3', name: 'Millî Edebiyat Hareketi, Ömer Seyfettin, Ziya Gökalp, Yakup Kadri, Halide Edip, Reşat Nuri', kazanimKodu: 'EDB.11.2.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 3-4 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9, kocNotu: 'Yakup Kadri ve Halide Edip romanlarının karakter kadrosu ve temaları.' }
            ]
          }
        ]
      }
    ]
  },

  // -------------------------------------------------------------
  // 12. SINIF (AYT Zirve: Türev, İntegral, Organik, Modern Fizik)
  // -------------------------------------------------------------
  {
    gradeId: '12',
    title: '12. Sınıf Müfredatı',
    subtitle: 'AYT Zirvesi: Türev, İntegral, Organik Kimya, Modern Fizik',
    description: 'YKS AYT sınavının en yüksek ayırt ediciliğe sahip ve en derin konularını barındıran son lise kademesi.',
    subjects: [
      {
        id: '12-mat',
        dersAdi: 'Matematik (AYT)',
        sinavTuru: 'AYT',
        colorTheme: 'indigo',
        units: [
          {
            id: '12-mat-u1',
            uniteNo: 1,
            uniteAdi: 'Üstel ve Logaritmik Fonksiyonlar',
            aciklama: 'Üstel fonksiyon, logaritma fonksiyonu, logaritma özellikleri, taban değiştirme, logaritmik denklem ve eşitsizlikler.',
            topics: [
              { id: '12-mat-t1', name: 'Logaritma Fonksiyonunun Tanım Kümesi ve Temel Özellikleri', kazanimKodu: 'MAT.12.1.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 },
              { id: '12-mat-t2', name: 'Taban Değiştirme Kuralı ve Logaritmik Denklemler/Eşitsizlikler', kazanimKodu: 'MAT.12.1.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Gerçek hayat modellemeleri (Deprem şiddeti, pH hesabı, ses düzeyi).' }
            ]
          },
          {
            id: '12-mat-u2',
            uniteNo: 2,
            uniteAdi: 'Diziler',
            aciklama: 'Dizi kavramı, genel terim, aritmetik dizi, geometrik dizi, ilk n terim toplamı ve sonsuz geometrik dizi (seri mantığı).',
            topics: [
              { id: '12-mat-t3', name: 'Dizi Tanımı ve Genel Terim Bulma', kazanimKodu: 'MAT.12.2.1', onem: 'Yüksek', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 6 },
              { id: '12-mat-t4', name: 'Aritmetik ve Geometrik Diziler (Sn Formülleri)', kazanimKodu: 'MAT.12.2.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 }
            ]
          },
          {
            id: '12-mat-u3',
            uniteNo: 3,
            uniteAdi: 'Trigonometri II (Toplam-Fark & Yarım Açı)',
            aciklama: 'Toplam ve fark formülleri, iki kat açı (yarım açı) formülleri ve trigonometrik denklemler.',
            topics: [
              { id: '12-mat-t5', name: 'Toplam ve Fark Formülleri (sin(a+b), cos(a+b), tan(a+b))', kazanimKodu: 'MAT.12.3.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9 },
              { id: '12-mat-t6', name: 'Yarım Açı Formülleri (sin 2x, cos 2x, tan 2x)', kazanimKodu: 'MAT.12.3.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9, kocNotu: 'cos 2x açılımlarının sadeleştirmelerde kullanımı en kritik beceridir.' },
              { id: '12-mat-t7', name: 'Trigonometrik Denklemler (sin x = a, cos x = a, tan x = a)', kazanimKodu: 'MAT.12.3.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 }
            ]
          },
          {
            id: '12-mat-u4',
            uniteNo: 4,
            uniteAdi: 'Limit ve Süreklilik',
            aciklama: 'Sağdan ve soldan limit, limit özellikleri, 0/0 belirsizliği ve bir noktada süreklilik şartı.',
            topics: [
              { id: '12-mat-t8', name: 'Limit Kavramı, Sağ-Sol Limit ve Limit Kuralları', kazanimKodu: 'MAT.12.4.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 },
              { id: '12-mat-t9', name: '0/0 Belirsizliği ve Sadeleştirme Teknikleri', kazanimKodu: 'MAT.12.4.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 },
              { id: '12-mat-t10', name: 'Süreklilik ve Süreksizlik Noktaları', kazanimKodu: 'MAT.12.4.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 }
            ]
          },
          {
            id: '12-mat-u5',
            uniteNo: 5,
            uniteAdi: 'Türev ve Uygulamaları',
            aciklama: 'Türev tanımı, türev alma kuralları, zincir kuralı, teğet ve normal denklemleri, artan-azalan fonksiyonlar, yerel ekstremum noktalar ve maksimum-minimum problemleri.',
            topics: [
              { id: '12-mat-t11', name: 'Türev Alma Kuralları ve Bileşke Fonksiyonun Türevi (Zincir Kuralı)', kazanimKodu: 'MAT.12.5.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 190, tahminiCalismaSaati: 10 },
              { id: '12-mat-t12', name: 'Türevin Geometrik Yorumu: Teğet ve Normal Denklemleri', kazanimKodu: 'MAT.12.5.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9 },
              { id: '12-mat-t13', name: 'Artan-Azalanlık, Yerel Ekstremum ve Dönüm Noktaları', kazanimKodu: 'MAT.12.5.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 2 Soru', hedefSoruOnerisi: 200, tahminiCalismaSaati: 10, kocNotu: 'f(x) ile f\'(x) grafiklerinin birbirine geçiş analizi.' },
              { id: '12-mat-t14', name: 'Maksimum ve Minimum Problemleri (Optimizasyon)', kazanimKodu: 'MAT.12.5.4', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 170, tahminiCalismaSaati: 8 }
            ]
          },
          {
            id: '12-mat-u6',
            uniteNo: 6,
            uniteAdi: 'İntegral ve Uygulamaları',
            aciklama: 'Belirsiz integral, diferansiyel kavramı, değişken değiştirme yöntemi, belirli integral, Riemann toplamı ve eğriler arasında kalan alan hesabı.',
            topics: [
              { id: '12-mat-t15', name: 'Belirsiz İntegral ve Değişken Değiştirme Metodu (u-du)', kazanimKodu: 'MAT.12.6.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 190, tahminiCalismaSaati: 10 },
              { id: '12-mat-t16', name: 'Belirli İntegral Özellikleri ve Parçalı/Mutlak Değer İntegrali', kazanimKodu: 'MAT.12.6.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9 },
              { id: '12-mat-t17', name: 'İntegral ile Alan Hesabı ve İki Eğri Arasındaki Alan', kazanimKodu: 'MAT.12.6.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 2 Soru', hedefSoruOnerisi: 220, tahminiCalismaSaati: 11, kocNotu: 'Parabol ile doğru arası alan formülü ve simetri kullanımı.' }
            ]
          },
          {
            id: '12-mat-u7',
            uniteNo: 7,
            uniteAdi: 'Çemberin Analitik İncelenmesi',
            aciklama: 'Merkezi ve yarıçapı bilinen çember denklemi, genel çember denklemi, çember ile doğrunun durumu.',
            topics: [
              { id: '12-mat-t18', name: 'Çember Denklemi ve Genel Denklem İncelemesi', kazanimKodu: 'MAT.12.7.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 8 }
            ]
          }
        ]
      },
      {
        id: '12-fizik',
        dersAdi: 'Fizik (AYT)',
        sinavTuru: 'AYT',
        colorTheme: 'blue',
        units: [
          {
            id: '12-fiz-u1',
            uniteNo: 1,
            uniteAdi: 'Çembersel Hareket ve Dönme Kinetik Enerjisi',
            aciklama: 'Düzgün çembersel hareket, merkezcil ivme/kuvvet, virajlar, dönerek öteleme hareketi, eylemsizlik momenti, açısal momentum ve korunumu, Kepler yasaları ve kütle çekimi.',
            topics: [
              { id: '12-fiz-t1', name: 'Düzgün Çembersel Hareket ve Yatay/Düşey/Eğimli Virajlar', kazanimKodu: 'FIZ.12.1.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 },
              { id: '12-fiz-t2', name: 'Dönme Kinetik Enerjisi ve Açısal Momentumun Korunumu', kazanimKodu: 'FIZ.12.1.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 170, tahminiCalismaSaati: 8, kocNotu: 'Buz patencisinin kollarını kapatması örneği ve tork-açısal momentum ilişkisi.' },
              { id: '12-fiz-t3', name: 'Kütle Çekim Kuvveti, Bağlanma/Kurtulma Enerjisi ve Kepler Yasaları', kazanimKodu: 'FIZ.12.1.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 }
            ]
          },
          {
            id: '12-fiz-u2',
            uniteNo: 2,
            uniteAdi: 'Basit Harmonik Hareket',
            aciklama: 'Yay sarkacı, basit sarkaç, periyot formülleri (Tolga, Tamek), uzanım-hız-ivme denklemleri ve kuvvet diyagramları.',
            topics: [
              { id: '12-fiz-t4', name: 'Basit Harmonik Hareket Denklemleri (Uzanım, Hız, İvme Grafikleri)', kazanimKodu: 'FIZ.12.2.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 },
              { id: '12-fiz-t5', name: 'Yay Sarkacı ve Basit Sarkaç Periyot Analizleri', kazanimKodu: 'FIZ.12.2.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 }
            ]
          },
          {
            id: '12-fiz-u3',
            uniteNo: 3,
            uniteAdi: 'Dalga Mekaniği ve Işık Teorileri',
            aciklama: 'Su dalgalarında kırınım ve girişim, ışıkta çift yarıkta girişim (Young), tek yarıkta kırınım, Doppler olayı ve elektromanyetik dalgalar.',
            topics: [
              { id: '12-fiz-t6', name: 'Işıkta Çift Yarıkta Girişim ve Tek Yarıkta Kırınım', kazanimKodu: 'FIZ.12.3.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Saçak genişliği (Delta x = L.lambda / d.n) formülü yorumlama.' },
              { id: '12-fiz-t7', name: 'Doppler Olayı ve Elektromanyetik Dalga Spektrumu', kazanimKodu: 'FIZ.12.3.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 6 }
            ]
          },
          {
            id: '12-fiz-u4',
            uniteNo: 4,
            uniteAdi: 'Atom Fiziğine Giriş, Radyoaktivite ve Modern Fizik',
            aciklama: 'Bohr atom teorisi, enerji seviyeleri, uyarılma yolları, fotoelektrik olay, Compton saçılması, de Broglie dalga boyu, özel görelilik ve standart model (Kuarklar, Leptonlar).',
            topics: [
              { id: '12-fiz-t8', name: 'Fotoelektrik Olay ve Foton Enerji Denklemi (Einstein)', kazanimKodu: 'FIZ.12.4.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 170, tahminiCalismaSaati: 9, kocNotu: 'Eşik dalga boyu, bağlanma enerjisi ve kesme potansiyeli grafikleri.' },
              { id: '12-fiz-t9', name: 'Compton Saçılması ve de Broglie Dalga Boyu', kazanimKodu: 'FIZ.12.4.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 130, tahminiCalismaSaati: 6 },
              { id: '12-fiz-t10', name: 'Özel Görelilik (Zaman Genişlemesi ve Boy Kısalması) & Modern Fiziğin Teknolojideki Uygulamaları (Görüntüleme, Süperiletkenler)', kazanimKodu: 'FIZ.12.4.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 }
            ]
          }
        ]
      },
      {
        id: '12-kimya',
        dersAdi: 'Kimya (AYT)',
        sinavTuru: 'AYT',
        colorTheme: 'teal',
        units: [
          {
            id: '12-kim-u1',
            uniteNo: 1,
            uniteAdi: 'Kimya ve Elektrik (Elektrokimya)',
            aciklama: 'Redoks tepkimelerinin denkleştirilmesi, aktiflik (metalik/ametalik), galvanik piller (Pil potansiyeli hesabı, Nernst denklemi), derişim pilleri, elektroliz ve Faraday kanunları, korozyondan korunma.',
            topics: [
              { id: '12-kim-t1', name: 'Redoks Tepkimeleri ve Yükseltgenme Basamağı Bulma', kazanimKodu: 'KIM.12.1.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 140, tahminiCalismaSaati: 7 },
              { id: '12-kim-t2', name: 'Galvanik Piller, Pil Potansiyeline Etki Eden Faktörler ve Nernst Denklemi', kazanimKodu: 'KIM.12.1.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9, kocNotu: 'Anotta aşınma, katotta madde toplanması ve tuz köprüsündeki iyon göçleri.' },
              { id: '12-kim-t3', name: 'Elektroliz, Faraday Kanunları ve Kaplanma Hesaplamaları', kazanimKodu: 'KIM.12.1.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 }
            ]
          },
          {
            id: '12-kim-u2',
            uniteNo: 2,
            uniteAdi: 'Karbon Kimyasına Giriş ve Organik Bileşikler',
            aciklama: 'Anorganik-organik farkı, basit ve molekül formülü, Lewis formülleri, hibritleşme (sp3, sp2, sp) ve VSEPR teorisi, karbon allotropları (grafit, elmas, grafen, fulleren), alkanlar, alkenler, alkinler, aromatik bileşikler, alkoller, eterler, aldehitler, ketonlar, karboksilik asitler ve esterler.',
            topics: [
              { id: '12-kim-t4', name: 'Hibritleşme Türleri, Molekül Geometrisi (VSEPR) ve Karbon Allotropları', kazanimKodu: 'KIM.12.2.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 },
              { id: '12-kim-t5', name: 'Hidrokarbonlar: Alkanlar, Alkenler, Alkinler ve Aromatik Bileşikler (IUPAC Adlandırma)', kazanimKodu: 'KIM.12.2.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 2 Soru', hedefSoruOnerisi: 200, tahminiCalismaSaati: 10, kocNotu: 'Markovnikov kuralı ve Markovnikov karşıtı su katılması.' },
              { id: '12-kim-t6', name: 'Fonksiyonel Gruplar: Alkoller, Eterler, Aldehitler, Ketonlar', kazanimKodu: 'KIM.12.2.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9 },
              { id: '12-kim-t7', name: 'Karboksilik Asitler, Esterler ve Esterleşme Reaksiyonları', kazanimKodu: 'KIM.12.2.4', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 }
            ]
          }
        ]
      },
      {
        id: '12-biyo',
        dersAdi: 'Biyoloji (AYT)',
        sinavTuru: 'AYT',
        colorTheme: 'emerald',
        units: [
          {
            id: '12-bio-u1',
            uniteNo: 1,
            uniteAdi: 'Genden Proteine',
            aciklama: 'Nükleik asitlerin keşfi, DNA replikasyonu (Meselson-Stahl), genetik şifre, transkripsiyon, translasyon, protein sentezi ve biyoteknoloji.',
            topics: [
              { id: '12-bio-t1', name: 'Nükleik Asitlerin Yapısı ve DNA Replikasyonu (Helikaz, DNA Polimeraz, Ligaz)', kazanimKodu: 'BIY.12.1.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 },
              { id: '12-bio-t2', name: 'Genetik Kod ve Protein Sentezi Evreleri (Kodon-Antikodon Eşleşmesi)', kazanimKodu: 'BIY.12.1.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 170, tahminiCalismaSaati: 8, kocNotu: 'AUG başlatma ve UAA, UAG, UGA durdurma kodonları soruları.' },
              { id: '12-bio-t3', name: 'Biyoteknoloji, Gen Klonlaması ve Rekombinant DNA Teknolojisi', kazanimKodu: 'BIY.12.1.3', onem: 'Yüksek', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 5 }
            ]
          },
          {
            id: '12-bio-u2',
            uniteNo: 2,
            uniteAdi: 'Canlılarda Enerji Dönüşümleri',
            aciklama: 'Hücresel solunum (Glikoliz, Krebs çemberi, ETS, Fermantasyon) ve Fotosentez (Işığa bağımlı ve Calvin döngüsü reaksiyonları) ile Kemosentez.',
            topics: [
              { id: '12-bio-t4', name: 'Fotosentez Reaksiyonları (Işığa Bağımlı ve Bağımsız Evreler) & Kemosentez', kazanimKodu: 'BIY.12.2.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9, kocNotu: 'Işık şiddeti, CO2 derişimi ve dalga boyu fotosentez hızı grafikleri.' },
              { id: '12-bio-t5', name: 'Hücresel Solunum: Glikoliz, Krebs Döngüsü ve Oksidatif Fosforilasyon (ETS)', kazanimKodu: 'BIY.12.2.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9, kocNotu: 'ATP üretim basamakları ve NAD+/FAD koenzim indirgenme-yükseltgenmeleri.' },
              { id: '12-bio-t6', name: 'Laktik Asit ve Etil Alkol Fermantasyonu', kazanimKodu: 'BIY.12.2.3', onem: 'Yüksek', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 120, tahminiCalismaSaati: 5 }
            ]
          },
          {
            id: '12-bio-u3',
            uniteNo: 3,
            uniteAdi: 'Bitki Biyolojisi',
            aciklama: 'Bitkisel dokular (meristem, temel, iletim, örtü doku), bitki organları (kök, gövde, yaprak), bitkilerde madde taşınması (ksilem ve floem), bitkisel hormonlar ve bitkide hareket (tropizma, nasti).',
            topics: [
              { id: '12-bio-t7', name: 'Bitkisel Dokular ve Organların Anatomik Yapısı', kazanimKodu: 'BIY.12.3.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 },
              { id: '12-bio-t8', name: 'Bitkilerde Su ve Organik Madde Taşınması (Kohezyon-Gerilim & Basınç-Akış Teorisi)', kazanimKodu: 'BIY.12.3.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8, kocNotu: 'Stomaların açılıp kapanma mekanizması (K+ pompası, turgor değişimi).' },
              { id: '12-bio-t9', name: 'Bitkisel Hormonlar (Oksin, Giberellin, Sitokinin, Absisik Asit, Etilen) ve Tropizma/Nasti', kazanimKodu: 'BIY.12.3.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 1 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 }
            ]
          }
        ]
      },
      {
        id: '12-edebiyat',
        dersAdi: 'Türk Dili ve Edebiyatı (Cumhuriyet Dönemi)',
        sinavTuru: 'AYT',
        colorTheme: 'rose',
        units: [
          {
            id: '12-edeb-u1',
            uniteNo: 1,
            uniteAdi: 'Cumhuriyet Dönemi Türk Şiiri',
            aciklama: 'Öz Şiir, Yedi Meşaleciler, Serbest Nazım ve Toplumcu Şiir, Millî Edebiyat zevk ve anlayışını sürdürenler, Garip (I. Yeni), İkinci Yeni ve 1980 sonrası şiir.',
            topics: [
              { id: '12-edeb-t1', name: 'Öz Şiir ve Saf Şiirciler (Necip Fazıl, Ahmet Hamdi Tanpınar, Cahit Sıtkı)', kazanimKodu: 'EDB.12.1.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 2 Soru', hedefSoruOnerisi: 160, tahminiCalismaSaati: 8 },
              { id: '12-edeb-t2', name: 'Toplumcu Gerçekçi Şiir (Nazım Hikmet, Rıfat Ilgaz, Attila İlhan)', kazanimKodu: 'EDB.12.1.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 1-2 Soru', hedefSoruOnerisi: 150, tahminiCalismaSaati: 7 },
              { id: '12-edeb-t3', name: 'Garip Hareketi (Orhan Veli, Oktay Rifat, Melih Cevdet) ve İkinci Yeni Şiiri (Cemal Süreya, Edip Cansever, Sezai Karakoç vb.)', kazanimKodu: 'EDB.12.1.3', onem: 'Kritik', osymCikmaAirligi: 'AYT 2-3 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9 }
            ]
          },
          {
            id: '12-edeb-u2',
            uniteNo: 2,
            uniteAdi: 'Cumhuriyet Dönemi Roman ve Hikâyesi',
            aciklama: 'Bireyin iç dünyasını esas alanlar, toplumcu gerçekçiler, millî-dinî duyarlılık, modernist ve postmodernist roman.',
            topics: [
              { id: '12-edeb-t4', name: 'Toplumcu Gerçekçi Roman (Yaşar Kemal, Kemal Tahir, Orhan Kemal, Fakir Baykurt)', kazanimKodu: 'EDB.12.2.1', onem: 'Kritik', osymCikmaAirligi: 'AYT 2 Soru', hedefSoruOnerisi: 170, tahminiCalismaSaati: 8 },
              { id: '12-edeb-t5', name: 'Bireyin İç Dünyasını Esas Alan & Modernist Roman (Peyami Safa, Oğuz Atay, Yusuf Atılgan, Tanpınar)', kazanimKodu: 'EDB.12.2.2', onem: 'Kritik', osymCikmaAirligi: 'AYT 2-3 Soru', hedefSoruOnerisi: 180, tahminiCalismaSaati: 9, kocNotu: 'Tutunamayanlar, Huzur, Aylak Adam roman analizleri.' }
            ]
          }
        ]
      }
    ]
  }
];
