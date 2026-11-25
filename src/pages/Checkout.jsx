import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { bn } from '../components/CourseCard'

export default function Checkout() {
  const { courseId } = useParams()
  const { getCourse, user, settings, submitOrder, pendingOrderFor, isEnrolled, authLoading, dataLoading } = useStore()
  const navigate = useNavigate()
  const [method, setMethod] = useState('bkash')
  const [senderNumber, setSenderNumber] = useState('')
  const [txnId, setTxnId] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const course = getCourse(courseId)

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
        <h1 className="text-2xl font-bold text-ink">কিনতে হলে প্রথমে লগইন করুন</h1>
        <p className="mt-2 text-muted">লগইন ছাড়া কোর্স কেনা যাবে না।</p>
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
  if (isEnrolled(course.id)) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <h1 className="text-2xl font-bold text-ink">আপনি এই কোর্সটি ইতিমধ্যে কিনেছেন</h1>
        <Link to={`/learn/${course.id}/${course.lessons?.[0]?.id || ''}`} className="mt-6 inline-block rounded-full bg-emerald-600 px-6 py-3 font-bold text-white">ক্লাস শুরু করুন</Link>
      </div>
    )
  }
  const pending = pendingOrderFor(course.id)
  if (pending && !done) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <div className="rounded-[2rem] bg-white p-10 shadow-[0_8px_30px_rgba(37,99,235,0.10)]">
          <h1 className="text-2xl font-bold text-ink">আপনার পেমেন্ট জমা আছে</h1>
          <p className="mt-2 text-muted">ট্রানজাকশন: <b className="text-ink">{pending.txnId}</b> • {pending.method === 'bkash' ? 'বিকাশ' : 'নগদ'} • ৳{bn(pending.price)}</p>
          <p className="mt-2 text-muted">অ্যাডমিন অ্যাপ্রুভ করলেই ক্লাস খুলে যাবে। অবস্থা দেখুন “আমার কোর্স” পেজে।</p>
          <Link to="/my-courses" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">আমার কোর্স দেখুন</Link>
        </div>
      </div>
    )
  }

  const payNumber = method === 'bkash' ? settings.bkashNumber : settings.nagadNumber

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!senderNumber.trim() || !txnId.trim()) { setError('যে নম্বর থেকে টাকা পাঠিয়েছেন আর ট্রানজাকশন আইডি/শেষ ৩ সংখ্যা — দুটোই দিন।'); return }
    setBusy(true)
    try {
      await submitOrder({ courseId: course.id, method, senderNumber: senderNumber.trim(), txnId: txnId.trim() })
      setDone(true)
    } catch (err) {
      setError(err.message || 'জমা দেওয়া যায়নি। আবার চেষ্টা করুন।')
    }
    setBusy(false)
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
        <div className="rounded-[2rem] bg-white p-10 shadow-[0_8px_30px_rgba(37,99,235,0.10)]">
          <div className="text-5xl">✓</div>
          <h1 className="mt-4 text-2xl font-bold text-ink">পেমেন্ট জমা হয়েছে</h1>
          <p className="mt-2 text-muted">অ্যাডমিন আপনার ট্রানজাকশন যাচাই করে অ্যাপ্রুভ করলেই “{course.title}” কোর্সের ক্লাস খুলে যাবে।</p>
          <button onClick={() => navigate('/my-courses')} className="mt-6 rounded-full bg-primary px-6 py-3 font-bold text-white">আমার কোর্স দেখুন</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <h1 className="text-3xl font-bold text-ink">কোর্স কিনুন</h1>
      <p className="mt-2 text-muted">পেমেন্ট এই সাইট থেকে সরাসরি নয় — নিচের নম্বরে টাকা পাঠিয়ে তথ্য জমা দিন।</p>

      <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-[0_8px_30px_rgba(37,99,235,0.10)] sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">{course.title}</h2>
            <p className="text-sm text-muted">{course.lessons?.length || 0}টি ক্লাস • {course.level}</p>
          </div>
          <span className="text-2xl font-bold text-ink">৳{bn(course.price)}</span>
        </div>

        {settings.siteNotice && <p className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-primary">{settings.siteNotice}</p>}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-bold text-ink">পেমেন্ট মাধ্যম</label>
            <div className="flex gap-3">
              {[
                ['bkash', 'বিকাশ', '#D12053'],
                ['nagad', 'নগদ', '#F6921E'],
              ].map(([v, label, color]) => (
                <button key={v} type="button" onClick={() => setMethod(v)}
                  className={`flex-1 rounded-2xl border-2 py-3 font-bold ${method === v ? 'text-white' : 'border-slate-200 bg-white text-ink'}`}
                  style={method === v ? { background: color, borderColor: color } : {}}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-page p-4 text-center">
            <p className="text-sm text-muted">{method === 'bkash' ? 'বিকাশ' : 'নগদ'} নম্বর (Send Money)</p>
            {payNumber ? (
              <p className="mt-1 text-2xl font-bold tracking-wider text-ink">{payNumber}</p>
            ) : (
              <p className="mt-1 font-bold text-amber-700">পেমেন্ট নম্বর এখনো অ্যাডমিন বসাননি — কেনার আগে অ্যাডমিনের সঙ্গে যোগাযোগ করুন।</p>
            )}
            <p className="mt-1 text-sm font-bold text-ink">পাঠাতে হবে: ৳{bn(course.price)}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-ink">যে নম্বর থেকে টাকা পাঠিয়েছেন</label>
            <input required value={senderNumber} onChange={e => setSenderNumber(e.target.value)} placeholder="যেমন: 01XXXXXXXXX"
              className="w-full rounded-2xl border border-blue-100 bg-page px-4 py-3 focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-ink">ট্রানজাকশন আইডি অথবা শেষ ৩ সংখ্যা</label>
            <input required value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="যেমন: 9H7X2KLMNP অথবা 123"
              className="w-full rounded-2xl border border-blue-100 bg-page px-4 py-3 focus:border-primary focus:outline-none" />
          </div>

          {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <button disabled={busy || !payNumber} className="w-full rounded-full bg-cta py-3 font-bold text-white hover:bg-cta-dark disabled:opacity-60">
            {busy ? 'জমা হচ্ছে…' : 'পেমেন্ট জমা দিন'}
          </button>
        </form>
      </div>
    </div>
  )
}
