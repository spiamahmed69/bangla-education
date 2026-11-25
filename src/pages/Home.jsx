import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import CourseCard from '../components/CourseCard'
import { CATEGORIES } from '../lib/sampleData'

export default function Home() {
  const { courses } = useStore()
  const featured = courses.slice(0, 6)
  // শিক্ষক তালিকা কোর্স থেকে বানানো — আসল শিক্ষকের পাশে নমুনা লেবেল থাকবে না
  const teachers = []
  courses.forEach(c => {
    const subject = (CATEGORIES.find(x => x.id === c.category) || {}).name || ''
    const color = (CATEGORIES.find(x => x.id === c.category) || {}).color || '#2563EB'
    const ex = teachers.find(t => t.name === c.teacher)
    if (ex) ex.sample = ex.sample && !!c.sample
    else teachers.push({ name: c.teacher, subject, color, sample: !!c.sample })
  })
  return (
    <div>
      {/* হিরো */}
      <section className="mx-auto max-w-6xl px-5 pt-10 sm:pt-16">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-primary via-cyanx to-violetx p-8 text-white shadow-xl sm:p-12">
          <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold">বাংলায় শেখা, সহজে শেখা</span>
          <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
            ঘরে বসে শিখুন — ভিডিও ক্লাস আর নোটের PDF এক জায়গায়
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/90 sm:text-lg">
            বাংলা, ইংরেজি, গণিত আর বিজ্ঞানের কোর্স। বিকাশ বা নগদে টাকা পাঠিয়ে কিনুন — অ্যাডমিন অ্যাপ্রুভ করলেই ক্লাস খুলে যাবে।
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/courses" className="rounded-full bg-white px-6 py-3 font-bold text-primary shadow hover:bg-blue-50">কোর্স দেখুন</Link>
            <Link to="/register" className="rounded-full bg-cta px-6 py-3 font-bold text-white hover:bg-cta-dark">ফ্রি অ্যাকাউন্ট খুলুন</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6 text-sm font-semibold text-white/90">
            <span>✓ ইউটিউব ভিডিও ক্লাস</span>
            <span>✓ প্রতিটি ক্লাসে PDF নোট</span>
            <span>✓ বিকাশ / নগদ পেমেন্ট</span>
          </div>
        </div>
      </section>

      {/* ক্যাটাগরি */}
      <section className="mx-auto max-w-6xl px-5 pt-12">
        <h2 className="text-2xl font-bold text-ink">ক্যাটাগরি</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CATEGORIES.map(c => (
            <Link key={c.id} to={`/courses?cat=${c.id}`} className="rounded-3xl bg-white p-5 text-center shadow-[0_8px_30px_rgba(37,99,235,0.08)] transition hover:-translate-y-1">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold text-white" style={{ background: c.color }}>{c.emoji}</span>
              <span className="mt-3 block font-bold text-ink">{c.name}</span>
              <span className="text-xs text-muted">{courses.filter(x => x.category === c.id).length}টি কোর্স</span>
            </Link>
          ))}
        </div>
      </section>

      {/* কোর্স */}
      <section className="mx-auto max-w-6xl px-5 pt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-ink">জনপ্রিয় কোর্স</h2>
          <Link to="/courses" className="font-bold text-primary">সব দেখুন →</Link>
        </div>
        {featured.length > 0 && featured.every(c => c.sample) && (
          <p className="mt-1 text-sm text-muted">নিচের সব কোর্স নমুনা — আসল কোর্স অ্যাডমিন প্যানেল থেকে যুক্ত করা হবে।</p>
        )}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(c => <CourseCard key={c.id} course={c} />)}
        </div>
      </section>

      {/* কেনার ধাপ */}
      <section className="mx-auto max-w-6xl px-5 pt-12">
        <div className="rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgba(37,99,235,0.08)]">
          <h2 className="text-2xl font-bold text-ink">কীভাবে কিনবেন?</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-4">
            {[
              ['১', 'অ্যাকাউন্ট খুলুন', 'ইমেইল যাচাই করে পাসওয়ার্ড দিয়ে লগইন করুন।'],
              ['২', 'কোর্স বেছে নিন', 'পছন্দের কোর্সের কেনার পেজে যান।'],
              ['৩', 'টাকা পাঠান', 'বিকাশ/নগদ নম্বরে টাকা পাঠিয়ে ট্রানজাকশন আইডি জমা দিন।'],
              ['৪', 'ক্লাস শুরু করুন', 'অ্যাডমিন অ্যাপ্রুভ করলেই ভিডিও ক্লাস খুলে যাবে।'],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-3xl bg-page p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">{n}</span>
                <h3 className="mt-3 font-bold text-ink">{t}</h3>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* শিক্ষক */}
      <section className="mx-auto max-w-6xl px-5 pt-12">
        <h2 className="text-2xl font-bold text-ink">আমাদের শিক্ষকবৃন্দ</h2>
        {teachers.length > 0 && teachers.every(t => t.sample) && (
          <p className="mt-1 text-sm text-muted">নমুনা শিক্ষক তালিকা — আসল শিক্ষকদের তথ্য অ্যাডমিন যুক্ত করবেন।</p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {teachers.map(t => (
            <div key={t.name} className="rounded-3xl bg-white p-6 text-center shadow-[0_8px_30px_rgba(37,99,235,0.08)]">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ background: t.color }}>
                {t.name.slice(0, 1)}
              </span>
              <h3 className="mt-3 font-bold text-ink">{t.name}</h3>
              <p className="text-sm text-muted">{t.subject}{t.sample ? ' • নমুনা' : ''}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
