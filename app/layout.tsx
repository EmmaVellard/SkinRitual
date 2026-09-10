import type { Metadata, Viewport } from 'next';
import './globals.css';
import { appPath } from '@/lib/paths';
export const metadata: Metadata = {
  title: 'Skin Ritual', description: 'Your products. Your daily routine. A little care, kept simple.',
  manifest: appPath('manifest.webmanifest'), appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Skin Ritual' },
  icons: { icon: appPath('icon-192.png'), apple: appPath('apple-touch-icon.png') },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f6f7f5' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
