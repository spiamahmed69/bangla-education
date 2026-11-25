import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'

// সার্টিফিকেট — শুধু কোর্স ১০০% শেষ করা শিক্ষার্থীর (বা অ্যাডমিনের) জন্য।
// এতে কোনো স্বীকৃতি/রেজিস্ট্রেশন নম্বর/যাচাই ব্যবস্থা নেই — নাম, কোর্স, শিক্ষক আর তারিখই আছে।
export default function Certificate() {
  const { courseId } = useParams()
  const { getCourse, user, isEnrolled, authLoading, dataLoading, completedLessonIds, progressPct, progressUpdatedAt } = useStore()

  if (authLoading || dataLoading) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <p className="text-muted">লোড হচ্ছে…</p>
      </div>
    )
  }
  const course = getCourse(courseId)
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink">সার্টিফিকেট দেখতে লগইন করুন</h1>
        <Link to="/login" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">লগইন করুন</Link>
      </div>
    )
  }
  if (!course) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink">কোর্সটি পাওয়া যায়নি</h1>
        <Link to="/courses" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">কোর্স তালিকায় ফিরুন</Link>
      </div>
    )
  }
  const enrolled = isEnrolled(courseId)
  const total = course.lessons?.length || 0
  const done = completedLessonIds(courseId).length
  const pct = progressPct(courseId, total)
  const isComplete = total > 0 && done === total
  if (!enrolled || (!isComplete && user.role !== 'admin')) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink">সার্টিফিকেট এখনো পাওয়া যাবে না</h1>
        <p className="mt-2 text-muted">
          {!enrolled
            ? 'এই কোর্সটি কিনে সব ক্লাস শেষ করলেই সার্টিফিকেট পাবেন।'
            : `আপনি ${done.toLocaleString('bn-BD')}/${total.toLocaleString('bn-BD')}টি ক্লাস শেষ করেছেন (${pct.toLocaleString('bn-BD')}%) — সব ক্লাস শেষ হলে সার্টিফিকেট পাবেন।`}
        </p>
        <Link to={enrolled ? `/learn/${course.id}/${course.lessons?.[0]?.id || ''}` : `/courses/${course.id}`} className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">
          {enrolled ? 'ক্লাসে ফিরুন' : 'কোর্সটি দেখুন'}
        </Link>
      </div>
    )
  }
  const doneDate = progressUpdatedAt(courseId) || new Date().toISOString()

  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <style>{`@media print { header, footer, .no-print { display: none !important; } }`}</style>
      <div className="no-print mb-5 flex flex-wrap gap-3">
        <button onClick={() => window.print()} className="rounded-full bg-primary px-6 py-3 font-bold text-white">🖨️ প্রিন্ট / PDF সংরক্ষণ</button>
        <Link to="/my-courses" className="rounded-full bg-white px-6 py-3 font-bold text-ink shadow-sm">আমার কোর্সে ফিরুন</Link>
      </div>
      <div className="rounded-[2rem] border-8 border-double border-primary bg-white p-10 text-center shadow-xl">
        <p className="text-sm font-bold tracking-widest text-primary">বাংলা এডুকেশন</p>
        <h1 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">কোর্স সমাপনী সার্টিফিকেট</h1>
        <p className="mt-6 text-muted">এই সার্টিফিকেটটি দেওয়া হচ্ছে</p>
        <p className="mt-2 text-2xl font-bold text-ink">{user.name}</p>
        <p className="mt-6 text-muted">কোর্সটি সফলভাবে সম্পন্ন করার জন্য</p>
        <p className="mt-2 text-xl font-bold text-ink">{course.title}</p>
        <p className="mt-2 text-sm text-muted">শিক্ষক: {course.teacher} • {course.level}</p>
        <p className="mt-6 text-sm text-muted">সম্পন্নের তারিখ: {new Date(doneDate).toLocaleDateString('bn-BD')}</p>
        <p className="mt-8 text-xs text-muted">এটি বাংলা এডুকেশনের নিজস্ব কোর্স সমাপনী সার্টিফিকেট — কোনো সরকারি স্বীকৃতি বা রেজিস্ট্রেশন নম্বর এতে নেই।</p>
      </div>
    </div>
  )
}
