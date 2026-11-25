import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { CATEGORIES } from '../lib/sampleData'
import { bn } from '../components/CourseCard'

const inputCls = 'w-full rounded-2xl border border-blue-100 bg-page px-4 py-2.5 focus:border-primary focus:outline-none'
const labelCls = 'mb-1 block text-sm font-bold text-ink'

// ইউটিউব লিংক (পূর্ণ URL) বা ID — যেটাই দেওয়া হোক, ID বের করে নেয়
export function extractYoutubeId(value) {
  const v = (value || '').trim()
  if (!v) return ''
  const m = v.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  if (m) return m[1]
  const q = v.match(/[?&]v=([A-Za-z0-9_-]{6,})/)
  if (q) return q[1]
  return v
}

const GRADIENTS = [
  'linear-gradient(135deg,#2563EB,#06B6D4)',
  'linear-gradient(135deg,#06B6D4,#2563EB)',
  'linear-gradient(135deg,#8B5CF6,#2563EB)',
  'linear-gradient(135deg,#059669,#06B6D4)',
  'linear-gradient(135deg,#FD9A2A,#8B5CF6)',
]

export default function Admin() {
  const { user, authLoading, courses, orders, enrollments, allUsers, settings, decideOrder, saveCourse, deleteCourse, saveSettings, setUserRole, logoutDevice } = useStore()
  const [tab, setTab] = useState('dashboard')
  const [msg, setMsg] = useState('')

  const [courseForm, setCourseForm] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [lessonCourseId, setLessonCourseId] = useState('')
  const [lessonForm, setLessonForm] = useState(null)
  const [settingsForm, setSettingsForm] = useState(null)

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
        <h1 className="text-2xl font-bold text-ink">অ্যাডমিন প্যানেল দেখতে লগইন করুন</h1>
        <Link to="/login" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">লগইন করুন</Link>
      </div>
    )
  }
  if (user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink">আপনার অ্যাডমিন অনুমতি নেই</h1>
        <p className="mt-2 text-muted">এই পেজটি শুধু অ্যাডমিনদের জন্য।</p>
        <Link to="/" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">হোমে ফিরুন</Link>
      </div>
    )
  }

  const revenue = orders.filter(o => o.status === 'approved').reduce((s, o) => s + (o.price || 0), 0)
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const lessonCourse = courses.find(c => c.id === lessonCourseId) || courses[0]
  const enrolledCourseIds = useMemo(() => {
    const map = {}
    enrollments.forEach(e => { map[e.userId] = [...(map[e.userId] || []), e.courseId] })
    return map
  }, [enrollments])

  const tabs = [
    ['dashboard', 'ড্যাশবোর্ড'],
    ['orders', `পেমেন্ট (${pendingOrders.length} অপেক্ষমাণ)`],
    ['courses', 'কোর্স'],
    ['lessons', 'ক্লাস'],
    ['users', 'ইউজার'],
    ['settings', 'সেটিংস'],
  ]

  const startCourseForm = (course) => setCourseForm(course ? { ...course } : { id: '', title: '', category: 'bangla', level: 'এসএসসি', price: 499, oldPrice: '', teacher: '', description: '', gradient: GRADIENTS[0], lessons: [] })

  const saveCourseForm = async (e) => {
    e.preventDefault()
    const payload = { ...courseForm, price: Number(courseForm.price) || 0, oldPrice: Number(courseForm.oldPrice) || null }
    if (!payload.id) delete payload.id
    await saveCourse(payload)
    setCourseForm(null)
    setMsg('কোর্স সংরক্ষণ হয়েছে।')
  }

  // কোর্সের ছবি আপলোড — ফাইল বেছে নিলেই সার্ভারের মাধ্যমে ImgBB-তে যাবে,
  // ফেরত আসা লিংক imageUrl-এ বসবে। চাবি ব্রাউজারে আসে না, শুধু সার্ভারে থাকে।
  const handleImageUpload = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('শুধু ছবির ফাইল (JPG/PNG) বেছে নিন।')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('ছবির সাইজ 2MB-এর বেশি হলে চলবে না।')
      return
    }
    setUploadError('')
    setUploadingImage(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: reader.result, name: (courseForm.title || 'course').replace(/\s+/g, '-').toLowerCase() }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'আপলোড ব্যর্থ হয়েছে।')
        setCourseForm(f => ({ ...f, imageUrl: data.displayUrl || data.url }))
        setMsg('ছবি আপলোড হয়েছে।')
      } catch (err) {
        setUploadError(err.message || 'আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
      } finally {
        setUploadingImage(false)
      }
    }
    reader.onerror = () => {
      setUploadingImage(false)
      setUploadError('ছবি পড়া যায়নি। আবার চেষ্টা করুন।')
    }
    reader.readAsDataURL(file)
  }

  const startLessonForm = (lesson) => setLessonForm(lesson ? { ...lesson, isFree: !!lesson.isFree } : { id: `l${Date.now()}`, title: '', duration: '', youtubeId: '', pdfUrl: '', pdfUrl2: '', isFree: false })

  const saveLessonForm = async (e) => {
    e.preventDefault()
    if (!lessonCourse) return
    const vid = extractYoutubeId(lessonForm.youtubeId)
    // ফ্রি ডেমো হলে এই লেসনের ভিডিও ID পাবলিক ডকে (demoYoutubeId) যাবে —
    // তাই ইউটিউব লিংকটা এখানে বসানো থাকতে হবে। ফ্রি না হলে কিছুই পাবলিক হয় না।
    const lesson = { ...lessonForm, youtubeId: vid, isFree: !!lessonForm.isFree, demoYoutubeId: lessonForm.isFree ? vid : '' }
    const lessons = (lessonCourse.lessons || []).some(l => l.id === lesson.id)
      ? lessonCourse.lessons.map(l => l.id === lesson.id ? lesson : l)
      : [...(lessonCourse.lessons || []), lesson]
    await saveCourse({ ...lessonCourse, lessons })
    setLessonForm(null)
    setMsg(`“${lesson.title}” ক্লাস সংরক্ষণ হয়েছে।`)
  }

  const deleteLesson = async (lessonId) => {
    if (!lessonCourse || !confirm('এই ক্লাসটি মুছে ফেলবেন?')) return
    await saveCourse({ ...lessonCourse, lessons: lessonCourse.lessons.filter(l => l.id !== lessonId) })
    setMsg('ক্লাস মুছে ফেলা হয়েছে।')
  }

  const saveSettingsForm = async (e) => {
    e.preventDefault()
    await saveSettings(settingsForm)
    setMsg('সেটিংস সংরক্ষণ হয়েছে।')
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <h1 className="text-3xl font-bold text-ink">অ্যাডমিন প্যানেল</h1>
      <p className="mt-1 text-muted">স্বাগতম, {user.name} — বিক্রি, পেমেন্ট, কোর্স আর ইউজার — সব এখান থেকে পরিচালনা করুন।</p>
      {msg && <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">{msg}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => { setTab(id); setMsg('') }}
            className={`rounded-full px-4 py-2 text-sm font-bold ${tab === id ? 'bg-primary text-white' : 'bg-white text-ink shadow-sm'}`}>{label}</button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            ['মোট বিক্রি (অ্যাপ্রুভ)', `৳${bn(revenue)}`],
            ['অপেক্ষমাণ পেমেন্ট', `${pendingOrders.length}টি`],
            ['মোট ইউজার', `${allUsers.length} জন`],
            ['মোট কোর্স', `${courses.length}টি`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
            </div>
          ))}
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:col-span-4">
            <h2 className="font-bold text-ink">সাম্প্রতিক পেমেন্ট</h2>
            {orders.length === 0 ? <p className="mt-2 text-sm text-muted">এখনো কোনো পেমেন্ট জমা পড়েনি।</p> : (
              <ul className="mt-3 space-y-2 text-sm">
                {orders.slice(0, 5).map(o => (
                  <li key={o.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2">
                    <span>{o.userEmail} — {o.courseTitle} (৳{bn(o.price)})</span>
                    <span className="font-bold">{o.status === 'approved' ? 'অ্যাপ্রুভ' : o.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমাণ'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="mt-6 space-y-3">
          {orders.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-muted shadow-sm">কোনো পেমেন্ট জমা পড়েনি।</p>}
          {orders.map(o => (
            <div key={o.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">{o.courseTitle} — ৳{bn(o.price)}</p>
                  <p className="text-sm text-muted">{o.userEmail} • {o.method === 'bkash' ? 'বিকাশ' : 'নগদ'} • প্রেরক: {o.senderNumber} • ট্রানজাকশন: {o.txnId}</p>
                </div>
                <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${o.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : o.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                  {o.status === 'approved' ? 'অ্যাপ্রুভ হয়েছে' : o.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমাণ'}
                </span>
              </div>
              {o.status === 'pending' && (
                <div className="mt-4 flex gap-3">
                  <button onClick={() => { decideOrder(o.id, 'approved'); setMsg('পেমেন্ট অ্যাপ্রুভ হয়েছে — শিক্ষার্থীর ক্লাস খুলে গেছে।') }} className="rounded-full bg-emerald-600 px-5 py-2 font-bold text-white">অ্যাপ্রুভ করুন</button>
                  <button onClick={() => { decideOrder(o.id, 'rejected'); setMsg('পেমেন্ট বাতিল করা হয়েছে।') }} className="rounded-full bg-red-600 px-5 py-2 font-bold text-white">বাতিল করুন</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'courses' && (
        <div className="mt-6">
          <button onClick={() => startCourseForm(null)} className="rounded-full bg-primary px-5 py-2.5 font-bold text-white">+ নতুন কোর্স</button>
          {courseForm && (
            <form onSubmit={saveCourseForm} className="mt-4 space-y-4 rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="font-bold text-ink">{courseForm.id ? 'কোর্স সম্পাদনা' : 'নতুন কোর্স'}</h2>
              <div><label className={labelCls}>কোর্সের নাম</label><input required className={inputCls} value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} /></div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><label className={labelCls}>ক্যাটাগরি</label>
                  <select className={inputCls} value={courseForm.category} onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select></div>
                <div><label className={labelCls}>লেভেল</label><input className={inputCls} value={courseForm.level} onChange={e => setCourseForm({ ...courseForm, level: e.target.value })} /></div>
                <div><label className={labelCls}>শিক্ষক</label><input className={inputCls} value={courseForm.teacher} onChange={e => setCourseForm({ ...courseForm, teacher: e.target.value })} placeholder="আসল নাম লিখুন" /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><label className={labelCls}>দাম (৳)</label><input type="number" min="0" className={inputCls} value={courseForm.price} onChange={e => setCourseForm({ ...courseForm, price: e.target.value })} /></div>
                <div><label className={labelCls}>আগের দাম (৳) — না থাকলে খালি রাখুন</label><input type="number" min="0" className={inputCls} value={courseForm.oldPrice || ''} onChange={e => setCourseForm({ ...courseForm, oldPrice: e.target.value })} /></div>
              </div>
              <div><label className={labelCls}>বিবরণ</label><textarea rows="3" className={inputCls} value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} /></div>
              <div>
                <label className={labelCls}>কোর্সের ছবি</label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer rounded-full bg-primary px-5 py-2.5 font-bold text-white">
                    📷 ছবি আপলোড করুন
                    <input type="file" accept="image/*" className="hidden" onChange={e => { handleImageUpload(e.target.files?.[0]); e.target.value = '' }} />
                  </label>
                  {uploadingImage && <span className="text-sm font-bold text-primary">আপলোড হচ্ছে…</span>}
                  {courseForm.imageUrl && <img src={courseForm.imageUrl} alt="কোর্সের ছবি" className="h-16 w-28 rounded-xl object-cover" />}
                </div>
                {uploadError && <p className="mt-2 text-sm font-bold text-red-600">{uploadError}</p>}
                <input className={`${inputCls} mt-3`} value={courseForm.imageUrl || ''} onChange={e => setCourseForm({ ...courseForm, imageUrl: e.target.value })} placeholder="অথবা ছবির লিংক দিন (https://…)" />
                <p className="mt-1 text-xs text-muted">খালি থাকলে ডিজাইন করা কভার দেখাবে।</p>
              </div>
              <div className="flex gap-3">
                <button className="rounded-full bg-primary px-6 py-2.5 font-bold text-white">সংরক্ষণ</button>
                <button type="button" onClick={() => setCourseForm(null)} className="rounded-full bg-slate-100 px-6 py-2.5 font-bold text-ink">বাতিল</button>
              </div>
            </form>
          )}
          <div className="mt-4 space-y-3">
            {courses.map(c => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-5 shadow-sm">
                <div>
                  <p className="font-bold text-ink">{c.title}</p>
                  <p className="text-sm text-muted">৳{bn(c.price)} • {c.lessons?.length || 0}টি ক্লাস • {c.teacher}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startCourseForm(c)} className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-primary">সম্পাদনা</button>
                  <button onClick={() => { if (confirm(`“${c.title}” মুছে ফেলবেন?`)) { deleteCourse(c.id); setMsg('কোর্স মুছে ফেলা হয়েছে।') } }} className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">মুছুন</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'lessons' && (
        <div className="mt-6">
          <label className={labelCls}>কোর্স বেছে নিন</label>
          <select className={inputCls} value={lessonCourse?.id || ''} onChange={e => setLessonCourseId(e.target.value)}>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          {lessonCourse && (
            <>
              <button onClick={() => startLessonForm(null)} className="mt-4 rounded-full bg-primary px-5 py-2.5 font-bold text-white">+ নতুন ক্লাস</button>
              {lessonForm && (
                <form onSubmit={saveLessonForm} className="mt-4 space-y-4 rounded-3xl bg-white p-6 shadow-sm">
                  <h2 className="font-bold text-ink">{lessonForm.id && (lessonCourse.lessons || []).some(l => l.id === lessonForm.id) ? 'ক্লাস সম্পাদনা' : 'নতুন ক্লাস'} — {lessonCourse.title}</h2>
                  <div><label className={labelCls}>ক্লাসের নাম</label><input required className={inputCls} value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="যেমন: বহিপীর" /></div>
                  <div><label className={labelCls}>সময়কাল</label><input className={inputCls} value={lessonForm.duration} onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })} placeholder="যেমন: ৩০ মিনিট" /></div>
                  <div><label className={labelCls}>ইউটিউব লিংক (পূর্ণ URL বা ভিডিও ID)</label><input className={inputCls} value={lessonForm.youtubeId} onChange={e => setLessonForm({ ...lessonForm, youtubeId: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" /></div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-emerald-50 p-4">
                    <input type="checkbox" checked={!!lessonForm.isFree} onChange={e => setLessonForm({ ...lessonForm, isFree: e.target.checked })} className="mt-1 h-5 w-5 shrink-0 accent-emerald-600" />
                    <span>
                      <span className="block font-bold text-ink">ফ্রি ডেমো ক্লাস হিসেবে দেখান (লগইন ছাড়াই সবাই দেখতে পারবে)</span>
                      <span className="mt-1 block text-sm text-muted">শুধু এই ক্লাসের ভিডিওটাই সবার জন্য খুলে যাবে — কোর্সের বাকি ক্লাসগুলো কেনা ছাড়া লকই থাকবে। ফ্রি করতে হলে ওপরে ইউটিউব লিংক বসানো থাকতে হবে।</span>
                    </span>
                  </label>
                  <div><label className={labelCls}>নোটের PDF লিংক (আপলোড নয়, শুধু লিংক)</label><input className={inputCls} value={lessonForm.pdfUrl} onChange={e => setLessonForm({ ...lessonForm, pdfUrl: e.target.value })} placeholder="https://…" /></div>
                  <div><label className={labelCls}>প্র্যাকটিস সেটের PDF লিংক (ঐচ্ছিক)</label><input className={inputCls} value={lessonForm.pdfUrl2 || ''} onChange={e => setLessonForm({ ...lessonForm, pdfUrl2: e.target.value })} placeholder="https://…" /></div>
                  <div className="flex gap-3">
                    <button className="rounded-full bg-primary px-6 py-2.5 font-bold text-white">সংরক্ষণ</button>
                    <button type="button" onClick={() => setLessonForm(null)} className="rounded-full bg-slate-100 px-6 py-2.5 font-bold text-ink">বাতিল</button>
                  </div>
                </form>
              )}
              <div className="mt-4 space-y-3">
                {(lessonCourse.lessons || []).map((l, i) => (
                  <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white p-5 shadow-sm">
                    <div>
                      <p className="font-bold text-ink">{i + 1}. {l.title} {l.isFree && <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">ফ্রি ডেমো</span>}</p>
                      <p className="text-sm text-muted">{l.duration} • ভিডিও: {l.youtubeId ? 'যুক্ত আছে' : 'লিংক বসানো হয়নি'} • PDF: {l.pdfUrl ? 'যুক্ত আছে' : 'লিংক বসানো হয়নি'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startLessonForm(l)} className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-primary">সম্পাদনা</button>
                      <button onClick={() => deleteLesson(l.id)} className="rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-700">মুছুন</button>
                    </div>
                  </div>
                ))}
                {(lessonCourse.lessons || []).length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-muted shadow-sm">এই কোর্সে এখনো কোনো ক্লাস নেই।</p>}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="mt-6 space-y-3">
          {allUsers.map(u => (
            <div key={u.uid} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">{u.name} <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-primary">{u.role === 'admin' ? 'অ্যাডমিন' : 'শিক্ষার্থী'}</span></p>
                  <p className="text-sm text-muted">{u.email}</p>
                  <p className="text-sm text-muted">কেনা কোর্স: {(enrolledCourseIds[u.uid] || []).length}টি • লগইন করা ডিভাইস: {(u.devices || []).length}টি (সর্বোচ্চ ২টি)</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {u.role !== 'admin'
                    ? <button onClick={() => { setUserRole(u.uid, 'admin'); setMsg(`${u.email} কে অ্যাডমিন করা হয়েছে।`) }} className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-primary">অ্যাডমিন করুন</button>
                    : u.uid !== user.uid && <button onClick={() => { setUserRole(u.uid, 'student'); setMsg(`${u.email} কে শিক্ষার্থী করা হয়েছে।`) }} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-ink">অ্যাডমিন সরান</button>}
                </div>
              </div>
              {(u.devices || []).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {u.devices.map((d, i) => (
                    <span key={d} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-muted">
                      ডিভাইস {i + 1}: {String(d).slice(0, 8)}…
                      <button onClick={() => { logoutDevice(u.uid, d); setMsg('ডিভাইস থেকে লগআউট করানো হয়েছে।') }} className="font-bold text-red-700">লগআউট করান</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {allUsers.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-muted shadow-sm">এখনো কোনো ইউজার নেই।</p>}
        </div>
      )}

      {tab === 'settings' && (
        <form onSubmit={saveSettingsForm} className="mt-6 max-w-2xl space-y-4 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-bold text-ink">পেমেন্ট সেটিংস</h2>
          <p className="text-sm text-muted">এই নম্বরগুলোই কেনার পেজে শিক্ষার্থীদের দেখানো হবে। টাকা এই নম্বরে পাঠাতে হবে।</p>
          <div><label className={labelCls}>বিকাশ নম্বর (Personal)</label><input className={inputCls} value={(settingsForm || settings).bkashNumber} onChange={e => setSettingsForm({ ...(settingsForm || settings), bkashNumber: e.target.value })} placeholder="01XXXXXXXXX" /></div>
          <div><label className={labelCls}>নগদ নম্বর (Personal)</label><input className={inputCls} value={(settingsForm || settings).nagadNumber} onChange={e => setSettingsForm({ ...(settingsForm || settings), nagadNumber: e.target.value })} placeholder="01XXXXXXXXX" /></div>
          <div><label className={labelCls}>কেনার পেজের নোটিশ</label><textarea rows="2" className={inputCls} value={(settingsForm || settings).siteNotice} onChange={e => setSettingsForm({ ...(settingsForm || settings), siteNotice: e.target.value })} /></div>
          <button className="rounded-full bg-primary px-6 py-2.5 font-bold text-white">সংরক্ষণ</button>
        </form>
      )}
    </div>
  )
}
