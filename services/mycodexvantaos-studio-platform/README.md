# MyCodeXvantaOS Studio Platform

A Next.js 15 application following MyCodeXvantaOS Provider Architecture with native-first design principles.

## Architecture Overview

This platform follows the **MyCodeXvantaOS Architecture Principles**:

### Native-First Design

- **Zero Hard Dependencies**: Works without any external API keys or services
- **Provider Abstraction**: All external integrations go through the Provider layer
- **Graceful Degradation**: Falls back to native implementation when external providers are unavailable

> "第三方服務是平台的擴充出口，不是平台成立的地基"
>
> _Third-party services are expansion outlets, not the foundation_

### Key Principle Violations Fixed

This service was refactored to comply with MyCodeXvantaOS architecture:

| Before (Violation)         | After (Compliant)                                 |
| -------------------------- | ------------------------------------------------- |
| Direct Genkit dependency   | Provider abstraction via `@mycodexvantaos/ai-llm` |
| Required `GEMINI_API_KEY`  | Native provider always available                  |
| Firebase App Hosting bound | Deployment Provider abstraction                   |
| No fallback                | Native fallback for all capabilities              |

## Technology Stack

- **Framework**: Next.js 15.5.9 with React 19.2.1
- **UI**: shadcn/ui, Tailwind CSS
- **AI Layer**: Provider abstraction via `@mycodexvantaos/ai-llm`
- **Deployment**: Provider abstraction via `@mycodexvantaos/deployment`

### Optional External Providers

Configure these for enhanced capabilities (all optional):

| Provider        | Environment Variables                         | Capability       |
| --------------- | --------------------------------------------- | ---------------- |
| llm-gemini      | `LLM_PROVIDER=gemini`, `GOOGLE_GENAI_API_KEY` | Advanced AI      |
| llm-openai      | `LLM_PROVIDER=openai`, `OPENAI_API_KEY`       | Advanced AI      |
| llm-ollama      | `LLM_PROVIDER=ollama`, `OLLAMA_BASE_URL`      | Local AI         |
| deploy-firebase | `FIREBASE_PROJECT_ID`                         | Cloud deployment |

## Features

### AI Capabilities

All AI features work in **native mode** by default. Configure external providers for enhanced capabilities.

- **Code Generation & Refactoring** - AI agent for coding tasks
- **Context-aware Code Completions** - Intelligent suggestions
- **Research Data Summarization** - Analyze and summarize data
- **Conversational AI Assistant** - Developer chat assistant
- **Package Vulnerability Scanner** - Security analysis

### Dashboard Components

- AI Panel (Chat & Agent tabs)
- API Explorer
- Design Analyzer
- File Explorer
- Research Panel
- Security Panel
- Terminal Panel

## Getting Started

```bash
# Install dependencies
npm install

# Run development server (works without any API keys!)
npm run dev

# Initialize AI system (optional, for checking provider status)
npm run ai:init

# Build for production
npm run build
```

### No Environment Variables Required!

The application works out-of-the-box with native providers. No API keys needed.

### Optional: Configure External Providers

Create a `.env` file to enable enhanced capabilities:

```bash
# Optional: Choose your preferred LLM provider
LLM_PROVIDER=native  # Options: native, gemini, openai, anthropic, ollama

# Optional: Configure external LLM providers
GOOGLE_GENAI_API_KEY=your_key_here      # For llm-gemini
OPENAI_API_KEY=your_key_here            # For llm-openai
OLLAMA_BASE_URL=http://localhost:11434  # For llm-ollama

# Optional: Deployment providers
FIREBASE_PROJECT_ID=your_project_id     # For deploy-firebase
```

## Project Structure

```
src/
├── ai/                    # AI flows following Provider Architecture
│   ├── dev.ts             # Development entry point
│   ├── genkit.ts          # Provider abstraction layer
│   └── flows/             # AI flow implementations
├── app/                   # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   ├── globals.css        # Global styles
│   ├── dashboard/         # Dashboard page
│   └── api/               # API routes
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   ├── icons/             # Icon components
│   └── ui/                # shadcn/ui components
├── hooks/                 # React hooks
└── lib/                   # Utility libraries
```

## Provider Architecture

### LLM Provider Selection Flow

```
1. Check if external provider is configured and available
2. If yes → Use external provider (gemini, openai, etc.)
3. If no → Fall back to native provider
4. Native provider ALWAYS works (zero dependencies)
```

### Deployment Provider Selection Flow

```
1. Check if external deployment provider is configured
2. If yes → Use external provider (firebase, kubernetes, etc.)
3. If no → Fall back to native provider
4. Native provider handles local/docker deployment
```

## Related Packages

This service integrates with MyCodeXvantaOS packages:

| Package                        | Purpose                         |
| ------------------------------ | ------------------------------- |
| `@mycodexvantaos/ai-llm`       | LLM Provider abstraction        |
| `@mycodexvantaos/deployment`   | Deployment Provider abstraction |
| `@mycodexvantaos/ai-agent`     | Agent framework                 |
| `@mycodexvantaos/ai-memory`    | Memory management               |
| `@mycodexvantaos/core-gateway` | API gateway                     |

## Architecture Compliance

✅ **Native-First**: Always has working implementation without external dependencies
✅ **Provider-Agnostic**: All external services go through Provider abstraction
✅ **Zero Hard Dependencies**: External providers are optional connectors
✅ **Graceful Degradation**: Falls back to native when external unavailable

## License

Private - MyCodeXvantaOS
