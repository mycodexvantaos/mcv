'use client';

import type { Dispatch, SetStateAction } from 'react';
import {
  Terminal,
  Database,
  ShieldCheck,
  Cpu,
  Settings,
  Share2,
  LayoutDashboard,
  Code2,
  BarChart3,
  ClipboardList,
  CheckSquare,
  Braces,
  Zap,
  Globe,
  Orbit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IconSidebarProps {
  activeView: string;
  setActiveView: Dispatch<SetStateAction<string>>;
}

export function IconSidebar({ activeView, setActiveView }: IconSidebarProps) {
  const navItems = [
    { id: 'files', label: '檔案總管 (Layer A)', icon: Code2 },
    { id: 'generation', label: '源碼生成 (P9 Hub)', icon: Braces },
    { id: 'tasks', label: '共生任務 (P8 Hub)', icon: CheckSquare },
    { id: 'reality', label: '現實網格 (Layer P)', icon: Globe },
    { id: 'search', label: 'API 探險家', icon: Share2 },
    { id: 'source-control', label: '架構分析 (Governance)', icon: ClipboardList },
    { id: 'workstation', label: '管理員工作站 (Layer F)', icon: BarChart3 },
    { id: 'security', label: '安全性掃描 (Layer C)', icon: ShieldCheck },
    { id: 'runtime', label: '運行時核心 (Layer B)', icon: Cpu },
  ];

  return (
    <div className="flex h-full flex-col items-center justify-between border-r border-border bg-card/40 p-3 space-y-4">
      <div className="flex flex-col items-center gap-4">
        {navItems.map((item) => (
          <Tooltip key={item.id}>
            <TooltipTrigger asChild>
              <Button
                variant={activeView === item.id ? 'secondary' : 'ghost'}
                size="icon"
                className={`h-10 w-10 transition-all ${
                  activeView === item.id
                    ? 'bg-primary/10 text-primary border border-primary/20 scale-110 shadow-lg shadow-primary/5'
                    : 'text-muted-foreground hover:text-accent hover:bg-accent/5'
                }`}
                onClick={() => setActiveView(item.id)}
              >
                <item.icon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-popover text-popover-foreground border-border"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest">{item.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-muted-foreground hover:text-accent"
            >
              <Terminal className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-[10px] uppercase tracking-widest">系統終端</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={activeView === 'settings' ? 'secondary' : 'ghost'}
              size="icon"
              className={`h-10 w-10 transition-all ${
                activeView === 'settings'
                  ? 'text-accent bg-accent/5'
                  : 'text-muted-foreground hover:text-accent'
              }`}
              onClick={() => setActiveView('settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-[10px] uppercase tracking-widest">系統設置</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
