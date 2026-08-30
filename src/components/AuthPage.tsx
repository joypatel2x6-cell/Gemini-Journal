import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
  onOpenFirebaseGuide?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'signin',
  onOpenFirebaseGuide,
}) => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAsDemo,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email format regex validation
  const validateEmail = (emailStr: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const getFriendlyErrorMessage = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password is too weak. Please use at least 6 characters.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in window was closed. Please try again.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Network error. Please verify your internet connection.';
    }
    return message || 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (mode === 'signup') {
      const cleanName = name.trim();
      if (!cleanName) {
        setError('Please enter your name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter your password confirmation.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(cleanEmail, password);
      } else {
        await signUpWithEmail(cleanEmail, password, name.trim());
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickGuest = () => {
    signInAsDemo(name.trim() || 'Mindful Journaler');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col justify-between selection:bg-amber-200 dark:selection:bg-amber-900 transition-colors duration-200">
      {/* Top Navbar */}
      <header className="border-b border-stone-200/80 dark:border-stone-800/80 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif-title font-bold text-lg tracking-tight text-stone-900 dark:text-stone-100">
                Personal Gemini Journal
              </span>
            </div>
          </div>

          {onOpenFirebaseGuide && (
            <button
              id="auth-firebase-guide-btn"
              onClick={onOpenFirebaseGuide}
              className="text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline font-medium">Security Guide</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div
            id="auth-main-card"
            className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xl shadow-stone-200/50 dark:shadow-black/40 space-y-6"
          >
            {/* Header / Brand Title & Greeting */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 mx-auto mb-2 border border-amber-200/60 dark:border-amber-900/60">
                <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="font-serif-title font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100 tracking-tight">
                Personal Gemini Journal
              </h1>

              {mode === 'signin' ? (
                <div className="pt-2">
                  <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 flex items-center justify-center gap-1.5">
                    <span>Welcome Back</span>
                    <span>👋</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                    Sign in to continue your journal
                  </p>
                </div>
              ) : (
                <div className="pt-2">
                  <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
                    Create Your Account
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                    Start your personal journal
                  </p>
                </div>
              )}
            </div>

            {/* Error Message Box */}
            {error && (
              <div
                id="auth-error-notice"
                role="alert"
                className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-xs text-rose-700 dark:text-rose-300 space-y-1 animate-in fade-in duration-200"
              >
                <div className="font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Authentication Notice</span>
                </div>
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="signup-name-input"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="signup-name-input"
                      type="text"
                      required
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (error) setError(null);
                      }}
                      className="w-full pl-10 pr-3.5 py-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email-input"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-email-input"
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full pl-10 pr-3.5 py-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password-input"
                  className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    className="w-full pl-10 pr-10 py-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="signup-confirm-password-input"
                    className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="signup-confirm-password-input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      className="w-full pl-10 pr-10 py-3 bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-2xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-stone-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Login' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch Mode Link */}
            <div className="text-center pt-2">
              {mode === 'signin' ? (
                <div className="space-y-1">
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Don't have an account?
                  </p>
                  <button
                    id="switch-to-signup-btn"
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 underline underline-offset-4 decoration-amber-500/40 hover:decoration-amber-500 transition-all cursor-pointer"
                  >
                    Sign Up
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Already have an account?
                  </p>
                  <button
                    id="switch-to-signin-btn"
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                    }}
                    className="text-xs sm:text-sm font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 underline underline-offset-4 decoration-amber-500/40 hover:decoration-amber-500 transition-all cursor-pointer"
                  >
                    Login
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-stone-200 dark:border-stone-800 w-full" />
              <span className="bg-white dark:bg-stone-900 px-3 text-[11px] text-stone-400 uppercase tracking-widest font-semibold">
                Or continue with
              </span>
            </div>

            {/* Google Sign-In & Guest Sandbox Options */}
            <div className="space-y-2.5">
              <button
                id="auth-google-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-2xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 font-medium text-xs sm:text-sm text-stone-800 dark:text-stone-200 flex items-center justify-center gap-2.5 transition-all hover:border-stone-300 dark:hover:border-stone-600 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                id="auth-guest-sandbox-btn"
                type="button"
                onClick={handleQuickGuest}
                disabled={loading}
                className="w-full py-2 px-4 rounded-xl bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800/60 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Guest Sandbox Mode</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer with Security Guarantees */}
      <footer className="border-t border-stone-200/80 dark:border-stone-800 bg-white/50 dark:bg-stone-900/40 py-4 text-center text-xs text-stone-500 dark:text-stone-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Personal Gemini Journal · Private & Secure Introspection</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Strict UID Isolation
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <Lock className="w-3.5 h-3.5" />
              Zero-Exposure Secrets
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
