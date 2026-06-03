# Application Pipeline - Usage Examples

## Example 1: Multi-Version Project Integration

### Scenario
You have three versions of a Node.js project and want to merge them into one optimized version.

### Code

```javascript
import { ApplicationPipeline } from '../core/pipeline.js';
import fs from 'fs';

async function mergeProjectVersions() {
  const pipeline = new ApplicationPipeline({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  // Load ZIP files
  const files = [
    new File([fs.readFileSync('project-v1.zip')], 'project-v1.zip'),
    new File([fs.readFileSync('project-v2.zip')], 'project-v2.zip'),
    new File([fs.readFileSync('project-v3.zip')], 'project-v3.zip')
  ];

  // Step 1: Upload and parse
  console.log('📦 Uploading projects...');
  const projects = await pipeline.uploadZips(files);
  console.log(`✓ Uploaded ${projects.length} projects`);

  // Step 2: Analyze each version
  console.log('🔍 Analyzing projects...');
  const analyses = await pipeline.analyzeAll(projects);
  analyses.forEach((a, i) => {
    console.log(`✓ v${i+1}: ${a.tags.join(', ')}`);
  });

  // Step 3: Detect conflicts
  console.log('⚠️  Detecting conflicts...');
  const conflicts = await pipeline.detectConflicts(projects);
  console.log(`✓ Found ${conflicts.length} conflicts`);
  conflicts.slice(0, 5).forEach(c => {
    console.log(`  - ${c.file} (severity: ${c.severity})`);
  });

  // Step 4: Generate synthesis
  console.log('🔄 Synthesizing merged version...');
  const report = await pipeline.synthesize(projects);
  
  // Step 5: Output results
  console.log('\n=== SYNTHESIS REPORT ===');
  console.log(report.report);
  
  // Save report
  fs.writeFileSync('synthesis-report.json', JSON.stringify(report, null, 2));
  console.log('\n✓ Report saved to synthesis-report.json');
}

mergeProjectVersions().catch(console.error);
```

### Output

```
📦 Uploading projects...
✓ Uploaded 3 projects

🔍 Analyzing projects...
✓ v1: TypeScript, Node.js, Express
✓ v2: TypeScript, Node.js, Express, React
✓ v3: TypeScript, Node.js, Express, React, GraphQL

⚠️  Detecting conflicts...
✓ Found 15 conflicts

=== SYNTHESIS REPORT ===
【Synthesis Strategy Overview】
Integrate three versions of a Node.js TypeScript project...
```

---

## Example 2: Dependency Conflict Resolution

### Scenario
Multiple versions have conflicting package.json dependencies.

### Code

```javascript
import { ApplicationPipeline } from '../core/pipeline.js';

async function resolveDependencyConflicts() {
  const pipeline = new ApplicationPipeline();

  // Custom merge strategy for dependencies
  const customStrategy = {
    'package.json': (versions) => {
      const merged = { ...versions[0] };
      
      // Merge dependencies
      merged.dependencies = {};
      merged.devDependencies = {};
      
      versions.forEach(v => {
        Object.assign(merged.dependencies, v.dependencies || {});
        Object.assign(merged.devDependencies, v.devDependencies || {});
      });
      
      // Resolve version conflicts
      Object.keys(merged.dependencies).forEach(pkg => {
        const versions = [];
        versions.forEach(v => {
          if (v.dependencies?.[pkg]) {
            versions.push(v.dependencies[pkg]);
          }
        });
        // Use latest version
        merged.dependencies[pkg] = versions.sort().pop();
      });
      
      return merged;
    }
  };

  const projects = await pipeline.uploadZips(zipFiles);
  const report = await pipeline.synthesize(projects, customStrategy);
  
  console.log('✓ Dependencies resolved');
  return report;
}
```

---

## Example 3: React Component Integration

### Scenario
Use the pipeline in a React web application.

### Code

```jsx
import React, { useState } from 'react';
import PipelineUI from '../core/PipelineUI.jsx';

export default function ZipSynthesisApp() {
  const [report, setReport] = useState(null);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>ZIP Synthesis Platform</h1>
      <p>Upload multiple ZIP files to analyze and synthesize them into one optimized version.</p>
      
      <PipelineUI onSynthesis={setReport} />
      
      {report && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5' }}>
          <h2>Synthesis Report</h2>
          <pre>{JSON.stringify(report, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
```

---

## Example 4: GitHub Actions Workflow

### Scenario
Automatically merge project versions on push.

### Code

```yaml
# .github/workflows/merge-versions.yml
name: Merge Project Versions

on:
  push:
    paths:
      - 'versions/*.zip'

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
          node scripts/merge-versions.js \
            --input versions/*.zip \
            --output merged.zip \
            --report report.json
      
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: synthesis-report
          path: report.json
      
      - name: Create Release
        if: success()
        uses: actions/create-release@v1
        with:
          tag_name: merged-${{ github.run_number }}
          files: merged.zip
```

---

## Example 5: API Server Integration

### Scenario
Expose the pipeline as a REST API.

### Code

```javascript
// server.js
import express from 'express';
import multer from 'multer';
import { ApplicationPipeline } from './skills/application-pipeline/core/pipeline.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const pipeline = new ApplicationPipeline();

// Upload and analyze
app.post('/api/analyze', upload.array('files'), async (req, res) => {
  try {
    const files = req.files.map(f => 
      new File([f.buffer], f.originalname)
    );
    
    const projects = await pipeline.uploadZips(files);
    const analyses = await pipeline.analyzeAll(projects);
    
    res.json({
      success: true,
      projects: projects.length,
      analyses
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Synthesize
app.post('/api/synthesize', async (req, res) => {
  try {
    const report = await pipeline.synthesize();
    res.json(report);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get status
app.get('/api/status', (req, res) => {
  res.json(pipeline.getStatus());
});

app.listen(3000, () => {
  console.log('Pipeline API running on http://localhost:3000');
});
```

