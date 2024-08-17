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