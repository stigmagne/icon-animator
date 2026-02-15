import type { Metadata } from 'next'
import IconAnimatorPage from './icon-animator'

export const metadata: Metadata = {
    title: 'Icon Animator v1',
    description: 'Visual editor for animated SVG icons with motion/react export',
}

export default function Page() {
    return <IconAnimatorPage />
}
