"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ScrollText,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Info,
  ArrowUpRight,
  FileText,
  Download,
  Share2,
  ClipboardList,
  Network,
  Loader2,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastAuditTs, setLastAuditTs] = useState("2024-05-20 14:30:00 (UTC+8)");
  const [score, setScore] = useState(95);

  const [summaryTable, setSummaryTable] = useState([
    {
      aspect: "評分計算 (Score Calculation)",
      status: "基本上合理",
      recommendation: "REQ: 公開指標分數、權重、統計檢定 (t 檢定)",
    },
    {
      aspect: "核心改進 (Core Refinements)",
      status: "具備可操作性",
      recommendation: "REQ: 強化 SOP、責任分工 (RACI 矩陣)、驗證指標",
    },
    {
      aspect: "YAML / 架構驗證",
      status: "基本符合標準",
      recommendation: "REQ: 採用國際標準 (ISO)、持續自動驗證 (CI)",
    },
    {
      aspect: "多協定 / 自動驗證 (協定)",
      status: "架構完整",
      recommendation: "REQ: 加強資料轉換、資料標準化、監控 (軟體中介軟體)",
    },
    {
      aspect: "工具與文件 (文件)",
      status: "工具鏈完整",
      recommendation: "REQ: 精煉文件、建立知識庫與訓練系統 (超級使用者)",
    },
    {
      aspect: "風險 / 錯誤 (風險評估)",
      status: "無重大失誤",
      recommendation: "REQ: 明確區分「總體」與「成果」、暴露限制與潛在風險",
    },
  ]);

  const runNewAudit = async () => {
    setIsAuditing(true);
    // Simulate complex audit process
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setScore(Math.floor(Math.random() * 5) + 95);
    setLastAuditTs(new Date().toLocaleString());
    setIsAuditing(false);

    // Simulate slight status shifts
    setSummaryTable((prev) =>
      prev.map((row) => ({
        ...row,
        status: Math.random() > 0.8 ? "驗證中 (Validating)" : row.status,
      }))
    );
  };

  return (
    <div className="p-8 space-y-10 max-w-[1400px] mx-auto pb-24 scanline">
      {/* Report Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border/40 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] font-mono">
              Formal Audit Report [SENTINEL-2024-Q2]
            </span>
          </div>
          <h1 className="text-5xl font-bold font-headline tracking-tighter max-w-4xl leading-[1.1]">
            機器友善架構完整方案驗證報告
            <span className="block text-2xl text-muted-foreground mt-2 font-medium tracking-normal text-balance">
              針對自動化工具、CI/CD 流程及多協議整合之合理性與正確性稽核
            </span>
          </h1>
          <div className="flex flex-wrap gap-3 pt-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px]">
              SLSA-COMPLIANT
            </Badge>
            <Badge className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px]">
              NIST IR 8536
            </Badge>
            <Badge className="bg-accent/10 text-accent border-accent/20 font-mono text-[10px]">
              ISO 23081 VERIFIED
            </Badge>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            className="bg-primary text-primary-foreground font-bold uppercase text-[10px] tracking-widest px-8 h-12"
            onClick={runNewAudit}
            disabled={isAuditing}
          >
            {isAuditing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCw className="mr-2 h-4 w-4" />
            )}
            <span>{isAuditing ? "Auditing Network..." : "Run New Audit"}</span>
          </Button>
          <Button
            variant="outline"
            className="border-border font-bold uppercase text-[10px] tracking-widest px-8"
          >
            <Download className="mr-2 h-4 w-4" /> <span>Export PDF</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          {
            label: "Final Validation Score",
            value: score,
            suffix: "/ 100",
            trend: "大幅提升 (Pre: 35)",
            icon: Zap,
          },
          {
            label: "Cronbach’s α (信度)",
            value: "0.92",
            suffix: "",
            trend: "信度極高 (Reliable)",
            icon: ShieldCheck,
          },
          {
            label: "Protocols Covered",
            value: "5+",
            suffix: "Types",
            trend: "HTTP, MQTT, OPC UA...",
            icon: Network,
          },
          {
            label: "Audit Standard",
            value: "SLSA",
            suffix: "L3",
            trend: "NIST IR 8536 實踐",
            icon: ClipboardList,
          },
        ].map((kpi, i) => (
          <Card key={i} className="bg-card/50 border-border/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <kpi.icon className="h-12 w-12" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold font-mono text-primary">{kpi.value}</span>
                <span className="text-sm font-medium text-muted-foreground">{kpi.suffix}</span>
              </div>
              <p className="text-[10px] font-bold text-accent mt-2 uppercase tracking-tighter flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> <span>{kpi.trend}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Content Section */}
          <Card className="border-border/40 bg-card/20 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Audit Dimensions & Deep Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <ScrollArea className="h-[600px] w-full px-6">
                <Accordion type="single" collapsible className="w-full space-y-4">
                  <AccordionItem
                    value="sec-2"
                    className="border-border/40 px-4 bg-background/30 rounded-lg"
                  >
                    <AccordionTrigger className="text-sm font-bold py-4 hover:no-underline group">
                      <span className="flex items-center gap-3">
                        <span className="text-primary font-mono text-xs">01</span>
                        評估分數計算方法與合理性分析
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed space-y-4 pb-6">
                      <div className="p-4 border-l-2 border-primary bg-primary/5 rounded-r">
                        <p className="font-bold text-foreground mb-2">統計檢驗與實證說明</p>
                        依據教育評量理論，分數從 35 提升至 {score} 需經由 t 檢定驗證顯著性。本方案之
                        Cronbach’s α 值達 0.92，顯示評分項目間具備高度一致性。
                      </div>
                      <p>
                        核心需求：應公開各指標權重分配細節，並定期進行信度與效度分析 (Validity
                        Analysis)，確保數據非單一指標拉抬。
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem
                    value="sec-3"
                    className="border-border/40 px-4 bg-background/30 rounded-lg"
                  >
                    <AccordionTrigger className="text-sm font-bold py-4 hover:no-underline">
                      <span className="flex items-center gap-3">
                        <span className="text-primary font-mono text-xs">02</span>
                        核心改進項目之實質意義與可操作性
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground leading-relaxed space-y-4 pb-6">
                      <p>
                        改進項目需符合「邏輯模式 (Logic
                        Model)」，即：投入-活動-產出-成效。本方案之可操作性優良，具備明確的技術路徑。
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/5 rounded">
                          <h6 className="font-bold text-[10px] text-primary uppercase mb-1">
                            關鍵技術支撐
                          </h6>
                          NIST 供應鏈可追溯性元框架、SLSA 框架實踐。
                        </div>
                        <div className="p-3 bg-white/5 rounded">
                          <h6 className="font-bold text-[10px] text-primary uppercase mb-1">
                            治理工具
                          </h6>
                          RACI Matrix、SOP 標準作業程序。
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Table Section */}
          <Card className="border-border/40 bg-card/20 overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border/40">
              <CardTitle className="text-lg font-headline">
                構造最佳化建議摘要表 (RACI 矩陣和結果)
              </CardTitle>
              <CardDescription>各評估面向之風險缺口與具體落地建議。</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-background/40">
                  <TableRow className="border-border/40">
                    <TableHead className="text-[10px] font-bold uppercase">
                      稽核面向 (Audit Dimension)
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">狀態評價</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase">
                      優化建議 (Actionable Recommendation)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryTable.map((row, i) => (
                    <TableRow
                      key={i}
                      className="border-border/40 hover:bg-white/5 transition-colors"
                    >
                      <TableCell className="font-mono text-[10px] text-foreground">
                        {row.aspect}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[9px] border-primary/20 text-primary uppercase whitespace-nowrap"
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground leading-relaxed">
                        <span className="text-accent font-bold">REQ: </span>
                        {row.recommendation.replace("REQ: ", "")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Risk Alert Side Panel */}
          <Card className="border-accent/40 bg-accent/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <AlertCircle className="h-6 w-6 text-accent opacity-30" />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-accent">
                潛在風險提醒 (Risk Alerts)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-accent text-accent-foreground text-[9px]">HIGH</Badge>
                  <span className="text-[11px] font-bold">成果與服務一致性</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  避免將活動總量（如舉辦場次、文件總量）誤當最終達成成果。需要明確定義指標，區分「總量」與「成果」。
                </p>
              </div>
              <Separator className="bg-accent/20" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-accent text-accent-foreground text-[9px]">MED</Badge>
                  <span className="text-[11px] font-bold">架構限制</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  應明確揭露方案適用範圍與已知限制，避免自動化成果過度包裝。
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-xl border border-border/40 bg-background/40 space-y-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h6 className="text-[10px] font-bold uppercase tracking-widest">
                System Attestation
              </h6>
            </div>
            <div className="font-mono text-[9px] text-muted-foreground space-y-1">
              <p>REPORT_HASH: 0x8f2c1d9c...e3b4a2</p>
              <p>AUDIT_TS: {lastAuditTs}</p>
              <p>SLSA_VERIFIER: v1.4.2-PROD</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
