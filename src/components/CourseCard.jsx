import { Link } from 'react-router-dom'
import { CoverArt } from './Layout'
import { useStore } from '../lib/store'

export const bn = (n) => Number(n || 0).toLocaleString('bn-BD')

// ফ্রি ডেমো আছে কি না — শুধু অ্যাডমিন ফ্রি চিহ্ন দেওয়া লেসনেই demoYoutubeId থাকে
export const hasFreeDemo = (course) =>
  (course?.lessons || []).some(l => l.isFree && l.demoYoutubeId)

export default function CourseCard({ course }) {
  const { isEnrolled, pendingOrderFor, reviewsByCourse, averageRating } = useStore()
  const enrolled = isEnrolled(course.id)
  const pending = pendingOrderFor(course.id)
  const avg = averageRating(course.id)
  const reviewCount = reviewsByCourse(course.id).length
  return (
    <article className="fade-up overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(37,99,235,0.08)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(37,99,235,0.16)]">
      <Link to={`/courses/${course.id}`}>
        <CoverArt title={course.title} gradient={course.gradient} imageUrl={course.imageUrl} className="h-40 w-full" />
      </Link>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-primary">{course.level}</span>
          {course.sample && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">নমুনা কোর্স</span>}
          {hasFreeDemo(course) && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">▶ ফ্রি ডেমো আছে</span>}
        </div>
        <Link to={`/courses/${course.id}`}>
          <h3 className="mt-3 text-lg font-bold leading-snug text-ink hover:text-primary">{course.title}</h3>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{course.description}</p>
        <p className="mt-2 text-sm text-muted">শিক্ষক: {course.teacher} • {course.lessons?.length || 0}টি ক্লাস</p>
        {avg !== null && (
          <p className="mt-1 text-sm font-bold text-amber-700">★ {avg.toLocaleString('bn-BD')} • {reviewCount.toLocaleString('bn-BD')}টি রিভিউ</p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-ink">৳{bn(course.price)}</span>
            {course.oldPrice && <span className="ml-2 text-sm text-muted line-through">৳{bn(course.oldPrice)}</span>}
          </div>
          {enrolled ? (
            <Link to={`/learn/${course.id}/${course.lessons?.[0]?.id || ''}`} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white">ক্লাস করুন</Link>
          ) : pending ? (
            <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">অ্যাপ্রুভের অপেক্ষায়</span>
          ) : (
            <Link to={`/checkout/${course.id}`} className="rounded-full bg-cta px-4 py-2 text-sm font-bold text-white hover:bg-cta-dark">কিনুন</Link>
          )}
        </div>
      </div>
    </article>
  )
}
