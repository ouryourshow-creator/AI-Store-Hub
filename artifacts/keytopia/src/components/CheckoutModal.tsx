import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Copy, Check, ExternalLink,
  User, Mail, Phone, CreditCard, Tag, CheckCircle2, AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LanguageContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PaymentMethod = 'instapay' | 'vodafone' | 'bank' | 'other' | null;

interface PromoState {
  status: 'idle' | 'loading' | 'valid' | 'invalid';
  code: string;
  percentage: number;
}

const WA_NUMBER = '+201229327902';
const WA_LINK = `https://wa.me/${encodeURIComponent(WA_NUMBER)}`;

const PAYMENT_INFO = {
  instapay: { link: 'https://ipn.eg/S/batsilitohsbc/instapay/7Gr2jR' },
  vodafone: { number: '01016712243' },
  bank: { accountNumber: '004-253829-001', iban: 'EG860025000400000004253829001', bank: 'HSBC Egypt' },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-black/10 transition-colors text-muted-foreground hover:text-foreground"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-[#1CC88A]" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, cartTotal, clearCart } = useCart();
  const { t, dir, lang } = useLang();
  const isRtl = dir === 'rtl';

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoState>({ status: 'idle', code: '', percentage: 0 });

  const discountAmount = promo.status === 'valid' ? Math.round(cartTotal * promo.percentage / 100) : 0;
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

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setName(''); setEmail(''); setPhone('');
      setPaymentMethod(null);
      clearPromo();
    }, 300);
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) return;
    setStep(2);
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    if (method === 'other') {
      const msg = isRtl
        ? `مرحباً، أريد الشراء من كيتوبيا ولكن لا أستطيع استخدام طرق الدفع المتاحة. هل يمكنكم توفير طريقة دفع بديلة؟\n\nاسمي: ${name}\nالإجمالي: EGP ${finalTotal}`
        : `Hello, I want to purchase from Keytopia but cannot use the available payment methods. Can you offer an alternative?\n\nName: ${name}\nTotal: EGP ${finalTotal}`;
      window.open(`${WA_LINK}?text=${encodeURIComponent(msg)}`, '_blank');
      return;
    }
    setPaymentMethod(method);
    setStep(3);
  };

  const handleSendProof = () => {
    const methodLabel: Record<string, string> = {
      instapay: 'Instapay',
      vodafone: isRtl ? 'فودافون كاش' : 'Vodafone Cash',
      bank: isRtl ? 'تحويل بنكي (HSBC)' : 'Bank Transfer (HSBC)',
    };
    const orderLines = items.map(
      item => `• ${item.name} (${item.selectedDuration}) ×${item.quantity} — EGP ${item.selectedPrice * item.quantity}`
    ).join('\n');
    const promoLine = promo.status === 'valid' ? `\n${t('discount')} (${promo.code} ${promo.percentage}%): -EGP ${discountAmount}` : '';
    const method = paymentMethod ? (methodLabel[paymentMethod] ?? paymentMethod) : '';

    const msg = isRtl
      ? `مرحباً، أرسل لكم إيصال الدفع لطلبي من كيتوبيا.\n\n👤 الاسم: ${name}\n📧 البريد: ${email}\n📱 الهاتف: ${phone}\n\n🛒 الطلب:\n${orderLines}${promoLine}\n\n💰 الإجمالي: EGP ${finalTotal}\n💳 طريقة الدفع: ${method}\n\n[أرجو إرفاق إيصال الدفع]`
      : `Hello, I am sending my payment proof for my Keytopia order.\n\n👤 Name: ${name}\n📧 Email: ${email}\n📱 Phone: ${phone}\n\n🛒 Order:\n${orderLines}${promoLine}\n\n💰 Total: EGP ${finalTotal}\n💳 Payment: ${method}\n\n[Please attach payment proof]`;

    window.open(`${WA_LINK}?text=${encodeURIComponent(msg)}`, '_blank');

    clearCart();
    handleClose();
  };

  const inputCls = 'w-full bg-muted border border-transparent rounded-[14px] px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none transition-all';

  const steps = [
    { n: 1, label: isRtl ? 'معلوماتك' : 'Your Info' },
    { n: 2, label: isRtl ? 'الدفع' : 'Payment' },
    { n: 3, label: isRtl ? 'إيصال الدفع' : 'Proof' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={e => e.stopPropagation()}
            className="bg-card w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden"
            dir={dir}
          >
            {/* Header */}
            <div className="relative flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-xl font-display font-bold">{t('completeOrder')}</h2>
              <button onClick={handleClose} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step indicators */}
            <div className="px-6 pb-5">
              <div className="flex items-center gap-0">
                {steps.map((s, idx) => (
                  <div key={s.n} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        step > s.n
                          ? 'bg-[#1CC88A] text-white'
                          : step === s.n
                          ? 'bg-primary text-white shadow-md shadow-primary/30'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                      </div>
                      <span className={`text-[10px] font-semibold transition-colors ${step === s.n ? 'text-primary' : 'text-muted-foreground'}`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors duration-300 ${step > s.n ? 'bg-[#1CC88A]' : 'bg-muted'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className="px-6 pb-6">
              <AnimatePresence mode="wait">

                {/* ── Step 1: Contact Info ── */}
                {step === 1 && (
                  <motion.form
                    key="step1"
                    initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleStep1Next}
                    className="flex flex-col gap-4"
                  >
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ms-1">
                        <User className="w-3 h-3" />{t('fullName')}
                      </label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)}
                        placeholder={t('fullNamePlaceholder')} className={inputCls} />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ms-1">
                        <Mail className="w-3 h-3" />{t('emailAddress')}
                      </label>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder={t('emailPlaceholder')} dir="ltr" className={inputCls} />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ms-1">
                        <Phone className="w-3 h-3" />{t('phoneNumber')}
                      </label>
                      <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder={t('phonePlaceholder')} dir="ltr" className={inputCls} />
                    </div>

                    {/* Promo code */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ms-1">
                        <Tag className="w-3 h-3" />{t('promoCode')} <span className="normal-case text-[10px] font-normal">({t('optional')})</span>
                      </label>
                      {promo.status === 'valid' ? (
                        <div className="flex items-center gap-3 bg-[#1CC88A]/10 border border-[#1CC88A]/30 rounded-[14px] px-4 py-3">
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
                          <input type="text" value={promoInput}
                            onChange={e => { setPromoInput(e.target.value.toUpperCase()); if (promo.status === 'invalid') setPromo({ status: 'idle', code: '', percentage: 0 }); }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyPromo(); } }}
                            placeholder={t('promoCodePlaceholder')} dir="ltr"
                            className="flex-1 bg-muted border-none rounded-[14px] px-4 py-3.5 text-sm font-mono tracking-widest placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground text-foreground focus:ring-2 focus:ring-primary outline-none transition-all" />
                          <button type="button" onClick={handleApplyPromo}
                            disabled={!promoInput.trim() || promo.status === 'loading'}
                            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm rounded-[14px] transition-all disabled:opacity-50 whitespace-nowrap">
                            {promo.status === 'loading' ? '...' : t('applyPromo')}
                          </button>
                        </div>
                      )}
                      {promo.status === 'invalid' && (
                        <p className="mt-1.5 text-xs text-destructive flex items-center gap-1 ms-1">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />{t('promoInvalid')}
                        </p>
                      )}
                    </div>

                    {/* Order summary */}
                    <div className="bg-muted/50 rounded-[16px] p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t('items')}</p>
                      <div className="flex flex-col gap-1 mb-3">
                        {items.map(item => (
                          <div key={`${item.id}-${item.selectedDuration}`} className="flex justify-between text-sm">
                            <span className="text-foreground/80 truncate max-w-[200px]">{item.name} ({item.selectedDuration})</span>
                            <span className="font-semibold">EGP {item.selectedPrice * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      {promo.status === 'valid' && (
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#1CC88A] font-semibold">{t('discount')} ({promo.percentage}%)</span>
                          <span className="text-[#1CC88A] font-semibold">−EGP {discountAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-display font-bold text-base pt-2 border-t border-black/[0.06]">
                        <span>{t('total')}</span>
                        <span className="text-primary">EGP {finalTotal}</span>
                      </div>
                    </div>

                    <button type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-[18px] transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2">
                      {t('next')}
                      {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </motion.form>
                )}

                {/* ── Step 2: Payment Method ── */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-3"
                  >
                    <p className="text-sm text-muted-foreground mb-1">{t('choosePaymentMethod')}</p>

                    {/* Instapay */}
                    <button type="button" onClick={() => handlePaymentSelect('instapay')}
                      className="flex items-center gap-4 w-full bg-white border-2 border-transparent hover:border-primary rounded-[16px] p-4 text-start transition-all hover:shadow-md group">
                      <div className="w-10 h-10 rounded-[10px] bg-[#E8F5FF] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#007AFF] font-bold text-xs">IP</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">Instapay</p>
                        <p className="text-xs text-muted-foreground">{t('instapayDesc')}</p>
                      </div>
                      {isRtl ? <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              : <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                    </button>

                    {/* Vodafone Cash */}
                    <button type="button" onClick={() => handlePaymentSelect('vodafone')}
                      className="flex items-center gap-4 w-full bg-white border-2 border-transparent hover:border-primary rounded-[16px] p-4 text-start transition-all hover:shadow-md group">
                      <div className="w-10 h-10 rounded-[10px] bg-[#FFF0F0] flex items-center justify-center flex-shrink-0">
                        <span className="text-[#E60000] font-bold text-xs">VC</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">{isRtl ? 'فودافون كاش' : 'Vodafone Cash'}</p>
                        <p className="text-xs text-muted-foreground">{t('vodafoneDesc')}</p>
                      </div>
                      {isRtl ? <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              : <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                    </button>

                    {/* Bank Transfer */}
                    <button type="button" onClick={() => handlePaymentSelect('bank')}
                      className="flex items-center gap-4 w-full bg-white border-2 border-transparent hover:border-primary rounded-[16px] p-4 text-start transition-all hover:shadow-md group">
                      <div className="w-10 h-10 rounded-[10px] bg-[#FFF8E8] flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-5 h-5 text-[#C89B3C]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">{t('bankTransfer')}</p>
                        <p className="text-xs text-muted-foreground">{t('bankDesc')}</p>
                      </div>
                      {isRtl ? <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              : <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                    </button>

                    {/* Other */}
                    <button type="button" onClick={() => handlePaymentSelect('other')}
                      className="flex items-center gap-4 w-full bg-white border-2 border-transparent hover:border-primary rounded-[16px] p-4 text-start transition-all hover:shadow-md group">
                      <div className="w-10 h-10 rounded-[10px] bg-[#F0FFF5] flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-[#1CC88A]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">{t('otherMethods')}</p>
                        <p className="text-xs text-muted-foreground">{t('otherMethodsDesc')}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>

                    <button type="button" onClick={() => setStep(1)}
                      className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                      {t('back')}
                    </button>
                  </motion.div>
                )}

                {/* ── Step 3: Payment Details + Proof ── */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-4"
                  >
                    <p className="text-sm text-muted-foreground">{t('paymentProofInstructions')}</p>

                    {/* Instapay details */}
                    {paymentMethod === 'instapay' && (
                      <div className="bg-[#E8F5FF]/60 border border-[#007AFF]/20 rounded-[16px] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#007AFF] mb-3">Instapay</p>
                        <p className="text-sm text-muted-foreground mb-2">{t('instapayClickLink')}</p>
                        <a href={PAYMENT_INFO.instapay.link} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-[#007AFF] text-white text-sm font-semibold px-4 py-3 rounded-[12px] hover:bg-[#0063CC] transition-colors w-full justify-center">
                          {t('payViaInstapay')}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}

                    {/* Vodafone Cash details */}
                    {paymentMethod === 'vodafone' && (
                      <div className="bg-[#FFF0F0]/60 border border-[#E60000]/20 rounded-[16px] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#E60000] mb-3">{isRtl ? 'فودافون كاش' : 'Vodafone Cash'}</p>
                        <p className="text-sm text-muted-foreground mb-2">{t('sendToNumber')}</p>
                        <div className="flex items-center gap-3 bg-white rounded-[10px] px-4 py-3 border border-[#E60000]/20">
                          <span className="font-mono font-bold text-lg tracking-widest text-foreground flex-1" dir="ltr">
                            {PAYMENT_INFO.vodafone.number}
                          </span>
                          <CopyButton text={PAYMENT_INFO.vodafone.number} />
                        </div>
                      </div>
                    )}

                    {/* Bank Transfer details */}
                    {paymentMethod === 'bank' && (
                      <div className="bg-[#FFF8E8]/60 border border-[#C89B3C]/20 rounded-[16px] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#C89B3C] mb-3">{PAYMENT_INFO.bank.bank}</p>
                        <div className="flex flex-col gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{t('accountNumber')}</p>
                            <div className="flex items-center gap-3 bg-white rounded-[10px] px-4 py-3 border border-[#C89B3C]/20">
                              <span className="font-mono font-semibold text-sm text-foreground flex-1" dir="ltr">
                                {PAYMENT_INFO.bank.accountNumber}
                              </span>
                              <CopyButton text={PAYMENT_INFO.bank.accountNumber} />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">IBAN</p>
                            <div className="flex items-center gap-3 bg-white rounded-[10px] px-4 py-3 border border-[#C89B3C]/20">
                              <span className="font-mono font-semibold text-xs text-foreground flex-1 break-all" dir="ltr">
                                {PAYMENT_INFO.bank.iban}
                              </span>
                              <CopyButton text={PAYMENT_INFO.bank.iban} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order total reminder */}
                    <div className="flex justify-between items-center bg-muted/50 rounded-[14px] px-4 py-3">
                      <span className="text-sm text-muted-foreground">{t('total')}</span>
                      <span className="font-display font-bold text-primary text-lg">EGP {finalTotal}</span>
                    </div>

                    {/* WhatsApp proof button */}
                    <div className="bg-[#F0FFF5] border border-[#1CC88A]/30 rounded-[16px] p-4">
                      <p className="text-sm font-semibold text-foreground mb-1">{t('afterPayment')}</p>
                      <p className="text-xs text-muted-foreground mb-3">{t('sendProofExplain')}</p>
                      <button type="button" onClick={handleSendProof}
                        className="w-full bg-[#1CC88A] hover:bg-[#1CC88A]/90 text-white font-semibold py-4 px-4 rounded-[16px] transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        {t('sendProofViaWhatsApp')}
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>

                    <button type="button" onClick={() => setStep(2)}
                      className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                      {t('back')}
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
