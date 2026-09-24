import type { Metadata } from 'next';
import '../../app/globals.css';
import './activity.css';
import './arena.css';
import './armoury.css';
import './lobby-layout.css';

export const metadata: Metadata = {
  title: 'Chaos Chess · Discord Activity',
  description: 'Draft powers. Challenge a friend. Break the rules of chess.',
  robots: { index: false, follow: false },
  icons: { icon: '/activity/app-icon.svg', apple: '/activity/app-icon.png' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>{children}</body></html>;
}
