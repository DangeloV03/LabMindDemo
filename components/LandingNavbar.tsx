'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function LandingNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Grid Logo */}
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/about" 
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              About Us
            </Link>
            <Link 
              href="/team" 
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Meet Our Team
            </Link>
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
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/5">
            <div className="flex flex-col gap-4">
              <Link 
                href="/about" 
                className="text-gray-400 hover:text-white transition-colors text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>
              <Link 
                href="/team" 
                className="text-gray-400 hover:text-white transition-colors text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Meet Our Team
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

