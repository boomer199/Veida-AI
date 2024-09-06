import datetime
from datetime import datetime, timedelta
import json
import re


def parse_mc_questions(multiple_choice_questions):
    # Extract the JSON string (ignoring surrounding text)
    start_index = multiple_choice_questions.find('```json') + len('```json')
    end_index = multiple_choice_questions.find('```', start_index)
    json_str = multiple_choice_questions[start_index:end_index].strip()

    # Ensure it starts with a proper JSON list or object
    if not json_str.startswith('[') and not json_str.startswith('{'):
        json_str = '[' + json_str

    # Ensure it ends properly
    if not json_str.endswith(']') and not json_str.endswith('}'):
        json_str += ']'

    try: 
        parsed_json = json.loads(json_str)
        return parsed_json  # Return the parsed JSON
    except json.JSONDecodeError as e:
        print(f"Failed to decode JSON: {e}")
        return None  # Return None if parsing fails
    
def generate_review_dates(start_date, exam_date):
    if isinstance(exam_date, str):
        try:
            exam_date = datetime.strptime(exam_date, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            try:
                exam_date = datetime.strptime(exam_date, '%Y-%m-%d')
            except ValueError:
                raise ValueError("Invalid exam_date format. Expected 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'")

    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, '%Y-%m-%d %H:%M:%S')

    total_days = (exam_date - start_date).days
    review_dates = []

    # Specific ratios for review intervals
    ratios = [1/45, 4/45, 9/45, 15/45, 25/45, 34/45, 1]  # Last ratio is 1 to ensure the last day is the exam day

    for ratio in ratios:
        review_interval = int(ratio * total_days)
        review_date = start_date + timedelta(days=review_interval)
        if review_date <= exam_date:
            review_dates.append(review_date.strftime('%Y-%m-%d'))

    # Remove duplicates while preserving order
    unique_review_dates = list(dict.fromkeys(review_dates))

    return unique_review_dates