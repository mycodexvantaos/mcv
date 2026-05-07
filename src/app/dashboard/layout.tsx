'use client';

import { useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Header } from '@/components/dashboard/header';
import { IconSidebar } from '@/components/dashboard/icon-sidebar';
import { AiPanel } from '@/components/dashboard/ai-panel';
import { StatusBar } from '@/components/dashboard/status-bar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [activeView, setActiveView] = useState('files');

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen flex-col bg-background text-foreground font-body">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <IconSidebar activeView={activeView} setActiveView={setActiveView} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex h-full">
              <div className="flex-1 flex flex-col min-w-0 overflow-auto">
                {children}
              </div>
              {isRightPanelOpen && <AiPanel />}
            </div>
            <StatusBar
              isLeftPanelOpen={true}
              isRightPanelOpen={isRightPanelOpen}
              onToggleLeftPanel={() => {}}
              onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}