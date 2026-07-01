export const dynamic = 'force-static';
import { NextResponse } from 'next/server';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export async function GET() {
  const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar-1');

  // In a real app, you'd fetch this from a database or auth service
  const userProfile = {
    name: 'VantaOS Developer',
    email: 'admin@mycodexvantaos.dev',
    avatarUrl: userAvatar?.imageUrl || 'https://picsum.photos/seed/user1/40/40',
    avatarHint: userAvatar?.imageHint || 'person portrait',
  };

  return NextResponse.json(userProfile);
}
