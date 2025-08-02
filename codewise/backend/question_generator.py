# question_generator.py
from langchain import OpenAI, PromptTemplate
from typing import List, Dict
import json

class QuestionGenerator:
    def __init__(self):
        self.llm = OpenAI(temperature=0.7)
        self.question_templates = self.load_templates()
    
    async def generate(self, code: str, analysis: Dict) -> List[Dict]:
        questions = []
        
        # Concept-based questions
        for concept in analysis['concepts']:
            concept_questions = await self.generate_concept_questions(
                code, 
                concept, 
                analysis['complexity']
            )
            questions.extend(concept_questions)
        
        # Code quality questions
        quality_questions = await self.generate_quality_questions(
            code, 
            analysis['quality_metrics']
        )
        questions.extend(quality_questions)
        
        # Apply difficulty scaling
        questions = self.scale_difficulty(questions, analysis['complexity'])
        
        # Ensure variety
        questions = self.ensure_question_variety(questions)
        
        return questions[:5]  # Limit to 5 questions
    
    async def generate_concept_questions(
        self, 
        code: str, 
        concept: str, 
        complexity: Dict
    ) -> List[Dict]:
        template = PromptTemplate(
            input_variables=["code", "concept", "complexity"],
            template="""
            Generate educational questions about the {concept} concept in this code:
            
            Code:
            {code}
            
            Complexity: {complexity}
            
            Generate 2 multiple choice questions that test understanding of {concept}.
            Each question should have 4 options with only one correct answer.
            Include brief explanations for the correct answers.
            Format as JSON array.
            """
        )
        
        prompt = template.format(
            code=code,
            concept=concept,
            complexity=str(complexity)
        )
        
        response = await self.llm.agenerate([prompt])
        
        try:
            return json.loads(response.generations[0][0].text)
        except:
            return self.get_fallback_questions(concept)
    
    def scale_difficulty(self, questions: List[Dict], complexity: Dict) -> List[Dict]:
        difficulty_level = self.determine_difficulty(complexity)
        
        for question in questions:
            question['difficulty'] = difficulty_level
            
            if difficulty_level == 'beginner':
                question['hint'] = self.generate_hint(question)
            elif difficulty_level == 'advanced':
                question['follow_up'] = self.generate_follow_up(question)
        
        return questions