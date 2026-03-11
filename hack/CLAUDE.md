# KKP Dashboard - CI/CD & Developer Tooling

Build scripts, CI/CD infrastructure, and developer utilities for the KKP Dashboard project.

## Structure

```
hack/
├── lib.sh                        # Shared bash utilities (echodate, retry, appendTrap, containerize)
├── verify-boilerplate.sh         # License header verification (CE/EE)
├── verify-spelling.sh            # Spell checking with codespell
├── boilerplate/
│   ├── ce/                       # Community Edition license headers (9 file types)
│   └── ee/                       # Enterprise Edition license headers (9 file types)
├── ci/
│   ├── verify.sh                 # Main CI verification orchestrator
│   ├── setup-kind-cluster.sh     # KIND cluster with Docker registry mirror
│   ├── setup-kubermatic-in-kind.sh  # KKP deployment in KIND
│   ├── run-api-e2e.sh            # API E2E tests (LDAP, presets, Go tests)
│   ├── download-gocache.sh       # Go build cache pre-warming
│   ├── upload-gocache.sh         # Go cache upload for CI reuse
│   └── testdata/                 # YAML configs (dex, kubermatic, LDAP, metering, seed)
└── images/web-terminal/
    ├── Dockerfile                # Alpine-based terminal (kubectl, helm, k9s, krew, k8sgpt)
    ├── release.sh                # Image release automation
    └── .bashrc                   # Terminal config and aliases
```

## Key Utilities in lib.sh

- `echodate` - Timestamped logging
- `retry N command` - Exponential backoff retry
- `appendTrap command SIGNAL` - Append to existing traps
- `containerize command` - Run command inside Docker container
- `write_junit` - Generate JUnit XML test reports

## CI Workflow (API E2E)

1. Pre-warm Go cache (`download-gocache`)
2. Setup KIND cluster with networking
3. Deploy KKP via operator, configure LDAP and Dex
4. Create cloud provider presets (Azure, Hetzner, DigitalOcean, GCP, OpenStack)
5. Create test users (roxy-admin, jane via LDAP)
6. Run API E2E tests with tags (create, e2e, logout)

## Tech Stack

- Shell (bash/sh, POSIX compatible)
- Docker, KIND, containerd
- Kubernetes (kubectl, helm)
- Go tooling (golangci-lint, go-junit-report)
- Code quality: codespell, shfmt, boilerplate checker
- CI: Prow (uses JOB_NAME, PROW_JOB_ID, PULL_BASE_REF env vars)
