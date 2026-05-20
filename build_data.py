from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PHASES_DIR = ROOT / "phases"
OUTPUT = Path(__file__).resolve().parent / "data.js"


SCREENING_LABELS = [
    "Full citation",
    "Year",
    "Journal/source",
    "Country/region",
    "Paper category",
    "Exposure(s)",
    "Health outcome(s)",
    "Framework/method used",
    "RR or exposure-response used",
    "AF/PAF used",
    "DALY/YLL/YLD used",
    "Uncertainty analysis",
    "Main output",
    "India relevance",
    "Should this be shortlisted in top 10",
    "One-line reason",
    "DOI or URL",
]


TOP10_LABELS = [
    "Full citation",
    "DOI / URL",
    "Country / region",
    "Publication year",
    "Study objective",
    "Exposure(s) studied",
    "Health outcome(s) studied",
    "Population studied",
    "Study design / methodology type",
    "EBOD / burden framework used",
    "Effect measures used",
    "Exact data inputs required",
    "Data sources used",
    "Baseline health metrics used",
    "Modeling workflow in sequence",
    "Equations / formulas / burden logic",
    "Uncertainty / sensitivity analysis",
    "Key quantitative outputs",
    "Important numbers and thresholds",
    "Main findings",
    "Author-stated limitations",
    "Relevance for India climate-health EBOD study",
    "What is directly reusable for our study",
    "What is not directly reusable",
    "Manuscript section(s) this supports",
    "Important figures/tables to note",
    "Exact quotable lines with page numbers",
    "Short 5-bullet high-value insight list",
]


