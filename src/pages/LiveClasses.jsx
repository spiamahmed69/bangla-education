import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'

const PLATFORM_LABEL = { youtube: 'ইউটিউব লাইভ', zoom: 'Zoom', meet: 'Google Meet', other: 'অনলাইন লাইভ' }

function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString('bn-BD', { dateStyle: 'medium', timeStyle: 'short' })
  } catch { return iso || '' }
}

// লাইভ ক্লাসের সময়সূচি — কোনো ক্লাস সিড করা হয় না, অ্যাডমিন প্যানেল থেকে বানাতে হবে।
// জয়েন লিংক শুধু ওই কোর্স কেনা শিক্ষার্থী আর অ্যাডমিনকে দেখানো হয়।
export default function LiveClasses() {
  const { liveClasses, dataLoading, user, isEnrolled } = useStore()

  const sorted = [...liveClasses].sort((a, b) => {
    const rank = (x) => (x.status === 'live' ? 0 : x.status === 'scheduled' ? 1 : 2)
    const r = rank(a) - rank(b)
    if (r !== 0) return r
    return (a.startsAt || '').localeCompare(b.startsAt || '')
  })
  const liveNow = sorted.filter(x => x.status === 'live')
  const upcoming = sorted.filter(x => x.status === 'scheduled')
  const ended = sorted.filter(x => x.status === 'ended')

  const canJoin = (lc) => user?.role === 'admin' || isEnrolled(lc.courseId)

  const renderCard = (lc) => (
    <div key={lc.id} className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-sm dark:bg-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${lc.status === 'live' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:bg-red-900 dark:text-red-200' : lc.status === 'ended' ? 'bg-slate-100 dark:bg-slate-700 text-muted dark:bg-slate-700 dark:text-slate-300' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'}`}>
          {lc.status === 'live' ? '🔴 এখন লাইভ চলছে' : lc.status === 'ended' ? 'শেষ হয়েছে' : 'আসছে'}
        </span>
        <span className="rounded-full bg-blue-50 dark:bg-slate-700 px-3 py-1 text-xs font-bold text-primary dark:bg-slate-700 dark:text-blue-300">{PLATFORM_LABEL[lc.platform] || 'অনলাইন লাইভ'}</span>
      </div>
      <h2 className="mt-3 text-xl font-bold text-ink dark:text-slate-100">{lc.title}</h2>
      <p className="mt-1 text-sm text-muted dark:text-slate-400">{lc.courseTitle} • {formatWhen(lc.startsAt)}</p>
      <div className="mt-4">
        {canJoin(lc) ? (
          lc.status === 'ended' ? (
            <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-700 px-5 py-2.5 font-bold text-muted dark:bg-slate-700 dark:text-slate-300">ক্লাসটি শেষ হয়েছে</span>
          ) : (
            <a href={lc.joinUrl} target="_blank" rel="noreferrer" className="inline-block rounded-full bg-red-600 px-6 py-2.5 font-bold text-white hover:bg-red-700">▶ লাইভে জয়েন করুন</a>
          )
        ) : (
          <div>
            <p className="text-sm font-semibold text-muted dark:text-slate-400">জয়েন লিংক শুধু এই কোর্স কেনা শিক্ষার্থীদের জন্য।</p>
            <Link to={`/courses/${lc.courseId}`} className="mt-3 inline-block rounded-full bg-cta px-5 py-2.5 font-bold text-white hover:bg-cta-dark">কোর্সটি দেখুন</Link>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <h1 className="text-3xl font-bold text-ink dark:text-slate-100">লাইভ ক্লাস</h1>
      <p className="mt-2 text-muted dark:text-slate-400">সরাসরি ক্লাসের সময়সূচি এখানে থাকবে। জয়েন করতে হলে ওই কোর্সটি কিনতে হবে।</p>
      {dataLoading ? (
        <p className="mt-8 text-muted dark:text-slate-400">লোড হচ্ছে…</p>
      ) : sorted.length === 0 ? (
        <div className="mt-8 rounded-[2rem] bg-white dark:bg-slate-800 p-10 text-center shadow-sm dark:bg-slate-800">
          <p className="text-lg font-bold text-ink dark:text-slate-100">এখনো কোনো লাইভ ক্লাসের সময়সূচি নেই</p>
          <p className="mt-1 text-muted dark:text-slate-400">অ্যাডমিন সময়সূচি দিলেই এখানে দেখা যাবে। কোর্সের ভিডিও ক্লাসগুলো “আমার কোর্স” থেকে করা যাবে।</p>
          <Link to="/courses" className="mt-5 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">কোর্স দেখুন</Link>
        </div>
      ) : (
        <>
          {liveNow.length > 0 && (
            <>
              <h2 className="mt-8 text-xl font-bold text-ink dark:text-slate-100">🔴 এখন লাইভ</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">{liveNow.map(renderCard)}</div>
            </>
          )}
          {upcoming.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-bold text-ink dark:text-slate-100">আসন্ন লাইভ ক্লাস</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">{upcoming.map(renderCard)}</div>
            </>
          )}
          {ended.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-bold text-ink dark:text-slate-100">শেষ হওয়া ক্লাস</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">{ended.map(renderCard)}</div>
            </>
          )}
        </>
      )}
    </div>
  )
}
