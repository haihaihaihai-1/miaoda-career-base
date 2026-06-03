/**
 * Campus brand - 校园 REST 客户端
 *
 * 后端预期：workspace campus-agent/ 暴露：
 *   - GET  /api/student/me
 *   - GET  /api/notices?limit=
 *   - GET  /api/schedule?date=
 *   - GET  /api/services
 *   - POST /api/qa (流式)
 *
 * 不可用时所有方法 throw，调用方需做 mock fallback
 */
import ky from 'ky';

export interface CampusStudent {
  id: string;
  name: string;
  student_no: string;
  major: string;
  grade: string;
  class_name: string;
  campus: string;
  avatar_url?: string;
}

export interface CampusNotice {
  id: string;
  title: string;
  summary: string;
  source: string;
  category: 'academic' | 'activity' | 'admin' | 'urgent';
  published_at: string;
  url?: string;
}

export interface ScheduleEntry {
  id: string;
  course: string;
  teacher: string;
  location: string;
  weekday: number; // 1-7
  start_time: string; // HH:mm
  end_time: string;
  weeks: string; // "1-16"
}

export interface CampusService {
  id: string;
  name: string;
  category: 'life' | 'academic' | 'finance' | 'health';
  description: string;
  url?: string;
  icon?: string;
}

const apiBase = import.meta.env.VITE_CAMPUS_API_BASE ?? '/api';

const api = ky.create({
  prefixUrl: apiBase,
  timeout: 15000,
  retry: { limit: 1 },
  hooks: {
    beforeRequest: [
      (req) => {
        const token =
          typeof window !== 'undefined' ? localStorage.getItem('campus_token') : null;
        if (token) req.headers.set('Authorization', `Bearer ${token}`);
      },
    ],
  },
});

export async function fetchCampusMe(): Promise<CampusStudent> {
  return api.get('student/me').json<CampusStudent>();
}

export async function fetchCampusNotices(limit = 20): Promise<CampusNotice[]> {
  return api.get('notices', { searchParams: { limit } }).json<CampusNotice[]>();
}

export async function fetchSchedule(date?: string): Promise<ScheduleEntry[]> {
  const searchParams: Record<string, string> = {};
  if (date) searchParams.date = date;
  return api.get('schedule', { searchParams }).json<ScheduleEntry[]>();
}

export async function fetchCampusServices(): Promise<CampusService[]> {
  return api.get('services').json<CampusService[]>();
}

/** 健康检查 */
export async function pingCampusAPI(timeoutMs = 4000): Promise<boolean> {
  try {
    const r = await ky.get(`${apiBase.replace(/\/$/, '')}/health`, {
      timeout: timeoutMs,
      retry: 0,
    });
    return r.ok;
  } catch {
    return false;
  }
}
