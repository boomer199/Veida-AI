import datetime
from datetime import timedelta

import json
import re
def parse_mc_questions(multiple_choice_questions):
    # Extract the JSON string (ignoring surrounding text)
    start_index = multiple_choice_questions.find('```json') + len('```json')
    end_index = multiple_choice_questions.find('```', start_index)
    json_str = multiple_choice_questions[start_index:end_index].strip()

    # Remove escape sequences if any
    json_str = json_str.replace('\n', '').replace('\\"', '"').replace('\\\'', '\'')

    # Ensure it starts with a proper JSON list or object
    if not json_str.startswith('[') and not json_str.startswith('{'):
        json_str = '[' + json_str

    # Ensure it ends properly
    if not json_str.endswith(']') and not json_str.endswith('}'):
        json_str += ']'

    parsed_json = None  # Initialize parsed_json
    try: 
        parsed_json = json.loads(json_str)
        return parsed_json  # Pretty-print the parsed JSON
    except json.JSONDecodeError as e:
        print(f"Failed to decode JSON: {e}")

    return parsed_json  # This will return None if parsing fails

def generate_review_dates(start_date, exam_date):
    if isinstance(exam_date, str):
        # Try parsing with time first
        try:
            exam_date = datetime.datetime.strptime(exam_date, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            # If that fails, try parsing as date only
            try:
                exam_date = datetime.datetime.strptime(exam_date, '%Y-%m-%d')
            except ValueError:
                raise ValueError("Invalid exam_date format. Expected 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'")

    if isinstance(start_date, str):
        start_date = datetime.datetime.strptime(start_date, '%Y-%m-%d %H:%M:%S')

    # Rest of the function remains the same
    study_duration = (exam_date - start_date).days
    review_dates = []

    intervals = [1, 3, 7, 14, 30]  # Review intervals in days
    for interval in intervals:
        review_date = start_date + datetime.timedelta(days=interval)
        if review_date < exam_date:
            review_dates.append(review_date.strftime('%Y-%m-%d'))

    return review_dates


    
    