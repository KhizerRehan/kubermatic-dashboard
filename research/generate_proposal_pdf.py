#!/usr/bin/env python3
"""Generate the Headlamp Migration Proposal PDF document."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    ListFlowable, ListItem, KeepTogether, HRFlowable
)
from reportlab.lib import colors
import os

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "headlamp-migration-proposal.pdf")

# Colors
PRIMARY = HexColor("#1a237e")       # Deep blue
SECONDARY = HexColor("#0d47a1")     # Medium blue
ACCENT = HexColor("#00796b")        # Teal
LIGHT_BG = HexColor("#e8eaf6")      # Light blue-gray
TABLE_HEADER_BG = HexColor("#1565c0")
TABLE_ALT_BG = HexColor("#f5f5f5")
RISK_HIGH = HexColor("#c62828")
RISK_MEDIUM = HexColor("#ef6c00")
RISK_LOW = HexColor("#2e7d32")


def build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="DocTitle",
        parent=styles["Title"],
        fontSize=26,
        leading=32,
        textColor=PRIMARY,
        spaceAfter=6,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name="DocSubtitle",
        parent=styles["Normal"],
        fontSize=14,
        leading=18,
        textColor=SECONDARY,
        spaceAfter=20,
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name="SectionHeading",
        parent=styles["Heading1"],
        fontSize=18,
        leading=22,
        textColor=PRIMARY,
        spaceBefore=24,
        spaceAfter=10,
        borderPadding=(0, 0, 4, 0),
    ))
    styles.add(ParagraphStyle(
        name="SubHeading",
        parent=styles["Heading2"],
        fontSize=14,
        leading=18,
        textColor=SECONDARY,
        spaceBefore=16,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="SubSubHeading",
        parent=styles["Heading3"],
        fontSize=12,
        leading=15,
        textColor=ACCENT,
        spaceBefore=12,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="Body",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        spaceAfter=8,
        alignment=TA_JUSTIFY,
    ))
    styles.add(ParagraphStyle(
        name="BodyBold",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        spaceAfter=8,
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        name="CodeBlock",
        parent=styles["Code"],
        fontSize=8,
        leading=11,
        fontName="Courier",
        backColor=HexColor("#f5f5f5"),
        borderPadding=6,
        spaceAfter=8,
        leftIndent=12,
    ))
    styles.add(ParagraphStyle(
        name="BulletItem",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        leftIndent=20,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="TableHeader",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=white,
        fontName="Helvetica-Bold",
    ))
    styles.add(ParagraphStyle(
        name="TableCell",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
    ))
    styles.add(ParagraphStyle(
        name="Footer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=HexColor("#999999"),
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name="CoverMeta",
        parent=styles["Normal"],
        fontSize=11,
        leading=15,
        textColor=HexColor("#616161"),
        alignment=TA_CENTER,
        spaceAfter=4,
    ))

    return styles


def make_table(headers, rows, col_widths=None):
    """Create a styled table."""
    s = build_styles()
    header_cells = [Paragraph(h, s["TableHeader"]) for h in headers]
    data = [header_cells]
    for row in rows:
        data.append([Paragraph(str(c), s["TableCell"]) for c in row])

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_commands = [
        ("BACKGROUND", (0, 0), (-1, 0), TABLE_HEADER_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cccccc")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_commands.append(("BACKGROUND", (0, i), (-1, i), TABLE_ALT_BG))
    t.setStyle(TableStyle(style_commands))
    return t


def bullet_list(items, s):
    """Create a bullet list from string items."""
    return ListFlowable(
        [ListItem(Paragraph(item, s["BulletItem"]), bulletColor=SECONDARY) for item in items],
        bulletType="bullet",
        bulletFontSize=8,
        leftIndent=16,
        spaceBefore=4,
        spaceAfter=8,
    )


def hr():
    return HRFlowable(width="100%", thickness=0.5, color=HexColor("#cccccc"), spaceBefore=8, spaceAfter=8)


def add_page_number(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica", 8)
    canvas_obj.setFillColor(HexColor("#999999"))
    canvas_obj.drawCentredString(A4[0] / 2, 20 * mm, f"Page {doc.page}")
    canvas_obj.drawString(25 * mm, 20 * mm, "KKP Headlamp Migration Proposal")
    canvas_obj.drawRightString(A4[0] - 25 * mm, 20 * mm, "DRAFT")
    canvas_obj.restoreState()


def build_document():
    s = build_styles()
    story = []
    pw = A4[0] - 2 * inch  # page width minus margins

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 2 * inch))
    story.append(Paragraph("Migration Proposal", s["DocTitle"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Kubernetes Dashboard <font color='#c62828'>(Retired)</font> "
        "&rarr; Headlamp <font color='#2e7d32'>(Active)</font>",
        s["DocSubtitle"]
    ))
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width="60%", thickness=2, color=PRIMARY, spaceBefore=0, spaceAfter=16))
    story.append(Paragraph("Kubermatic Kubernetes Platform (KKP)", s["CoverMeta"]))
    story.append(Paragraph("Draft v1.0 - March 2026", s["CoverMeta"]))
    story.append(Spacer(1, 24))
    story.append(Paragraph(
        "<b>Tracking Issue:</b> kubermatic/kubermatic#15287", s["CoverMeta"]
    ))
    story.append(Paragraph(
        "<b>Scope:</b> kubermatic/kubermatic + kubermatic/dashboard", s["CoverMeta"]
    ))
    story.append(Spacer(1, 48))
    story.append(Paragraph(
        "<b>Status:</b> <font color='#ef6c00'>DRAFT - For Review</font>", s["CoverMeta"]
    ))
    story.append(PageBreak())

    # =========================================================================
    # TABLE OF CONTENTS
    # =========================================================================
    story.append(Paragraph("Table of Contents", s["SectionHeading"]))
    story.append(hr())
    toc_items = [
        "1. Executive Summary",
        "2. Background and Motivation",
        "3. Current Architecture",
        "4. Headlamp Overview",
        "5. Migration Approaches",
        "6. Migration Strategy",
        "7. Detailed Technical Changes",
        "8. Headlamp Plugin Proposal (Phase 2)",
        "9. Challenges and Risks",
        "10. Testing Strategy",
        "11. Timeline and Phases",
        "12. Open Questions",
        "13. References",
    ]
    for item in toc_items:
        story.append(Paragraph(item, s["Body"]))
    story.append(PageBreak())

    # =========================================================================
    # 1. EXECUTIVE SUMMARY
    # =========================================================================
    story.append(Paragraph("1. Executive Summary", s["SectionHeading"]))
    story.append(hr())
    story.append(Paragraph(
        "The Kubernetes Dashboard (v2.7.0), currently integrated into KKP for per-cluster web UI access, "
        "has been <b>retired and archived</b> by the upstream maintainers. It no longer receives security "
        "patches, bug fixes, or feature updates. KKP already marks this feature as deprecated in both the "
        "API and frontend UI.",
        s["Body"]
    ))
    story.append(Paragraph(
        "<b>Headlamp</b> (<font face='Courier'>kubernetes-sigs/headlamp</font>) is the actively maintained "
        "successor under the Kubernetes SIG umbrella. It provides a modern React/Material UI frontend, a "
        "lightweight Go proxy backend, native OIDC support, and a powerful plugin system for extensibility.",
        s["Body"]
    ))
    story.append(Paragraph(
        "This document proposes a <b>Hybrid migration approach</b>: Phase 1 performs a direct replacement "
        "of the Kubernetes Dashboard deployment with Headlamp (per-cluster, same proxy architecture), "
        "followed by Phase 2 which develops KKP-specific Headlamp plugins for deeper integration. "
        "The migration spans two repositories: <font face='Courier'>kubermatic/kubermatic</font> "
        "(deployment resources) and <font face='Courier'>kubermatic/dashboard</font> (API proxy + Angular frontend).",
        s["Body"]
    ))
    story.append(Paragraph(
        "Two rollout strategies are evaluated: a hard cutover in a single release, and a gradual "
        "feature-flag-based transition. The feature-flag approach is recommended for Phase 1 to "
        "minimize risk and allow rollback.",
        s["Body"]
    ))

    # =========================================================================
    # 2. BACKGROUND AND MOTIVATION
    # =========================================================================
    story.append(Paragraph("2. Background and Motivation", s["SectionHeading"]))
    story.append(hr())

    story.append(Paragraph("2.1 Kubernetes Dashboard Retirement", s["SubHeading"]))
    story.append(Paragraph(
        "The Kubernetes Dashboard project (<font face='Courier'>kubernetes/dashboard</font>) has been "
        "moved to <font face='Courier'>kubernetes-retired/dashboard</font>. The project is no longer "
        "maintained and will not receive security updates. KKP currently deploys version 2.7.0 "
        "(<font face='Courier'>kubernetesui/dashboard:v2.7.0</font>) inside user clusters.",
        s["Body"]
    ))
    story.append(Paragraph(
        "KKP already acknowledges this deprecation. The frontend displays a warning message: "
        "<i>\"Kubernetes Dashboard is no longer maintained. This feature is deprecated and may be "
        "removed in a future release.\"</i>",
        s["Body"]
    ))

    story.append(Paragraph("2.2 Headlamp as Official Successor", s["SubHeading"]))
    story.append(Paragraph(
        "Headlamp is a Kubernetes SIG project (<font face='Courier'>kubernetes-sigs/headlamp</font>) "
        "that provides a modern, extensible web UI for Kubernetes clusters. It is actively developed, "
        "has a growing community, and provides a plugin system for customization. Unlike the retired "
        "dashboard, Headlamp receives regular releases with security patches and new features.",
        s["Body"]
    ))

    story.append(Paragraph("2.3 Tracking", s["SubHeading"]))
    story.append(Paragraph(
        "GitHub Issue: <font face='Courier' color='#0d47a1'>kubermatic/kubermatic#15287</font>",
        s["Body"]
    ))

    # =========================================================================
    # 3. CURRENT ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("3. Current Architecture", s["SectionHeading"]))
    story.append(hr())
    story.append(Paragraph(
        "The Kubernetes Dashboard integration in KKP operates across three layers: deployment, "
        "API proxy, and frontend. Understanding each layer is essential for planning the migration.",
        s["Body"]
    ))

    # 3.1 Deployment Layer
    story.append(Paragraph("3.1 Deployment Layer (kubermatic/kubermatic)", s["SubHeading"]))
    story.append(Paragraph(
        "The Kubernetes Dashboard is deployed <b>per-user-cluster</b> in the seed cluster's namespace "
        "for that cluster. The deployment is managed by resources in "
        "<font face='Courier'>pkg/resources/kubernetes-dashboard/</font> in the kubermatic repo.",
        s["Body"]
    ))
    story.append(bullet_list([
        "<b>Image:</b> <font face='Courier'>kubernetesui/dashboard:v2.7.0</font>",
        "<b>Container port:</b> 9090 (HTTP, insecure login enabled)",
        "<b>Label selector:</b> <font face='Courier'>app=kubernetes-dashboard</font>",
        "<b>Replicas:</b> 2 with anti-affinity",
        "<b>Auth:</b> Uses a mounted kubeconfig secret (<font face='Courier'>kubernetes-dashboard-kubeconfig</font>)",
        "<b>Flags:</b> <font face='Courier'>--enable-insecure-login</font>",
        "Health tracked in <font face='Courier'>ClusterHealth.KubernetesDashboard</font>",
        "Enabled by default on new clusters via <font face='Courier'>ClusterSpec.KubernetesDashboard.Enabled</font>",
    ], s))

    # 3.2 API Proxy Layer
    story.append(Paragraph("3.2 API Proxy Layer (kubermatic/dashboard)", s["SubHeading"]))
    story.append(Paragraph(
        "The KKP Dashboard API acts as a reverse proxy to the Kubernetes Dashboard running inside "
        "user clusters. This is implemented in 6 Go files under "
        "<font face='Courier'>modules/api/pkg/handler/v2/kubernetes-dashboard/</font>.",
        s["Body"]
    ))

    story.append(Paragraph("End-to-End Flow:", s["BodyBold"]))
    flow_steps = [
        "<b>1. Open Dashboard:</b> User clicks \"Open Dashboard\" on cluster details page. Frontend constructs URL: <font face='Courier'>/api/v2/dashboard/login?projectID=...&amp;clusterID=...</font>",
        "<b>2. OIDC Redirect:</b> API generates nonce, sets secure cookie, redirects to OIDC provider with scopes: openid, groups, email",
        "<b>3. OIDC Callback:</b> Provider redirects back with auth code. API exchanges code for tokens, verifies ID token has email claim",
        "<b>4. Token Storage:</b> ID token stored in <font face='Courier'>proxy</font> cookie, user redirected to proxy endpoint",
        "<b>5. Proxying:</b> On each request, API reads token from cookie, opens port-forward to dashboard pod (label: <font face='Courier'>app=kubernetes-dashboard</font>, port 9090), creates reverse proxy with <font face='Courier'>Authorization: Bearer</font> header",
    ]
    story.append(bullet_list(flow_steps, s))

    story.append(Paragraph("Handler Files:", s["BodyBold"]))
    handler_table = make_table(
        ["File", "Purpose"],
        [
            ["handler.go", "Base handler interface, isEnabled() global settings check"],
            ["login.go", "OIDC login redirect and callback endpoints"],
            ["proxy.go", "Reverse proxy via port-forward to dashboard pod"],
            ["director.go", "Strips KKP API prefix, sets Authorization header"],
            ["request.go", "Request types (InitialRequest, OIDCCallbackRequest, ProxyRequest)"],
            ["response.go", "Response types carrying tokens and OIDC state"],
        ],
        col_widths=[1.4 * inch, pw - 1.4 * inch]
    )
    story.append(handler_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "<b>Route Registration</b> (<font face='Courier'>routes_v2.go:1137-1157</font>): "
        "LoginHandler at <font face='Courier'>/dashboard/login</font> with OIDC middleware; "
        "ProxyHandler at <font face='Courier'>/projects/{project_id}/clusters/{cluster_id}/dashboard/proxy</font> "
        "with token extraction and cluster provider middleware.",
        s["Body"]
    ))

    # 3.3 Frontend Layer
    story.append(Paragraph("3.3 Frontend Layer (Angular)", s["SubHeading"]))
    story.append(Paragraph(
        "The Angular frontend provides UI controls for enabling/disabling the dashboard, "
        "displaying its health status, and launching it from the cluster details page.",
        s["Body"]
    ))

    frontend_table = make_table(
        ["Component / File", "Purpose"],
        [
            ["shared/entity/settings.ts", "enableDashboard boolean in AdminSettings (defaults true)"],
            ["shared/entity/cluster.ts", "KubernetesDashboard class with enabled? field"],
            ["shared/entity/health.ts", "kubernetesDashboard health state tracking"],
            ["cluster/details/cluster/component.ts", "\"Open Dashboard\" button, health check, proxy URL"],
            ["cluster/details/cluster/edit-cluster/", "KubernetesDashboardEnabled form control"],
            ["wizard/step/cluster/component.ts", "Dashboard toggle in cluster creation wizard"],
            ["settings/admin/defaults/", "Global enable/disable toggle (requires OIDC feature gates)"],
            ["core/services/cluster.ts", "getDashboardProxyURL() method"],
            ["shared/constants/common.ts", "KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE constant"],
        ],
        col_widths=[2.2 * inch, pw - 2.2 * inch]
    )
    story.append(frontend_table)

    # =========================================================================
    # 4. HEADLAMP OVERVIEW
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("4. Headlamp Overview", s["SectionHeading"]))
    story.append(hr())

    story.append(Paragraph("4.1 Architecture", s["SubHeading"]))
    story.append(Paragraph(
        "Headlamp consists of two main components: a <b>Go proxy backend</b> (headlamp-server) "
        "and a <b>React/Material UI frontend</b> SPA. The server handles kubeconfig injection, "
        "authentication, static file serving, and WebSocket proxying for streaming operations.",
        s["Body"]
    ))

    story.append(Paragraph("4.2 Key Features", s["SubHeading"]))
    story.append(bullet_list([
        "<b>Modern stack:</b> React + Material UI (MUI), TypeScript, actively maintained",
        "<b>Multi-cluster support:</b> Native support for managing multiple clusters",
        "<b>Plugin system:</b> Extensible via JavaScript/TypeScript plugins loaded at runtime",
        "<b>OIDC authentication:</b> Built-in OIDC support with configurable scopes",
        "<b>Token-based auth:</b> ServiceAccount tokens, bearer tokens via kubeconfig",
        "<b>Desktop app:</b> Available as an Electron-based desktop application",
        "<b>Helm chart:</b> Official Helm chart for in-cluster deployment",
        "<b>RBAC visualization:</b> Enhanced view of cluster roles and bindings",
    ], s))

    story.append(Paragraph("4.3 Plugin System", s["SubHeading"]))
    story.append(Paragraph(
        "Headlamp's plugin system allows extending the UI without forking the project. "
        "Plugins are npm packages using the <font face='Courier'>@kinvolk/headlamp-plugin</font> SDK. "
        "They can register new sidebar entries, detail view panels, actions, and custom pages. "
        "Plugins are distributed as JavaScript bundles loaded from a plugins directory at runtime.",
        s["Body"]
    ))

    story.append(Paragraph("4.4 Comparison with Kubernetes Dashboard", s["SubHeading"]))
    comparison_table = make_table(
        ["Aspect", "K8s Dashboard (Retired)", "Headlamp (Active)"],
        [
            ["Status", "Archived, unmaintained", "Active SIG project"],
            ["Frontend", "Angular", "React + MUI"],
            ["Backend", "Go", "Go (proxy-based)"],
            ["Multi-cluster", "Single cluster only", "Native multi-cluster"],
            ["Extensibility", "No plugin system", "Rich plugin API"],
            ["Desktop app", "None", "Electron desktop app"],
            ["Auth", "Token/kubeconfig", "OIDC, tokens, kubeconfig"],
            ["RBAC", "Basic view", "Enhanced visualization"],
        ],
        col_widths=[1.2 * inch, (pw - 1.2 * inch) / 2, (pw - 1.2 * inch) / 2]
    )
    story.append(comparison_table)

    # =========================================================================
    # 5. MIGRATION APPROACHES
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("5. Migration Approaches", s["SectionHeading"]))
    story.append(hr())

    story.append(Paragraph("5.1 Approach A: Direct Drop-in Replacement", s["SubHeading"]))
    story.append(Paragraph(
        "Replace the Kubernetes Dashboard deployment with Headlamp in the kubermatic repo. "
        "Adjust the KKP API proxy handler for Headlamp's port, labels, and path structure. "
        "Minimal frontend changes (rename labels, update health checks, remove deprecation warnings).",
        s["Body"]
    ))
    story.append(bullet_list([
        "<b>Pro:</b> Fastest path to production, minimal architectural change",
        "<b>Con:</b> Does not leverage Headlamp's plugin system or multi-cluster capabilities",
        "<b>Effort:</b> Medium (3-4 weeks)",
    ], s))

    story.append(Paragraph("5.2 Approach B: Full KKP-Integrated Headlamp", s["SubHeading"]))
    story.append(Paragraph(
        "Build custom Headlamp plugins from day one: KKP project context, cloud provider info, "
        "MLA integration, cluster updates. Deploy a single shared Headlamp instance per seed "
        "with multi-cluster support instead of per-cluster deployments.",
        s["Body"]
    ))
    story.append(bullet_list([
        "<b>Pro:</b> Best user experience, resource efficient, leverages full Headlamp capabilities",
        "<b>Con:</b> Large upfront effort, major architectural change, complex auth delegation",
        "<b>Effort:</b> High (8-12 weeks)",
    ], s))

    story.append(Paragraph("5.3 Approach C: Hybrid (Recommended)", s["SubHeading"]))
    story.append(Paragraph(
        "Start with Approach A (per-cluster Headlamp replacement) to quickly restore a working, "
        "maintained dashboard. Then incrementally develop KKP-specific Headlamp plugins in Phase 2. "
        "This provides fast time-to-value while opening the door for deeper integration.",
        s["Body"]
    ))
    story.append(bullet_list([
        "<b>Pro:</b> Fast initial delivery + clear extensibility roadmap",
        "<b>Con:</b> Two phases of work, initial deployment without KKP-specific features",
        "<b>Effort:</b> Medium initially (3-4 weeks), then incremental (4-6 weeks for plugins)",
    ], s))

    story.append(Paragraph("5.4 Comparison", s["SubHeading"]))
    approach_table = make_table(
        ["Criteria", "A: Drop-in", "B: Full Integration", "C: Hybrid"],
        [
            ["Time to production", "3-4 weeks", "8-12 weeks", "3-4 weeks (Phase 1)"],
            ["Risk", "Low", "High", "Low"],
            ["User impact", "Minimal change", "Major UX improvement", "Incremental improvement"],
            ["Extensibility", "Limited", "Full", "Full (after Phase 2)"],
            ["Architecture change", "Minimal", "Major", "Minimal then incremental"],
            ["Rollback complexity", "Simple", "Complex", "Simple"],
        ],
        col_widths=[1.3 * inch, (pw - 1.3 * inch) / 3, (pw - 1.3 * inch) / 3, (pw - 1.3 * inch) / 3]
    )
    story.append(approach_table)

    # =========================================================================
    # 6. MIGRATION STRATEGY
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("6. Migration Strategy", s["SectionHeading"]))
    story.append(hr())
    story.append(Paragraph(
        "Two rollout strategies are evaluated. The team should choose based on release timeline "
        "constraints and risk appetite.",
        s["Body"]
    ))

    story.append(Paragraph("6.1 Option 1: Hard Cutover", s["SubHeading"]))
    story.append(Paragraph(
        "A single KKP release replaces Kubernetes Dashboard with Headlamp. Existing clusters with "
        "<font face='Courier'>kubernetesDashboard.enabled: true</font> are automatically migrated "
        "to Headlamp on KKP upgrade. The old Kubernetes Dashboard pods are cleaned up by the "
        "cluster controller.",
        s["Body"]
    ))
    story.append(bullet_list([
        "<b>Pro:</b> Simpler implementation, no dual-path code, clean codebase",
        "<b>Con:</b> No rollback without KKP downgrade, higher risk, all-or-nothing for all clusters",
        "<b>When to choose:</b> Confidence in Headlamp compatibility is high, testing is thorough",
    ], s))

    story.append(Paragraph("6.2 Option 2: Gradual with Feature Flag (Recommended)", s["SubHeading"]))
    story.append(Paragraph(
        "Introduce a feature gate (e.g., <font face='Courier'>HeadlampDashboard</font>) alongside "
        "the existing <font face='Courier'>EnableDashboard</font> setting. Both dashboards are "
        "deployable; admins choose which one is active. This allows opt-in testing before full rollout.",
        s["Body"]
    ))
    story.append(Paragraph("Implementation options for the feature flag:", s["BodyBold"]))
    story.append(bullet_list([
        "<b>Option A:</b> New <font face='Courier'>dashboardType</font> field in AdminSettings: <font face='Courier'>'kubernetes-dashboard' | 'headlamp'</font>",
        "<b>Option B:</b> Separate <font face='Courier'>enableHeadlamp</font> boolean alongside <font face='Courier'>enableDashboard</font>",
        "<b>Option C:</b> KKP feature gate in <font face='Courier'>FeatureGates</font> configuration",
    ], s))
    story.append(Paragraph(
        "<b>Recommended rollout:</b> Feature flag in release N (default: Kubernetes Dashboard). "
        "Switch default to Headlamp in release N+1. Remove Kubernetes Dashboard code in release N+2.",
        s["Body"]
    ))

    strategy_table = make_table(
        ["Criteria", "Hard Cutover", "Feature Flag"],
        [
            ["Implementation complexity", "Lower", "Higher (dual paths)"],
            ["Risk", "Higher", "Lower (rollback possible)"],
            ["Testing burden", "Higher (must be thorough pre-release)", "Lower (progressive rollout)"],
            ["Code cleanliness", "Clean from day 1", "Temporary dual-path code"],
            ["User disruption", "All at once", "Gradual, opt-in"],
        ],
        col_widths=[1.6 * inch, (pw - 1.6 * inch) / 2, (pw - 1.6 * inch) / 2]
    )
    story.append(strategy_table)

    # =========================================================================
    # 7. DETAILED TECHNICAL CHANGES
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("7. Detailed Technical Changes", s["SectionHeading"]))
    story.append(hr())

    # 7.1 KKP Core
    story.append(Paragraph("7.1 KKP Core Repo (kubermatic/kubermatic)", s["SubHeading"]))

    story.append(Paragraph("7.1.1 Deployment Manifests", s["SubSubHeading"]))
    story.append(Paragraph(
        "Replace <font face='Courier'>pkg/resources/kubernetes-dashboard/deployment.go</font>:",
        s["Body"]
    ))
    story.append(bullet_list([
        "Change container image from <font face='Courier'>kubernetesui/dashboard:v2.7.0</font> to <font face='Courier'>ghcr.io/headlamp-k8s/headlamp:&lt;version&gt;</font> (pin specific version)",
        "Update container args: Headlamp uses <font face='Courier'>-in-cluster</font> and <font face='Courier'>-plugins-dir</font> flags",
        "Update container port (Headlamp defaults to port 4466)",
        "Update label selector from <font face='Courier'>app=kubernetes-dashboard</font> to <font face='Courier'>app=headlamp</font>",
        "Review volume mounts: Headlamp may use in-cluster ServiceAccount rather than a mounted kubeconfig",
        "Update liveness/readiness probes (Headlamp serves on <font face='Courier'>/</font>)",
    ], s))

    story.append(Paragraph("7.1.2 RBAC Resources", s["SubSubHeading"]))
    story.append(Paragraph(
        "Review and update ClusterRole/ClusterRoleBinding for Headlamp. Headlamp's server needs "
        "read access to cluster resources. If plugins need write access, scope the RBAC accordingly. "
        "Consider whether the existing RBAC setup for Kubernetes Dashboard is sufficient or needs expansion.",
        s["Body"]
    ))

    story.append(Paragraph("7.1.3 Health Checks", s["SubSubHeading"]))
    story.append(Paragraph(
        "Update the health check controller that monitors dashboard pod status. Change the label "
        "selector and potentially the health endpoint path. The health status field in "
        "<font face='Courier'>ClusterHealth</font> should be updated or aliased.",
        s["Body"]
    ))

    story.append(Paragraph("7.1.4 Deletion Resources", s["SubSubHeading"]))
    story.append(Paragraph(
        "Update <font face='Courier'>deletion.go</font> to clean up Headlamp resources instead of "
        "Kubernetes Dashboard resources when a cluster is deleted.",
        s["Body"]
    ))

    # 7.2 Dashboard API
    story.append(Paragraph("7.2 Dashboard Repo - Go API", s["SubHeading"]))

    story.append(Paragraph("7.2.1 Proxy Handler", s["SubSubHeading"]))
    story.append(Paragraph(
        "<font face='Courier'>modules/api/pkg/handler/v2/kubernetes-dashboard/proxy.go</font>",
        s["Body"]
    ))
    story.append(bullet_list([
        "Update <font face='Courier'>ContainerPort</font> reference: Headlamp uses port 4466 by default (vs 9090 for K8s Dashboard)",
        "Update <font face='Courier'>AppLabel</font> reference: change from <font face='Courier'>app=kubernetes-dashboard</font> to <font face='Courier'>app=headlamp</font>",
        "Update CSP header: Headlamp's React app may require <font face='Courier'>script-src 'self'</font> in addition to style-src",
        "The port-forward approach remains the same: open port-forward to Headlamp pod, reverse proxy requests",
        "Consider caching port-forwards (current code opens a new one per request with a TODO comment)",
    ], s))

    story.append(Paragraph("7.2.2 Login Flow", s["SubSubHeading"]))
    story.append(Paragraph(
        "<font face='Courier'>modules/api/pkg/handler/v2/kubernetes-dashboard/login.go</font>",
        s["Body"]
    ))
    story.append(Paragraph(
        "The OIDC login flow (redirect -> exchange -> cookie store -> proxy) should remain largely "
        "unchanged. Headlamp supports OIDC natively, but KKP's proxy model means KKP mediates auth. "
        "Key verification: confirm Headlamp accepts the ID token as a Bearer token for API calls.",
        s["Body"]
    ))

    story.append(Paragraph("7.2.3 Director (Path Rewriting)", s["SubSubHeading"]))
    story.append(Paragraph(
        "<font face='Courier'>modules/api/pkg/handler/v2/kubernetes-dashboard/director.go</font>",
        s["Body"]
    ))
    story.append(Paragraph(
        "The <font face='Courier'>getBasePath()</font> function strips everything before \"proxy\" "
        "in the URL. This should work unchanged if the route prefix stays the same. Verify that "
        "Headlamp's client-side routing (React Router) is compatible with this path stripping approach. "
        "Headlamp may need a <font face='Courier'>-base-url</font> configuration to handle the "
        "proxied path prefix correctly.",
        s["Body"]
    ))

    story.append(Paragraph("7.2.4 Routes", s["SubSubHeading"]))
    story.append(Paragraph(
        "<font face='Courier'>modules/api/pkg/handler/v2/routes_v2.go:1137-1157</font>",
        s["Body"]
    ))
    story.append(bullet_list([
        "Consider renaming route from <font face='Courier'>/dashboard/</font> to <font face='Courier'>/headlamp/</font> or keeping generic name",
        "If feature-flag approach: register both route sets, dispatch based on admin setting",
        "Package may be renamed from <font face='Courier'>kubernetesdashboard</font> to <font face='Courier'>headlamp</font>",
    ], s))

    story.append(Paragraph("7.2.5 API Types", s["SubSubHeading"]))
    story.append(Paragraph(
        "<font face='Courier'>modules/api/pkg/api/v1/types.go</font>",
        s["Body"]
    ))
    story.append(bullet_list([
        "<font face='Courier'>KubernetesDashboard</font> struct (line 1015): rename to <font face='Courier'>Headlamp</font> or <font face='Courier'>ClusterDashboard</font>, or add new field alongside",
        "<font face='Courier'>ClusterHealth.KubernetesDashboard</font> (line 1462): update field name",
        "Swagger/OpenAPI spec will need regeneration",
    ], s))

    story.append(Paragraph("7.2.6 Cluster Defaults", s["SubSubHeading"]))
    story.append(Paragraph(
        "<font face='Courier'>modules/api/pkg/resources/cluster/cluster.go:44-69</font> - "
        "Update defaulting logic to set Headlamp enabled by default instead of Kubernetes Dashboard.",
        s["Body"]
    ))

    # 7.3 Frontend
    story.append(Paragraph("7.3 Dashboard Repo - Angular Frontend", s["SubHeading"]))

    frontend_changes = make_table(
        ["File / Area", "Change Required"],
        [
            ["shared/entity/cluster.ts", "Rename KubernetesDashboard class to Headlamp (or add new, deprecate old)"],
            ["shared/entity/health.ts", "Update HealthStatusKey.KubernetesDashboard enum value"],
            ["shared/entity/settings.ts", "Rename enableDashboard to enableHeadlamp or add alongside"],
            ["cluster/details/cluster/component.ts", "Update isKubernetesDashboardHealthy getter, getProxyURL(), remove deprecation warning"],
            ["cluster/details/cluster/template.html", "Rename button text, update CSS classes, remove deprecation icon"],
            ["cluster/details/cluster/edit-cluster/", "Update KubernetesDashboardEnabled form control and spec patch"],
            ["wizard/step/cluster/component.ts", "Update KubernetesDashboardEnabled control and spec generation"],
            ["settings/admin/defaults/", "Update label from \"Enable Kubernetes Dashboard\" to \"Enable Headlamp\""],
            ["core/services/cluster.ts", "Update getDashboardProxyURL() method name and path"],
            ["shared/constants/common.ts", "Remove KUBERNETES_DASHBOARD_DEPRECATED_MESSAGE"],
            ["Cypress E2E tests", "Update selectors, page objects, and fixture data"],
            ["Swagger client models", "Regenerate from updated swagger.json"],
        ],
        col_widths=[2.0 * inch, pw - 2.0 * inch]
    )
    story.append(frontend_changes)

    # =========================================================================
    # 8. HEADLAMP PLUGIN PROPOSAL
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("8. Headlamp Plugin Proposal (Phase 2)", s["SectionHeading"]))
    story.append(hr())
    story.append(Paragraph(
        "After the initial replacement (Phase 1), KKP-specific Headlamp plugins can provide "
        "deeper integration and a better user experience. Plugins are JavaScript bundles loaded "
        "at runtime from a plugins directory mounted into the Headlamp container.",
        s["Body"]
    ))

    story.append(Paragraph("8.1 Proposed Plugins", s["SubHeading"]))

    plugin_table = make_table(
        ["Plugin", "Description", "Priority"],
        [
            ["KKP Project Context",
             "Sidebar entry showing KKP project info, breadcrumb integration linking back to KKP Dashboard, project-scoped resource filtering",
             "High"],
            ["Cloud Provider Info",
             "Display cloud provider details (AWS/GCP/Azure/etc.) for the cluster, show datacenter/region info, link to provider console",
             "Medium"],
            ["MLA Integration",
             "Direct links to Grafana/Loki dashboards from Headlamp, embedded monitoring panels, alert status display",
             "Medium"],
            ["Cluster Updates",
             "Show available Kubernetes version upgrades, link back to KKP Dashboard for upgrade action, display update windows",
             "Low"],
            ["Enhanced RBAC",
             "Show KKP-managed roles and bindings, visualize project member permissions, display group-project bindings (EE)",
             "Low"],
        ],
        col_widths=[1.2 * inch, pw - 1.2 * inch - 0.8 * inch, 0.8 * inch]
    )
    story.append(plugin_table)

    story.append(Paragraph("8.2 Plugin Architecture", s["SubHeading"]))
    story.append(bullet_list([
        "<b>Development:</b> Use <font face='Courier'>@kinvolk/headlamp-plugin</font> npm SDK",
        "<b>Registration:</b> Plugins call <font face='Courier'>registerRoute()</font>, <font face='Courier'>registerSidebarEntry()</font>, <font face='Courier'>registerDetailsViewHeaderAction()</font>",
        "<b>KKP API access:</b> Plugins call KKP API endpoints via the Headlamp proxy or direct fetch (requires CORS or proxy configuration)",
        "<b>Distribution:</b> Bake plugins into the Headlamp container image as part of the KKP build, or mount via ConfigMap/PersistentVolume",
    ], s))

    story.append(Paragraph("8.3 Plugin Distribution Strategy", s["SubHeading"]))
    story.append(Paragraph(
        "<b>Recommended:</b> Bake plugins into a custom Headlamp container image built as part of "
        "the KKP release pipeline. This ensures version compatibility between plugins and the "
        "Headlamp version. The Dockerfile would copy plugin bundles into "
        "<font face='Courier'>/headlamp/plugins/</font> during build.",
        s["Body"]
    ))

    # =========================================================================
    # 9. CHALLENGES AND RISKS
    # =========================================================================
    story.append(Paragraph("9. Challenges and Risks", s["SectionHeading"]))
    story.append(hr())

    risk_table = make_table(
        ["Risk", "Severity", "Mitigation"],
        [
            ["Port-forward scalability: current proxy opens a new port-forward per request",
             "Medium",
             "Implement port-forward caching/pooling (existing TODO in proxy.go). This is a pre-existing issue not introduced by migration."],
            ["CSP header differences: Headlamp's React SPA may need different Content-Security-Policy",
             "Low",
             "Test Headlamp behind the proxy, determine required CSP directives, update header in proxy handler."],
            ["Path rewriting compatibility: Headlamp uses React Router (client-side routing)",
             "Medium",
             "Configure Headlamp's -base-url flag to match the proxy path prefix. Test navigation within the proxied Headlamp."],
            ["OIDC token compatibility: verify Headlamp accepts KKP-issued ID tokens",
             "High",
             "Prototype early: deploy Headlamp in a test cluster, verify the existing OIDC flow works with Headlamp's token acceptance."],
            ["Resource overhead: Headlamp may have different CPU/memory profile per cluster",
             "Low",
             "Benchmark Headlamp resource usage, adjust deployment resource requests/limits accordingly."],
            ["Backward compatibility: existing clusters with kubernetesDashboard.enabled: true",
             "Medium",
             "Feature flag approach allows gradual migration. Cluster controller handles cleanup of old dashboard resources."],
            ["Plugin API stability: Headlamp plugin API is still evolving",
             "Medium",
             "Pin to stable Headlamp version for Phase 1. Phase 2 plugins should target a specific plugin API version."],
        ],
        col_widths=[2.0 * inch, 0.7 * inch, pw - 2.7 * inch]
    )
    story.append(risk_table)

    # =========================================================================
    # 10. TESTING STRATEGY
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("10. Testing Strategy", s["SectionHeading"]))
    story.append(hr())

    story.append(Paragraph("10.1 Unit Tests", s["SubHeading"]))
    story.append(Paragraph(
        "Go handler tests for the updated proxy logic using mock port-forwarder. Verify correct "
        "headers, path rewriting, and token handling. Update existing tests in "
        "<font face='Courier'>modules/api/pkg/handler/v2/kubernetes-dashboard/</font>.",
        s["Body"]
    ))

    story.append(Paragraph("10.2 Integration Tests", s["SubHeading"]))
    story.append(Paragraph(
        "Deploy Headlamp in a test seed cluster namespace. Verify the full proxy flow: OIDC login "
        "-> token exchange -> proxy -> Headlamp UI loads correctly. Test with real OIDC provider.",
        s["Body"]
    ))

    story.append(Paragraph("10.3 E2E Tests (Cypress)", s["SubHeading"]))
    story.append(Paragraph(
        "Update Cypress tests for: admin settings toggle, cluster creation wizard checkbox, "
        "cluster detail page \"Open Dashboard\" button visibility and health status display. "
        "Update page objects and selectors in the Cypress test suite.",
        s["Body"]
    ))

    story.append(Paragraph("10.4 Upgrade / Migration Tests", s["SubHeading"]))
    story.append(Paragraph(
        "Critical: verify existing clusters with <font face='Courier'>kubernetesDashboard.enabled: true</font> "
        "are correctly migrated to Headlamp on KKP upgrade. Verify old Kubernetes Dashboard resources "
        "are cleaned up. Test both fresh cluster creation and upgrade scenarios.",
        s["Body"]
    ))

    story.append(Paragraph("10.5 Performance Tests", s["SubHeading"]))
    story.append(Paragraph(
        "Measure proxy latency overhead for Headlamp vs Kubernetes Dashboard baseline. "
        "Benchmark Headlamp pod startup time, memory usage, and CPU consumption per cluster.",
        s["Body"]
    ))

    # =========================================================================
    # 11. TIMELINE AND PHASES
    # =========================================================================
    story.append(Paragraph("11. Timeline and Phases", s["SectionHeading"]))
    story.append(hr())

    timeline_table = make_table(
        ["Phase", "Duration", "Description", "Deliverables"],
        [
            ["Phase 0:\nInvestigation",
             "1-2 weeks",
             "Deploy Headlamp manually in a test cluster. Verify proxy compatibility, CSP requirements, path rewriting, OIDC token acceptance.",
             "Compatibility report, prototype branch"],
            ["Phase 1:\nDirect Replacement",
             "3-4 weeks",
             "Replace K8s Dashboard deployment with Headlamp in kubermatic repo. Update API proxy handlers and frontend UI. Implement feature flag.",
             "PRs for both repos, updated tests, release notes"],
            ["Phase 2:\nKKP Plugins",
             "4-6 weeks",
             "Develop KKP-specific Headlamp plugins: project context, provider info, MLA integration.",
             "Plugin packages, custom Headlamp image, documentation"],
            ["Phase 3:\nCleanup",
             "1 week",
             "Remove K8s Dashboard code paths, remove feature flag, update documentation.",
             "Clean codebase, updated docs"],
        ],
        col_widths=[1.0 * inch, 0.8 * inch, 2.2 * inch, pw - 4.0 * inch]
    )
    story.append(timeline_table)

    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "<b>Total estimated effort:</b> 9-13 weeks across all phases. Phase 1 can be shipped "
        "independently. Phase 2 plugins can be delivered incrementally across multiple releases.",
        s["Body"]
    ))

    # =========================================================================
    # 12. OPEN QUESTIONS
    # =========================================================================
    story.append(Paragraph("12. Open Questions", s["SectionHeading"]))
    story.append(hr())

    questions = [
        "<b>API route naming:</b> Should the route path change from <font face='Courier'>/dashboard/</font> to <font face='Courier'>/headlamp/</font>, or keep a generic name like <font face='Courier'>/cluster-ui/</font>?",
        "<b>CRD field naming:</b> Should <font face='Courier'>KubernetesDashboard</font> in the CRD/API types be renamed to <font face='Courier'>ClusterDashboard</font> (generic) or <font face='Courier'>Headlamp</font> (specific)?",
        "<b>OIDC mediation:</b> Does Headlamp's native OIDC support obviate the need for KKP's OIDC login flow, or should KKP continue to mediate authentication?",
        "<b>Version pinning:</b> What Headlamp version should KKP target? Should KKP track Headlamp releases or pin a specific version per KKP release?",
        "<b>Plugin distribution:</b> Should KKP plugins be baked into the container image (simpler) or loaded dynamically via ConfigMap (more flexible)?",
        "<b>Deployment model:</b> Is the per-cluster deployment model still the right choice, or should a single Headlamp instance serve multiple clusters per seed?",
        "<b>RBAC scope:</b> What are the RBAC implications of Headlamp's built-in capabilities (it can create/delete resources by default)?",
    ]
    for i, q in enumerate(questions, 1):
        story.append(Paragraph(f"{i}. {q}", s["Body"]))

    # =========================================================================
    # 13. REFERENCES
    # =========================================================================
    story.append(Paragraph("13. References", s["SectionHeading"]))
    story.append(hr())
    refs = [
        "<b>Kubernetes Dashboard (Retired):</b> <font face='Courier' color='#0d47a1'>https://github.com/kubernetes-retired/dashboard</font>",
        "<b>Headlamp Project:</b> <font face='Courier' color='#0d47a1'>https://github.com/kubernetes-sigs/headlamp</font>",
        "<b>Headlamp Documentation:</b> <font face='Courier' color='#0d47a1'>https://headlamp.dev/docs/latest/</font>",
        "<b>Headlamp Plugin Development:</b> <font face='Courier' color='#0d47a1'>https://headlamp.dev/docs/latest/development/plugins/</font>",
        "<b>Headlamp Helm Chart:</b> <font face='Courier' color='#0d47a1'>https://artifacthub.io/packages/helm/headlamp/headlamp</font>",
        "<b>KKP Documentation:</b> <font face='Courier' color='#0d47a1'>https://docs.kubermatic.com/kubermatic/</font>",
        "<b>Tracking Issue:</b> <font face='Courier' color='#0d47a1'>https://github.com/kubermatic/kubermatic/issues/15287</font>",
    ]
    for ref in refs:
        story.append(Paragraph(ref, s["Body"]))

    # =========================================================================
    # BUILD PDF
    # =========================================================================
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=1 * inch,
        rightMargin=1 * inch,
        topMargin=1 * inch,
        bottomMargin=1 * inch,
        title="KKP Migration Proposal: Kubernetes Dashboard to Headlamp",
        author="Kubermatic Engineering",
        subject="Migration from retired Kubernetes Dashboard to Headlamp",
    )
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"PDF generated: {OUTPUT_PATH}")


if __name__ == "__main__":
    build_document()
