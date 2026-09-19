import type { Metadata } from 'next'
import KaashPhool from '@/components/brand/KaashPhool'

export const metadata: Metadata = {
  title: 'Kaash phool',
  description: 'Happiness is these golden days coming back around.',
}

export default function Page() {
  return <KaashPhool />
}
