import { useUser, SignIn } from '@clerk/react';
import { useListMyOrders, getListMyOrdersQueryKey } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Package, ArrowRight, ArrowLeft, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { useLang } from '../contexts/LanguageContext';
import Layout from '../components/Layout';

const StatusBadge = ({ status, dir }: { status: string; dir: 'rtl' | 'ltr' }) => {
  const statusMap: Record<string, { bg: string; text: string; icon: any; labelAr: string; labelEn: string }> = {
    awaiting_payment: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock, labelAr: 'بانتظار الدفع', labelEn: 'Awaiting Payment' },
    payment_proof_received: { bg: 'bg-blue-50', text: 'text-blue-700', icon: FileText, labelAr: 'تم استلام الإيصال', labelEn: 'Proof Received' },
    confirmed: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: CheckCircle2, labelAr: 'مؤكد', labelEn: 'Confirmed' },
    fulfilled: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2, labelAr: 'مكتمل', labelEn: 'Fulfilled' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle, labelAr: 'ملغي', labelEn: 'Cancelled' },
  };

  const config = statusMap[status] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: Clock, labelAr: status, labelEn: status };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      <Icon className="w-3.5 h-3.5" />
      {dir === 'rtl' ? config.labelAr : config.labelEn}
    </span>
  );
};

export default function Orders() {
  const { isSignedIn, isLoaded } = useUser();
  const { dir } = useLang();
  
  const { data: orders, isLoading } = useListMyOrders({
    query: {
      enabled: !!isSignedIn,
      queryKey: getListMyOrdersQueryKey()
    }
  });

  if (!isLoaded) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!isSignedIn) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center border border-black/[0.03]">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-3">
              {dir === 'rtl' ? 'تتبع طلباتك' : 'Track Your Orders'}
            </h1>
            <p className="text-muted-foreground mb-8">
              {dir === 'rtl' 
                ? 'سجل الدخول لمشاهدة تفاصيل طلباتك السابقة، تتبع حالة التفعيل، والتواصل مع الدعم.' 
                : 'Sign in to view your past orders, track activation status, and contact support.'}
            </p>
            <div className="flex justify-center">
              <SignIn routing="hash" forceRedirectUrl="/orders" signUpForceRedirectUrl="/orders" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">
              {dir === 'rtl' ? 'طلباتي' : 'My Orders'}
            </h1>
            <p className="text-muted-foreground">
              {dir === 'rtl' ? 'تتبع وإدارة طلباتك السابقة.' : 'Track and manage your past orders.'}
            </p>
          </div>
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {dir === 'rtl' ? 'العودة للمتجر' : 'Back to Store'}
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[20px] h-32 animate-pulse border border-black/[0.03]" />
            ))}
          </div>
        ) : orders?.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-black/[0.03] p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-display font-bold text-foreground mb-2">
              {dir === 'rtl' ? 'لا توجد طلبات' : 'No orders yet'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {dir === 'rtl' ? 'لم تقم بإجراء أي طلبات حتى الآن.' : 'You haven\'t placed any orders yet.'}
            </p>
            <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-all">
              {dir === 'rtl' ? 'تصفح الاشتراكات' : 'Browse Subscriptions'}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders?.map((order) => (
              <div key={order.id} className="bg-white rounded-[24px] border border-black/[0.03] shadow-sm overflow-hidden">
                <div className="p-6 border-b border-black/[0.03] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-display font-bold text-lg text-foreground">
                        {order.orderNumber}
                      </span>
                      <StatusBadge status={order.status} dir={dir} />
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {format(new Date(order.createdAt), 'MMM d, yyyy • h:mm a')}
                    </div>
                  </div>
                  <div className="text-start md:text-end">
                    <div className="text-sm text-muted-foreground mb-1">
                      {dir === 'rtl' ? 'الإجمالي' : 'Total'}
                    </div>
                    <div className="font-display font-bold text-xl text-foreground">
                      {order.currency} {order.total}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                          {item.coverImageUrl ? (
                            <img src={item.coverImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
                              <span className="text-white/50 font-bold">{item.productName.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{item.productName}</h4>
                          <p className="text-sm text-muted-foreground">{item.duration}</p>
                        </div>
                        <div className="text-end">
                          <div className="font-medium text-foreground">
                            {order.currency} {item.lineTotal}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {dir === 'rtl' ? 'الكمية:' : 'Qty:'} {item.quantity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-muted/20 border-t border-black/[0.03] flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {order.status === 'awaiting_payment' ? (
                      dir === 'rtl' 
                        ? 'الرجاء إرسال إيصال الدفع عبر واتساب ليتم تفعيل طلبك.'
                        : 'Please send your payment proof via WhatsApp to activate your order.'
                    ) : order.status === 'payment_proof_received' ? (
                      dir === 'rtl'
                        ? 'تم استلام الإيصال، جارٍ التحقق وتفعيل الطلب.'
                        : 'Proof received, we are verifying and activating your order.'
                    ) : (
                      dir === 'rtl' 
                        ? 'تواصل معنا عبر واتساب لأي استفسار.'
                        : 'Contact us on WhatsApp for any inquiries.'
                    )}
                  </div>
                  <a 
                    href="https://wa.me/201229327902" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {dir === 'rtl' ? 'دعم واتساب' : 'WhatsApp Support'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}