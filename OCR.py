from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import psycopg2
import logging
from datetime import datetime
import re
import asyncio
from typhoon_ocr import ocr_document

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Typhoon API Key
os.environ["TYPHOON_OCR_API_KEY"] = "sk-k3P9pmjvgqhv9Xb8YzsKiVhczsZP1irSKAswUP7jWrdvVlxm"

# PostgreSQL config
DB_CONFIG = {
    "host": "localhost",
    "port": 5433,
    "user": "admin",
    "password": "P@ssw0rd",
    "dbname": "myprj_receipt"
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

# FastAPI app
app = FastAPI()

# OCR input model
class OCRRequest(BaseModel):
    filepath: str
    page_num: int
    file_id: int
    filename: str
    fullfile_path: str
    folder_timestamp: str

# OCR extract logic
def extract_fields(text: str):
    now = datetime.now().isoformat()

    def extract_taxid(text):
        match = re.search(r'เลขประจำตัวผู้เสียภาษี(?:อากร)?:?\s*([0-9]{13})', text)
        return match.group(1) if match else None

    def extract_receipt_number(text):
        match = re.search(r'\bRECEIPT[-\s]?[A-Z0-9]+\b', text, re.IGNORECASE)
        return match.group(0).strip() if match else None

    def extract_entity_name(text):
        lines = text.splitlines()
        for line in lines:
            if 'บริษัท' in line and len(line.strip()) < 100:
                return line.strip()
        return None

    def extract_receipt_no(text):
        match = re.search(r'(?i)\bเลขที่[:\s]*([A-Za-z0-9\-_/\\]+)', text)
        if match:
            return match.group(1).strip()
        match2 = re.search(r'\b\d{3}\b', text)
        return match2.group(0) if match2 else None

    return {
        "extract_taxid": extract_taxid(text),
        "extract_taxid_timeprocess": now,
        "extract_receipt": extract_receipt_number(text),
        "extract_receipt_timeprocess": now,
        "extract_entity": extract_entity_name(text),
        "extract_entity_timeprocess": now,
        "extract_number_of_receipt": extract_receipt_no(text),
        "extract_number_of_receipt_timeprocess": now,
    }

@app.post("/ocr")
def ocr_and_save(req: OCRRequest):
    if not os.path.exists(req.filepath):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        logger.info(f"OCR started: {req.filepath}")
        
        # ⏱ OCR with timeout (180 sec)
        try:
            ocr_text = asyncio.run(asyncio.wait_for(
                asyncio.to_thread(ocr_document, req.filepath), timeout=180
            ))
        except asyncio.TimeoutError:
            logger.warning(f"OCR TIMEOUT (>180s): {req.filepath}")
            return {
                "status": "timeout_skipped",
                "file_id": req.file_id,
                "page_number": req.page_num,
                "message": "OCR timeout after 180 seconds. Skipped."
            }

        time_process = datetime.now().isoformat()
        extracted = extract_fields(ocr_text)

        # 💾 Insert into DB
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO uploaded_files_page (
                page_number,
                file_id,
                ocr_text,
                time_process,
                extract_taxid,
                extract_taxid_timeprocess,
                extract_receipt,
                extract_receipt_timeprocess,
                extract_entity,
                extract_entity_timeprocess,
                extract_number_of_receipt,
                extract_number_of_receipt_timeprocess,
                filename,
                fullfile_path,
                folder_timestamp,
                uploaded_at,
                similarity_score,
                similar_to_file_id,
                similarity_status,
                total_amount,
                owner,
                work_detail,
                client_ip,
                receipt_date
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
            )
        """, (
            req.page_num,
            req.file_id,
            ocr_text,
            time_process,
            extracted["extract_taxid"],
            extracted["extract_taxid_timeprocess"],
            extracted["extract_receipt"],
            extracted["extract_receipt_timeprocess"],
            extracted["extract_entity"],
            extracted["extract_entity_timeprocess"],
            extracted["extract_number_of_receipt"],
            extracted["extract_number_of_receipt_timeprocess"],
            req.filename,
            req.fullfile_path,
            req.folder_timestamp
        ))
        conn.commit()
        cur.close()
        conn.close()

        return {
            "status": "success",
            "file_id": req.file_id,
            "page_number": req.page_num,
            "time_process": time_process,
            "extract": extracted
        }

    except Exception as e:
        logger.error(f"OCR failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def health_check():
    return {"status": "ok"}