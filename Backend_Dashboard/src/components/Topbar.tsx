import { useNavigate } from 'react-router-dom'
import { logout } from '../services/auth'
import type { AdminUser } from '../types'
import logo from '../assets/logo.jpeg'

interface TopbarProps {
  onOpenMobileNav: () => void
  user: AdminUser
}

export function Topbar({ onOpenMobileNav, user }: TopbarProps) {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-border bg-bone-soft/90 px-5 backdrop-blur">
      <button
        aria-label="Open navigation"
        onClick={onOpenMobileNav}
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-bone-deep md:hidden"
      >
        ☰
      </button>

      <div className="relative w-36 sm:w-56 md:w-72">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
          ⌕
        </span>
        <input
          type="search"
          placeholder="Search products, orders, customers…"
          className="w-full rounded-full border border-border bg-bone py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex flex-1 items-center justify-center gap-2 overflow-hidden">
        <img
          src={logo}
          alt="MI TRENDS"
          className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border"
        />
        <span className="hidden truncate font-display text-lg tracking-wide text-ink sm:inline">
          MI TRENDS
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-bone-deep hover:text-ink"
        >
          ◔
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rust" />
        </button>

        <div className="group relative">
          <button className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-bone-soft">
              {user.avatarInitial}
            </div>
            <span className="hidden text-sm font-medium text-ink sm:inline">{user.name}</span>
          </button>
          <div className="invisible absolute right-0 top-full mt-2 w-40 rounded-lg border border-border bg-bone-soft py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
            <button
              onClick={handleLogout}
              className="block w-full px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-bone-deep"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
