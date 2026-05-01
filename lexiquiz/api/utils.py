import PyPDF2
import docx
import google.generativeai as genai
from django.conf import settings
import json
import re

def extract_text_from_pdf(file):
    reader = PyPDF2.PdfReader(file)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def extract_text_from_docx(file):
    doc = docx.Document(file)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

def generate_quiz_from_text(text):
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured in settings.py")

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-flash-latest')

    prompt = f"""
    Based on the following text, generate a quiz with 5-10 multiple choice questions in JSON format.
    Each question must have:
    - "text": The question content.
    - "choices": A list of 4 choices, each with "text" and "is_correct" (boolean).
    - "question_type": Always "MCQ".

    Text:
    {text[:5000]}  # Limit text to 5000 chars for safety

    Return ONLY valid JSON.
    Format:
    {{
        "title": "Generated Quiz Title",
        "questions": [
            {{
                "text": "Question text?",
                "question_type": "MCQ",
                "choices": [
                    {{"text": "Option 1", "is_correct": true}},
                    {{"text": "Option 2", "is_correct": false}},
                    ...
                ]
            }}
        ]
    }}
    """

    response = model.generate_content(prompt)
    
    # Extract JSON from response (sometimes Gemini wraps it in ```json ... ```)
    content = response.text
    # Remove markdown code blocks if present
    content = re.sub(r'```json\s*', '', content)
    content = re.sub(r'```\s*', '', content)
    
    json_match = re.search(r'\{.*\}', content, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError:
            # Fallback: try to clean up more if it's still messy
            raise ValueError(f"Failed to decode JSON from AI: {content[:200]}...")
    else:
        raise ValueError(f"AI did not return a valid JSON structure. Response: {content[:200]}...")
