import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { AnimatePresence } from 'framer-motion'
import { ArrowRight, Eye, EyeClosed, Lock, Mail } from 'lucide-react'
import { Input } from './input'
import logo from '../../assets/logo.jpeg'

interface SignInCardProps {
  title?: string
  subtitle?: string
  email: string
  password: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  rememberMe: boolean
  onRememberMeChange: (value: boolean) => void
  onSubmit: (event: FormEvent) => void
  loading?: boolean
  error?: string
}

export function SignInCard({
  title = 'Welcome back',
  subtitle = 'Sign in to continue to MI TRENDS',
  email,
  password,
  onEmailChange,
  onPasswordChange,
  rememberMe,
  onRememberMeChange,
  onSubmit,
  loading = false,
  error,
}: SignInCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

  // 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="min-h-screen w-full bg-ink relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-accent/30 to-ink" />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-accent/20 blur-[80px]" />
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vh] h-[60vh] rounded-b-full bg-accent/20 blur-[60px]"
        animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.98, 1.02, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror' }}
      />
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90vh] h-[90vh] rounded-t-full bg-accent/20 blur-[60px]"
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror', delay: 1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm relative z-10"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative group">
            <motion.div
              className="absolute -inset-px rounded-2xl overflow-hidden pointer-events-none"
            >
              <motion.div
                className="absolute top-0 left-0 h-[3px] w-1/2 bg-gradient-to-r from-transparent via-bone-soft to-transparent opacity-70"
                animate={{ left: ['-50%', '100%'] }}
                transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
              />
              <motion.div
                className="absolute top-0 right-0 h-1/2 w-[3px] bg-gradient-to-b from-transparent via-bone-soft to-transparent opacity-70"
                animate={{ top: ['-50%', '100%'] }}
                transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 0.6 }}
              />
              <motion.div
                className="absolute bottom-0 right-0 h-[3px] w-1/2 bg-gradient-to-r from-transparent via-bone-soft to-transparent opacity-70"
                animate={{ right: ['-50%', '100%'] }}
                transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.2 }}
              />
              <motion.div
                className="absolute bottom-0 left-0 h-1/2 w-[3px] bg-gradient-to-b from-transparent via-bone-soft to-transparent opacity-70"
                animate={{ bottom: ['-50%', '100%'] }}
                transition={{ duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.8 }}
              />
            </motion.div>

            <div className="relative bg-ink/60 backdrop-blur-xl rounded-2xl p-6 border border-bone-soft/10 shadow-2xl overflow-hidden">
              <div className="text-center space-y-1 mb-5">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="mx-auto w-14 h-14 rounded-full overflow-hidden ring-1 ring-bone-soft/20"
                >
                  <img src={logo} alt="MI TRENDS" className="h-full w-full object-cover" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-2xl font-semibold text-bone-soft"
                >
                  {title}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-bone-soft/80 text-xs"
                >
                  {subtitle}
                </motion.p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-3">
                  <motion.div
                    className={`relative ${focusedInput === 'email' ? 'z-10' : ''}`}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Mail
                        className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${
                          focusedInput === 'email' ? 'text-bone-soft' : 'text-bone-soft/40'
                        }`}
                      />
                      <Input
                        type="email"
                        placeholder="User ID"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => onEmailChange(e.target.value)}
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full bg-bone-soft/5 border-transparent focus-visible:border-bone-soft/20 text-bone-soft placeholder:text-bone-soft/30 h-10 transition-all duration-300 pl-10 pr-3 focus-visible:bg-bone-soft/10 focus-visible:ring-0"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    className={`relative ${focusedInput === 'password' ? 'z-10' : ''}`}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-lg">
                      <Lock
                        className={`absolute left-3 w-4 h-4 transition-colors duration-300 ${
                          focusedInput === 'password' ? 'text-bone-soft' : 'text-bone-soft/40'
                        }`}
                      />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => onPasswordChange(e.target.value)}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                        className="w-full bg-bone-soft/5 border-transparent focus-visible:border-bone-soft/20 text-bone-soft placeholder:text-bone-soft/30 h-10 transition-all duration-300 pl-10 pr-10 focus-visible:bg-bone-soft/10 focus-visible:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 text-bone-soft/40 hover:text-bone-soft transition-colors duration-300"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeClosed className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => onRememberMeChange(e.target.checked)}
                      className="h-4 w-4 rounded border border-bone-soft/20 bg-bone-soft/5 accent-accent"
                    />
                    <span className="text-xs text-bone-soft/60 hover:text-bone-soft/80 transition-colors duration-200">
                      Remember me
                    </span>
                  </label>

                  <button
                    type="button"
                    className="text-xs text-bone-soft/60 hover:text-bone-soft transition-colors duration-200"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <p className="rounded-lg bg-rust/20 px-3 py-2 text-xs text-bone-soft">{error}</p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full relative group/button mt-5"
                >
                  <div className="relative overflow-hidden bg-bone-soft text-ink font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center disabled:opacity-60">
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <div className="w-4 h-4 border-2 border-ink/70 border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="button-text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-1 text-sm font-medium"
                        >
                          Sign in
                          <ArrowRight className="w-3 h-3 group-hover/button:translate-x-1 transition-transform duration-300" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              </form>

              <p className="text-center text-[11px] text-bone-soft/60 mt-4">
                Internal admin access only. Contact your workspace admin for access issues.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
