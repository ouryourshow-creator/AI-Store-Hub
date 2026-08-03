import { useState } from 'react';
import { useListProducts, useListCategories } from '@workspace/api-client-react';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { Search, CheckCircle2, Zap, ShieldCheck, Clock, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../contexts/LanguageContext';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: products, isLoading } = useListProducts();
  const { data: categories } = useListCategories();
  const { t, lang } = useLang();

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const badges = [
    { icon: CheckCircle2, label: t('officialAccess') },
    { icon: Zap, label: t('instantActivation') },
    { icon: ShieldCheck, label: t('verifiedPartners') },
    { icon: Clock, label: t('support247') },
    { icon: Shield, label: t('securePayment') },
  ];

  const pillBase = "px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap";
  const pillActive = `${pillBase} bg-primary text-white shadow-sm shadow-primary/20`;
  const pillInactive = `${pillBase} bg-white border border-black/[0.07] text-muted-foreground hover:text-foreground hover:border-black/20`;

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative w-full bg-gradient-to-br from-secondary to-primary overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center">
          <motion.h1
            key={`hero-${lang}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`text-4xl md:text-6xl font-display font-bold text-white mb-6 max-w-3xl whitespace-pre-line ${lang === 'en' ? 'tracking-tight' : 'leading-relaxed'}`}
          >
            {t('heroTitle')}
          </motion.h1>
          <motion.p
            key={`sub-${lang}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/80 text-lg md:text-xl max-w-2xl font-medium"
          >
            {t('heroSubtitle')}
          </motion.p>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="bg-white border-b border-black/[0.03]">
        <div className="max-w-7xl mx-auto px-6 py-8 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-center min-w-max md:min-w-0 gap-8 md:gap-16">
            {badges.map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-secondary font-medium text-sm">
                <badge.icon className="w-5 h-5 flex-shrink-0" />
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16 w-full flex-1">
        {/* Search */}
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-xl">
            <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-black/[0.06] rounded-full py-4 ps-12 pe-6 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Category filter pills */}
        {categories && categories.length > 0 && (
          <div className="flex items-center gap-2 mb-10 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? pillActive : pillInactive}
            >
              {t('allCategories')}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                className={selectedCategory === cat.name ? pillActive : pillInactive}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-[20px] h-[380px] animate-pulse border border-black/[0.03]">
                <div className="h-[200px] bg-muted w-full rounded-t-[20px]" />
                <div className="p-6">
                  <div className="h-4 bg-muted w-1/3 rounded mb-4" />
                  <div className="h-6 bg-muted w-3/4 rounded mb-2" />
                  <div className="h-4 bg-muted w-full rounded mb-6" />
                  <div className="h-10 bg-muted w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-display font-medium text-foreground mb-2">{t('noProductsTitle')}</h3>
            {searchQuery && <p>{t('noProductsBody')} "{searchQuery}".</p>}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </Layout>
  );
}
