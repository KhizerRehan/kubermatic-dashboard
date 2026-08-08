# Web-terminal CLIs — ENV/Pod validation + test strategy

## Context

Issue [#7512](https://github.com/kubermatic/dashboard/issues/7512). Cilium CLI, Hubble, Velero CLI
were added to the web-terminal image (`hack/images/web-terminal/Dockerfile` + `.bashrc`, commit
`074029e4d`). Local `docker run` smoke test passes (`cilium/hubble/velero version` all run).

Open question before merge: the image is deployed as a **Pod** by the API
(`modules/api/pkg/handler/websocket/terminal.go`). Do the new CLIs need any preconfigured
environment (e.g. `KUBECONFIG`, `PS1`) to be usable in a real terminal, and how do we test the
Pod path — not just `docker run`?

This plan records the investigation result and adds a **new "Pod / ENV validation" section** to the
existing `hack/images/web-terminal/plan.md`. **No code change to the Dockerfile or Go is required.**

## Investigation result (the answer)

**No new ENV is required for the three CLIs to work.** The backend already injects everything that
matters into the terminal Pod in `genWebTerminalPod` (`terminal.go:632-641`):

| ENV | Value | Purpose |
|-----|-------|---------|
| `KUBECONFIG` | `/etc/kubernetes/kubeconfig/kubeconfig` (const `webTerminalContainerKubeconfigPath`, `terminal.go:76`) | Points every kube client tool at the per-user kubeconfig |
| `PS1` | `\s-\v \w \$ ` | Bash prompt string only — cosmetic, unrelated to tooling |

- The kubeconfig is mounted **read-only** from the per-user secret: volume
  `resources.WEBTerminalKubeconfigSecretName`, mount `/etc/kubernetes/kubeconfig`
  (`getVolumes`/`getVolumeMounts`, `terminal.go:738-821`).
- `cilium` and `velero` are standard client-go tools → they honor `KUBECONFIG` automatically, exactly
  like `kubectl`/`helm`/`k9s` which already work in the terminal. So they inherit cluster access for
  free; **no Dockerfile ENV, no terminal.go change.**
- `options.AdditionalEnvironmentVariables` (`terminal.go:643-645`, surfaced via
  `KubermaticSettings.additionalEnvironmentVariables`) lets an admin add extra env per deployment if
  ever needed — but is not needed here.

### Per-tool notes (optional env, NOT required to run)
- **cilium** — `KUBECONFIG` (already set) + optional `CILIUM_NAMESPACE` (default `kube-system`).
  `cilium status` / `connectivity test` hit the kube-API → work in-terminal.
- **hubble** — talks to the **Hubble Relay**, not the kube-API. Needs `hubble --server <relay>` or a
  port-forward (env `HUBBLE_SERVER`). That is install-specific runtime user action → out of scope.
  `hubble version` / completion need nothing.
- **velero** — `KUBECONFIG` (already set) + optional `VELERO_NAMESPACE` (default `velero`). Works.

### PS1
`PS1` is the bash prompt variable (`shell-version  cwd  $`). It is set so the terminal shows a clean
prompt instead of bash's default. It has nothing to do with the new tools — leave as-is.

## Files to change

- **`hack/images/web-terminal/plan.md`** — append the new section below. (Only doc change.)
- No change to `Dockerfile`, `.bashrc`, or any Go file.

## New section to append to `hack/images/web-terminal/plan.md`

```markdown
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
\`\`\`bash
docker run --rm \
  -e KUBECONFIG=/etc/kubernetes/kubeconfig/kubeconfig \
  -e PS1='\s-\v \w \$ ' \
  -v "$HOME/.kube/config:/etc/kubernetes/kubeconfig/kubeconfig:ro" \
  web-terminal:test bash -lc '
    echo "KUBECONFIG=$KUBECONFIG"
    kubectl config current-context
    cilium version --client
    cilium status        || echo "(cilium status needs Cilium installed)"
    velero version --client-only
    velero version       || echo "(velero version needs Velero installed)"
    hubble version
  '
\`\`\`
Confirms the binaries resolve `KUBECONFIG` exactly as they will inside the Pod.

Tier 2 — real web terminal (optional, end-to-end). Image tag is pinned in the vendored SDK
(`resources.WEBTerminalImage = quay.io/kubermatic/web-terminal:0.12.0`, resources.go:191), so to test
a custom build either:
- push to a registry the user cluster can pull, tagged identically `web-terminal:0.12.0`, and use the
  KKP registry override (`overwriteRegistry`) to rewrite the registry host; or
- temporarily point `resources.WEBTerminalImage` at your image for a dev build.
Then open a web terminal in the dashboard and run `cilium version`, `velero version`, `hubble version`.
\`\`\`
```

## Verification

1. Build for host arch: `docker buildx build ./hack/images/web-terminal --platform linux/amd64 --load -t web-terminal:test`
2. Run the **Tier 1** command above with a reachable `~/.kube/config` — confirm each CLI prints a
   version and that cluster-aware commands (`kubectl config current-context`, `cilium status`,
   `velero version`) reach the API via the injected `KUBECONFIG`.
3. (Optional) Tier 2 end-to-end as described.
4. Confirm `hack/images/web-terminal/plan.md` contains the new "Pod / ENV validation" section.

## Out of scope
- Bumping the `0.12.0` image tag / re-vendoring the SDK (separate follow-up).
- Auto-targeting existing Cilium/Velero installs (Burak's note) — separate follow-up.
- Setting `CILIUM_NAMESPACE` / `VELERO_NAMESPACE` / `HUBBLE_SERVER` defaults — install-specific.
