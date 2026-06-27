import os
import fitz
import docx
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    import io
    doc = docx.Document(io.BytesIO(file_bytes))
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

def extract_text_from_txt(file_bytes: bytes) -> str:      # ← new
    return file_bytes.decode("utf-8")

def parse_resume_with_ai(resume_text: str) -> dict:
    prompt = f"""
    Extract the following information from this resume and return as JSON only:
    {{
        "full_name": "candidate name",
        "email": "email address",
        "phone": "phone number",
        "skills": "comma separated skills",
        "experience_years": number,
        "education": "highest education"
    }}
    
    Resume:
    {resume_text}
    
    Return only valid JSON, nothing else.
    """
    response = model.generate_content(prompt)
    import json
    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)

def calculate_ats_score(resume_text: str, job_description: str) -> dict:
    prompt = f"""
    Compare this resume with the job description and give ATS scores as JSON only:
    {{
        "ats_score": number between 0-100,
        "skill_match": number between 0-100,
        "experience_match": number between 0-100,
        "education_match": number between 0-100,
        "recommendation": "Selected/Rejected/Maybe"
    }}
    
    Resume:
    {resume_text}
    
    Job Description:
    {job_description}
    
    Return only valid JSON, nothing else.
    """
    response = model.generate_content(prompt)
    import json
    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)