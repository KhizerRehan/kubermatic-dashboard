# KKP Dashboard Documentation

Documentation directory for the Kubermatic Kubernetes Platform Dashboard. Contains operational manuals, design proposals, and supporting assets.

## Structure

```
docs/
├── manuals/
│   ├── release.md          # Release checklist and procedures
│   └── customizing.md      # Theme customization guide (source & compiled CSS approaches)
├── proposals/
│   └── testing.md          # Historical testing proposal (draft, Angular CLI)
└── assets/                 # Screenshots for documentation guides
```

## Key Files

- `manuals/release.md` - Pre-release testing steps, issue templates, GitHub release creation
- `manuals/customizing.md` - Theme customization guide covering both source-based SCSS and compiled CSS approaches
- `proposals/testing.md` - Archived draft proposal for Angular CLI testing strategy

## Notes

- Plain Markdown files with no build framework (no mkdocs, sphinx, or docusaurus)
- Images referenced via relative paths (`../assets/`)
- Intended for direct viewing on GitHub or docs website
- Covers CE (Community Edition) and EE (Enterprise Edition)
