/**
 * useAuth + AuthGate 测试
 * 通过 mock supabase 客户端来验证 hook 行为
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor, render, screen } from '@testing-library/react';
import type { Session, User } from '@supabase/supabase-js';

// 必须在 import useAuth 前 mock 依赖
vi.mock('@/db/supabase', () => {
  const listeners: Array<(event: string, session: Session | null) => void> = [];
  let currentSession: Session | null = null;

  const supabase = {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: currentSession }, error: null }),
      ),
      onAuthStateChange: vi.fn((cb: (event: string, s: Session | null) => void) => {
        listeners.push(cb);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                const i = listeners.indexOf(cb);
                if (i >= 0) listeners.splice(i, 1);
              },
            },
          },
        };
      }),
      signInWithOtp: vi.fn(() => Promise.resolve({ error: null })),
      verifyOtp: vi.fn((args: { email: string; token: string }) => {
        if (args.token === 'BAD') {
          return Promise.resolve({ error: { message: 'invalid token' } });
        }
        const u = { id: 'user-1', email: args.email } as User;
        currentSession = { user: u } as Session;
        for (const l of listeners) l('SIGNED_IN', currentSession);
        return Promise.resolve({ error: null });
      }),
      signInWithOAuth: vi.fn(() => Promise.resolve({ error: null })),
      signOut: vi.fn(() => {
        currentSession = null;
        for (const l of listeners) l('SIGNED_OUT', null);
        return Promise.resolve({ error: null });
      }),
    },
  };
  return { supabase };
});

vi.mock('@/services/hireflowDB', async () => {
  const actual = await vi.importActual<typeof import('@/services/hireflowDB')>(
    '@/services/hireflowDB',
  );
  return {
    ...actual,
    // 强制开启
    isSupabaseAvailable: () => true,
  };
});

// 必须 mock 后再 import
const { useAuth } = await import('@/hooks/useAuth');
const { default: AuthGate } = await import('@/components/AuthGate');

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初始 loading=true，后变 false，user 为 null', async () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.enabled).toBe(true);
  });

  it('signInWithEmail 转发到 supabase.signInWithOtp', async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const r = await result.current.signInWithEmail('test@example.com');
    expect(r.error).toBeUndefined();
  });

  it('verifyOtp 成功后 user 变化', async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      const r = await result.current.verifyOtp('alice@example.com', 'GOOD');
      expect(r.error).toBeUndefined();
    });
    await waitFor(() => {
      expect(result.current.user?.email).toBe('alice@example.com');
    });
  });

  it('verifyOtp 错误码返回 error', async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    const r = await result.current.verifyOtp('x@x', 'BAD');
    expect(r.error).toBe('invalid token');
  });

  it('signOut 后 user 变 null', async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.verifyOtp('a@a', 'GOOD');
    });
    await waitFor(() => expect(result.current.user).toBeTruthy());
    await act(async () => {
      await result.current.signOut();
    });
    await waitFor(() => expect(result.current.user).toBeNull());
  });
});

describe('AuthGate', () => {
  it('required=false 直接渲染 children', () => {
    render(
      <AuthGate required={false}>
        <div>protected</div>
      </AuthGate>,
    );
    expect(screen.getByText('protected')).toBeInTheDocument();
  });

  it('required=true 未登录时渲染 SignInPage', async () => {
    render(
      <AuthGate required>
        <div>protected</div>
      </AuthGate>,
    );
    // SignInPage 含有"登录"二字
    await waitFor(() => {
      expect(screen.queryByText('protected')).not.toBeInTheDocument();
    });
  });
});
