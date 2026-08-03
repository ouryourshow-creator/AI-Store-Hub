import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Product, ProductInput, ProductUpdate, useCreateProduct, useUpdateProduct, getListProductsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AdminProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export default function AdminProductModal({ isOpen, onClose, product }: AdminProductModalProps) {
  const isEditing = !!product;
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    description: '',
    price: 0,
    duration: '',
    coverImageUrl: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        duration: product.duration,
        coverImageUrl: product.coverImageUrl || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration: '',
        coverImageUrl: ''
      });
    }
  }, [product, isOpen]);

  const createMutation = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast.success('Product created successfully');
        onClose();
      },
      onError: () => toast.error('Failed to create product')
    }
  });

  const updateMutation = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast.success('Product updated successfully');
        onClose();
      },
      onError: () => toast.error('Failed to update product')
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && product) {
      updateMutation.mutate({ id: product.id, data: formData });
    } else {
      createMutation.mutate({ data: formData });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

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
              className="bg-card w-full max-w-lg rounded-[20px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.03] shrink-0">
                <h2 className="text-xl font-display font-bold">{isEditing ? 'Edit Product' : 'Add Product'}</h2>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Name</label>
                    <input 
                      type="text" required
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-muted border-none rounded-[12px] px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Description</label>
                    <textarea 
                      rows={3}
                      value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-muted border-none rounded-[12px] px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Price (EGP)</label>
                      <input 
                        type="number" required min="0" step="0.01"
                        value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                        className="w-full bg-muted border-none rounded-[12px] px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Duration</label>
                      <input 
                        type="text" required placeholder="1 Month"
                        value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})}
                        className="w-full bg-muted border-none rounded-[12px] px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Cover Image URL</label>
                    <input 
                      type="url"
                      value={formData.coverImageUrl || ''} onChange={e => setFormData({...formData, coverImageUrl: e.target.value})}
                      className="w-full bg-muted border-none rounded-[12px] px-4 py-3 text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>

                  {formData.coverImageUrl && (
                    <div className="mt-4 rounded-[12px] overflow-hidden aspect-video bg-muted relative">
                      <img src={formData.coverImageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </form>
              </div>

              <div className="p-6 border-t border-black/[0.03] bg-background shrink-0">
                <button 
                  type="submit" form="product-form"
                  disabled={isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-4 rounded-[20px] transition-all active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {isPending ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
