import { NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

interface NavChild {
  label: string
  path: string
}

interface NavItem {
  label: string
  path: string
  icon: string
  children?: NavChild[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: '◈' },
  {
    label: 'Products',
    path: '/products',
    icon: '⬚',
    children: [
      { label: 'Product list', path: '/products' },
      { label: 'Add product', path: '/products/new' },
      { label: 'Categories', path: '/products/categories' },
      { label: 'Brands', path: '/products/brands' },
      { label: 'Inventory', path: '/products/inventory' },
    ],
  },
  { label: 'Orders', path: '/orders', icon: '▤' },
  { label: 'Customers', path: '/customers', icon: '◐' },
  { label: 'Reviews', path: '/reviews', icon: '☆' },
  { label: 'Marketing', path: '/marketing', icon: '◆' },
  { label: 'Content', path: '/content', icon: '▥' },
  { label: 'Reports', path: '/reports', icon: '▦' },
  { label: 'Settings', path: '/settings', icon: '⚙' },
]

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    const activeParent = NAV_ITEMS.find(
      (item) => item.children && location.pathname.startsWith(item.path),
    )
    if (activeParent) setOpenKey(activeParent.path)
  }, [location.pathname])

  const toggle = (path: string) => {
    setOpenKey((prev) => (prev === path ? null : path))
  }

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-[1px] md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-bone-soft transition-all duration-300 ease-out md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          collapsed ? 'md:w-20' : 'md:w-64'
        } ${mobileOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-border px-5">
          {!collapsed && (
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-ink-faint">
              Menu
            </span>
          )}
          <button
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed((c) => !c)}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-bone-deep md:flex"
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isOpen = openKey === item.path
              return (
                <li key={item.path}>
                  <div className="flex items-center">
                    <NavLink
                      to={item.path}
                      end={item.path === '/' || !item.children}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-accent-soft text-accent'
                            : 'text-ink-soft hover:bg-bone-deep hover:text-ink'
                        }`
                      }
                    >
                      <span className="w-5 shrink-0 text-center text-base" aria-hidden="true">
                        {item.icon}
                      </span>
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                    {item.children && !collapsed && (
                      <button
                        aria-label={isOpen ? `Collapse ${item.label}` : `Expand ${item.label}`}
                        onClick={() => toggle(item.path)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-faint transition-colors hover:bg-bone-deep hover:text-ink"
                      >
                        <span
                          className={`inline-block text-xs transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                        >
                          ›
                        </span>
                      </button>
                    )}
                  </div>

                  {item.children && !collapsed && isOpen && (
                    <ul className="ml-6 mt-1 flex flex-col gap-0.5 border-l border-border pl-4">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <NavLink
                            to={child.path}
                            end
                            onClick={onCloseMobile}
                            className={({ isActive }) =>
                              `block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                                isActive
                                  ? 'text-accent font-medium'
                                  : 'text-ink-soft hover:text-ink'
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}
