# @mycodexvantaos/app-dev-studio

MyCodeXvantaOS App Dev Studio - AI Code Editor Research Platform

## Description

A Next.js-based AI code editor research platform with Genkit integration for AI-powered features including:

- AI Code Completion
- AI Agent Code Generation & Refactoring
- Conversational AI Assistant
- Vulnerability Scanner
- Research Data Summarization

## Features

- **Dashboard**: Main dashboard with file explorer, editor view, and AI panels
- **AI Flows**: Genkit-powered AI flows for various development tasks
- **API Routes**: REST API endpoints for data and user profile management
- **UI Components**: Comprehensive set of Radix UI-based components

## Tech Stack

- Next.js 15.5.9
- React 19
- TypeScript 5
- Tailwind CSS
- Genkit 1.28.0
- Radix UI Components
- Firebase

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run Genkit development
npm run genkit:dev

# Build for production
npm run build

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── ai/                    # Genkit AI flows and configuration
│   ├── dev.ts
│   ├── genkit.ts
│   └── flows/
├── app/                   # Next.js App Router
│   ├── api/
│   ├── dashboard/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   ├── icons/
│   └── ui/               # Reusable UI components
├── hooks/
└── lib/
```

## Related

Part of the MyCodeXvantaOS ecosystem.
