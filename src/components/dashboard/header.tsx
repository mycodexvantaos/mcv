'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';

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
    <header className="flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
          <div className="flex flex-col">
            <span className="font-bold text-sm font-headline leading-none">MyCodeXvantaOS</span>
            <span className="text-[8px] uppercase tracking-widest text-primary font-bold">
              Era-3 Sovereign Core (P3)
            </span>
          </div>
        </Link>
        <Menubar className="border-none bg-transparent p-0 hidden md:flex">
          <MenubarMenu>
            <MenubarTrigger className="text-xs font-medium cursor-pointer">平台</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>關於 Era-3</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>主權偏好設定...</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>切換 Reality 映射模式</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs font-medium cursor-pointer">核心</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                新建 Reality 節點 <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>主權協作面板</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>同步到 Reality Mesh</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger className="text-xs font-medium cursor-pointer">治理</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Era-3 P3 合成擴張</MenubarItem>
              <MenubarItem>跨節點主權協同</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>查看 Synthesis 報告</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#2663D9]"></div>
          <span className="text-[10px] font-code text-primary uppercase tracking-wider">
            Era-3 P3 Synthesis Expansion Active
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-primary"
            >
              <Avatar className="h-9 w-9 border border-border">
                {userProfile ? (
                  <AvatarImage
                    src={userProfile.avatarUrl}
                    alt="User Avatar"
                    data-ai-hint={userProfile.avatarHint}
                  />
                ) : (
                  <div className="h-full w-full bg-muted animate-pulse" />
                )}
                <AvatarFallback className="bg-secondary text-xs">
                  {userProfile ? userProfile.name.charAt(0).toUpperCase() : 'OS'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="font-bold">{userProfile ? userProfile.name : '主權管理員'}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {userProfile ? userProfile.email : 'sovereign@mycodexvantaos.local'}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs">
              帳戶角色
              <Badge
                variant="outline"
                className="ml-auto text-[10px] h-4 bg-primary/10 text-primary border-primary/20"
              >
                Sovereign Architect
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-xs text-destructive focus:text-destructive">
              <Link href="/">登出主權智能</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
