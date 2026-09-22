import React, { useState, useEffect } from 'react';
import { CoachingHeader } from './components/coaching/CoachingHeader';
import { StudentListView } from './components/coaching/StudentListView';
import { StudentProfileView } from './components/coaching/StudentProfileView';

// Tabs
import { GeneralInfoTab } from './components/coaching/tabs/GeneralInfoTab';
import { CoachNotesTab } from './components/coaching/tabs/CoachNotesTab';
import { QuestionsTab } from './components/coaching/tabs/QuestionsTab';
import { WeeklyScheduleTab } from './components/coaching/tabs/WeeklyScheduleTab';
import { ExamsTab } from './components/coaching/tabs/ExamsTab';
import { ReportsTab } from './components/coaching/tabs/ReportsTab';
import { ExamHistoryTab } from './components/coaching/tabs/ExamHistoryTab';
import { ResourcesView } from './components/coaching/ResourcesView';
import { AssignedResourcesTab } from './components/coaching/tabs/AssignedResourcesTab';
import { CurriculumExplorer } from './components/coaching/CurriculumExplorer';

// Modals
import { AddStudentModal } from './components/modals/AddStudentModal';
import { AICoachAskModal } from './components/modals/AICoachAskModal';
import { CoachPinModal } from './components/modals/CoachPinModal';

// Authentication & Student Portal
import { PinScreen } from './components/auth/PinScreen';
import { StudentPortalView } from './components/portal/StudentPortalView';
import { DEFAULT_COACH_PIN, ensureAllStudentsHavePins, generateRandom6DigitPin } from './utils/pinUtils';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';

import { 
  Student, 
  CoachNote, 
  SoruTakipKaydi, 
  DenemeSinavi, 
  Kazanim, 
  OgrenciSinavKaydi,
  WeeklyScheduleTask,
  BookResource,
  StudentAssignedResource,
  StudentProfileTab,
  MainViewMode,
  AuthSession
} from './types';

import {
  seedDatabaseIfEmpty,
  getStudents,
  saveStudent,
  deleteStudent,
  getCoachNotes,
  saveCoachNote,
  deleteCoachNote,
  getQuestions,
  saveQuestion,
  deleteQuestion,
  getExams,
  saveExam,
  deleteExam,
  getCurriculum,
  saveCurriculumItem,
  deleteCurriculumItem,
  bulkReplaceCurriculumInFirestore,
  bulkAppendCurriculumToFirestore,
  getExamArchives,
  saveExamArchive,
  deleteExamArchive,
  markArchiveAsRead,
  markAllArchivesAsRead,
  getCoachPin,
  updateCoachPin,
  getSchedules,
  saveScheduleTask,
  saveScheduleTasksBulk,
  deleteScheduleTask,
  clearStudentSchedule,
  getBooks,
  saveBook,
  deleteBook,
  getAssignedResources,
  saveAssignedResource,
  deleteAssignedResource,
  toggleAssignedResourceCompleted
} from './lib/apiService';

