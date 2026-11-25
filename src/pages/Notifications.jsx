import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'

// নোটিফিকেশন শুধু অ্যাপের ভেতরেই দেখা যায় — ইমেইল বা SMS যায় না।
export default function Notifications() {
  const { user, authLoading, notifications, markNotificationRead, markAllNotificationsRead } = useStore()

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
        <h1 className="text-2xl font-bold text-ink">নোটিফিকেশন দেখতে লগইন করুন</h1>
        <Link to="/login" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">লগইন করুন</Link>
      </div>
    )
  }

  const unread = notifications.filter(n => !n.read).length

  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-ink">নোটিফিকেশন</h1>
          <p className="mt-1 text-muted">পেমেন্ট অ্যাপ্রুভ বা বাতিল হলে এখানেই খবর আসবে। ইমেইল বা SMS যায় না — শুধু অ্যাপের ভেতরে দেখা যায়।</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllNotificationsRead} className="rounded-full bg-primary px-5 py-2.5 font-bold text-white">সব পড়া হয়েছে</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-8 rounded-[2rem] bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-bold text-ink">এখনো কোনো নোটিফিকেশন নেই</p>
          <p className="mt-1 text-muted">কোর্স কিনে পেমেন্ট জমা দিলে অ্যাডমিনের সিদ্ধান্তের খবর এখানে আসবে।</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {notifications.map(n => (
            <div key={n.id} className={`rounded-3xl p-5 shadow-sm ${n.read ? 'bg-white' : 'bg-blue-50 ring-2 ring-primary/30'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-ink">{n.type === 'order_approved' ? '✅' : n.type === 'order_rejected' ? '❌' : '🔔'} {n.title}</p>
                  <p className="mt-1 text-sm text-muted">{n.message}</p>
                  <p className="mt-1 text-xs text-muted">{n.createdAt ? new Date(n.createdAt).toLocaleString('bn-BD') : ''}</p>
                </div>
                {!n.read && (
                  <button onClick={() => markNotificationRead(n.id)} className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary shadow-sm">পড়া হয়েছে</button>
                )}
              </div>
              {n.courseTitle && (
                <Link to="/my-courses" className="mt-3 inline-block text-sm font-bold text-primary">আমার কোর্স দেখুন →</Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
