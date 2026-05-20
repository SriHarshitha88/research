from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = Path(__file__).resolve().parent
DATA_JS = DASHBOARD / "data.js"
MD_OUT = ROOT / "EBOD_Literature_Review_Updated.md"
HTML_OUT = ROOT / "EBOD_Literature_Review_Updated.html"


PHASE_LABELS = {
    "phase1": "Phase 1 - EBOD methodology papers",
    "phase2": "Phase 2 - Climate-health burden framework papers",
    "phase3": "Phase 3 - Country or national implementation papers",
    "phase4": "Phase 4 - India and South Asia evidence papers",
    "phase5": "Phase 5 - Uncertainty and sensitivity papers",
    "phase6": "Phase 6 - Exposure-specific support papers",
}


def load_payload() -> dict:
    text = DATA_JS.read_text(encoding="utf-8")
    return json.loads(text.split("=", 1)[1].rsplit(";", 1)[0])


def clean(text: str) -> str:
    value = (text or "Not reported").strip()
    value = re.sub(r"\s+", " ", value)
    return value


def bullets_from_text(text: str, limit: int = 5) -> list[str]:
    value = text.replace("•", "\n* ").replace("\r", "")
    lines = []
    for raw in value.splitlines():
        line = raw.strip()
        if not line:
            continue
        line = re.sub(r"^[*\-]\s*", "", line)
        lines.append(line)
    out = []
    for line in lines:
        if line.lower().startswith("not reported"):
            continue
        out.append(line)
        if len(out) >= limit:
            break
    return out


def first_sentence(text: str) -> str:
    value = clean(text)
    match = re.split(r"(?<=[.!?])\s+", value)
    return match[0] if match else value


def phase_summary(inventory: list[dict]) -> list[tuple[str, int, int]]:
    results = []
    for phase in PHASE_LABELS:
        subset = [paper for paper in inventory if paper["phase"] == phase]
        results.append(
            (
                PHASE_LABELS[phase],
                len(subset),
                sum("high" in clean(paper["india_relevance"]).lower() for paper in subset),
            )
        )
    return results


def top_reuse_counts(top10: list[dict]) -> Counter:
    counter = Counter()
    rules = {
        "Full pipeline": r"workflow|framework|comparative risk assessment|pipeline",
        "RR integration": r"\brr\b|relative risk|exposure-response",
        "AF/PAF calculation": r"\baf\b|\bpaf\b|attributable fraction",
        "DALY conversion": r"daly|yll|yld",
        "Uncertainty analysis": r"uncertainty|sensitivity|monte carlo",
        "Policy framing": r"policy|state-level|national-level|decision",
    }
    for paper in top10:
        source = " ".join(
            [
                paper.get("direct_reuse", ""),
                paper.get("framework", ""),
                paper.get("findings", ""),
                paper.get("india_relevance", ""),
            ]
        ).lower()
        for label, pattern in rules.items():
            if re.search(pattern, source):
                counter[label] += 1
    return counter


