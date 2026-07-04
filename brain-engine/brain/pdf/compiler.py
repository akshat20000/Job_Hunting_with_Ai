import os
from fpdf import FPDF

class PDFCompiler(FPDF):
    def header(self):
        pass

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

    def compile_markdown_to_pdf(self, markdown_content: str, output_path: str) -> str:
        self.set_margins(left=20, top=20, right=20)
        self.set_auto_page_break(auto=True, margin=15)
        self.add_page()
        self.set_font("Helvetica", size=10)

        safe_text_width = self.epw
        lines = markdown_content.split("\n")

        for line in lines:
            stripped = line.strip()
            if not stripped:
                self.ln(3)
                continue

            cleaned = (
                stripped.replace("\u201c", '"')
                .replace("\u201d", '"')
                .replace("\u2018", "'")
                .replace("\u2019", "'")
                .replace("\u2013", "-")
                .replace("\u2014", "--")
                .replace("\u2022", "*")
                .replace("**", "")
                .replace("*", "")
                .replace("📞","Phone")
                .replace("📧","mail")
            )

            if cleaned.startswith("# "):
                self.ln(4)
                self.set_font("Helvetica", "B", 18)
                self.multi_cell(safe_text_width, 10, cleaned[2:])
                self.set_font("Helvetica", size=10)
                self.ln(2)

            elif cleaned.startswith("## "):
                self.ln(4)
                self.set_font("Helvetica", "B", 13)
                self.multi_cell(safe_text_width, 8, cleaned[3:])
                self.set_font("Helvetica", size=10)
                self.ln(1)

            elif cleaned.startswith("### "):
                self.ln(3)
                self.set_font("Helvetica", "B", 11)
                self.multi_cell(safe_text_width, 6, cleaned[4:])
                self.set_font("Helvetica", size=10)
                self.ln(1)

            elif cleaned.startswith("- ") or cleaned.startswith("* ") or (cleaned[0].isdigit() if cleaned and cleaned[0] else False):
                text = cleaned[2:] if (cleaned.startswith("- ") or cleaned.startswith("* ")) else cleaned
                self.set_x(25)
                self.cell(4, 5, chr(149), ln=False)  
                self.multi_cell(safe_text_width - 9, 5, text)
                self.set_x(20)

            else:
                self.multi_cell(safe_text_width, 5, cleaned)

        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        self.output(output_path)
        return output_path