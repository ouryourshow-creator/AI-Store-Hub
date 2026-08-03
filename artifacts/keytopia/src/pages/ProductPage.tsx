import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { useGetProduct, getGetProductQueryKey } from '@workspace/api-client-react';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { ArrowRight, ArrowLeft, ShieldCheck, Zap, Clock, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { t, dir, lang } = useLang();
  const { addItem } = useCart();
  const { data: product, isLoading, isError } = useGetProduct(id, {
    query: { enabled: !isNaN(id), queryKey: getGetProductQueryKey(id) },
  });
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);

  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-6 py-24 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (isError || !product) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <h1 className="text-2xl font-display font-bold mb-2">{t('productNotFound')}</h1>
          <p className="text-muted-foreground mb-8">{t('productNotFoundSub')}</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-full">
            <BackArrow className="w-4 h-4" />
            {t('backToStore')}
          </Link>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    addItem(product);
    toast.success(t('addToCart'), { description: product.name, duration: 2000 });
  };

  const pricingOptions = product.pricingOptions && product.pricingOptions.length > 0
    ? product.pricingOptions
    : [{ duration: product.duration, price: product.price, salePrice: product.salePrice }];
  const selectedOption = pricingOptions[selectedOptionIdx] ?? pricingOptions[0];

  const features = [
    { icon: Zap, label: t('activationTime'), value: t('activationTimeDetail') },
    { icon: ShieldCheck, label: t('warranty'), value: t('warrantyDetail') },
    { icon: Clock, label: t('subscriptionDuration'), value: selectedOption.duration },
    { icon: MessageCircle, label: t('support'), value: t('supportDetail') },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-10 w-full">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <BackArrow className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t('backToStore')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left — image */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-[24px] overflow-hidden aspect-square bg-muted shadow-sm border border-black/[0.06]"
          >
            {product.coverImageUrl ? (
              <img src={product.coverImageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                <span className="text-white/20 font-display font-bold text-8xl">{product.name.charAt(0)}</span>
              </div>
            )}
          </motion.div>

          {/* Right — details */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="flex flex-col gap-6"
          >
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#1CC88A] bg-[#1CC88A]/10 border border-[#1CC88A]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1CC88A] animate-pulse" />
                {t('instantActivation')}
              </span>
            </div>

            {/* Name */}
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground leading-snug">
                {product.name}
              </h1>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground leading-relaxed text-base">
                {product.description}
              </p>
            )}

            {/* Price + CTA */}
            <div className="bg-card rounded-[20px] border border-black/[0.06] p-6 flex flex-col gap-4 shadow-sm">
              {/* Duration selector */}
              {pricingOptions.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {pricingOptions.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedOptionIdx(i)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                        i === selectedOptionIdx
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-muted text-muted-foreground border-transparent hover:border-primary/30'
                      }`}
                    >
                      {opt.duration}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium block mb-1">
                    {t('price')}
                  </span>
                  {selectedOption.salePrice != null ? (
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-display font-bold text-foreground">
                        EGP {selectedOption.salePrice}
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        EGP {selectedOption.price}
                      </span>
                    </div>
                  ) : (
                    <span className="text-4xl font-display font-bold text-foreground">
                      EGP {selectedOption.price}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleAddToCart}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-[16px] transition-all active:scale-[0.98] shadow-sm text-base"
              >
                {t('addToCart')}
              </button>
              <a
                href={`https://wa.me/201229327902?text=${encodeURIComponent(
                  lang === 'ar'
                    ? `مرحباً، أريد الاستفسار عن ${product.name}`
                    : `Hello, I'd like to ask about ${product.name}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/5 font-semibold py-3.5 rounded-[16px] transition-all text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                {t('contactViaWhatsApp')}
              </a>
            </div>
          </motion.div>
        </div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {features.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-card rounded-[20px] border border-black/[0.06] p-6 flex gap-4 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                <p className="text-sm text-foreground leading-relaxed">{value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </Layout>
  );
}
