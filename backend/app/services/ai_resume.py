import os
import fitz
import docx
import json
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

def extract_text_from_txt(file_bytes: bytes) -> str:
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
    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


# NEW: AI Candidate Summary — short professional summary for HR to skim quickly
def generate_candidate_summary(resume_text: str, job_title: str = "") -> str:
    prompt = f"""
    Read this resume and write a short professional summary in exactly 2-3 sentences,
    highlighting years of experience, key skills, and notable projects or achievements.
    Write it in third person, factual, no fluff, suitable for an HR recruiter to skim quickly.
    {"The candidate is applying for the role of: " + job_title if job_title else ""}

    Resume:
    {resume_text}

    Return only the summary text, no headings, no JSON, no markdown formatting.
    """
    response = model.generate_content(prompt)
    return response.text.strip()


# NEW: AI Skill Gap Analysis — compares candidate skills against JD required skills
def analyze_skill_gap(candidate_skills: str, job_skills_required: str) -> dict:
    prompt = f"""
    Compare the candidate's skills against the job's required skills.
    Return JSON only in this exact format:
    {{
        "matched_skills": ["skill1", "skill2"],
        "missing_skills": ["skill3", "skill4"],
        "extra_skills": ["skill5"]
    }}

    Candidate Skills: {candidate_skills}
    Required Skills: {job_skills_required}

    "matched_skills" = skills present in both.
    "missing_skills" = required skills the candidate does NOT have.
    "extra_skills" = candidate skills not required by the job but still relevant.

    Return only valid JSON, nothing else.
    """
    response = model.generate_content(prompt)
    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


# NEW: AI Recommendation label based on ATS score
def get_recommendation_label(ats_score: float) -> str:
    if ats_score >= 90:
        return "Highly Recommended"
    elif ats_score >= 75:
        return "Recommended"
    elif ats_score >= 50:
        return "Needs Review"
    else:
        return "Not Suitable"