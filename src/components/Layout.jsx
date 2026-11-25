import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

const THEME_KEY = 'be_theme'

// ডার্ক মোড — পছন্দ localStorage-এ থাকে (ডিফল্ট হালকা মোড)
function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) === 'dark' } catch { return false }
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light') } catch { /* ignore */ }
  }, [dark])
  return (
    <button
      onClick={() => setDark(d => !d)}
      aria-label={dark ? 'হালকা মোডে যান' : 'ডার্ক মোডে যান'}
      title={dark ? 'হালকা মোড' : 'ডার্ক মোড'}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-base hover:bg-blue-100 dark:bg-slate-700 dark:hover:bg-slate-600 sm:h-10 sm:w-10 sm:text-lg"
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

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
    `whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition ${isActive ? 'bg-primary text-white' : 'text-ink hover:bg-blue-50 dark:text-slate-100 dark:hover:bg-slate-700'}`

  return (
    <div className="min-h-screen flex flex-col bg-page dark:bg-slate-900 text-ink dark:bg-slate-950 dark:text-slate-100">
      <DemoBanner firebaseMode={firebaseMode} />
      {/* পিল ন্যাভবার */}
      <header className="sticky top-2 z-40 px-2 sm:top-3 sm:px-6">
        <div className="glass mx-auto flex max-w-6xl items-center justify-between gap-1 rounded-full px-2 py-2 sm:gap-2 sm:px-5">
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyanx text-sm font-bold text-white sm:h-10 sm:w-10 sm:rounded-2xl sm:text-lg">বা</span>
            <span className="leading-tight">
              <span className="block whitespace-nowrap text-xs font-bold text-ink min-[360px]:text-sm dark:text-slate-100 sm:text-lg">বাংলা এডুকেশন</span>
              <span className="hidden text-[11px] font-medium text-muted dark:text-slate-400 sm:block">অনলাইনে শিখুন বাংলায়</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" className={linkCls} end>হোম</NavLink>
            <NavLink to="/courses" className={linkCls}>কোর্সসমূহ</NavLink>
            <NavLink to="/live-classes" className={linkCls}>লাইভ ক্লাস</NavLink>
            <NavLink to="/about" className={linkCls}>আমাদের সম্পর্কে</NavLink>
            {user && <NavLink to="/my-courses" className={linkCls}>আমার কোর্স</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" className={linkCls}>অ্যাডমিন</NavLink>}
            {user?.role === 'teacher' && <NavLink to="/teacher" className={linkCls}>শিক্ষক প্যানেল</NavLink>}
          </nav>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {user && (
              <Link to="/notifications" className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-slate-700 text-base hover:bg-blue-100 sm:h-10 sm:w-10 sm:text-lg" aria-label="নোটিফিকেশন">
                🔔
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{unreadNotifications > 9 ? '৯+' : unreadNotifications}</span>
                )}
              </Link>
            )}
            {user ? (
              <>
                <span className="hidden max-w-32 truncate text-sm font-semibold text-ink dark:text-slate-100 lg:block">{user.name}</span>
                <button onClick={onLogout} className="whitespace-nowrap rounded-full bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-deep sm:px-4 sm:py-2 sm:text-sm">লগআউট</button>
              </>
            ) : (
              <>
                <Link to="/login" className="whitespace-nowrap rounded-full px-2 py-1.5 text-xs font-semibold text-ink dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-700 sm:px-3 sm:py-2 sm:text-sm">লগইন</Link>
                <Link to="/register" className="whitespace-nowrap rounded-full bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark sm:px-4 sm:py-2 sm:text-sm">রেজিস্টার</Link>
              </>
            )}
          </div>
        </div>
        {/* মোবাইল ন্যাভ */}
        <div className="glass mx-auto mt-2 flex max-w-6xl items-center gap-1 overflow-x-auto rounded-full px-2 py-1.5 md:hidden">
          <NavLink to="/" className={linkCls} end>হোম</NavLink>
          <NavLink to="/courses" className={linkCls}>কোর্সসমূহ</NavLink>
          <NavLink to="/live-classes" className={linkCls}>লাইভ ক্লাস</NavLink>
          <NavLink to="/about" className={linkCls}>আমাদের সম্পর্কে</NavLink>
          {user && <NavLink to="/my-courses" className={linkCls}>আমার কোর্স</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" className={linkCls}>অ্যাডমিন</NavLink>}
          {user?.role === 'teacher' && <NavLink to="/teacher" className={linkCls}>শিক্ষক প্যানেল</NavLink>}
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>

      {/* গাঢ় নেভি ফুটার — মোবাইলে পুরো প্রস্থে (full-bleed), ডেস্কটপ আগের মতো */}
      <footer className="mt-16 w-full bg-navy text-white">
        <div className="mx-auto grid w-full gap-8 px-5 py-12 sm:max-w-6xl sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyanx text-lg font-bold">বা</span>
              <span className="text-lg font-bold">বাংলা এডুকেশন</span>
            </div>
            <p className="mt-3 text-sm text-white/70">বাংলায় সহজ করে শেখা — ভিডিও ক্লাস, নোটের PDF আর বিকাশ/নগদে সহজ পেমেন্ট।</p>
          </div>
          <div>
            <h3 className="font-bold">দ্রুত লিংক</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-white/70 sm:block sm:space-y-2">
              <li><Link className="hover:text-white" to="/courses">কোর্সসমূহ</Link></li>
              <li><Link className="hover:text-white" to="/live-classes">লাইভ ক্লাস</Link></li>
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
