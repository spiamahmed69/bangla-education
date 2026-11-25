import { Link } from 'react-router-dom'

export default function RefundPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <h1 className="text-3xl font-bold text-ink dark:text-slate-100">রিফান্ড নীতিমালা</h1>
      <p className="mt-2 text-muted dark:text-slate-400">পেমেন্ট আর রিফান্ড নিয়ে আমাদের নিয়ম — সরলভাবে লেখা।</p>

      <div className="mt-6 space-y-4">
        <div className="rounded-[2rem] bg-white dark:bg-slate-800 p-6 shadow-[0_8px_30px_rgba(37,99,235,0.10)] sm:p-8">
          <h2 className="font-bold text-ink dark:text-slate-100">পেমেন্ট কীভাবে যাচাই হয়</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">
            এই সাইট থেকে সরাসরি পেমেন্ট নেওয়া হয় না। শিক্ষার্থী বিকাশ বা নগদে (নম্বর 01400661593) টাকা পাঠিয়ে
            ট্রানজাকশন আইডি বা শেষ ৩ সংখ্যা জমা দেয়, আর অ্যাডমিন হাতে যাচাই করে অ্যাপ্রুভ করেন। তাই পেমেন্টের
            বিষয়ে সিদ্ধান্ত নেন অ্যাডমিন — কোনো স্বয়ংক্রিয় রিফান্ড ব্যবস্থা নেই।
          </p>
        </div>

        <div className="rounded-[2rem] bg-white dark:bg-slate-800 p-6 shadow-[0_8px_30px_rgba(37,99,235,0.10)] sm:p-8">
          <h2 className="font-bold text-ink dark:text-slate-100">ভুল করে টাকা পাঠালে</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">
            ভুল নম্বরে টাকা গেলে, ভুল অংক পাঠালে, বা ভুল কোর্সের জন্য পেমেন্ট জমা দিলে অ্যাডমিনের অ্যাপ্রুভের
            আগেই যোগাযোগ করুন — ফোন <a href="tel:01400661593" className="font-bold text-primary">01400661593</a>,
            ইমেইল <a href="mailto:banglaacademy111@gmail.com" className="font-bold text-primary">banglaacademy111@gmail.com</a>,
            অথবা <a href="https://t.me/banglaacademy111" target="_blank" rel="noreferrer" className="font-bold text-primary">Telegram গ্রুপ</a>।
            অ্যাপ্রুভের আগে জানালে বিষয়টি যাচাই করে সমাধানের চেষ্টা করা হবে।
          </p>
        </div>

        <div className="rounded-[2rem] bg-white dark:bg-slate-800 p-6 shadow-[0_8px_30px_rgba(37,99,235,0.10)] sm:p-8">
          <h2 className="font-bold text-ink dark:text-slate-100">অ্যাপ্রুভ হয়ে ক্লাস খুলে গেলে</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">
            একবার অ্যাপ্রুভ হয়ে ক্লাস খুলে গেলে সাধারণত রিফান্ড দেওয়া হয় না, কারণ তখন ক্লাসের ভিডিও আর
            নোটের PDF শিক্ষার্থীর কাছে পৌঁছে গেছে বলে ধরা হয়। বিশেষ কোনো সমস্যা থাকলে অ্যাডমিনের সঙ্গে
            যোগাযোগ করুন — প্রতিটি ক্ষেত্রে আলাদাভাবে সিদ্ধান্ত নেওয়া হবে।
          </p>
        </div>

        <div className="rounded-[2rem] bg-white dark:bg-slate-800 p-6 shadow-[0_8px_30px_rgba(37,99,235,0.10)] sm:p-8">
          <h2 className="font-bold text-ink dark:text-slate-100">যা এই নীতিমালায় নেই</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">
            এখানে কোনো নির্দিষ্ট দিনের মধ্যে টাকা ফেরতের গ্যারান্টি দেওয়া হয়নি। কোর্স কেনার আগে কোর্সের
            বিবরণ, দাম আর ফ্রি ডেমো ক্লাস (যেখানে আছে) দেখে নেওয়ার অনুরোধ রইল।
          </p>
        </div>
      </div>

      <p className="mt-6 rounded-3xl bg-white dark:bg-slate-800 p-6 text-sm leading-relaxed text-muted dark:text-slate-400 shadow-[0_8px_30px_rgba(37,99,235,0.08)]">
        প্রশ্ন থাকলে <Link to="/contact" className="font-bold text-primary">যোগাযোগ পেজ</Link> থেকে
        অ্যাডমিনের সঙ্গে কথা বলুন।
      </p>
    </div>
  )
}
