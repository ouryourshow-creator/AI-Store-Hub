import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LanguageContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PromoState {
  status: 'idle' | 'loading' | 'valid' | 'invalid';
  code: string;
  percentage: number;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, cartTotal, clearCart } = useCart();
  const { t, dir, lang } = useLang();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoState>({ status: 'idle', code: '', percentage: 0 });

  const discountAmount = promo.status === 'valid'
    ? Math.round(cartTotal * promo.percentage / 100)
    : 0;
  const finalTotal = cartTotal - discountAmount;

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromo({ status: 'loading', code: '', percentage: 0 });
    try {
      const res = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, productIds: items.map(i => i.id) }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromo({ status: 'valid', code: data.code, percentage: data.percentage });
      } else {
        setPromo({ status: 'invalid', code: '', percentage: 0 });
      }
    } catch {
      setPromo({ status: 'invalid', code: '', percentage: 0 });
    }
  };

  const clearPromo = () => {
    setPromo({ status: 'idle', code: '', percentage: 0 });
    setPromoInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !whatsapp) return;

    const orderLines = items.map(
      item => `- ${item.name} (${item.selectedDuration}) x${item.quantity} — EGP ${item.selectedPrice * item.quantity}`
    ).join('\n');

    const promoLine = promo.status === 'valid'
      ? `\n${t('waDiscount')} (${promo.code} ${promo.percentage}%): -EGP ${discountAmount}`
      : '';

    const text = `🛒 ${t('waOrderFrom')}\n\n${t('waName')}: ${name}\n${t('waWhatsApp')}: ${whatsapp}\n\n${t('waOrder')}:\n${orderLines}${promoLine}\n\n${t('waTotal')}: EGP ${finalTotal}`;

    const url = `https://wa.me/201229327902?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    clearCart();
    setName('');
    setWhatsapp('');
    clearPromo();
    onClose();
  };

  const inputCls = "w-full bg-muted border-none rounded-[16px] px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none transition-all";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-card w-full max-w-md rounded-[20px] shadow-2xl overflow-hidden"
            dir={dir}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.03]">
              <h2 className="text-xl font-display font-bold">{t('completeOrder')}</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ms-1">
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className={inputCls}
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ms-1">
                  {t('whatsappNumber')}
                </label>
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder={t('whatsappPlaceholder')}
                  dir="ltr"
                  className={inputCls}
                />
              </div>

              {/* Promo code */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ms-1 flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  {t('promoCode')}
                </label>
                {promo.status === 'valid' ? (
                  <div className="flex items-center gap-3 bg-[#1CC88A]/10 border border-[#1CC88A]/30 rounded-[16px] px-4 py-3">
                    <CheckCircle2 className="w-4 h-4 text-[#1CC88A] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1CC88A]">{t('promoApplied')}</p>
                      <p className="text-xs text-muted-foreground font-mono">{promo.code} — {promo.percentage}% {t('discount')}</p>
                    </div>
                    <button type="button" onClick={clearPromo} className="p-1 rounded-full hover:bg-black/10 transition-colors">
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={e => { setPromoInput(e.target.value.toUpperCase()); if (promo.status === 'invalid') setPromo({ status: 'idle', code: '', percentage: 0 }); }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPromo(); } }}
                      placeholder={t('promoCodePlaceholder')}
                      dir="ltr"
                      className="flex-1 bg-muted border-none rounded-[16px] px-4 py-3.5 text-sm font-mono tracking-widest text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={!promoInput.trim() || promo.status === 'loading'}
                      className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm rounded-[16px] transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {promo.status === 'loading' ? '...' : t('applyPromo')}
                    </button>
                  </div>
                )}
                {promo.status === 'invalid' && (
                  <p className="mt-1.5 text-xs text-destructive flex items-center gap-1 ms-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {t('promoInvalid')}
                  </p>
                )}
              </div>

              {/* Order summary */}
              <div className="bg-muted/50 rounded-[16px] p-4">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-muted-foreground">{t('items')} ({items.length})</span>
                  <span className="font-semibold">EGP {cartTotal}</span>
                </div>
                {promo.status === 'valid' && (
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-[#1CC88A] font-semibold">{t('discount')} ({promo.percentage}%)</span>
                    <span className="text-[#1CC88A] font-semibold">− EGP {discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-display font-bold text-lg pt-2 border-t border-black/[0.05]">
                  <span>{t('total')}</span>
                  <span className="text-primary">EGP {finalTotal}</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!name || !whatsapp}
                className="w-full bg-[#1CC88A] hover:bg-[#1CC88A]/90 text-white font-semibold py-4 px-4 rounded-[20px] transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
              >
                {t('sendViaWhatsApp')}
                <ExternalLink className="w-4 h-4" />
              </button>
              <p className="text-center text-[10px] text-muted-foreground">{t('whatsappNote')}</p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
