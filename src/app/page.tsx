import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Box, Cpu, Globe, Layers, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/icons/logo";

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === "hero-image");

  const coreValues = [
    {
      icon: <Layers className="h-6 w-6 text-accent" />,
      title: "Local-First",
      description: "零外部依賴，最小環境即可成立，確保開發主權。",
    },
    {
      icon: <Globe className="h-6 w-6 text-accent" />,
      title: "Cloud-Agnostic",
      description: "核心語義不綁定雲廠商，部署目標自由遷移。",
    },
    {
      icon: <Cpu className="h-6 w-6 text-accent" />,
      title: "Contract-First",
      description: "穩定契約優先，實現與供應商完全解耦。",
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-accent" />,
      title: "Governance-Enforced",
      description: "機器強制執行治理規則，自動化預防架構漂移。",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-3">
            <Logo className="h-10 w-10 text-primary" />
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none tracking-tighter">
                MyCodeXvantaOS
              </span>
              <span className="text-[10px] uppercase text-accent tracking-[0.2em] font-bold">
                Era-1 Quantum
              </span>
            </div>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link href="#arch" className="transition-colors hover:text-accent">
                架構
              </Link>
              <Link href="#native" className="transition-colors hover:text-accent">
                原生雲
              </Link>
              <Link href="/dashboard" className="transition-colors hover:text-accent">
                控制台
              </Link>
            </nav>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">登入</Link>
              </Button>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                asChild
              >
                <Link href="/dashboard">
                  立即啟動 <Zap className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10 opacity-20">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-[120px]"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-[120px]"></div>
          </div>

          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="inline-flex items-center rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-medium text-accent neon-glow">
                Era-1: The Convergence Milestone
              </div>
              <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                程式碼深度，<span className="text-primary">系統智慧</span>
              </h1>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                MyCodeXvantaOS 已完成 Era-1 閉環。
                一個全自架構、自搭建的強原生雲應用操作系統，現已進入 100% 語義穩定態。
              </p>
              <div className="flex flex-col gap-3 min-[400px]:flex-row pt-4">
                <Button size="lg" className="h-12 px-8 primary-glow" asChild>
                  <Link href="/dashboard">
                    啟動 Era-1 核心 <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 border-border hover:bg-secondary"
                  asChild
                >
                  <Link href="#arch">檢閱 Era-1 規範</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="arch" className="container py-12 md:py-24 lg:py-32">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {coreValues.map((value, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/5"
              >
                <div className="mb-4 rounded-lg bg-accent/10 p-2 w-fit group-hover:scale-110 transition-transform">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-secondary/20">
          <div className="container py-16 md:py-24 lg:py-32">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Era-1: 全棧應用的最終閉環
                </h2>
                <p className="text-muted-foreground">
                  無需第三方服務，即可在本地完成專案創立、前端渲染、後端邏輯生成與資料結構映射。
                  Era-1 代表了系統在任何環境下皆能「自我成立」的最終驗證。
                </p>
                <ul className="space-y-3">
                  {[
                    "Era-1 獨立性 (Era-1 Independence)",
                    "量子權重感知的核心 (Era-Q Aware)",
                    "100% 語義閉環 (Semantic Closure)",
                    "P9 自遞歸治理循環",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent"></div>
                      <span className="text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 relative aspect-video w-full max-w-2xl rounded-2xl overflow-hidden border border-border shadow-2xl">
                {heroImage && (
                  <Image
                    src={heroImage.imageUrl}
                    alt="System Architecture"
                    fill
                    className="object-cover opacity-80"
                    data-ai-hint="futuristic command center"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 p-4 glass-panel rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Box className="h-4 w-4 text-accent" />
                    <span className="text-[10px] font-code uppercase tracking-widest text-accent">
                      Era-1 Runtime Active
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent shadow-[0_0_10px_#52E0B0]"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-12 bg-card/50">
        <div className="container grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Logo className="h-8 w-8 text-primary" />
              <span className="font-bold">MyCodeXvantaOS</span>
            </div>
            <p className="text-xs text-muted-foreground leading-loose">
              極深數碼科技有限公司 © {new Date().getFullYear()}
              <br />
              Era-1 Quantum | 程式碼深度，系統智慧
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 uppercase tracking-widest">技術架構</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-accent">
                  Era-1: Builder
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent">
                  Era-1: Runtime
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent">
                  Era-1: Native Services
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent">
                  Era-Q Quantum Layer
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 uppercase tracking-widest">治理規範</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-accent">
                  Era-1 命名閉環
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent">
                  Era-1 Provider 抽象
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent">
                  Era-1 CI 合規
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent">
                  Era-1 審計體系
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-4 uppercase tracking-widest">法律與合規</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-accent">
                  開源許可協定
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent">
                  數據主權聲明
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-accent">
                  隱私權政策
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
