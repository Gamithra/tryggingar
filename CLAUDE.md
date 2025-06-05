# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands
- `npm run dev` - Run development server with turbopack
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code linting

## Code Style Guidelines
- **Imports**: Use named imports, organize in logical groups (React, components, utilities)
- **Formatting**: Follow Next.js/React conventions, use consistent spacing
- **Components**: Use functional components with hooks
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Error Handling**: Use try/catch blocks with specific error messages
- **CSS**: Use Tailwind CSS utility classes for styling
- **TypeScript**: Project uses JavaScript with JSConfig path aliases (@/* for src/*)
- **Data Handling**: Prefer React hooks (useState, useEffect) for state management
- **Commenting**: Use JSDoc style comments for functions

Always run `npm run lint` before committing changes to ensure code quality.