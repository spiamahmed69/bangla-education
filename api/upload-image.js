// Vercel Serverless Function — কোর্সের ছবি ImgBB-তে আপলোড করে।
// ImgBB চাবি শুধু Vercel-এর Environment Variables-এ (সার্ভার-সাইড) থাকে —
// এই ফাইলে বা রেপোর কোথাও চাবির মান লেখা নেই।
// POST JSON: { image: "data:image/jpeg;base64,...", name: "sohoj-ict" }
// সফল হলে: { url, displayUrl } — ব্যর্থ হলে বাংলা বার্তাসহ { error }।

const MAX_BASE64_CHARS = 2800000 // ~2MB ছবি

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'শুধু POST অনুরোধ গ্রহণ করা হয়।' })
  }

  const apiKey = process.env.IMGBB_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'সার্ভারে ImgBB চাবি বসানো হয়নি। Vercel-এর Environment Variables-এ IMGBB_API_KEY বসান।' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ error: 'অনুরোধের তথ্য পড়া যায়নি।' })
    }
  }

  const image = body?.image
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'কোনো ছবি পাঠানো হয়নি।' })
  }

  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) {
    return res.status(400).json({ error: 'ছবির ফরম্যাট সঠিক নয় — শুধু ছবির ফাইল (JPG/PNG) বেছে নিন।' })
  }
  const base64 = match[2]
  if (base64.length > MAX_BASE64_CHARS) {
    return res.status(400).json({ error: 'ছবির সাইজ অনেক বড় — 2MB-এর ছোট ছবি বেছে নিন।' })
  }

  try {
    const form = new URLSearchParams()
    form.append('key', apiKey)
    form.append('image', base64)
    if (body.name) form.append('name', String(body.name).slice(0, 100))

    const resp = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    })
    const result = await resp.json().catch(() => null)
    if (!resp.ok || !result?.success || !result?.data?.url) {
      return res.status(502).json({ error: 'ImgBB-তে আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' })
    }
    return res.status(200).json({ url: result.data.url, displayUrl: result.data.display_url || result.data.url })
  } catch {
    return res.status(502).json({ error: 'আপলোড সার্ভারের সাথে যোগাযোগ করা যায়নি। আবার চেষ্টা করুন।' })
  }
}
