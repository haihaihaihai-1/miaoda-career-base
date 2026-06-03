/**
 * SignInPage - 登录页（Email OTP + OAuth）
 *
 * Supabase 未配置时显示提示，但允许"以访客身份继续"绕过 AuthGate
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Loader2, Mail, KeyRound, LogIn, AlertCircle, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { brand } from '@/config';
import { t } from '@/lib/i18n';

interface Props {
  /** 用户跳过登录（仅当 Supabase 未配置时显示） */
  onSkip?: () => void;
}

export default function SignInPage({ onSkip }: Props) {
  const { enabled, signInWithEmail, signInWithOAuth, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [phase, setPhase] = useState<'email' | 'otp'>('email');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('请输入邮箱');
      return;
    }
    setError(null);
    setSubmitting(true);
    const r = await signInWithEmail(email.trim());
    setSubmitting(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    setInfo(`验证码已发送到 ${email}，请查收`);
    setPhase('otp');
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('请输入验证码');
      return;
    }
    setError(null);
    setSubmitting(true);
    const r = await verifyOtp(email.trim(), otp.trim());
    setSubmitting(false);
    if (r.error) setError(r.error);
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError(null);
    setSubmitting(true);
    const r = await signInWithOAuth(provider);
    setSubmitting(false);
    if (r.error) setError(r.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="size-5 text-primary" />
            登录 {brand.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{brand.tagline}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!enabled && (
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>
                Supabase 未配置 —— 当前为演示模式，可以以访客身份继续浏览
              </AlertTitle>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          {info && phase === 'otp' && (
            <Alert>
              <AlertTitle>{info}</AlertTitle>
            </Alert>
          )}

          {phase === 'email' ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={submitting || !enabled}
                />
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={submitting || !enabled}
                className="w-full gap-2"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
                发送验证码
              </Button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">或</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => handleOAuth('google')}
                disabled={submitting || !enabled}
                className="w-full gap-2"
              >
                <svg className="size-4" viewBox="0 0 48 48" aria-hidden>
                  <path fill="#FFC107" d="M43.6 20.5H42V20.5H24v7h11.3c-1.6 4.5-5.8 7.5-11.3 7.5-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5-5C33.6 6.4 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c11 0 19.5-7.9 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l5.7 4.2c1.6-3.8 5.2-6.4 9.5-6.4 3 0 5.7 1.1 7.8 3l5-5C30.6 6.4 26 4.5 21 4.5c-7.4 0-13.8 4.2-16.7 10.2z"/>
                  <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.7-5l-5.9-5C29 35.4 26.6 36 24 36c-5.5 0-10.1-3.5-11.8-8.4l-6 4.6C9.3 38.7 16 43.5 24 43.5z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20.5H24v7h11.3c-.8 2.2-2.2 4-4 5.3l5.9 5c-3.5 3.2-7.4 5.7-13.2 5.7 0 0 19.5 0 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/>
                </svg>
                Google 登录
              </Button>

              <Button
                variant="outline"
                onClick={() => handleOAuth('github')}
                disabled={submitting || !enabled}
                className="w-full gap-2"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 0a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.4-1.3-5.4-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.7 5.6-5.4 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 0z" />
                </svg>
                GitHub 登录
              </Button>

              {!enabled && onSkip && (
                <Button variant="ghost" onClick={onSkip} className="w-full gap-2">
                  <UserCircle2 className="size-4" />
                  以访客身份继续（演示）
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="otp">验证码</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6 位数字验证码"
                  inputMode="numeric"
                  maxLength={6}
                  disabled={submitting}
                />
              </div>
              <Button
                onClick={handleVerifyOtp}
                disabled={submitting}
                className="w-full gap-2"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                验证并登录
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setPhase('email');
                  setError(null);
                  setInfo(null);
                }}
                className="w-full"
              >
                返回换邮箱
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            登录即表示同意服务条款与隐私政策
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
