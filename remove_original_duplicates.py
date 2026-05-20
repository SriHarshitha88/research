from __future__ import annotations

import shutil
from pathlib import Path

from docx import Document


ROOT = Path(__file__).resolve().parents[1]
DOCX_PATH = ROOT / "EBOD_Literature Review.docx"
BACKUP_PATH = ROOT / "EBOD_Literature Review.backup_before_duplicate_removal.docx"


ORIGINAL_PAPER_MATCHES = [
    "Environmental Burden of Disease Assessment: A Case Study in the United Arab Emirate",
    "Development of a Method to Determine the Environmental Burden of Diseases",
    "Introduction and methods: Environmental burden of disease at national level",
    "Comparative Risk Assessment of the Burden of Disease from Climate Change",
    "Diseases due to unhealthy environments: an updated estimate of the global burden of disease attributable to environmental determinants of health",
    "Disease burden attributable to high temperature between 1990 and 2021 in South Asia and Southeast Asia, with projections to 2045",
    "Dealing with uncertainties in environmental burden of disease assessments",
    "Air Pollution and Chronic Respiratory Diseases (CRDs) in Rajasthan",
    "Environmental Burden of Disease due to Emissions of Hard Coal and Lignite-Fired Power Plants in Germany, 2015",
    "Global Burden of Disease from Environmental Factors",
    "Introduction to the Environmental Burden of Disease concept",
    "Environmental burden of disease – national assessment concept and examples",
    "Climate change and disability-adjusted life years",
]


def main() -> None:
    if not BACKUP_PATH.exists():
        shutil.copy2(DOCX_PATH, BACKUP_PATH)

    doc = Document(DOCX_PATH)
    table = doc.tables[0]

    rows_to_remove = []
    for row in table.rows[1:]:
        first_cell = row.cells[0].text
        if any(match in first_cell for match in ORIGINAL_PAPER_MATCHES):
            rows_to_remove.append(row)

    for row in rows_to_remove:
        table._tbl.remove(row._tr)

    doc.save(DOCX_PATH)
    print(f"removed={len(rows_to_remove)}")
    print(f"remaining_rows={len(table.rows)-1}")


if __name__ == "__main__":
    main()
