'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Primary Nav */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 bg-white rounded-sm group-hover:bg-gray-200 transition-colors" />
                  <div className="w-3 h-3 bg-white rounded-sm group-hover:bg-gray-200 transition-colors" />
                </div>
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 bg-white rounded-sm group-hover:bg-gray-200 transition-colors" />
                  <div className="w-3 h-3 bg-white rounded-sm group-hover:bg-gray-200 transition-colors" />
                </div>
              </div>
              <span className="text-white font-medium text-lg tracking-tight">
                labmind
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            {user && (
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/projects"
                  className="text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Projects
                </Link>
                <Link
                  href="/analyze"
                  className="text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Analyze
                </Link>
              </div>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-8 bg-white/5 rounded-lg animate-pulse" />
            ) : user ? (
              <>
                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                  <Link
                    href="/profile"
                    className="text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Sign Out
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Toggle menu"
                >
                  <div className="w-5 h-4 flex flex-col justify-between">
                    <span className={`block h-0.5 w-5 bg-current transform transition-transform duration-200 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                    <span className={`block h-0.5 w-5 bg-current transition-opacity duration-200 ${isMenuOpen ? 'opacity-0' : ''}`} />
                    <span className={`block h-0.5 w-5 bg-current transform transition-transform duration-200 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
                  </div>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-primary text-sm py-2 px-4"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && user && (
          <div className="md:hidden py-4 border-t border-white/5">
            <div className="flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Projects
              </Link>
              <Link
                href="/analyze"
                className="text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Analyze
              </Link>
              <Link
                href="/profile"
                className="text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  handleSignOut()
                }}
                className="text-left text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
