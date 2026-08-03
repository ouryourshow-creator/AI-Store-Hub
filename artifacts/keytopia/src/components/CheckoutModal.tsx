import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LanguageContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, cartTotal, clearCart } = useCart();
  const { t, dir } = useLang();
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !whatsapp) return;

    const orderLines = items.map(
      item => `- ${item.name} (${item.selectedDuration}) x${item.quantity} — EGP ${item.selectedPrice * item.quantity}`
    ).join('\n');

    const text = `🛒 ${t('waOrderFrom')}\n\n${t('waName')}: ${name}\n${t('waWhatsApp')}: ${whatsapp}\n\n${t('waOrder')}:\n${orderLines}\n\n${t('waTotal')}: EGP ${cartTotal}`;

    const url = `https://wa.me/201229327902?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    clearCart();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4 mb-8">
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
                      className="w-full bg-muted border-none rounded-[16px] px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
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
                      className="w-full bg-muted border-none rounded-[16px] px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="bg-muted/50 rounded-[16px] p-4 mb-6">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-muted-foreground">{t('items')} ({items.length})</span>
                    <span className="font-semibold">EGP {cartTotal}</span>
                  </div>
                  <div className="flex justify-between items-center font-display font-bold text-lg pt-2 border-t border-black/[0.05]">
                    <span>{t('total')}</span>
                    <span className="text-primary">EGP {cartTotal}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!name || !whatsapp}
                  className="w-full bg-[#1CC88A] hover:bg-[#1CC88A]/90 text-white font-semibold py-4 px-4 rounded-[20px] transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                >
                  {t('sendViaWhatsApp')}
                  <ExternalLink className="w-4 h-4" />
                </button>
                <p className="text-center text-[10px] text-muted-foreground mt-4">
                  {t('whatsappNote')}
                </p>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
