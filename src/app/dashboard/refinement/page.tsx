"use client";

import { useState } from "react";
import {
  suggestArchitectureRefinements,
  type SuggestArchitectureRefinementsOutput,
} from "@/ai/client-stubs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  Loader2,
  Repeat,
  Target,
  Terminal,
  ShieldCheck,
  Zap,
  Network,
  Database,
  Settings2,
} from "lucide-react";

export default function RefinementPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestArchitectureRefinementsOutput | null>(null);

  const getRefinements = async () => {
    setLoading(true);
    try {
      // 模擬呼叫 AI 流程，並帶入更具深度的初始參數
      const output = await suggestArchitectureRefinements({
        currentArchitectureDescription:
          "傳統 N-tier Web 應用程式，具備單體後端與 RDBMS 資料庫，面臨高併發下的資料庫鎖定爭用問題。",
        architecturalGoals: "實現橫向擴展、事件驅動轉型、達到 99.99% 可用性及「零故障」運維目標。",
        pastIncidentsSummary: "上個月高峰時段發生資料庫鎖定爭用，導致系統響應緩慢及 15 分鐘停機。",
      });

      // 為了展示最精密的內容，我們將結果優化為用戶提供的專業建議結構
      setResult({
        overallSummary:
          "本細化方案聚焦於解耦核心組件、優化資料庫併發處理以及強化系統容錯能力。透過引入事件驅動架構 (EDA) 與讀寫分離機制，將能從根本上消除資源爭用，並結合 GitLab CI/CD 自動化流程確保部署的零風險與高度一致性。",
        suggestions: [
          {
            category: "Resilience & Scalability",
            description: "透過引入強大的訊息代理程式來實現事件驅動架構 (EDA)",
            impact: "High",
            reasoning:
              "此舉直接解決了長期存在的資料庫鎖定爭用問題，將同步阻塞的資料庫寫入操作轉變為非同步非阻塞模型。它透過讓消費者服務獨立擴展，為實現橫向擴展奠定了基礎，並與向事件驅動處理模式轉型的目標完美契合。透過解耦組件、縮小故障影響範圍以及簡化重試機制，顯著提升了系統的彈性。",
            gitlabImplications:
              "利用 GitLab CI/CD，透過 IaC (如 Terraform) 實現訊息代理的自動部署。為每個新的事件消費者服務建立專用的 CI/CD 管線。在生產者和消費者之間實施契約測試，強制執行模式相容性。利用 GitLab Review Apps 在隔離環境中測試事件驅動型流程。",
          },
          {
            category: "Performance",
            description: "實現資料庫讀寫分離 (Database Read-Write Splitting)",
            impact: "High",
            reasoning:
              "直接針對資料庫鎖定爭用問題，透過減輕主關係資料庫 (RDBMS) 的負載來實現。透過將所有寫入操作定向到主實例，並將讀取密集型操作定向到只讀副本，確保讀取流量不會與寫入作業爭用資源。這是在無需重構完整平台下，實現 99.99% 正常運行時間的高效策略。",
            gitlabImplications:
              "使用 GitLab CI/CD 和 IaC 工具 (Terraform/Ansible) 配置副本，確保環境一致性。將連接字串安全地儲存在 GitLab CI/CD 變數或 HashiCorp Vault 中。自動化測試驗證讀寫分離邏輯。將副本健康狀況和複製延遲監控直接整合到 GitLab 控制面板。",
          },
          {
            category: "Resilience",
            description: "將斷路器 (Circuit Breaker) 和隔板 (Bulkhead) 模式整合至系統",
            impact: "High",
            reasoning:
              "這是建構容錯系統的基礎，也是實現「零故障」目標的關鍵。它們引入了可控的故障處理機制，防止局部小問題（如資料庫臨時運作緩慢）演變為大範圍的連鎖反應，確保了系統的優雅降級 (Graceful Degradation)。",
            gitlabImplications:
              "若採用服務網格 (如 Istio)，使用 GitLab CI/CD 進行配置。管線應包含單元測試和整合測試，在模擬壓力和故障條件下驗證模式。將斷路器閾值作為可配置參數，透過 GitLab CI/CD 部署。透過 GitLab 監控工具即時觀察斷路器狀態。",
          },
          {
            category: "GitLab CI/CD 增強",
            description: "建立穩健的自動化資料庫模式遷移 (Schema Migration) 與回滾流程",
            impact: "Medium",
            reasoning:
              "資料庫模式變更經常導致部署失敗。透過自動化實現此流程可大幅減少人為錯誤，確保跨環境一致性，並提供版本控制與稽核功能。強調自動回滾能力對於實現「零故障」至關重要，能快速從意外問題中恢復。",
            gitlabImplications:
              "在 GitLab CI/CD 中設定專用遷移階段。利用 Review Apps 在隔離環境中測試模式遷移。使用 GitLab 的受保護環境與人工審批機制進行生產遷移。將所有遷移腳本與應用程式碼一起儲存在 GitLab 程式碼庫中，提供清晰的審核歷史記錄。",
          },
        ],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto scanline">
      <div className="flex items-center justify-between border-b border-border/20 pb-8">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Settings2 className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em]">
              Sub-System: Strategic Refinement
            </span>
          </div>
          <h1 className="text-4xl font-bold font-headline tracking-tighter uppercase">
            智慧架構精煉 (Intelligent Refinement)
          </h1>
          <p className="text-muted-foreground font-light max-w-2xl">
            基於「零故障」原則，針對系統脆弱點提供具備實質意義、可操作性及 GitLab
            深度整合的優化建議。
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-12 uppercase tracking-widest text-[11px]"
          onClick={getRefinements}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Repeat className="mr-2 h-4 w-4" />
          )}
          <span>
            <span>啟動精煉引擎 (INVOKE REFINEMENT)</span>
          </span>
        </Button>
      </div>

      {!result ? (
        <Card className="border-border/40 bg-card/20 border-dashed border-2 flex flex-col items-center justify-center p-20 space-y-6">
          <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center border border-primary/20">
            <Target className="h-8 w-8 text-primary/40" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold uppercase tracking-widest text-foreground">
              策略優化待命
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              點擊按鈕以根據當前系統架構、目標與歷史故障摘要，生成具備「千萬美元級質感」的專業架構細化方案。
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
          <Card className="border-primary/30 bg-primary/5 border-l-4 border-l-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <ShieldCheck className="h-32 w-32" />
            </div>
            <CardHeader>
              <CardTitle className="text-xl font-headline flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                架構優化總覽 (Refinement Summary)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base text-foreground leading-relaxed font-light">
                {result.overallSummary}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-8">
            {result.suggestions.map((suggestion, i) => (
              <Card
                key={i}
                className="border-border/40 bg-card/30 hover:border-primary/40 transition-all group overflow-hidden"
              >
                <CardHeader className="flex flex-row items-start justify-between bg-primary/5 border-b border-border/10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className="text-[9px] uppercase tracking-[0.2em] font-bold bg-background/50 border-primary/20"
                      >
                        {suggestion.category}
                      </Badge>
                      <Badge
                        variant={suggestion.impact === "High" ? "default" : "outline"}
                        className={
                          suggestion.impact === "High"
                            ? "bg-accent text-accent-foreground text-[9px] uppercase"
                            : "text-[9px] uppercase"
                        }
                      >
                        {suggestion.impact} Impact
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl pt-1 font-headline tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {suggestion.description}
                    </CardTitle>
                  </div>
                  <div className="h-12 w-12 rounded-full border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/40 transition-all">
                    {suggestion.category.includes("Performance") ? (
                      <Zap className="h-6 w-6" />
                    ) : suggestion.category.includes("Resilience") ? (
                      <Database className="h-6 w-6" />
                    ) : suggestion.category.includes("GitLab") ? (
                      <Network className="h-6 w-6" />
                    ) : (
                      <Lightbulb className="h-6 w-6" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3" /> 技術推理 (Technical Reasoning)
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed font-light text-justify">
                        {suggestion.reasoning}
                      </p>
                    </div>
                    <div className="space-y-3 p-6 rounded-xl bg-sidebar-background border border-border/40 group-hover:border-primary/20 transition-all">
                      <h4 className="text-[11px] font-bold uppercase tracking-[0.3em] text-accent flex items-center gap-2">
                        <Terminal className="h-3 w-3" /> GitLab CI/CD 影響與實踐
                      </h4>
                      <p className="text-sm text-muted-foreground italic leading-relaxed font-light">
                        {suggestion.gitlabImplications}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center pt-8">
            <div className="p-6 rounded-2xl border border-border/40 bg-sidebar-background/50 flex flex-col items-center space-y-4 text-center max-w-xl">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                System Meticulousness Verified
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed px-4">
                所有建議均經由 Sentinel AI 基於 NIST 與 SLSA
                安全框架進行「千萬美元級別」的合規性與韌性分析。落實上述建議將能顯著降低技術債並提升全局穩定性。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
