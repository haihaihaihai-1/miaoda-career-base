/**
 * WizardShell + useWizardDraft 单元测试
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import WizardShell from '@/components/wizard/WizardShell';
import type { WizardStep } from '@/components/wizard/types';
import { useWizardDraft } from '@/hooks/useWizardDraft';
import { renderHook } from '@testing-library/react';

interface MyForm {
  name: string;
  age: number;
}

const initialForm: MyForm = { name: '', age: 0 };

function buildSteps(): WizardStep<MyForm>[] {
  return [
    {
      key: 'name',
      label: '姓名',
      render: (f, u) => (
        <input
          aria-label="name"
          value={f.name}
          onChange={(e) => u({ name: e.target.value })}
        />
      ),
      validate: (f) => (f.name.trim() ? true : '请填写姓名'),
    },
    {
      key: 'age',
      label: '年龄',
      render: (f, u) => (
        <input
          aria-label="age"
          type="number"
          value={f.age}
          onChange={(e) => u({ age: Number(e.target.value) || 0 })}
        />
      ),
      validate: (f) => (f.age > 0 ? true : '年龄必须为正'),
    },
    {
      key: 'review',
      label: '确认',
      render: (f) => (
        <div data-testid="review">
          {f.name} - {f.age}
        </div>
      ),
    },
  ];
}

describe('WizardShell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('渲染第 1 步并显示步骤计数', () => {
    render(
      <WizardShell<MyForm>
        steps={buildSteps()}
        initial={initialForm}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByText(/1\..*姓名/)).toBeInTheDocument();
    expect(screen.getByText(/第 1 \/ 3 步/)).toBeInTheDocument();
  });

  it('校验失败时下一步被阻挡并显示错误', () => {
    render(
      <WizardShell<MyForm>
        steps={buildSteps()}
        initial={initialForm}
        onSubmit={() => {}}
      />,
    );
    fireEvent.click(screen.getByText(/下一步/));
    expect(screen.getByText(/请填写姓名/)).toBeInTheDocument();
    expect(screen.getByText(/第 1 \/ 3 步/)).toBeInTheDocument();
  });

  it('校验通过时进入下一步', () => {
    render(
      <WizardShell<MyForm>
        steps={buildSteps()}
        initial={initialForm}
        onSubmit={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'Alice' } });
    fireEvent.click(screen.getByText(/下一步/));
    expect(screen.getByText(/2\..*年龄/)).toBeInTheDocument();
  });

  it('最终步骤显示提交按钮 + 校验通过后调用 onSubmit', async () => {
    let submitted: MyForm | null = null;
    render(
      <WizardShell<MyForm>
        steps={buildSteps()}
        initial={{ name: 'Bob', age: 30 }}
        onSubmit={(f) => {
          submitted = f;
        }}
      />,
    );
    // 跳到最后一步
    fireEvent.click(screen.getByText(/下一步/));
    fireEvent.click(screen.getByText(/下一步/));
    expect(screen.getByText(/3\..*确认/)).toBeInTheDocument();
    expect(screen.getByTestId('review').textContent).toContain('Bob');
    await act(async () => {
      fireEvent.click(screen.getByText(/提交/));
    });
    expect(submitted).toEqual({ name: 'Bob', age: 30 });
  });

  it('支持取消按钮', () => {
    let cancelled = false;
    render(
      <WizardShell<MyForm>
        steps={buildSteps()}
        initial={initialForm}
        onCancel={() => {
          cancelled = true;
        }}
        onSubmit={() => {}}
      />,
    );
    fireEvent.click(screen.getByText(/取消/));
    expect(cancelled).toBe(true);
  });
});

describe('useWizardDraft', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('未启用 draftKey 时不持久化', () => {
    const { result } = renderHook(() => useWizardDraft<MyForm>(undefined, initialForm));
    act(() => result.current.update({ name: 'Alice' }));
    expect(result.current.form.name).toBe('Alice');
    expect(localStorage.length).toBe(0);
  });

  it('启用 draftKey 后写入 localStorage', async () => {
    const { result } = renderHook(() =>
      useWizardDraft<MyForm>('test-key', initialForm),
    );
    await act(async () => {
      result.current.update({ name: 'Alice' });
    });
    await act(async () => {
      result.current.setStep(2);
    });
    const raw = localStorage.getItem('miaoda-wizard-draft:test-key');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.form.name).toBe('Alice');
    expect(parsed.step).toBe(2);
  });

  it('clear() 删除 localStorage', async () => {
    const { result } = renderHook(() =>
      useWizardDraft<MyForm>('test-key2', initialForm),
    );
    await act(async () => {
      result.current.update({ name: 'X' });
    });
    expect(localStorage.getItem('miaoda-wizard-draft:test-key2')).toBeTruthy();
    await act(async () => {
      result.current.clear();
    });
    expect(localStorage.getItem('miaoda-wizard-draft:test-key2')).toBeNull();
    expect(result.current.form).toEqual(initialForm);
    expect(result.current.step).toBe(0);
  });

  it('过期草稿会被忽略', () => {
    // 写入一个 8 天前的草稿
    const old = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      'miaoda-wizard-draft:expire',
      JSON.stringify({ form: { name: 'old', age: 99 }, step: 1, savedAt: old }),
    );
    const { result } = renderHook(() =>
      useWizardDraft<MyForm>('expire', initialForm),
    );
    expect(result.current.form).toEqual(initialForm);
    expect(result.current.step).toBe(0);
    expect(result.current.restored).toBe(false);
  });

  it('新鲜草稿被恢复', () => {
    localStorage.setItem(
      'miaoda-wizard-draft:fresh',
      JSON.stringify({ form: { name: 'kept', age: 30 }, step: 1, savedAt: Date.now() }),
    );
    const { result } = renderHook(() =>
      useWizardDraft<MyForm>('fresh', initialForm),
    );
    expect(result.current.form.name).toBe('kept');
    expect(result.current.step).toBe(1);
    expect(result.current.restored).toBe(true);
  });
});
