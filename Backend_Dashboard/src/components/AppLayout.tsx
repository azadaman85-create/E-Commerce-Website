import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { getCurrentUser } from '../services/auth'

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const user = getCurrentUser()

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex min-h-screen bg-bone">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} user={user} />
        <main className="min-w-0 flex-1 p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
