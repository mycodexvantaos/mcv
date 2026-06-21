import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Humaniser — MyCodeXvantaOS',
  description: 'Detect AI-generated content and humanise text to sound more natural',
};

export default function HumaniserLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
