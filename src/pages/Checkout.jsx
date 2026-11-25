import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { bn } from '../components/CourseCard'

export default function Checkout() {
  const { courseId } = useParams()
  const { getCourse, user, settings, submitOrder, pendingOrderFor, isEnrolled, authLoading, dataLoading, validateCoupon } = useStore()
  const navigate = useNavigate()
  const [method, setMethod] = useState('bkash')
  const [senderNumber, setSenderNumber] = useState('')
  const [txnId, setTxnId] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')

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
          <p className="mt-2 text-muted">ট্রানজাকশন: <b className="text-ink">{pending.txnId}</b> • {pending.method === 'bkash' ? 'বিকাশ' : 'নগদ'} • ৳{bn(pending.price)}{pending.originalPrice && pending.originalPrice !== pending.price ? <span className="line-through"> ৳{bn(pending.originalPrice)}</span> : ''}{pending.couponCode ? ` • কুপন: ${pending.couponCode}` : ''}</p>
          <p className="mt-2 text-muted">অ্যাডমিন অ্যাপ্রুভ করলেই ক্লাস খুলে যাবে। অবস্থা দেখুন “আমার কোর্স” পেজে।</p>
          <Link to="/my-courses" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">আমার কোর্স দেখুন</Link>
        </div>
      </div>
    )
  }

  const payNumber = method === 'bkash' ? settings.bkashNumber : settings.nagadNumber
  // কুপন ছাড়ের পর আসলে যা পাঠাতে হবে
  const finalPrice = appliedCoupon ? appliedCoupon.finalPrice : course.price
  const discount = appliedCoupon ? appliedCoupon.discount : 0
  const isFree = finalPrice === 0

  const applyCoupon = () => {
    const res = validateCoupon(couponInput, course.price)
    if (!res.ok) { setCouponError(res.error); setAppliedCoupon(null); return }
    setCouponError('')
    setAppliedCoupon(res)
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    // জমা দেওয়ার সময় কুপন আবার যাচাই — মাঝখানে কুপন বন্ধ হয়ে গেলে ছাড়ের দামে জমা নেওয়া যাবে না
    let couponCode = ''
    let couponDiscount = 0
    let priceToPay = course.price
    if (appliedCoupon) {
      const recheck = validateCoupon(appliedCoupon.code, course.price)
      if (!recheck.ok) { setError(`কুপনটি আর প্রযোজ্য নয়: ${recheck.error}`); setAppliedCoupon(null); return }
      couponCode = recheck.code
      couponDiscount = recheck.discount
      priceToPay = recheck.finalPrice
    }
    if (priceToPay > 0 && (!senderNumber.trim() || !txnId.trim())) { setError('যে নম্বর থেকে টাকা পাঠিয়েছেন আর ট্রানজাকশন আইডি/শেষ ৩ সংখ্যা — দুটোই দিন।'); return }
    setBusy(true)
    try {
      await submitOrder({
        courseId: course.id, method,
        senderNumber: senderNumber.trim() || (course.price === 0 ? 'ফ্রি কোর্স' : 'কুপনে ফ্রি'),
        txnId: txnId.trim() || (course.price === 0 ? 'ফ্রি কোর্স' : 'কুপনে ফ্রি'),
        couponCode, couponDiscount, finalPrice: priceToPay,
      })
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
          <h1 className="mt-4 text-2xl font-bold text-ink">{isFree ? 'এনরোলমেন্ট জমা হয়েছে' : 'পেমেন্ট জমা হয়েছে'}</h1>
          <p className="mt-2 text-muted">{isFree ? `অ্যাডমিন অ্যাপ্রুভ করলেই “${course.title}” কোর্সের ক্লাস খুলে যাবে।` : `অ্যাডমিন আপনার ট্রানজাকশন যাচাই করে অ্যাপ্রুভ করলেই “${course.title}” কোর্সের ক্লাস খুলে যাবে।`}</p>
          <button onClick={() => navigate('/my-courses')} className="mt-6 rounded-full bg-primary px-6 py-3 font-bold text-white">আমার কোর্স দেখুন</button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <h1 className="text-3xl font-bold text-ink">{course.price === 0 ? 'ফ্রি এনরোল করুন' : 'কোর্স কিনুন'}</h1>
      <p className="mt-2 text-muted">{course.price === 0 ? 'এই কোর্সটি ফ্রি — এনরোল করলেই অ্যাডমিন অ্যাপ্রুভের পর ক্লাস খুলবে।' : 'পেমেন্ট এই সাইট থেকে সরাসরি নয় — নিচের নম্বরে টাকা পাঠিয়ে তথ্য জমা দিন।'}</p>

      <div className="mt-6 rounded-[2rem] bg-white p-6 shadow-[0_8px_30px_rgba(37,99,235,0.10)] sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">{course.title}</h2>
            <p className="text-sm text-muted">{course.lessons?.length || 0}টি ক্লাস • {course.level}</p>
          </div>
          <div className="text-right">
            {appliedCoupon && <span className="block text-muted line-through">৳{bn(course.price)}</span>}
            <span className="text-2xl font-bold text-ink">৳{bn(finalPrice)}</span>
          </div>
        </div>

        {settings.siteNotice && <p className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm font-semibold text-primary">{settings.siteNotice}</p>}

        {/* কুপন কোড — ছাড় থাকলে আসল দাম কেটে ছাড়ের পরের দাম দেখায় */}
        <div className="mt-6 rounded-2xl bg-page p-4">
          <label className="mb-2 block text-sm font-bold text-ink">কুপন কোড (যদি থাকে)</label>
          {appliedCoupon ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-emerald-50 p-3">
              <p className="text-sm font-bold text-emerald-800">✓ {appliedCoupon.code} — ৳{bn(discount)} ছাড়</p>
              <button type="button" onClick={removeCoupon} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-red-700 shadow-sm">সরান</button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} placeholder="যেমন: SP10"
                  className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-2.5 uppercase focus:border-primary focus:outline-none" />
                <button type="button" onClick={applyCoupon} className="shrink-0 rounded-full bg-primary px-5 py-2.5 font-bold text-white">প্রয়োগ করুন</button>
              </div>
              {couponError && <p className="mt-2 text-sm font-bold text-red-600">{couponError}</p>}
            </>
          )}
        </div>

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
            {isFree ? (
              <p className="mt-1 font-bold text-emerald-700">{course.price === 0 ? 'এই কোর্সটি ফ্রি — টাকা পাঠাতে হবে না।' : 'কুপনে পুরো ছাড় পেয়েছেন — টাকা পাঠাতে হবে না।'}</p>
            ) : payNumber ? (
              <p className="mt-1 text-2xl font-bold tracking-wider text-ink">{payNumber}</p>
            ) : (
              <p className="mt-1 font-bold text-amber-700">পেমেন্ট নম্বর এখনো অ্যাডমিন বসাননি — কেনার আগে অ্যাডমিনের সঙ্গে যোগাযোগ করুন।</p>
            )}
            <p className="mt-1 text-sm font-bold text-ink">পাঠাতে হবে: ৳{bn(finalPrice)}{appliedCoupon ? <span className="font-semibold text-muted"> (আসল দাম ৳{bn(course.price)} — ছাড় ৳{bn(discount)})</span> : ''}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-ink">যে নম্বর থেকে টাকা পাঠিয়েছেন{isFree ? ' (ফ্রি — লাগবে না)' : ''}</label>
            <input required={!isFree} value={senderNumber} onChange={e => setSenderNumber(e.target.value)} placeholder="যেমন: 01XXXXXXXXX"
              className="w-full rounded-2xl border border-blue-100 bg-page px-4 py-3 focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-ink">ট্রানজাকশন আইডি অথবা শেষ ৩ সংখ্যা{isFree ? ' (ফ্রি — লাগবে না)' : ''}</label>
            <input required={!isFree} value={txnId} onChange={e => setTxnId(e.target.value)} placeholder="যেমন: 9H7X2KLMNP অথবা 123"
              className="w-full rounded-2xl border border-blue-100 bg-page px-4 py-3 focus:border-primary focus:outline-none" />
          </div>

          {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <button disabled={busy || (!isFree && !payNumber)} className="w-full rounded-full bg-cta py-3 font-bold text-white hover:bg-cta-dark disabled:opacity-60">
            {busy ? 'জমা হচ্ছে…' : isFree ? 'ফ্রি কোর্সটি নিন' : 'পেমেন্ট জমা দিন'}
          </button>
        </form>
      </div>
    </div>
  )
}
