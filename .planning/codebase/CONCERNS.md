# Codebase Concerns

**Analysis Date:** 2026-04-09

## Tech Debt

**Project Endpoint Mutation Pattern:**
- Issue: Project edit component uses PUT endpoint but labels component returns PATCH-style objects with nullified values. Requires manual cleanup loop to remove null labels before sending.
- Files: `src/app/project/edit-project/component.ts` (lines 99-101, 102-106)
- Impact: Coupling between label form component and project editing logic. If label component changes, cleanup logic breaks.
- Fix approach: Implement PATCH endpoint for project edits or make labels component configurable to return entity-style objects instead of patch objects.

**Azure Provider Form Reset Behavior:**
- Issue: Form reset triggered on provider/datacenter changes overwrites all default values set during initialization. Comment indicates intentional TODO but no resolution.
- Files: `src/app/wizard/step/provider-settings/provider/extended/azure/component.ts` (lines 119-120)
- Impact: User experience degradation when switching providers/datacenters—previously entered values lost.
- Fix approach: Refactor to preserve default values during reset, or conditionally reset only non-default form fields.

**Admin Settings Fetching Architecture:**
- Issue: Admin settings fetched via websocket with defaulting in frontend—architecture acknowledged as incorrect. Uses `take(2)` workaround to avoid subscription leaks.
- Files: `src/app/core/interceptors/error-notifications.ts` (lines 84-88)
- Impact: Frontend doing work that should be backend-only. Websocket overhead for simple configuration retrieval. Memory leak potential if subscription not properly managed.
- Fix approach: Replace websocket with HTTP endpoint. Move defaulting logic to backend. Eliminate ad-hoc take(2) pattern.

## Fragile Areas

**Large Monolithic Components:**
- Files: 
  - `src/app/wizard/step/cluster/component.ts` (1381 lines)
  - `src/app/node-data/component.ts` (805 lines)
  - `src/app/node-data/basic/provider/kubevirt/component.ts` (853 lines)
  - `src/app/cluster/details/cluster/edit-cluster/component.ts` (748 lines)
  - `src/app/cluster/details/cluster/component.ts` (732 lines)
  - `src/app/shared/entity/cluster.ts` (738 lines)
  - `src/app/project/component.ts` (659 lines)
- Why fragile: Components over 600 lines are difficult to test, refactor, and reason about. High probability of hidden dependencies and side effects.
- Safe modification: Break into smaller presentational/container components. Extract business logic into services. Extract form logic into form services.
- Test coverage: Many of these large components have minimal unit tests (only 6 spec files for 89+ core services).

**Provider-Specific Component Explosion:**
- Files: Multiple provider implementations in `src/app/wizard/step/provider-settings/provider/extended/` and `src/app/node-data/basic/provider/`
- Why fragile: Each provider has its own component with form validation logic. Changes to shared form patterns require updates across 15+ provider implementations.
- Safe modification: Extract provider-agnostic form logic into base classes and services. Use composition over component inheritance.

**CE/EE Module Registry Pattern:**
- Files: 
  - `src/app/dynamic/module-registry.ts` (EE version)
  - `src/app/dynamic/module-registry.ce.ts` (CE version, swapped via fileReplacements)
  - 74+ files reference DynamicModule
- Why fragile: File replacement strategy means CE code path not tested in EE builds and vice versa. Easy to accidentally import EE modules in CE-only code or vice versa.
- Safe modification: Add runtime feature gate checks in addition to build-time swaps. Consider moving to standalone components with conditional imports rather than full module swaps. Add CI check to verify both CE and EE module registries are syntactically valid.

## Test Coverage Gaps

**Core Services Undertested:**
- What's not tested: 89 service files in `src/app/core/services/`, only 6 have corresponding spec files. Critical services like auth, token, cluster, project, datacenter have minimal or no unit tests.
- Files: `src/app/core/services/*.ts` (mostly unspecified)
- Risk: Auth token handling, API client mocking, error scenarios untested. Bugs in authentication/authorization logic can only be caught via E2E tests.
- Priority: HIGH

**Skipped Tests in Core Flows:**
- What's not tested: At least 6 test files contain `xit()` or similar skip markers, blocking critical user flows.
- Files:
  - `src/app/cluster/details/cluster/edit-cluster/component.spec.ts` (line 134: `xit('should call editCluster method')`)
  - `src/app/cluster/details/cluster/constraints/constraint-dialog/component.spec.ts`
  - `src/app/cluster/details/cluster/gatekeeper-config/component.spec.ts`
  - `src/app/cluster/details/cluster/gatekeeper-config/gatekeeper-config-dialog/component.spec.ts`
  - `src/app/cluster/details/cluster/mla/alertmanager-config/alertmanager-config-dialog/component.spec.ts`
- Risk: Skipped tests mask real failures. Changes to edit-cluster flow won't be validated.
- Priority: HIGH

**Missing Accessibility Tests:**
- What's not tested: Only 7 references to ARIA attributes found in entire `src/app/shared/components/` directory across hundreds of templates.
- Files: `src/app/shared/components/*.html` (broad gap)
- Risk: WCAG compliance gaps won't be caught. Keyboard navigation and screen reader support untested.
- Priority: MEDIUM

