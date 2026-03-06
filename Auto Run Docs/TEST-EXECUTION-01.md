# Unit Test Execution Playbook

Automated tasks for installing dependencies and running the Kubermatic Dashboard unit test suite.

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Current directory: `modules/web/`

## Phase 01: Dependency Installation & Test Execution

- [ ] Navigate to modules/web directory and verify Node.js installation by checking `node --version` and `npm --version`

- [ ] Install dependencies using `npm ci` command to ensure reproducible builds with exact versions from package-lock.json

- [ ] Run Jest unit tests using `npm test` command to execute all test files in the project

- [ ] Verify test results and identify any failing tests that require fixes

- [ ] If tests fail, examine test output to identify root causes (missing imports, assertion failures, timeout issues, mock configuration problems)

- [ ] Review Jest coverage report if available in test output to assess test coverage across modules

- [ ] Document test results including total tests run, passes, failures, and coverage metrics

- [ ] Run `npm run test:watch` to verify test suite can run in watch mode for development

- [ ] Run `npm run test:ci` to verify test suite can run with coverage in CI mode

## Notes

- Jest configuration: `jest.config.cjs` (uses jest-preset-angular preset)
- Test setup: `src/test.base.ts` and `src/test.base.mocks.ts`
- Mock services available: 30+ mock service implementations in `src/test/services/`
- Test utilities: 5,741 lines of helper code in `src/test/utils/`
- Total test files: 207 spec files across application modules

## Success Criteria

- [ ] All npm dependencies installed successfully
- [ ] Jest unit tests execute without configuration errors
- [ ] Test results output shows all tests run (passing or failing)
- [ ] No import or module resolution errors
- [ ] Test coverage report generated (if applicable)
