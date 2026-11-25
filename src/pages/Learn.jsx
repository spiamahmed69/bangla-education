import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import SecurePlayer from '../components/SecurePlayer'

// ভিডিও URL শুধু এনরোল করা ইউজারের জন্য getLessonVideo() দিয়ে আনা হয়।
// কেনা হয়নি এমন ইউজারের কাছে iframe তো দূরের কথা, ভিডিওর লিংকও পৌঁছায় না।
export default function Learn() {
  const { courseId, lessonId } = useParams()
  const { getCourse, user, isEnrolled, getLessonVideo, authLoading, dataLoading, completedLessonIds, toggleLessonComplete, progressPct, getQuiz } = useStore()
  const [youtubeId, setYoutubeId] = useState(null)
  const [loadingVideo, setLoadingVideo] = useState(true)
  const [quizExists, setQuizExists] = useState(false)
  const [toggleBusy, setToggleBusy] = useState(false)
  const [toggleError, setToggleError] = useState('')

  const course = getCourse(courseId)
  const lesson = course?.lessons?.find(l => l.id === lessonId)
  const enrolled = isEnrolled(courseId)
  const doneIds = enrolled ? completedLessonIds(courseId) : []
  const totalLessons = course?.lessons?.length || 0
  const pct = enrolled ? progressPct(courseId, totalLessons) : 0
  const isDone = doneIds.includes(lessonId)
  const isComplete = totalLessons > 0 && doneIds.length === totalLessons

  useEffect(() => {
    let alive = true
    if (!enrolled) return
    getQuiz(courseId).then(q => { if (alive) setQuizExists(!!(q && (q.questions || []).length)) })
    return () => { alive = false }
  }, [enrolled, courseId])

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

  if (authLoading || dataLoading) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <p className="text-muted dark:text-slate-400">লোড হচ্ছে…</p>
      </div>
    )
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink dark:text-slate-100">ক্লাস দেখতে লগইন করুন</h1>
        <p className="mt-2 text-muted dark:text-slate-400">শুধু লগইন করা ও কোর্স কেনা শিক্ষার্থীরাই ক্লাস দেখতে পারে।</p>
        <Link to="/login" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">লগইন করুন</Link>
      </div>
    )
  }
  if (!course || !lesson) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink dark:text-slate-100">ক্লাসটি পাওয়া যায়নি</h1>
        <Link to="/courses" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">কোর্স তালিকায় ফিরুন</Link>
      </div>
    )
  }
  if (!enrolled) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <div className="rounded-[2rem] bg-white dark:bg-slate-800 p-10 shadow-[0_8px_30px_rgba(37,99,235,0.10)]">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-2xl font-bold text-ink dark:text-slate-100">এই ক্লাসটি লক করা আছে</h1>
          <p className="mt-2 text-muted dark:text-slate-400">“{lesson.title}” দেখতে প্রথমে “{course.title}” কোর্সটি কিনুন। অ্যাডমিন অ্যাপ্রুভ করলেই ক্লাস খুলে যাবে।</p>
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
      <h1 className="mt-3 text-2xl font-bold text-ink dark:text-slate-100 sm:text-3xl">{lesson.title}</h1>
      <p className="mt-1 text-muted dark:text-slate-400">{course.title} • ক্লাস {idx + 1} / {course.lessons.length} • {lesson.duration}</p>

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

      {/* প্রোগ্রেস — শিক্ষার্থী নিজে ক্লাসটি "সম্পন্ন" বলে চিহ্নিত করে; ভিডিও দেখা স্বয়ংক্রিয়ভাবে মাপা হয় না */}
      <div className="mt-6 rounded-3xl bg-white dark:bg-slate-800 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-bold text-ink dark:text-slate-100">আপনার অগ্রগতি — {doneIds.length.toLocaleString('bn-BD')}/{totalLessons.toLocaleString('bn-BD')}টি ক্লাস ({pct.toLocaleString('bn-BD')}%)</p>
          {isComplete && <Link to={`/certificate/${course.id}`} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white">🎓 সার্টিফিকেট ডাউনলোড</Link>}
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            disabled={toggleBusy}
            onClick={async () => {
              setToggleError('')
              setToggleBusy(true)
              try { await toggleLessonComplete(courseId, lessonId) }
              catch (err) { setToggleError(err.message || 'চিহ্ন দেওয়া যায়নি। আবার চেষ্টা করুন।') }
              setToggleBusy(false)
            }}
            className={`rounded-full px-5 py-2.5 font-bold text-white disabled:opacity-60 ${isDone ? 'bg-emerald-600' : 'bg-primary'}`}
          >
            {isDone ? '✓ এই ক্লাসটি সম্পন্ন হয়েছে' : 'এই ক্লাসটি সম্পন্ন হয়েছে বলে চিহ্নিত করুন'}
          </button>
          {quizExists && <Link to={`/quiz/${course.id}`} className="rounded-full bg-cta px-5 py-2.5 font-bold text-white">📝 কুইজ দিন</Link>}
        </div>
        {toggleError && <p className="mt-3 text-sm font-semibold text-red-700 dark:text-red-300">{toggleError}</p>}
        {isComplete && <p className="mt-3 text-sm font-bold text-emerald-700 dark:text-emerald-300">অভিনন্দন! সব ক্লাস শেষ — সার্টিফিকেট ডাউনলোড করতে পারেন।</p>}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {lesson.pdfUrl ? (
          <a href={lesson.pdfUrl} target="_blank" rel="noreferrer" className="rounded-full bg-primary px-6 py-3 font-bold text-white hover:bg-primary-dark">📄 নোটের PDF ডাউনলোড</a>
        ) : (
          <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-6 py-3 font-bold text-muted dark:text-slate-400">📄 এই ক্লাসের নোটের PDF লিংক এখনো বসানো হয়নি</span>
        )}
        {lesson.pdfUrl2 && (
          <a href={lesson.pdfUrl2} target="_blank" rel="noreferrer" className="rounded-full bg-primary px-6 py-3 font-bold text-white hover:bg-primary-dark">📄 প্র্যাকটিস সেটের PDF ডাউনলোড</a>
        )}
        {prev && <Link to={`/learn/${course.id}/${prev.id}`} className="rounded-full bg-white dark:bg-slate-800 px-6 py-3 font-bold text-ink dark:text-slate-100 shadow-sm">← আগের ক্লাস</Link>}
        {next && <Link to={`/learn/${course.id}/${next.id}`} className="rounded-full bg-white dark:bg-slate-800 px-6 py-3 font-bold text-ink dark:text-slate-100 shadow-sm">পরের ক্লাস →</Link>}
      </div>

      {/* সব PDF একসাথে — PDF ফাইলগুলো বাইরের লিংক, সার্ভারে ফাইল নেই, তাই আসল ZIP
          বানানো সম্ভব নয়; এখানে কোর্সের সব PDF লিংক এক জায়গায় আছে, আর তালিকাটা
          .html ফাইল হিসেবে ডাউনলোড করে অফলাইনে রাখা যায়। শুধু এনরোল করা শিক্ষার্থীরাই দেখে। */}
      <div className="mt-8 rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-sm dark:bg-slate-800">
        <h2 className="text-xl font-bold text-ink dark:text-slate-100">📄 সব PDF একসাথে</h2>
        {(() => {
          const pdfs = []
          course.lessons.forEach(l => {
            if (l.pdfUrl) pdfs.push({ lesson: l.title, label: 'নোটের PDF', url: l.pdfUrl })
            if (l.pdfUrl2) pdfs.push({ lesson: l.title, label: 'প্র্যাকটিস সেটের PDF', url: l.pdfUrl2 })
          })
          if (pdfs.length === 0) {
            return <p className="mt-3 text-muted dark:text-slate-400">এই কোর্সে এখনো কোনো PDF নোট বসানো হয়নি।</p>
          }
          const downloadList = () => {
            const rows = pdfs.map(p => `<li><a href="${p.url}">${p.lesson} — ${p.label}</a></li>`).join('\n')
            const html = `<!doctype html><html lang="bn"><head><meta charset="utf-8"><title>${course.title} — PDF তালিকা</title></head><body><h1>${course.title}</h1><p>বাংলা এডুকেশন — সব PDF নোটের লিংক</p><ul>\n${rows}\n</ul></body></html>`
            const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `${course.title}-pdf-তালিকা.html`
            a.click()
            URL.revokeObjectURL(a.href)
          }
          return (
            <>
              <p className="mt-1 text-sm text-muted dark:text-slate-400">এই কোর্সের মোট {pdfs.length.toLocaleString('bn-BD')}টি PDF — নিচে একে একে ডাউনলোড করুন, অথবা পুরো তালিকাটা এক ফাইলে নামিয়ে রাখুন।</p>
              <ul className="mt-4 space-y-2">
                {pdfs.map((p, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-page dark:bg-slate-900 p-3 dark:bg-slate-900">
                    <span className="font-semibold text-ink dark:text-slate-100">{p.lesson} — {p.label}</span>
                    <a href={p.url} target="_blank" rel="noreferrer" className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white">ডাউনলোড</a>
                  </li>
                ))}
              </ul>
              <button onClick={downloadList} className="mt-4 rounded-full bg-navy px-5 py-2.5 font-bold text-white hover:bg-navy-deep">📥 তালিকা ডাউনলোড (.html)</button>
              <p className="mt-2 text-xs text-muted dark:text-slate-400">তালিকা ফাইলে PDF-গুলোর লিংক থাকে, PDF ফাইলগুলো নিজে নয় — লিংকে ক্লিক করলেই ডাউনলোড হবে।</p>
            </>
          )
        })()}
      </div>

      <h2 className="mt-10 text-xl font-bold text-ink dark:text-slate-100">সব ক্লাস</h2>
      <div className="mt-4 space-y-2">
        {course.lessons.map((l, i) => (
          <Link key={l.id} to={`/learn/${course.id}/${l.id}`} className={`flex items-center justify-between rounded-2xl p-4 shadow-sm ${l.id === lessonId ? 'bg-blue-50 dark:bg-slate-700 ring-2 ring-primary' : 'bg-white dark:bg-slate-800'}`}>
            <span className="font-bold text-ink dark:text-slate-100">{doneIds.includes(l.id) ? '✓ ' : ''}{i + 1}. {l.title}</span>
            <span className="text-sm text-muted dark:text-slate-400">{l.duration}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
