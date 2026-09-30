import { preload } from 'react-dom'
import { getImageProps } from 'next/image'
import { AUTH_PHOTO } from '@/components/auth/AuthStage'
import '@/styles/auth.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  /* The photograph is the sign-in pages' largest paint. Ask for the same
     responsive image from the server-rendered head so it starts at once. */
  const { props } = getImageProps({ ...AUTH_PHOTO, alt: '', fill: true })
  preload(props.src, { as: 'image', imageSrcSet: props.srcSet, imageSizes: props.sizes, fetchPriority: 'high' })
  return <>{children}</>
}
