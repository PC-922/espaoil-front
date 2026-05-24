# AGENTS.md - EspaOil Frontend

## Project Overview

React 19 + TypeScript + Vite PWA for searching nearby gas stations in Spain. Uses Tailwind CSS for styling and Vitest for testing.

---

## Build / Lint / Test Commands

### Development
```bash
pnpm run dev          # Start dev server at http://localhost:3000
```

### Production
```bash
pnpm run build        # Create production build to dist/
pnpm run preview      # Preview local production build
```

### Testing
```bash
pnpm run test                     # Run all tests once
pnpm run test:watch               # Run tests in watch mode
pnpm run test:coverage            # Run with coverage (v8 provider)
```

**Run a single test file:**
```bash
pnpm exec vitest run path/to/file.test.ts
# or
pnpm exec vitest run hooks/useHomeSearch.test.tsx
```

**Run tests matching a pattern:**
```bash
pnpm exec vitest run -t "restaura el estado"     # Run tests with this description
```

**Run tests in a specific file with watch mode:**
```bash
pnpm exec vitest path/to/file.test.ts
```

### CI Pipeline
The release workflow (`.github/workflows/release.yml`) runs:
1. `pnpm install --frozen-lockfile` - Install dependencies
2. `pnpm run test` - Run tests
3. `pnpm run build` - Build production bundle

---

## Code Style Guidelines

### TypeScript
- **Strict mode**: Enabled via `tsconfig.json`
- **Target**: ES2022
- **Module resolution**: `bundler`
- **JSX**: `react-jsx`
- Use explicit types for function parameters and return values
- Avoid `any` - use `unknown` when type is truly unknown

### Imports
- **Absolute paths** via `@/` alias (mapped to project root)
- **Group order** (enforced by convention):
  1. React/core libraries (`react`, `lucide-react`)
  2. Project imports (`@/components`, `@/hooks`, `@/types`, etc.)
  3. Relative imports (`../utils`, `./config`)
- Named exports preferred over default exports for components and hooks
- Default exports acceptable for page-level components (`App.tsx`)

### Naming Conventions
| Item | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `GasStationCard` |
| Hooks | camelCase with `use` prefix | `useHomeSearch` |
| Utilities | camelCase | `formatDistance` |
| Types/Interfaces | PascalCase | `GasStationModel`, `FetchGasStationsParams` |
| Enums | PascalCase | `FuelType` |
| Constants | SCREAMING_SNAKE_CASE | `CONFIG`, `FUEL_LABELS` |
| Files | Match export name (PascalCase for components) | `GasStationCard.tsx` |

### React Patterns
- Use `React.FC<Props>` with explicit `Props` interface
- Wrap components with `React.memo()` for performance-critical items
- Always add `displayName` for memoized components
- Use functional components exclusively

### Component Structure
```tsx
import React from 'react';
import { Icon } from 'lucide-react';
import { SomeType } from '@/types';
import { utilityFn } from '@/utils/helper';

interface Props {
  propA: string;
  propB?: number;
}

export const ComponentName: React.FC<Props> = React.memo(({ propA, propB = 0 }) => {
  // Hooks first
  // Derived state / memos
  // Handlers
  // Render

  return (
    <div>...</div>
  );
});

ComponentName.displayName = 'ComponentName';
```

### Error Handling
- Use `try/catch` for async operations
- Provide user-friendly error messages in Spanish
- Log errors to console with context: `console.error('Failed to fetch gas stations', error)`
- Use `instanceof Error` for type narrowing in catch blocks
- Return early on error conditions (fail-fast)

### State Management
- Prefer `useState` with explicit initializers
- Use `useMemo` for expensive computations
- Use `useCallback` for handlers passed as props
- Session storage keys prefixed with `espaoil.`

### Testing Patterns
- Test files co-located: `hooks/useHomeSearch.ts` → `hooks/useHomeSearch.test.tsx`
- Use `@testing-library/react` for component/hook testing
- Use `renderHook` from testing-library
- Mock external modules with `vi.mock()`
- Mock geolocation: `Object.defineProperty(window.navigator, 'geolocation', ...)`
- Use `act()` for state updates in async tests
- Use `vi.useFakeTimers()` for debounced/throttled operations
- Test descriptions in Spanish (matching project language)

### Test File Pattern
```tsx
// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
// ... imports

describe('FeatureName', () => {
  beforeEach(() => {
    // Reset mocks, storage, etc.
    vi.clearAllMocks();
  });

  it('descripcion del test en espanol', async () => {
    // Arrange
    // Act
    // Assert
  });
});
```

---

## Directory Structure

```
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks (with tests)
├── repositories/    # Data access layer (API clients)
├── services/        # Business logic, facades, mocks
├── utils/           # Pure utility functions (with tests)
├── views/           # Page-level components (screens)
├── config.ts        # App configuration constants
├── types.ts         # Shared TypeScript types, enums, constants
└── App.tsx          # Root component
```

### Layer Dependencies
```
views → components, hooks
hooks → repositories, services, utils, types
repositories → types, utils
services → repositories, types, utils
```

---

## Tailwind CSS Usage
- Use utility classes directly in JSX
- Common patterns:
  - Spacing: `p-4`, `px-4`, `mb-6`, `gap-3`
  - Colors: `bg-white`, `text-gray-900`, `text-red-600`
  - Responsive: `max-w-md mx-auto`
  - Shadows: `shadow-sm`, `shadow-md`
  - Borders: `border border-gray-100`, `rounded-xl`

---

## API Configuration
- All API calls go through `/api` proxy
- Development proxy: via `VITE_API_PROXY_TARGET` (default `http://localhost:8080`)
- Configure via `config.ts` (not hardcoded)

---

## Vite Configuration
- Dev server port: 3000
- Path alias: `@/` → project root
- Test environment: `jsdom`
- Coverage thresholds: 70% (lines, functions, branches, statements)
