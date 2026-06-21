/**
 * Application Pipeline - Core Implementation
 * Handles ZIP analysis, conflict detection, and intelligent merging
 */

import JSZip from 'jszip';
import { Anthropic } from '@anthropic-ai/sdk';

export class ApplicationPipeline {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = config.model || 'claude-sonnet-4-20250514';
    this.maxTokens = config.maxTokens || 1000;
    this.timeout = config.timeout || 30000;

    this.client = new Anthropic({ apiKey: this.apiKey });
    this.projects = [];
    this.analyses = [];
    this.conflicts = [];
    this.listeners = {};
  }

  /**
   * Event listener registration
   */
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  /**
   * Upload and parse ZIP files
   */
  async uploadZips(files) {
    const projects = [];

    for (const file of files) {
      if (!file.name.endsWith('.zip')) continue;

      try {
        const zip = await JSZip.loadAsync(file);
        const fileList = [];

        zip.forEach((relativePath, entry) => {
          if (!entry.dir) {
            fileList.push({ name: relativePath });
          }
        });

        const type = this.detectType(fileList);
        projects.push({
          id: Date.now() + Math.random(),
          name: file.name,
          files: fileList,
          type,
          status: 'pending',
          analysis: null,
          raw: zip,
          error: null,
        });
      } catch (e) {
        projects.push({
          id: Date.now() + Math.random(),
          name: file.name,
          files: [],
          type: 'error',
          status: 'error',
          analysis: null,
          raw: null,
          error: e.message,
        });
      }
    }

    this.projects = [...this.projects, ...projects];
    return projects;
  }

  /**
   * Detect project type from files
   */
  detectType(files) {
    const names = files.map((f) => f.name.toLowerCase());
    const exts = names.map((n) => n.split('.').pop());

    const tsCount = exts.filter((e) => ['ts', 'tsx'].includes(e)).length;
    const pyCount = exts.filter((e) => e === 'py').length;
    const goCount = exts.filter((e) => e === 'go').length;
    const rsCount = exts.filter((e) => e === 'rs').length;

    if (names.includes('cargo.toml') || rsCount > 1) return 'Rust';
    if (names.includes('go.mod') || goCount > 1) return 'Go';
    if (names.includes('requirements.txt') || names.includes('pyproject.toml') || pyCount > 2)
      return 'Python';
    if (tsCount > 2) return names.includes('tsconfig.json') ? 'TypeScript/Node' : 'TypeScript';
    if (names.includes('package.json')) return 'JavaScript/Node';

    return 'Mixed';
  }

  /**
   * Analyze a single project
   */
  async analyzeOne(project) {
    if (project.status === 'analyzing' || project.status === 'done') {
      return project.analysis;
    }

    project.status = 'analyzing';
    this.emit('analyzing', { projectId: project.id, name: project.name });

    try {
      const fileList = project.files
        .slice(0, 80)
        .map((f) => f.name)
        .join('\n');
      let sampleCode = '';

      if (project.raw) {
        const codeExts = ['.ts', '.tsx', '.py', '.go', '.rs', '.js', '.vue'];
        for (const [path, entry] of Object.entries(project.raw.files)) {
          if (
            !entry.dir &&
            codeExts.some((e) => path.endsWith(e)) &&
            !path.includes('node_modules') &&
            !path.includes('.min.')
          ) {
            try {
              const text = await entry.async('string');
              if (text.length > 50) {
                sampleCode = `\n\n=== Code Sample (${path}) ===\n${text.slice(0, 600)}`;
                break;
              }
            } catch (e) {}
          }
        }
      }

      const prompt = `You are a code architecture analyst. Analyze this ZIP file content.

ZIP: ${project.name}
Files: ${project.files.length}
Type: ${project.type}

File List:
${fileList}${sampleCode}

Output ONLY valid JSON (no markdown):
{
  "tags": ["tech", "tags"],
  "overview": "2-3 line project overview",
  "architecture": "Architecture assessment: layers, patterns, maintainability",
  "value": "Core logic worth extracting from this version"
}`;

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = message.content[0].text;
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

      project.status = 'done';
      project.analysis = parsed;

      this.emit('analyzed', { projectId: project.id, analysis: parsed });
      return parsed;
    } catch (e) {
      project.status = 'error';
      project.error = e.message;
      this.emit('error', { projectId: project.id, error: e.message });
      throw e;
    }
  }

  /**
   * Analyze all projects
   */
  async analyzeAll(projects = this.projects) {
    const analyses = [];

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      if (project.status === 'pending') {
        const analysis = await this.analyzeOne(project);
        analyses.push(analysis);
      } else if (project.analysis) {
        analyses.push(project.analysis);
      }
    }

    this.analyses = analyses;
    return analyses;
  }

  /**
   * Detect conflicts between versions
   */
  async detectConflicts(projects = this.projects) {
    const conflicts = [];
    const fileMap = new Map();

    // Map files across versions
    projects.forEach((project, idx) => {
      project.files.forEach((file) => {
        const key = file.name;
        if (!fileMap.has(key)) {
          fileMap.set(key, []);
        }
        fileMap.get(key).push({ version: idx, project: project.name, file });
      });
    });

    // Identify conflicts
    fileMap.forEach((versions, fileName) => {
      if (versions.length > 1) {
        conflicts.push({
          file: fileName,
          versions: versions.length,
          severity: this.calculateSeverity(fileName),
          versionDetails: versions,
          suggestion: this.suggestResolution(fileName, versions),
        });
      }
    });

    this.conflicts = conflicts;
    return conflicts.sort((a, b) => b.severity - a.severity);
  }

  /**
   * Calculate conflict severity
   */
  calculateSeverity(fileName) {
    const critical = ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml', 'tsconfig.json'];
    const high = ['.github/workflows', 'Dockerfile', 'docker-compose.yml', 'README.md'];
    const medium = ['src/', 'lib/', 'packages/'];

    if (critical.some((f) => fileName.includes(f))) return 3;
    if (high.some((f) => fileName.includes(f))) return 2;
    if (medium.some((f) => fileName.includes(f))) return 1;
    return 0;
  }

  /**
   * Suggest resolution strategy
   */
  suggestResolution(fileName, versions) {
    if (fileName.endsWith('.json')) return 'merge-json';
    if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) return 'merge-yaml';
    if (fileName.endsWith('.md')) return 'merge-text';
    if (['.ts', '.tsx', '.js', '.py', '.go', '.rs'].some((e) => fileName.endsWith(e)))
      return 'keep-latest';
    return 'manual-review';
  }

  /**
   * Merge JSON files intelligently
   */
  mergeJson(versions) {
    const merged = { ...versions[0] };

    versions.slice(1).forEach((v) => {
      Object.entries(v).forEach(([key, value]) => {
        if (key === 'dependencies' || key === 'devDependencies' || key === 'scripts') {
          merged[key] = { ...merged[key], ...value };
        } else if (Array.isArray(value) && Array.isArray(merged[key])) {
          merged[key] = [...new Set([...merged[key], ...value])];
        } else {
          merged[key] = value;
        }
      });
    });

    return merged;
  }

  /**
   * Merge YAML files intelligently
   */
  mergeYaml(versions) {
    // Deep merge YAML objects
    const deepMerge = (base, update) => {
      for (const key in update) {
        if (base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
          deepMerge(base[key], update[key]);
        } else if (Array.isArray(base[key]) && Array.isArray(update[key])) {
          base[key] = [...new Set([...base[key], ...update[key]])];
        } else {
          base[key] = update[key];
        }
      }
      return base;
    };

    let merged = JSON.parse(JSON.stringify(versions[0]));
    versions.slice(1).forEach((v) => {
      merged = deepMerge(merged, v);
    });

    return merged;
  }

  /**
   * Synthesize merged version
   */
  async synthesize(projects = this.projects, customStrategy = null) {
    const doneProjects = projects.filter((p) => p.status === 'done');

    if (doneProjects.length < 2) {
      throw new Error('Need at least 2 analyzed projects to synthesize');
    }

    this.emit('synthesizing', { count: doneProjects.length });

    const summaries = doneProjects
      .map(
        (p, i) =>
          `[${i + 1}] ${p.name} (${p.type})\nOverview: ${p.analysis?.overview || ''}\nArchitecture: ${p.analysis?.architecture || ''}\nValue: ${p.analysis?.value || ''}\nTags: ${(p.analysis?.tags || []).join(', ')}`
      )
      .join('\n\n');

    const allPaths = doneProjects.flatMap((p) => p.files.map((f) => f.name.split('/').pop()));
    const counts = {};
    allPaths.forEach((p) => {
      counts[p] = (counts[p] || 0) + 1;
    });
    const conflicts = Object.entries(counts)
      .filter(([, v]) => v >= 2)
      .slice(0, 8)
      .map(([k, v]) => `${k} (${v} versions)`)
      .join(', ');

    const prompt = `You are a senior software architect integrating multiple versions into one optimized version.

${doneProjects.length} versions summary:
${summaries}

Main conflicts: ${conflicts || 'No major conflicts'}

Generate synthesis report (Traditional Chinese):

【Synthesis Strategy Overview】
(Integration direction, 2-4 lines)

【Core Conflicts & Solutions】
(List 3-5 conflicts and solutions)

【Final Architecture Recommendation】
(Unified target architecture with directory structure)

【Version Contribution Extraction Table】
(What each version contributes)

【Immediate Action Plan (3 steps)】
(Specific and executable)`;

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });

      const report = message.content[0].text;

      this.emit('synthesized', { report });

      return {
        strategy: 'intelligent-merge',
        versions: doneProjects.length,
        report,
        conflicts: this.conflicts,
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      this.emit('error', { error: e.message });
      throw e;
    }
  }

  /**
   * Validate merged project
   */
  async validate(merged) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      fixes: [],
    };

    // Check for conflict markers
    if (merged.content && merged.content.includes('<<<<<<<')) {
      result.errors.push('Conflict markers found');
      result.isValid = false;
    }

    // Validate JSON files
    if (merged.files) {
      merged.files.forEach((file) => {
        if (file.name.endsWith('.json')) {
          try {
            JSON.parse(file.content);
          } catch (e) {
            result.errors.push(`Invalid JSON in ${file.name}: ${e.message}`);
            result.isValid = false;
          }
        }
      });
    }

    return result;
  }

  /**
   * Remove conflict markers
   */
  removeConflictMarkers(content) {
    return content.replace(/^<{7}.*?^={7}.*?^>{7}.*?$/gms, '');
  }

  /**
   * Generate comprehensive report
   */
  async generateReport(synthesis) {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        versions: synthesis.versions,
        conflicts: this.conflicts.length,
        strategy: synthesis.strategy,
      },
      details: synthesis,
      conflicts: this.conflicts,
      recommendations: this.generateRecommendations(),
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    return [
      'Review high-severity conflicts before deployment',
      'Run comprehensive tests on merged version',
      'Update documentation to reflect merged architecture',
      'Consider incremental rollout of merged version',
      'Monitor for regressions in production',
    ];
  }

  /**
   * Export merged project as ZIP
   */
  async exportAsZip(merged) {
    const zip = new JSZip();

    if (merged.files) {
      merged.files.forEach((file) => {
        zip.file(file.name, file.content);
      });
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Get pipeline status
   */
  getStatus() {
    return {
      projects: this.projects.length,
      analyzed: this.analyses.length,
      conflicts: this.conflicts.length,
      projectStatuses: this.projects.map((p) => ({
        name: p.name,
        status: p.status,
        error: p.error,
      })),
    };
  }
}

export default ApplicationPipeline;
