# sublime_codewise.py
import sublime
import sublime_plugin
import urllib.request
import json
import threading

class CodeWiseCommand(sublime_plugin.TextCommand):
    def __init__(self, view):
        super().__init__(view)
        self.api_url = "http://localhost:8000/api"
    
    def run(self, edit):
        # Get selected text or show input panel
        selection = self.view.substr(self.view.sel()[0])
        if selection:
            self.generate_code(selection)
        else:
            self.view.window().show_input_panel(
                "Enter your code request:",
                "",
                self.generate_code,
                None,
                None
            )
    
    def generate_code(self, prompt):
        def request_thread():
            try:
                context = self.get_editor_context()
                
                data = {
                    "prompt": prompt,
                    "language": context["language"],
                    "context": context
                }
                
                req = urllib.request.Request(
                    f"{self.api_url}/generate-code",
                    data=json.dumps(data).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                
                with urllib.request.urlopen(req) as response:
                    result = json.loads(response.read().decode('utf-8'))
                
                # Show quiz in a new view
                sublime.set_timeout(
                    lambda: self.show_quiz(result),
                    0
                )
                
            except Exception as e:
                sublime.error_message(f"CodeWise Error: {str(e)}")
        
        threading.Thread(target=request_thread).start()
    
    def show_quiz(self, result):
        # Create new view for quiz
        quiz_view = self.view.window().new_file()
        quiz_view.set_name("CodeWise Quiz")
        quiz_view.set_scratch(True)
        
        # Format quiz content
        quiz_content = self.format_quiz(result["questions"])
        quiz_view.run_command("append", {"characters": quiz_content})
        
        # Store session data
        quiz_view.settings().set("codewise_session", result["session_id"])
        quiz_view.settings().set("codewise_code", result["locked_code"])
    
    def get_editor_context(self):
        return {
            "language": self.view.settings().get("syntax").split("/")[-1].replace(".sublime-syntax", ""),
            "file_name": self.view.file_name() or "untitled",
            "project_path": self.view.window().folders()[0] if self.view.window().folders() else None
        }

class CodeWiseQuizCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        # Handle quiz submission
        session_id = self.view.settings().get("codewise_session")
        if not session_id:
            return
        
        # Parse answers from view content
        answers = self.parse_answers()
        
        # Submit to API
        self.submit_quiz(session_id, answers)
    
    def submit_quiz(self, session_id, answers):
        def request_thread():
            try:
                data = {
                    "session_id": session_id,
                    "answers": answers
                }
                
                req = urllib.request.Request(
                    f"{self.api_url}/submit-quiz",
                    data=json.dumps(data).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                
                with urllib.request.urlopen(req) as response:
                    result = json.loads(response.read().decode('utf-8'))
                
                sublime.set_timeout(
                    lambda: self.handle_quiz_result(result),
                    0
                )
                
            except Exception as e:
                sublime.error_message(f"Quiz submission failed: {str(e)}")
        
        threading.Thread(target=request_thread).start()