export default function App() {
  // Navigation State
  const [viewMode, setViewMode] = useState<MainViewMode>('students');
  const [activeTab, setActiveTab] = useState<StudentProfileTab>('genel');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Authentication State
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem('yks_kocluk_auth_session_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null; // Sayfa açıldığında doğrudan PIN kodu ekranı karşılar
  });
  const [coachPin, setCoachPin] = useState<string>(() => {
    try {
      return localStorage.getItem('yks_coach_pin') || DEFAULT_COACH_PIN;
    } catch {
      return DEFAULT_COACH_PIN;
    }
  });

  useEffect(() => {
    try {
      if (authSession) {
        localStorage.setItem('yks_kocluk_auth_session_v1', JSON.stringify(authSession));
      } else {
        localStorage.removeItem('yks_kocluk_auth_session_v1');
      }
    } catch {}
  }, [authSession]);

  // Modals
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAiAskOpen, setIsAiAskOpen] = useState(false);
  const [isCoachPinModalOpen, setIsCoachPinModalOpen] = useState(false);

  // Core Data States loaded from Cloud Firestore / PostgreSQL / Local Server
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const cached = localStorage.getItem('yks_cached_students');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return ensureAllStudentsHavePins(parsed);
        }
      }
    } catch {}
    return [];
  });
  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    try {
      const cached = localStorage.getItem('yks_cached_students');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      }
    } catch {}
    return '';
  });
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [notes, setNotes] = useState<CoachNote[]>([]);
  const [questions, setQuestions] = useState<SoruTakipKaydi[]>([]);
  const [exams, setExams] = useState<DenemeSinavi[]>([]);
  const [curriculum, setCurriculum] = useState<Kazanim[]>([]);
  const [examArchives, setExamArchives] = useState<OgrenciSinavKaydi[]>([]);
  const [schedules, setSchedules] = useState<WeeklyScheduleTask[]>([]);
  const [books, setBooks] = useState<BookResource[]>([]);
  const [assignedResources, setAssignedResources] = useState<StudentAssignedResource[]>([]);

  // Tracks IDs of deleted exams & archives to prevent race-condition re-adding during background polling
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // Load initial data directly from server API fast & safely without blocking
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      // 1. Instantly load students first to unblock UI immediately
      getStudents()
        .then((loadedStudents) => {
          if (!isMounted) return;
          if (loadedStudents && loadedStudents.length > 0) {
            const validatedStudents = ensureAllStudentsHavePins(loadedStudents);
            setStudents(validatedStudents);
            try {
              localStorage.setItem('yks_cached_students', JSON.stringify(validatedStudents));
            } catch {}
            if (!activeStudentId || !validatedStudents.some((s) => s.id === activeStudentId)) {
              setActiveStudentId(validatedStudents[0].id);
            }
          } else {
            setStudents([]);
            setActiveStudentId('');
            try {
              localStorage.removeItem('yks_cached_students');
            } catch {}
          }
          setIsLoadingData(false);
        })
        .catch((err) => {
          console.warn("Student load error:", err);
          if (isMounted) setIsLoadingData(false);
        });

      // 2. Load other modules concurrently in the background
      getCoachPin().then((pin) => {
        if (!isMounted || !pin) return;
        setCoachPin(pin);
        try { localStorage.setItem('yks_coach_pin', pin); } catch {}
      }).catch(() => {});

      getCoachNotes().then((n) => isMounted && setNotes(n || [])).catch(() => {});
      getQuestions().then((q) => isMounted && setQuestions(q || [])).catch(() => {});
      getExams().then((e) => isMounted && setExams(e || [])).catch(() => {});
      getCurriculum().then((c) => isMounted && setCurriculum(c || [])).catch(() => {});
      getExamArchives().then((arch) => {
        if (!isMounted) return;
        setExamArchives(arch || []);
      }).catch(() => {});
      getSchedules().then((s) => isMounted && setSchedules(s || [])).catch(() => {});
      getBooks().then((b) => isMounted && setBooks(b || [])).catch(() => {});
      getAssignedResources().then((ar) => isMounted && setAssignedResources(ar || [])).catch(() => {});
    }
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Periodic polling for active background AI jobs and real-time syncing of tasks, exams, notes, and questions
  useEffect(() => {
    const hasActiveJobs = examArchives.some(
      (a) => a.aiStatus === 'processing' || a.aiStatus === 'rate_limited' || a.aiStatus === 'pending'
    );

    // Poll every 3 seconds if jobs are running, or every 10 seconds otherwise
    const pollInterval = hasActiveJobs ? 3000 : 10000;

    const timer = setInterval(async () => {
      try {
        // 0. Sync Students
        try {
          const sRes = await fetch('/api/students');
          if (sRes.ok) {
            const serverStudents: Student[] = await sRes.json();
            if (Array.isArray(serverStudents) && serverStudents.length > 0) {
              setStudents((prev) => {
                if (prev.length === 0) {
                  const validated = ensureAllStudentsHavePins(serverStudents);
                  try {
                    localStorage.setItem('yks_cached_students', JSON.stringify(validated));
                  } catch {}
                  return validated;
                }
                const map = new Map<string, Student>();
                prev.forEach((s) => map.set(s.id, s));
                serverStudents.forEach((s) => {
                  const existing = map.get(s.id);
                  map.set(s.id, existing ? { ...s, ...existing } : s);
                });
                const merged = ensureAllStudentsHavePins(Array.from(map.values()));
                try {
                  localStorage.setItem('yks_cached_students', JSON.stringify(merged));
                } catch {}
                return merged;
              });
            }
          }
        } catch {}

        // 1. Sync Exam Archives (AI optical sheets)
        let serverArchives: OgrenciSinavKaydi[] = [];
        try {
          serverArchives = await getExamArchives();
        } catch {}

        if (serverArchives.length > 0) {

          setExamArchives((prev) => {
            const map = new Map<string, OgrenciSinavKaydi>();

            // 1. First add existing client state
            prev.forEach((existingItem) => {
              if (existingItem && existingItem.id && !deletedIds.includes(existingItem.id)) {
                map.set(existingItem.id, existingItem);
              }
            });

            // 2. Now merge incoming serverArchives (server is source of truth for status and questions)
            serverArchives.forEach((a) => {
              if (!a || !a.id) return;
              if (deletedIds.includes(a.id)) return;

              const existing = map.get(a.id);
              if (!existing) {
                map.set(a.id, a);
                return;
              }

              // Retain photo arrays if present in either source, preferring full loaded base64 strings
              const existingPhotos = existing.sayfaFotolari || existing.fotografYollari || [];
              const incomingPhotos = a.sayfaFotolari || a.fotografYollari || [];
              const existingHasFullPhotos = existingPhotos.some((p) => typeof p === 'string' && p.length > 500);
              const incomingHasFullPhotos = incomingPhotos.some((p) => typeof p === 'string' && p.length > 500);

              let finalPhotos = incomingPhotos;
              if (existingHasFullPhotos && !incomingHasFullPhotos) {
                finalPhotos = existingPhotos;
              } else if (!existingHasFullPhotos && !incomingHasFullPhotos && existingPhotos.length > incomingPhotos.length) {
                finalPhotos = existingPhotos;
              }

              const isActivelyProcessing = a.aiStatus === 'processing' || a.aiStatus === 'rate_limited' || a.aiStatus === 'pending';

              // If server is actively processing/resetted, server state ALWAYS overrides existing
              // Otherwise, take server item with merged photos and preserved read status
              const merged: OgrenciSinavKaydi = {
                ...existing,
                ...a,
                sayfaFotolari: finalPhotos,
                fotografYollari: finalPhotos,
              };

              if (existing.isNew === false || a.isNew === false || existing.durum === 'İncelendi' || a.durum === 'İncelendi') {
                merged.isNew = false;
                merged.durum = 'İncelendi';
              }

              if (isActivelyProcessing) {
                merged.aiStatus = a.aiStatus;
                merged.aiStatusMessage = a.aiStatusMessage || 'Yapay zekâ soruları çözüyor...';
              } else {
                const totalPhotosMerged = finalPhotos.length;
                const coveredPagesMerged = new Set(
                  (merged.sorular || []).map((q: any) => (q.sayfaIndex !== undefined && typeof q.sayfaIndex === 'number' && q.sayfaIndex >= 0) ? q.sayfaIndex + 1 : (q.sayfaNo || 1)).filter(Boolean)
                );
                const isAllCoveredMerged = totalPhotosMerged === 0 || (coveredPagesMerged.size >= totalPhotosMerged && totalPhotosMerged > 0);

                if (a.aiStatus === 'completed' || (isAllCoveredMerged && (merged.sorular?.length || 0) > 0 && totalPhotosMerged > 0)) {
                  merged.aiStatus = 'completed';
                  if (!merged.aiStatusMessage || merged.aiStatusMessage.includes('Devam') || merged.aiStatusMessage.includes('Kısmen')) {
                    merged.aiStatusMessage = totalPhotosMerged > 0 ? `Yapay zekâ çözdü (${totalPhotosMerged}/${totalPhotosMerged} Sayfa)` : 'Yapay zekâ çözdü';
                  }
                }
              }

              map.set(a.id, merged);
            });

            return Array.from(map.values());
          });
        }

        // 3. Sync Exams (Deneme Sınav Sonuçları)
        let fsExams: DenemeSinavi[] = [];
        try {
          fsExams = await getExams();
        } catch {}
        if (fsExams.length > 0) {
          setExams((prev) => {
            const map = new Map<string, DenemeSinavi>();
            prev.forEach((e) => {
              if (!deletedIds.includes(e.id)) {
                map.set(e.id, e);
              }
            });
            fsExams.forEach((e) => {
              if (!deletedIds.includes(e.id)) {
                map.set(e.id, e);
              }
            });
            return Array.from(map.values());
          });
        }

        // 4. Sync Coach Notes (Koç Notları)
        let fsNotes: CoachNote[] = [];
        try {
          fsNotes = await getCoachNotes();
        } catch {}
        if (fsNotes.length > 0) {
          setNotes((prev) => {
            const map = new Map<string, CoachNote>();
            prev.forEach((n) => map.set(n.id, n));
            fsNotes.forEach((n) => map.set(n.id, n));
            return Array.from(map.values());
          });
        }

        // 5. Sync Questions (Soru Takibi)
        let fsQuestions: SoruTakipKaydi[] = [];
        try {
          fsQuestions = await getQuestions();
        } catch {}
        if (fsQuestions.length > 0) {
          setQuestions((prev) => {
            const map = new Map<string, SoruTakipKaydi>();
            prev.forEach((q) => map.set(q.id, q));
            fsQuestions.forEach((q) => map.set(q.id, q));
            return Array.from(map.values());
          });
        }

        // 6. Sync Curriculum (Müfredat Kazanımları)
        try {
          const cRes = await fetch('/api/curriculum');
          if (cRes.ok) {
            const serverCurriculum: Kazanim[] = await cRes.json();
            if (serverCurriculum && serverCurriculum.length > 0) {
              setCurriculum((prev) => {
                const map = new Map<string, Kazanim>();
                prev.forEach((k) => map.set(k.id, k));
                serverCurriculum.forEach((k) => map.set(k.id, k));
                return Array.from(map.values());
              });
            }
          }
        } catch {}
      } catch (e) {
        // Silently ignore polling errors in background
      }
    }, pollInterval);

    return () => clearInterval(timer);
  }, [examArchives]);

  const activeStudent = students.find((s) => s.id === activeStudentId) || students[0] || null;

  // Student Actions
  const handleSelectStudent = async (id: string) => {
    setActiveStudentId(id);
    setViewMode('student-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Mark all new archives for this student as read (isNew: false, durum: 'İncelendi') immediately
    const archivesToUpdate = examArchives.filter(
      (a) => (a.studentId === id || !a.studentId) && (a.isNew || a.durum === 'Yeni')
    );

    if (archivesToUpdate.length > 0) {
      setExamArchives((prev) =>
        prev.map((a) => {
          if ((a.studentId === id || !a.studentId) && (a.isNew || a.durum === 'Yeni')) {
            return { ...a, isNew: false, durum: 'İncelendi' as const };
          }
          return a;
        })
      );

      // Persist to server backend immediately
      markAllArchivesAsRead(id).catch((e) => console.warn('markAllArchivesAsRead error:', e));

      await Promise.all(
        archivesToUpdate.map(async (a) => {
          const updated = { ...a, isNew: false, durum: 'İncelendi' as const };
          try {
            await saveExamArchive(updated);
          } catch (e) {
            console.warn('Error marking student archive as read:', e);
          }
        })
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const archivesToUpdate = examArchives.filter((a) => a.isNew || a.durum === 'Yeni');
    if (archivesToUpdate.length === 0) return;

    setExamArchives((prev) =>
      prev.map((a) => {
        if (a.isNew || a.durum === 'Yeni') {
          return { ...a, isNew: false, durum: 'İncelendi' as const };
        }
        return a;
      })
    );

    // Persist to server backend immediately
    markAllArchivesAsRead().catch((e) => console.warn('markAllArchivesAsRead error:', e));

    await Promise.all(
      archivesToUpdate.map(async (a) => {
        const updated = { ...a, isNew: false, durum: 'İncelendi' as const };
        try {
          await saveExamArchive(updated);
        } catch (e) {
          console.warn('Error marking all archives as read:', e);
        }
      })
    );
  };

  const handleAddStudent = async (newStd: Omit<Student, 'id'>) => {
    const existingPins = students.map((s) => s.pinCode);
    const pin = newStd.pinCode || generateRandom6DigitPin(existingPins);
    const studentWithId: Student = {
      ...newStd,
      pinCode: pin,
      id: `std-${Date.now()}`,
    };
    setStudents((prev) => [studentWithId, ...prev]);
    setActiveStudentId(studentWithId.id);
    setViewMode('student-detail');
    setActiveTab('genel');
    try {
      await saveStudent(studentWithId);
    } catch (e) {
      console.warn('Firestore saveStudent note:', e);
    }
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentWithId),
      });
    } catch (e) {
      console.warn('Backend /api/students error:', e);
    }
  };

  const handleUpdateStudent = async (updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    try {
      await saveStudent(updated);
    } catch (e) {
      console.warn('Firestore saveStudent note:', e);
    }
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.warn('Backend /api/students error:', e);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Öğrenciyi silmek istediğinize emin misiniz?')) {
      setStudents((prev) => prev.filter((s) => s.id !== id));
      if (activeStudentId === id) {
        const remaining = students.filter((s) => s.id !== id);
        if (remaining[0]) setActiveStudentId(remaining[0].id);
        else setViewMode('students');
      }
      try {
        await deleteStudent(id);
      } catch (e) {
        console.warn('Firestore deleteStudent note:', e);
      }
      try {
        await fetch(`/api/students/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Backend /api/students delete error:', e);
      }
    }
  };

  // Sub-record actions for Active Student
  const studentNotes = notes.filter((n) => !n.studentId || n.studentId === activeStudent?.id);
  const handleAddNote = async (note: Omit<CoachNote, 'id'>) => {
    const newNote: CoachNote = {
      ...note,
      id: `note-${Date.now()}`,
      studentId: activeStudent?.id || '',
    };
    setNotes((prev) => [newNote, ...prev]);
    try {
      await saveCoachNote(newNote);
    } catch (e) {
      console.warn('Firestore saveCoachNote note:', e);
    }
    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });
    } catch (e) {
      console.warn('Backend /api/notes error:', e);
    }
  };
  const handleDeleteNote = async (id: string) => {
    if (confirm('Bu koç notunu silmek istediğinize emin misiniz?')) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      try {
        await deleteCoachNote(id);
      } catch (e) {
        console.warn('Firestore deleteCoachNote note:', e);
      }
      try {
        await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Backend /api/notes delete error:', e);
      }
    }
  };

  // Books Actions
  const handleAddBook = async (bookData: Omit<BookResource, 'id'>) => {
    const newBook: BookResource = {
      ...bookData,
      id: `book-${Date.now()}`
    };
    setBooks((prev) => [newBook, ...prev]);
    try {
      await saveBook(newBook);
    } catch (e) {
      console.warn('saveBook error:', e);
    }
  };

  const handleDeleteBook = async (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    try {
      await deleteBook(id);
    } catch (e) {
      console.warn('deleteBook error:', e);
    }
  };

  // Assigned Resources Actions
  const handleAssignResource = async (resourceData: Omit<StudentAssignedResource, 'id'>) => {
    const newItem: StudentAssignedResource = {
      ...resourceData,
      id: `ares-${Date.now()}`
    };
    setAssignedResources((prev) => [newItem, ...prev]);
    try {
      await saveAssignedResource(newItem);
    } catch (e) {
      console.warn('saveAssignedResource error:', e);
    }
  };

  const handleDeleteAssignedResource = async (id: string) => {
    setAssignedResources((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteAssignedResource(id);
    } catch (e) {
      console.warn('deleteAssignedResource error:', e);
    }
  };

  const handleToggleAssignedResourceCompleted = async (id: string, completed: boolean) => {
    setAssignedResources((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              completed,
              completedDate: completed ? new Date().toISOString().split('T')[0] : undefined
            }
          : r
      )
    );
    try {
      await toggleAssignedResourceCompleted(id, completed);
    } catch (e) {
      console.warn('toggleAssignedResourceCompleted error:', e);
    }
  };

  const currentActiveStudentId = activeStudent?.id || students[0]?.id || 'std-1';
  const studentQuestions = questions.filter((q) => !q.studentId || q.studentId === activeStudent?.id);
  const handleAddQuestion = async (q: Omit<SoruTakipKaydi, 'id'>) => {
    const newQ: SoruTakipKaydi = {
      ...q,
      id: `q-${Date.now()}`,
      studentId: activeStudent?.id || '',
    };
    setQuestions((prev) => [newQ, ...prev]);
    try {
      await saveQuestion(newQ);
    } catch (e) {
      console.warn('Firestore saveQuestion note:', e);
    }
    try {
      await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQ),
      });
    } catch (e) {
      console.warn('Backend /api/questions error:', e);
    }
  };
  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Bu soru takip kaydını silmek istediğinize emin misiniz?')) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      try {
        await deleteQuestion(id);
      } catch (e) {
        console.warn('Firestore deleteQuestion note:', e);
      }
      try {
        await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Backend /api/questions delete error:', e);
      }
    }
  };

  const studentExams = exams
    .filter((e) => !e.studentId || e.studentId === activeStudent?.id)
    .filter((e) => !deletedIds.includes(e.id));
  const handleAddExam = async (exam: Omit<DenemeSinavi, 'id'>) => {
    const newExam: DenemeSinavi = {
      ...exam,
      id: `exam-${Date.now()}`,
      studentId: activeStudent?.id || '',
    };
    setExams((prev) => [newExam, ...prev]);
    try {
      await saveExam(newExam);
    } catch (e) {
      console.warn('Firestore saveExam note:', e);
    }
    try {
      await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExam),
      });
    } catch (e) {
      console.warn('Backend /api/exams error:', e);
    }
  };
  const handleDeleteExam = async (id: string) => {
    setDeletedIds((prev) => [...prev, id]);
    setExams((prev) => prev.filter((e) => e.id !== id));
    setExamArchives((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteExam(id);
    } catch (e) {
      console.warn('Firestore deleteExam note:', e);
    }
    try {
      await fetch(`/api/exams/${id}`, { method: 'DELETE' });
      await fetch(`/api/archives/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend /api/exams delete error:', e);
    }
  };

  // Schedule Task Handlers
  const handleAddScheduleTask = async (task: Omit<WeeklyScheduleTask, 'id'>) => {
    const newTask: WeeklyScheduleTask = {
      ...task,
      id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: activeStudent?.id || '',
    };
    setSchedules((prev) => [newTask, ...prev]);
    try {
      await saveScheduleTask(newTask);
    } catch (e) {
      console.warn('Save schedule task error:', e);
    }
  };

  const handleUpdateScheduleTask = async (task: WeeklyScheduleTask) => {
    setSchedules((prev) => {
      const existing = prev.find((t) => t.id === task.id);
      const safeStudentId = task.studentId || existing?.studentId || activeStudent?.id || '';
      const safeTask: WeeklyScheduleTask = {
        ...task,
        studentId: safeStudentId,
      };
      saveScheduleTask(safeTask).catch((e) => console.warn('Update schedule task error:', e));
      return prev.map((t) => (t.id === task.id ? safeTask : t));
    });
  };

  const handleDeleteScheduleTask = async (id: string) => {
    setSchedules((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteScheduleTask(id);
    } catch (e) {
      console.warn('Delete schedule task error:', e);
    }
  };

  const handleBulkAddScheduleTasks = async (newTasks: Omit<WeeklyScheduleTask, 'id'>[]) => {
    const prepared = newTasks.map((t, idx) => ({
      ...t,
      id: `sch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
      studentId: activeStudent?.id || '',
    }));
    setSchedules((prev) => [...prepared, ...prev]);
    try {
      await saveScheduleTasksBulk(prepared);
    } catch (e) {
      console.warn('Bulk save schedule tasks error:', e);
    }
  };

  const handleClearStudentSchedule = async () => {
    if (!activeStudent?.id) return;
    setSchedules((prev) => prev.filter((t) => t.studentId !== activeStudent.id));
    try {
      await clearStudentSchedule(activeStudent.id);
    } catch (e) {
      console.warn('Clear student schedule error:', e);
    }
  };

  // Curriculum actions
  const handleAddKazanim = async (k: Omit<Kazanim, 'id'>) => {
    const newK: Kazanim = {
      ...k,
      id: `kaz-${Date.now()}`,
    };
    setCurriculum((prev) => [newK, ...prev]);
    try {
      await saveCurriculumItem(newK);
    } catch (e) {
      console.warn('Firestore saveCurriculumItem note:', e);
    }
    try {
      await fetch('/api/curriculum/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newK),
      });
    } catch (e) {
      console.warn('Backend /api/curriculum error:', e);
    }
  };

  const handleUpdateKazanim = async (updatedItem: Kazanim) => {
    setCurriculum((prev) =>
      prev.map((k) => (k.id === updatedItem.id ? updatedItem : k))
    );
    try {
      await saveCurriculumItem(updatedItem);
    } catch (e) {
      console.warn('Firestore saveCurriculumItem note:', e);
    }
    try {
      await fetch('/api/curriculum/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
    } catch (e) {
      console.warn('Backend /api/curriculum error:', e);
    }
  };
  const handleBulkAddKazanimlar = async (newItems: Kazanim[], replaceAll: boolean = true) => {
    if (!newItems || newItems.length === 0) return;

    // 1. Immediately update React UI so 1000+ items appear instantaneously
    if (replaceAll) {
      setCurriculum(newItems);
    } else {
      setCurriculum((prev) => {
        const incomingIds = new Set(newItems.map((n) => n.id));
        const filteredPrev = prev.filter((p) => !incomingIds.has(p.id));
        return [...newItems, ...filteredPrev];
      });
    }

    // 2. Fast single-request backend bulk update (replaces in memory and Postgres in milliseconds)
    try {
      await fetch('/api/curriculum/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems, replaceAll }),
      });
    } catch (e) {
      console.warn('Backend /api/curriculum/bulk error:', e);
    }

    // 3. Sync to Firestore in background using batched writes
    try {
      if (replaceAll) {
        await bulkReplaceCurriculumInFirestore(newItems);
      } else {
        await bulkAppendCurriculumToFirestore(newItems);
      }
    } catch (e) {
      console.warn('Firestore bulkReplaceCurriculum note:', e);
    }
  };

  const handleClearAllCurriculum = async () => {
    setCurriculum([]);
    try {
      await fetch('/api/curriculum/all', { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend /api/curriculum/all error:', e);
    }
    try {
      await bulkReplaceCurriculumInFirestore([]);
    } catch (e) {
      console.warn('Firestore clear all note:', e);
    }
  };
  const handleDeleteKazanim = async (id: string) => {
    if (confirm('Bu kazanımı silmek istediğinize emin misiniz?')) {
      setCurriculum((prev) => prev.filter((k) => k.id !== id));
      try {
        await deleteCurriculumItem(id);
      } catch (e) {
        console.warn('Firestore deleteCurriculumItem note:', e);
      }
      try {
        await fetch(`/api/curriculum/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Backend /api/curriculum delete error:', e);
      }
    }
  };

  // Photo Exam Archive actions
  const studentArchives = examArchives
    .filter((a) => !a.studentId || a.studentId === activeStudent?.id || (a.ogrenciAdSoyad && activeStudent?.adSoyad && a.ogrenciAdSoyad.toLowerCase().trim() === activeStudent.adSoyad.toLowerCase().trim()))
    .filter((a) => !deletedIds.includes(a.id));
  const handleSaveExamArchive = async (
    archive: OgrenciSinavKaydi,
    newDeneme?: Omit<DenemeSinavi, 'id'> | DenemeSinavi
  ) => {
    setExamArchives((prev) => {
      const existing = prev.find((a) => a.id === archive.id);
      if (existing) {
        const existingPhotos = existing.sayfaFotolari || existing.fotografYollari || [];
        const incomingPhotos = archive.sayfaFotolari || archive.fotografYollari || [];
        const existingHasFull = existingPhotos.some((p) => typeof p === 'string' && p.length > 500);
        const incomingHasFull = incomingPhotos.some((p) => typeof p === 'string' && p.length > 500);

        let finalPhotos = incomingPhotos;
        if (existingHasFull && !incomingHasFull) {
          finalPhotos = existingPhotos;
        } else if (!existingHasFull && !incomingHasFull && existingPhotos.length > incomingPhotos.length) {
          finalPhotos = existingPhotos;
        }

        const merged: OgrenciSinavKaydi = {
          ...existing,
          ...archive,
          sayfaFotolari: finalPhotos,
          fotografYollari: finalPhotos,
        };
        return prev.map((a) => (a.id === archive.id ? merged : a));
      }
      return [archive, ...prev];
    });

    // Check if it should also be saved under Denemeler (if newDeneme provided OR archive.isDeneme === true)
    if (newDeneme || archive.isDeneme) {
      const examId = (newDeneme as DenemeSinavi)?.id || `exam-${archive.id}`;

      let dersler = newDeneme?.dersler || [];
      if (dersler.length === 0 && archive.sorular && Array.isArray(archive.sorular) && archive.sorular.length > 0) {
        const lessonMap = new Map<string, { dogru: number; yanlis: number; bos: number }>();
        archive.sorular.forEach((s) => {
          const dersName = s.ders || 'Genel';
          const current = lessonMap.get(dersName) || { dogru: 0, yanlis: 0, bos: 0 };
          if (s.dogruMu === true) {
            current.dogru += 1;
          } else if (s.isaretlenenSik === 'Boş' || !s.isaretlenenSik) {
            current.bos += 1;
          } else {
            current.yanlis += 1;
          }
          lessonMap.set(dersName, current);
        });

        dersler = Array.from(lessonMap.entries()).map(([dersAdi, counts]) => ({
          dersAdi,
          dogru: counts.dogru,
          yanlis: counts.yanlis,
          bos: counts.bos,
          net: Number(Math.max(0, counts.dogru - counts.yanlis * 0.25).toFixed(2)),
        }));
      }

      if (dersler.length === 0) {
        dersler = [
          {
            dersAdi: archive.sinavTuru === 'TYT' ? 'TYT Genel' : 'AYT Genel',
            dogru: archive.dogruSayisi || 0,
            yanlis: archive.yanlisSayisi || 0,
            bos: archive.bosSayisi || 0,
            net: Number((archive.toplamNet || archive.net || 0).toFixed(2)),
          },
        ];
      }

      const examRecord: DenemeSinavi = {
        id: examId,
        studentId: archive.studentId,
        denemeAdi: newDeneme?.denemeAdi || archive.sinavAdi,
        yayin: newDeneme?.yayin || 'Optik / AI Yüklemesi',
        sinavTuru: newDeneme?.sinavTuru || archive.sinavTuru || 'TYT',
        tarih: newDeneme?.tarih || archive.tarih,
        toplamNet: newDeneme?.toplamNet ?? archive.toplamNet ?? 0,
        puan: newDeneme?.puan ?? Math.round(100 + (archive.toplamNet || archive.net || 0) * 3.8),
        dersler,
        kocYorumu: newDeneme?.kocYorumu || archive.ogrenciNotu || 'Optik AI Yüklemesinden Eklenen Deneme Kaydı',
      };

      setExams((prev) => {
        const exists = prev.some((e) => e.id === examRecord.id);
        if (exists) {
          return prev.map((e) => (e.id === examRecord.id ? examRecord : e));
        }
        return [examRecord, ...prev];
      });

      try {
        await saveExam(examRecord);
      } catch (e) {
        console.warn("Firestore saveExam error:", e);
      }

      try {
        await fetch('/api/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(examRecord),
        });
      } catch (e) {
        console.warn("Backend /api/exams error:", e);
      }
    }

    const existingRec = examArchives.find((a) => a.id === archive.id);
    const existingPhotos = existingRec ? (existingRec.sayfaFotolari || existingRec.fotografYollari || []) : [];
    const incomingPhotos = archive.sayfaFotolari || archive.fotografYollari || [];
    const finalPhotos = incomingPhotos.length > 0 ? incomingPhotos : existingPhotos;
    const archiveToSave: OgrenciSinavKaydi = {
      ...existingRec,
      ...archive,
      sayfaFotolari: finalPhotos,
      fotografYollari: finalPhotos,
    };

    setExamArchives((prev) => {
      const exists = prev.some((a) => a.id === archiveToSave.id);
      if (exists) {
        return prev.map((a) => (a.id === archiveToSave.id ? archiveToSave : a));
      }
      return [archiveToSave, ...prev];
    });

    // 1. Save to Firestore
    try {
      await saveExamArchive(archiveToSave);
    } catch (e) {
      console.warn("Firestore saveExamArchive warning:", e);
    }

    // 2. Also save to Express /api/archives to keep backend memory/postgres synced
    try {
      await fetch('/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(archiveToSave),
      });
    } catch (e) {
      console.warn("Backend /api/archives sync warning:", e);
    }
  };
  const handleDeleteArchive = async (id: string) => {
    setDeletedIds((prev) => [...prev, id]);
    setExamArchives((prev) => prev.filter((a) => a.id !== id));
    setExams((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteExamArchive(id);
    } catch (e) {
      console.warn('Firestore deleteExamArchive note:', e);
    }
    try {
      await fetch(`/api/archives/${id}`, { method: 'DELETE' });
      await fetch(`/api/exams/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Backend /api/archives delete error:', e);
    }
  };

  const handleResetAllData = async () => {
    if (!confirm("⚠️ DİKKAT! Tüm öğrenciler, çözülen soru takipleri, haftalık ödevler, koç notları ve sınav analizleri veritabanından kalıcı olarak silinecektir. Bu işlem geri alınamaz!\n\nDevam etmek istiyor musunuz?")) {
      return;
    }
    
    try {
      const res = await fetch("/api/admin/clear-all", { method: "POST" });
      if (res.ok) {
        alert("🎉 Tüm veriler başarıyla sıfırlandı! Portal ilk günkü temiz haline döndürüldü.");
        setStudents([]);
        setActiveStudentId('');
        setNotes([]);
        setQuestions([]);
        setExams([]);
        setExamArchives([]);
        setAuthSession(null); // Log out to pin screen
      } else {
        alert("Sıfırlama sırasında bir hata oluştu.");
      }
    } catch (e: any) {
      alert("Bağlantı hatası: " + e.message);
    }
  };

  // 1. PIN Kodu Giriş Ekranı (Sayfa açıldığında karşılayan ekran)
  if (!authSession) {
    return (
      <>
        <PinScreen
          coachPin={coachPin}
          students={students}
          onLoginCoach={() => setAuthSession({ role: 'coach' })}
          onLoginStudent={(student) =>
            setAuthSession({ role: 'student', studentId: student.id })
          }
        />
        <OfflineIndicator />
      </>
    );
  }

  // 2. Öğrenci PIN'i girilmişse: Öğrencinin test yükleme ve takip paneli
  if (authSession.role === 'student') {
    const currentStudent =
      students.find((s) => s.id === authSession.studentId) || students[0];
    
    if (!currentStudent) {
      setTimeout(() => setAuthSession(null), 0);
      return null;
    }

    const currentStudentArchives = examArchives.filter(
      (a) => !a.studentId || a.studentId === currentStudent?.id || (a.ogrenciAdSoyad && currentStudent?.adSoyad && a.ogrenciAdSoyad.toLowerCase().trim() === currentStudent.adSoyad.toLowerCase().trim())
    );
    const currentStudentNotes = notes.filter(
      (n) => !n.studentId || n.studentId === currentStudent?.id
    );
    const currentStudentSchedules = schedules.filter(
      (s) => s.studentId === currentStudent?.id
    );

    return (
      <>
        <StudentPortalView
          student={currentStudent}
          studentArchives={currentStudentArchives}
          coachNotes={currentStudentNotes}
          schedules={currentStudentSchedules}
          curriculum={curriculum}
          questions={questions}
          exams={exams}
          assignedResources={assignedResources}
          onLogout={() => setAuthSession(null)}
          onSaveExamArchive={handleSaveExamArchive}
          onUpdateScheduleTask={handleUpdateScheduleTask}
          onAddQuestion={handleAddQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onToggleAssignedResource={handleToggleAssignedResourceCompleted}
        />
        <OfflineIndicator />
      </>
    );
  }

  // Calculate new uploaded exams count for coach notifications
  const newUploadedExamsCount = examArchives.filter((a) => a.isNew).length;

  // 3. Koç PIN'i girilmişse: Tam yetkili koçluk ve yönetim sistemi
  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Main Navigation Header */}
      <CoachingHeader
        students={students}
        selectedStudent={activeStudent}
        onSelectStudent={handleSelectStudent}
        viewMode={viewMode}
        onChangeViewMode={(mode) => setViewMode(mode)}
        onOpenAddStudent={() => setIsAddStudentOpen(true)}
        onOpenAiAsk={() => setIsAiAskOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        coachPin={coachPin}
        newExamCount={newUploadedExamsCount}
        onLogout={() => setAuthSession(null)}
        onMarkAllAsRead={handleMarkAllAsRead}
        onOpenCoachPinModal={() => setIsCoachPinModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {viewMode === 'resources' ? (
          <ResourcesView
            books={books}
            onAddBook={handleAddBook}
            onDeleteBook={handleDeleteBook}
          />
        ) : viewMode === 'curriculum' ? (
          <CurriculumExplorer />
        ) : viewMode === 'students' || !activeStudent ? (
          <StudentListView
            students={students}
            selectedStudent={activeStudent}
            archives={examArchives}
            onSelectStudent={handleSelectStudent}
            onOpenAddStudent={() => setIsAddStudentOpen(true)}
            onDeleteStudent={handleDeleteStudent}
          />
        ) : (
          <StudentProfileView
            student={activeStudent}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            onBackToList={() => setViewMode('students')}
            newUploadsCount={studentArchives.filter((a) => a.isNew).length}
          >
            {activeTab === 'genel' && (
              <GeneralInfoTab
                student={activeStudent}
                onUpdateStudent={handleUpdateStudent}
              />
            )}

            {activeTab === 'koc-notlari' && (
              <CoachNotesTab
                notes={studentNotes}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                studentName={activeStudent.adSoyad}
              />
            )}

            {activeTab === 'soru-takibi' && (
              <QuestionsTab
                questions={studentQuestions}
                examArchives={studentArchives}
                exams={studentExams}
                onAddQuestion={handleAddQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                studentName={activeStudent.adSoyad}
              />
            )}

            {activeTab === 'haftalik-program' && (
              <WeeklyScheduleTab
                tasks={schedules.filter((s) => s.studentId === activeStudent.id)}
                books={books}
                studentId={activeStudent.id}
                onAddTask={handleAddScheduleTask}
                onUpdateTask={handleUpdateScheduleTask}
                onDeleteTask={handleDeleteScheduleTask}
                onBulkAddTasks={handleBulkAddScheduleTasks}
                onClearAllTasks={handleClearStudentSchedule}
                studentName={activeStudent.adSoyad}
              />
            )}

            {activeTab === 'denemeler' && (
              <ExamsTab
                exams={studentExams}
                onAddExam={handleAddExam}
                onDeleteExam={handleDeleteExam}
                studentId={activeStudent.id}
                studentName={activeStudent.adSoyad}
              />
            )}

            {activeTab === 'raporlar' && (
              <ReportsTab
                student={activeStudent}
                exams={studentExams}
                questions={studentQuestions}
                curriculum={curriculum}
                examArchives={studentArchives}
                onSaveExamArchive={handleSaveExamArchive}
              />
            )}

            {activeTab === 'sinav-gecmisi' && (
              <ExamHistoryTab
                archives={studentArchives}
                onDeleteArchive={handleDeleteArchive}
                onSaveExamArchive={handleSaveExamArchive}
                studentName={activeStudent.adSoyad}
              />
            )}

            {activeTab === 'atanan-kaynaklar' && (
              <AssignedResourcesTab
                student={activeStudent}
                books={books}
                assignedResources={assignedResources}
                onAssignResource={handleAssignResource}
                onDeleteResource={handleDeleteAssignedResource}
                onToggleComplete={handleToggleAssignedResourceCompleted}
              />
            )}
          </StudentProfileView>
        )}
      </main>

      {/* Add Student Modal */}
      {isAddStudentOpen && (
        <AddStudentModal
          isOpen={isAddStudentOpen}
          onClose={() => setIsAddStudentOpen(false)}
          onSave={handleAddStudent}
          onAdd={handleAddStudent}
        />
      )}

      {/* AI Coach Assistant Drawer / Modal */}
      {isAiAskOpen && (
        <AICoachAskModal
          isOpen={isAiAskOpen}
          onClose={() => setIsAiAskOpen(false)}
          activeStudent={activeStudent}
        />
      )}

      {/* Coach PIN Settings Modal */}
      {isCoachPinModalOpen && (
        <CoachPinModal
          isOpen={isCoachPinModalOpen}
          onClose={() => setIsCoachPinModalOpen(false)}
          currentPin={coachPin}
          students={students}
          onPinUpdated={(newPin) => {
            setCoachPin(newPin);
            try {
              localStorage.setItem('yks_coach_pin', newPin);
            } catch {}
          }}
        />
      )}

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">Eğitim Koçluğu Portalı</span>
            <span>— YKS & MEB Müfredat Yönetim Sistemi</span>
          </div>
          <div className="text-slate-400">
            Optik Fotoğraf Analizi • Soru & Kazanım Takibi • Yapay Zekâ Koçluk Reçeteleri
          </div>
        </div>
      </footer>
      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
