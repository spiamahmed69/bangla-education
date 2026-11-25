import { useCallback, useEffect, useState } from 'react'
import { useStore } from './store'

// উইশলিস্ট — শুধু এই ডিভাইসের localStorage-এ থাকে, সার্ভারে যায় না।
// লগইন করা ইউজারের আলাদা চাবি, লগ-আউট অবস্থায় অতিথি চাবি।
function keyFor(uid) {
  return uid ? `be_wishlist_${uid}` : 'be_wishlist_guest'
}

function readList(key) {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : []
  } catch { return [] }
}

export function useWishlist() {
  const { user } = useStore()
  const key = keyFor(user?.uid)
  const [list, setList] = useState(() => readList(key))

  // লগইন/লগআউটে চাবি বদলায় — নতুন চাবির তালিকা লোড করি।
  // লগইন করলে অতিথি থাকা উইশলিস্টটা ইউজারের তালিকায় মিশিয়ে দিই।
  useEffect(() => {
    if (user?.uid) {
      const guest = readList('be_wishlist_guest')
      const mine = readList(key)
      if (guest.length > 0) {
        const merged = [...new Set([...mine, ...guest])]
        localStorage.setItem(key, JSON.stringify(merged))
        localStorage.removeItem('be_wishlist_guest')
        setList(merged)
        return
      }
    }
    setList(readList(key))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  const toggle = useCallback((courseId) => {
    setList(prev => {
      const next = prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
      try { localStorage.setItem(key, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [key])

  const isWishlisted = useCallback((courseId) => list.includes(courseId), [list])

  return { wishlist: list, toggleWishlist: toggle, isWishlisted }
}
