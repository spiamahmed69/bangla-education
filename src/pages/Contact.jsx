import { Link } from 'react-router-dom'

const CONTACTS = [
  { label: 'ফোন', value: '01400661593', href: 'tel:01400661593', note: 'কল করুন', emoji: '📞' },
  { label: 'ইমেইল', value: 'banglaacademy111@gmail.com', href: 'mailto:banglaacademy111@gmail.com', note: 'ইমেইল পাঠান', emoji: '✉️' },
  { label: 'Telegram গ্রুপ', value: 't.me/banglaacademy111', href: 'https://t.me/banglaacademy111', note: 'গ্রুপে যোগ দিন', emoji: '✈️' },
]

export default function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <h1 className="text-3xl font-bold text-ink dark:text-slate-100">যোগাযোগ</h1>
      <p className="mt-2 text-muted dark:text-slate-400">
        কোর্স, পেমেন্ট বা ক্লাস নিয়ে যেকোনো প্রশ্ন থাকলে নিচের যেকোনো মাধ্যমে যোগাযোগ করুন।
        মেসেজ দিলে অ্যাডমিন দেখে উত্তর দেবেন।
      </p>

      <div className="mt-6 space-y-4">
        {CONTACTS.map(c => (
          <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
            className="flex items-center justify-between gap-3 rounded-[2rem] bg-white dark:bg-slate-800 p-6 shadow-[0_8px_30px_rgba(37,99,235,0.10)] transition hover:-translate-y-0.5">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-slate-700 text-2xl">{c.emoji}</span>
              <div>
                <p className="text-sm text-muted dark:text-slate-400">{c.label}</p>
                <p className="break-all font-bold text-ink dark:text-slate-100">{c.value}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white">{c.note}</span>
          </a>
        ))}
      </div>

      <div className="mt-6 rounded-[2rem] bg-white dark:bg-slate-800 p-6 shadow-[0_8px_30px_rgba(37,99,235,0.10)]">
        <h2 className="font-bold text-ink dark:text-slate-100">পেমেন্টের বিষয়ে</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">
          বিকাশ ও নগদ নম্বর (Send Money): <b className="text-ink dark:text-slate-100">01400661593</b>। টাকা পাঠিয়ে ট্রানজাকশন আইডি
          বা শেষ ৩ সংখ্যা কেনার পেজে জমা দিন — অ্যাডমিন যাচাই করে অ্যাপ্রুভ করলেই ক্লাস খুলে যাবে।
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted dark:text-slate-400">
          কেনার আগে সাধারণ প্রশ্নগুলোর উত্তর দেখে নিতে পারেন{' '}
          <Link to="/faq" className="font-bold text-primary">সাধারণ প্রশ্ন (FAQ)</Link> পেজে।
        </p>
      </div>
    </div>
  )
}
