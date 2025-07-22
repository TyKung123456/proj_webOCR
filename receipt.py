from fastapi import FastAPI
import psycopg2
import time
import requests
import json

app = FastAPI()

# === CONFIG ===
API_KEY = 'AIzaSyBtiZ-IL5ojnlziFv6QdtPMApSR6KRDcPE'
GEMINI_API_URL = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}'

DB_CONFIG = {
    "host": "localhost",
    "database": "n8n",
    "user": "admin",
    "password": "P@ssw0rd",
    "port": 5433
}

# === GEMINI API ===
def call_gemini_api(prompt: str) -> str:
    headers = {"Content-Type": "application/json"}
    body = {
        "contents": [{
            "role": "user",
            "parts": [{"text": prompt}]
        }]
    }

    response = requests.post(GEMINI_API_URL, headers=headers, data=json.dumps(body))
    if response.status_code == 200:
        data = response.json()
        return data['candidates'][0]['content']['parts'][0]['text'].strip('"\' \n\r\t')
    else:
        print("❌ API Error:", response.status_code, response.text)
        return "ERROR"

# === FASTAPI ENDPOINT ===
@app.post("/process")
def process_receipts():
    print("🚀 เริ่มประมวลผลใบเสร็จ...")

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        print("🌀 กำลังดึงข้อมูลใบเสร็จที่ยังไม่ประมวลผล...")
        cur.execute("SELECT id, ocr_text FROM uploaded_files_page WHERE extract_receipt IS NULL LIMIT 100")
        rows = cur.fetchall()
        print(f"📦 พบ {len(rows)} รายการ")

        results = []

        for row in rows:
            receipt_id, ocr_text = row
            if not ocr_text or len(ocr_text.strip()) < 10:
                print(f"⚠️ OCR ว่างหรือสั้นเกินไป (ID={receipt_id})")
                continue

            prompt = f"""คุณคือผู้เชี่ยวชาญด้านบัญชี ทำหน้าที่จัดหมวดหมู่ใบเสร็จจากข้อความ OCR ต่อไปนี้
โปรดตอบกลับด้วยประเภทใบเสร็จเท่านั้น เช่น ค่าอาหาร, ค่าเดินทาง, ค่าเช่ารถ, ค่าน้ำมัน, ค่าไฟฟ้า, ค่ารักษาพยาบาล ฯลฯ
ข้อความ OCR:
\"\"\"{ocr_text}\"\"\""""

            try:
                print(f"🔍 ส่ง Gemini วิเคราะห์ใบเสร็จ ID={receipt_id}")
                start_time = time.time()
                receipt_type = call_gemini_api(prompt)
                time_used = time.time() - start_time

                cur.execute("""
                    UPDATE uploaded_files_page
                    SET extract_receipt = %s,
                        extract_receipt_timeprocess = %s
                    WHERE id = %s
                    RETURNING id, extract_receipt
                """, (receipt_type, time_used, receipt_id))

                result = cur.fetchone()
                if result:
                    print(f"✅ DB Updated: ID={result[0]}, type={result[1]}")
                    results.append({"id": result[0], "type": result[1]})
                else:
                    print(f"⚠️ ไม่พบ ID ใน DB: {receipt_id}")

            except Exception as inner_e:
                print(f"❌ ERROR ในการอัปเดตใบเสร็จ ID={receipt_id}: {inner_e}")

        conn.commit()
        cur.close()
        conn.close()
        print("✅ เสร็จสิ้นการประมวลผลทั้งหมด")

        return {"processed": len(results), "details": results}

    except Exception as e:
        print(f"❌ ERROR: ไม่สามารถเชื่อมต่อหรือทำงานกับฐานข้อมูล: {e}")
        return {"error": str(e)}