def render_markdown(payload: dict) -> str:
    inventory = payload["inventory"]
    top10 = sorted(payload["top10"], key=lambda item: item["rank"])
    phase_counts = phase_summary(inventory)
    category_counts = Counter(p["phase"] for p in inventory)
    high_rel = sum("high" in clean(p["india_relevance"]).lower() for p in inventory)
    rr_yes = sum("yes" in clean(p["rr"]).lower() for p in inventory)
    af_yes = sum("yes" in clean(p["af"]).lower() for p in inventory)
    daly_yes = sum("yes" in clean(p["daly"]).lower() for p in inventory)
    unc_yes = sum("yes" in clean(p["uncertainty"]).lower() for p in inventory)
    reuse = top_reuse_counts(top10)

    lines: list[str] = []
    lines.append("# EBOD Literature Review Update")
    lines.append("")
    lines.append("## Study Focus")
    lines.append("")
    lines.append(
        "This review synthesizes 49 screened papers and 10 deeply extracted anchor papers to identify the most reusable Environmental Burden of Disease (EBOD) methods for an India-focused climate-health burden study."
    )
    lines.append("")
    lines.append("## Step 1 Summary")
    lines.append("")
    lines.append(f"- Total papers screened: {len(inventory)}")
    lines.append(f"- Deep-review highlighted papers: {len(top10)}")
    lines.append(f"- High India relevance papers: {high_rel}")
    lines.append(f"- Papers using RR or exposure-response: {rr_yes}")
    lines.append(f"- Papers using AF/PAF: {af_yes}")
    lines.append(f"- Papers using DALY/YLL/YLD: {daly_yes}")
    lines.append(f"- Papers including uncertainty analysis: {unc_yes}")
    lines.append("")
    lines.append("## Phase Coverage")
    lines.append("")
    for phase_label, total, high in phase_counts:
        lines.append(f"- {phase_label}: {total} papers, {high} with high India relevance")
    lines.append("")
    lines.append("## Main Methodological Synthesis")
    lines.append("")
    lines.append(
        "Across the reviewed literature, the dominant burden-estimation logic is a comparative risk assessment chain: exposure characterization, selection of relative risk or exposure-response function, calculation of attributable fraction, application to baseline mortality or morbidity, and conversion to YLL, YLD, and DALYs."
    )
    lines.append("")
    lines.append("### Common EBOD Pipeline")
    lines.append("")
    lines.append("1. Define climate or environmental exposure")
    lines.append("2. Select exposure-response relationship or relative risk")
    lines.append("3. Define counterfactual or minimum-risk exposure")
    lines.append("4. Calculate attributable fraction or population attributable fraction")
    lines.append("5. Apply the attributable fraction to baseline burden")
    lines.append("6. Convert attributable burden into YLL, YLD, and DALYs")
    lines.append("7. Quantify uncertainty and report assumptions")
    lines.append("")
    lines.append("### Recurring Input Requirements")
    lines.append("")
    lines.append("- Exposure distribution data")
    lines.append("- Relative risk or exposure-response coefficients")
    lines.append("- Baseline disease incidence, prevalence, or mortality")
    lines.append("- Population and demographic structure")
    lines.append("- Life tables and disability weights")
    lines.append("- Burden inputs for YLL, YLD, and DALY estimation")
    lines.append("- Uncertainty bounds for exposure and effect parameters")
    lines.append("")
    lines.append("### What Is Most Reusable for India")
    lines.append("")
    for label, count in reuse.most_common():
        lines.append(f"- {label}: supported explicitly by {count} of the top 10 papers")
    lines.append("")
    lines.append("## Top 10 Highlighted Papers")
    lines.append("")
    for paper in top10:
        lines.append(f"### {paper['rank']}. {clean(paper['title'])}")
        lines.append("")
        lines.append(f"- Citation: {clean(paper['citation'])}")
        lines.append(f"- Country or region: {clean(paper['country'])}")
        lines.append(f"- Framework: {clean(paper['framework'])}")
        lines.append(f"- Study design: {clean(paper['study_design'])}")
        lines.append(f"- Direct reuse for our study: {clean(paper['direct_reuse'])}")
        lines.append(f"- Main findings: {first_sentence(paper['findings'])}")
        lines.append(f"- Limitations: {first_sentence(paper['limitations'])}")
        lines.append("")
    lines.append("## Implications for the India Climate-Health EBOD Study")
    lines.append("")
    lines.append(
        "The review shows that India adaptation should combine WHO-style EBOD framing, GBD-aligned comparative risk assessment, India-specific response functions where available, and explicit uncertainty handling. Air pollution and heat emerge as the most immediately computable climate-sensitive modules because they have clearer exposure metrics, stronger Indian evidence, and existing attributable burden workflows."
    )
    lines.append("")
    lines.append("## Gap Before Step 2")
    lines.append("")
    lines.append("- Disease selection still needs to be finalized for India")
    lines.append("- India-specific RR functions are available for some exposures but not all climate-sensitive outcomes")
    lines.append("- Exposure thresholds and counterfactual choices need to be harmonized across disease modules")
    lines.append("- Baseline burden inputs must be mapped carefully for each shortlisted disease")
    lines.append("- Climate-only pathways remain less standardized than air-pollution modules")
    lines.append("")
    lines.append("## Full Inventory Appendix")
    lines.append("")
    grouped: dict[str, list[dict]] = defaultdict(list)
    for paper in inventory:
        grouped[paper["phase"]].append(paper)
    for phase in PHASE_LABELS:
        lines.append(f"### {PHASE_LABELS[phase]}")
        lines.append("")
        for paper in grouped.get(phase, []):
            lines.append(
                f"- {clean(paper['citation'])} | Category: {clean(paper['category'])} | RR: {clean(paper['rr'])} | AF/PAF: {clean(paper['af'])} | DALY: {clean(paper['daly'])} | Uncertainty: {clean(paper['uncertainty'])} | India relevance: {clean(paper['india_relevance'])}"
            )
        lines.append("")
    return "\n".join(lines)


