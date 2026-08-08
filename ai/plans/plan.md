# Web-terminal: add Cilium CLI, Hubble, Velero CLI

## Context

Issue [#7512](https://github.com/kubermatic/dashboard/issues/7512). Decision: keep web-terminal
image lean but make a few extra cluster tools available inside the terminal. Add three CLIs:

- **Cilium CLI** (`cilium`)
- **Hubble** (`hubble`)
- **Velero CLI** (`velero`)

Pattern mirrors reference PR [#7509](https://github.com/kubermatic/dashboard/pull/7509) (which
added k9s/krew/oidc-login the same way).

**Acceptance criteria**: `cilium version`, `hubble version`, `velero version` all run inside an
opened web terminal.

### Out of scope (per user)
- Bumping image tag `0.12.0` (lives in vendored kkp SDK `resources.go:191`, not this repo).
- Auto-configuring CLIs against existing Cilium/Velero installs (Burak's note) — separate follow-up.

## Files to change

All in `hack/images/web-terminal/`:

1. **`Dockerfile`** — add version ENVs + install RUN blocks.
2. **`.bashrc`** — (optional) add shell completion for the new tools.

No Go/Angular changes. The terminal pod already runs this image via
`resources.WEBTerminalImage` (`modules/api/pkg/handler/websocket/terminal.go:75`); new binaries on
`PATH` are automatically available once the image rebuilds.

## Dockerfile changes

Follow existing tool-install idiom (curl → extract → `mv` to `/usr/local/bin` → `chmod +x` →
print version). Multi-arch: use `${TARGETARCH}` (`amd64`/`arm64`), already an ARG in the file.

### 1. Version ENVs (near other version pins, lines ~22-35)

```dockerfile
# Source: https://github.com/cilium/cilium-cli/releases
ENV CILIUM_CLI_VERSION=<latest-stable>

# Source: https://github.com/cilium/hubble/releases
ENV HUBBLE_VERSION=<latest-stable>

# Source: https://github.com/vmware-tanzu/velero/releases
ENV VELERO_VERSION=<latest-stable>
```
Pin to the latest stable tag confirmed on each release page at implementation time.

### 2. Install blocks (after k8sgpt block, before final USER switches)

```dockerfile
# Install Cilium CLI
RUN curl -L --fail https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-${TARGETARCH}.tar.gz | tar -xzO cilium > /usr/local/bin/cilium && \
  chmod +x /usr/local/bin/cilium && \
  cilium version --client

# Install Hubble
RUN curl -L --fail https://github.com/cilium/hubble/releases/download/${HUBBLE_VERSION}/hubble-linux-${TARGETARCH}.tar.gz | tar -xzO hubble > /usr/local/bin/hubble && \
  chmod +x /usr/local/bin/hubble && \
  hubble version

# Install Velero CLI (archive nests binary under velero-${VERSION}-linux-${TARGETARCH}/)
RUN curl -L --fail https://github.com/vmware-tanzu/velero/releases/download/${VELERO_VERSION}/velero-${VELERO_VERSION}-linux-${TARGETARCH}.tar.gz | tar -xzO velero-${VELERO_VERSION}-linux-${TARGETARCH}/velero > /usr/local/bin/velero && \
  chmod +x /usr/local/bin/velero && \
  velero version --client-only
```

Notes:
- Cilium/Hubble archives have the binary at archive root → `tar -xzO <name>`.
- Velero archive nests binary in a versioned dir → path includes `${VELERO_VERSION}`.
- Place blocks while `USER 0` (root) is active so writes to `/usr/local/bin` succeed (same as k8sgpt block at lines 105-116).

### 3. `.bashrc` (optional, low priority)

Add completion to match existing kubectl/helm entries:
```bash
### cilium / hubble / velero completion
source <(cilium completion bash)
source <(hubble completion bash)
source <(velero completion bash)
```

## Verification

1. Build image locally for host arch:
   ```bash
   docker buildx build ./hack/images/web-terminal --platform linux/amd64 --load -t web-terminal:test
   ```
2. Smoke-test binaries in the built image:
   ```bash
   docker run --rm web-terminal:test bash -lc 'cilium version --client && hubble version && velero version --client-only'
   ```
3. End-to-end (matches issue AC): deploy image, open a web terminal in the dashboard, run
   `cilium version`, `hubble version`, `velero version`.

## Pod / ENV validation (issue #7512)

Deployed as a Pod by the API (`modules/api/pkg/handler/websocket/terminal.go`, `genWebTerminalPod`).
No extra ENV is needed for the new CLIs:

- Backend injects `KUBECONFIG=/etc/kubernetes/kubeconfig/kubeconfig` (terminal.go:634) and `PS1`
  (cosmetic prompt). Kubeconfig is mounted read-only from the per-user secret.
- `cilium` and `velero` are client-go tools → honor `KUBECONFIG` automatically (same as
  kubectl/helm/k9s). `hubble` targets the Hubble Relay (`--server`/port-forward), not the kube-API,
  so it has no kubeconfig dependency to preconfigure.
- Optional, install-specific (NOT set by us): `CILIUM_NAMESPACE`, `VELERO_NAMESPACE`, `HUBBLE_SERVER`.
  Admins can inject these via `KubermaticSettings.additionalEnvironmentVariables` if desired.

### Test tiers

Tier 1 — simulate the Pod env locally (no KKP cluster needed; needs a reachable kube cluster):
```bash
docker run --rm \
  -e KUBECONFIG=/etc/kubernetes/kubeconfig/kubeconfig \
  -e PS1='\s-\v \w \$ ' \
  -v "$HOME/.kube/<CLUSTER_CONFIG>:/etc/kubernetes/kubeconfig/kubeconfig:ro" \
  web-terminal:test bash -lc '
    echo "KUBECONFIG=$KUBECONFIG"
    kubectl config current-context
    cilium version --client
    cilium status        || echo "(cilium status needs Cilium installed)"
    velero version --client-only
    velero version       || echo "(velero version needs Velero installed)"
    hubble version
  '
```
Confirms the binaries resolve `KUBECONFIG` exactly as they will inside the Pod.

Tier 2 — real web terminal (optional, end-to-end). Image tag is pinned in the vendored SDK
(`resources.WEBTerminalImage = quay.io/kubermatic/web-terminal:0.12.0`, resources.go:191), so to test
a custom build either:
- push to a registry the user cluster can pull, tagged identically `web-terminal:0.12.0`, and use the
  KKP registry override (`overwriteRegistry`) to rewrite the registry host; or
- temporarily point `resources.WEBTerminalImage` at your image for a dev build.
Then open a web terminal in the dashboard and run `cilium version`, `velero version`, `hubble version`.

## Follow-ups (not this PR)
- Bump `web-terminal` image tag in kkp SDK + re-vendor so deployments pick up the new tools.
- Configure CLIs to target existing Cilium/Velero installs by default (Burak's note).
