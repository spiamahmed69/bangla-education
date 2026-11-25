import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { isFirebaseConfigured, db } from '../lib/firebase'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { bn } from '../components/CourseCard'

// শিক্ষক প্যানেল — শুধু দেখার জন্য। ক্লাস বদলানো/যোগ করা শুধু অ্যাডমিন করতে পারে।
// ছাত্রদের নাম-ইমেইল নিয়ম অনুযায়ী শুধু অ্যাডমিন পড়তে পারে, তাই শিক্ষকের কাছে
// সেগুলো নাও আসতে পারে — সেক্ষেত্রে শুধু সংখ্যা দেখানো হয়, ভুয়া নাম বসানো হয় না।
export default function Teacher() {
  const { user, authLoading, courses, enrollments } = useStore()
  const [counts, setCounts] = useState({})
  const [studentsByCourse, setStudentsByCourse] = useState({})
  const [studentsBlocked, setStudentsBlocked] = useState(false)

  const myCourses = user ? courses.filter(c => c.teacherUid === user.uid) : []

  useEffect(() => {
    if (!user || user.role !== 'teacher') return
    let alive = true
    const load = async () => {
      const nextCounts = {}
      const nextStudents = {}
      let blocked = false
      for (const course of myCourses) {
        if (isFirebaseConfigured) {
          try {
            const es = await getDocs(query(collection(db, 'enrollments'), where('courseId', '==', course.id)))
            const list = es.docs.map(d => ({ id: d.id, ...d.data() })).filter(e => e.status === 'active')
            nextCounts[course.id] = list.length
            // ছাত্রের নাম-ইমেইল পড়ার চেষ্টা — নিয়মে আটকালে ধরা পড়বে, ভাঙবে না
            const students = []
            for (const e of list) {
              try {
                const snap = await getDoc(doc(db, 'users', e.userId))
                if (snap.exists()) students.push({ uid: e.userId, name: snap.data().name || snap.data().email, email: snap.data().email })
                else students.push({ uid: e.userId, name: null, email: null })
              } catch {
                blocked = true
                students.push({ uid: e.userId, name: null, email: null })
              }
            }
            nextStudents[course.id] = students
          } catch {
            blocked = true
            nextCounts[course.id] = enrollments.filter(e => e.courseId === course.id && e.status === 'active').length
            nextStudents[course.id] = enrollments
              .filter(e => e.courseId === course.id && e.status === 'active')
              .map(e => ({ uid: e.userId, name: null, email: null }))
          }
        } else {
          const list = enrollments.filter(e => e.courseId === course.id && e.status === 'active')
          nextCounts[course.id] = list.length
          nextStudents[course.id] = list.map(e => ({ uid: e.userId, name: null, email: null }))
        }
      }
      if (alive) { setCounts(nextCounts); setStudentsByCourse(nextStudents); setStudentsBlocked(blocked) }
    }
    load()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, myCourses.map(c => c.id).join(',')])

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <p className="text-muted dark:text-slate-400">লোড হচ্ছে…</p>
      </div>
    )
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink dark:text-slate-100">শিক্ষক প্যানেল দেখতে লগইন করুন</h1>
        <Link to="/login" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">লগইন করুন</Link>
      </div>
    )
  }
  if (user.role !== 'teacher') {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink dark:text-slate-100">এই পেজটি শুধু শিক্ষকদের জন্য</h1>
        <p className="mt-2 text-muted dark:text-slate-400">আপনার অ্যাকাউন্টে শিক্ষকের ভূমিকা নেই — অ্যাডমিনকে বলুন শিক্ষক করে দিতে।</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">হোমে ফিরুন</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <h1 className="text-3xl font-bold text-ink dark:text-slate-100">শিক্ষক প্যানেল</h1>
      <p className="mt-1 text-muted dark:text-slate-400">স্বাগতম, {user.name} — আপনার দায়িত্বের কোর্সগুলো এখানে দেখতে পারবেন। এই প্যানেল শুধু দেখার জন্য — ক্লাস যোগ/বদলাতে অ্যাডমিনের সঙ্গে যোগাযোগ করুন।</p>

      {myCourses.length === 0 ? (
        <div className="mt-8 rounded-[2rem] bg-white dark:bg-slate-800 p-10 text-center shadow-sm">
          <p className="text-lg font-bold text-ink dark:text-slate-100">আপনার নামে এখনো কোনো কোর্স দেওয়া হয়নি</p>
          <p className="mt-1 text-muted dark:text-slate-400">অ্যাডমিন কোর্স সম্পাদনা থেকে আপনাকে শিক্ষক হিসেবে বেছে নিলে এখানে কোর্স দেখা যাবে।</p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {myCourses.map(c => {
            const students = studentsByCourse[c.id] || []
            const count = counts[c.id] ?? 0
            return (
              <div key={c.id} className="rounded-[2rem] bg-white dark:bg-slate-800 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-ink dark:text-slate-100">{c.title}</h2>
                    <p className="text-sm text-muted dark:text-slate-400">{c.level} • {c.lessons?.length || 0}টি ক্লাস • ৳{bn(c.price)}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 dark:bg-slate-700 px-4 py-1.5 text-sm font-bold text-primary">{bn(count)} জন শিক্ষার্থী</span>
                </div>
                <h3 className="mt-5 font-bold text-ink dark:text-slate-100">ক্লাসের তালিকা</h3>
                {(c.lessons || []).length === 0 ? (
                  <p className="mt-2 text-sm text-muted dark:text-slate-400">এই কোর্সে এখনো কোনো ক্লাস নেই।</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm">
                    {(c.lessons || []).map((l, i) => (
                      <li key={l.id} className="flex justify-between gap-2 border-b border-slate-100 pb-1">
                        <span>{i + 1}. {l.title}</span>
                        <span className="text-muted dark:text-slate-400">{l.duration || ''}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <h3 className="mt-5 font-bold text-ink dark:text-slate-100">শিক্ষার্থীরা</h3>
                {students.length === 0 ? (
                  <p className="mt-2 text-sm text-muted dark:text-slate-400">এখনো কেউ এই কোর্সটি কেনেনি।</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm">
                    {students.map(s => (
                      <li key={s.uid} className="border-b border-slate-100 pb-1">
                        {s.name ? <span className="font-semibold text-ink dark:text-slate-100">{s.name}</span> : <span className="text-muted dark:text-slate-400">শিক্ষার্থী {String(s.uid).slice(0, 8)}…</span>}
                        {s.email && <span className="text-muted dark:text-slate-400"> • {s.email}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {studentsBlocked && students.length > 0 && (
                  <p className="mt-3 rounded-2xl bg-amber-50 dark:bg-amber-950 p-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
                    ছাত্রদের নাম-ইমেইল দেখতে অ্যাডমিনের অনুমতি লাগবে — এখন শুধু সংখ্যা দেখা যাচ্ছে।
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
