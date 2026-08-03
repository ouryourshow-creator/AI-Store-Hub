import { Product } from '@workspace/api-client-react';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { t } = useLang();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-[20px] overflow-hidden border border-black/[0.06] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {product.coverImageUrl ? (
          <img
            src={product.coverImageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-primary opacity-90 flex items-center justify-center">
            <span className="text-white/30 font-display font-bold text-4xl">{product.name.charAt(0)}</span>
          </div>
        )}
        <div className="absolute top-4 end-4 bg-accent/20 backdrop-blur-md text-secondary font-semibold text-xs px-3 py-1 rounded-full border border-accent/30">
          {product.duration}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-[#1CC88A] bg-[#1CC88A]/10 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1CC88A] animate-pulse" />
          {t('instantActivation')}
        </div>

        <h3 className="text-xl font-display font-semibold mt-2 mb-1 text-foreground">{product.name}</h3>

        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{product.description}</p>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{t('price')}</span>
            <span className="font-display font-bold text-xl text-foreground">
              EGP {product.price}
            </span>
          </div>
        </div>

        <button
          onClick={() => addItem(product)}
          className="mt-5 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-4 rounded-full transition-all active:scale-[0.98] shadow-sm hover:shadow active:shadow-none"
        >
          {t('addToCart')}
        </button>
      </div>
    </motion.div>
  );
}
