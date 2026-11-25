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
            setCourses(list)
          }
          const s = await getDoc(doc(db, 'settings', 'payment'))
          if (s.exists()) setSettings({ ...DEFAULT_SETTINGS, ...s.data() })
          const os = await getDocs(collection(db, 'orders'))
          setOrders(os.docs.map(d => ({ id: d.id, ...d.data() })))
          const es = await getDocs(collection(db, 'enrollments'))
          setEnrollments(es.docs.map(d => ({ id: d.id, ...d.data() })))
          const us = await getDocs(collection(db, 'users'))
          setAllUsers(us.docs.map(d => ({ uid: d.id, ...d.data() })))
        } catch (e) {
          console.warn('Firebase ডেটা পড়া যায়নি, নমুনা ডেটা দেখানো হচ্ছে:', e)
        }
      } else {
        const demo = loadDemo()
        setCourses(demo.courses)
        setSettings(demo.settings)
        setOrders(demo.orders)
        setEnrollments(demo.enrollments)
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

  const submitOrder = useCallback(async ({ courseId, method, senderNumber, txnId }) => {
    const course = courses.find(c => c.id === courseId)
    const order = {
      userId: user.uid, userEmail: user.email, courseId, courseTitle: course?.title || courseId,
      price: course?.price || 0, method, senderNumber, txnId,
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
          const { youtubeId, ...lessonFields } = l
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

  const value = useMemo(() => ({
    firebaseMode, user, authLoading, dataLoading,
    courses, settings, orders, enrollments, allUsers,
    register, login, logout, logoutDevice,
    isEnrolled, pendingOrderFor, submitOrder, decideOrder,
    saveCourse, deleteCourse, saveSettings, setUserRole, getLessonVideo,
    getCourse: (id) => courses.find(c => c.id === id),
  }), [firebaseMode, user, authLoading, dataLoading, courses, settings, orders, enrollments, allUsers,
    register, login, logout, logoutDevice, isEnrolled, pendingOrderFor, submitOrder, decideOrder,
    saveCourse, deleteCourse, saveSettings, setUserRole, getLessonVideo])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
