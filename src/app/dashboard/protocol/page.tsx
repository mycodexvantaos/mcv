'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  Target,
  Zap,
  Activity,
  ShieldCheck,
  Cpu,
  Code,
  Network,
  ArrowRight,
  Calendar,
  GitBranch,
  Layers,
  Settings,
  Database,
  Lock,
  Terminal,
  Globe,
  Scale,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ProtocolPage() {
  const roadmap = [
    {
      month: 'Month 1: Capability Discovery Protocol',
      status: 'ACTIVE',
      icon: Network,
      color: 'text-primary',
      description: '建立輕量級節點註冊與發現機制。證明系統能識別並調用全球分散的 AI 能力。',
      repos: [
        'auth-service',
        'module-suite',
        'core-main',
        'config-manager',
        'event-bus',
        'observability-stack',
      ],
      deliverables: [
        '能力元數據規範 (Capability Metadata Spec)',
        '第一個 NodeClient 原型',
        '向量相似度路由邏輯',
      ],
    },
    {
      month: 'Month 2: Zero-Shot Tool Creation',
      status: 'FORGING',
      icon: Zap,
      color: 'text-accent',
      description: '證明系統能在無人類干預下，自主生成控制代碼操作陌生系統。',
      repos: ['core-deconstructor', 'fleet-sandbox', 'automation-core', 'policy-engine', 'cli'],
      deliverables: [
        '自我編程智能體 (ToolGenerator)',
        'Docker 隔離沙盒環境',
        '錯誤監測與自動修正迴圈',
      ],
    },
    {
      month: 'Month 3: Global Anomaly-Driven Orchestration',
      status: 'EVOLVING',
      icon: Activity,
      color: 'text-primary',
      description: '證明系統能不依賴人類 Prompt，自主感知世界、發現問題並生成任務。',
      repos: [
        'data-pipeline',
        'ai-engine',
        'decision-engine',
        'app-portal',
        'app-ui',
        'governance-autonomy',
      ],
      deliverables: [
        '全球脈搏感測儀 (GlobalPulseMonitor)',
        '自發性任務生成與調度',
        '智慧證明 (Proof-of-Intelligence) 共識',
      ],
    },
  ];

  const repoMatrix = [
    { id: 1, name: 'workflows', role: 'CI/CD 中樞', pillar: 'Infrastructure' },
    { id: 4, name: 'core-kernel', role: '神經中樞核心', pillar: 'Cognitive Fluidity' },
    { id: 5, name: 'core-deconstructor', role: '工程解構引擎', pillar: 'Ubiquitous Action' },
    { id: 11, name: 'auth-service', role: '身份認證協議', pillar: 'Cognitive Fluidity' },
    { id: 13, name: 'decision-engine', role: '自動決策仲裁', pillar: 'Organic Evolution' },
    { id: 18, name: 'ai-engine', role: '預測大腦 (RL)', pillar: 'Organic Evolution' },
    { id: 25, name: 'core-main', role: '系統主入口 (API)', pillar: 'Cognitive Fluidity' },
  ];

  return (
    <div className="p-8 space-y-10 max-w-[1600px] mx-auto scanline">
      {/* Header */}
      <div className="flex flex-col space-y-4 border-b border-border/20 pb-10">
        <div className="flex items-center gap-2 text-primary">
          <BookOpen className="h-6 w-6" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em]">
            Liquid Intelligence Protocol v4.0
          </span>
        </div>
        <h1 className="text-5xl font-bold font-headline tracking-tighter uppercase max-w-4xl leading-tight">
          3-Month MVP <span className="text-primary italic">Execution Matrix</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-3xl font-light">
          從協議設計到自主證明。這是一份將願景拆解為 25 個核心倉庫的具體工程實踐路徑。
        </p>
      </div>

      <Tabs defaultValue="roadmap" className="space-y-8">
        <TabsList className="bg-sidebar-background border border-border/40 p-1">
          <TabsTrigger
            value="roadmap"
            className="text-[10px] uppercase font-bold tracking-widest px-8"
          >
            MVP Roadmap
          </TabsTrigger>
          <TabsTrigger
            value="matrix"
            className="text-[10px] uppercase font-bold tracking-widest px-8"
          >
            Repository Matrix
          </TabsTrigger>
          <TabsTrigger
            value="consensus"
            className="text-[10px] uppercase font-bold tracking-widest px-8"
          >
            Liquid Consensus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap" className="space-y-8 animate-in fade-in duration-500">
          {roadmap.map((phase, i) => (
            <Card
              key={i}
              className="border-border/40 bg-card/20 hover:border-primary/30 transition-all overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <phase.icon className="h-40 w-40" />
              </div>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold text-primary tracking-widest border-primary/30"
                    >
                      Phase {i + 1}
                    </Badge>
                    <Badge className="bg-primary/20 text-primary border-none text-[8px] tracking-widest uppercase">
                      {phase.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-3xl font-headline pt-2">{phase.month}</CardTitle>
                  <CardDescription className="text-base max-w-2xl text-muted-foreground leading-relaxed italic">
                    {phase.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                      <Target className="h-3 w-3" /> Key Deliverables
                    </h4>
                    <ul className="space-y-2">
                      {phase.deliverables.map((item, j) => (
                        <li
                          key={j}
                          className="flex items-center gap-3 text-xs text-muted-foreground"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                      <GitBranch className="h-3 w-3" /> Repository Involvement
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {phase.repos.map((repo, j) => (
                        <Badge
                          key={j}
                          variant="secondary"
                          className="text-[9px] font-mono bg-sidebar-background border-border/40"
                        >
                          {repo}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent
          value="matrix"
          className="space-y-8 animate-in slide-in-from-bottom-4 duration-500"
        >
          <Card className="border-border/40 bg-card/20">
            <CardHeader>
              <CardTitle className="text-xl font-headline">
                Engineering Repository Mapping
              </CardTitle>
              <CardDescription>25 個微服務倉庫與四大支柱的權責矩陣。</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-background/40">
                  <TableRow className="border-border/40">
                    <TableHead className="w-[80px] text-[10px] font-bold uppercase">ID</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">
                      Repository Name
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">
                      Role / Responsibility
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">System Pillar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repoMatrix.map((repo) => (
                    <TableRow
                      key={repo.id}
                      className="border-border/40 hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="font-mono text-xs text-primary">
                        #{repo.id.toString().padStart(2, '0')}
                      </TableCell>
                      <TableCell className="font-bold text-xs text-foreground">
                        mycodexvanta-os-{repo.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground italic">
                        {repo.role}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[9px] border-primary/20 text-primary uppercase"
                        >
                          {repo.pillar}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-border/40 bg-primary/5 italic">
                    <TableCell
                      colSpan={4}
                      className="text-center text-[10px] text-muted-foreground"
                    >
                      Viewing 7 of 25 core repositories. Open matrix for full list.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consensus" className="space-y-8">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-border/40 bg-card/20">
              <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Proof-of-Intelligence
                </CardTitle>
                <CardDescription>人類專家與 AI 的價值對齊共識協議。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-sidebar-background border border-border/40 text-xs leading-relaxed text-muted-foreground">
                  當 AI 決策信心度 &lt; 85% 時，系統會自動在{' '}
                  <span className="text-accent font-bold">governance-autonomy</span>{' '}
                  倉庫發起懸賞任務，向全球專家節點請求協助。
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      Initial Bounty Pool
                    </p>
                    <p className="text-2xl font-mono font-bold text-primary">$500,000</p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">ACTIVE_FUND</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/20">
              <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center gap-2">
                  <Lock className="h-5 w-5 text-accent" />
                  Security Attestation
                </CardTitle>
                <CardDescription>基於 SHA-512 的決策完整性驗證。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-sidebar-background border border-border/40 font-mono text-[10px] overflow-hidden whitespace-nowrap text-muted-foreground/60">
                  ROOT_HASH: 0x8f2c1d9c3e4b9f2a5f6cf4d7b1a...
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  所有 Phase 1-3 的產出均經過{' '}
                  <span className="text-foreground font-bold">policy-engine</span>{' '}
                  的嚴格審計，確保自動生成的代碼符合零信任網路安全規範。
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-10 rounded-3xl border border-primary/10 bg-primary/5 flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
        <ShieldCheck className="h-12 w-12 text-primary animate-pulse" />
        <h3 className="text-xl font-headline uppercase tracking-widest">
          Protocol Integrity Verified
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed px-8">
          本工程路線圖與 25 個核心倉庫的映射已通過系統完整性校驗。所有交付物均設計為可在 12
          週內完成驗證。
        </p>
      </div>
    </div>
  );
}
