import { useState } from 'react';
import { useListProducts, useListCategories } from '@workspace/api-client-react';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import { Search, CheckCircle2, Zap, ShieldCheck, Clock, Shield, Star, Facebook } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang } from '../contexts/LanguageContext';

const REVIEWS = [
  {
    name: 'Mahmoud Ahmed Hussein',
    initials: 'M',
    date: 'مايو ٢٠٢٥',
    dateEn: 'May 2025',
    text: 'تم التفعيل بنجاح، برو لمدة سنة ، تسلم ايديكم',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Alaa Saadeh',
    initials: 'A',
    date: 'يونيو ٢٠٢٥',
    dateEn: 'June 2025',
    text: 'التواصل سريع وكذلك الخدمة\nاشتركت لمدة سنة كما هو مذكور\nأنصح بالتعامل مع الصفحة',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Adel Omar',
    initials: 'A',
    date: 'أغسطس ٢٠٢٥',
    dateEn: 'August 2025',
    text: 'اشتركت معاهم و تم التفعيل بسرعة\nانصح بالتعامل مع الصفحة',
    color: 'from-orange-500 to-rose-500',
  },
  {
    name: 'Abeer Elshenawy',
    initials: 'A',
    date: 'أكتوبر ٢٠٢٥',
    dateEn: 'October 2025',
    text: 'اتوقع ليكم مزيد من النجاح',
    color: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Hesham Abdelhameed',
    initials: 'H',
    date: 'أكتوبر ٢٠٢٥',
    dateEn: 'October 2025',
    text: 'ناس محترمين وسرعة في الرد والاستجابة',
    color: 'from-slate-600 to-slate-800',
  },
];

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

      {/* ── Product Marquee ── */}
      {products && products.length > 0 && (
        <div className="w-full bg-[#F7F9FC] border-b border-black/[0.04] py-6 overflow-hidden">
          <style>{`
            @keyframes marquee-ltr { from { transform: translateX(0); } to { transform: translateX(-50%); } }
            .marquee-track { display: flex; width: max-content; animation: marquee-ltr 28s linear infinite; }
            .marquee-track:hover { animation-play-state: paused; }
          `}</style>
          <div className="marquee-track gap-4 px-4">
            {[...products, ...products].map((product, i) => {
              const displayPrice =
                product.pricingOptions?.length
                  ? Math.min(...product.pricingOptions.map((o: any) => o.salePrice ?? o.price))
                  : (product.salePrice ?? product.price);
              const duration =
                product.pricingOptions?.length
                  ? [...product.pricingOptions].sort((a: any, b: any) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price))[0].duration
                  : product.duration;
              return (
                <a
                  key={`${product.id}-${i}`}
                  href={`/products/${product.id}`}
                  className="flex-shrink-0 w-[200px] bg-white rounded-[16px] border border-black/[0.05] shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="w-full h-[110px] bg-gradient-to-br from-secondary/20 to-primary/20 relative overflow-hidden">
                    {product.coverImageUrl ? (
                      <img src={product.coverImageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                        <span className="text-white/60 font-display font-bold text-2xl">{product.name.charAt(0)}</span>
                      </div>
                    )}
                    <span className="absolute top-2 start-2 bg-white/90 backdrop-blur-sm text-secondary text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {duration}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="font-display font-semibold text-sm text-foreground truncate mb-1">{product.name}</p>
                    <p className="text-primary font-bold text-sm">EGP {displayPrice}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

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

      {/* ── Reviews section ── */}
      <section className="w-full bg-gradient-to-b from-[#F7F9FC] to-white py-20 border-t border-black/[0.04]">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full mb-4">
              <Star className="w-3.5 h-3.5 fill-primary" />
              {lang === 'ar' ? 'آراء العملاء' : 'Customer Reviews'}
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              {lang === 'ar' ? 'ماذا يقول عملاؤنا؟' : 'What Our Customers Say'}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              {lang === 'ar'
                ? 'تقييمات حقيقية من عملاء موثوقين عبر فيسبوك'
                : 'Genuine reviews from verified customers on Facebook'}
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {REVIEWS.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="bg-white rounded-[20px] border border-black/[0.05] shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
                dir="rtl"
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-foreground text-sm leading-relaxed font-medium flex-1 whitespace-pre-line">
                  "{review.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-2 border-t border-black/[0.05]">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${review.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {review.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">{review.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Facebook className="w-3 h-3 text-[#1877F2]" />
                      {lang === 'ar' ? review.date : review.dateEn}
                    </div>
                  </div>
                  <div className="ms-auto flex-shrink-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1877F2] bg-[#1877F2]/10 px-2 py-1 rounded-full">
                      <Facebook className="w-2.5 h-2.5" />
                      Facebook
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
