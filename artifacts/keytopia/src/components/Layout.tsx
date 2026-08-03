import { Link } from 'wouter';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LanguageContext';
import { useState } from 'react';
import CartDrawer from './CartDrawer';

// Logo is served from the public/ folder
const logoImg = `${import.meta.env.BASE_URL}logo.png`;

export default function Layout({ children }: { children: React.ReactNode }) {
  const { cartCount } = useCart();
  const { t, toggleLang, dir } = useLang();
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background" dir={dir}>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-black/[0.03]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 select-none">
            <img src={logoImg} alt="Keytopia" className="h-10 w-auto object-contain" />
          </Link>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              aria-label="Toggle language"
              className="h-9 px-4 rounded-full border border-black/[0.08] bg-muted hover:bg-muted/80 text-sm font-semibold text-foreground transition-all"
            >
              {t('toggleLang')}
            </button>

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              aria-label={t('cartAriaLabel')}
              className="relative p-2.5 rounded-full hover:bg-black/[0.03] transition-colors"
            >
              <ShoppingBag className="w-6 h-6 text-foreground" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-primary text-white text-xs font-bold rounded-full border-2 border-background">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="py-12 text-center text-sm text-muted-foreground border-t border-black/[0.03] mt-auto">
        <p>&copy; {new Date().getFullYear()} Keytopia. {t('allRightsReserved')}</p>
        <div className="mt-4 flex justify-center gap-6">
          <Link href="/policy" className="hover:text-foreground transition-colors">{t('policyLink')}</Link>
          <Link href="/admin" className="hover:text-foreground transition-colors">{t('adminLogin')}</Link>
        </div>
      </footer>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
