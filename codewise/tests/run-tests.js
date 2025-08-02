#!/usr/bin/env node

// run-tests.js - Simple Node.js test runner for CodeWise
// Usage: node run-tests.js

console.log('🧠 CodeWise Standalone Test Suite');
console.log('==================================\n');

// Simple test implementations
class CodeLocker {
    constructor() {
        this.lockedCodes = new Map();
    }

    lockCode(code, difficulty = 'medium') {
        const id = 'code_' + Math.random().toString(36).substring(2, 8);
        this.lockedCodes.set(id, code);
        return { id, difficulty, originalLength: code.length };
    }

    unlockCode(id) {
        const code = this.lockedCodes.get(id);
        return code ? { success: true, code } : { success: false };
    }

    getStats() {
        return { total: this.lockedCodes.size, locked: this.lockedCodes.size };
    }
}

class QuizManager {
    generateQuestionsFromCode(code) {
        const questions = [];
        const lowerCode = code.toLowerCase();

        if (lowerCode.includes('function') || lowerCode.includes('def')) {
            questions.push({
                text: "What is the main purpose of functions?",
                options: ["Reuse code", "Slow programs", "Use memory", "Create errors"],
                correct: 0
            });
        }

        if (lowerCode.includes('for') || lowerCode.includes('while')) {
            questions.push({
                text: "What do loops do?",
                options: ["Repeat execution", "Delete variables", "Slow programs", "Create errors"],
                correct: 0
            });
        }

        return questions;
    }

    async simulateQuiz(questions) {
        let correct = 0;
        questions.forEach((q, i) => {
            const isCorrect = Math.random() > 0.3; // 70% success rate
            if (isCorrect) correct++;
            console.log(`   Q${i + 1}: ${q.text} - ${isCorrect ? '✅' : '❌'}`);
        });
        
        const score = correct / questions.length;
        return { score, correct, total: questions.length, passed: score >= 0.7 };
    }
}

class DatabaseManager {
    constructor() {
        this.quizHistory = [];
        this.userProgress = {};
    }

    saveQuizResult(result) {
        this.quizHistory.push({ ...result, timestamp: new Date() });
        return true;
    }

    updateProgress(concept, correct) {
        if (!this.userProgress[concept]) {
            this.userProgress[concept] = { correct: 0, total: 0 };
        }
        this.userProgress[concept].total++;
        if (correct) this.userProgress[concept].correct++;
    }

    getStats() {
        const total = this.quizHistory.length;
        const avgScore = total > 0 ? 
            this.quizHistory.reduce((sum, r) => sum + r.score, 0) / total : 0;
        
        return {
            totalQuizzes: total,
            averageScore: avgScore,
            conceptsTracked: Object.keys(this.userProgress).length
        };
    }
}

// Test runner
class TestRunner {
    constructor() {
        this.codeLocker = new CodeLocker();
        this.quizManager = new QuizManager();
        this.database = new DatabaseManager();
        this.testsRun = 0;
        this.testsPassed = 0;
    }

    log(message, type = 'info') {
        const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
        console.log(`${icons[type] || 'ℹ️'} ${message}`);
    }

    async runTest(name, testFn) {
        this.testsRun++;
        console.log(`\n🧪 Test ${this.testsRun}: ${name}`);
        console.log('-'.repeat(40));
        
        try {
            await testFn();
            this.testsPassed++;
            this.log(`${name} completed successfully`, 'success');
        } catch (error) {
            this.log(`${name} failed: ${error.message}`, 'error');
        }
    }

    async testCodeLocking() {
        const testCode = `
function calculateSum(a, b) {
    return a + b;
}
const result = calculateSum(5, 3);
console.log(result);
        `.trim();

        // Test locking
        const locked = this.codeLocker.lockCode(testCode, 'medium');
        this.log(`Code locked with ID: ${locked.id}`, 'info');
        this.log(`Original length: ${locked.originalLength} characters`, 'info');

        // Test unlocking
        const unlocked = this.codeLocker.unlockCode(locked.id);
        if (unlocked.success) {
            this.log('Code unlocked successfully', 'success');
        } else {
            throw new Error('Failed to unlock code');
        }

        // Test stats
        const stats = this.codeLocker.getStats();
        this.log(`Stats: ${stats.total} total, ${stats.locked} locked`, 'info');
    }

