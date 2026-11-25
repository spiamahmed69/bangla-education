import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import CourseCard from '../components/CourseCard'
import { CATEGORIES } from '../lib/sampleData'

export default function Courses() {
  const { courses, dataLoading } = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const cat = params.get('cat') || 'all'

  const filtered = useMemo(() => {
    return courses.filter(c => {
      const okCat = cat === 'all' || c.category === cat
      const okQ = !q.trim() || c.title.toLowerCase().includes(q.trim().toLowerCase()) || c.teacher.includes(q.trim())
      return okCat && okQ
    })
  }, [courses, cat, q])

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <h1 className="text-3xl font-bold text-ink">কোর্সসমূহ</h1>
      <p className="mt-2 text-muted">{courses.length > 0 && courses.every(c => c.sample) ? 'সব কোর্স নমুনা হিসেবে দেখানো হচ্ছে। পছন্দের কোর্স খুঁজে কিনুন।' : 'পছন্দের কোর্স খুঁজে কিনুন।'}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="কোর্স বা শিক্ষকের নাম লিখুন…"
          className="flex-1 rounded-full border border-blue-100 bg-white px-5 py-3 shadow-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setParams({})} className={`rounded-full px-4 py-2 text-sm font-bold ${cat === 'all' ? 'bg-primary text-white' : 'bg-white text-ink shadow-sm'}`}>সব</button>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setParams({ cat: c.id })} className={`rounded-full px-4 py-2 text-sm font-bold ${cat === c.id ? 'bg-primary text-white' : 'bg-white text-ink shadow-sm'}`}>{c.name}</button>
        ))}
      </div>

      {dataLoading ? (
        <p className="mt-8 text-muted">লোড হচ্ছে…</p>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-bold text-ink">কোনো কোর্স পাওয়া যায়নি</p>
          <p className="mt-1 text-muted">অন্য শব্দ দিয়ে খুঁজে দেখুন বা ক্যাটাগরি বদলান।</p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm font-semibold text-muted">{filtered.length}টি কোর্স পাওয়া গেছে</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        </>
      )}
    </div>
  )
}
