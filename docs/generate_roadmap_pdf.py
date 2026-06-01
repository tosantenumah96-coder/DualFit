from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "dualfit-development-roadmap.md"
OUTPUT = ROOT / "dualfit-development-roadmap.pdf"


def build_styles():
    styles = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "DualFitTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            textColor=colors.HexColor("#0a0f0d"),
            spaceAfter=14,
            alignment=TA_LEFT,
        ),
        "h1": ParagraphStyle(
            "DualFitH1",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=21,
            textColor=colors.HexColor("#0b4f39"),
            spaceBefore=12,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "DualFitH2",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=colors.HexColor("#103f33"),
            spaceBefore=10,
            spaceAfter=5,
        ),
        "h3": ParagraphStyle(
            "DualFitH3",
            parent=styles["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            leading=15,
            textColor=colors.HexColor("#1a2d28"),
            spaceBefore=8,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "DualFitBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.2,
            leading=14,
            textColor=colors.HexColor("#111111"),
            spaceAfter=6,
        ),
        "bullet": ParagraphStyle(
            "DualFitBullet",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.2,
            leading=14,
            textColor=colors.HexColor("#111111"),
            leftIndent=14,
            firstLineIndent=-10,
            spaceAfter=4,
        ),
    }


def escape(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def markdown_to_story(markdown_text: str):
    styles = build_styles()
    story = []
    lines = markdown_text.splitlines()

    for raw_line in lines:
        line = raw_line.rstrip()
        stripped = line.strip()

        if not stripped:
            story.append(Spacer(1, 0.08 * inch))
            continue

        if stripped.startswith("# "):
            story.append(Paragraph(escape(stripped[2:]), styles["title"]))
            continue
        if stripped.startswith("## "):
            story.append(Paragraph(escape(stripped[3:]), styles["h1"]))
            continue
        if stripped.startswith("### "):
            story.append(Paragraph(escape(stripped[4:]), styles["h2"]))
            continue
        if stripped.startswith("#### "):
            story.append(Paragraph(escape(stripped[5:]), styles["h3"]))
            continue
        if stripped.startswith("- "):
            story.append(Paragraph(f"• {escape(stripped[2:])}", styles["bullet"]))
            continue

        story.append(Paragraph(escape(stripped), styles["body"]))

    return story


def main():
    markdown_text = SOURCE.read_text(encoding="utf-8")
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=LETTER,
        leftMargin=0.7 * inch,
        rightMargin=0.7 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.6 * inch,
        title="DualFit Development Roadmap",
        author="OpenAI Codex",
    )
    story = markdown_to_story(markdown_text)
    doc.build(story)
    print(f"Generated PDF: {OUTPUT}")


if __name__ == "__main__":
    main()
