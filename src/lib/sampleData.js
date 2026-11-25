// নমুনা কনটেন্ট — সব কোর্স/শিক্ষক/লেসনে "নমুনা" লেবেল আছে।
// আসল কোর্স, শিক্ষক বা ভিডিও লিংক অ্যাডমিন প্যানেল থেকে যুক্ত করতে হবে।
// ভিডিও লিংক ও PDF লিংক — দুটোই শুধু লিংক হিসেবে বসে; কোনো ফাইল আপলোড হয় না।

export const CATEGORIES = [
  { id: 'bangla', name: 'বাংলা', color: '#2563EB', emoji: 'অ' },
  { id: 'english', name: 'ইংরেজি', color: '#06B6D4', emoji: 'A' },
  { id: 'math', name: 'গণিত', color: '#8B5CF6', emoji: '∑' },
  { id: 'science', name: 'বিজ্ঞান', color: '#059669', emoji: '⚗' },
  { id: 'ict', name: 'আইসিটি', color: '#FD9A2A', emoji: '</>' },
]

export const SAMPLE_COURSES = [
  {
    id: 'bangla-hsc',
    title: 'বাংলা ভাষা ও সাহিত্য',
    category: 'bangla',
    level: 'এইচএসসি',
    price: 499,
    oldPrice: 999,
    teacher: 'নমুনা শিক্ষক ১',
    rating: null,
    students: 0,
    description: 'বাংলা প্রথম পত্রের গুরুত্বপূর্ণ গদ্য ও পদ্য — গল্পের ভেতরের ভাব, ভাষা ও পরীক্ষার প্রশ্নের ধরন ধাপে ধাপে।',
    gradient: 'linear-gradient(135deg,#2563EB,#06B6D4)',
    lessons: [
      { id: 'l1', title: 'বহিপীর', duration: '৩২ মিনিট', youtubeId: '', pdfUrl: '' },
      { id: 'l2', title: 'অনুপ্রভা', duration: '২৮ মিনিট', youtubeId: '', pdfUrl: '' },
      { id: 'l3', title: 'আহ্বান', duration: '৩৫ মিনিট', youtubeId: '', pdfUrl: '' },
      { id: 'l4', title: 'আমার পথ', duration: '৩০ মিনিট', youtubeId: '', pdfUrl: '' },
    ],
  },
  {
    id: 'english-grammar',
    title: 'ইংরেজি গ্রামার — সহজে শিখি',
    category: 'english',
    level: 'এসএসসি',
    price: 399,
    oldPrice: 799,
    teacher: 'নমুনা শিক্ষক ২',
    rating: null,
    students: 0,
    description: 'Tense, Voice, Narration আর Right Form of Verb — উদাহরণ আর অনুশীলনীসহ সহজ বাংলায়।',
    gradient: 'linear-gradient(135deg,#06B6D4,#2563EB)',
    lessons: [
      { id: 'l1', title: 'Tense — পরিচিতি', duration: '২৫ মিনিট', youtubeId: '', pdfUrl: '' },
      { id: 'l2', title: 'Right Form of Verb', duration: '৩০ মিনিট', youtubeId: '', pdfUrl: '' },
      { id: 'l3', title: 'Narration', duration: '৩৩ মিনিট', youtubeId: '', pdfUrl: '' },
    ],
  },
  {
    id: 'math-ssc',
    title: 'গণিত — বীজগণিত ও জ্যামিতি',
    category: 'math',
    level: 'এসএসসি',
    price: 449,
    oldPrice: 899,
    teacher: 'নমুনা শিক্ষক ৩',
    rating: null,
    students: 0,
    description: 'সৃজনশীল প্রশ্নের ধরন ধরে ধাপে ধাপে সমাধান — বীজগণিত, ত্রিকোণমিতি ও জ্যামিতি।',
    gradient: 'linear-gradient(135deg,#8B5CF6,#2563EB)',
    lessons: [
      { id: 'l1', title: 'সেট ও ফাংশন', duration: '২৭ মিনিট', youtubeId: '', pdfUrl: '' },
      { id: 'l2', title: 'বীজগাণিতিক রাশি', duration: '৩১ মিনিট', youtubeId: '', pdfUrl: '' },
      { id: 'l3', title: 'ত্রিকোণমিতি', duration: '৩৪ মিনিট', youtubeId: '', pdfUrl: '' },
    ],
  },
  {
    id: 'physics-hsc',
    title: 'পদার্থবিজ্ঞান — প্রথম পত্র',
    category: 'science',
    level: 'এইচএসসি',
    price: 599,
    oldPrice: 1199,
    teacher: 'নমুনা শিক্ষক ৪',
    rating: null,
    students: 0,
    description: 'ভেক্টর, গতিবিদ্যা আর নিউটনীয় বলবিদ্যা — চিত্র আর বাস্তব উদাহরণসহ।',
    gradient: 'linear-gradient(135deg,#059669,#06B6D4)',
    lessons: [
      { id: 'l1', title: 'ভৌত জগত ও পরিমাপ', duration: '২৬ মিনিট', youtubeId: '', pdfUrl: '' },
      { id: 'l2', title: 'ভেক্টর', duration: '৩৮ মিনিট', youtubeId: '', pdfUrl: '' },
      { id: 'l3', title: 'গতিবিদ্যা', duration: '৩৬ মিনিট', youtubeId: '', pdfUrl: '' },
    ],
  },
  {
    id: 'ict-hsc',
    title: 'তথ্য ও যোগাযোগ প্রযুক্তি',
    category: 'ict',
    level: 'এইচএসসি',
    price: 349,
    oldPrice: 699,
    teacher: 'নমুনা শিক্ষক ৫',
    rating: null,
    students: 0,
    description: 'তথ্য ও যোগাযোগ প্রযুক্তি এবং আমাদের বাংলাদেশ — বোর্ড প্রশ্নের আলোকে পুরো সিলেবাস।',
    gradient: 'linear-gradient(135deg,#FD9A2A,#8B5CF6)',
    lessons: [
      { id: 'l1', title: 'তথ্য ও যোগাযোগ প্রযুক্তি এবং আমাদের বাংলাদেশ', duration: '২৪ মিনিট', youtubeId: '', pdfUrl: '' },
      { id: 'l2', title: 'কমিউনিকেশন সিস্টেম', duration: '২৯ মিনিট', youtubeId: '', pdfUrl: '' },
    ],
  },
  {
    id: 'chemistry-hsc',
    title: 'রসায়ন — প্রথম পত্র',
    category: 'science',
    level: 'এইচএসসি',
    price: 549,
    oldPrice: 1099,
    teacher: 'নমুনা শিক্ষক ৬',
    rating: null,
    students: 0,
    description: 'ল্যাবরেটরির নিরাপদ ব্যবহার থেকে মৌলের পর্যায়বৃত্ত ধর্ম — সহজ ব্যাখ্যায়।',
    gradient: 'linear-gradient(135deg,#2563EB,#8B5CF6)',
    lessons: [
      { id: 'l1', title: 'ল্যাবরেটরির নিরাপদ ব্যবহার', duration: '২২ মিনিট', youtubeId: '', pdfUrl: '' },
      { id: 'l2', title: 'গুণগত রসায়ন', duration: '৩২ মিনিট', youtubeId: '', pdfUrl: '' },
    ],
  },
]

export const SAMPLE_TEACHERS = [
  { name: 'নমুনা শিক্ষক ১', subject: 'বাংলা', color: '#2563EB' },
  { name: 'নমুনা শিক্ষক ২', subject: 'ইংরেজি', color: '#06B6D4' },
  { name: 'নমুনা শিক্ষক ৩', subject: 'গণিত', color: '#8B5CF6' },
  { name: 'নমুনা শিক্ষক ৪', subject: 'পদার্থবিজ্ঞান', color: '#059669' },
]

export const DEFAULT_SETTINGS = {
  bkashNumber: '',
  nagadNumber: '',
  siteNotice: 'পেমেন্ট করার আগে অ্যাডমিনের দেওয়া নম্বরটি ভালো করে মিলিয়ে নিন।',
}