def fix_text(text: str) -> str:
    try:
        repaired = text.encode("cp1252").decode("utf-8")
        if repaired.count("�") <= text.count("�"):
            text = repaired
    except (UnicodeEncodeError, UnicodeDecodeError):
        try:
            repaired = text.encode("latin1").decode("utf-8")
            if repaired.count("�") <= text.count("�"):
                text = repaired
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass

    replacements = {
        "\u2011": "-",
        "\u2013": "-",
        "\u2014": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2192": "->",
        "\u03bc": "u",
        "\u2082": "2",
        "\u2085": "5",
        "Ã¼": "ü",
        "Ãœ": "Ü",
        "Ã¶": "ö",
        "Ã–": "Ö",
        "Ã¤": "ä",
        "Ã„": "Ä",
        "Ã¡": "á",
        "Ã©": "é",
        "Ã³": "ó",
        "â‚‚": "2",
        "â‚…": "5",
        "â€œ": '"',
        "â€": '"',
        "â€˜": "'",
        "â€™": "'",
        "â€“": "-",
        "â€”": "-",
        "â€‘": "-",
        "â†’": "->",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text.replace("\r\n", "\n").strip()


def strip_markdown(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1 (\2)", text)
    text = text.replace("**", "").replace("*", "")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_fields(block: str, labels: list[str], style: str) -> dict[str, str]:
    values: dict[str, str] = {}
    if style == "screening":
        prefix = r"(?:^|\n)(?:\*|-)\s*"
    else:
        prefix = r"(?:^|\n)\d+\.\s+"
    all_labels = "|".join(re.escape(label) for label in labels)
    for label in labels:
        if style == "screening":
            pattern = rf"{prefix}{re.escape(label)}:\s*(.*?)(?=\n(?:\*|-)\s*(?:{all_labels}):|\Z)"
        else:
            pattern = rf"{prefix}\*\*{re.escape(label)}\*\*\s*(.*?)(?=\n\d+\.\s+\*\*|\nPAPER\s+\d+:|\Z)"
        match = re.search(pattern, block, re.S)
        values[label] = strip_markdown(match.group(1)) if match else "Not reported"
    return values


def extract_title(citation: str) -> str:
    citation = citation.strip()
    italic_match = re.search(r"\*(.*?)\*", citation)
    if italic_match:
        return italic_match.group(1).strip()
    quoted_match = re.search(r'"([^"]+)"', citation)
    if quoted_match:
        return quoted_match.group(1).strip()
    parts = citation.split(".")
    if len(parts) > 1:
        return parts[1].strip()
    return citation[:120].strip()


def parse_screening_file(path: Path) -> list[dict[str, str]]:
    text = fix_text(path.read_text(encoding="utf-8"))
    matches = re.findall(
        r"(?s)(?:###\s+\d+\..*?\n)?(?:\* Full citation:.*?)(?=(?:\n---+\n|\n###\s+\d+\.|\n\* Full citation:|\Z))",
        text,
    )
    papers = []
    for index, block in enumerate(matches, start=1):
        fields = extract_fields(block, SCREENING_LABELS, "screening")
        citation = fields["Full citation"]
        papers.append(
            {
                "id": f"{path.stem}-{index}",
                "phase": path.stem,
                "title": extract_title(citation),
                "citation": citation,
                "year": fields["Year"],
                "journal": fields["Journal/source"],
                "country": fields["Country/region"],
                "category": fields["Paper category"],
                "exposures": fields["Exposure(s)"],
                "outcomes": fields["Health outcome(s)"],
                "framework": fields["Framework/method used"],
                "rr": fields["RR or exposure-response used"],
                "af": fields["AF/PAF used"],
                "daly": fields["DALY/YLL/YLD used"],
                "uncertainty": fields["Uncertainty analysis"],
                "main_output": fields["Main output"],
                "india_relevance": fields["India relevance"],
                "shortlist": fields["Should this be shortlisted in top 10"],
                "reason": fields["One-line reason"],
                "url": fields["DOI or URL"],
            }
        )
    return papers


def parse_top10(path: Path) -> list[dict[str, str]]:
    text = fix_text(path.read_text(encoding="utf-8"))
    blocks = re.split(r"(?:^|\n)(?:PAPER|Paper)\s+(\d+):\s*\n", text)
    papers = []
    for number, block in zip(blocks[1::2], blocks[2::2]):
        fields = extract_fields(block, TOP10_LABELS, "top10")
        citation = fields["Full citation"]
        papers.append(
            {
                "rank": int(number),
                "title": extract_title(citation),
                "citation": citation,
                "url": fields["DOI / URL"],
                "country": fields["Country / region"],
                "year": fields["Publication year"],
                "objective": fields["Study objective"],
                "exposures": fields["Exposure(s) studied"],
                "outcomes": fields["Health outcome(s) studied"],
                "population": fields["Population studied"],
                "study_design": fields["Study design / methodology type"],
                "framework": fields["EBOD / burden framework used"],
                "effect_measures": fields["Effect measures used"],
                "inputs": fields["Exact data inputs required"],
                "data_sources": fields["Data sources used"],
                "baseline_metrics": fields["Baseline health metrics used"],
                "workflow": fields["Modeling workflow in sequence"],
                "equations": fields["Equations / formulas / burden logic"],
                "uncertainty": fields["Uncertainty / sensitivity analysis"],
                "quant_outputs": fields["Key quantitative outputs"],
                "numbers": fields["Important numbers and thresholds"],
                "findings": fields["Main findings"],
                "limitations": fields["Author-stated limitations"],
                "india_relevance": fields["Relevance for India climate-health EBOD study"],
                "direct_reuse": fields["What is directly reusable for our study"],
                "not_direct_reuse": fields["What is not directly reusable"],
                "manuscript_support": fields["Manuscript section(s) this supports"],
                "figures": fields["Important figures/tables to note"],
                "quotes": fields["Exact quotable lines with page numbers"],
                "insights": fields["Short 5-bullet high-value insight list"],
            }
        )
    return papers


def main() -> None:
    phase_files = sorted(PHASES_DIR.glob("phase*.txt"))
    inventory = []
    for phase_file in phase_files:
        inventory.extend(parse_screening_file(phase_file))
    top10 = parse_top10(PHASES_DIR / "top_10_papers.txt")

    payload = {
        "inventory": inventory,
        "top10": top10,
        "phaseFiles": [path.name for path in phase_files],
        "generatedFrom": str(PHASES_DIR),
    }
    OUTPUT.write_text(
        "window.RESEARCH_DATA = " + json.dumps(payload, indent=2, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
