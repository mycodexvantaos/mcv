'use client';

import { useState } from 'react';
import {
  Grid3x3,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  GripVertical,
  Wand2,
  Loader2,
  Download,
  Brain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import type { ScenarioWizardStep, RequirementPriority } from '@/types/scenario';

const domains = [
  'Healthcare',
  'Finance',
  'Manufacturing',
  'IoT & Edge',
  'Retail & E-Commerce',
  'Education',
  'Government',
  'Telecommunications',
  'Autonomous Vehicles',
  'Energy & Utilities',
];

const steps: { id: ScenarioWizardStep; label: string }[] = [
  { id: 'domain', label: 'Domain Selection' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'constraints', label: 'Constraints' },
  { id: 'priority', label: 'Priority Ranking' },
];

const stepIndex: Record<ScenarioWizardStep, number> = {
  domain: 0,
  requirements: 1,
  constraints: 2,
  priority: 3,
};

export default function ScenariosPage() {
  const [currentStep, setCurrentStep] = useState<ScenarioWizardStep>('domain');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDesc, setScenarioDesc] = useState('');
  const [requirements, setRequirements] = useState([
    { metric: 'latency', value: '<100ms', priority: 'must' as RequirementPriority, weight: 9 },
    { metric: 'throughput', value: '>10K rps', priority: 'must' as RequirementPriority, weight: 8 },
  ]);
  const [constraints, setConstraints] = useState([
    { type: 'budget', value: '<$50K/month' },
    { type: 'compliance', value: 'HIPAA' },
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const currentStepIndex = stepIndex[currentStep];
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  const goNext = () => {
    const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
    setCurrentStep(steps[nextIndex].id);
  };

  const goPrev = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0);
    setCurrentStep(steps[prevIndex].id);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 3000);
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Scenario Matrix Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            No-code generation of application scenario matrices for technology selection
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 cursor-pointer ${i <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'}`}
              onClick={() => setCurrentStep(step.id)}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${i < currentStepIndex ? 'bg-accent text-accent-foreground' : i === currentStepIndex ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
              >
                {i < currentStepIndex ? '✓' : i + 1}
              </div>
              <span className="text-xs hidden md:inline">{step.label}</span>
            </div>
          ))}
        </div>
        <Progress value={progressPercent} className="h-1" />
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 'domain' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="scenario-name">Scenario Name</Label>
                <Input
                  id="scenario-name"
                  placeholder="e.g., Healthcare AI Diagnostics Platform"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scenario-desc">Description</Label>
                <Textarea
                  id="scenario-desc"
                  placeholder="Describe the application scenario..."
                  value={scenarioDesc}
                  onChange={(e) => setScenarioDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Domain</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {domains.map((domain) => (
                    <Button
                      key={domain}
                      variant={selectedDomain === domain ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedDomain(domain)}
                    >
                      {domain}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'requirements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Requirements</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() =>
                    setRequirements([
                      ...requirements,
                      {
                        metric: '',
                        value: '',
                        priority: 'should' as RequirementPriority,
                        weight: 5,
                      },
                    ])
                  }
                >
                  <Plus className="h-3.5 w-3.5" /> Add Requirement
                </Button>
              </div>
              {requirements.map((req, i) => (
                <div key={i} className="flex items-end gap-3 p-3 rounded-md bg-secondary/30">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px]">Metric</Label>
                    <Input
                      placeholder="e.g., latency"
                      value={req.metric}
                      onChange={(e) => {
                        const updated = [...requirements];
                        updated[i] = { ...updated[i], metric: e.target.value };
                        setRequirements(updated);
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px]">Target Value</Label>
                    <Input
                      placeholder="e.g., <100ms"
                      value={req.value}
                      onChange={(e) => {
                        const updated = [...requirements];
                        updated[i] = { ...updated[i], value: e.target.value };
                        setRequirements(updated);
                      }}
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-[10px]">Priority</Label>
                    <Select
                      value={req.priority}
                      onValueChange={(v: RequirementPriority) => {
                        const updated = [...requirements];
                        updated[i] = { ...updated[i], priority: v };
                        setRequirements(updated);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="must">Must Have</SelectItem>
                        <SelectItem value="should">Should Have</SelectItem>
                        <SelectItem value="nice">Nice to Have</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-[10px]">Weight (1-10)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={req.weight}
                      onChange={(e) => {
                        const updated = [...requirements];
                        updated[i] = { ...updated[i], weight: parseInt(e.target.value) || 5 };
                        setRequirements(updated);
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setRequirements(requirements.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {currentStep === 'constraints' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Constraints</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setConstraints([...constraints, { type: '', value: '' }])}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Constraint
                </Button>
              </div>
              {constraints.map((con, i) => (
                <div key={i} className="flex items-end gap-3 p-3 rounded-md bg-secondary/30">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px]">Type</Label>
                    <Input
                      placeholder="e.g., budget, compliance, timeline"
                      value={con.type}
                      onChange={(e) => {
                        const updated = [...constraints];
                        updated[i] = { ...updated[i], type: e.target.value };
                        setConstraints(updated);
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px]">Value</Label>
                    <Input
                      placeholder="e.g., <$50K/month"
                      value={con.value}
                      onChange={(e) => {
                        const updated = [...constraints];
                        updated[i] = { ...updated[i], value: e.target.value };
                        setConstraints(updated);
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setConstraints(constraints.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {currentStep === 'priority' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Drag to reorder requirements by priority. Higher positions indicate greater
                importance.
              </p>
              {requirements
                .sort((a, b) => b.weight - a.weight)
                .map((req, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-secondary/30">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <span className="text-xs font-mono text-muted-foreground w-6">#{i + 1}</span>
                    <div className="flex-1">
                      <span className="text-sm font-medium">{req.metric || 'Unnamed'}</span>
                      <span className="text-sm text-muted-foreground ml-2">{req.value}</span>
                    </div>
                    <Badge
                      variant={
                        req.priority === 'must'
                          ? 'default'
                          : req.priority === 'should'
                            ? 'secondary'
                            : 'outline'
                      }
                      className="text-[10px]"
                    >
                      {req.priority}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">w:{req.weight}</span>
                  </div>
                ))}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">AI Completeness Check</p>
                      <p className="text-xs text-muted-foreground">
                        Based on the {selectedDomain} domain, consider adding requirements for data
                        residency and audit logging.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStepIndex === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Step {currentStepIndex + 1} of {steps.length}
        </span>
        <Button
          onClick={goNext}
          disabled={currentStepIndex === steps.length - 1}
          className="gap-1.5"
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
