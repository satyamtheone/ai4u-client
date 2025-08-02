# code_analyzer.py
import ast
import re
from typing import Dict, List, Any
from tree_sitter import Language, Parser

class CodeAnalyzer:
    def __init__(self):
        self.parsers = {
            'python': self.setup_python_parser(),
            'javascript': self.setup_js_parser(),
            'java': self.setup_java_parser()
        }
    
    def analyze(self, code: str, language: str) -> Dict[str, Any]:
        parser = self.parsers.get(language)
        if not parser:
            return self.fallback_analysis(code)
        
        tree = parser.parse(bytes(code, 'utf8'))
        
        return {
            'complexity': self.calculate_complexity(tree, language),
            'concepts': self.extract_concepts(tree, language),
            'patterns': self.identify_patterns(tree, language),
            'quality_metrics': self.assess_quality(tree, code, language),
            'learning_objectives': self.generate_learning_objectives(tree, language)
        }
    
    def calculate_complexity(self, tree, language: str) -> Dict:
        # Cyclomatic complexity
        complexity = 1
        decision_points = ['if_statement', 'while_statement', 'for_statement', 'case']
        
        def walk_tree(node):
            nonlocal complexity
            if node.type in decision_points:
                complexity += 1
            for child in node.children:
                walk_tree(child)
        
        walk_tree(tree.root_node)
        
        return {
            'cyclomatic': complexity,
            'lines_of_code': len(tree.text.decode().split('\n')),
            'cognitive_load': self.calculate_cognitive_load(tree)
        }
    
    def extract_concepts(self, tree, language: str) -> List[str]:
        concepts = set()
        
        def extract_from_node(node):
            concept_map = {
                'function_definition': 'functions',
                'class_definition': 'classes',
                'for_statement': 'iteration',
                'while_statement': 'iteration',
                'if_statement': 'conditionals',
                'try_statement': 'error_handling',
                'import_statement': 'modules',
                'list_comprehension': 'list_comprehensions',
                'lambda': 'lambda_functions',
                'async_function_definition': 'async_programming'
            }
            
            if node.type in concept_map:
                concepts.add(concept_map[node.type])
            
            for child in node.children:
                extract_from_node(child)
        
        extract_from_node(tree.root_node)
        return list(concepts)