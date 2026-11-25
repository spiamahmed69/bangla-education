import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider } from './lib/store'
import Layout from './components/Layout'
import Home from './pages/Home'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Learn from './pages/Learn'
import { Login, Register } from './pages/Auth'
import Checkout from './pages/Checkout'
import MyCourses from './pages/MyCourses'
import Admin from './pages/Admin'
import About from './pages/About'
import Contact from './pages/Contact'
import Faq from './pages/Faq'
import RefundPolicy from './pages/RefundPolicy'
import Certificate from './pages/Certificate'
import Quiz from './pages/Quiz'
import Notifications from './pages/Notifications'
import Teacher from './pages/Teacher'
import LiveClasses from './pages/LiveClasses'

function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-16 text-center">
      <h1 className="text-3xl font-bold text-ink dark:text-slate-100">পেজটি পাওয়া যায়নি</h1>
      <p className="mt-2 text-muted dark:text-slate-400">আপনি যে ঠিকানায় গেছেন, সেখানে কিছু নেই।</p>
      <a href="/" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 font-bold text-white">হোমে ফিরুন</a>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/learn/:courseId/:lessonId" element={<Learn />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/checkout/:courseId" element={<Checkout />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/about" element={<About />} />
            <Route path="/certificate/:courseId" element={<Certificate />} />
            <Route path="/quiz/:courseId" element={<Quiz />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/teacher" element={<Teacher />} />
            <Route path="/live-classes" element={<LiveClasses />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </StoreProvider>
  )
}
