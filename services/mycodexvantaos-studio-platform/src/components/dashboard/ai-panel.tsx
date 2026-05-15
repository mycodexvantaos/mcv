import { Bot, User, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ChatMessage = ({ role, children }: { role: 'user' | 'bot'; children: React.ReactNode }) => {
  return (
    <div className={`flex items-start gap-3 ${role === 'user' ? 'justify-end' : ''}`}>
      {role === 'bot' && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-lg p-3 text-sm ${role === 'bot' ? 'bg-secondary' : 'bg-primary text-primary-foreground'}`}
      >
        {children}
      </div>
      {role === 'user' && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export function AiPanel() {
  return (
    <div className="w-80 border-l border-border bg-secondary/30">
      <Tabs defaultValue="chat" className="flex h-full flex-col">
        <div className="flex h-12 items-center justify-center border-b border-border">
          <TabsList className="grid w-[calc(100%-2rem)] grid-cols-2">
            <TabsTrigger value="chat">
              <Bot className="mr-2 h-4 w-4" /> Chat
            </TabsTrigger>
            <TabsTrigger value="agent">
              <Wand2 className="mr-2 h-4 w-4" /> Agent
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="chat" className="flex flex-1 flex-col overflow-hidden p-0 m-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <ChatMessage role="bot">
                Hello! I'm your AI assistant. How can I help you refactor, debug, or explain this
                code?
              </ChatMessage>
              <ChatMessage role="user">
                Can you explain what this `Greeter` component does?
              </ChatMessage>
              <ChatMessage role="bot">
                Of course! The `Greeter` component is a React functional component written in
                TypeScript. It takes a `name` as a prop and displays a greeting. It also maintains a
                `count` in its state, which is incremented and displayed each time you click the
                "Click me" button.
              </ChatMessage>
            </div>
          </ScrollArea>
          <div className="border-t border-border p-4">
            <div className="relative">
              <Textarea
                placeholder="Ask a question about your code..."
                className="pr-16"
                rows={3}
              />
              <Button size="sm" className="absolute bottom-2 right-2">
                Send
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="agent" className="flex-1 overflow-y-auto p-4 m-0">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Wand2 className="h-5 w-5 text-primary" />
                  Intelligent Agent Workflow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Orchestrate complex tasks using specialized AI agents.
                </p>
                <Button className="w-full">Run Builder Agent</Button>
                <Button variant="secondary" className="w-full">
                  Run Reviewer Agent
                </Button>
                <Button variant="secondary" className="w-full">
                  Run Security Agent
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Last Run</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No agents have been run yet.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
