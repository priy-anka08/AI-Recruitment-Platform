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


def get_recommendation_label(ats_score: float) -> str:
    if ats_score >= 90:
        return "Highly Recommended"
    elif ats_score >= 75:
        return "Recommended"
    elif ats_score >= 50:
        return "Needs Review"
    else:
        return "Not Suitable"


def generate_interview_questions(resume_text: str, job_title: str, job_description: str) -> dict:
    prompt = f"""
    You are an experienced technical interviewer. Based on this candidate's resume and the job
    they're applying for, generate interview questions.

    Return JSON only in this exact format:
    {{
        "technical_questions": ["question1", "question2", "question3", "question4"],
        "behavioral_questions": ["question1", "question2", "question3"],
        "resume_specific_questions": ["question1", "question2", "question3"]
    }}

    "technical_questions" = questions testing skills required for the role (based on job description).
    "behavioral_questions" = general behavioral/situational questions (teamwork, conflict, leadership).
    "resume_specific_questions" = questions that dig into specific projects, companies, or claims
    mentioned in THIS candidate's resume (e.g. "You mentioned building X, walk me through the architecture").

    Job Title: {job_title}
    Job Description: {job_description}

    Candidate Resume:
    {resume_text}

    Return only valid JSON, nothing else.
    """
    response = model.generate_content(prompt)
    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


# NEW: AI Resume Fraud Detection — flags inconsistencies, exaggeration, generic/copied-sounding text
def detect_resume_fraud(resume_text: str) -> dict:
    prompt = f"""
    You are reviewing a resume for authenticity red flags — NOT making a final judgment,
    just flagging patterns worth a human reviewer double-checking.

    Look for things like:
    - Inconsistent or overlapping employment/education dates
    - Vague or generic descriptions that could apply to anyone (buzzword stuffing without specifics)
    - Claims of impact/metrics with no supporting detail (e.g. "improved efficiency by 200%" with no context)
    - Skill lists that seem unrealistically broad for the stated experience level
    - Unusual formatting inconsistencies that suggest copy-pasted sections from different sources

    Return JSON only in this exact format:
    {{
        "risk_level": "Low" or "Medium" or "High",
        "red_flags": ["flag1", "flag2"],
        "notes": "one short sentence summarizing the overall assessment"
    }}

    If nothing suspicious is found, return risk_level "Low" and an empty red_flags array.
    This is only a screening aid — be conservative, do not flag normal resume variation as suspicious.

    Resume:
    {resume_text}

    Return only valid JSON, nothing else.
    """
    response = model.generate_content(prompt)
    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


# NEW: AI Skill Assessment Generator — MCQs generated from job description
def generate_skill_assessment(job_title: str, job_description: str, skills_required: str, num_questions: int = 5) -> dict:
    prompt = f"""
    Create a technical multiple-choice quiz to screen candidates for this job.
    Generate exactly {num_questions} questions covering the key skills required.

    Return JSON only in this exact format:
    {{
        "questions": [
            {{
                "question": "question text",
                "options": ["option A", "option B", "option C", "option D"],
                "correct_answer": "the exact text of the correct option",
                "skill_tested": "which skill this tests"
            }}
        ]
    }}

    Job Title: {job_title}
    Job Description: {job_description}
    Required Skills: {skills_required}

    Questions should be practical and test real understanding, not trivia.
    Return only valid JSON, nothing else.
    """
    response = model.generate_content(prompt)
    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


# NEW: Decision Consistency Check — flags mismatches between AI recommendation and human decision
# (proxy for unconscious bias/inconsistency, without using any demographic attributes)
def check_decision_consistency(candidates_data: list) -> dict:
    prompt = f"""
    You are auditing hiring decisions for consistency with AI recommendations, to catch
    potential unconscious bias or inconsistent decision-making. Do NOT consider or infer
    any demographic information (gender, ethnicity, age, etc) — this data is not provided
    and should not be guessed.

    For each candidate below, compare their AI recommendation label against their actual
    hiring status. Flag cases where these strongly contradict (e.g. "Highly Recommended"
    candidates who were rejected, or "Not Suitable" candidates who were selected/shortlisted),
    since these are worth a second look.

    Candidates:
    {json.dumps(candidates_data)}

    Return JSON only in this exact format:
    {{
        "flagged_cases": [
            {{"candidate_id": "id", "candidate_name": "name", "ai_recommendation": "...", "actual_status": "...", "reason": "short explanation"}}
        ],
        "consistency_score": number between 0-100,
        "summary": "one short sentence overall assessment"
    }}

    "consistency_score" = percentage of candidates where AI recommendation and actual status
    are reasonably aligned. Return only valid JSON, nothing else.
    """
    response = model.generate_content(prompt)
    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


