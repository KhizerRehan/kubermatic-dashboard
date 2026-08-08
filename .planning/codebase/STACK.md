# Technology Stack — Angular Frontend

**Analysis Date:** 2026-04-09

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code (`src/app/**/*.ts`)
- HTML - Templates in `src/app/**/*.html`
- SCSS - Styles in `src/assets/css/`, component styles, theme definitions (`src/assets/themes/`)

**Secondary:**
- JavaScript - Build scripts, configuration files (CommonJS)

## Runtime

**Environment:**
- Node.js ≥20.0.0
- Browser: Last 2 versions of Chrome, Safari, Edge, Firefox, Android, iOS (per `.browserslistrc`)

**Package Manager:**
- npm ≥10.0.0
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Angular 20.3.15 (`@angular/core`, `@angular/common`, `@angular/platform-browser`) - Main SPA framework
- Angular Router 20.3.15 - Navigation and routing
- Angular Forms 20.3.15 - Reactive and template-driven forms
- Angular Animations 20.3.15 - View transitions
- Angular Material 20.2.12 - UI component library with Material Design
- Angular CDK 20.2.12 - Component development kit for Material
- Angular Flex Layout 15.0.0-beta.42 - Responsive layout

**Testing:**
- Jest 29.7.0 - Unit test runner
- jest-preset-angular 15.0.1 - Jest preset for Angular
- Cypress 14.3.3 - E2E test framework
- ts-jest 29.1.2 - TypeScript support in Jest

**Build/Dev:**
- @angular/cli 21.1.3 - Angular CLI tools
- @angular/build 20.3.18 - Angular build system
- ng2-mock-component 0.2.0 - Mock components for testing

## Key Dependencies

**Critical:**
- RxJS 7.8.2 - Reactive programming, observables
- Angular Common HTTP - HTTP client for REST API communication (built-in)

**UI Components & Visualization:**
- ngx-charts (@swimlane/ngx-charts) 23.0.1 - Data visualization and charting
- Monaco Editor (ngx-monaco-editor-v2) 20.3.0 - Code editor for YAML/JSON configuration
- XTerm (@xterm/xterm) 5.5.0, @xterm/addon-fit 0.10.0 - Web terminal emulator
- Angular Material - Components, dialogs, menus, tables, forms

**Infrastructure & Utilities:**
- lodash 4.18.1 - Utility functions
- moment 2.30.1 - Date/time handling
- semver 7.7.4 - Semantic version parsing
- country-code-lookup 0.1.3 - Country code utilities
- cron-validator 1.3.1 - Cron expression validation
- js-yaml 4.1.1 - YAML parsing
- js-base64 3.7.7 - Base64 encoding/decoding
- git-describe 4.1.1 - Git version information
- flag-icons 7.3.2 - Country flag icons

**HTTP & Storage:**
- @aws-sdk/client-s3 3.808.0 - AWS S3 client for backup upload/import
- ngx-clipboard 16.0.0 - Clipboard copy functionality
- ngx-cookie-service 20.1.0 - Cookie management
- buffer 6.0.3 - Node.js Buffer API for browser

**Fonts & Assets:**
- @fontsource/roboto 5.1.1 - Roboto font family
- @fontsource/roboto-mono 5.2.5 - Roboto Mono for code
- @fontsource/inconsolata 5.2.5 - Inconsolata monospace font
- @fontsource/ubuntu 5.1.1 - Ubuntu font
- swagger-ui-dist 5.32.0 - Swagger/OpenAPI UI assets

**Dev Tools:**
- gts (Google TypeScript Style) 5.3.0 - Linting and formatting
- eslint 8.57.0 - JavaScript/TypeScript linting
- @typescript-eslint/eslint-plugin 8.49.0, @typescript-eslint/parser 8.49.0 - TypeScript ESLint support
- stylelint 16.19.1 - SCSS linting
- prettier 3.7.4 - Code formatting
- html-beautify 1.15.4 - HTML formatting
- license-check-and-add 4.0.5 - License header management

**Testing Utilities:**
- @jest/globals 29.7.0 - Jest globals (describe, test, etc.)
- @types/jest 29.5.14 - Jest type definitions
- jest-canvas-mock 2.5.2 - Canvas API mocking for chart tests
- jest-environment-jsdom 30.1.2 - jsdom environment for DOM testing

**CI/Development:**
- concurrently 9.1.2 - Run multiple processes in parallel
- start-server-and-test 2.0.5 - Start server, wait for health check, run tests
- json-server 0.17.4 - Mock REST API server for E2E tests
- husky 9.1.7 - Git hooks
- lint-staged 15.4.3 - Run linters on staged files
- cypress-fail-fast 7.1.0 - Cypress plugin to fail fast on first error

