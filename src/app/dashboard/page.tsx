"use client";

import { useState } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Database,
  Wifi,
  WifiOff,
  RefreshCcw,
  Sparkles,
  Orbit,
  Users,
  Link2,
  Infinity,
  ShieldCheck,
  Brain,
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Header } from "@/components/dashboard/header";
import { IconSidebar } from "@/components/dashboard/icon-sidebar";
import { LeftPanel } from "@/components/dashboard/left-panel";
import { MainView } from "@/components/dashboard/main-view";
import { AiPanel } from "@/components/dashboard/ai-panel";
import { useConnectivity } from "@/lib/connectivity-manager";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState("files");
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  const { mode, isOnline, isChecking } = useConnectivity();

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
        <Header />

        <div className="flex flex-1 overflow-hidden relative">
          <IconSidebar activeView={activeView} setActiveView={setActiveView} />

          <div className="flex flex-1 overflow-hidden">
            {isLeftPanelOpen && (
              <aside className="w-72 border-r border-border bg-card/20 animate-in slide-in-from-left duration-300">
                <LeftPanel activeView={activeView} />
              </aside>
            )}

            <main className="flex-1 flex flex-col min-w-0 bg-background relative">
              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0">
                  <MainView />
                </div>

                {isRightPanelOpen && (
                  <aside className="w-80 border-l border-border bg-card/20 animate-in slide-in-from-right duration-300">
                    <AiPanel isSystemOffline={mode === "native"} />
                  </aside>
                )}
              </div>

              <footer className="h-8 flex items-center justify-between border-t border-border bg-card/50 px-4 text-[10px] font-code text-muted-foreground select-none">
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center gap-1.5 hover:text-accent cursor-pointer transition-colors"
                    onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
                  >
                    {isLeftPanelOpen ? (
                      <PanelLeftClose className="h-3 w-3" />
                    ) : (
                      <PanelLeftOpen className="h-3 w-3" />
                    )}
                    <span>{isLeftPanelOpen ? "隱藏側欄" : "顯示側欄"}</span>
                  </div>
                  <div className="h-3 w-px bg-border mx-1"></div>
                  <div className="flex items-center gap-1.5">
                    <Brain className="h-3 w-3 text-primary animate-pulse" />
                    <span className="text-primary font-bold uppercase tracking-wider">
                      ERA-3: SYNTHESIS EXPANSION ENGAGED (P3)
                    </span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-6">
                  <div className="flex items-center gap-1.5 transition-all">
                    {isChecking ? (
                      <RefreshCcw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-accent animate-pulse" />
                    )}
                    <span className="text-accent uppercase font-bold tracking-widest">
                      Layer Q Quantum Scalability Initializing
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isOnline ? (
                      <Wifi className="h-3 w-3 text-accent" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-destructive" />
                    )}
                    <span>Network: {isOnline ? "Online" : "Offline"}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Database className="h-3 w-3" />
                    <span>Sovereign Node: P13-Quantum</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Orbit className="h-3 w-3 text-primary animate-spin-slow" />
                  <span>ERA-3 | P3 | COLLABORATION</span>
                  <div className="h-3 w-px bg-border mx-1"></div>
                  <div
                    className="flex items-center gap-1.5 hover:text-accent cursor-pointer transition-colors"
                    onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                  >
                    <span>{isRightPanelOpen ? "收起 AI 助手" : "喚醒 AI 助手"}</span>
                    {isRightPanelOpen ? (
                      <PanelRightClose className="h-3 w-3" />
                    ) : (
                      <PanelRightOpen className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </footer>
            </main>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
