export type Lang = 'ar' | 'en';

export const translations = {
  ar: {
    // Layout / Header
    tagline: 'مفتاحك للمميزات',
    cartAriaLabel: 'السلة',
    adminLogin: 'لوحة الإدارة',
    allRightsReserved: 'جميع الحقوق محفوظة',
    toggleLang: 'EN',

    // Hero
    heroTitle: 'اشتراكات رقمية مميزة،\nتُسلَّم فوراً.',
    heroSubtitle: 'وصول رسمي لأفضل أدوات الذكاء الاصطناعي والبرامج الإبداعية. سريع، آمن، وصُمِّم للمحترفين في العالم العربي.',

    // Trust Badges
    officialAccess: 'وصول رسمي',
    instantActivation: 'تفعيل فوري',
    verifiedPartners: 'شركاء موثقون',
    support247: 'دعم ٢٤/٧',
    securePayment: 'دفع آمن',

    // Search
    searchPlaceholder: 'ابحث عن ChatGPT، Midjourney، Notion...',
    noProductsTitle: 'لا توجد منتجات',
    noProductsBody: 'لم نجد أي نتائج مطابقة لـ',

    // Product Card
    price: 'السعر',
    addToCart: 'أضف إلى السلة',

    // Cart
    yourCart: 'سلتك',
    cartEmpty: 'سلتك فارغة',
    cartEmptySub: 'يبدو أنك لم تضف أي شيء بعد.',
    total: 'الإجمالي',
    proceedToOrder: 'المتابعة للطلب',

    // Checkout
    completeOrder: 'إتمام الطلب',
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'محمد أحمد',
    whatsappNumber: 'رقم الواتساب',
    whatsappPlaceholder: '+201...',
    items: 'المنتجات',
    sendViaWhatsApp: 'إرسال الطلب عبر واتساب',
    whatsappNote: 'سيتم تحويلك إلى واتساب لتأكيد الطلب وإتمام الدفع.',

    // WhatsApp message
    waOrderFrom: 'طلب جديد من كيتوبيا',
    waName: 'الاسم',
    waWhatsApp: 'واتساب',
    waOrder: 'الطلب',
    waTotal: 'الإجمالي',

    // Admin
    adminAccess: 'لوحة الإدارة',
    adminAccessSub: 'أدخل الرمز السري للوصول إلى إدارة المنتجات.',
    enterPin: 'أدخل الرمز السري',
    unlock: 'فتح',
    verifying: 'جارٍ التحقق...',
    products: 'المنتجات',
    manageProducts: 'إدارة منتجاتك وأسعارها.',
    addProduct: 'إضافة منتج',
    searchProducts: 'البحث في المنتجات...',
    product: 'المنتج',
    duration: 'المدة',
    actions: 'الإجراءات',
    loading: 'جارٍ التحميل...',
    noProductsAdmin: 'لا توجد منتجات.',
    lockSession: 'تسجيل الخروج',
    logOut: 'تسجيل الخروج',
    noDescription: 'لا يوجد وصف',
  },
  en: {
    // Layout / Header
    tagline: 'Your Key to Premium',
    cartAriaLabel: 'Cart',
    adminLogin: 'Admin Login',
    allRightsReserved: 'All rights reserved.',
    toggleLang: 'عربي',

    // Hero
    heroTitle: 'Premium Digital Subscriptions,\nDelivered Instantly.',
    heroSubtitle: "Official access to the world's best AI tools and creative software. Fast, secure, and built for professionals in the Arab world.",

    // Trust Badges
    officialAccess: 'Official Access',
    instantActivation: 'Instant Activation',
    verifiedPartners: 'Verified Partners',
    support247: '24/7 Support',
    securePayment: 'Secure Payment',

    // Search
    searchPlaceholder: 'Search for ChatGPT, Midjourney, Notion...',
    noProductsTitle: 'No products found',
    noProductsBody: "We couldn't find anything matching",

    // Product Card
    price: 'Price',
    addToCart: 'Add to Cart',

    // Cart
    yourCart: 'Your Cart',
    cartEmpty: 'Your cart is empty',
    cartEmptySub: "Looks like you haven't added anything yet.",
    total: 'Total',
    proceedToOrder: 'Proceed to Order',

    // Checkout
    completeOrder: 'Complete Order',
    fullName: 'Full Name',
    fullNamePlaceholder: 'John Doe',
    whatsappNumber: 'WhatsApp Number',
    whatsappPlaceholder: '+2010...',
    items: 'Items',
    sendViaWhatsApp: 'Send Order via WhatsApp',
    whatsappNote: 'You will be redirected to WhatsApp to confirm and finalize your payment.',

    // WhatsApp message
    waOrderFrom: 'New Order from Keytopia',
    waName: 'Name',
    waWhatsApp: 'WhatsApp',
    waOrder: 'Order',
    waTotal: 'Total',

    // Admin
    adminAccess: 'Admin Access',
    adminAccessSub: 'Enter your PIN to manage the catalog.',
    enterPin: 'Enter PIN',
    unlock: 'Unlock',
    verifying: 'Verifying...',
    products: 'Products',
    manageProducts: 'Manage your digital catalog and pricing.',
    addProduct: 'Add Product',
    searchProducts: 'Search products...',
    product: 'Product',
    duration: 'Duration',
    actions: 'Actions',
    loading: 'Loading products...',
    noProductsAdmin: 'No products found.',
    lockSession: 'Lock Session',
    logOut: 'Log Out',
    noDescription: 'No description',
  },
} satisfies Record<Lang, Record<string, string>>;

export type TranslationKey = keyof typeof translations.en;
