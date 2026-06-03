/**
 * UserMenu - 头像下拉菜单（已登录显示登出 / 资料；未登录显示登录入口）
 * Supabase 未配置时显示"演示模式"
 *
 * 包含"AI Provider 配置"入口（SettingsDialog），可运行时切换/配置 ChatProvider
 */
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { LogOut, LogIn, User, FlaskConical, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logEvent } from '@/lib/observability';
import SignInPage from '@/pages/auth/SignInPage';
import ChatProviderCard from '@/components/ai/ChatProviderCard';
import { brand } from '@/config';

export default function UserMenu() {
  const { user, loading, enabled, signOut } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showProvider, setShowProvider] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    logEvent('auth.signout');
    await signOut();
    setSigningOut(false);
  };

  if (loading) {
    return (
      <Button variant="ghost" size="icon" aria-label="loading user">
        <Loader2 className="size-4 animate-spin" />
      </Button>
    );
  }

  const initial =
    user?.email?.slice(0, 1).toUpperCase() ??
    user?.user_metadata?.name?.slice(0, 1).toUpperCase() ??
    '?';

  const display = user?.email ?? '匿名用户';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="user menu" className="rounded-full">
            <Avatar className="size-8">
              <AvatarFallback className={user ? 'bg-primary text-primary-foreground' : ''}>
                {user ? initial : <User className="size-4" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[240px]">
          {!enabled && (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                <FlaskConical className="size-3" />
                演示模式 · Supabase 未配置
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}
          {user ? (
            <>
              <DropdownMenuLabel className="font-normal">
                <div className="text-sm truncate" title={display}>
                  {display}
                </div>
                {user.id && (
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {user.id.slice(0, 8)}…
                  </div>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {brand.features.aiAdvisor && (
                <DropdownMenuItem onClick={() => setShowProvider(true)}>
                  <Sparkles className="mr-2 size-4" />
                  AI Provider
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
                {signingOut ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 size-4" />
                )}
                登出
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setShowSignIn(true)}>
                <LogIn className="mr-2 size-4" />
                登录
              </DropdownMenuItem>
              {brand.features.aiAdvisor && (
                <DropdownMenuItem onClick={() => setShowProvider(true)}>
                  <Sparkles className="mr-2 size-4" />
                  AI Provider
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={showSignIn} onOpenChange={setShowSignIn}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>登录</SheetTitle>
          </SheetHeader>
          <SignInPage onSkip={() => setShowSignIn(false)} />
        </SheetContent>
      </Sheet>

      <Sheet open={showProvider} onOpenChange={setShowProvider}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 overflow-y-auto">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-base flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              AI Provider 配置
            </SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <ChatProviderCard />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
