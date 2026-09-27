// Real Arabic + English + numeric QA content for the final T2 production board — verbatim
// from the Founder's brief, extended with the additional terms this phase specifically asked for.
export const content = {
  wordmark: 'شغّل',
  tagline1: 'مشروعك.',
  tagline2: 'لكن أسرع.',
  intro: 'ابدأ من فهم مشروعك، وبعدها شغّل الأدوات المناسبة له.',
  productTerms: ['Business Brain', 'Brand Brain', 'Visual Studio', 'History'],
  engines: ['سوّ محتوى', 'اكتب لي', 'ابنِ عرض', 'سوّ حملة', 'رد على عميل', 'اكتب Reel'],
  fields: ['معلومات المشروع', 'الجمهور المستهدف', 'نبرة العلامة التجارية'],
  actions: ['حفظ التعديلات', 'إنشاء المحتوى'],
  statusSuccess: 'تم إنشاء المحتوى بنجاح',
  statusError: 'حدث خطأ أثناء إنشاء المحتوى',
  emptyState: 'ما فيه نتائج محفوظة حتى الآن. جرّب أول أداة من الرئيسية.',
  helperText: 'اتركه فارغًا ونختار النص الأنسب لهدف مشروعك.',
  englishTermInArabic: 'استخدم Business Brain لحفظ بيانات مشروعك، ثم افتح Visual Studio لتصميم منشور Instagram باستخدام AI.',
  productNameThenArabicDesc: 'Visual Studio — يحوّل فكرتك النصية إلى تصميم جاهز للنشر خلال ثوانٍ.',
  longFormHeading: 'خطة المحتوى الأسبوعية',
  longFormParagraphs: [
    'ابدأ من فهم مشروعك، وبعدها شغّل الأدوات المناسبة له. جهّز بيانات مشروعك مرة واحدة في Business Brain، واحصل على محتوى، عروض، وردود جاهزة تلقائيًا.',
    'شغّل يفهم نبرة علامتك التجارية ويحافظ عليها في كل نص يكتبه لك، من منشور إنستغرام إلى رد واتساب على عميل غاضب. استخدم AI لتوليد أفكار جديدة كل أسبوع.',
  ],
  longFormBullets: ['يوم الأحد: منشور تعريفي بالمنتج الجديد', 'يوم الثلاثاء: عرض خاص بنسبة 15% لعملاء الواتساب', 'يوم الخميس: Reel قصير عن قصة العلامة'],
  longFormEmphasis: 'أهم نقطة هذا الأسبوع: **زيادة المبيعات بنسبة 24%** مقارنة بالأسبوع الماضي.',
  historyItems: [
    { title: 'سوّ محتوى', project: 'Brew 27', date: '27 سبتمبر 2026', excerpt: 'خطة محتوى أسبوعية مرتبطة بهدف رجوع العملاء...' },
    { title: 'رد على عميل', project: 'Brew 27', date: '25 سبتمبر 2026', excerpt: 'شكرًا لتواصلك، نعتذر عن التأخير في التوصيل...' },
  ],
};

export const numericQA = {
  price1: '12,500 SAR',
  price2: '45,000 SAR',
  percentA: '15%',
  percentB: '7.5%',
  year: '2026',
  dateShort: '01/09/2026',
  range: '10–15',
  deltaUp: '+24%',
  deltaDown: '−8%',
};

export const kpiCards = [
  { label: 'إجمالي المبيعات', value: '45,000 SAR', delta: '+24%', positive: true },
  { label: 'نسبة التحويل', value: '7.5%', delta: '+1.2%', positive: true },
  { label: 'طلبات معلّقة', value: '12', delta: '−8%', positive: false },
];
