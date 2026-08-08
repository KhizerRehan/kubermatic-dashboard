# Web Terminal CLI Verification

Verify CLIs baked into the web-terminal Docker image actually work against a live cluster — not just that the binary is present.

## CLI versions in image

Source: `hack/images/web-terminal/Dockerfile`

| CLI | Version | Purpose |
|-----|---------|---------|
| kubectl | v1.34.3 | Kubernetes CLI |
| helm | v3.18.5 | Helm package manager |
| k9s | v0.50.18 | TUI cluster browser |
| krew | v0.4.5 | kubectl plugin manager |
| k8sgpt | v0.4.27 | AI cluster diagnostics |
| cilium-cli | v0.19.4 | Cilium CNI management |
| hubble | v1.19.4 | Cilium observability |
| velero | v1.18.1 | Backup/restore |

## Test cluster

- Name: `kr-hetzner` (`q4k9lww25w`)
- Version: 1.34.8
- Provider: hetzner / hetzner-fsn1
- CNI: **Cilium** (default for non-edge providers)

---

## 1. kubectl

```bash
kubectl version --client
kubectl get nodes
kubectl get pods -A
```

## 2. helm

```bash
helm version --short
helm list -A
```

## 3. k9s

```bash
k9s version
k9s            # interactive TUI; quit with :q
```

## 4. krew + plugins

```bash
kubectl krew version
kubectl ctx            # list/switch contexts
kubectl ns             # list/switch namespaces
```

## 5. k8sgpt

```bash
k8sgpt version
k8sgpt analyze         # scan cluster for issues
```

## 6. velero  ✅ verified

```bash
velero version --client-only
velero get backup
velero backup-location get
```

Verified output:
```
velero get backup
NAME                        STATUS      ERRORS   WARNINGS   CREATED                         EXPIRES   STORAGE LOCATION             QUEUE POSITION   SELECTOR
kr-hetzner-4k9lww25w-bkup   Completed   0        0          2026-06-16 07:20:35 +0000 UTC   23h       default-cluster-backup-bsl                    <none>
```

## 7. cilium

Cluster must run Cilium CNI (default here). Confirm pods first:

```bash
kubectl get pods -n kube-system -l k8s-app=cilium
kubectl get pods -n kube-system -l name=cilium-operator
```

CLI checks:

```bash
cilium version                       # client + server version
cilium status -n kube-system         # health table from live cluster
cilium status --wait -n kube-system  # block until healthy
```

Strong proof (optional, ~5-10 min, creates+cleans `cilium-test` ns):

```bash
cilium connectivity test -n kube-system
```

## 8. hubble

Binary check:

```bash
hubble version
```

Functional check — needs Hubble enabled (OFF by default in KKP). Check first:

```bash
kubectl get pods -n kube-system | grep hubble
```

If `hubble-relay` / `hubble-ui` pods exist:

```bash
cilium hubble port-forward &
hubble status
hubble observe --last 20
```

If no hubble pods → enable via Cluster UI → Edit Cluster → **Edit CNI Values**:

```yaml
hubble:
  enabled: true
  relay:
    enabled: true
```

Wait for reconcile, then re-run functional checks.

---

## Minimal smoke test (no cluster changes)

```bash
kubectl version --client
helm version --short
k9s version
kubectl krew version
k8sgpt version
velero version --client-only
cilium version && cilium status -n kube-system
hubble version
```

Proves every CLI present + cilium/velero reach the live cluster. Hubble functional path requires enabling Hubble.

## Notes

- cilium-cli v0.19.4 vs cluster Cilium ~1.18.x → compatible. Version-mismatch error from `cilium status` = real finding, report it.
- Hubble not exposed through KKP Dashboard UI/API; enable only via CNI values block.
