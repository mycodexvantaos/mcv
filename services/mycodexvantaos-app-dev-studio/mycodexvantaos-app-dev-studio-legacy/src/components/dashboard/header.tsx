'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';

type UserProfile = {
  name: string;
  email: string;
  avatarUrl: string;
  avatarHint: string;
};

export function Header() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    }
    fetchProfile();
  }, []);

  return (
    <header className="flex h-12 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-7 w-7 text-primary" />
        </Link>
        <Menubar className="border-none bg-transparent p-0">
          <MenubarMenu>
            <MenubarTrigger className="font-semibold text-base font-headline">
              MyCodeXvantaOS Studio
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem>About MyCodeXvantaOS Studio</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Preferences...</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Quit MyCodeXvantaOS Studio</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New File <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>New Window</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Open File...</MenubarItem>
              <MenubarItem>Open Project...</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Save</MenubarItem>
              <MenubarItem>Save As...</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Undo</MenubarItem>
              <MenubarItem>Redo</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Cut</MenubarItem>
              <MenubarItem>Copy</MenubarItem>
              <MenubarItem>Paste</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Appearance</MenubarItem>
              <MenubarItem>Editor Layout</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Documentation</MenubarItem>
              <MenubarItem>Show Release Notes</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                {userProfile ? (
                  <AvatarImage
                    src={userProfile.avatarUrl}
                    alt="User Avatar"
                    data-ai-hint={userProfile.avatarHint}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                )}
                <AvatarFallback>
                  {userProfile ? userProfile.name.charAt(0).toUpperCase() : ''}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{userProfile ? userProfile.name : 'My Account'}</DropdownMenuLabel>
            {userProfile && <DropdownMenuSeparator />}
            {userProfile && (
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                {userProfile.email}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Subscription</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/">Log out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