### Usage

```bash
# Upload files
curl -X POST -F "files=@v1.zip" -F "files=@v2.zip" \
  http://localhost:3000/api/analyze

# Synthesize
curl -X POST http://localhost:3000/api/synthesize

# Check status
curl http://localhost:3000/api/status
```

---

## Example 6: CLI Tool

### Scenario
Create a command-line tool for merging projects.

### Code

```javascript
// cli.js
#!/usr/bin/env node

import { program } from 'commander';
import { ApplicationPipeline } from './skills/application-pipeline/core/pipeline.js';
import fs from 'fs';
import path from 'path';

program
  .command('merge <files...>')
  .description('Merge multiple ZIP files')
  .option('-o, --output <file>', 'Output file', 'merged.zip')
  .option('-r, --report <file>', 'Report file', 'report.json')
  .action(async (files, options) => {
    try {
      const pipeline = new ApplicationPipeline();
      
      console.log(`📦 Loading ${files.length} files...`);
      const zipFiles = files.map(f => 
        new File([fs.readFileSync(f)], path.basename(f))
      );
      
      console.log('📤 Uploading...');
      const projects = await pipeline.uploadZips(zipFiles);
      
      console.log('🔍 Analyzing...');
      const analyses = await pipeline.analyzeAll(projects);
      
      console.log('🔄 Synthesizing...');
      const report = await pipeline.synthesize(projects);
      
      fs.writeFileSync(options.report, JSON.stringify(report, null, 2));
      console.log(`✓ Report saved to ${options.report}`);
    } catch (e) {
      console.error('Error:', e.message);
      process.exit(1);
    }
  });

program.parse();
```

### Usage

```bash
node cli.js merge v1.zip v2.zip v3.zip -o merged.zip -r report.json
```

---

## Example 7: Event Monitoring

### Scenario
Monitor pipeline progress with event listeners.

### Code

```javascript
import { ApplicationPipeline } from '../core/pipeline.js';

const pipeline = new ApplicationPipeline();

// Listen to events
pipeline.on('analyzing', ({ projectId, name }) => {
  console.log(`[ANALYZING] ${name}`);
});

pipeline.on('analyzed', ({ projectId, analysis }) => {
  console.log(`[ANALYZED] Tags: ${analysis.tags.join(', ')}`);
});

pipeline.on('synthesizing', ({ count }) => {
  console.log(`[SYNTHESIZING] ${count} versions`);
});

pipeline.on('synthesized', ({ report }) => {
  console.log(`[SYNTHESIZED] Complete`);
});

pipeline.on('error', ({ error }) => {
  console.error(`[ERROR] ${error}`);
});

// Run pipeline
const projects = await pipeline.uploadZips(files);
await pipeline.analyzeAll(projects);
const report = await pipeline.synthesize(projects);
```

---

## Example 8: Batch Processing

### Scenario
Process multiple groups of projects.

### Code

```javascript
import { ApplicationPipeline } from '../core/pipeline.js';

async function batchProcess(groups) {
  const results = [];
  
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    console.log(`Processing group ${i+1}/${groups.length}...`);
    
    const pipeline = new ApplicationPipeline();
    const projects = await pipeline.uploadZips(group.files);
    const report = await pipeline.synthesize(projects);
    
    results.push({
      group: group.name,
      report,
      timestamp: new Date().toISOString()
    });
  }
  
  return results;
}

// Usage
const groups = [
  { name: 'frontend', files: [v1_ui, v2_ui, v3_ui] },
  { name: 'backend', files: [v1_api, v2_api, v3_api] },
  { name: 'database', files: [v1_db, v2_db, v3_db] }
];

const results = await batchProcess(groups);
```

---

## Example 9: Custom Validation

### Scenario
Validate merged project before deployment.

### Code

```javascript
import { ApplicationPipeline } from '../core/pipeline.js';

async function validateMerge(projects) {
  const pipeline = new ApplicationPipeline();
  
  // Synthesize
  const report = await pipeline.synthesize(projects);
  
  // Validate
  const validation = await pipeline.validate(report);
  
  if (!validation.isValid) {
    console.error('Validation failed:');
    validation.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
  
  console.log('✓ Validation passed');
  validation.warnings.forEach(w => console.warn(`  ⚠️  ${w}`));
  
  return report;
}
```

---

## Example 10: Performance Optimization

### Scenario
Optimize pipeline for large projects.

### Code

```javascript
import { ApplicationPipeline } from '../core/pipeline.js';

async function optimizedMerge(files) {
  const pipeline = new ApplicationPipeline();
  
  // Upload
  const projects = await pipeline.uploadZips(files);
  
  // Analyze in parallel with concurrency limit
  const batchSize = 3;
  const analyses = [];
  
  for (let i = 0; i < projects.length; i += batchSize) {
    const batch = projects.slice(i, i + batchSize);
    const batchAnalyses = await Promise.all(
      batch.map(p => pipeline.analyzeOne(p))
    );
    analyses.push(...batchAnalyses);
  }
  
  // Synthesize
  const report = await pipeline.synthesize(projects);
  
  return report;
}
```

---

## More Examples

See the `examples/` directory for additional examples:
- `example-react-app/` - Full React application
- `example-cli/` - Command-line tool
- `example-api-server/` - REST API server
- `example-github-action/` - GitHub Actions workflow
- `example-batch-processing/` - Batch processing script
