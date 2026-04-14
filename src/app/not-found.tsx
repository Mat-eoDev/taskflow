import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center flex-col gap-4">
      <h1 className="text-6xl font-black text-white">404</h1>
      <p className="text-[#6b6b80]">Cette page n&apos;existe pas.</p>
      <Link href="/dashboard" className="text-[#7c6af7] text-sm hover:underline">
        Retour au dashboard
      </Link>
    </div>
  )
}
