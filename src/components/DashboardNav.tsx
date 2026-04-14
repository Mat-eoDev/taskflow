'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

interface DashboardNavProps {
  email: string | undefined
  isAdmin: boolean
}

export default function DashboardNav({ email, isAdmin }: DashboardNavProps) {
  const pathname = usePathname()

  const navLink = (href: string, label: string, activeClass = 'bg-[#1c1c21] text-white') => {
    const isActive = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        className={`px-4 py-1.5 rounded-md text-sm transition-all ${
          isActive ? activeClass : 'text-[#6b6b80] hover:text-white hover:bg-[#1c1c21]'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <header className="border-b border-[#2a2a32] bg-[#141417] px-6 py-3 flex items-center justify-between flex-shrink-0">
      <span className="text-xl font-black text-white tracking-tight">
        Task<span className="text-[#7c6af7]">Flow</span>
      </span>

      <nav className="flex gap-1 bg-[#0d0d0f] rounded-lg p-1">
        {navLink('/dashboard/chat', '💬 Chat IA')}
        {navLink('/dashboard/tasks', '📋 Tâches')}
        {isAdmin && (
          <Link
            href="/admin"
            className={`px-4 py-1.5 rounded-md text-sm transition-all ${
              pathname.startsWith('/admin')
                ? 'bg-[#1c1c21] text-[#f7a26a]'
                : 'text-[#f7a26a] hover:bg-[#1c1c21]'
            }`}
          >
            ⚙️ Admin
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-3">
        <span className="text-xs text-[#6b6b80]">{email}</span>
        <LogoutButton />
      </div>
    </header>
  )
}