**Polyfills & Core:**
- core-js 3.41.0 - JavaScript polyfills
- zone.js 0.16.0 - Execution context for change detection
- modern-normalize 3.0.1 - CSS normalization
- tslib 2.8.1 - TypeScript runtime helpers

**Framework Support:**
- react 19.1.0 - For component integration in shell (minimal use)
- @types/react 19.1.8 - React type definitions
- react-dom 18.3.1 - React DOM bindings

## Configuration Files

**TypeScript:**
- `tsconfig.json` - Base TypeScript configuration extending Google's style guide
  - Path aliases: `@app/*`, `@core/*`, `@shared/*`, `@dynamic/*`, `@assets/*`, `@environments/*`, `@test/*`
  - Target: ES2022, Module: ES2020
  - Strict mode disabled, but `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters` enforced
  - `src/tsconfig.ee.json` - EE build (excludes `community/`)
  - `src/tsconfig.ce.json` - CE build (excludes `enterprise/`)
  - `tsconfig.spec.json` - Test configuration

**Angular Build:**
- `angular.json` - Angular CLI build configuration
  - Default builder: @angular/build:application
  - Configurations for EE/CE editions and dev/prod/e2e variants
  - File replacements for `module-registry.ts` (EE vs CE swap)
  - Component style budget: 6kb warning
  - Monaco editor assets bundled to `/assets/monaco/`
  - Themes extracted as separate bundles: `light`, `dark`, `custom`

**Linting & Formatting:**
- `.eslintrc` - ESLint configuration (via gts)
- `.prettierrc` - Prettier configuration
- `.browserslistrc` - Browser compatibility targets
- `.npmrc` - NPM configuration (local)

**Jest:**
- `jest.config.cjs` - Jest configuration
  - Preset: jest-preset-angular
  - Test roots: `src/`
  - Module name mappings for path aliases
  - D3 module resolution for ngx-charts dependencies

**Proxy:**
- `proxy.conf.cjs` - Dev server proxy configuration → dev.kubermatic.io (production target)
- `proxy-local.conf.cjs` - Local proxy configuration → http://127.0.0.1:8080 (local API server)

## CE/EE Edition System

**Build Time Module Swapping:**
- Angular `fileReplacements` in `angular.json` swaps module registries
- EE default: `src/app/dynamic/module-registry.ts`
- CE fallback: `src/app/dynamic/module-registry.ce.ts`
- TypeScript configs exclude unneeded code at compile time

**Environment Variable:**
- `KUBERMATIC_EDITION` controls build variant (default: `ee`)
- Example: `KUBERMATIC_EDITION=ce npm start`

## Styles & Theming

**SCSS Architecture:**
- Root stylesheet: `src/assets/css/root.scss`
- Theme files: `src/assets/themes/light.scss`, `dark.scss`, `custom.scss`
- Themes extracted as separate bundles (not injected by default)
- Component styles: Co-located `*.scss` files with components
- SCSS style preprocessor includes `src/assets/css` and `node_modules/`

**CSS Framework:**
- Angular Material theming system
- Flex layout utilities via @angular/flex-layout
- Custom CSS variables and SCSS mixins

## Assets & Static Files

**Bundled Assets:**
- `src/assets/` - Images, fonts, configuration files, themes
- `node_modules/monaco-editor/` → `/assets/monaco/` - Code editor assets
- `node_modules/@xterm/xterm/css/xterm.css` - Terminal CSS

**Runtime Configuration:**
- `config/config.json` - Dynamic application configuration (loaded at startup)
- `config/userGroupConfig.json` - User group mapping configuration
- `config/version.json` - Git version information

## Polyfills

**Target Files:**
- `src/polyfills.ts` - Browser polyfills and compatibility shims
- Includes core-js, zone.js, and browser APIs

## Development

**Scripts:**
```bash
npm start                  # Dev server (port 8000, EE default)
npm run start:local        # Dev with local API proxy (127.0.0.1:8080)
KUBERMATIC_EDITION=ce npm start  # CE edition dev server
npm run build              # Production build
npm run build:themes       # Build + extract CSS themes
npm run test:ci            # Jest tests with coverage
npm run e2e:mock           # E2E with mocked API
npm run check              # TS, SCSS, license checks
npm run fix                # Auto-fix TS, SCSS, HTML, licenses
npm run start:mock-server  # json-server on port 8080 for E2E
```

**Port Configuration:**
- Development: localhost:8000 (configurable via `KUBERMATIC_HOST` env var)
- Local API proxy: 127.0.0.1:8080
- Mock E2E server: 127.0.0.1:8080

---

*Stack analysis: 2026-04-09*