**Form Validation Untested:**
- What's not tested: Complex custom validators scattered across components. Provider-specific validation (Azure subscriptions, OpenStack domains) only tested via E2E mocks.
- Files: `src/app/shared/validators/`, `src/app/core/services/wizard/provider/*.ts`
- Risk: Validation edge cases (empty strings, whitespace, special characters, boundary values) won't be caught until production.
- Priority: MEDIUM

## RxJS Memory Leak Risks

**Uneven takeUntil Adoption:**
- What's the problem: While ~1076 components use takeUntil or async pipe, ~1779 .subscribe() calls exist across the codebase. Some components properly implement ngOnDestroy with takeUntil, others don't.
- Files: Scattered across `src/app/` (no pattern enforcement)
- Cause: Inconsistent patterns mean subscription cleanup depends on developer discipline. No linting rule enforces takeUntil usage.
- Improvement path: Add ESLint rule via `eslint-plugin-rxjs` to catch unmanaged subscriptions. Audit large components (>600 lines) for missing subscription management.

**Window Global Access Unguarded:**
- What's the problem: Direct `window.*` access throughout code without guards, including in server-side contexts where window doesn't exist.
- Files:
  - `src/app/core/components/sidenav/component.ts` (window.innerWidth, window.history.state)
  - `src/app/core/services/auth/service.ts` (window.location)
  - `src/app/core/services/cluster.ts` (window.location.protocol)
  - `src/app/core/services/token.ts` (window.atob)
- Cause: Direct window access breaks if code ever runs in Node.js context (pre-rendering, SSR, testing).
- Improvement path: Inject platform service, wrap in platform.isBrowser checks, or use PlatformLocation for location details.

## Dependencies at Risk

**Deprecated Angular Flex Layout:**
- Risk: `@angular/flex-layout` v15.0.0-beta.42 is old beta and unmaintained. Angular 20 is current.
- Impact: CSS Grid and Flexbox standards evolved; maintenance burden will grow as browsers remove legacy features.
- Migration path: Replace with CSS Grid/Flexbox native styles. Use CSS utility classes instead of layout directives.

**Legacy Compatibility Libraries:**
- Risk: `rxjs-compat` (6.6.7) included for backward compatibility with old RxJS patterns. Code uses modern RxJS (7.8.2).
- Impact: Dead code path. Adds bundle size for unused compatibility layer.
- Migration path: Remove dependency and verify all imports are from rxjs, not rxjs-compat.

**Outdated Date/Utility Libraries:**
- Risk: `moment` (2.30.1), `lodash` (4.18.1), `jquery` (3.7.1) included but modern Angular replaces most use cases. 155 references to these libraries found.
- Impact: Bundle bloat. moment is notoriously large; Angular provides date pipes. lodash provides utilities already in native JS (Object methods, array methods). jquery is rarely needed in modern Angular.
- Migration path: Audit usage of moment (replace with native Date/Intl APIs), lodash (replace with native JS), jquery (shouldn't be needed—investigate why it's imported).

**React Included in Angular App:**
- Risk: `react` (19.1.0) and `react-dom` (18.3.1) are dependencies in an Angular-only SPA. React adds 40KB+ gzipped.
- Impact: Significant bundle size waste if React isn't used. If used, indicates framework mixing which breaks build isolation.
- Migration path: Verify React is actually used. If not, remove. If used (e.g., for specific components), document clearly and consider extraction to separate module.

## Security Considerations

**Token Handling via Cookies and Memory:**
- Risk: Tokens stored in both memory (`this._token`) and cookies. Token service decodes JWT client-side without validation.
- Files: `src/app/core/services/token.ts` (lines 23-56)
- Current mitigation: Cookies and HTTP-only flag may mitigate XSS (but not specified in code). Token decoded via `window.atob` (vulnerable to tampering if XSS occurs).
- Recommendations: 
  1. Verify cookies are HTTP-only and secure flags set (check backend).
  2. Consider storing tokens only in HTTP-only cookies, never in memory/localStorage.
  3. Add Content Security Policy headers to prevent inline scripts.
  4. Never decode tokens client-side for trust—decode server-side and send user info separately.

**No CSP Headers Visible:**
- Risk: No Content Security Policy directives found in Angular config or templates. Inline event handlers and dynamic HTML creation possible.
- Files: `angular.json` (build config not provided), template files (forwardRef pattern used extensively)
- Current mitigation: Unknown
- Recommendations: Add strict CSP headers in production (frame-ancestors, script-src, style-src, img-src).

**Window Location Direct Access:**
- Risk: `window.location.href` used for OIDC redirects without validation. Query params parsed via regex without sanitization.
- Files: `src/app/core/services/auth/service.ts` (lines for window.location and regex parsing)
- Current mitigation: Unknown
- Recommendations: Use Angular Router for redirects where possible. Validate redirect URLs against whitelist. Use proper URL parsing (URL API) instead of regex.

## Deprecated Features

