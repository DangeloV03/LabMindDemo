"""
Gemini API service for LabMind AI Agent
"""
import os
import google.generativeai as genai
from typing import List, Dict, Any, Optional
import json

# Configure Gemini API
gemini_api_key = os.getenv("GEMINI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)


class GeminiService:
    """Service for interacting with Google Gemini API"""

    def __init__(self):
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        self.model = genai.GenerativeModel('gemini-pro')

    def analyze_research_goal(self, quiz_responses: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Analyze quiz responses and generate a step-by-step research plan
        
        Returns a list of steps with:
        - step_number: int
        - title: str
        - description: str
        - code: str (Python code snippet)
        - dependencies: List[str] (step numbers this depends on)
        """
        prompt = self._build_analysis_prompt(quiz_responses)
        
        try:
            response = self.model.generate_content(prompt)
            steps = self._parse_steps_response(response.text)
            return steps
        except Exception as e:
            raise Exception(f"Error generating research plan: {str(e)}")

    def generate_code_for_step(
        self,
        step: Dict[str, Any],
        context: Dict[str, Any],
        previous_code: Optional[str] = None
    ) -> str:
        """Generate Python code for a specific step"""
        prompt = self._build_code_generation_prompt(step, context, previous_code)
        
        try:
            response = self.model.generate_content(prompt)
            return self._extract_code_from_response(response.text)
        except Exception as e:
            raise Exception(f"Error generating code: {str(e)}")

    def chat_with_agent(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        current_steps: List[Dict[str, Any]]
    ) -> str:
        """Chat with the agent for refinement and questions"""
        prompt = self._build_chat_prompt(message, conversation_history, current_steps)
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            raise Exception(f"Error in agent chat: {str(e)}")

    def _build_analysis_prompt(self, quiz_responses: Dict[str, Any]) -> str:
        """Build prompt for analyzing research goals"""
        field = quiz_responses.get('field', 'General')
        question = quiz_responses.get('question', '')
        data_type = quiz_responses.get('dataType', '')
        data_format = quiz_responses.get('dataFormat', '')
        outcomes = quiz_responses.get('outcomes', '')
        constraints = quiz_responses.get('constraints', '')

        prompt = f"""You are an AI research assistant helping a {field} researcher with data analysis.

Research Question: {question}
Data Type: {data_type}
Data Format: {data_format}
Expected Outcomes: {outcomes if outcomes else 'Not specified'}
Constraints: {constraints if constraints else 'None'}

Generate a step-by-step research plan as a JSON array. Each step should have:
- step_number: integer starting from 1
- title: brief descriptive title
- description: detailed description of what this step accomplishes
- code: Python code snippet (pandas, numpy, matplotlib, scipy) for this step
- dependencies: array of step numbers this step depends on (can be empty)

Focus on:
1. Data loading and preprocessing
2. Exploratory data analysis
3. Statistical analysis/modeling
4. Visualization
5. Results interpretation

Return ONLY a valid JSON array, no markdown, no explanations. Example format:
[
  {{
    "step_number": 1,
    "title": "Load and inspect data",
    "description": "Load the dataset and examine its structure",
    "code": "import pandas as pd\\ndf = pd.read_csv('data.csv')\\nprint(df.head())\\nprint(df.info())",
    "dependencies": []
  }}
]
"""
        return prompt

    def _build_code_generation_prompt(
        self,
        step: Dict[str, Any],
        context: Dict[str, Any],
        previous_code: Optional[str]
    ) -> str:
        """Build prompt for generating code for a specific step"""
        prompt = f"""Generate Python code for this research step:

Step: {step.get('title', '')}
Description: {step.get('description', '')}

Research Context:
- Field: {context.get('field', 'General')}
- Data Format: {context.get('dataFormat', 'Unknown')}
- Expected Outcomes: {context.get('outcomes', '')}

"""
        if previous_code:
            prompt += f"\nPrevious code that has been executed:\n```python\n{previous_code}\n```\n"

        prompt += """
Generate complete, executable Python code using pandas, numpy, matplotlib, and scipy.
Include all necessary imports. The code should be well-commented.

Return ONLY the Python code, no markdown formatting, no explanations.
"""
        return prompt

    def _build_chat_prompt(
        self,
        message: str,
        conversation_history: List[Dict[str, str]],
        current_steps: List[Dict[str, Any]]
    ) -> str:
        """Build prompt for agent chat"""
        steps_summary = "\n".join([
            f"{i+1}. {step.get('title', 'Unknown')}: {step.get('description', '')}"
            for i, step in enumerate(current_steps)
        ])

        history_context = ""
        if conversation_history:
            history_context = "\nPrevious conversation:\n"
            for msg in conversation_history[-5:]:  # Last 5 messages
                history_context += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"

        prompt = f"""You are an AI research assistant. The user is working through a research plan with the following steps:

{steps_summary}

{history_context}

User's question: {message}

Provide a helpful, concise response. If the user wants to modify the plan, suggest specific changes to the steps.
"""
        return prompt

    def _parse_steps_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse the JSON response from Gemini into a list of steps"""
        try:
            # Try to extract JSON from markdown code blocks if present
            if '```json' in response_text:
                json_start = response_text.find('```json') + 7
                json_end = response_text.find('```', json_start)
                response_text = response_text[json_start:json_end].strip()
            elif '```' in response_text:
                json_start = response_text.find('```') + 3
                json_end = response_text.find('```', json_start)
                response_text = response_text[json_start:json_end].strip()

            steps = json.loads(response_text)
            if not isinstance(steps, list):
                raise ValueError("Response is not a list")
            return steps
        except json.JSONDecodeError as e:
            # Fallback: try to create steps from structured text
            return self._parse_steps_fallback(response_text)

    def _parse_steps_fallback(self, text: str) -> List[Dict[str, Any]]:
        """Fallback parser if JSON parsing fails"""
        # Simple fallback - create basic steps
        steps = []
        lines = text.split('\n')
        current_step = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Look for step indicators
            if line.startswith('Step') or line[0].isdigit():
                if current_step:
                    steps.append(current_step)
                current_step = {
                    'step_number': len(steps) + 1,
                    'title': line,
                    'description': '',
                    'code': '',
                    'dependencies': []
                }
            elif current_step:
                if not current_step['description']:
                    current_step['description'] = line
                elif 'code' in line.lower() or '```' in line:
                    # Skip code blocks in fallback
                    continue
        
        if current_step:
            steps.append(current_step)
        
        return steps if steps else [
            {
                'step_number': 1,
                'title': 'Load and analyze data',
                'description': 'Perform initial data analysis',
                'code': 'import pandas as pd\nimport numpy as np\n# Load your data here',
                'dependencies': []
            }
        ]

    def _extract_code_from_response(self, response_text: str) -> str:
        """Extract Python code from response"""
        # Try to extract from code blocks
        if '```python' in response_text:
            code_start = response_text.find('```python') + 9
            code_end = response_text.find('```', code_start)
            return response_text[code_start:code_end].strip()
        elif '```' in response_text:
            code_start = response_text.find('```') + 3
            code_end = response_text.find('```', code_start)
            return response_text[code_start:code_end].strip()
        else:
            return response_text.strip()
