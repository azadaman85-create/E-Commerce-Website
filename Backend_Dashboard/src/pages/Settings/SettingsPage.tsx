import { useState } from 'react'
import type { FormEvent } from 'react'
import { Tabs } from '../../components/Tabs'
import { useToast } from '../../hooks/useToast'
import { changePassword, getCurrentUser } from '../../services/auth'

type SettingsTab = 'profile' | 'store' | 'payment' | 'shipping'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  product_manager: 'Product Manager',
  order_manager: 'Order Manager',
  content_manager: 'Content Manager',
}

export function SettingsPage() {
  const { showToast } = useToast()
  const [tab, setTab] = useState<SettingsTab>('profile')
  const user = getCurrentUser()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const save = (section: string) => {
    showToast(`${section} settings saved`, 'success')
  }

  const submitPasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Fill in all three fields.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setPasswordSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      showToast('Password updated', 'success')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not update password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">Admin profile, store, payment, and shipping configuration.</p>
      </div>

      <Tabs
        tabs={[
          { key: 'profile', label: 'Admin profile' },
          { key: 'store', label: 'Store settings' },
          { key: 'payment', label: 'Payment' },
          { key: 'shipping', label: 'Shipping' },
        ]}
        active={tab}
        onChange={(key) => setTab(key as SettingsTab)}
      />

      {tab === 'profile' && (
        <div className="flex flex-col gap-5">
          <section className="max-w-lg rounded-2xl border border-border bg-bone-soft p-5">
            <h2 className="mb-4 text-lg text-ink">Admin profile</h2>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Name</span>
                <input defaultValue={user?.name ?? ''} className="input" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Email</span>
                <input defaultValue={user?.email ?? ''} className="input" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Role</span>
                <input
                  defaultValue={user ? (ROLE_LABELS[user.role] ?? user.role) : ''}
                  disabled
                  className="input bg-bone-deep text-ink-soft"
                />
              </label>
              <button
                onClick={() => save('Profile')}
                className="mt-2 self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
              >
                Save changes
              </button>
            </div>
          </section>

          <section className="max-w-lg rounded-2xl border border-border bg-bone-soft p-5">
            <h2 className="mb-1 text-lg text-ink">Change password</h2>
            <p className="mb-4 text-xs text-ink-soft">
              Applies to whichever admin or super admin account you're currently signed in as
              ({user ? ROLE_LABELS[user.role] ?? user.role : '—'}).
            </p>
            <form onSubmit={submitPasswordChange} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Current password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Confirm new password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                />
              </label>

              {passwordError && (
                <p className="rounded-lg bg-rust-soft px-3 py-2 text-xs text-rust">{passwordError}</p>
              )}

              <button
                type="submit"
                disabled={passwordSaving}
                className="mt-2 self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordSaving ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </section>
        </div>
      )}

      {tab === 'store' && (
        <section className="max-w-lg rounded-2xl border border-border bg-bone-soft p-5">
          <h2 className="mb-4 text-lg text-ink">Store settings</h2>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Store name</span>
              <input defaultValue="MI TRENDS" className="input" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Support email</span>
              <input defaultValue="support@mitrends.com" className="input" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Currency</span>
                <select defaultValue="INR" className="input">
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Timezone</span>
                <select defaultValue="Asia/Kolkata" className="input">
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="UTC">UTC</option>
                </select>
              </label>
            </div>
            <button
              onClick={() => save('Store')}
              className="mt-2 self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
            >
              Save changes
            </button>
          </div>
        </section>
      )}

      {tab === 'payment' && (
        <section className="max-w-lg rounded-2xl border border-border bg-bone-soft p-5">
          <h2 className="mb-1 text-lg text-ink">Payment settings</h2>
          <p className="mb-4 text-xs text-ink-soft">
            Structure only — no live keys are stored here. Connect a real gateway before launch.
          </p>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Gateway</span>
              <select defaultValue="razorpay" className="input">
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Publishable key</span>
              <input placeholder="pk_test_••••••••••••" className="input" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border accent-accent" />
              <span className="font-medium text-ink">Test mode enabled</span>
            </label>
            <button
              onClick={() => save('Payment')}
              className="mt-2 self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
            >
              Save changes
            </button>
          </div>
        </section>
      )}

      {tab === 'shipping' && (
        <section className="max-w-lg rounded-2xl border border-border bg-bone-soft p-5">
          <h2 className="mb-1 text-lg text-ink">Shipping settings</h2>
          <p className="mb-4 text-xs text-ink-soft">Structure only — connect a real shipping API before launch.</p>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Carrier</span>
              <select defaultValue="delhivery" className="input">
                <option value="delhivery">Delhivery</option>
                <option value="shiprocket">Shiprocket</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Flat rate (₹)</span>
              <input type="number" defaultValue={150} className="input" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Free shipping threshold (₹)</span>
              <input type="number" defaultValue={3000} className="input" />
            </label>
            <button
              onClick={() => save('Shipping')}
              className="mt-2 self-start rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bone-soft transition-colors hover:bg-accent-hover"
            >
              Save changes
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