**Cluster Autoscaler Addon (Deprecated):**
- Issue: Cluster Autoscaler addon deprecated in favor of Application. UI still offers addon option.
- Files: `src/app/node-data/template.html` (line 271)
- Impact: Users may enable deprecated addon instead of modern Application.
- Fix approach: Remove addon option or add clear deprecation warning with migration docs.

**Anexia Provider (Deprecated in KKP 2.30):**
- Issue: Anexia provider deprecated but still fully supported in UI. Users can create clusters on it.
- Files:
  - `src/app/shared/constants/common.ts` (ANEXIA_DEPRECATED_MESSAGE)
  - Multiple templates across cluster/wizard/settings showing deprecated warning
  - `src/app/cluster-template/component.ts`
  - `src/app/wizard/step/provider-datacenter/component.ts`
- Impact: Supports deprecated provider, encouraging users to migrate.
- Fix approach: Disable Anexia selection in future release. Provide migration path docs.

**OPA (Open Policy Agent) (Deprecated in KKP 2.28):**
- Issue: OPA deprecated in favor of Kyverno but still fully supported in UI.
- Files:
  - `src/app/shared/constants/common.ts` (OPA_DEPRECATED_MESSAGE)
  - `src/app/cluster/details/cluster/component.ts`
  - `src/app/wizard/step/cluster/component.ts`
  - `src/app/settings/admin/opa/component.ts`
- Impact: Users still enable OPA instead of Kyverno.
- Fix approach: Disable OPA for new clusters. Provide Kyverno migration docs for existing clusters.

**Kubernetes Dashboard (Deprecated):**
- Issue: Kubernetes Dashboard support deprecated. Still offered as option.
- Files: `src/app/shared/constants/common.ts` (KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE)
- Impact: Users enable unsupported feature.
- Fix approach: Hide option behind feature gate. Remove in next major release.

**Pod Security Policy:**
- Issue: PSP deprecated in Kubernetes 1.25, marked as not recommended in UI.
- Files: `src/app/settings/admin/dynamic-datacenters/datacenter-data-dialog/template.html` (line 169)
- Impact: Encourages use of deprecated Kubernetes feature.
- Fix approach: Remove option when minimum Kubernetes version ≥1.25.

**OpenVPN (Deprecated):**
- Issue: OpenVPN deprecated, Konnectivity no longer optional.
- Files: `src/app/cluster/details/cluster/edit-cluster/template.html` (line 167), `src/app/wizard/step/cluster/template.html` (line 286)
- Impact: UI controls still present even though OpenVPN can't be disabled.
- Fix approach: Remove OpenVPN toggle from UI.

## Performance Bottlenecks

**Lazy Loading Gaps:**
- Problem: Wizard and cluster details components over 700 lines not split into lazy-loaded routes.
- Files: `src/app/wizard/`, `src/app/cluster/details/`
- Cause: All routes likely eager-loaded in main bundle.
- Improvement path: Analyze routing module. Split wizard steps and details sections into lazy-loaded child routes. Measure bundle impact.

**Bundle Size Bloat:**
- Problem: Legacy libraries (moment, lodash, jquery, react) add ~100KB+ gzipped unnecessarily.
- Cause: Imported for legacy reasons or mixed concerns.
- Improvement path: Remove unused libraries. Replace moment with date pipes. Replace lodash with native JS. Audit React usage.

**Change Detection Strategy Sparse:**
- Problem: Only 47 components (out of 738+ files) use `ChangeDetectionStrategy.OnPush`.
- Files: Scattered across codebase
- Cause: Default change detection checks entire tree on any event. Only 6% of components optimized.
- Improvement path: Audit large components (>600 lines) and dialog components. Add OnPush strategy where data flows one-way. Measure performance improvement.

**Form Value Changes Unthrottled:**
- Problem: Provider settings components (Azure, OpenStack, VSphere) subscribe to form changes without debouncing in some paths.
- Files: `src/app/wizard/step/provider-settings/provider/extended/azure/component.ts` (debounceTime present) but inconsistent across providers
- Cause: No standardized pattern for form value subscriptions.
- Improvement path: Add debounceTime consistently across all provider forms. Consider ValueChangeAware directive or shared form service.

## Scaling Limits

**No Pagination/Virtualization for Large Lists:**
- Concern: No evidence of virtual scrolling (cdk-virtual-scroll) for lists that could contain 100s of items (nodes, machines, events).
- Impact: Page slowdown and memory bloat when clusters have many resources.
- Current approach: Unclear if lists are paginated or all loaded at once.
- Scaling path: Implement virtual scrolling for node/machine lists, events, audit logs. Add pagination or infinite scroll for large datasets.

**Provider-Specific Form Overhead:**
- Concern: 15+ provider implementations, each with full form validation and watchers. Initialization cost grows with each new provider.
- Files: `src/app/wizard/step/provider-settings/provider/extended/`, `src/app/node-data/basic/provider/`
- Impact: Wizard initialization time increases with provider count.
- Scaling path: Extract shared form patterns into base service. Lazy-load provider-specific validators only when provider selected.

---

*Concerns audit: 2026-04-09*
