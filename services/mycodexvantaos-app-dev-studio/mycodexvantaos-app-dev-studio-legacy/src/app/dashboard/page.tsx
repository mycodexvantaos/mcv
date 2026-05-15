'use client';

import { useState } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PanelBottomClose,
  PanelBottomOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { Header } from '@/components/dashboard/header';
import { IconSidebar } from '@/components/dashboard/icon-sidebar';
import { LeftPanel } from '@/components/dashboard/left-panel';
import { MainView } from '@/components/dashboard/main-view';
import { AiPanel } from '@/components/dashboard/ai-panel';

export default function DashboardPage() {
  const [activeView, setActiveView] = useState('search');
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen flex-col bg-background text-foreground font-body">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <IconSidebar activeView={activeView} setActiveView={setActiveView} />

          {isLeftPanelOpen && <LeftPanel activeView={activeView} />}

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex h-full">
              <div className="flex-1 flex flex-col min-w-0">
                <MainView />
              </div>

              {isRightPanelOpen && <AiPanel />}
            </div>

            <footer className="flex items-center justify-between border-t border-border px-4 py-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
                    >
                      {isLeftPanelOpen ? (
                        <PanelLeftClose className="h-4 w-4" />
                      ) : (
                        <PanelLeftOpen className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Toggle Left Panel</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <PanelBottomClose className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Toggle Bottom Panel</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div>
                <p>Ln 42, Col 18 | TypeScript React | UTF-8</p>
              </div>
              <div className="flex items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                    >
                      {isRightPanelOpen ? (
                        <PanelRightClose className="h-4 w-4" />
                      ) : (
                        <PanelRightOpen className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Toggle Right Panel</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
