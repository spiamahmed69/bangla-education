import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import CourseCard from '../components/CourseCard'
import { bn } from '../components/CourseCard'

export default function MyCourses() {
  const { user, authLoading, courses, orders, enrollments, completedLessonIds, progressPct, getQuiz } = useStore()
  const [quizMap, setQuizMap] = useState({})

  const myEnrollments = enrollments.filter(e => e.userId === user?.uid && e.status === 'active')
  const myCourses = courses.filter(c => myEnrollments.some(e => e.courseId === c.id))

  useEffect(() => {
    let alive = true
    myCourses.forEach(c => {
      getQuiz(c.id).then(q => {
        if (alive && q && (q.questions || []).length) setQuizMap(prev => ({ ...prev, [c.id]: true }))
      })
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myCourses.map(c => c.id).join(',')])

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <p className="text-muted">লোড হচ্ছে…</p>
      </div>
    )
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink">আমার কোর্স দেখতে লগইন করুন</h1>
        <Link to="/login" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">লগইন করুন</Link>
      </div>
    )
  }

  const myOrders = orders.filter(o => o.userId === user.uid).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <h1 className="text-3xl font-bold text-ink">আমার কোর্স</h1>
      <p className="mt-2 text-muted">হ্যালো, {user.name} — অ্যাডমিন অ্যাপ্রুভ করা কোর্সগুলোর ক্লাস এখান থেকে করতে পারবেন।</p>

      {myCourses.length === 0 ? (
        <div className="mt-8 rounded-[2rem] bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-bold text-ink">এখনো কোনো কোর্স খোলা হয়নি</p>
          <p className="mt-1 text-muted">কোর্স কিনে পেমেন্ট জমা দিন — অ্যাডমিন অ্যাপ্রুভ করলেই এখানে ক্লাস দেখা যাবে।</p>
          <Link to="/courses" className="mt-5 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">কোর্স দেখুন</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {myCourses.map(c => {
            const total = c.lessons?.length || 0
            const done = completedLessonIds(c.id).length
            const pct = progressPct(c.id, total)
            const complete = total > 0 && done === total
            return (
              <div key={c.id}>
                <CourseCard course={c} />
                <div className="mt-3 rounded-3xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-ink">অগ্রগতি — {done.toLocaleString('bn-BD')}/{total.toLocaleString('bn-BD')}টি ক্লাস ({pct.toLocaleString('bn-BD')}%)</p>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {complete && <Link to={`/certificate/${c.id}`} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white">🎓 সার্টিফিকেট ডাউনলোড</Link>}
                    {quizMap[c.id] && <Link to={`/quiz/${c.id}`} className="rounded-full bg-cta px-4 py-2 text-sm font-bold text-white">📝 কুইজ দিন</Link>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <h2 className="mt-12 text-xl font-bold text-ink">আমার পেমেন্টসমূহ</h2>
      {myOrders.length === 0 ? (
        <p className="mt-3 text-muted">এখনো কোনো পেমেন্ট জমা দেননি।</p>
      ) : (
        <div className="mt-4 space-y-3">
          {myOrders.map(o => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <div>
                <p className="font-bold text-ink">{o.courseTitle}</p>
                <p className="text-sm text-muted">{o.method === 'bkash' ? 'বিকাশ' : 'নগদ'} • ট্রানজাকশন: {o.txnId} • ৳{bn(o.price)}</p>
              </div>
              <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                o.status === 'approved' ? 'bg-emerald-100 text-emerald-800'
                : o.status === 'rejected' ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'}`}>
                {o.status === 'approved' ? 'অ্যাপ্রুভ হয়েছে' : o.status === 'rejected' ? 'বাতিল হয়েছে' : 'অপেক্ষমাণ'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
