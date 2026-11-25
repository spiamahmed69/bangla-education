import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { CoverArt } from '../components/Layout'
import { bn, hasFreeDemo } from '../components/CourseCard'
import SecurePlayer from '../components/SecurePlayer'

// তারার চিহ্ন: ৪ দিলে ★★★★☆
export const starsText = (n) => '★'.repeat(Math.max(0, Math.min(5, Math.round(n || 0)))) + '☆'.repeat(5 - Math.max(0, Math.min(5, Math.round(n || 0))))

export default function CourseDetail() {
  const { id } = useParams()
  const { getCourse, user, isEnrolled, pendingOrderFor, dataLoading, reviewsByCourse, averageRating, submitReview, deleteReview, completedLessonIds, progressPct, getQuiz } = useStore()
  const course = getCourse(id)
  const [quizExists, setQuizExists] = useState(false)

  // রিভিউ ফর্মের অবস্থা — হুকগুলো early return-এর আগে থাকতে হবে
  const [myRating, setMyRating] = useState(0)
  const [myText, setMyText] = useState('')
  const [reviewMsg, setReviewMsg] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const courseReviews = course ? reviewsByCourse(course.id) : []
  const avg = course ? averageRating(course.id) : null
  const myReview = user ? courseReviews.find(r => r.userId === user.uid) : null
  useEffect(() => {
    if (myReview) { setMyRating(myReview.rating || 0); setMyText(myReview.text || '') }
  }, [myReview?.id])
  const enrolledEarly = user ? isEnrolled(id) : false
  useEffect(() => {
    let alive = true
    if (!enrolledEarly) return
    getQuiz(id).then(q => { if (alive) setQuizExists(!!(q && (q.questions || []).length)) })
    return () => { alive = false }
  }, [enrolledEarly, id])

  if (dataLoading) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-16 text-center">
        <p className="text-muted">লোড হচ্ছে…</p>
      </div>
    )
  }
  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink">কোর্সটি পাওয়া যায়নি</h1>
        <Link to="/courses" className="mt-4 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">কোর্স তালিকায় ফিরুন</Link>
      </div>
    )
  }
  const enrolled = isEnrolled(course.id)
  const pending = pendingOrderFor(course.id)
  const firstLesson = course.lessons?.[0]
  // ফ্রি ডেমো ক্লাস — অ্যাডমিন ফ্রি চিহ্ন দেওয়া লেসন, লগইন/কেনা ছাড়াই দেখা যাবে
  const freeLesson = (course.lessons || []).find(l => l.isFree && l.demoYoutubeId)

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CoverArt title={course.title} gradient={course.gradient} imageUrl={course.imageUrl} className="h-56 w-full rounded-[2rem] sm:h-72" />
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-primary">{course.level}</span>
            {course.sample && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">নমুনা কোর্স</span>}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-ink">{course.title}</h1>
          <p className="mt-2 text-muted">{course.description}</p>
          <p className="mt-3 text-sm text-muted">শিক্ষক: {course.teacher}{course.sample ? ' (নমুনা)' : ''}</p>
          {avg !== null ? (
            <p className="mt-2 text-sm font-bold text-amber-700">★ {avg.toLocaleString('bn-BD')} • {courseReviews.length.toLocaleString('bn-BD')}টি রিভিউ</p>
          ) : (
            <p className="mt-2 text-sm text-muted">এখনো কোনো রিভিউ নেই</p>
          )}
          {hasFreeDemo(course) && <p className="mt-3 text-sm font-bold text-emerald-700">▶ এই কোর্সে ফ্রি ডেমো ক্লাস আছে — কিনে দেখতে পারেন কেমন শেখানো হয়।</p>}
          {enrolled && (() => {
            const total = course.lessons?.length || 0
            const done = completedLessonIds(course.id).length
            const pct = progressPct(course.id, total)
            const complete = total > 0 && done === total
            return (
              <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
                <p className="font-bold text-ink">আপনার অগ্রগতি — {done.toLocaleString('bn-BD')}/{total.toLocaleString('bn-BD')}টি ক্লাস ({pct.toLocaleString('bn-BD')}%)</p>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {complete && <Link to={`/certificate/${course.id}`} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white">🎓 সার্টিফিকেট ডাউনলোড</Link>}
                  {quizExists && <Link to={`/quiz/${course.id}`} className="rounded-full bg-cta px-4 py-2 text-sm font-bold text-white">📝 কুইজ দিন</Link>}
                </div>
                {complete && <p className="mt-3 text-sm font-bold text-emerald-700">অভিনন্দন! সব ক্লাস শেষ — সার্টিফিকেট ডাউনলোড করতে পারেন।</p>}
              </div>
            )
          })()}

          {!enrolled && freeLesson && (
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-ink">ফ্রি ডেমো ক্লাস</h2>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">ফ্রি — লগইন ছাড়াই দেখুন</span>
              </div>
              <p className="mt-1 text-sm text-muted">{freeLesson.title} • {freeLesson.duration}</p>
              <div className="mt-4 overflow-hidden rounded-[2rem] shadow-xl">
                <SecurePlayer videoId={freeLesson.demoYoutubeId} title={freeLesson.title} />
              </div>
              <p className="mt-3 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
                এই ক্লাসটি ফ্রি — বাকি {Math.max((course.lessons?.length || 1) - 1, 0)}টি ক্লাস কোর্স কিনে অ্যাডমিনের অ্যাপ্রুভ পেলেই খুলবে।
              </p>
            </div>
          )}

          <h2 className="mt-8 text-xl font-bold text-ink">ক্লাসের তালিকা ({course.lessons?.length || 0}টি)</h2>
          <div className="mt-4 space-y-3">
            {(course.lessons || []).map((lesson, i) => (
              <div key={lesson.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-primary">{i + 1}</span>
                  <div>
                    <p className="font-bold text-ink">{lesson.title}</p>
                    <p className="text-xs text-muted">{lesson.duration} • ভিডিও + PDF নোট</p>
                  </div>
                </div>
                {enrolled ? (
                  <Link to={`/learn/${course.id}/${lesson.id}`} className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white">দেখুন</Link>
                ) : lesson.isFree && lesson.demoYoutubeId ? (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800">▶ ফ্রি ডেমো</span>
                ) : (
                  <span className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-muted">🔒 লক</span>
                )}
              </div>
            ))}
          </div>
          {!enrolled && (
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              {freeLesson
                ? 'ফ্রি ডেমো ক্লাসটি ছাড়া বাকি ক্লাসের ভিডিও কেনার আগে দেখা যাবে না। কোর্স কিনে অ্যাডমিনের অ্যাপ্রুভ পেলেই ক্লাস খুলবে।'
                : 'ক্লাসের ভিডিও কেনার আগে দেখা যাবে না। কোর্স কিনে অ্যাডমিনের অ্যাপ্রুভ পেলেই ক্লাস খুলবে।'}
            </p>
          )}

          {/* রিভিউ ও রেটিং — লেখে শুধু কোর্স কেনা শিক্ষার্থী */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-ink">রিভিউ ({courseReviews.length.toLocaleString('bn-BD')}টি)</h2>
            {courseReviews.length === 0 ? (
              <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-muted shadow-sm">এখনো কোনো রিভিউ নেই — কোর্সটি কিনে আপনিই প্রথম রিভিউ দিন।</p>
            ) : (
              <div className="mt-4 space-y-3">
                {courseReviews.map(r => (
                  <div key={r.id} className="rounded-2xl bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-ink">{r.userName}</p>
                      <p className="text-sm text-muted">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('bn-BD') : ''}</p>
                    </div>
                    <p className="mt-1 text-amber-600">{starsText(r.rating)}</p>
                    {r.text && <p className="mt-2 text-sm text-ink">{r.text}</p>}
                    {user?.role === 'admin' && (
                      <button
                        onClick={async () => { if (confirm('এই রিভিউটি মুছে ফেলবেন?')) { await deleteReview(r.id); setReviewMsg('রিভিউ মুছে ফেলা হয়েছে।') } }}
                        className="mt-3 rounded-full bg-red-50 px-4 py-1.5 text-sm font-bold text-red-700"
                      >
                        মুছুন
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {enrolled ? (
              <form
                className="mt-5 space-y-4 rounded-3xl bg-white p-6 shadow-sm"
                onSubmit={async (e) => {
                  e.preventDefault()
                  setReviewError(''); setReviewMsg('')
                  if (myRating < 1) { setReviewError('১ থেকে ৫ তারার মধ্যে রেটিং দিন।'); return }
                  setReviewBusy(true)
                  try {
                    await submitReview(course.id, myRating, myText)
                    setReviewMsg(myReview ? 'আপনার রিভিউ আপডেট হয়েছে।' : 'আপনার রিভিউ জমা হয়েছে। ধন্যবাদ!')
                  } catch (err) {
                    setReviewError(err.message || 'রিভিউ জমা দেওয়া যায়নি। আবার চেষ্টা করুন।')
                  }
                  setReviewBusy(false)
                }}
              >
                <h3 className="font-bold text-ink">{myReview ? 'আপনার রিভিউ আপডেট করুন' : 'আপনার রিভিউ দিন'}</h3>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" aria-label={`${n} তারা`} onClick={() => setMyRating(n)}
                      className={`text-3xl ${n <= myRating ? 'text-amber-500' : 'text-slate-300'}`}>★</button>
                  ))}
                </div>
                <textarea rows="3" maxLength={500} value={myText} onChange={e => setMyText(e.target.value)}
                  placeholder="কোর্সটি কেমন লাগলো লিখুন…" className="w-full rounded-2xl border border-blue-100 bg-page px-4 py-3 focus:border-primary focus:outline-none" />
                <p className="text-right text-xs text-muted">{myText.length.toLocaleString('bn-BD')}/৫০০</p>
                {reviewError && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{reviewError}</p>}
                {reviewMsg && <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{reviewMsg}</p>}
                <button disabled={reviewBusy} className="rounded-full bg-primary px-6 py-2.5 font-bold text-white disabled:opacity-60">
                  {reviewBusy ? 'জমা হচ্ছে…' : myReview ? 'রিভিউ আপডেট করুন' : 'রিভিউ জমা দিন'}
                </button>
              </form>
            ) : (
              <p className="mt-5 rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-muted">
                {!user
                  ? 'রিভিউ দিতে লগইন করে কোর্সটি কিনুন। শুধু কোর্স কেনা শিক্ষার্থীরাই রিভিউ দিতে পারে।'
                  : 'শুধু এই কোর্স কেনা শিক্ষার্থীরাই রিভিউ দিতে পারে।'}
              </p>
            )}
          </div>
        </div>

        <aside>
          <div className="sticky top-24 rounded-[2rem] bg-white p-6 shadow-[0_8px_30px_rgba(37,99,235,0.10)]">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-ink">৳{bn(course.price)}</span>
              {course.oldPrice && <span className="text-muted line-through">৳{bn(course.oldPrice)}</span>}
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>✓ {course.lessons?.length || 0}টি ভিডিও ক্লাস (ইউটিউব)</li>
              <li>✓ প্রতিটি ক্লাসে PDF নোট</li>
              <li>✓ যেকোনো সময়, যেকোনো ডিভাইস থেকে</li>
              <li>✓ এক অ্যাকাউন্টে সর্বোচ্চ ২টি ডিভাইস</li>
            </ul>
            {enrolled ? (
              <Link to={`/learn/${course.id}/${firstLesson?.id || ''}`} className="mt-6 block rounded-full bg-emerald-600 py-3 text-center font-bold text-white">ক্লাস শুরু করুন</Link>
            ) : pending ? (
              <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-center text-sm font-bold text-amber-800">
                আপনার পেমেন্ট জমা হয়েছে — অ্যাডমিনের অ্যাপ্রুভের অপেক্ষায় আছে।
              </div>
            ) : (
              <Link to={user ? `/checkout/${course.id}` : '/login'} className="mt-6 block rounded-full bg-cta py-3 text-center font-bold text-white hover:bg-cta-dark">
                {user ? 'এখনই কিনুন' : 'কিনতে লগইন করুন'}
              </Link>
            )}
            {!user && <p className="mt-3 text-center text-xs text-muted">লগইন ছাড়া কেনা যাবে না।</p>}
          </div>
        </aside>
      </div>
    </div>
  )
}
