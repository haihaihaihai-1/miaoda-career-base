/**
 * hireflowPdfReport 测试 - 不真生成 PDF，验证 token 与流程
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateHireflowPdf } from '@/lib/hireflowPdfReport';
import type { Candidate } from '@/types/hireflow';

// mock jsPDF —— 注意需为 constructor
const mockSave = vi.fn();
function MockPdfCtor() {
  return {
    internal: { pageSize: { getWidth: () => 595, getHeight: () => 842 } },
    setFillColor: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    setPage: vi.fn(),
    getNumberOfPages: vi.fn(() => 2),
    saveGraphicsState: vi.fn(),
    restoreGraphicsState: vi.fn(),
    setGState: vi.fn(),
    GState: vi.fn(),
    save: mockSave,
    splitTextToSize: vi.fn((s: string) => [s]),
  };
}

vi.mock('jspdf', () => ({
  default: MockPdfCtor,
}));

const candidate: Candidate = {
  id: 'c-1',
  name: 'Alice',
  target_position: 'Senior Software Engineer',
  experience_years: 5,
  interview_stage: 'technical',
  competency_scores: {
    professional: 80,
    learning: 75,
    communication: 70,
    resilience: 72,
    leadership: 60,
  },
  overall_match_rate: 78,
  notes: 'hire',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('generateHireflowPdf', () => {
  beforeEach(() => {
    mockSave.mockClear();
  });

  it('成功生成 PDF 返回 token', async () => {
    const token = await generateHireflowPdf({ candidate });
    expect(token).toMatch(/^hf-/);
    expect(mockSave).toHaveBeenCalled();
  });

  it('PDF 文件名包含 candidate 名与 token', async () => {
    const token = await generateHireflowPdf({ candidate });
    const filename = mockSave.mock.calls[mockSave.mock.calls.length - 1][0] as string;
    expect(filename).toContain('Alice');
    expect(filename).toContain(token);
    expect(filename.endsWith('.pdf')).toBe(true);
  });

  it('带 answers 时仍能保存', async () => {
    await generateHireflowPdf({
      candidate,
      answers: [
        { dimension: 'professional', question: 'q1', answer: 'a1', score: 80 },
      ],
    });
    expect(mockSave).toHaveBeenCalled();
  });

  it('无 competency_scores 时跳过 details 但仍能保存', async () => {
    await generateHireflowPdf({
      candidate: { ...candidate, competency_scores: undefined },
    });
    expect(mockSave).toHaveBeenCalled();
  });
});