def render_html(payload: dict) -> str:
    inventory = payload["inventory"]
    top10 = sorted(payload["top10"], key=lambda item: item["rank"])
    phase_counts = phase_summary(inventory)
    high_rel = sum("high" in clean(p["india_relevance"]).lower() for p in inventory)
    rr_yes = sum("yes" in clean(p["rr"]).lower() for p in inventory)
    af_yes = sum("yes" in clean(p["af"]).lower() for p in inventory)
    daly_yes = sum("yes" in clean(p["daly"]).lower() for p in inventory)
    unc_yes = sum("yes" in clean(p["uncertainty"]).lower() for p in inventory)
    reuse = top_reuse_counts(top10)

    grouped: dict[str, list[dict]] = defaultdict(list)
    for paper in inventory:
        grouped[paper["phase"]].append(paper)

    def esc(text: str) -> str:
        return (
            clean(text)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )

    top10_cards = []
    for paper in top10:
        top10_cards.append(
            f"""
            <section class="paper-card">
              <h3>{paper['rank']}. {esc(paper['title'])}</h3>
              <p><strong>Citation:</strong> {esc(paper['citation'])}</p>
              <p><strong>Framework:</strong> {esc(paper['framework'])}</p>
              <p><strong>Direct reuse:</strong> {esc(paper['direct_reuse'])}</p>
              <p><strong>Main findings:</strong> {esc(first_sentence(paper['findings']))}</p>
              <p><strong>Limitations:</strong> {esc(first_sentence(paper['limitations']))}</p>
            </section>
            """
        )

    appendix_blocks = []
    for phase in PHASE_LABELS:
        items = "".join(
            f"<li>{esc(p['citation'])} <span>| Category: {esc(p['category'])} | RR: {esc(p['rr'])} | AF/PAF: {esc(p['af'])} | DALY: {esc(p['daly'])} | Uncertainty: {esc(p['uncertainty'])} | India relevance: {esc(p['india_relevance'])}</span></li>"
            for p in grouped.get(phase, [])
        )
        appendix_blocks.append(f"<h3>{PHASE_LABELS[phase]}</h3><ul>{items}</ul>")

    reuse_items = "".join(
        f"<li><strong>{esc(label)}:</strong> {count} of the top 10 papers</li>"
        for label, count in reuse.most_common()
    )
    phase_items = "".join(
        f"<li><strong>{esc(label)}:</strong> {total} papers, {high} with high India relevance</li>"
        for label, total, high in phase_counts
    )

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EBOD Literature Review Updated</title>
  <style>
    body {{
      margin: 0;
      font-family: Georgia, 'Times New Roman', serif;
      background: #f4f1ea;
      color: #1a1f26;
      line-height: 1.6;
    }}
    .page {{
      width: min(1100px, calc(100vw - 48px));
      margin: 32px auto;
      background: #fffdf9;
      border: 1px solid #ddd5c9;
      border-radius: 22px;
      box-shadow: 0 18px 50px rgba(0,0,0,.08);
      overflow: hidden;
    }}
    header {{
      padding: 34px 40px 24px;
      background: linear-gradient(135deg, #114f46, #c38d26);
      color: white;
    }}
    header h1 {{
      margin: 0 0 10px;
      font-size: 2.4rem;
      line-height: 1.08;
    }}
    header p {{
      margin: 0;
      max-width: 820px;
    }}
    main {{
      padding: 28px 40px 40px;
    }}
    h2 {{
      font-size: 1.5rem;
      margin-top: 30px;
      border-bottom: 1px solid #e6dece;
      padding-bottom: 8px;
    }}
    h3 {{
      font-size: 1.08rem;
      margin-top: 20px;
    }}
    .stats {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 14px;
      margin: 18px 0 8px;
    }}
    .stat {{
      border: 1px solid #e0d7cb;
      border-radius: 14px;
      padding: 14px 16px;
      background: #faf7f1;
    }}
    .stat .num {{
      font-size: 1.8rem;
      font-weight: 700;
    }}
    .paper-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
    }}
    .paper-card {{
      border: 1px solid #e0d7cb;
      border-radius: 16px;
      padding: 16px;
      background: #fbf8f3;
      break-inside: avoid;
    }}
    ul, ol {{
      padding-left: 22px;
    }}
    li {{
      margin-bottom: 6px;
    }}
    .appendix ul {{
      padding-left: 18px;
    }}
    .appendix li span {{
      color: #56606d;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 0.92rem;
    }}
    @media print {{
      body {{
        background: white;
      }}
      .page {{
        width: 100%;
        margin: 0;
        border: none;
        box-shadow: none;
      }}
      header {{
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }}
    }}
  </style>
