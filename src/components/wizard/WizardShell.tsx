/**
 * WizardShell - 通用多步表单容器
 *
 * 使用：
 *   const steps: WizardStep<MyForm>[] = [...];
 *   <WizardShell
 *     steps={steps}
 *     initial={initialForm}
 *     draftKey="my-wizard-v1"
 *     onSubmit={handleSubmit}
 *     onCancel={() => navigate('/')}
 *   />
 */
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle } from '@/components/ui/alert';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  History,
  Sparkles,
} from 'lucide-react';
import { useWizardDraft } from '@/hooks/useWizardDraft';
import { t } from '@/lib/i18n';
import type { WizardProps } from './types';

export default function WizardShell<T>({
  steps,
  initial,
  submitLabel,
  cancelLabel,
  draftKey,
  title,
  onCancel,
  onSubmit,
  demoData,
}: WizardProps<T>) {
  const totalSteps = steps.length;
  const draft = useWizardDraft<T>(draftKey, initial);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const currentStep = steps[draft.step] ?? steps[0];
  const stepIndex = Math.min(draft.step, totalSteps - 1);

  const validateResult = useMemo(() => {
    if (!currentStep.validate) return true as const;
    return currentStep.validate(draft.form);
  }, [currentStep, draft.form]);

  const canProceed = validateResult === true;
  const validationMsg =
    typeof validateResult === 'string' ? validateResult : null;

  const handleNext = () => {
    setErrMsg(null);
    if (!canProceed) {
      setErrMsg(validationMsg ?? '当前步骤未填写完整');
      return;
    }
    if (stepIndex < totalSteps - 1) {
      draft.setStep(stepIndex + 1);
    }
  };

  const handlePrev = () => {
    setErrMsg(null);
    if (stepIndex > 0) draft.setStep(stepIndex - 1);
  };

  const handleSubmit = async () => {
    if (!canProceed) {
      setErrMsg(validationMsg ?? '当前步骤未填写完整');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setErrMsg(null);
    try {
      await onSubmit(draft.form);
      draft.clear();
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadDemo = () => {
    if (!demoData) return;
    draft.setForm(demoData);
    draft.setStep(totalSteps - 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{title ?? 'Wizard'}</h1>
          <div className="flex items-center gap-2">
            {demoData && (
              <Button variant="ghost" size="sm" onClick={handleLoadDemo} className="gap-1">
                <Sparkles className="size-3" />
                填演示数据
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                {cancelLabel ?? t('common.cancel')}
              </Button>
            )}
          </div>
        </div>
        <div className="container mx-auto px-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <Progress value={((stepIndex + 1) / totalSteps) * 100} className="flex-1" />
            <span className="text-xs text-muted-foreground ml-3 whitespace-nowrap">
              {t('wizard.step_n_of', { n: stepIndex + 1, total: totalSteps })}
            </span>
          </div>
          {draft.restored && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <History className="size-3" />
              已从草稿恢复 ·{' '}
              <button
                type="button"
                onClick={draft.clear}
                className="text-primary hover:underline"
              >
                清空重填
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep.icon && <currentStep.icon className="size-5" />}
              <span>
                {stepIndex + 1}. {currentStep.label}
              </span>
              {validateResult === true && (
                <Badge variant="outline" className="ml-auto gap-1">
                  <CheckCircle2 className="size-3 text-green-600" />
                  就绪
                </Badge>
              )}
            </CardTitle>
            {currentStep.description && (
              <p className="text-sm text-muted-foreground">{currentStep.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStep.render(draft.form, draft.update)}
          </CardContent>
        </Card>

        {errMsg && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>{errMsg}</AlertTitle>
          </Alert>
        )}

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            disabled={stepIndex === 0 || submitting}
            onClick={handlePrev}
            className="gap-2"
          >
            <ChevronLeft className="size-4" /> {t('wizard.prev')}
          </Button>
          {stepIndex < totalSteps - 1 ? (
            <Button onClick={handleNext} className="gap-2">
              {t('wizard.next')} <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  {submitLabel ?? t('wizard.submit')}
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
