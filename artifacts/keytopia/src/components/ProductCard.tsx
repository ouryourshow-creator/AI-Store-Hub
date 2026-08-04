import { Product } from '@workspace/api-client-react';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'wouter';
import { TrendingUp } from 'lucide-react';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { t, lang } = useLang();

  // Determine the cheapest pricing option (if multiple exist)
  const hasMultipleOptions =
    product.pricingOptions != null && product.pricingOptions.length > 1;

  const cheapestOption = hasMultipleOptions
    ? [...product.pricingOptions!].sort((a, b) => {
        const aEffective = a.salePrice ?? a.price;
        const bEffective = b.salePrice ?? b.price;
        return aEffective - bEffective;
      })[0]
    : null;

  // What to show in the duration badge
  const badgeDuration = cheapestOption ? cheapestOption.duration : product.duration;

  // What to show as the price
  const displayPrice = cheapestOption
    ? (cheapestOption.salePrice ?? cheapestOption.price)
    : (product.salePrice ?? product.price);

  const originalPrice = cheapestOption
    ? (cheapestOption.salePrice != null ? cheapestOption.price : null)
    : (product.salePrice != null ? product.price : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-[20px] overflow-hidden border border-black/[0.06] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
    >
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {product.coverImageUrl ? (
            <img
              src={product.coverImageUrl}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-primary opacity-90 flex items-center justify-center">
              <span className="text-white/30 font-display font-bold text-4xl">{product.name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute top-4 end-4 bg-accent/20 backdrop-blur-md text-secondary font-semibold text-xs px-3 py-1 rounded-full border border-accent/30">
            {badgeDuration}
          </div>
        </div>
      </Link>

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-[#1CC88A] bg-[#1CC88A]/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1CC88A] animate-pulse" />
            {t('instantActivation')}
          </span>
          {typeof product.soldCount === 'number' && product.soldCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200">
              <TrendingUp className="w-2.5 h-2.5" />
              {lang === 'ar'
                ? `${product.soldCount.toLocaleString('ar-EG')}+ تم البيع`
                : `${product.soldCount.toLocaleString()}+ sold`}
            </span>
          )}
        </div>

        <Link href={`/products/${product.id}`}>
          <h3 className="text-xl font-display font-semibold mt-2 mb-1 text-foreground hover:text-primary transition-colors">{product.name}</h3>
        </Link>

        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{t('price')}</span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-xl text-foreground">
                {hasMultipleOptions ? `${t('from')} ` : ''}EGP {displayPrice}
              </span>
              {originalPrice != null && (
                <span className="text-sm text-muted-foreground line-through">
                  EGP {originalPrice}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const addDuration = cheapestOption ? cheapestOption.duration : product.duration;
            const addPrice = cheapestOption
              ? (cheapestOption.salePrice ?? cheapestOption.price)
              : (product.salePrice ?? product.price);
            addItem(product, addDuration, addPrice);
            toast.success(t('addToCart'), {
              description: product.name,
              duration: 2000,
            });
          }}
          className="mt-5 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-4 rounded-full transition-all active:scale-[0.98] shadow-sm hover:shadow active:shadow-none"
        >
          {t('addToCart')}
        </button>
      </div>
    </motion.div>
  );
}
