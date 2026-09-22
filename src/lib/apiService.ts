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
  AiSystemStatus,
  ModelHealthStatus
} from '../types';

// Helper for sending POST/GET/DELETE requests to our own Express Backend APIs
async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options?.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`API Error on ${url}: ${response.status} - ${errorText}`);
    }
    return response.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// 1. STUDENTS
export async function getStudents(): Promise<Student[]> {
  return fetchApi<Student[]>('/api/students');
}

export async function saveStudent(student: Student): Promise<void> {
  await fetchApi<void>('/api/students', {
    method: 'POST',
    body: JSON.stringify(student),
  });
}

export async function deleteStudent(id: string): Promise<void> {
  await fetchApi<void>(`/api/students/${id}`, {
    method: 'DELETE',
  });
}

// 2. COACH NOTES
export async function getCoachNotes(): Promise<CoachNote[]> {
  return fetchApi<CoachNote[]>('/api/notes');
}

export async function saveCoachNote(note: CoachNote): Promise<void> {
  await fetchApi<void>('/api/notes', {
    method: 'POST',
    body: JSON.stringify(note),
  });
}

export async function deleteCoachNote(id: string): Promise<void> {
  await fetchApi<void>(`/api/notes/${id}`, {
    method: 'DELETE',
  });
}

// 4. QUESTIONS
export async function getQuestions(): Promise<SoruTakipKaydi[]> {
  return fetchApi<SoruTakipKaydi[]>('/api/questions');
}

