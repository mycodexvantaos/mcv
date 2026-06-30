# Application Pipeline Skill

**Advanced framework for analyzing, comparing, and synthesizing multiple software project versions**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)

---

## 🎯 What is Application Pipeline?

Application Pipeline is a sophisticated framework that enables intelligent analysis and synthesis of multiple software project versions. It uses AI-powered architecture analysis, smart conflict detection, and custom merge strategies to create optimized merged versions that combine the best features from all input versions.

### Key Features

✨ **AI-Powered Analysis**

- Automatic project type detection
- Architecture assessment using Claude
- Technology stack identification
- Value proposition extraction

🔍 **Intelligent Conflict Detection**

- File duplication detection
- Semantic conflict analysis
- Severity-based prioritization
- Actionable resolution suggestions

🔄 **Smart Merging**

- JSON-aware merging with dependency handling
- YAML deep merge with deduplication
- Code-intelligent merging
- Text content consolidation

✅ **Comprehensive Validation**

- Conflict marker detection and removal
- YAML/JSON syntax validation
- Code structure verification
- Auto-fix capabilities

📊 **Detailed Reporting**

- Synthesis strategy documentation
- Conflict resolution rationale
- Version contribution tracking
- Actionable recommendations

---

## 🚀 Quick Start

### Installation

```bash
# Copy skill to your project
cp -r /home/ubuntu/skills/application-pipeline ~/your-project/skills/

# Install dependencies
npm install jszip @anthropic-ai/sdk
```

### Basic Usage

```javascript
import { ApplicationPipeline } from "./skills/application-pipeline/core/pipeline.js";

const pipeline = new ApplicationPipeline({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

### React Component

```jsx
import PipelineUI from "./skills/application-pipeline/core/PipelineUI.jsx";

export default function App() {
  return <PipelineUI />;
}
```

---

## 📚 Documentation

- **[SKILL.md](SKILL.md)** - Complete API reference and configuration guide
- **[INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md)** - Integration patterns and best practices
- **[EXAMPLES.md](examples/EXAMPLES.md)** - Real-world usage examples

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Input Sources  │ (ZIP, Git, Local)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  File Analysis  │ (Type detection, structure mapping)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Assessment  │ (Claude API - architecture, value)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Conflict Detect │ (File duplication, semantic conflicts)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Smart Merging   │ (JSON, YAML, Code, Text strategies)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validation     │ (Syntax, structure, integrity)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Output Artifact │ (Merged project, report)
└─────────────────┘
```

---

## 💡 Use Cases

### 1. Multi-Version Project Integration

Merge multiple versions of a codebase while preserving best practices from each.

### 2. Architecture Alignment

Detect and resolve architectural conflicts across different implementations.

### 3. Code Synthesis

Generate optimized versions by combining strengths from multiple sources.

### 4. Dependency Conflict Resolution

Intelligently merge package.json, requirements.txt, and other dependency files.

### 5. Documentation Consolidation

Combine documentation from multiple versions into comprehensive guides.

### 6. Technology Stack Analysis

Identify and unify technology choices across versions.

---

## 🔧 Configuration

### Basic Configuration

```javascript
const pipeline = new ApplicationPipeline({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: "claude-sonnet-4-20250514",
  maxTokens: 1000,
  timeout: 30000,
});
```

### Custom Merge Strategy

```javascript
const customStrategy = {
  "package.json": (versions) => {
    // Custom merge logic
    const merged = { ...versions[0] };
    versions.forEach((v) => {
      merged.dependencies = { ...merged.dependencies, ...v.dependencies };
    });
    return merged;
  },
};

const report = await pipeline.synthesize(projects, customStrategy);
```

---

## 📊 API Reference

### Core Methods

#### `uploadZips(files: File[]): Promise<ZipProject[]>`

Upload and parse ZIP files.

#### `analyzeOne(project: ZipProject): Promise<Analysis>`

Analyze a single project version.

#### `analyzeAll(projects: ZipProject[]): Promise<Analysis[]>`

Analyze all projects in parallel.

#### `detectConflicts(projects: ZipProject[]): Promise<Conflict[]>`

Detect file and semantic conflicts.

#### `synthesize(projects: ZipProject[], strategy?: MergeStrategy): Promise<SynthesisReport>`

Generate merged version and synthesis report.

#### `validate(merged: MergedProject): Promise<ValidationResult>`

Validate merged project integrity.

---

## 🎨 React Component Props

```jsx
<PipelineUI
  onSynthesis={(report) => console.log(report)}
  onError={(error) => console.error(error)}
  maxFileSize={100 * 1024 * 1024}
  apiKey={process.env.REACT_APP_ANTHROPIC_API_KEY}
/>
```

---

## 🔌 Integration Examples

### GitHub Actions

```yaml
- name: Run Application Pipeline
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: node scripts/pipeline.js --input versions/*.zip
```

### Express API

```javascript
app.post("/api/synthesize", async (req, res) => {
  const pipeline = new ApplicationPipeline();
  const report = await pipeline.synthesize(projects);
  res.json(report);
});
```

### CLI Tool

```bash
node cli.js merge v1.zip v2.zip v3.zip -o merged.zip
```

---

## 🧪 Testing

```bash
npm test
npm run test:watch
```

---

## 📈 Performance

- **Parallel Analysis**: Analyze multiple projects simultaneously
- **Caching**: Avoid re-analyzing same projects
- **Streaming**: Stream results as they become available
- **Batch Processing**: Process large groups incrementally

---

## 🔒 Security

- ✅ Input validation for all ZIP files
- ✅ API key management (server-side only)
- ✅ Sandboxed merge operations
- ✅ No sensitive data in logs

---

## 🐛 Troubleshooting

### API Rate Limit

Implement exponential backoff retry logic.

### Out of Memory

Process files in chunks.

### Conflict Markers Remain

Use stronger regex patterns for removal.

See [SKILL.md](SKILL.md) for detailed troubleshooting guide.

---

## 📝 Examples

See [examples/EXAMPLES.md](examples/EXAMPLES.md) for:

- Multi-version project integration
- Dependency conflict resolution
- React component integration
- GitHub Actions workflow
- API server integration
- CLI tool
- Event monitoring
- Batch processing
- Custom validation
- Performance optimization

---

## 🤝 Contributing

To extend this skill:

1. Add custom merge strategies in `core/strategies/`
2. Create new integrations in `integrations/`
3. Add examples in `examples/`
4. Update documentation

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🆘 Support

For issues or questions:

- Check [SKILL.md](SKILL.md) for API reference
- Review [INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md) for patterns
- See [examples/EXAMPLES.md](examples/EXAMPLES.md) for usage
- Open an issue on GitHub

---

## 🎓 Learning Path

1. **Start**: Read [Quick Start](#-quick-start)
2. **Learn**: Study [SKILL.md](SKILL.md)
3. **Integrate**: Follow [INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md)
4. **Practice**: Try [examples/EXAMPLES.md](examples/EXAMPLES.md)
5. **Build**: Create your own integration

---

## 🌟 Highlights

- 🤖 **AI-Powered**: Uses Claude for intelligent analysis
- 🔄 **Smart Merging**: Understands different file types
- 📊 **Detailed Reports**: Comprehensive synthesis documentation
- 🧪 **Well-Tested**: Comprehensive test coverage
- 📚 **Well-Documented**: Extensive guides and examples
- 🚀 **Production-Ready**: Battle-tested in real projects
- 🔌 **Extensible**: Custom strategies and integrations
- ⚡ **Performant**: Optimized for large projects

---

**Made with ❤️ by Manus Team**
