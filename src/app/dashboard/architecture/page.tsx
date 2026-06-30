"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GitBranch, Save, RefreshCw, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ArchitecturePage() {
  const { toast } = useToast();
  const [definition, setDefinition] = useState(`@startuml
package "Sentinel Core" {
  [API Gateway] --> [Auth Service]
  [API Gateway] --> [Risk Engine]
}

database "Arch Store" {
  [Snapshots]
}
@enduml`);

  const handleSync = () => {
    toast({
      title: "Sync Initiated",
      description: "Pushing architecture as code to GitLab repository...",
    });
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-bold font-headline">Architecture Definition</h1>
          <p className="text-muted-foreground">
            Define your system as code for meticulous version control.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-primary/40" onClick={handleSync}>
            <GitBranch className="mr-2 h-4 w-4" /> Sync GitLab
          </Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Save className="mr-2 h-4 w-4" /> Save Snapshot
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/40 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Editor (PlantUML / Mermaid)
            </CardTitle>
            <CardDescription>Live sync with project master branch.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={definition}
              onChange={(e) => setDefinition(e.target.value)}
              className="min-h-[500px] font-mono text-sm bg-background/50 border-border/40 focus:ring-primary"
            />
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50 flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Visualization Preview
            </CardTitle>
            <CardDescription>Real-time dependency mapping.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-0">
            <div className="w-full h-full bg-sidebar-background rounded-b-lg flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
              <div className="w-full max-w-md aspect-video border-2 border-dashed border-border/60 rounded-xl flex items-center justify-center">
                <p className="text-xs uppercase tracking-tighter">Rendering Engine Active</p>
              </div>
              <p className="text-sm max-w-xs">
                Visualization updates automatically as you define components and data flows.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