export async function saveQuestion(q: SoruTakipKaydi): Promise<void> {
  await fetchApi<void>('/api/questions', {
    method: 'POST',
    body: JSON.stringify(q),
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  await fetchApi<void>(`/api/questions/${id}`, {
    method: 'DELETE',
  });
}

// 5. EXAMS
export async function getExams(): Promise<DenemeSinavi[]> {
  return fetchApi<DenemeSinavi[]>('/api/exams');
}

export async function saveExam(exam: DenemeSinavi): Promise<void> {
  await fetchApi<void>('/api/exams', {
    method: 'POST',
    body: JSON.stringify(exam),
  });
}

export async function deleteExam(id: string): Promise<void> {
  await fetchApi<void>(`/api/exams/${id}`, {
    method: 'DELETE',
  });
}

// 6. CURRICULUM
export async function getCurriculum(): Promise<Kazanim[]> {
  return fetchApi<Kazanim[]>('/api/curriculum');
}

export async function saveCurriculumItem(item: Kazanim): Promise<void> {
  await fetchApi<void>('/api/curriculum/item', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function deleteCurriculumItem(id: string): Promise<void> {
  await fetchApi<void>(`/api/curriculum/${id}`, {
    method: 'DELETE',
  });
}

export async function bulkReplaceCurriculumInFirestore(items: Kazanim[]): Promise<void> {
  await fetchApi<void>('/api/curriculum/bulk', {
    method: 'POST',
    body: JSON.stringify({ items, replaceAll: true }),
  });
}

export async function bulkAppendCurriculumToFirestore(items: Kazanim[]): Promise<void> {
  await fetchApi<void>('/api/curriculum/bulk', {
    method: 'POST',
    body: JSON.stringify({ items, replaceAll: false }),
  });
}

// 7. EXAM ARCHIVES
export async function getExamArchives(): Promise<OgrenciSinavKaydi[]> {
  return fetchApi<OgrenciSinavKaydi[]>('/api/archives');
}

export async function getExamArchiveById(id: string): Promise<OgrenciSinavKaydi> {
  return fetchApi<OgrenciSinavKaydi>(`/api/archives/${id}`);
}

export async function saveExamArchive(archive: OgrenciSinavKaydi): Promise<void> {
  await fetchApi<void>('/api/archives', {
    method: 'POST',
    body: JSON.stringify(archive),
  });
}

export async function markArchiveAsRead(id: string): Promise<void> {
  await fetchApi<void>(`/api/archives/${id}/mark-read`, {
    method: 'POST',
  });
}

export async function markAllArchivesAsRead(studentId?: string): Promise<void> {
  await fetchApi<void>('/api/archives/mark-all-read', {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  });
}

export async function deleteExamArchive(id: string): Promise<void> {
  await fetchApi<void>(`/api/archives/${id}`, {
    method: 'DELETE',
  });
}

// 7.1 COACH PIN SETTINGS
export async function getCoachPin(): Promise<string> {
  try {
    const res = await fetchApi<{ coachPin: string }>('/api/settings/coach-pin');
    return res.coachPin || '998877';
  } catch {
    return '998877';
  }
}

export async function updateCoachPin(newPin: string): Promise<{ success: boolean; coachPin?: string; error?: string }> {
  return fetchApi<{ success: boolean; coachPin?: string; error?: string }>('/api/settings/coach-pin', {
    method: 'POST',
    body: JSON.stringify({ newPin }),
  });
}

// 8. STUDENT MULTI-IMAGE AI TEST ANALYSIS & UPLOAD
export async function analyzeAndSaveStudentTest(payload: {
  archiveId?: string;
  studentId: string;
  studentName: string;
  testName: string;
  sinavTuru: 'TYT' | 'AYT';
  studentNote?: string;
  images: Array<{ imageBase64: string; mimeType?: string } | string>;
  existingCurriculum?: Kazanim[];
}): Promise<{ success: boolean; archive: OgrenciSinavKaydi; message: string }> {
  return fetchApi<{ success: boolean; archive: OgrenciSinavKaydi; message: string }>('/api/ai/analyze-student-test', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function retryExamAIAnalysis(archiveId: string, archive?: OgrenciSinavKaydi): Promise<{ success: boolean; message: string; archive?: OgrenciSinavKaydi }> {
  return fetchApi<{ success: boolean; message: string; archive?: OgrenciSinavKaydi }>(`/api/archives/${archiveId}/retry-ai`, {
    method: 'POST',
    body: archive ? JSON.stringify({ archive }) : undefined,
  });
}

export async function resetAndResolveExamAI(archiveId: string, archive?: OgrenciSinavKaydi): Promise<{ success: boolean; message: string; archive?: OgrenciSinavKaydi }> {
  return fetchApi<{ success: boolean; message: string; archive?: OgrenciSinavKaydi }>(`/api/archives/${archiveId}/reset-and-solve`, {
    method: 'POST',
    body: archive ? JSON.stringify({ archive }) : undefined,
  });
}

// AI MONITORING & DIAGNOSTICS
export async function getAiSystemStatus(): Promise<AiSystemStatus> {
  return fetchApi<AiSystemStatus>('/api/system/status');
}

export async function testGeminiModels(): Promise<{ success: boolean; summary: string; models: ModelHealthStatus[] }> {
  return fetchApi<{ success: boolean; summary: string; models: ModelHealthStatus[] }>('/api/system/test-gemini', {
    method: 'POST',
  });
}

export async function retryArchiveAI(archiveId: string): Promise<{ success: boolean; message: string }> {
  return fetchApi<{ success: boolean; message: string }>(`/api/system/retry-archive/${archiveId}`, {
    method: 'POST',
  });
}

export async function clearSystemLogs(): Promise<{ success: boolean }> {
  return fetchApi<{ success: boolean }>('/api/system/clear-logs', {
    method: 'POST',
  });
}

export async function stopAllAiJobs(): Promise<{ success: boolean; message: string; cancelledCount: number }> {
  return fetchApi<{ success: boolean; message: string; cancelledCount: number }>('/api/system/stop-all-jobs', {
    method: 'POST',
  });
}

// 9. HAFTALIK PROGRAM (SCHEDULE TASKS)
export async function getSchedules(): Promise<WeeklyScheduleTask[]> {
  return fetchApi<WeeklyScheduleTask[]>('/api/schedules');
}

export async function saveScheduleTask(task: WeeklyScheduleTask): Promise<void> {
  await fetchApi<void>('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

export async function saveScheduleTasksBulk(tasks: Omit<WeeklyScheduleTask, 'id'>[]): Promise<void> {
  await fetchApi<void>('/api/schedules/bulk', {
    method: 'POST',
    body: JSON.stringify(tasks),
  });
}

export async function deleteScheduleTask(id: string): Promise<void> {
  await fetchApi<void>(`/api/schedules/${id}`, {
    method: 'DELETE',
  });
}

export async function clearStudentSchedule(studentId: string): Promise<void> {
  await fetchApi<void>(`/api/schedules/student/${studentId}`, {
    method: 'DELETE',
  });
}

// 10. BOOKS & RESOURCES
export async function getBooks(): Promise<BookResource[]> {
  return fetchApi<BookResource[]>('/api/books');
}

export async function saveBook(book: BookResource): Promise<void> {
  await fetchApi<void>('/api/books', {
    method: 'POST',
    body: JSON.stringify(book),
  });
}

export async function deleteBook(id: string): Promise<void> {
  await fetchApi<void>(`/api/books/${id}`, {
    method: 'DELETE',
  });
}

// 11. ASSIGNED RESOURCES
export async function getAssignedResources(): Promise<StudentAssignedResource[]> {
  return fetchApi<StudentAssignedResource[]>('/api/assigned-resources');
}

export async function saveAssignedResource(item: StudentAssignedResource): Promise<void> {
  await fetchApi<void>('/api/assigned-resources', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function deleteAssignedResource(id: string): Promise<void> {
  await fetchApi<void>(`/api/assigned-resources/${id}`, {
    method: 'DELETE',
  });
}

export async function toggleAssignedResourceCompleted(id: string, completed: boolean): Promise<void> {
  await fetchApi<void>(`/api/assigned-resources/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
}

// No-op placeholder, as Express backend handles initialization and seeding automatically on server startup
export async function seedDatabaseIfEmpty(): Promise<void> {
  return Promise.resolve();
}
