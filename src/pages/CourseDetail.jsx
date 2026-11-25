import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { CoverArt } from '../components/Layout'
import { bn } from '../components/CourseCard'

export default function CourseDetail() {
  const { id } = useParams()
  const { getCourse, user, isEnrolled, pendingOrderFor } = useStore()
  const course = getCourse(id)

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
                ) : (
                  <span className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-muted">🔒 লক</span>
                )}
              </div>
            ))}
          </div>
          {!enrolled && (
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              ক্লাসের ভিডিও কেনার আগে দেখা যাবে না। কোর্স কিনে অ্যাডমিনের অ্যাপ্রুভ পেলেই ক্লাস খুলবে।
            </p>
          )}
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
