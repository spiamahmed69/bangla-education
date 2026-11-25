import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import SecurePlayer from '../components/SecurePlayer'

// ভিডিও URL শুধু এনরোল করা ইউজারের জন্য getLessonVideo() দিয়ে আনা হয়।
// কেনা হয়নি এমন ইউজারের কাছে iframe তো দূরের কথা, ভিডিওর লিংকও পৌঁছায় না।
export default function Learn() {
  const { courseId, lessonId } = useParams()
  const { getCourse, user, isEnrolled, getLessonVideo } = useStore()
  const [youtubeId, setYoutubeId] = useState(null)
  const [loadingVideo, setLoadingVideo] = useState(true)

  const course = getCourse(courseId)
  const lesson = course?.lessons?.find(l => l.id === lessonId)
  const enrolled = isEnrolled(courseId)

  useEffect(() => {
    let alive = true
    const load = async () => {
      if (!enrolled || !lesson) { setLoadingVideo(false); return }
      const id = await getLessonVideo(courseId, lessonId)
      if (alive) { setYoutubeId(id || ''); setLoadingVideo(false) }
    }
    load()
    return () => { alive = false }
  }, [enrolled, lesson, courseId, lessonId, getLessonVideo])

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink">ক্লাস দেখতে লগইন করুন</h1>
        <p className="mt-2 text-muted">শুধু লগইন করা ও কোর্স কেনা শিক্ষার্থীরাই ক্লাস দেখতে পারে।</p>
        <Link to="/login" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">লগইন করুন</Link>
      </div>
    )
  }
  if (!course || !lesson) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink">ক্লাসটি পাওয়া যায়নি</h1>
        <Link to="/courses" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">কোর্স তালিকায় ফিরুন</Link>
      </div>
    )
  }
  if (!enrolled) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <div className="rounded-[2rem] bg-white p-10 shadow-[0_8px_30px_rgba(37,99,235,0.10)]">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-2xl font-bold text-ink">এই ক্লাসটি লক করা আছে</h1>
          <p className="mt-2 text-muted">“{lesson.title}” দেখতে প্রথমে “{course.title}” কোর্সটি কিনুন। অ্যাডমিন অ্যাপ্রুভ করলেই ক্লাস খুলে যাবে।</p>
          <Link to={`/checkout/${course.id}`} className="mt-6 inline-block rounded-full bg-cta px-6 py-3 font-bold text-white">কোর্সটি কিনুন</Link>
        </div>
      </div>
    )
  }

  const idx = course.lessons.findIndex(l => l.id === lessonId)
  const prev = course.lessons[idx - 1]
  const next = course.lessons[idx + 1]

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <Link to={`/courses/${course.id}`} className="text-sm font-bold text-primary">← {course.title}-এ ফিরুন</Link>
      <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">{lesson.title}</h1>
      <p className="mt-1 text-muted">{course.title} • ক্লাস {idx + 1} / {course.lessons.length} • {lesson.duration}</p>

      <div className="mt-6 overflow-hidden rounded-[2rem] bg-black shadow-xl">
        {loadingVideo ? (
          <div className="flex aspect-video items-center justify-center text-white">ভিডিও লোড হচ্ছে…</div>
        ) : youtubeId ? (
          <SecurePlayer videoId={youtubeId} title={lesson.title} />
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center px-6 text-center text-white">
            <p className="text-xl font-bold">এই ক্লাসের ভিডিও লিংক এখনো বসানো হয়নি</p>
            <p className="mt-2 text-sm text-white/70">অ্যাডমিন প্যানেল থেকে এই ক্লাসের ইউটিউব লিংক বসালেই এখানে ভিডিও চলবে।</p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {lesson.pdfUrl ? (
          <a href={lesson.pdfUrl} target="_blank" rel="noreferrer" className="rounded-full bg-primary px-6 py-3 font-bold text-white hover:bg-primary-dark">📄 নোটের PDF ডাউনলোড</a>
        ) : (
          <span className="rounded-full bg-slate-100 px-6 py-3 font-bold text-muted">📄 এই ক্লাসের নোটের PDF লিংক এখনো বসানো হয়নি</span>
        )}
        {lesson.pdfUrl2 && (
          <a href={lesson.pdfUrl2} target="_blank" rel="noreferrer" className="rounded-full bg-primary px-6 py-3 font-bold text-white hover:bg-primary-dark">📄 প্র্যাকটিস সেটের PDF ডাউনলোড</a>
        )}
        {prev && <Link to={`/learn/${course.id}/${prev.id}`} className="rounded-full bg-white px-6 py-3 font-bold text-ink shadow-sm">← আগের ক্লাস</Link>}
        {next && <Link to={`/learn/${course.id}/${next.id}`} className="rounded-full bg-white px-6 py-3 font-bold text-ink shadow-sm">পরের ক্লাস →</Link>}
      </div>

      <h2 className="mt-10 text-xl font-bold text-ink">সব ক্লাস</h2>
      <div className="mt-4 space-y-2">
        {course.lessons.map((l, i) => (
          <Link key={l.id} to={`/learn/${course.id}/${l.id}`} className={`flex items-center justify-between rounded-2xl p-4 shadow-sm ${l.id === lessonId ? 'bg-blue-50 ring-2 ring-primary' : 'bg-white'}`}>
            <span className="font-bold text-ink">{i + 1}. {l.title}</span>
            <span className="text-sm text-muted">{l.duration}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
