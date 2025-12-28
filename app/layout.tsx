import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LabMind - AI-Powered Research Analytics Platform',
  description: 'Collaborative research platform with AI agent assistance for Chemistry and Physics data analytics. Import raw data in any format and watch as our intelligent system builds a custom analysis pipeline tailored to your research needs.',
  keywords: ['AI', 'research', 'data analysis', 'chemistry', 'physics', 'machine learning', 'scientific computing'],
  authors: [{ name: 'LabMind Team' }],
  openGraph: {
    title: 'LabMind - The Next Stage of Research',
    description: 'AI-Driven Data Analysis for researchers. Import raw data and let our intelligent system build custom analysis pipelines.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white antialiased font-body">
        {children}
      </body>
    </html>
  )
}
