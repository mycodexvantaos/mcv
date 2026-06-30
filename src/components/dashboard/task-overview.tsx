"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Zap, Plus, Infinity, Target, Users, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface Task {
  id: string;
  title: string;
  type: "system" | "user" | "evolution" | "symbiotic";
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  stage: string;
}

export function TaskOverview() {
  const [tasks] = useState<Task[]>([
    {
      id: "p9-1",
      title: "達成 Era-1 P9 最終閉環收斂 100%",
      type: "evolution",
      status: "completed",
      priority: "critical",
      stage: "P9",
    },
    {
      id: "p9-2",
      title: "鎖定全棧 Layer A-G 語義一致性",
      type: "system",
      status: "completed",
      priority: "critical",
      stage: "P9",
    },
    {
      id: "p8-1",
      title: "達成 P8 共生智慧人機耦合對齊",
      type: "evolution",
      status: "completed",
      priority: "critical",
      stage: "P8",
    },
    {
      id: "p7-1",
      title: "啟動 P7 遞歸元生自我重構協議",
      type: "evolution",
      status: "completed",
      priority: "high",
      stage: "P7",
    },
    {
      id: "p6-1",
      title: "執行 Layer F 治理自動化強制審計",
      type: "system",
      status: "completed",
      priority: "high",
      stage: "P6",
    },
    {
      id: "p5-1",
      title: "完成 Layer E 部署可移植性基準",
      type: "system",
      status: "completed",
      priority: "high",
      stage: "P5",
    },
    {
      id: "p4-1",
      title: "實現 Layer D 連接器抽象與解耦",
      type: "system",
      status: "completed",
      priority: "high",
      stage: "P4",
    },
    {
      id: "p3-1",
      title: "鎖定 Layer C 服務網格拓撲穩定性",
      type: "system",
      status: "completed",
      priority: "high",
      stage: "P3",
    },
    {
      id: "p2-1",
      title: "優化 Layer B 運行時內核自愈效能",
      type: "system",
      status: "completed",
      priority: "high",
      stage: "P2",
    },
    {
      id: "p1-1",
      title: "確立 Layer A 命名治理與語義基線",
      type: "system",
      status: "completed",
      priority: "high",
      stage: "P1",
    },
  ]);

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "critical":
        return "text-destructive border-destructive/20 bg-destructive/5";
      case "high":
        return "text-orange-500 border-orange-500/20 bg-orange-500/5";
      case "medium":
        return "text-primary border-primary/20 bg-primary/5";
      default:
        return "text-muted-foreground border-border bg-muted/5";
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-accent" />;
      case "in-progress":
        return <Zap className="h-4 w-4 text-primary animate-pulse" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 border-b border-border bg-card/40 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
          <Infinity className="h-4 w-4 text-accent" />
          Era-1 P9 | 閉環任務總匯
        </h2>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-accent">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="p-4">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-accent" />
                <span className="text-[10px] font-bold uppercase text-accent tracking-widest">
                  Era-1 P9 閉環達成 100%
                </span>
              </div>
              <span className="text-xs font-bold text-accent">STABILITY GAINED</span>
            </div>
            <Progress value={100} className="h-1.5 bg-accent/20" />
          </CardContent>
        </Card>
      </div>

      <ScrollArea className="flex-1 px-4 pb-4">
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card
              key={task.id}
              className="bg-card/30 border-border/50 hover:border-accent/30 transition-colors group"
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getStatusIcon(task.status)}</div>
                    <div className="space-y-1">
                      <p
                        className={`text-xs font-medium leading-none ${task.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"}`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[8px] h-4 py-0 px-1.5 uppercase font-code"
                        >
                          {task.stage}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
                          {task.type === "symbiotic" ? (
                            <Users className="h-2.5 w-2.5 text-accent" />
                          ) : (
                            <Target className="h-2.5 w-2.5" />
                          )}
                          {task.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`text-[8px] h-4 uppercase ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-card/20">
        <Button className="w-full h-9 text-[10px] uppercase gap-2 bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors">
          執行 Era-1 最終語義同步 <Infinity className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
