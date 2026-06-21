# Application Pipeline - Integration Guide

## Quick Start

### 1. Installation

```bash
# Copy skill to your project
cp -r /home/ubuntu/skills/application-pipeline ~/your-project/skills/

# Install dependencies
npm install jszip @anthropic-ai/sdk
```

### 2. Basic Setup

```javascript
import { ApplicationPipeline } from './skills/application-pipeline/core/pipeline.js';

const pipeline = new ApplicationPipeline({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-20250514',
});
```

### 3. Usage Example

```javascript
// Upload ZIP files
const projects = await pipeline.uploadZips([file1, file2, file3]);

// Analyze each version
const analyses = await pipeline.analyzeAll(projects);

// Detect conflicts
const conflicts = await pipeline.detectConflicts(projects);

// Generate synthesis
const report = await pipeline.synthesize(projects);

console.log(report);
```

---

## Integration Patterns

### Pattern 1: React Component Integration

```jsx
import PipelineUI from './skills/application-pipeline/core/PipelineUI.jsx';

export default function App() {
  return (
    <div>
      <h1>ZIP Synthesis Platform</h1>
      <PipelineUI />
    </div>
  );
}
```

### Pattern 2: Node.js CLI Integration

```javascript
// cli.js
import { ApplicationPipeline } from './skills/application-pipeline/core/pipeline.js';
import fs from 'fs';

const pipeline = new ApplicationPipeline();

async function main() {
  const files = process.argv.slice(2);
  const zips = await pipeline.uploadZips(files.map((f) => new File([fs.readFileSync(f)], f)));

  const analyses = await pipeline.analyzeAll(zips);
  const report = await pipeline.synthesize(zips);

  console.log(JSON.stringify(report, null, 2));
}

main().catch(console.error);
```

### Pattern 3: GitHub Actions Integration

```yaml
name: Application Pipeline

on: [push]

jobs:
  merge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run Pipeline
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          node scripts/run-pipeline.js \
            --input versions/*.zip \
            --output merged.zip \
            --report report.json

      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: synthesis-report
          path: report.json
```

### Pattern 4: Web API Integration

```javascript
// server.js
import express from 'express';
import { ApplicationPipeline } from './skills/application-pipeline/core/pipeline.js';

const app = express();
const pipeline = new ApplicationPipeline();

app.post('/api/analyze', async (req, res) => {
  try {
    const files = req.files.map((f) => new File([f.buffer], f.originalname));
    const projects = await pipeline.uploadZips(files);
    const analyses = await pipeline.analyzeAll(projects);
    res.json({ success: true, analyses });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/synthesize', async (req, res) => {
  try {
    const report = await pipeline.synthesize();
    res.json(report);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000);
```

---

## Advanced Configurations

### Configuration 1: Custom Merge Strategy

```javascript
const customStrategy = {
  'package.json': (versions) => {
    const merged = { ...versions[0] };
    versions.forEach((v) => {
      merged.dependencies = { ...merged.dependencies, ...v.dependencies };
      merged.devDependencies = { ...merged.devDependencies, ...v.devDependencies };
    });
    return merged;
  },
  '*.yaml': (versions) => {
    // Deep merge YAML
    return deepMergeYaml(versions);
  },
  '*.md': (versions) => {
    // Combine markdown files
    return versions.map((v, i) => `## Version ${i + 1}\n\n${v}`).join('\n\n');
  },
};

const report = await pipeline.synthesize(projects, customStrategy);
```

### Configuration 2: Selective Analysis

```javascript
// Only analyze specific file types
const pipeline = new ApplicationPipeline({
  fileFilter: (name) => {
    const extensions = ['.ts', '.tsx', '.js', '.json', '.yaml', '.yml'];
    return extensions.some((ext) => name.endsWith(ext));
  },
});
```

### Configuration 3: Conflict Priority

```javascript
// Prioritize conflicts by severity
const prioritizedConflicts = conflicts.sort((a, b) => b.severity - a.severity).slice(0, 10); // Top 10 conflicts

// Focus on critical conflicts
const criticalConflicts = conflicts.filter((c) => c.severity >= 2);
```

---

## Event Handling

### Listen to Pipeline Events

```javascript
pipeline.on('analyzing', ({ projectId, name }) => {
  console.log(`Analyzing ${name}...`);
});

pipeline.on('analyzed', ({ projectId, analysis }) => {
  console.log(`Analysis complete:`, analysis.tags);
});

pipeline.on('synthesizing', ({ count }) => {
  console.log(`Synthesizing ${count} versions...`);
});

pipeline.on('synthesized', ({ report }) => {
  console.log(`Synthesis complete`);
});

