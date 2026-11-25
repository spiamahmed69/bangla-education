import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import CourseCard from '../components/CourseCard'
import { useWishlist } from '../lib/wishlist'
import { CATEGORIES } from '../lib/sampleData'

const PRICE_FILTERS = [
  ['all', 'সব দাম'],
  ['free', 'ফ্রি (৳০)'],
  ['1-300', '৳১–৩০০'],
  ['301-500', '৳৩০১–৫০০'],
  ['500+', '৳৫০০+'],
]

const SORTS = [
  ['default', 'সাজান: ডিফল্ট'],
  ['price-asc', 'দাম: কম → বেশি'],
  ['price-desc', 'দাম: বেশি → কম'],
  ['name', 'নাম (অ-হ)'],
]

const inPriceRange = (price, range) => {
  const p = Number(price || 0)
  if (range === 'free') return p === 0
  if (range === '1-300') return p >= 1 && p <= 300
  if (range === '301-500') return p >= 301 && p <= 500
  if (range === '500+') return p > 500
  return true
}

export default function Courses() {
  const { courses, dataLoading } = useStore()
  const { wishlist } = useWishlist()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('default')
  const [priceFilter, setPriceFilter] = useState(params.get('price') || 'all')
  const [wishlistOnly, setWishlistOnly] = useState(false)
  const cat = params.get('cat') || 'all'

  const filtered = useMemo(() => {
    const list = courses.filter(c => {
      const okCat = cat === 'all' || c.category === cat
      const okQ = !q.trim() || c.title.toLowerCase().includes(q.trim().toLowerCase()) || c.teacher.includes(q.trim())
      const okPrice = inPriceRange(c.price, priceFilter)
      const okWish = !wishlistOnly || wishlist.includes(c.id)
      return okCat && okQ && okPrice && okWish
    })
    if (sort === 'price-asc') return [...list].sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    if (sort === 'price-desc') return [...list].sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    if (sort === 'name') return [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'bn'))
    return list
  }, [courses, cat, q, priceFilter, wishlistOnly, wishlist, sort])

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <h1 className="text-3xl font-bold text-ink">কোর্সসমূহ</h1>
      {dataLoading ? (
        <p className="mt-2 text-muted">লোড হচ্ছে…</p>
      ) : (
        <p className="mt-2 text-muted">{courses.length > 0 && courses.every(c => c.sample) ? 'সব কোর্স নমুনা হিসেবে দেখানো হচ্ছে। পছন্দের কোর্স খুঁজে কিনুন।' : 'পছন্দের কোর্স খুঁজে কিনুন।'}</p>
      )}

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

      {/* দামের ফিল্টার + সাজানো + উইশলিস্ট */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {PRICE_FILTERS.map(([v, label]) => (
          <button key={v} onClick={() => setPriceFilter(v)} className={`rounded-full px-4 py-2 text-sm font-bold ${priceFilter === v ? 'bg-primary text-white' : 'bg-white text-ink shadow-sm'}`}>{label}</button>
        ))}
        <select value={sort} onChange={e => setSort(e.target.value)} aria-label="সাজান"
          className="rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold text-ink shadow-sm focus:border-primary focus:outline-none">
          {SORTS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <button onClick={() => setWishlistOnly(v => !v)}
          className={`rounded-full px-4 py-2 text-sm font-bold ${wishlistOnly ? 'bg-rose-500 text-white' : 'bg-white text-ink shadow-sm'}`}>
          ❤️ উইশলিস্ট ({wishlist.length.toLocaleString('bn-BD')})
        </button>
      </div>

      {dataLoading ? (
        <p className="mt-8 text-muted">লোড হচ্ছে…</p>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-bold text-ink">কোনো কোর্স পাওয়া যায়নি</p>
          <p className="mt-1 text-muted">{wishlistOnly ? 'উইশলিস্টে এখনো কোনো কোর্স নেই — কোর্সের কার্ডের হার্টে ক্লিক করে রাখুন।' : 'অন্য শব্দ দিয়ে খুঁজে দেখুন বা ক্যাটাগরি/দামের ফিল্টার বদলান।'}</p>
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
