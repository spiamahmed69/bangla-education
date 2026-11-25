import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { isFirebaseConfigured, auth, db } from './firebase'
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendEmailVerification, onAuthStateChanged,
} from 'firebase/auth'
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where,
} from 'firebase/firestore'
import { SAMPLE_COURSES, DEFAULT_SETTINGS } from './sampleData'

const StoreContext = createContext(null)
export const useStore = () => useContext(StoreContext)

const DEMO_KEY = 'be_demo_v1'
const SESSION_KEY = 'be_session_v1'
const DEVICE_KEY = 'be_device_id'

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

function seedDemo() {
  return {
    users: [
      { uid: 'demo-admin', email: 'admin@demo.local', name: 'ডেমো অ্যাডমিন', password: 'admin123', role: 'admin', devices: [] },
    ],
    courses: SAMPLE_COURSES,
    settings: DEFAULT_SETTINGS,
    orders: [],
    enrollments: [],
    reviews: [],
    coupons: [],
    progress: [],
    quizzes: {},
  }
}

function loadDemo() {
  try {
    const raw = localStorage.getItem(DEMO_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.courses) return parsed
    }
  } catch { /* ignore */ }
  const seeded = seedDemo()
  localStorage.setItem(DEMO_KEY, JSON.stringify(seeded))
  return seeded
}

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [courses, setCourses] = useState(SAMPLE_COURSES)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [orders, setOrders] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [reviews, setReviews] = useState([])
  const [coupons, setCoupons] = useState([])
  const [progress, setProgress] = useState([])
  const [quizzes, setQuizzes] = useState({})
  const [dataLoading, setDataLoading] = useState(true)

  const firebaseMode = isFirebaseConfigured

  // ---------- Demo persistence ----------
  const persistDemo = useCallback((patch) => {
    const current = loadDemo()
    const next = { ...current, ...patch }
    localStorage.setItem(DEMO_KEY, JSON.stringify(next))
  }, [])

  // ---------- Load data ----------
  useEffect(() => {
    const load = async () => {
      if (firebaseMode) {
        try {
          const cs = await getDocs(collection(db, 'courses'))
          if (!cs.empty) {
            const list = []
            for (const d of cs.docs) {
              const data = d.data()
              const ls = await getDocs(collection(db, 'courses', d.id, 'lessons'))
              list.push({ id: d.id, ...data, lessons: ls.docs.map(x => ({ id: x.id, ...x.data() })) })
            }
            // আসল কোর্সের সাথে ১০টি ডেমো (নমুনা) কোর্সও দেখাবে
            setCourses([...list, ...SAMPLE_COURSES.filter(s => !list.some(c => c.id === s.id))])
          }
          const s = await getDoc(doc(db, 'settings', 'payment'))
          if (s.exists()) {
            // Firestore-এ খালি স্ট্রিং থাকলে তা ডিফল্ট নম্বর মুছে দিত — খালি মান বাদ দিয়ে মার্জ করা হয়
            const saved = Object.fromEntries(
              Object.entries(s.data()).filter(([, v]) => !(typeof v === 'string' && v.trim() === ''))
            )
            setSettings({ ...DEFAULT_SETTINGS, ...saved })
          }
          const os = await getDocs(collection(db, 'orders'))
          setOrders(os.docs.map(d => ({ id: d.id, ...d.data() })))
          const es = await getDocs(collection(db, 'enrollments'))
          setEnrollments(es.docs.map(d => ({ id: d.id, ...d.data() })))
          const us = await getDocs(collection(db, 'users'))
          setAllUsers(us.docs.map(d => ({ uid: d.id, ...d.data() })))
          // রিভিউ: নিয়ম (firestore.rules) এখনো কনসোলে প্রকাশ না হলে পড়া যাবে না —
          // সেক্ষেত্রে খালি রিভিউ দেখাবে, বাকি ডেটা আটকাবে না।
          try {
            const rs = await getDocs(collection(db, 'reviews'))
            setReviews(rs.docs.map(d => ({ id: d.id, ...d.data() })))
          } catch (e) {
            console.warn('রিভিউ পড়া যায়নি (নিয়ম প্রকাশ করা হয়নি হয়তো):', e)
            setReviews([])
          }
          // কুপন: নিয়ম এখনো কনসোলে প্রকাশ না হলে পড়া যাবে না —
          // সেক্ষেত্রে কোনো কুপন দেখাবে না, বাকি ডেটা আটকাবে না।
          try {
            const qs = await getDocs(collection(db, 'coupons'))
            setCoupons(qs.docs.map(d => ({ id: d.id, ...d.data() })))
          } catch (e) {
            console.warn('কুপন পড়া যায়নি (নিয়ম প্রকাশ করা হয়নি হয়তো):', e)
            setCoupons([])
          }
        } catch (e) {
          console.warn('Firebase ডেটা পড়া যায়নি, নমুনা ডেটা দেখানো হচ্ছে:', e)
        }
      } else {
        const demo = loadDemo()
        setCourses(demo.courses)
        setSettings(demo.settings)
        setOrders(demo.orders)
        setEnrollments(demo.enrollments)
        setReviews(demo.reviews || [])
        setCoupons(demo.coupons || [])
        setProgress(demo.progress || [])
        setQuizzes(demo.quizzes || {})
        setAllUsers(demo.users.map(({ password, ...u }) => u))
      }
      setDataLoading(false)
    }
    load()
  }, [firebaseMode])

  // ---------- Auth ----------
  useEffect(() => {
    if (firebaseMode) {
      const unsub = onAuthStateChanged(auth, async (fbUser) => {
        if (!fbUser) { setUser(null); setAuthLoading(false); return }
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid))
          const profile = snap.exists() ? snap.data() : {}
          setUser({ uid: fbUser.uid, email: fbUser.email, name: profile.name || fbUser.email, role: profile.role || 'student', devices: profile.devices || [], emailVerified: fbUser.emailVerified })
        } catch {
          setUser({ uid: fbUser.uid, email: fbUser.email, name: fbUser.email, role: 'student', devices: [], emailVerified: fbUser.emailVerified })
        }
        setAuthLoading(false)
      })
      return unsub
    }
    try {
      const sess = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
      if (sess) {
        const demo = loadDemo()
        const u = demo.users.find(x => x.uid === sess.uid)
        if (u) setUser({ uid: u.uid, email: u.email, name: u.name, role: u.role, devices: u.devices || [], emailVerified: true })
      }
    } catch { /* ignore */ }
    setAuthLoading(false)
  }, [firebaseMode])

  // ---------- Progress: লগইন হওয়ার পর নিজের প্রোগ্রেস পড়া ----------
  // নিয়ম (firestore.rules) এখনো কনসোলে প্রকাশ না হলে পড়া যাবে না —
  // সেক্ষেত্রে প্রোগ্রেস খালি দেখাবে, বাকি ডেটা আটকাবে না।
  useEffect(() => {
    if (!firebaseMode) return
    if (!user) { setProgress([]); return }
    let alive = true
    const load = async () => {
      try {
        const ps = await getDocs(query(collection(db, 'progress'), where('userId', '==', user.uid)))
        if (alive) setProgress(ps.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) {
        console.warn('প্রোগ্রেস পড়া যায়নি (নিয়ম প্রকাশ করা হয়নি হয়তো):', e)
        if (alive) setProgress([])
      }
    }
    load()
    return () => { alive = false }
  }, [firebaseMode, user])

  const enforceDeviceLimit = useCallback(async (profile) => {
    const deviceId = getDeviceId()
    const devices = profile.devices || []
    if (devices.includes(deviceId)) return devices
    if (devices.length >= 2) {
      throw new Error('এই অ্যাকাউন্টে সর্বোচ্চ ২টি ডিভাইসে লগইন করা যাবে। অন্য একটি ডিভাইস থেকে লগআউট করে আবার চেষ্টা করুন।')
    }
    return [...devices, deviceId]
  }, [])

  const register = useCallback(async (name, email, password) => {
    if (firebaseMode) {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await sendEmailVerification(cred.user)
      const devices = [getDeviceId()]
      await setDoc(doc(db, 'users', cred.user.uid), { email, name, role: 'student', devices, createdAt: new Date().toISOString() })
      return { needsVerification: true }
    }
    const demo = loadDemo()
    if (demo.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('এই ইমেইলে ইতিমধ্যে অ্যাকাউন্ট আছে। লগইন করুন।')
    }
    const uid = `demo-${Date.now()}`
    const devices = [getDeviceId()]
    demo.users.push({ uid, email, name, password, role: 'student', devices })
    persistDemo({ users: demo.users })
    setAllUsers(demo.users.map(({ password: _p, ...u }) => u))
    localStorage.setItem(SESSION_KEY, JSON.stringify({ uid }))
    setUser({ uid, email, name, role: 'student', devices, emailVerified: true })
    return { needsVerification: false }
  }, [firebaseMode, persistDemo])

  const login = useCallback(async (email, password) => {
    if (firebaseMode) {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      const profile = snap.exists() ? snap.data() : { devices: [] }
      const devices = await enforceDeviceLimit(profile)
      if (devices.length !== (profile.devices || []).length) {
        await updateDoc(doc(db, 'users', cred.user.uid), { devices })
      }
      return { emailVerified: cred.user.emailVerified }
    }
    const demo = loadDemo()
    const u = demo.users.find(x => x.email.toLowerCase() === email.toLowerCase())
    if (!u || u.password !== password) throw new Error('ইমেইল বা পাসওয়ার্ড ভুল।')
    const devices = await enforceDeviceLimit(u)
    if (devices.length !== (u.devices || []).length) {
      u.devices = devices
      persistDemo({ users: demo.users })
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify({ uid: u.uid }))
    setUser({ uid: u.uid, email: u.email, name: u.name, role: u.role, devices, emailVerified: true })
    return { emailVerified: true }
  }, [firebaseMode, enforceDeviceLimit, persistDemo])

  const logout = useCallback(async () => {
    if (firebaseMode) { await signOut(auth) }
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [firebaseMode])

  const logoutDevice = useCallback(async (uid, deviceId) => {
    // অ্যাডমিন বা নিজে কোনো ডিভাইস থেকে লগআউট করানো
    if (firebaseMode) {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists()) {
        const devices = (snap.data().devices || []).filter(d => d !== deviceId)
        await updateDoc(doc(db, 'users', uid), { devices })
      }
    } else {
      const demo = loadDemo()
      const u = demo.users.find(x => x.uid === uid)
      if (u) { u.devices = (u.devices || []).filter(d => d !== deviceId); persistDemo({ users: demo.users }) }
    }
    setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, devices: (u.devices || []).filter(d => d !== deviceId) } : u))
  }, [firebaseMode, persistDemo])

  // ---------- Orders & enrollments ----------
  const isEnrolled = useCallback((courseId) => {
    if (!user) return false
    return enrollments.some(e => e.userId === user.uid && e.courseId === courseId && e.status === 'active')
  }, [user, enrollments])

  const pendingOrderFor = useCallback((courseId) => {
    if (!user) return null
    return orders.find(o => o.userId === user.uid && o.courseId === courseId && o.status === 'pending') || null
  }, [user, orders])

  // ছাত্র সংখ্যা — আসল এনরোলমেন্ট গুনে: এক কোর্সে কতজন সক্রিয়ভাবে কিনেছে
  const enrollmentCount = useCallback((courseId) =>
    enrollments.filter(e => e.courseId === courseId && e.status === 'active').length,
  [enrollments])

  const submitOrder = useCallback(async ({ courseId, method, senderNumber, txnId, couponCode = '', couponDiscount = 0, finalPrice = null }) => {
    const course = courses.find(c => c.id === courseId)
    const originalPrice = course?.price || 0
    // price = আসলে যা পাঠাতে হবে (কুপন ছাড়ের পরের দাম); originalPrice = কোর্সের আসল দাম।
    // অ্যাডমিন অর্ডার দেখে যাচাই করতে পারে ছাত্র ঠিক ছাড়-দামটাই পাঠিয়েছে কি না।
    const price = finalPrice != null ? Math.max(0, Number(finalPrice) || 0) : originalPrice
    const order = {
      userId: user.uid, userEmail: user.email, courseId, courseTitle: course?.title || courseId,
      price, originalPrice, couponCode: couponCode || '', couponDiscount: Number(couponDiscount) || 0,
      method, senderNumber, txnId,
      status: 'pending', createdAt: new Date().toISOString(),
    }
    if (firebaseMode) {
      const ref = doc(collection(db, 'orders'))
      await setDoc(ref, order)
      setOrders(prev => [...prev, { id: ref.id, ...order }])
      return ref.id
    }
    const id = `ord-${Date.now()}`
    const demo = loadDemo()
    demo.orders.push({ id, ...order })
    persistDemo({ orders: demo.orders })
    setOrders(prev => [...prev, { id, ...order }])
    return id
  }, [firebaseMode, user, courses, persistDemo])

  const decideOrder = useCallback(async (orderId, decision) => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    if (firebaseMode) {
      await updateDoc(doc(db, 'orders', orderId), { status: decision })
      if (decision === 'approved') {
        const enrId = `${order.userId}_${order.courseId}`
        await setDoc(doc(db, 'enrollments', enrId), { userId: order.userId, courseId: order.courseId, status: 'active', approvedAt: new Date().toISOString() })
      }
    } else {
      const demo = loadDemo()
      demo.orders = demo.orders.map(o => o.id === orderId ? { ...o, status: decision } : o)
      if (decision === 'approved' && !demo.enrollments.some(e => e.userId === order.userId && e.courseId === order.courseId)) {
        demo.enrollments.push({ id: `${order.userId}_${order.courseId}`, userId: order.userId, courseId: order.courseId, status: 'active', approvedAt: new Date().toISOString() })
      }
      persistDemo({ orders: demo.orders, enrollments: demo.enrollments })
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: decision } : o))
    if (decision === 'approved') {
      setEnrollments(prev => prev.some(e => e.userId === order.userId && e.courseId === order.courseId)
        ? prev
        : [...prev, { id: `${order.userId}_${order.courseId}`, userId: order.userId, courseId: order.courseId, status: 'active' }])
    }
  }, [firebaseMode, orders, persistDemo])

  // ---------- Admin: courses / lessons / settings / users ----------
  const saveCourse = useCallback(async (course) => {
    if (firebaseMode) {
      const { lessons, id, ...fields } = course
      const ref = id ? doc(db, 'courses', id) : doc(collection(db, 'courses'))
      await setDoc(ref, fields, { merge: true })
      if (lessons) {
        for (const l of lessons) {
          const { youtubeId, ...rest } = l
          const isFree = !!l.isFree
          // ফ্রি ডেমো ক্লাস: শুধু অ্যাডমিন যেটাকে ফ্রি চিহ্ন দিয়েছে, শুধু সেটার
          // ভিডিও ID-ই পাবলিক লেসন ডকে (demoYoutubeId) যায় — সবাই পড়তে পারে।
          // ফ্রি নয় এমন লেসনের youtubeId কখনো পাবলিক ডকে যায় না; সেটা শুধু
          // lessonAccess-এ থাকে, যা শুধু এনরোল করা ইউজার/অ্যাডমিন পড়তে পারে।
          const lessonFields = { ...rest, isFree, demoYoutubeId: isFree ? (youtubeId || '') : '' }
          await setDoc(doc(db, 'courses', ref.id, 'lessons', l.id), lessonFields, { merge: true })
          // ভিডিও URL আলাদা lessonAccess-এ — শুধু এনরোল করা ইউজারই পড়তে পারে (firestore.rules দেখুন)
          await setDoc(doc(db, 'courses', ref.id, 'lessonAccess', l.id), { youtubeId: youtubeId || '' }, { merge: true })
        }
      }
      const saved = { ...course, id: ref.id }
      setCourses(prev => prev.some(c => c.id === ref.id) ? prev.map(c => c.id === ref.id ? saved : c) : [...prev, saved])
      return ref.id
    }
    const demo = loadDemo()
    const saved = { ...course, id: course.id || `c-${Date.now()}` }
    demo.courses = demo.courses.some(c => c.id === saved.id)
      ? demo.courses.map(c => c.id === saved.id ? saved : c)
      : [...demo.courses, saved]
    persistDemo({ courses: demo.courses })
    setCourses(demo.courses)
    return saved.id
  }, [firebaseMode, persistDemo])

  const deleteCourse = useCallback(async (courseId) => {
    if (firebaseMode) { await deleteDoc(doc(db, 'courses', courseId)) }
    else {
      const demo = loadDemo()
      demo.courses = demo.courses.filter(c => c.id !== courseId)
      persistDemo({ courses: demo.courses })
    }
    setCourses(prev => prev.filter(c => c.id !== courseId))
  }, [firebaseMode, persistDemo])

  const saveSettings = useCallback(async (next) => {
    if (firebaseMode) { await setDoc(doc(db, 'settings', 'payment'), next, { merge: true }) }
    else persistDemo({ settings: next })
    setSettings(next)
  }, [firebaseMode, persistDemo])

  const setUserRole = useCallback(async (uid, role) => {
    if (firebaseMode) { await updateDoc(doc(db, 'users', uid), { role }) }
    else {
      const demo = loadDemo()
      const u = demo.users.find(x => x.uid === uid)
      if (u) { u.role = role; persistDemo({ users: demo.users }) }
    }
    setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u))
    if (user?.uid === uid) setUser(prev => prev ? { ...prev, role } : prev)
  }, [firebaseMode, persistDemo, user])

  // ---------- Coupons: অ্যাডমিন বানায়, চেকআউটে সবাই যাচাই করতে পারে ----------
  // কোনো কুপন সিড করা হয় না — অ্যাডমিন প্যানেল থেকে প্রথম কুপন বানাতে হবে।
  const calcCouponDiscount = (coupon, price) => {
    if (!coupon || !coupon.active) return 0
    const p = Number(price) || 0
    if (coupon.discountType === 'fixed') return Math.min(p, Math.max(0, Number(coupon.value) || 0))
    const pct = Math.min(100, Math.max(0, Number(coupon.value) || 0))
    return Math.min(p, Math.round((p * pct) / 100))
  }

  const validateCoupon = useCallback((rawCode, price) => {
    const code = (rawCode || '').trim().toUpperCase()
    if (!code) return { ok: false, error: 'কুপন কোড লিখুন।' }
    const coupon = coupons.find(c => (c.code || '').toUpperCase() === code)
    if (!coupon) return { ok: false, error: 'এই কুপন কোডটি পাওয়া যায়নি।' }
    if (!coupon.active) return { ok: false, error: 'এই কুপনটি এখন বন্ধ আছে।' }
    const discount = calcCouponDiscount(coupon, price)
    return { ok: true, coupon, code, discount, finalPrice: Math.max(0, (Number(price) || 0) - discount) }
  }, [coupons])

  const saveCoupon = useCallback(async (coupon) => {
    if (!user || user.role !== 'admin') throw new Error('শুধু অ্যাডমিন কুপন বানাতে পারে।')
    const code = (coupon.code || '').trim().toUpperCase()
    if (!code) throw new Error('কুপন কোড লিখুন।')
    if (!/^[A-Z0-9]+$/.test(code)) throw new Error('কুপন কোডে শুধু ইংরেজি অক্ষর ও সংখ্যা ব্যবহার করুন।')
    const discountType = coupon.discountType === 'fixed' ? 'fixed' : 'percent'
    const value = Number(coupon.value) || 0
    if (discountType === 'percent' && (value < 1 || value > 100)) throw new Error('শতাংশ ছাড় ১ থেকে ১০০-এর মধ্যে হতে হবে।')
    if (discountType === 'fixed' && value <= 0) throw new Error('নির্দিষ্ট টাকার ছাড় ০-এর বেশি হতে হবে।')
    const saved = { code, discountType, value, active: coupon.active !== false, createdAt: coupon.createdAt || new Date().toISOString() }
    if (firebaseMode) {
      await setDoc(doc(db, 'coupons', code), saved, { merge: true })
    } else {
      const demo = loadDemo()
      const list = demo.coupons || []
      demo.coupons = list.some(c => c.code === code)
        ? list.map(c => c.code === code ? saved : c)
        : [...list, saved]
      persistDemo({ coupons: demo.coupons })
    }
    setCoupons(prev => prev.some(c => c.code === code)
      ? prev.map(c => c.code === code ? saved : c)
      : [...prev, saved])
    return code
  }, [firebaseMode, user, persistDemo])

  const deleteCoupon = useCallback(async (code) => {
    if (!user || user.role !== 'admin') throw new Error('শুধু অ্যাডমিন কুপন মুছতে পারে।')
    const upper = (code || '').trim().toUpperCase()
    if (firebaseMode) { await deleteDoc(doc(db, 'coupons', upper)) }
    else {
      const demo = loadDemo()
      demo.coupons = (demo.coupons || []).filter(c => c.code !== upper)
      persistDemo({ coupons: demo.coupons })
    }
    setCoupons(prev => prev.filter(c => c.code !== upper))
  }, [firebaseMode, user, persistDemo])

  // ---------- Progress: শিক্ষার্থী নিজে ক্লাস "সম্পন্ন" চিহ্ন দেয় ----------
  // ভিডিও দেখা স্বয়ংক্রিয়ভাবে মাপা হয় না — YouTube প্লেয়ার দিয়ে নির্ভরযোগ্যভাবে
  // দেখা প্রমাণ করা যায় না, তাই হাতে টিক দেওয়ার ব্যবস্থাই সৎ উপায়।
  const completedLessonIds = useCallback((courseId) => {
    if (!user) return []
    const p = progress.find(x => x.userId === user.uid && x.courseId === courseId)
    return p?.completedLessonIds || []
  }, [user, progress])

  const progressPct = useCallback((courseId, totalLessons) => {
    const total = Number(totalLessons) || 0
    if (total === 0) return 0
    return Math.round((completedLessonIds(courseId).length / total) * 100)
  }, [completedLessonIds])

  const toggleLessonComplete = useCallback(async (courseId, lessonId) => {
    if (!user) throw new Error('প্রোগ্রেস রাখতে প্রথমে লগইন করুন।')
    if (!isEnrolled(courseId)) throw new Error('শুধু এই কোর্স কেনা শিক্ষার্থীরাই প্রোগ্রেস রাখতে পারে।')
    const current = completedLessonIds(courseId)
    const next = current.includes(lessonId)
      ? current.filter(id => id !== lessonId)
      : [...current, lessonId]
    const id = `${user.uid}_${courseId}`
    const entry = { userId: user.uid, courseId, completedLessonIds: next, updatedAt: new Date().toISOString() }
    if (firebaseMode) {
      await setDoc(doc(db, 'progress', id), entry, { merge: true })
    } else {
      const demo = loadDemo()
      const list = demo.progress || []
      demo.progress = list.some(x => x.id === id)
        ? list.map(x => x.id === id ? { ...x, ...entry, id } : x)
        : [...list, { id, ...entry }]
      persistDemo({ progress: demo.progress })
    }
    setProgress(prev => prev.some(x => x.id === id)
      ? prev.map(x => x.id === id ? { ...x, ...entry, id } : x)
      : [...prev, { id, ...entry }])
    return next
  }, [firebaseMode, user, isEnrolled, completedLessonIds, persistDemo])

  const progressUpdatedAt = useCallback((courseId) => {
    if (!user) return null
    const p = progress.find(x => x.userId === user.uid && x.courseId === courseId)
    return p?.updatedAt || null
  }, [user, progress])

  // ---------- Quizzes: পড়ে শুধু এনরোল করা শিক্ষার্থী/অ্যাডমিন, বানায় শুধু অ্যাডমিন ----------
  // কুইজের উত্তর ইতিহাস এই ব্যাচে সংরক্ষণ করা হয় না — স্কোর সাথে সাথে দেখানো হয়।
  const getQuiz = useCallback(async (courseId) => {
    if (!courseId) return null
    if (quizzes[courseId] !== undefined) return quizzes[courseId]
    if (!isEnrolled(courseId) && user?.role !== 'admin') return null
    if (firebaseMode) {
      try {
        const snap = await getDoc(doc(db, 'quizzes', courseId))
        const quiz = snap.exists() ? { id: snap.id, ...snap.data() } : null
        setQuizzes(prev => ({ ...prev, [courseId]: quiz }))
        return quiz
      } catch {
        return null
      }
    }
    const demo = loadDemo()
    const quiz = (demo.quizzes || {})[courseId] || null
    setQuizzes(prev => ({ ...prev, [courseId]: quiz }))
    return quiz
  }, [firebaseMode, isEnrolled, user, quizzes])

  const saveQuiz = useCallback(async (courseId, questions) => {
    if (!user || user.role !== 'admin') throw new Error('শুধু অ্যাডমিন কুইজ বানাতে পারে।')
    if (!courseId) throw new Error('কোর্স বেছে নিন।')
    const clean = (questions || []).map(q => ({
      q: (q.q || '').trim(),
      options: (q.options || []).slice(0, 4).map(o => (o || '').trim()),
      answerIndex: Number(q.answerIndex) || 0,
    }))
    for (const q of clean) {
      if (!q.q) throw new Error('সব প্রশ্নে প্রশ্নের লেখা থাকতে হবে।')
      if (q.options.length !== 4 || q.options.some(o => !o)) throw new Error('প্রতিটি প্রশ্নে ঠিক ৪টি অপশন থাকতে হবে।')
      if (q.answerIndex < 0 || q.answerIndex > 3) throw new Error('সঠিক উত্তরের নম্বর ভুল।')
    }
    const quiz = { courseId, questions: clean, updatedAt: new Date().toISOString() }
    if (firebaseMode) {
      await setDoc(doc(db, 'quizzes', courseId), quiz, { merge: true })
    } else {
      const demo = loadDemo()
      demo.quizzes = { ...(demo.quizzes || {}), [courseId]: { id: courseId, ...quiz } }
      persistDemo({ quizzes: demo.quizzes })
    }
    setQuizzes(prev => ({ ...prev, [courseId]: { id: courseId, ...quiz } }))
    return courseId
  }, [firebaseMode, user, persistDemo])

  const deleteQuiz = useCallback(async (courseId) => {
    if (!user || user.role !== 'admin') throw new Error('শুধু অ্যাডমিন কুইজ মুছতে পারে।')
    if (firebaseMode) { await deleteDoc(doc(db, 'quizzes', courseId)) }
    else {
      const demo = loadDemo()
      const next = { ...(demo.quizzes || {}) }
      delete next[courseId]
      demo.quizzes = next
      persistDemo({ quizzes: next })
    }
    setQuizzes(prev => { const next = { ...prev }; delete next[courseId]; return next })
  }, [firebaseMode, user, persistDemo])

  // ---------- Lesson access: ভিডিও URL শুধু এনরোল করা ইউজারের জন্য ----------
  const getLessonVideo = useCallback(async (courseId, lessonId) => {
    if (!isEnrolled(courseId)) return null
    if (firebaseMode) {
      try {
        const snap = await getDoc(doc(db, 'courses', courseId, 'lessonAccess', lessonId))
        return snap.exists() ? (snap.data().youtubeId || '') : ''
      } catch { return '' }
    }
    const course = courses.find(c => c.id === courseId)
    const lesson = course?.lessons?.find(l => l.id === lessonId)
    return lesson?.youtubeId || ''
  }, [firebaseMode, isEnrolled, courses])

  // ---------- Reviews: শুধু এনরোল করা শিক্ষার্থী লিখতে পারে, একজন এক কোর্সে একটাই ----------
  const reviewsByCourse = useCallback((courseId) => {
    if (!courseId) return []
    return reviews
      .filter(r => r.courseId === courseId)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
  }, [reviews])

  const averageRating = useCallback((courseId) => {
    const list = reviews.filter(r => r.courseId === courseId)
    if (list.length === 0) return null
    const avg = list.reduce((s, r) => s + (Number(r.rating) || 0), 0) / list.length
    return Math.round(avg * 10) / 10
  }, [reviews])

  const submitReview = useCallback(async (courseId, rating, text) => {
    if (!user) throw new Error('রিভিউ দিতে প্রথমে লগইন করুন।')
    if (!isEnrolled(courseId)) throw new Error('শুধু এই কোর্স কেনা শিক্ষার্থীরাই রিভিউ দিতে পারে।')
    const r = Math.round(Number(rating) || 0)
    if (r < 1 || r > 5) throw new Error('১ থেকে ৫ তারার মধ্যে রেটিং দিন।')
    const cleanText = (text || '').trim().slice(0, 500)
    // এক ইউজার এক কোর্সে একটাই রিভিউ — ডক আইডি uid_courseId, আবার দিলে আপডেট হয়
    const id = `${user.uid}_${courseId}`
    const review = {
      courseId, userId: user.uid, userName: user.name || user.email,
      rating: r, text: cleanText, createdAt: new Date().toISOString(),
    }
    if (firebaseMode) {
      await setDoc(doc(db, 'reviews', id), review, { merge: true })
    } else {
      const demo = loadDemo()
      const list = demo.reviews || []
      demo.reviews = list.some(x => x.id === id)
        ? list.map(x => x.id === id ? { ...x, ...review, id } : x)
        : [...list, { id, ...review }]
      persistDemo({ reviews: demo.reviews })
    }
    setReviews(prev => prev.some(x => x.id === id)
      ? prev.map(x => x.id === id ? { ...x, ...review, id } : x)
      : [...prev, { id, ...review }])
    return id
  }, [firebaseMode, user, isEnrolled, persistDemo])

  const deleteReview = useCallback(async (reviewId) => {
    if (!user || user.role !== 'admin') throw new Error('শুধু অ্যাডমিন রিভিউ মুছতে পারে।')
    if (firebaseMode) { await deleteDoc(doc(db, 'reviews', reviewId)) }
    else {
      const demo = loadDemo()
      demo.reviews = (demo.reviews || []).filter(x => x.id !== reviewId)
      persistDemo({ reviews: demo.reviews })
    }
    setReviews(prev => prev.filter(x => x.id !== reviewId))
  }, [firebaseMode, user, persistDemo])

  const value = useMemo(() => ({
    firebaseMode, user, authLoading, dataLoading,
    courses, settings, orders, enrollments, allUsers, reviews, coupons, progress, quizzes,
    register, login, logout, logoutDevice,
    isEnrolled, pendingOrderFor, enrollmentCount, submitOrder, decideOrder,
    saveCourse, deleteCourse, saveSettings, setUserRole, getLessonVideo,
    reviewsByCourse, averageRating, submitReview, deleteReview,
    validateCoupon, saveCoupon, deleteCoupon,
    completedLessonIds, progressPct, toggleLessonComplete, progressUpdatedAt,
    getQuiz, saveQuiz, deleteQuiz,
    getCourse: (id) => courses.find(c => c.id === id),
  }), [firebaseMode, user, authLoading, dataLoading, courses, settings, orders, enrollments, allUsers, reviews, coupons, progress, quizzes,
    register, login, logout, logoutDevice, isEnrolled, pendingOrderFor, enrollmentCount, submitOrder, decideOrder,
    saveCourse, deleteCourse, saveSettings, setUserRole, getLessonVideo,
    reviewsByCourse, averageRating, submitReview, deleteReview,
    validateCoupon, saveCoupon, deleteCoupon,
    completedLessonIds, progressPct, toggleLessonComplete, progressUpdatedAt,
    getQuiz, saveQuiz, deleteQuiz])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
