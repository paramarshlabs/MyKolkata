import { MainShell } from '@/components/layout/MainShell'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <MainShell>{children}</MainShell>
}