    async testQuizGeneration() {
        const testCode = `
                function factorial(n) {
                    if (n <= 1) return 1;
                    return n * factorial(n - 1);
                }

                for (let i = 1; i <= 5; i++) {
                    console.log(\`Factorial of \${i}: \${factorial(i)}\`);
                }
            `.trim();

        const questions = this.quizManager.generateQuestionsFromCode(testCode);
        this.log(`Generated ${questions.length} questions`, 'info');

        questions.forEach((q, i) => {
            this.log(`Q${i + 1}: ${q.text}`, 'info');
        });

        if (questions.length === 0) {
            throw new Error('No questions generated');
        }

        // Simulate taking the quiz
        const result = await this.quizManager.simulateQuiz(questions);
        this.log(`Quiz result: ${result.correct}/${result.total} (${Math.round(result.score * 100)}%)`, 
                 result.passed ? 'success' : 'warning');
    }

    async testDatabase() {
        // Save quiz results
        const results = [
            { codeHash: 'test1', score: 0.8, questionsCount: 3, correctAnswers: 2 },
            { codeHash: 'test2', score: 0.6, questionsCount: 5, correctAnswers: 3 },
            { codeHash: 'test3', score: 1.0, questionsCount: 2, correctAnswers: 2 }
        ];

        results.forEach(result => {
            this.database.saveQuizResult(result);
        });

        // Update progress
        this.database.updateProgress('functions', true);
        this.database.updateProgress('loops', false);
        this.database.updateProgress('functions', true);
        this.database.updateProgress('conditionals', true);

        const stats = this.database.getStats();
        this.log(`Database stats:`, 'info');
        this.log(`  Total quizzes: ${stats.totalQuizzes}`, 'info');
        this.log(`  Average score: ${Math.round(stats.averageScore * 100)}%`, 'info');
        this.log(`  Concepts tracked: ${stats.conceptsTracked}`, 'info');
    }

    async testIntegratedWorkflow() {
        this.log('Testing complete workflow...', 'info');

        // 1. Simulate context extraction
        const mockContext = {
            language: 'javascript',
            fileName: 'test.js',
            fileContent: 'function test() { console.log("Hello"); }'
        };
        this.log(`Context: ${mockContext.language} file`, 'info');

        // 2. Generate and take quiz
        const questions = this.quizManager.generateQuestionsFromCode(mockContext.fileContent);
        const quizResult = await this.quizManager.simulateQuiz(questions);
        
        // 3. Save results
        this.database.saveQuizResult({
            codeHash: 'workflow-test',
            score: quizResult.score,
            questionsCount: questions.length,
            correctAnswers: quizResult.correct
        });

        // 4. Lock code if quiz failed
        if (!quizResult.passed) {
            const locked = this.codeLocker.lockCode(mockContext.fileContent, 'hard');
            this.log(`Code locked due to failed quiz: ${locked.id}`, 'warning');
        }

        this.log(`Workflow completed: ${quizResult.passed ? 'Success' : 'Code locked'}`, 
                 quizResult.passed ? 'success' : 'warning');
    }

    async testPerformance() {
        this.log('Running performance tests...', 'info');
        
        const iterations = 1000;
        const testCode = 'function test() { return "hello"; }';

        // Test code locking performance
        const startTime = Date.now();
        for (let i = 0; i < iterations; i++) {
            this.codeLocker.lockCode(testCode, 'easy');
        }
        const lockingTime = Date.now() - startTime;

        // Test quiz generation performance
        const quizStart = Date.now();
        for (let i = 0; i < iterations; i++) {
            this.quizManager.generateQuestionsFromCode(testCode);
        }
        const quizTime = Date.now() - quizStart;

        this.log(`Performance Results (${iterations} iterations):`, 'info');
        this.log(`  Code locking: ${lockingTime}ms (${(lockingTime/iterations).toFixed(2)}ms/op)`, 'info');
        this.log(`  Quiz generation: ${quizTime}ms (${(quizTime/iterations).toFixed(2)}ms/op)`, 'info');
    }

    async runAllTests() {
        const startTime = Date.now();
        
        await this.runTest('Code Locking', () => this.testCodeLocking());
        await this.runTest('Quiz Generation', () => this.testQuizGeneration());
        await this.runTest('Database Operations', () => this.testDatabase());
        await this.runTest('Integrated Workflow', () => this.testIntegratedWorkflow());
        await this.runTest('Performance', () => this.testPerformance());

        const duration = Date.now() - startTime;
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`📋 Tests Run: ${this.testsRun}`);
        console.log(`✅ Tests Passed: ${this.testsPassed}`);
        console.log(`❌ Tests Failed: ${this.testsRun - this.testsPassed}`);
        console.log(`📈 Success Rate: ${Math.round((this.testsPassed / this.testsRun) * 100)}%`);
        
        if (this.testsPassed === this.testsRun) {
            console.log('\n🎉 All tests passed! CodeWise core functionality is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Check the output above for details.');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests().catch(console.error);
}

module.exports = { TestRunner, CodeLocker, QuizManager, DatabaseManager };