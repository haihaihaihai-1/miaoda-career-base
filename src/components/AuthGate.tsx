/**
 * AuthGate - 按 brand 决定是否强制登录
 *
 * 用法：
 *   <AuthGate required>
 *     <YourPage />
 *   </AuthGate>
 *
 * 若 required=true：未登录 → SignInPage；登录中 → loading；已登录 → children
 * 若 Supabase 未配置且允许访客 → 直接渲染 children（演示友好）
 */
import { useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import SignInPage from '@/pages/auth/SignInPage';

interface Props {
  required?: boolean;
  /** Supabase 未配置时是否允许"访客模式"绕过；默认 true */
  allowGuestWhenDisabled?: boolean;
  children: ReactNode;
}

export default function AuthGate({
  required = false,
  allowGuestWhenDisabled = true,
  children,
}: Props) {
  const { user, loading, enabled } = useAuth();
  const [guestBypass, setGuestBypass] = useState(false);

  if (!required) return <>{children}</>;

  // Supabase 未配置：默认允许访客模式
  if (!enabled) {
    if (allowGuestWhenDisabled && guestBypass) return <>{children}</>;
    return <SignInPage onSkip={allowGuestWhenDisabled ? () => setGuestBypass(true) : undefined} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <SignInPage />;

  return <>{children}</>;
}
