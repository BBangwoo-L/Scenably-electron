# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack (opens at http://localhost:3000)
- `npm run build` - Build production application with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality checks

## Project Architecture

This is a Next.js 15 application using the App Router architecture with the following key technologies:

### Core Stack
- **Next.js 15** with App Router (`src/app/` directory structure)
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling with `tw-animate-css` for animations
- **Turbopack** for fast development and builds

### UI Components
- **shadcn/ui** component library (configured with "new-york" style)
- **Radix UI** primitives for accessible components
- **Lucide React** for icons
- Centralized component exports in `src/components/ui/index.ts`

### State Management & Forms
- **Zustand** for global state management
- **React Hook Form** with **Zod** validation and **@hookform/resolvers**
- **next-themes** for theme management

### Key Files
- `src/app/layout.tsx` - Root layout with Geist fonts
- `src/app/page.tsx` - Homepage with Next.js starter content
- `src/lib/utils.ts` - Utility functions including `cn()` for className merging
- `components.json` - shadcn/ui configuration with path aliases

### Path Aliases (configured in components.json)
- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`
- `@/ui` → `src/components/ui`

### Code Style
- ESLint with Next.js core-web-vitals and TypeScript rules
- Uses `clsx` and `tailwind-merge` for conditional className handling
- Component architecture follows shadcn/ui patterns with Radix UI primitives