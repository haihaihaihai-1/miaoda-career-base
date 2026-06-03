/**
 * ChatProviderCard - 运行时切换 AI Provider 的配置面板
 *
 * 显示可用 provider 列表 + 当前激活 + 配置状态
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Sparkles, Loader2 } from 'lucide-react';
import {
  listProviders,
  getActiveProvider,
  setActiveProvider,
  onActiveProviderChange,
  type ChatProvider,
} from '@/services/aiProvider';
import { brand } from '@/config';

export default function ChatProviderCard() {
  const [providers] = useState<ChatProvider[]>(() => listProviders());
  const [active, setActive] = useState<string>(() => getActiveProvider(brand.id).id);
  const [pinging, setPinging] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, boolean | null>>({});

  useEffect(() => {
    const off = onActiveProviderChange((b, id) => {
      if (b === brand.id) setActive(id);
    });
    return off;
  }, []);

  const handleSelect = (id: string) => {
    setActive(id);
    setActiveProvider(brand.id, id);
  };

  const handlePing = async (p: ChatProvider) => {
    setPinging(p.id);
    try {
      const ok = await p.ping();
      setPingResults((r) => ({ ...r, [p.id]: ok }));
    } finally {
      setPinging(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          AI Provider
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          选择当前 brand 使用的对话后端，切换立即生效
        </p>
      </CardHeader>
      <CardContent>
        <RadioGroup value={active} onValueChange={handleSelect} className="space-y-3">
          {providers.map((p) => {
            const configured = p.isConfigured();
            const result = pingResults[p.id];
            return (
              <div
                key={p.id}
                className={`flex items-start gap-3 p-3 border rounded-lg ${
                  active === p.id ? 'border-primary bg-accent/50' : ''
                }`}
              >
                <RadioGroupItem value={p.id} id={`provider-${p.id}`} className="mt-1" />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`provider-${p.id}`}
                    className="font-medium text-sm flex items-center gap-2 cursor-pointer"
                  >
                    {p.name}
                    {configured ? (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <CheckCircle2 className="size-2.5 text-green-600" />
                        已配置
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <XCircle className="size-2.5 text-amber-600" />
                        待配置
                      </Badge>
                    )}
                    {result === true && (
                      <Badge className="text-[10px] bg-green-100 text-green-800">
                        在线
                      </Badge>
                    )}
                    {result === false && (
                      <Badge className="text-[10px] bg-red-100 text-red-800">
                        离线
                      </Badge>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePing(p)}
                  disabled={pinging === p.id}
                  className="flex-shrink-0 text-xs"
                >
                  {pinging === p.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    'Ping'
                  )}
                </Button>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
