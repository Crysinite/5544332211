import os
import json
from flask import Flask, render_template, abort

app = Flask(__name__)

# --- Configuration ---
STORY_DATA_PATH = 'story_data'
ACTS_CONFIG = {
    1: "Act 1 - End of Summer",
    2: "Act 2 - Fall",
    3: "Act 3 - Winter",
    4: "Act 4 - Spring",
    5: "Act 5 - Summer Break DLC"
}

# --- Helper Functions ---
def get_story_data(act_num, chapter_num, day_name):
    """Loads the JSON data for a specific day."""
    try:
        file_path = os.path.join(STORY_DATA_PATH, f'act_{act_num}', f'chapter_{chapter_num}', f'{day_name}.json')
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except json.JSONDecodeError:
        return None # Handle malformed JSON

def get_chapters_for_act(act_num):
    """Scans the directory to find chapters for a given act."""
    act_path = os.path.join(STORY_DATA_PATH, f'act_{act_num}')
    if not os.path.isdir(act_path):
        return []
    chapters = []
    for item in sorted(os.listdir(act_path)):
        if os.path.isdir(os.path.join(act_path, item)) and item.startswith('chapter_'):
            try:
                chapter_num = int(item.split('_')[1])
                chapters.append(chapter_num)
            except (ValueError, IndexError):
                continue
    return sorted(chapters)

# --- Routes ---
@app.route('/')
def home():
    """Renders the main home page with the list of acts."""
    return render_template('index.html', acts=ACTS_CONFIG)

@app.route('/act/<int:act_num>')
def act_page(act_num):
    """Renders the page for a specific act, showing its chapters."""
    if act_num not in ACTS_CONFIG:
        abort(404)
    
    act_title = ACTS_CONFIG[act_num]
    chapters = get_chapters_for_act(act_num)
    return render_template('act.html', act_num=act_num, act_title=act_title, chapters=chapters)

@app.route('/act/<int:act_num>/chapter/<int:chapter_num>')
def chapter_page(chapter_num, act_num):
    """Renders the page for a specific chapter, showing the days."""
    if act_num not in ACTS_CONFIG:
        abort(404)
    
    # For now, we'll hardcode the days. You could make this dynamic later.
    days_of_week = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    act_title = ACTS_CONFIG[act_num]
    return render_template('chapter.html', act_num=act_num, chapter_num=chapter_num, act_title=act_title, days=days_of_week)

@app.route('/act/<int:act_num>/chapter/<int:chapter_num>/<day_name>')
def day_page(act_num, chapter_num, day_name):
    """Renders the flowchart for a specific day."""
    if act_num not in ACTS_CONFIG:
        abort(404)

    day_data = get_story_data(act_num, chapter_num, day_name)
    if not day_data:
        # You can create a nice "No story written yet" page if you want
        abort(404)
        
    act_title = ACTS_CONFIG[act_num]
    
    return render_template('day.html',
                           act_num=act_num,
                           chapter_num=chapter_num,
                           day_name=day_name.capitalize(),
                           act_title=act_title,
                           day_data=day_data)

if __name__ == '__main__':
    print("Visual Novel Creator is running!")
    print("Open your browser and go to: http://127.0.0.1:5000")
    app.run(debug=True)
