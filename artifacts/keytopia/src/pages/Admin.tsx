import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { useListProducts, useDeleteProduct, getListProductsQueryKey, Product } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Plus, Pencil, Trash2, LogOut, Search } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { toast } from 'sonner';
import { useLang } from '../contexts/LanguageContext';
import AdminProductModal from '../components/AdminProductModal';

export default function Admin() {
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { t, dir } = useLang();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation('/sign-in');
    }
  }, [isLoaded, isSignedIn, setLocation]);

  // Verify admin email whitelist after sign-in
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch('/api/admin/me', { credentials: 'include' })
      .then((r) => setIsAdmin(r.ok))
      .catch(() => setIsAdmin(false));
  }, [isLoaded, isSignedIn]);

  const handleLogout = () => {
    signOut({ redirectUrl: '/' });
  };

  // Table state
  const { data: products, isLoading } = useListProducts({
    query: { enabled: isAdmin === true, queryKey: getListProductsQueryKey() },
  });
  const [search, setSearch] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const queryClient = useQueryClient();
  const deleteMutation = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast.success(dir === 'rtl' ? 'تم حذف المنتج' : 'Product deleted');
      },
      onError: () =>
        toast.error(dir === 'rtl' ? 'فشل حذف المنتج' : 'Failed to delete product'),
    },
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };
  const handleDelete = (id: number) => {
    if (
      confirm(
        dir === 'rtl'
          ? 'هل أنت متأكد من حذف هذا المنتج؟'
          : 'Are you sure you want to delete this product?',
      )
    ) {
      deleteMutation.mutate({ id });
    }
  };

  // Loading: Clerk not yet ready, or auth check in progress
  if (!isLoaded || (isSignedIn && isAdmin === null)) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not signed in — handled by redirect effect, show spinner while navigating
  if (!isSignedIn) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Signed in but not on the admin whitelist
  if (isAdmin === false) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background" dir={dir}>
        <div className="absolute top-6 start-6">
          <Link href="/" className="font-display font-bold text-xl text-secondary">
            Keytopia
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-card p-8 rounded-[24px] shadow-xl border border-black/[0.03] text-center">
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <ShieldAlert className="w-6 h-6 text-destructive" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">
              {dir === 'rtl' ? 'غير مصرح' : 'Access Denied'}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {dir === 'rtl'
                ? 'هذا الحساب غير مدرج في قائمة المسؤولين.'
                : 'Your account is not on the admin whitelist.'}
            </p>
            <button
              onClick={handleLogout}
              className="w-full bg-secondary hover:bg-secondary/90 text-white font-semibold py-3 rounded-[16px] transition-all"
            >
              {dir === 'rtl' ? 'تسجيل الخروج' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredProducts =
    products?.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F7F9FC]" dir={dir}>
      <header className="bg-white border-b border-black/[0.03] px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display font-bold text-xl text-secondary">
            Keytopia
          </Link>
          <span className="px-2 py-1 bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider rounded">
            Admin
          </span>
        </div>
        <button
          onClick={handleLogout}
          data-testid="button-admin-logout"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('logOut')}
        </button>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">{t('products')}</h1>
            <p className="text-muted-foreground mt-1">{t('manageProducts')}</p>
          </div>
          <button
            onClick={handleAdd}
            data-testid="button-add-product"
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-full transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('addProduct')}
          </button>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-black/[0.03] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-black/[0.03] flex items-center">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('searchProducts')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-admin-search"
                className="w-full bg-muted border-none rounded-full ps-10 pe-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 border-b border-black/[0.03] text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="px-6 py-4 font-semibold">{t('product')}</th>
                  <th className="px-6 py-4 font-semibold">{t('duration')}</th>
                  <th className="px-6 py-4 font-semibold">{t('price')}</th>
                  <th className="px-6 py-4 font-semibold text-end">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      {t('loading')}
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      {t('noProductsAdmin')}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      data-testid={`row-product-${product.id}`}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-muted flex-shrink-0">
                            {product.coverImageUrl ? (
                              <img
                                src={product.coverImageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                                <span className="text-white/50 font-bold text-xs">
                                  {product.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-display font-semibold text-foreground">
                              {product.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {product.description || t('noDescription')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-accent/20 text-secondary text-xs font-semibold rounded-full">
                          {product.duration}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-display font-semibold">
                        EGP {product.price}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            data-testid={`button-edit-product-${product.id}`}
                            className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            data-testid={`button-delete-product-${product.id}`}
                            className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <AdminProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={editingProduct}
      />
    </div>
  );
}
