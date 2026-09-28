import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/site/site'
import KaashPhool from '@/components/brand/KaashPhool'

export const metadata: Metadata = pageMetadata({
  title: 'Kaash phool',
  description: 'Happiness is these golden days coming back around.',
})

export default function Page() {
  return <KaashPhool />
}
