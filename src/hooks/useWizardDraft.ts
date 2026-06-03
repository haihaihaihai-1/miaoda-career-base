/**
 * useWizardDraft - 用 localStorage 保存表单草稿，刷新/中断后自动恢复
 *
 * 实现注意：写入是 setState 同步触发的（而非 useEffect 异步），便于测试与一致性。
 */
import { useRef, useState, useCallback } from 'react';

const KEY_PREFIX = 'miaoda-wizard-draft:';

export interface WizardDraft<T> {
  /** 当前的表单数据 */
  form: T;
  /** 上一次保存到 localStorage 的步骤索引 */
  step: number;
  /** 草稿写入时间戳 */
  savedAt: number;
}

export interface UseWizardDraftResult<T> {
  form: T;
  step: number;
  /** 局部更新 form 字段 */
  update: (patch: Partial<T>) => void;
  /** 覆盖整个 form */
  setForm: (next: T) => void;
  setStep: (next: number) => void;
  /** 清空草稿 */
  clear: () => void;
  /** 是否从草稿恢复 */
  restored: boolean;
}

function safeSerialize<T>(data: WizardDraft<T>): string {
  return JSON.stringify(data);
}

function safeParse<T>(raw: string | null): WizardDraft<T> | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw);
    if (typeof obj === 'object' && obj !== null && 'form' in obj && 'step' in obj) {
      return obj as WizardDraft<T>;
    }
    return null;
  } catch {
    return null;
  }
}

function writeDraft<T>(storageKey: string | null, form: T, step: number): void {
  if (!storageKey || typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey, safeSerialize<T>({ form, step, savedAt: Date.now() }));
  } catch {
    /* 配额满 / 隐私模式 → 静默 */
  }
}

/**
 * @param key  草稿唯一 key；同一 key 多组件共享
 * @param initial 初始表单
 * @param ttlMs 草稿过期时间（毫秒），默认 7 天
 */
export function useWizardDraft<T>(
  key: string | undefined,
  initial: T,
  ttlMs = 7 * 24 * 60 * 60 * 1000,
): UseWizardDraftResult<T> {
  const storageKey = key ? `${KEY_PREFIX}${key}` : null;
  const restoredRef = useRef(false);
  const stepRef = useRef(0);
  const formRef = useRef<T>(initial);

  const [form, setFormState] = useState<T>(() => {
    if (!storageKey || typeof window === 'undefined') return initial;
    const draft = safeParse<T>(localStorage.getItem(storageKey));
    if (!draft) return initial;
    if (Date.now() - draft.savedAt > ttlMs) {
      localStorage.removeItem(storageKey);
      return initial;
    }
    restoredRef.current = true;
    formRef.current = draft.form;
    return draft.form;
  });

  const [step, setStepState] = useState<number>(() => {
    if (!storageKey || typeof window === 'undefined') return 0;
    const draft = safeParse<T>(localStorage.getItem(storageKey));
    if (!draft) return 0;
    if (Date.now() - draft.savedAt > ttlMs) return 0;
    stepRef.current = draft.step;
    return draft.step;
  });

  const update = useCallback(
    (patch: Partial<T>) => {
      const next = { ...(formRef.current as object), ...(patch as object) } as T;
      formRef.current = next;
      writeDraft(storageKey, next, stepRef.current);
      setFormState(next);
    },
    [storageKey],
  );

  const setForm = useCallback(
    (next: T) => {
      formRef.current = next;
      writeDraft(storageKey, next, stepRef.current);
      setFormState(next);
    },
    [storageKey],
  );

  const setStep = useCallback(
    (next: number) => {
      stepRef.current = next;
      writeDraft(storageKey, formRef.current, next);
      setStepState(next);
    },
    [storageKey],
  );

  const clear = useCallback(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* noop */
      }
    }
    formRef.current = initial;
    stepRef.current = 0;
    restoredRef.current = false;
    setFormState(initial);
    setStepState(0);
  }, [storageKey, initial]);

  return {
    form,
    step,
    update,
    setForm,
    setStep,
    clear,
    restored: restoredRef.current,
  };
}
