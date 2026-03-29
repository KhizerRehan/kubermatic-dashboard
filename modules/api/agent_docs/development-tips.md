# Development Tips

Practical tips for working with the KKP Dashboard API codebase.

1. Most configuration is via CLI flags or kubeconfig
2. Use `-kubermatic-configuration-file` for local development
3. Logging is structured (zap) — grep with field names like `"error"` or `"seed"`
4. Provider calls respect context deadlines — use context with timeout
5. Always check privileged vs user-scoped operations
6. Always use correct import aliases (linter enforced)
7. Follow existing v1/v2 handler patterns when adding new endpoints
8. Test both CE and EE builds when changes affect edition-specific code
