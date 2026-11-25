import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

function DemoBanner({ firebaseMode }) {
  if (firebaseMode) return null
  return (
    <div className="bg-amber-400 text-amber-950 text-center text-sm font-semibold px-3 py-2">
      ডেমো মোড — আসল Firebase এখনো যুক্ত হয়নি। ডেমো অ্যাকাউন্ট: admin@demo.local / admin123
    </div>
  )
}

export function CoverArt({ title, gradient, imageUrl, className = '' }) {
  const initials = (title || 'বা').trim().slice(0, 2)
  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img src={imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
      </div>
    )
  }
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: gradient || 'linear-gradient(135deg,#2563EB,#06B6D4)' }}
    >
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15" />
      <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="relative text-center px-3">
        <div className="text-4xl font-bold text-white leading-none">{initials}</div>
        <div className="mt-2 text-[11px] font-semibold tracking-wide text-white/85">বাংলা এডুকেশন</div>
      </div>
      <span className="absolute top-2 left-2 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-semibold text-white">নমুনা</span>
    </div>
  )
}

export default function Layout({ children }) {
  const { user, logout, firebaseMode, unreadNotifications } = useStore()
  const navigate = useNavigate()
  const onLogout = async () => { await logout(); navigate('/') }
  const linkCls = ({ isActive }) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition ${isActive ? 'bg-primary text-white' : 'text-ink hover:bg-blue-50'}`

  return (
    <div className="min-h-screen flex flex-col">
      <DemoBanner firebaseMode={firebaseMode} />
      {/* পিল ন্যাভবার */}
      <header className="sticky top-3 z-40 px-3 sm:px-6">
        <div className="glass mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full px-3 py-2 sm:px-5">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyanx text-lg font-bold text-white">বা</span>
            <span className="leading-tight">
              <span className="block text-base font-bold text-ink sm:text-lg">বাংলা এডুকেশন</span>
              <span className="hidden text-[11px] font-medium text-muted sm:block">অনলাইনে শিখুন বাংলায়</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" className={linkCls} end>হোম</NavLink>
            <NavLink to="/courses" className={linkCls}>কোর্সসমূহ</NavLink>
            <NavLink to="/about" className={linkCls}>আমাদের সম্পর্কে</NavLink>
            {user && <NavLink to="/my-courses" className={linkCls}>আমার কোর্স</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" className={linkCls}>অ্যাডমিন</NavLink>}
            {user?.role === 'teacher' && <NavLink to="/teacher" className={linkCls}>শিক্ষক প্যানেল</NavLink>}
          </nav>
          <div className="flex items-center gap-2">
            {user && (
              <Link to="/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-lg hover:bg-blue-100" aria-label="নোটিফিকেশন">
                🔔
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{unreadNotifications > 9 ? '৯+' : unreadNotifications}</span>
                )}
              </Link>
            )}
            {user ? (
              <>
                <span className="hidden max-w-32 truncate text-sm font-semibold text-ink lg:block">{user.name}</span>
                <button onClick={onLogout} className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-deep">লগআউট</button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-full px-3 py-2 text-sm font-semibold text-ink hover:bg-blue-50">লগইন</Link>
                <Link to="/register" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark">রেজিস্টার</Link>
              </>
            )}
          </div>
        </div>
        {/* মোবাইল ন্যাভ */}
        <div className="glass mx-auto mt-2 flex max-w-6xl items-center gap-1 overflow-x-auto rounded-full px-2 py-1.5 md:hidden">
          <NavLink to="/" className={linkCls} end>হোম</NavLink>
          <NavLink to="/courses" className={linkCls}>কোর্সসমূহ</NavLink>
          <NavLink to="/about" className={linkCls}>আমাদের সম্পর্কে</NavLink>
          {user && <NavLink to="/my-courses" className={linkCls}>আমার কোর্স</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" className={linkCls}>অ্যাডমিন</NavLink>}
          {user?.role === 'teacher' && <NavLink to="/teacher" className={linkCls}>শিক্ষক প্যানেল</NavLink>}
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>

      {/* গাঢ় নেভি ফুটার */}
      <footer className="mt-16 bg-navy text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyanx text-lg font-bold">বা</span>
              <span className="text-lg font-bold">বাংলা এডুকেশন</span>
            </div>
            <p className="mt-3 text-sm text-white/70">বাংলায় সহজ করে শেখা — ভিডিও ক্লাস, নোটের PDF আর বিকাশ/নগদে সহজ পেমেন্ট।</p>
          </div>
          <div>
            <h3 className="font-bold">দ্রুত লিংক</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li><Link className="hover:text-white" to="/courses">কোর্সসমূহ</Link></li>
              <li><Link className="hover:text-white" to="/my-courses">আমার কোর্স</Link></li>
              <li><Link className="hover:text-white" to="/about">আমাদের সম্পর্কে</Link></li>
              <li><Link className="hover:text-white" to="/contact">যোগাযোগ</Link></li>
              <li><Link className="hover:text-white" to="/faq">সাধারণ প্রশ্ন (FAQ)</Link></li>
              <li><Link className="hover:text-white" to="/refund-policy">রিফান্ড নীতিমালা</Link></li>
              <li><Link className="hover:text-white" to="/login">লগইন</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold">যোগাযোগ</h3>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>ফোন: <a href="tel:01400661593" className="font-semibold text-white hover:underline">01400661593</a></li>
              <li>ইমেইল: <a href="mailto:banglaacademy111@gmail.com" className="break-all font-semibold text-white hover:underline">banglaacademy111@gmail.com</a></li>
              <li>Telegram: <a href="https://t.me/banglaacademy111" target="_blank" rel="noreferrer" className="font-semibold text-white hover:underline">t.me/banglaacademy111</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
          © {new Date().getFullYear()} বাংলা এডুকেশন — Project: NLITH AGENCY
        </div>
      </footer>
    </div>
  )
}
