import sys
import subprocess
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class OCRService:
    @staticmethod
    def extract_text_from_file(file_path: str) -> str:
        """
        Extract text from an image file using native Windows.Media.Ocr engine via ocr_runner.ps1.
        Returns extracted text as a plain string, or empty string if unavailable.
        """
        if not os.path.exists(file_path):
            return ""

        if sys.platform != "win32":
            return ""

        # Locate ocr_runner.ps1 in backend root
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        runner_ps1 = os.path.join(base_dir, "ocr_runner.ps1")
        if not os.path.exists(runner_ps1):
            return ""

        abs_file = os.path.abspath(file_path)

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
                    abs_file
                ],
                capture_output=True,
                text=True,
                timeout=12
            )
            return res.stdout.strip()
        except Exception as e:
            logger.warning(f"Windows OCR execution failed: {e}")
            return ""
