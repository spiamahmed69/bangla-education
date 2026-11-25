import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

function Card({ title, subtitle, children }) {
  return (
    <div className="mx-auto mt-12 w-full max-w-md px-5">
      <div className="rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgba(37,99,235,0.10)]">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

const inputCls = 'w-full rounded-2xl border border-blue-100 bg-page px-4 py-3 focus:border-primary focus:outline-none'

export function Login() {
  const { login, firebaseMode } = useStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const r = await login(email.trim(), password)
      if (firebaseMode && !r.emailVerified) {
        setError('আপনার ইমেইল এখনো যাচাই হয়নি। রেজিস্টারের সময় পাঠানো যাচাই লিংকে ক্লিক করুন, তারপর লগইন করুন।')
        setBusy(false)
        return
      }
      navigate('/my-courses')
    } catch (err) {
      setError(err.message || 'লগইন করা যায়নি। আবার চেষ্টা করুন।')
      setBusy(false)
    }
  }

  return (
    <Card title="লগইন করুন" subtitle="ইমেইল যাচাই করা অ্যাকাউন্টে পাসওয়ার্ড দিয়ে লগইন করুন।">
      <form onSubmit={submit} className="space-y-4">
        <input className={inputCls} type="email" required placeholder="ইমেইল" value={email} onChange={e => setEmail(e.target.value)} />
        <input className={inputCls} type="password" required placeholder="পাসওয়ার্ড" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-full bg-primary py-3 font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {busy ? 'লগইন হচ্ছে…' : 'লগইন'}
        </button>
      </form>
      <p className="mt-4 rounded-2xl bg-blue-50 p-3 text-xs leading-relaxed text-muted">
        এক অ্যাকাউন্টে সর্বোচ্চ ২টি ডিভাইসে (মোবাইল/কম্পিউটার) লগইন করা যাবে। ৩য় ডিভাইসে লগইন করতে হলে আগের একটি ডিভাইস থেকে লগআউট করতে হবে।
      </p>
      <p className="mt-4 text-center text-sm text-muted">অ্যাকাউন্ট নেই? <Link to="/register" className="font-bold text-primary">রেজিস্টার করুন</Link></p>
    </Card>
  )
}

export function Register() {
  const { register, firebaseMode } = useStore()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    if (password.length < 6) { setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'); setBusy(false); return }
    try {
      const r = await register(name.trim(), email.trim(), password)
      if (r.needsVerification) { setDone(true); setBusy(false); return }
      navigate('/courses')
    } catch (err) {
      setError(err.message || 'রেজিস্টার করা যায়নি। আবার চেষ্টা করুন।')
      setBusy(false)
    }
  }

  if (done) {
    return (
      <Card title="ইমেইল যাচাই করুন" subtitle="আপনার ইমেইলে একটি যাচাই লিংক পাঠানো হয়েছে।">
        <p className="text-sm leading-relaxed text-muted">
          <b className="text-ink">{email}</b> ঠিকানায় পাঠানো লিংকে ক্লিক করে ইমেইল যাচাই করুন। তারপর থেকে পাসওয়ার্ড দিয়ে লগইন করতে পারবেন।
        </p>
        <Link to="/login" className="mt-6 block rounded-full bg-primary py-3 text-center font-bold text-white">লগইন পেজে যান</Link>
      </Card>
    )
  }

  return (
    <Card title="অ্যাকাউন্ট খুলুন" subtitle="প্রথমে ইমেইলে যাচাই লিংক যাবে — যাচাইয়ের পর থেকে পাসওয়ার্ড দিয়ে লগইন করবেন।">
      <form onSubmit={submit} className="space-y-4">
        <input className={inputCls} required placeholder="আপনার নাম" value={name} onChange={e => setName(e.target.value)} />
        <input className={inputCls} type="email" required placeholder="ইমেইল" value={email} onChange={e => setEmail(e.target.value)} />
        <input className={inputCls} type="password" required placeholder="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-full bg-primary py-3 font-bold text-white hover:bg-primary-dark disabled:opacity-60">
          {busy ? 'অ্যাকাউন্ট খোলা হচ্ছে…' : 'রেজিস্টার করুন'}
        </button>
      </form>
      {!firebaseMode && (
        <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          ডেমো মোডে ইমেইল পাঠানো যায় না, তাই এখানে রেজিস্টার করলেই সরাসরি লগইন হয়ে যাবে। আসল Firebase যুক্ত হলে প্রথমে ইমেইল যাচাই লিংক যাবে।
        </p>
      )}
      <p className="mt-4 text-center text-sm text-muted">ইতিমধ্যে অ্যাকাউন্ট আছে? <Link to="/login" className="font-bold text-primary">লগইন করুন</Link></p>
    </Card>
  )
}
