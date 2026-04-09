import './globals.css'

export const metadata = {
  title: 'Project God — Living World Simulation',
  description: 'Real minds. Real lives. Real world. A living simulation where AI souls experience 5,000 years of history.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
