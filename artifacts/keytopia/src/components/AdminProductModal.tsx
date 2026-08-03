import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Product,
  ProductInput,
  useCreateProduct,
  useUpdateProduct,
  getListProductsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

const DURATION_OPTIONS = ['1 Month', '3 Months', '6 Months', '12 Months', 'Lifetime'];
const ACTIVATION_OPTIONS = ['', 'Automatic', 'Manual', 'Invitation'];
const CUSTOMER_INFO_OPTIONS = [
  { key: 'email',       label: 'Email' },
  { key: 'password',    label: 'Password' },
  { key: 'username',    label: 'Username' },
  { key: 'inviteEmail', label: 'Invite Email' },
  { key: 'notes',       label: 'Notes' },
];

type Section = 'basic' | 'pricing' | 'subscription' | 'description' | 'customer' | 'afterpurchase';

function SectionHeader({
  title, open, onToggle,
}: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between py-3 text-left group"
    >
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
        {title}
      </span>
      {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full bg-muted border-none rounded-[10px] px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none transition-all";
const checkboxCls = "w-4 h-4 rounded border-muted-foreground/30 text-primary focus:ring-primary";

type FormData = {
  name: string; category: string; brand: string; coverImageUrl: string;
  price: string; salePrice: string;
  duration: string; deliveryTime: string; activationType: string;
  onCustomerAccount: boolean; invitationLink: string; licenseKey: string; sharedAccount: boolean;
  description: string; featuresText: string;
  customerInfoRequired: string[];
  afterPurchaseInstructions: string;
};

const EMPTY: FormData = {
  name: '', category: '', brand: '', coverImageUrl: '',
  price: '', salePrice: '',
  duration: '1 Month', deliveryTime: '', activationType: '',
  onCustomerAccount: false, invitationLink: '', licenseKey: '', sharedAccount: false,
  description: '', featuresText: '',
  customerInfoRequired: [],
  afterPurchaseInstructions: '',
};

function productToForm(p: Product): FormData {
  return {
    name: p.name,
    category: p.category ?? '',
    brand: p.brand ?? '',
    coverImageUrl: p.coverImageUrl ?? '',
    price: String(p.price),
    salePrice: p.salePrice != null ? String(p.salePrice) : '',
    duration: p.duration,
    deliveryTime: p.deliveryTime ?? '',
    activationType: p.activationType ?? '',
    onCustomerAccount: p.onCustomerAccount ?? false,
    invitationLink: p.invitationLink ?? '',
    licenseKey: p.licenseKey ?? '',
    sharedAccount: p.sharedAccount ?? false,
    description: p.description ?? '',
    featuresText: (p.features ?? []).join('\n'),
    customerInfoRequired: p.customerInfoRequired ?? [],
    afterPurchaseInstructions: p.afterPurchaseInstructions ?? '',
  };
}

function formToInput(f: FormData): ProductInput {
  return {
    name: f.name,
    category: f.category || undefined,
    brand: f.brand || undefined,
    coverImageUrl: f.coverImageUrl || undefined,
    price: Number(f.price),
    salePrice: f.salePrice ? Number(f.salePrice) : undefined,
    duration: f.duration,
    deliveryTime: f.deliveryTime || undefined,
    activationType: f.activationType || undefined,
    onCustomerAccount: f.onCustomerAccount,
    invitationLink: f.invitationLink || undefined,
    licenseKey: f.licenseKey || undefined,
    sharedAccount: f.sharedAccount,
    description: f.description || undefined,
    features: f.featuresText
      ? f.featuresText.split('\n').map(s => s.trim()).filter(Boolean)
      : undefined,
    customerInfoRequired: f.customerInfoRequired.length ? f.customerInfoRequired : undefined,
    afterPurchaseInstructions: f.afterPurchaseInstructions || undefined,
  };
}

export default function AdminProductModal({ isOpen, onClose, product }: Props) {
  const isEditing = !!product;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [open, setOpen] = useState<Record<Section, boolean>>({
    basic: true, pricing: true, subscription: true,
    description: true, customer: true, afterpurchase: true,
  });

  useEffect(() => {
    if (isOpen) setForm(product ? productToForm(product) : EMPTY);
  }, [product, isOpen]);

  const toggle = (s: Section) => setOpen(prev => ({ ...prev, [s]: !prev[s] }));
  const set = (patch: Partial<FormData>) => setForm(prev => ({ ...prev, ...patch }));
  const toggleInfo = (key: string) =>
    set({
      customerInfoRequired: form.customerInfoRequired.includes(key)
        ? form.customerInfoRequired.filter(k => k !== key)
        : [...form.customerInfoRequired, key],
    });

  const onSuccess = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    toast.success(msg);
    onClose();
  };

  const createMutation = useCreateProduct({
    mutation: { onSuccess: () => onSuccess('Product created'), onError: () => toast.error('Failed to create') },
  });
  const updateMutation = useUpdateProduct({
    mutation: { onSuccess: () => onSuccess('Product updated'), onError: () => toast.error('Failed to update') },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = formToInput(form);
    if (isEditing && product) {
      updateMutation.mutate({ id: product.id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-card w-full max-w-2xl rounded-[20px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05] shrink-0">
              <h2 className="text-lg font-display font-bold">{isEditing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              <form id="product-form" onSubmit={handleSubmit} className="divide-y divide-black/[0.04]">

                {/* ── Basic Information ── */}
                <div className="py-2">
                  <SectionHeader title="Basic Information" open={open.basic} onToggle={() => toggle('basic')} />
                  {open.basic && (
                    <div className="grid grid-cols-2 gap-3 pb-3">
                      <div className="col-span-2">
                        <Field label="Product Name *">
                          <input type="text" required value={form.name} onChange={e => set({ name: e.target.value })} className={inputCls} />
                        </Field>
                      </div>
                      <Field label="Category">
                        <input type="text" placeholder="e.g. AI Tools" value={form.category} onChange={e => set({ category: e.target.value })} className={inputCls} />
                      </Field>
                      <Field label="Brand">
                        <input type="text" placeholder="e.g. OpenAI" value={form.brand} onChange={e => set({ brand: e.target.value })} className={inputCls} />
                      </Field>
                      <div className="col-span-2">
                        <Field label="Product Image URL">
                          <input type="url" placeholder="https://..." value={form.coverImageUrl} onChange={e => set({ coverImageUrl: e.target.value })} className={inputCls} />
                        </Field>
                        {form.coverImageUrl && (
                          <div className="mt-2 rounded-[10px] overflow-hidden h-28 bg-muted">
                            <img src={form.coverImageUrl} alt="Preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Pricing ── */}
                <div className="py-2">
                  <SectionHeader title="Pricing" open={open.pricing} onToggle={() => toggle('pricing')} />
                  {open.pricing && (
                    <div className="grid grid-cols-2 gap-3 pb-3">
                      <Field label="Price (EGP) *">
                        <input type="number" required min="0" step="0.01" value={form.price} onChange={e => set({ price: e.target.value })} className={inputCls} />
                      </Field>
                      <Field label="Sale Price (EGP)" hint="Leave empty if no sale">
                        <input type="number" min="0" step="0.01" value={form.salePrice} onChange={e => set({ salePrice: e.target.value })} className={inputCls} />
                      </Field>
                    </div>
                  )}
                </div>

                {/* ── Subscription ── */}
                <div className="py-2">
                  <SectionHeader title="Subscription" open={open.subscription} onToggle={() => toggle('subscription')} />
                  {open.subscription && (
                    <div className="grid grid-cols-2 gap-3 pb-3">
                      <Field label="Duration *">
                        <select
                          value={form.duration}
                          onChange={e => set({ duration: e.target.value })}
                          className={inputCls}
                        >
                          {DURATION_OPTIONS.map(d => <option key={d}>{d}</option>)}
                          {!DURATION_OPTIONS.includes(form.duration) && (
                            <option value={form.duration}>{form.duration}</option>
                          )}
                        </select>
                      </Field>
                      <Field label="Delivery Time" hint="e.g. 5–30 minutes">
                        <input type="text" placeholder="5–30 minutes" value={form.deliveryTime} onChange={e => set({ deliveryTime: e.target.value })} className={inputCls} />
                      </Field>
                      <Field label="Activation Type">
                        <select value={form.activationType} onChange={e => set({ activationType: e.target.value })} className={inputCls}>
                          {ACTIVATION_OPTIONS.map(o => <option key={o} value={o}>{o || '— Select —'}</option>)}
                        </select>
                      </Field>
                      <Field label="Invitation Link">
                        <input type="url" placeholder="https://..." value={form.invitationLink} onChange={e => set({ invitationLink: e.target.value })} className={inputCls} />
                      </Field>
                      <div className="col-span-2">
                        <Field label="License Key">
                          <input type="text" value={form.licenseKey} onChange={e => set({ licenseKey: e.target.value })} className={inputCls} />
                        </Field>
                      </div>
                      <label className="flex items-center gap-2.5 cursor-pointer text-sm">
                        <input type="checkbox" checked={form.onCustomerAccount} onChange={e => set({ onCustomerAccount: e.target.checked })} className={checkboxCls} />
                        On Customer Account
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer text-sm">
                        <input type="checkbox" checked={form.sharedAccount} onChange={e => set({ sharedAccount: e.target.checked })} className={checkboxCls} />
                        Shared Account
                      </label>
                    </div>
                  )}
                </div>

                {/* ── Description ── */}
                <div className="py-2">
                  <SectionHeader title="Description" open={open.description} onToggle={() => toggle('description')} />
                  {open.description && (
                    <div className="flex flex-col gap-3 pb-3">
                      <Field label="Short Description">
                        <textarea rows={3} value={form.description} onChange={e => set({ description: e.target.value })} className={`${inputCls} resize-none`} />
                      </Field>
                      <Field label="Features" hint="One feature per line">
                        <textarea rows={5} placeholder={"Access to GPT-4o\nImage generation\nAdvanced reasoning"} value={form.featuresText} onChange={e => set({ featuresText: e.target.value })} className={`${inputCls} resize-none font-mono text-xs`} />
                      </Field>
                    </div>
                  )}
                </div>

                {/* ── Customer Information Required ── */}
                <div className="py-2">
                  <SectionHeader title="Customer Information Required" open={open.customer} onToggle={() => toggle('customer')} />
                  {open.customer && (
                    <div className="pb-3">
                      <p className="text-xs text-muted-foreground mb-3">Select what the customer must provide when ordering:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2.5 gap-x-4">
                        {CUSTOMER_INFO_OPTIONS.map(({ key, label }) => (
                          <label key={key} className="flex items-center gap-2.5 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={form.customerInfoRequired.includes(key)}
                              onChange={() => toggleInfo(key)}
                              className={checkboxCls}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── After Purchase Instructions ── */}
                <div className="py-2">
                  <SectionHeader title="After Purchase Instructions" open={open.afterpurchase} onToggle={() => toggle('afterpurchase')} />
                  {open.afterpurchase && (
                    <div className="pb-3">
                      <p className="text-xs text-muted-foreground mb-2">Instructions shown to the customer after payment.</p>
                      <textarea
                        rows={6}
                        placeholder={"1. Create a Google account.\n2. Send us your email.\n3. Wait 5 to 30 minutes for activation."}
                        value={form.afterPurchaseInstructions}
                        onChange={e => set({ afterPurchaseInstructions: e.target.value })}
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  )}
                </div>

              </form>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-black/[0.05] bg-background shrink-0">
              <button
                type="submit"
                form="product-form"
                disabled={isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-[14px] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