pipeline.on('error', ({ error }) => {
  console.error(`Error: ${error}`);
});
```

---

## Error Handling

### Common Errors and Solutions

```javascript
try {
  const projects = await pipeline.uploadZips(files);
} catch (e) {
  if (e.message.includes('File too large')) {
    console.error('ZIP file exceeds size limit');
  } else if (e.message.includes('Invalid ZIP')) {
    console.error('File is not a valid ZIP archive');
  } else {
    console.error('Upload failed:', e.message);
  }
}
```

### Retry Logic

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      const delay = Math.pow(2, i) * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

const report = await retryWithBackoff(() => pipeline.synthesize(projects));
```

---

## Performance Optimization

### Parallel Analysis

```javascript
// Analyze multiple projects in parallel
const analyses = await Promise.all(projects.map((p) => pipeline.analyzeOne(p)));
```

### Caching

```javascript
const cache = new Map();

async function getCachedAnalysis(projectId) {
  if (cache.has(projectId)) {
    return cache.get(projectId);
  }

  const analysis = await pipeline.analyzeOne(projectId);
  cache.set(projectId, analysis);
  return analysis;
}
```

### Streaming

```javascript
// Stream results as they become available
const stream = pipeline.synthesizeStream(projects);

stream.on('data', (chunk) => {
  console.log('Received:', chunk);
});

stream.on('end', () => {
  console.log('Synthesis complete');
});
```

---

## Testing

### Unit Tests

```javascript
import { describe, it, expect } from 'vitest';
import { ApplicationPipeline } from './pipeline.js';

describe('ApplicationPipeline', () => {
  it('should detect project type', () => {
    const pipeline = new ApplicationPipeline();
    const files = [{ name: 'package.json' }, { name: 'src/index.ts' }];
    expect(pipeline.detectType(files)).toBe('TypeScript/Node');
  });

  it('should merge JSON files', () => {
    const pipeline = new ApplicationPipeline();
    const versions = [{ dependencies: { a: '1.0' } }, { dependencies: { b: '2.0' } }];
    const merged = pipeline.mergeJson(versions);
    expect(merged.dependencies).toEqual({ a: '1.0', b: '2.0' });
  });
});
```

### Integration Tests

```javascript
describe('Pipeline Integration', () => {
  it('should analyze and synthesize', async () => {
    const pipeline = new ApplicationPipeline();

    // Mock files
    const projects = [
      { name: 'v1.zip', files: [], type: 'TypeScript' },
      { name: 'v2.zip', files: [], type: 'TypeScript' },
    ];

    const report = await pipeline.synthesize(projects);
    expect(report).toHaveProperty('strategy');
    expect(report).toHaveProperty('report');
  });
});
```

---

## Deployment

### Docker Deployment

```dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

CMD ["node", "server.js"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pipeline-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pipeline
  template:
    metadata:
      labels:
        app: pipeline
    spec:
      containers:
        - name: pipeline
          image: pipeline:latest
          env:
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: api-keys
                  key: anthropic
          ports:
            - containerPort: 3000
```

---

## Monitoring

### Logging

```javascript
pipeline.on('analyzing', (data) => {
  logger.info('Analysis started', { projectId: data.projectId });
});

pipeline.on('analyzed', (data) => {
  logger.info('Analysis complete', {
    projectId: data.projectId,
    tags: data.analysis.tags,
  });
});

pipeline.on('error', (data) => {
  logger.error('Pipeline error', { error: data.error });
});
```

### Metrics

```javascript
const metrics = {
  projectsAnalyzed: 0,
  conflictsDetected: 0,
  synthesisTime: 0,
};

pipeline.on('analyzed', () => {
  metrics.projectsAnalyzed++;
});

pipeline.on('synthesizing', async () => {
  const start = Date.now();
  await pipeline.synthesize();
  metrics.synthesisTime = Date.now() - start;
});
```

---

## Troubleshooting

### Issue: "API Rate Limit"

```javascript
// Implement exponential backoff
const retryWithBackoff = async (fn) => {
  for (let i = 0; i < 5; i++) {
    try {
      return await fn();
    } catch (e) {
      if (e.status === 429) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw e;
      }
    }
  }
};
```

### Issue: "Out of Memory"

```javascript
// Process files in chunks
async function processInChunks(files, chunkSize = 50) {
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    await pipeline.analyzeAll(chunk);
    // Clear memory
    gc();
  }
}
```

### Issue: "Conflict Markers Remain"

```javascript
// Use stronger regex
const removeConflictMarkers = (content) => {
  return content.replace(/^<{7}[^\n]*\n[\s\S]*?^={7}\n[\s\S]*?^>{7}[^\n]*$/gm, '').trim();
};
```

---

## Best Practices

1. **Always validate input** - Check file types and sizes
2. **Use caching** - Avoid re-analyzing same projects
3. **Implement retry logic** - Handle transient failures
4. **Monitor performance** - Track analysis and synthesis times
5. **Handle errors gracefully** - Provide meaningful error messages
6. **Test thoroughly** - Unit and integration tests
7. **Document decisions** - Keep track of merge rationale
8. **Version control** - Store reports and artifacts

---

## Support

For issues or questions, refer to:

- `SKILL.md` - Core documentation
- `examples/` - Usage examples
- `core/` - Source code
