import type { AdminUser } from '../types'

// DEV-ONLY mock accounts. Replace with real hashed-password auth + sessions
// before any production deploy — passwords must never live in client code.
interface MockAccount {
  id: string
  password: string
  user: AdminUser
}

const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: 'admin@mitrends.com',
    password: 'MiTrends@2025',
    user: {
      id: 'admin-1',
      name: 'Super Admin',
      email: 'admin@mitrends.com',
      role: 'super_admin',
      avatarInitial: 'S',
    },
  },
  {
    id: 'products@mitrends.com',
    password: 'MiTrends@2025',
    user: {
      id: 'admin-2',
      name: 'Product Manager',
      email: 'products@mitrends.com',
      role: 'product_manager',
      avatarInitial: 'P',
    },
  },
  {
    id: 'orders@mitrends.com',
    password: 'MiTrends@2025',
    user: {
      id: 'admin-3',
      name: 'Order Manager',
      email: 'orders@mitrends.com',
      role: 'order_manager',
      avatarInitial: 'O',
    },
  },
]

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log(
    '%c[MI TRENDS Admin] Dev login accounts:\n' +
      MOCK_ACCOUNTS.map((a) => `  ${a.id} / ${a.password}`).join('\n'),
    'color: #6b2737',
  )
}

const SESSION_KEY = 'mitrends_admin_session'

function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export async function login(userId: string, password: string): Promise<AdminUser> {
  const account = MOCK_ACCOUNTS.find(
    (a) => a.id.toLowerCase() === userId.trim().toLowerCase(),
  )

  if (!account || account.password !== password) {
    await delay(null, 600)
    throw new Error('Invalid User ID or Password')
  }

  await delay(null, 600)
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(account.user))
  return account.user
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function getCurrentUser(): AdminUser | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminUser
  } catch {
    return null
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = getCurrentUser()
  if (!user) throw new Error('You must be signed in to change your password.')

  const account = MOCK_ACCOUNTS.find((a) => a.id.toLowerCase() === user.email.toLowerCase())
  if (!account) throw new Error('Account not found.')

  await delay(null, 500)

  if (account.password !== currentPassword) {
    throw new Error('Current password is incorrect.')
  }

  account.password = newPassword
}

type AdminRoleKey = AdminUser['role']

const PERMISSIONS: Record<AdminRoleKey, string[]> = {
  super_admin: ['*'],
  admin: ['dashboard', 'products', 'orders', 'customers', 'reviews', 'marketing', 'content', 'reports', 'settings'],
  product_manager: ['dashboard', 'products'],
  order_manager: ['dashboard', 'orders', 'customers'],
  content_manager: ['dashboard', 'content', 'marketing'],
}

export function canAccess(role: AdminRoleKey, section: string): boolean {
  const allowed = PERMISSIONS[role]
  return allowed.includes('*') || allowed.includes(section)
}
