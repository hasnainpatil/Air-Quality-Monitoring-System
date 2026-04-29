import './globals.css'

export const metadata = {
  title: 'Air Quality Monitoring',
  description: 'Real-time air quality monitoring with AI predictions',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main className="animate-slide-up">
          {children}
        </main>
      </body>
    </html>
  )
}
