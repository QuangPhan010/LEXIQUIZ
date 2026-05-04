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
    model = genai.GenerativeModel('gemini-1.5-flash')

    prompt = f"""
    The following text contains a set of quiz questions. Your task is to extract ALL of the questions from the text and convert them into a structured JSON format.
    Do NOT limit the number of questions — extract every single question found in the text.

    Each question must have:
    - "text": The question content.
    - "choices": A list of choices (at least 2, ideally 4), each with "text" (string) and "is_correct" (boolean). Mark the correct answer as true.
    - "question_type": Always "MCQ".

    Text:
    {text}

    Return ONLY valid JSON. No explanation, no markdown code blocks.
    Format:
    {{
        "title": "Quiz Title Based on Content",
        "questions": [
            {{
                "text": "Question text?",
                "question_type": "MCQ",
                "choices": [
                    {{"text": "Option A", "is_correct": true}},
                    {{"text": "Option B", "is_correct": false}},
                    {{"text": "Option C", "is_correct": false}},
                    {{"text": "Option D", "is_correct": false}}
                ]
            }}
        ]
    }}
    """

    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.2,
            max_output_tokens=8192,
        ),
    )

    content = response.text
    print(f"[DEBUG generate_quiz_from_text] Raw response (first 500 chars): {content[:500]}")

    # Remove markdown code blocks if Gemini wraps the JSON
    content = re.sub(r'```json\s*', '', content)
    content = re.sub(r'```\s*', '', content)

    json_match = re.search(r'\{.*\}', content, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group())
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to decode JSON from AI: {str(e)} | Content preview: {content[:300]}")
    else:
        raise ValueError(f"AI did not return a valid JSON structure. Response preview: {content[:300]}")


def extract_questions_from_text(text):
    """
    Extracts questions and their choices from text without using AI.
    Groups choices (A, B, C, D) with their preceding questions.
    """
    import re
    
    # Split by newlines and clean up
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    results = []
    
    # Patterns
    q_start_pattern = re.compile(r'^(\d+|Câu\s+\d+)[\.\)\:]\s+', re.IGNORECASE)
    choice_pattern = re.compile(r'^\s*([a-dA-D])[\.\)]\s+', re.IGNORECASE)

    current_item = None

    for line in lines:
        choice_match = choice_pattern.match(line)
        
        if choice_match:
            # It's a choice (A, B, C, or D)
            choice_text = choice_pattern.sub('', line).strip()
            if current_item:
                current_item["choices"].append(choice_text)
            continue

        q_match = q_start_pattern.match(line)
        if q_match:
            # It's a new question
            if current_item and current_item["text"]:
                results.append(current_item)
            
            question_text = q_start_pattern.sub('', line).strip()
            current_item = {
                "text": question_text,
                "choices": []
            }
        else:
            # It's a regular line - either part of question or a question without marker
            if current_item:
                # If we haven't found any choices yet, it's likely part of the question text
                if not current_item["choices"]:
                    current_item["text"] += " " + line
                else:
                    # If we already have choices, a regular line might be part of the last choice
                    # but usually it's just noise or a new question without a marker.
                    # For safety in "dumb" mode, we'll ignore it or start a new question if long.
                    if len(line) > 20 and not current_item["choices"]:
                         current_item["text"] += " " + line
            elif len(line) > 15:
                # Potential start of a question without a number
                current_item = {
                    "text": line,
                    "choices": []
                }

    if current_item and current_item["text"]:
        results.append(current_item)

    return results

