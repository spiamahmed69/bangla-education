import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'

// MCQ কুইজ — শুধু কোর্স কেনা শিক্ষার্থীর জন্য। স্কোর সাথে সাথে দেখানো হয়,
// চেষ্টার ইতিহাস সংরক্ষণ করা হয় না। কুইজ না থাকলে সৎ বার্তা দেখায়।
export default function Quiz() {
  const { courseId } = useParams()
  const { getCourse, user, isEnrolled, authLoading, dataLoading, getQuiz } = useStore()
  const [quiz, setQuiz] = useState(undefined)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const course = getCourse(courseId)
  const enrolled = isEnrolled(courseId)

  useEffect(() => {
    let alive = true
    if (!enrolled) return
    getQuiz(courseId).then(q => { if (alive) setQuiz(q) })
    return () => { alive = false }
  }, [enrolled, courseId])

  if (authLoading || dataLoading) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <p className="text-muted">লোড হচ্ছে…</p>
      </div>
    )
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink">কুইজ দিতে লগইন করুন</h1>
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
  if (!enrolled) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink">এই কুইজটি লক করা আছে</h1>
        <p className="mt-2 text-muted">“{course.title}” কোর্সটি কিনে অ্যাডমিনের অ্যাপ্রুভ পেলেই কুইজ দিতে পারবেন।</p>
        <Link to={`/courses/${course.id}`} className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">কোর্সটি দেখুন</Link>
      </div>
    )
  }
  if (quiz === undefined) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <p className="text-muted">কুইজ লোড হচ্ছে…</p>
      </div>
    )
  }
  if (!quiz || !(quiz.questions || []).length) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink">এই কোর্সে এখনো কুইজ নেই</h1>
        <p className="mt-2 text-muted">অ্যাডমিন কুইজ বানালেই এখানে প্রশ্ন দেখা যাবে।</p>
        <Link to={`/learn/${course.id}/${course.lessons?.[0]?.id || ''}`} className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">ক্লাসে ফিরুন</Link>
      </div>
    )
  }

  const questions = quiz.questions
  const score = questions.reduce((s, q, i) => s + (answers[i] === q.answerIndex ? 1 : 0), 0)
  const pct = Math.round((score / questions.length) * 100)
  const passed = pct >= 60

  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <Link to={`/courses/${course.id}`} className="text-sm font-bold text-primary">← {course.title}-এ ফিরুন</Link>
      <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">{course.title} — কুইজ</h1>
      <p className="mt-1 text-muted">{questions.length.toLocaleString('bn-BD')}টি প্রশ্ন • পাস করতে {60 .toLocaleString('bn-BD')}% নম্বর লাগবে</p>

      {submitted ? (
        <div className="mt-6 rounded-[2rem] bg-white p-8 text-center shadow-sm">
          <p className="text-4xl font-bold text-ink">{score.toLocaleString('bn-BD')}/{questions.length.toLocaleString('bn-BD')}</p>
          <p className={`mt-2 text-xl font-bold ${passed ? 'text-emerald-700' : 'text-amber-700'}`}>
            {passed ? '🎉 অভিনন্দন! আপনি পাস করেছেন।' : 'আরেকটু চেষ্টা করুন — ৬০% নম্বর লাগবে।'}
          </p>
          <p className="mt-1 text-sm text-muted">আপনার স্কোর সংরক্ষণ করা হয়নি — শুধু এখনই দেখানো হচ্ছে।</p>
          <button onClick={() => { setAnswers({}); setSubmitted(false) }} className="mt-6 rounded-full bg-primary px-6 py-3 font-bold text-white">আবার কুইজ দিন</button>
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        {questions.map((q, i) => (
          <div key={i} className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="font-bold text-ink">{(i + 1).toLocaleString('bn-BD')}. {q.q}</p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => {
                const chosen = answers[i] === oi
                const correct = q.answerIndex === oi
                let cls = 'border-slate-200 bg-white'
                if (submitted) {
                  if (correct) cls = 'border-emerald-500 bg-emerald-50'
                  else if (chosen) cls = 'border-red-400 bg-red-50'
                } else if (chosen) cls = 'border-primary bg-blue-50'
                return (
                  <label key={oi} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 ${cls}`}>
                    <input type="radio" name={`q-${i}`} checked={chosen} disabled={submitted}
                      onChange={() => setAnswers(prev => ({ ...prev, [i]: oi }))} className="h-4 w-4 accent-blue-600" />
                    <span className="font-semibold text-ink">{opt}</span>
                    {submitted && correct && <span className="ml-auto text-sm font-bold text-emerald-700">✓ সঠিক</span>}
                    {submitted && chosen && !correct && <span className="ml-auto text-sm font-bold text-red-700">✗ ভুল</span>}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length !== questions.length}
          className="mt-6 w-full rounded-full bg-primary py-3 font-bold text-white disabled:opacity-50"
        >
          {Object.keys(answers).length === questions.length ? 'জমা দিন — স্কোর দেখুন' : `সব প্রশ্নের উত্তর দিন (${Object.keys(answers).length.toLocaleString('bn-BD')}/${questions.length.toLocaleString('bn-BD')})`}
        </button>
      )}
    </div>
  )
}
