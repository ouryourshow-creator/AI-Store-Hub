import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetEgpUsdRateQueryKey, useGetEgpUsdRate, useSetEgpUsdRate } from '@workspace/api-client-react';
import { Coins } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLang } from '../contexts/LanguageContext';

export default function AdminSettings() {
  const { t, dir } = useLang();
  const queryClient = useQueryClient();
  const { data: egpUsdRate, isLoading } = useGetEgpUsdRate();
  const [rateInput, setRateInput] = useState('');

  useEffect(() => {
    if (egpUsdRate) setRateInput(String(egpUsdRate.rate));
  }, [egpUsdRate]);

  const setRateMutation = useSetEgpUsdRate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEgpUsdRateQueryKey() });
        toast.success(t('egpUsdRateSaved'));
      },
      onError: () => toast.error(t('egpUsdRateSaveFailed')),
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Number(rateInput);
    if (!Number.isFinite(rate) || rate <= 0) {
      toast.error(t('egpUsdRateInvalid'));
      return;
    }
    setRateMutation.mutate({ data: { rate } });
  };

  const inputCls = 'w-full bg-muted border border-transparent rounded-[10px] px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">{t('settings')}</h1>
        <p className="text-muted-foreground mt-1">{t('settingsSub')}</p>
      </div>

      <div className="max-w-xl bg-white rounded-[20px] border border-black/[0.03] shadow-sm p-6">
        <h2 className="text-base font-display font-bold mb-1 flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          {t('egpUsdRateTitle')}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">{t('egpUsdRateDesc')}</p>

        {isLoading ? (
          <div className="py-6 text-center text-muted-foreground text-sm">{t('loading')}</div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                {t('egpUsdRateLabel')}
              </label>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">1 USD =</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  dir="ltr"
                  data-testid="input-egp-usd-rate"
                  className={inputCls}
                />
                <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">EGP</span>
              </div>
            </div>
            {egpUsdRate && egpUsdRate.updatedAt && new Date(egpUsdRate.updatedAt).getTime() > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('lastUpdated')}: {format(new Date(egpUsdRate.updatedAt), 'MMM d, yyyy • h:mm a')}
              </p>
            )}
            <button
              type="submit"
              disabled={setRateMutation.isPending}
              data-testid="button-save-egp-usd-rate"
              className="self-start bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-6 rounded-[12px] transition-all shadow-sm disabled:opacity-50"
            >
              {setRateMutation.isPending ? (dir === 'rtl' ? 'جارٍ الحفظ...' : 'Saving...') : t('saveChanges')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
