// Dify AI 配置卡片 — 我的页面顶部
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Wifi, WifiOff, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STORAGE_KEY = 'dify_config';

interface DifyConfig {
  apiUrl: string;
  apiKey: string;
}

type ConnStatus = 'unconfigured' | 'connected' | 'error';

const loadConfig = (): DifyConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DifyConfig;
  } catch { /* ignore */ }
  return {
    apiUrl: import.meta.env.VITE_DIFY_API_URL || '',
    apiKey: import.meta.env.VITE_DIFY_API_KEY || '',
  };
};

const saveConfig = (cfg: DifyConfig) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
};

const DifyConfigCard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<DifyConfig>(loadConfig);
  const [status, setStatus] = useState<ConnStatus>(() => {
    const saved = loadConfig();
    return saved.apiUrl && saved.apiKey ? 'connected' : 'unconfigured';
  });
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // 初始化时同步 env 默认值
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const defaultCfg: DifyConfig = {
        apiUrl: import.meta.env.VITE_DIFY_API_URL || '',
        apiKey: import.meta.env.VITE_DIFY_API_KEY || '',
      };
      setConfig(defaultCfg);
      if (defaultCfg.apiUrl && defaultCfg.apiKey) setStatus('connected');
    }
  }, []);

  const handleSave = () => {
    saveConfig(config);
    toast.success('配置已保存');
  };

  const handleTest = async () => {
    if (!config.apiUrl) {
      toast.error('请先填写 API 地址');
      return;
    }
    setTesting(true);
    try {
      const url = `${config.apiUrl.replace(/\/$/, '')}/parameters`;
      const res = await fetch(url, {
        method: 'GET',
        headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        setStatus('connected');
        saveConfig(config);
        toast.success('连接成功');
      } else {
        setStatus('error');
        toast.error(`连接失败：HTTP ${res.status}`);
      }
    } catch (err: unknown) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`连接失败：${msg}`);
    } finally {
      setTesting(false);
    }
  };

  const statusDot = {
    unconfigured: 'bg-muted-foreground/40',
    connected: 'bg-success',
    error: 'bg-destructive',
  }[status];

  const statusLabel = {
    unconfigured: '未配置',
    connected: '已连接',
    error: '连接失败',
  }[status];

  return (
    <Card className="shadow-card border-border mb-4">
      <CardContent className="p-4">
        {/* 头部行 */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            {status === 'connected'
              ? <Wifi className="w-4 h-4 text-primary" />
              : <WifiOff className="w-4 h-4 text-muted-foreground" />
            }
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground">AI服务配置</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn('w-2 h-2 rounded-full shrink-0', statusDot)} />
              <span className="text-xs text-muted-foreground">{statusLabel}</span>
            </div>
          </div>
          {open
            ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          }
        </button>

        {/* 展开面板 */}
        {open && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            {/* API 地址 */}
            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-muted-foreground">API 地址</Label>
              <Input
                value={config.apiUrl}
                onChange={(e) => setConfig((c) => ({ ...c, apiUrl: e.target.value }))}
                placeholder="http://your-server:5001/v1"
                className="h-9 text-sm"
              />
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-muted-foreground">API Key</Label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
                  placeholder="app-xxxxxxxxxxxxxxxx"
                  className="h-9 text-sm pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs flex-1"
                onClick={handleSave}
              >
                保存配置
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs flex-1"
                onClick={handleTest}
                disabled={testing}
              >
                {testing && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                测试连接
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DifyConfigCard;
