import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInCard } from '../../components/ui/sign-in-card-2'
import { login } from '../../services/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(userId, password)
      navigate('/', { replace: true })
    } catch {
      setError('Invalid User ID or Password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SignInCard
      title="MI TRENDS"
      subtitle="Sign in to the admin panel"
      email={userId}
      onEmailChange={setUserId}
      password={password}
      onPasswordChange={setPassword}
      rememberMe={rememberMe}
      onRememberMeChange={setRememberMe}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    />
  )
}
