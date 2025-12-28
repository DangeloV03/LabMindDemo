import Link from 'next/link'
import LandingNavbar from '@/components/LandingNavbar'
import MolecularBackground from '@/components/MolecularBackground'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Molecular Dynamics Background */}
      <MolecularBackground />
      
      {/* Navigation */}
      <LandingNavbar />
      
      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-32">
          <div className="max-w-3xl">
            {/* Main Headline */}
            <h1 
              className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
            >
              The Next Stage<br />
              <span className="text-gray-300">of Research</span>
            </h1>
            
            {/* Subheadline */}
            <p 
              className="text-xl sm:text-2xl text-gray-400 mb-8 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
            >
              AI-Driven Data Analysis
            </p>
            
            {/* Description */}
            <p 
              className="text-base sm:text-lg text-gray-500 leading-relaxed mb-10 max-w-xl opacity-0 animate-fade-in-up"
              style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
            >
              LabMind changes how researchers analyze data. Import your raw data
              in any format and watch as our intelligent system builds a custom
              analysis pipeline tailored to your research needs.
            </p>
            
            {/* Feature Pills */}
            <div 
              className="flex flex-wrap gap-3 mb-12 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}
            >
              <span className="pill">Speed</span>
              <span className="pill">Control</span>
              <span className="pill">Intelligence</span>
            </div>
            
            {/* CTA Buttons */}
            <div 
              className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}
            >
              <Link
                href="/auth/signup"
                className="btn-primary text-center"
              >
                Get Started
              </Link>
              <Link
                href="/auth/signin"
                className="btn-secondary text-center"
              >
                Sign In
              </Link>
            </div>
            
            {/* Subtle hint text */}
            <p 
              className="text-sm text-gray-600 mt-6 opacity-0 animate-fade-in"
              style={{ animationDelay: '900ms', animationFillMode: 'forwards' }}
            >
              Free to get started. No credit card required.
            </p>
          </div>
        </div>
      </section>
      
      {/* Floating decorative elements */}
      <div className="absolute top-1/4 left-8 w-2 h-2 bg-gray-600 rounded-full opacity-40 animate-pulse-subtle" />
      <div className="absolute top-1/3 left-16 w-1.5 h-1.5 bg-gray-500 rounded-full opacity-30 animate-pulse-subtle" style={{ animationDelay: '500ms' }} />
      <div className="absolute top-2/3 left-12 w-1 h-1 bg-gray-400 rounded-full opacity-20 animate-pulse-subtle" style={{ animationDelay: '1000ms' }} />
      <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-gray-500 rounded-full opacity-25 animate-pulse-subtle" style={{ animationDelay: '750ms' }} />
      
      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none z-[1]" />
    </main>
  )
}
