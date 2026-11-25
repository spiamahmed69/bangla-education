export default function About() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10">
      <h1 className="text-3xl font-bold text-ink">আমাদের সম্পর্কে</h1>
      <div className="mt-6 rounded-[2rem] bg-white p-8 shadow-[0_8px_30px_rgba(37,99,235,0.10)]">
        <p className="leading-relaxed text-muted">
          বাংলা এডুকেশন একটি অনলাইন কোর্স প্ল্যাটফর্ম। আমাদের লক্ষ্য — বাংলায় সহজ ভাষায়, সাশ্রয়ী মূল্যে মানসম্মত ক্লাস পৌঁছে দেওয়া।
          প্রতিটি কোর্সে আছে ভিডিও ক্লাস (ইউটিউব) আর নোটের PDF। পেমেন্ট হয় বিকাশ/নগদে, অ্যাডমিন যাচাই করে ক্লাস খুলে দেন।
        </p>
        <div className="mt-8 rounded-3xl bg-page p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyanx text-2xl font-bold text-white">SP</div>
          <h2 className="mt-4 text-xl font-bold text-ink">SP Siam Ahmed</h2>
          <p className="text-muted">CEO, বাংলা এডুকেশন</p>
          <p className="font-semibold text-primary">Full Stack Web Developer</p>
        </div>
        <p className="mt-6 text-sm text-muted">যোগাযোগের ফোন ও ইমেইল শীঘ্রই যুক্ত হচ্ছে।</p>
      </div>
    </div>
  )
}
