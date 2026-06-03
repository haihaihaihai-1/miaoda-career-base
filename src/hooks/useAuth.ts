/**
 * useAuth - Supabase Auth 状态 Hook
 *
 * 设计：
 *   - 自动 subscribe `supabase.auth.onAuthStateChange`
 *   - 提供 user / session / signOut
 *   - Supabase 未配置时所有方法 no-op（mock 模式）
 *   - 兼容三种登录方式：Email OTP / Magic Link / OAuth (Google)
 */
import { useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/db/supabase';
import { isSupabaseAvailable } from '@/services/hireflowDB';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Supabase 是否已配置（决定是否走真实 auth） */
  enabled: boolean;
}

export interface UseAuthResult extends AuthState {
  signInWithEmail: (email: string) => Promise<{ error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  /** 用 OTP code 完成验证（Email 输入 + 收到邮件验证码后调用） */
  verifyOtp: (email: string, token: string) => Promise<{ error?: string }>;
}

export function useAuth(): UseAuthResult {
  const enabled = isSupabaseAvailable();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: enabled,
    enabled,
  });

  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    let active = true;

    // 立即读取一次（避免首屏闪烁）
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState({
        user: data.session?.user ?? null,
        session: data.session ?? null,
        loading: false,
        enabled,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setState({
        user: session?.user ?? null,
        session: session ?? null,
        loading: false,
        enabled,
      });
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [enabled]);

  const signInWithEmail = useCallback(
    async (email: string): Promise<{ error?: string }> => {
      if (!enabled) return { error: 'Supabase 未配置' };
      const { error } = await supabase.auth.signInWithOtp({ email });
      return error ? { error: error.message } : {};
    },
    [enabled],
  );

  const verifyOtp = useCallback(
    async (email: string, token: string): Promise<{ error?: string }> => {
      if (!enabled) return { error: 'Supabase 未配置' };
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      return error ? { error: error.message } : {};
    },
    [enabled],
  );

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'github'): Promise<{ error?: string }> => {
      if (!enabled) return { error: 'Supabase 未配置' };
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      });
      return error ? { error: error.message } : {};
    },
    [enabled],
  );

  const signOut = useCallback(async (): Promise<void> => {
    if (!enabled) return;
    await supabase.auth.signOut();
  }, [enabled]);

  return {
    ...state,
    signInWithEmail,
    signInWithOAuth,
    verifyOtp,
    signOut,
  };
}
