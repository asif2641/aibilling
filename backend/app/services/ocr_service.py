import sys
import subprocess
import os
import logging
from typing import Optional, Tuple, List, Union
import io

logger = logging.getLogger(__name__)

class OCRService:
    @classmethod
    def extract_text_from_pdf(cls, file_input: Union[str, bytes]) -> Tuple[str, int, List[str]]:
        """
        Extract text, page count, and page-by-page text from a PDF file using pypdf.
        If the PDF consists of scanned images, extracts embedded page images and runs OCR on them.
        Returns: (combined_text, page_count, list_of_page_texts)
        """
        import pypdf

        if isinstance(file_input, str):
            if not os.path.exists(file_input):
                return "", 0, []
            try:
                with open(file_input, "rb") as f:
                    pdf_bytes = f.read()
            except Exception as fe:
                logger.warning(f"Failed to open PDF file {file_input}: {fe}")
                return "", 0, []
        else:
            pdf_bytes = file_input

        if not pdf_bytes:
            return "", 0, []

        try:
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            page_count = len(reader.pages)
            page_texts: List[str] = []

            for idx, page in enumerate(reader.pages, start=1):
                p_text = page.extract_text() or ""
                # If page text is sparse, attempt to extract embedded scanned images
                if len(p_text.strip()) < 15 and hasattr(page, "images") and len(page.images) > 0:
                    import tempfile
                    img_texts = []
                    for img in page.images:
                        try:
                            ext = ".jpg"
                            if hasattr(img, "name") and "." in img.name:
                                ext = os.path.splitext(img.name)[1].lower()
                            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp_img:
                                tmp_img.write(img.data)
                                tmp_path = tmp_img.name
                            try:
                                ocr_res = cls.extract_text_from_file(tmp_path)
                                if ocr_res.strip():
                                    img_texts.append(ocr_res.strip())
                            finally:
                                if os.path.exists(tmp_path):
                                    os.remove(tmp_path)
                        except Exception as img_err:
                            logger.debug(f"Embedded PDF image OCR extraction skipped: {img_err}")
                    if img_texts:
                        p_text = "\n".join(img_texts)

                page_texts.append(p_text.strip())

            combined_text = "\n\n".join(
                f"--- Page {i+1} ---\n{txt}" if page_count > 1 else txt
                for i, txt in enumerate(page_texts) if txt
            )
            return combined_text.strip(), page_count, page_texts
        except Exception as e:
            logger.error(f"Error parsing PDF with pypdf: {e}")
            return "", 0, []

    @classmethod
    def extract_text_from_file(cls, file_path: str) -> str:
        """
        Extract text from an image or PDF file.
        Uses native Windows.Media.Ocr engine for images, and pypdf for PDFs.
        Returns extracted text as a plain string, or empty string if unavailable.
        """
        if not os.path.exists(file_path):
            return ""

        abs_file = os.path.abspath(file_path)
        ext = os.path.splitext(abs_file)[1].lower()
        if ext == ".pdf":
            text, _, _ = cls.extract_text_from_pdf(abs_file)
            return text

        if sys.platform != "win32":
            return ""

        # Locate ocr_runner.ps1 in backend root
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        runner_ps1 = os.path.join(base_dir, "ocr_runner.ps1")
        if not os.path.exists(runner_ps1):
            return ""

        # Preprocess image with Pillow for optimal Windows OCR accuracy if image format
        prep_file = None
        if ext in [".jpg", ".jpeg", ".png", ".webp"]:
            try:
                import tempfile
                from PIL import Image, ImageEnhance, ImageOps
                with Image.open(abs_file) as img:
                    # Convert to grayscale and apply autocontrast + sharpness
                    gray = ImageOps.autocontrast(img.convert("L"), cutoff=2)
                    enhancer = ImageEnhance.Sharpness(gray)
                    enhanced = enhancer.enhance(1.5)
                    
                    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                        prep_file = tmp.name
                    enhanced.save(prep_file, "JPEG", quality=95)
            except Exception as pe:
                logger.debug(f"OCR preprocessing skipped: {pe}")
                prep_file = None

        target_file = prep_file if prep_file and os.path.exists(prep_file) else abs_file

        try:
            res = subprocess.run(
                [
                    "powershell",
                    "-NoProfile",
                    "-NonInteractive",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-File",
                    runner_ps1,
                    target_file
                ],
                capture_output=True,
                text=True,
                timeout=15
            )
            extracted = res.stdout.strip()
            
            # If preprocessed produced very little text but original might have more, try original
            if prep_file and len(extracted) < 20:
                res_orig = subprocess.run(
                    [
                        "powershell",
                        "-NoProfile",
                        "-NonInteractive",
                        "-ExecutionPolicy",
                        "Bypass",
                        "-File",
                        runner_ps1,
                        abs_file
                    ],
                    capture_output=True,
                    text=True,
                    timeout=15
                )
                if len(res_orig.stdout.strip()) > len(extracted):
                    extracted = res_orig.stdout.strip()

            return extracted
        except Exception as e:
            logger.warning(f"Windows OCR execution failed: {e}")
            return ""
        finally:
            if prep_file and os.path.exists(prep_file):
                try:
                    os.remove(prep_file)
                except Exception:
                    pass