# NEW: Semantic Candidate Ranking — holistic re-ranking beyond keyword ATS score
def semantic_rank_candidates(candidates_data: list, job_description: str) -> dict:
    prompt = f"""
    You are ranking candidates for a job using holistic semantic understanding, not just
    keyword matching. Consider overall fit: how well their actual experience, project depth,
    and trajectory align with what this role really needs — beyond just matching skill keywords.

    Job Description:
    {job_description}

    Candidates:
    {json.dumps(candidates_data)}

    Return JSON only in this exact format:
    {{
        "ranked_candidates": [
            {{"candidate_id": "id", "candidate_name": "name", "semantic_rank": 1, "reasoning": "one short sentence why they rank here"}}
        ]
    }}

    Rank all candidates from best fit (rank 1) to least fit. Return only valid JSON, nothing else.
    """
    response = model.generate_content(prompt)
    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


# NEW: AI Offer Recommendation — suggests a salary offer based on skills, experience, and job's budget
def generate_offer_recommendation(candidate_data: dict, job_data: dict) -> dict:
    prompt = f"""
    You are an HR compensation advisor. Recommend a fair salary offer for this candidate
    based on their skills, experience, ATS match score, and the job's budgeted salary range.

    Candidate:
    - Name: {candidate_data.get('full_name', '')}
    - Skills: {candidate_data.get('skills', '')}
    - Experience: {candidate_data.get('experience_years', 0)} years
    - Education: {candidate_data.get('education', '')}
    - ATS Score: {candidate_data.get('ats_score', 0)}

    Job:
    - Title: {job_data.get('title', '')}
    - Required Skills: {job_data.get('skills_required', '')}
    - Experience Range: {job_data.get('experience_min', 0)}-{job_data.get('experience_max', 0)} years
    - Budgeted Salary Range: {job_data.get('salary_min', 0)} - {job_data.get('salary_max', 0)}

    Return JSON only in this exact format:
    {{
        "recommended_salary": number,
        "salary_range_low": number,
        "salary_range_high": number,
        "confidence_level": "High" or "Medium" or "Low",
        "reasoning": "2-3 sentence explanation for this recommendation"
    }}

    Keep the recommendation within or close to the job's budgeted range unless the candidate's
    profile strongly justifies going above it. Return only valid JSON, nothing else.
    """
    response = model.generate_content(prompt)
    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)


# NEW: AI Candidate Pipeline Prediction — estimates likelihood of interview success / offer acceptance
def predict_pipeline_success(candidate_data: dict) -> dict:
    prompt = f"""
    You are predicting hiring pipeline outcomes for a candidate based on their profile so far.

    Candidate:
    - Name: {candidate_data.get('full_name', '')}
    - Current Status: {candidate_data.get('status', '')}
    - ATS Score: {candidate_data.get('ats_score', 0)}
    - Skills: {candidate_data.get('skills', '')}
    - Matched Skills: {candidate_data.get('matched_skills', '')}
    - Missing Skills: {candidate_data.get('missing_skills', '')}
    - Experience: {candidate_data.get('experience_years', 0)} years
    - AI Recommendation Label: {candidate_data.get('recommendation_label', '')}

    Return JSON only in this exact format:
    {{
        "interview_success_probability": number between 0-100,
        "offer_acceptance_probability": number between 0-100,
        "overall_hire_likelihood": "High" or "Medium" or "Low",
        "key_strengths": ["short phrase", "short phrase"],
        "risk_factors": ["short phrase", "short phrase"],
        "reasoning": "2-3 sentence explanation"
    }}

    Base predictions on the data given, not assumptions outside it. Return only valid JSON, nothing else.
    """
    response = model.generate_content(prompt)
    text = response.text.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)