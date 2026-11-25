export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <h1 className="text-3xl font-bold text-ink dark:text-slate-100">আমাদের সম্পর্কে</h1>
      <div className="mt-6 rounded-[2rem] bg-white dark:bg-slate-800 p-8 shadow-[0_8px_30px_rgba(37,99,235,0.10)]">
        <p className="leading-relaxed text-muted dark:text-slate-400">
          বাংলা এডুকেশন একটি বাংলা-প্রথম অনলাইন শেখার প্ল্যাটফর্ম। আমাদের বিশ্বাস — ভালো শিক্ষা পাওয়া উচিত সবার, নিজের ভাষায়, নিজের গতিতে, সাশ্রয়ী মূল্যে।
          তাই প্রতিটি কোর্স সাজানো হয়েছে সহজ বাংলায়: ধাপে ধাপে ভিডিও ক্লাস, সাথে নোটের PDF, যাতে পড়ার সময় যেকোনো জায়গা থেকে যেকোনো সময় রিভিশন দেওয়া যায়।
        </p>
        <p className="mt-4 leading-relaxed text-muted dark:text-slate-400">
          এখানে কোনো জটিল নিয়ম নেই — পছন্দের কোর্স বেছে নাও, বিকাশ বা নগদে পেমেন্ট করো, অ্যাডমিন যাচাই করে দিলেই ক্লাস খুলে যাবে।
          পরীক্ষার প্রস্তুতি হোক কিংবা নতুন কিছু শেখা — বাংলা এডুকেশন আছে তোমার পাশে, প্রতিটি ধাপে।
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-page dark:bg-slate-900 p-5 text-center">
            <div className="text-2xl">📖</div>
            <h3 className="mt-2 font-bold text-ink dark:text-slate-100">সহজ ভাষায় শেখা</h3>
            <p className="mt-1 text-sm text-muted dark:text-slate-400">কঠিন বিষয়ও বাংলায়, সহজ করে</p>
          </div>
          <div className="rounded-3xl bg-page dark:bg-slate-900 p-5 text-center">
            <div className="text-2xl">💰</div>
            <h3 className="mt-2 font-bold text-ink dark:text-slate-100">সাশ্রয়ী মূল্য</h3>
            <p className="mt-1 text-sm text-muted dark:text-slate-400">সবার নাগালে কোর্সের ফি</p>
          </div>
          <div className="rounded-3xl bg-page dark:bg-slate-900 p-5 text-center">
            <div className="text-2xl">⏰</div>
            <h3 className="mt-2 font-bold text-ink dark:text-slate-100">নিজের গতিতে পড়া</h3>
            <p className="mt-1 text-sm text-muted dark:text-slate-400">যেকোনো সময়, যেকোনো জায়গা থেকে</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-muted dark:text-slate-400">
          যোগাযোগ: ফোন <a href="tel:01400661593" className="font-bold text-primary">01400661593</a> •
          ইমেইল <a href="mailto:banglaacademy111@gmail.com" className="font-bold text-primary">banglaacademy111@gmail.com</a> •
          Telegram <a href="https://t.me/banglaacademy111" target="_blank" rel="noreferrer" className="font-bold text-primary">t.me/banglaacademy111</a>
        </p>
      </div>
    </div>
  )
}
