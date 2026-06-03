/**
 * Teaching brand - 教学网站 REST API 客户端
 * 不复制教学网站后端数据，仅通过 REST 读取学生 / 课程 / 进度
 */
import ky from 'ky';

export interface Enrollment {
  id: string;
  course_id: string;
  course_name: string;
  semester: string;
  credits: number;
  status: 'in_progress' | 'completed' | 'dropped';
  grade?: string;
  progress: number; // 0-100
}

export interface CourseProgress {
  course_id: string;
  current_chapter: number;
  total_chapters: number;
  knowledge_points: KnowledgePoint[];
  last_activity_at: string;
}

export interface KnowledgePoint {
  id: string;
  name: string;
  category: string;
  mastery: number; // 0-100
  related_resources: string[];
}

export interface LearningSuggestion {
  id: string;
  type: 'review' | 'practice' | 'advance' | 'reach_out';
  knowledge_point_ids: string[];
  message: string;
  priority: 'high' | 'medium' | 'low';
}

const apiBase = import.meta.env.VITE_TEACHING_API_BASE ?? '/api';

/** 单例 ky 客户端 */
const api = ky.create({
  prefixUrl: apiBase,
  timeout: 15000,
  retry: { limit: 1 },
  hooks: {
    beforeRequest: [
      (req) => {
        // 占位：SSO 单点登录后，从 localStorage / cookie 注入 Bearer
        const token =
          typeof window !== 'undefined' ? localStorage.getItem('teaching_token') : null;
        if (token) req.headers.set('Authorization', `Bearer ${token}`);
      },
    ],
  },
});

export async function fetchMyEnrollments(): Promise<Enrollment[]> {
  return api.get('student/enrollments').json<Enrollment[]>();
}

export async function fetchCourseProgress(courseId: string): Promise<CourseProgress> {
  return api.get(`student/courses/${encodeURIComponent(courseId)}/progress`).json<CourseProgress>();
}

export async function fetchKnowledgeGaps(): Promise<KnowledgePoint[]> {
  return api.get('student/knowledge-gaps').json<KnowledgePoint[]>();
}

export async function fetchLearningSuggestions(): Promise<LearningSuggestion[]> {
  return api.get('student/suggestions').json<LearningSuggestion[]>();
}

/** 健康检查 */
export async function pingTeachingAPI(timeoutMs = 4000): Promise<boolean> {
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