</head>
<body>
  <div class="page">
    <header>
      <h1>EBOD Literature Review Update</h1>
      <p>This updated review integrates all 49 screened papers and 10 deeply reviewed anchor papers to define the most reusable methodology for an India-focused climate-health Environmental Burden of Disease study.</p>
    </header>
    <main>
      <section>
        <h2>Step 1 Summary</h2>
        <div class="stats">
          <div class="stat"><div class="num">{len(inventory)}</div><div>Total papers screened</div></div>
          <div class="stat"><div class="num">{len(top10)}</div><div>Deep-review highlighted papers</div></div>
          <div class="stat"><div class="num">{high_rel}</div><div>High India relevance papers</div></div>
          <div class="stat"><div class="num">{rr_yes}</div><div>Papers using RR</div></div>
          <div class="stat"><div class="num">{af_yes}</div><div>Papers using AF/PAF</div></div>
          <div class="stat"><div class="num">{daly_yes}</div><div>Papers using DALY/YLL/YLD</div></div>
          <div class="stat"><div class="num">{unc_yes}</div><div>Papers with uncertainty analysis</div></div>
        </div>
      </section>

      <section>
        <h2>Phase Coverage</h2>
        <ul>{phase_items}</ul>
      </section>

      <section>
        <h2>Main Methodological Synthesis</h2>
        <p>Across the review, the dominant logic is a comparative risk assessment chain that moves from exposure characterization to response-function selection, attributable fraction estimation, application to baseline burden, and conversion into YLL, YLD, and DALYs. This pipeline is highly reusable for India, especially for heat and air-pollution modules.</p>
        <h3>Common EBOD Pipeline</h3>
        <ol>
          <li>Define climate or environmental exposure</li>
          <li>Select exposure-response relationship or relative risk</li>
          <li>Define counterfactual or minimum-risk exposure</li>
          <li>Calculate attributable fraction or population attributable fraction</li>
          <li>Apply the attributable fraction to baseline mortality or morbidity</li>
          <li>Convert attributable burden into YLL, YLD, and DALYs</li>
          <li>Quantify uncertainty and report assumptions</li>
        </ol>
        <h3>Recurring Input Requirements</h3>
        <ul>
          <li>Exposure distribution data</li>
          <li>Relative risk or exposure-response coefficients</li>
          <li>Baseline disease incidence, prevalence, or mortality</li>
          <li>Population and demographic structure</li>
          <li>Life tables and disability weights</li>
          <li>Burden inputs for YLL, YLD, and DALY estimation</li>
          <li>Uncertainty bounds for exposure and effect parameters</li>
        </ul>
      </section>

      <section>
        <h2>What Is Most Reusable for India</h2>
        <ul>{reuse_items}</ul>
      </section>

      <section>
        <h2>Top 10 Highlighted Papers</h2>
        <div class="paper-grid">{''.join(top10_cards)}</div>
      </section>

      <section>
        <h2>Implications for the India Climate-Health EBOD Study</h2>
        <p>The review supports building the Indian climate-health EBOD study around WHO-style EBOD methods, GBD-aligned comparative risk assessment, and India-specific response functions wherever they are available. Heat and air pollution currently have the strongest evidence base because they offer clearer exposure metrics, more mature response functions, and existing attributable burden workflows.</p>
      </section>

      <section>
        <h2>Gap Before Step 2</h2>
        <ul>
          <li>Disease selection still needs to be finalized for India.</li>
          <li>India-specific RR functions exist for some but not all climate-sensitive outcomes.</li>
          <li>Counterfactual exposure choices still need harmonization across disease modules.</li>
          <li>Baseline burden inputs must be mapped cleanly for each shortlisted disease.</li>
          <li>Climate-only pathways remain less standardized than air-pollution modules.</li>
        </ul>
      </section>

      <section class="appendix">
        <h2>Full Inventory Appendix</h2>
        {''.join(appendix_blocks)}
      </section>
    </main>
  </div>
</body>
</html>
"""


def main() -> None:
    payload = load_payload()
    MD_OUT.write_text(render_markdown(payload), encoding="utf-8")
    HTML_OUT.write_text(render_html(payload), encoding="utf-8")


if __name__ == "__main__":
    main()
