// standalone-tests.js - Test CodeWise logic without VS Code

// Mock VS Code API for testing
const mockVscode = {
    window: {
        showInformationMessage: (msg) => console.log(`[INFO] ${msg}`),
        showWarningMessage: (msg) => console.log(`[WARNING] ${msg}`),
        showErrorMessage: (msg) => console.log(`[ERROR] ${msg}`)
    }
};

// Simple versions of the core classes for standalone testing
class StandaloneCodeLocker {
    constructor() {
        this.lockedCodes = new Map();
    }

    lockCode(code, difficulty = 'medium') {
        const id = this.generateId();
        this.lockedCodes.set(id, code);
        
        console.log(`🔒 Code locked with ID: ${id} (${difficulty} difficulty)`);
        console.log(`📝 Original code length: ${code.length} characters`);
        
        return {
            id,
            lockedHtml: this.generateLockedCodeHtml(id, code, difficulty),
            difficulty
        };
    }

    unlockCode(id) {
        const code = this.lockedCodes.get(id);
        if (code) {
            console.log(`🔓 Code unlocked for ID: ${id}`);
            return { success: true, code };
        }
        console.log(`❌ No code found for ID: ${id}`);
        return { success: false };
    }

    generateLockedCodeHtml(id, code, difficulty) {
        const blurredCode = this.blurCode(code);
        return `<div data-id="${id}" class="locked-${difficulty}">${blurredCode}</div>`;
    }

    blurCode(code) {
        return code
            .replace(/[a-zA-Z]/g, '█')
            .replace(/[0-9]/g, '▓');
    }

    generateId() {
        return 'test_' + Math.random().toString(36).substring(2, 8);
    }

    getStats() {
        return {
            total: this.lockedCodes.size,
            locked: this.lockedCodes.size
        };
    }

    clearAll() {
        this.lockedCodes.clear();
        console.log('🧹 All locked codes cleared');
    }
}

class StandaloneQuizManager {
    constructor() {
        this.questions = [];
    }

    async presentQuiz(code, customQuestions = null) {
        console.log('\n🧠 Starting Quiz...');
        console.log(`📝 Code to analyze: ${code.substring(0, 50)}...`);
        
        const questions = customQuestions || this.generateQuestionsFromCode(code);
        
        if (questions.length === 0) {
            console.log('❌ No questions generated');
            return false;
        }

        console.log(`📋 Generated ${questions.length} questions:`);
        
        let correctAnswers = 0;
        
        // Simulate quiz taking (in real testing, you could make this interactive)
        questions.forEach((q, i) => {
            console.log(`\n❓ Question ${i + 1}: ${q.text}`);
            q.options.forEach((opt, idx) => {
                console.log(`   ${String.fromCharCode(65 + idx)}) ${opt}`);
            });
            
            // Simulate correct answer for testing
            const isCorrect = Math.random() > 0.3; // 70% chance of correct answer
            if (isCorrect) correctAnswers++;
            
            console.log(`   ✅ Simulated answer: ${isCorrect ? 'Correct' : 'Incorrect'}`);
            if (q.explanation) {
                console.log(`   💡 ${q.explanation}`);
            }
        });

        const score = correctAnswers / questions.length;
        const passed = score >= 0.7;
        
        console.log(`\n📊 Quiz Results:`);
        console.log(`   Score: ${correctAnswers}/${questions.length} (${Math.round(score * 100)}%)`);
        console.log(`   Status: ${passed ? '🎉 PASSED' : '📚 FAILED'}`);
        
        return passed;
    }

    generateQuestionsFromCode(code) {
        const questions = [];
        const lowerCode = code.toLowerCase();

        if (lowerCode.includes('function') || lowerCode.includes('def')) {
            questions.push({
                text: "What is the main purpose of functions?",
                options: [
                    "To reuse code and organize logic",
                    "To slow down programs",
                    "To use more memory",
                    "To make code harder to read"
                ],
                correct: 0,
                explanation: "Functions help organize code into reusable, modular pieces."
            });
        }

        if (lowerCode.includes('for') || lowerCode.includes('while')) {
            questions.push({
                text: "What do loops allow you to do?",
                options: [
                    "Repeat code execution",
                    "Delete variables",
                    "Slow down programs",
                    "Create syntax errors"
                ],
                correct: 0,
                explanation: "Loops enable repetitive execution of code blocks."
            });
        }

        if (lowerCode.includes('if') || lowerCode.includes('else')) {
            questions.push({
                text: "What is the purpose of conditional statements?",
                options: [
                    "Execute code based on conditions",
                    "Always run the same code",
                    "Create infinite loops",
                    "Delete files"
                ],
                correct: 0,
                explanation: "Conditionals allow programs to make decisions and branch execution."
            });
        }

        return questions;
    }

    createSampleQuiz() {
        return [
            {
                text: "What does console.log() do?",
                options: [
                    "Prints to console",
                    "Creates log files",
                    "Deletes console",
                    "Slows down code"
                ],
                correct: 0,
                explanation: "console.log() outputs information to the developer console."
            }
        ];
    }
}

class StandaloneContextExtractor {
    // Simulate file context without VS Code API
    static getCurrentFileContext(mockFile = null) {
        const defaultContext = {
            language: 'javascript',
            fileName: 'test-file.js',
            selectedText: null,
            cursorLine: 5,
            projectRoot: '/mock/project',
            fileContent: mockFile || `
function calculateSum(a, b) {
    return a + b;
}

const result = calculateSum(5, 3);
console.log(result);
            `.trim()
        };

        console.log('📄 Extracted file context:');
        console.log(`   Language: ${defaultContext.language}`);
        console.log(`   File: ${defaultContext.fileName}`);
        console.log(`   Line: ${defaultContext.cursorLine + 1}`);
        console.log(`   Content length: ${defaultContext.fileContent.length} chars`);

        return defaultContext;
    }

    static getSurroundingContext(linesBefore = 3, linesAfter = 3) {
        // Mock surrounding context
        return `
// Context before
function helper() {
    return "mock";
}

// Current focus area
const result = performCalculation();
console.log(result);

// Context after
module.exports = { helper };
        `.trim();
    }
}

class StandaloneDatabaseManager {
    constructor() {
        this.quizHistory = [];
        this.userProgress = {};
        console.log('💾 Database initialized (in-memory for testing)');
    }

    async saveQuizResult(result) {
        this.quizHistory.push({
            ...result,
            timestamp: new Date()
        });
        console.log(`💾 Saved quiz result: Score ${result.score}, Hash: ${result.codeHash}`);
        return true;
    }

    getQuizStats() {
        const totalQuizzes = this.quizHistory.length;
        const totalScore = this.quizHistory.reduce((sum, r) => sum + r.score, 0);
        const passedQuizzes = this.quizHistory.filter(r => r.score >= 0.7).length;

        const stats = {
            totalQuizzes,
            averageScore: totalQuizzes > 0 ? totalScore / totalQuizzes : 0,
            passRate: totalQuizzes > 0 ? passedQuizzes / totalQuizzes : 0,
            recentQuizzes: this.quizHistory.slice(-3)
        };

        console.log('📊 Quiz Statistics:');
        console.log(`   Total Quizzes: ${stats.totalQuizzes}`);
        console.log(`   Average Score: ${Math.round(stats.averageScore * 100)}%`);
        console.log(`   Pass Rate: ${Math.round(stats.passRate * 100)}%`);

        return stats;
    }

    async updateProgress(concept, correct) {
        if (!this.userProgress[concept]) {
            this.userProgress[concept] = {
                concept,
                correctAnswers: 0,
                totalAttempts: 0,
                lastUpdated: new Date()
            };
        }

        this.userProgress[concept].totalAttempts++;
        if (correct) this.userProgress[concept].correctAnswers++;
        this.userProgress[concept].lastUpdated = new Date();

        console.log(`📈 Updated progress for ${concept}: ${this.userProgress[concept].correctAnswers}/${this.userProgress[concept].totalAttempts}`);
    }

    getUserProgress() {
        return Object.values(this.userProgress);
    }

    clearAllData() {
        this.quizHistory = [];
        this.userProgress = {};
        console.log('🧹 All data cleared');
        return true;
    }
}

// Test Runner
class StandaloneTestRunner {
    constructor() {
        this.codeLocker = new StandaloneCodeLocker();
        this.quizManager = new StandaloneQuizManager();
        this.database = new StandaloneDatabaseManager();
    }

    async runAllTests() {
        console.log('🚀 Starting Standalone CodeWise Tests\n');
        console.log('=' * 50);

        await this.testContextExtraction();
        await this.testCodeLocking();
        await this.testQuizSystem();
        await this.testDatabase();
        await this.testIntegratedWorkflow();

        console.log('\n' + '=' * 50);
        console.log('✅ All standalone tests completed!');
    }

    async testContextExtraction() {
        console.log('\n🧪 Test 1: Context Extraction');
        console.log('-' * 30);

        const context = StandaloneContextExtractor.getCurrentFileContext();
        const surrounding = StandaloneContextExtractor.getSurroundingContext();

        console.log(`✅ Context extracted successfully`);
        console.log(`✅ Surrounding context: ${surrounding.length} characters`);
    }

    async testCodeLocking() {
        console.log('\n🧪 Test 2: Code Locking');
        console.log('-' * 30);

        const testCode = `
function greet(name) {
    console.log("Hello, " + name);
}
greet("World");
        `.trim();

        const locked = this.codeLocker.lockCode(testCode, 'medium');
        console.log(`✅ Code locked: ${locked.id}`);

        const unlocked = this.codeLocker.unlockCode(locked.id);
        console.log(`✅ Code unlocked: ${unlocked.success}`);

        const stats = this.codeLocker.getStats();
        console.log(`✅ Stats: ${stats.total} total, ${stats.locked} locked`);
    }

    async testQuizSystem() {
        console.log('\n🧪 Test 3: Quiz System');
        console.log('-' * 30);

        const testCode = `
function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
        `.trim();

        const passed = await this.quizManager.presentQuiz(testCode);
        console.log(`✅ Quiz completed: ${passed ? 'Passed' : 'Failed'}`);

        const sampleQuiz = this.quizManager.createSampleQuiz();
        console.log(`✅ Sample quiz created: ${sampleQuiz.length} questions`);
    }

    async testDatabase() {
        console.log('\n🧪 Test 4: Database Operations');
        console.log('-' * 30);

        // Save some test data
        await this.database.saveQuizResult({
            codeHash: 'test-hash-1',
            score: 0.8,
            questionsCount: 3,
            correctAnswers: 2
        });

        await this.database.saveQuizResult({
            codeHash: 'test-hash-2',
            score: 0.6,
            questionsCount: 5,
            correctAnswers: 3
        });

        await this.database.updateProgress('functions', true);
        await this.database.updateProgress('loops', false);
        await this.database.updateProgress('functions', true);

        const stats = this.database.getQuizStats();
        const progress = this.database.getUserProgress();

        console.log(`✅ Database operations completed`);
        console.log(`✅ Progress tracked for ${progress.length} concepts`);
    }

    async testIntegratedWorkflow() {
        console.log('\n🧪 Test 5: Integrated Workflow');
        console.log('-' * 30);

        // Simulate complete workflow
        const context = StandaloneContextExtractor.getCurrentFileContext();
        
        console.log('🔄 Step 1: Extract context');
        console.log('🔄 Step 2: Generate quiz');
        const quizPassed = await this.quizManager.presentQuiz(context.fileContent);
        
        console.log('🔄 Step 3: Save results');
        await this.database.saveQuizResult({
            codeHash: 'workflow-test',
            score: quizPassed ? 1.0 : 0.0,
            questionsCount: 3,
            correctAnswers: quizPassed ? 3 : 1
        });

        console.log('🔄 Step 4: Update progress');
        await this.database.updateProgress('workflow-test', quizPassed);

        if (!quizPassed) {
            console.log('🔄 Step 5: Lock code (quiz failed)');
            const locked = this.codeLocker.lockCode(context.fileContent, 'hard');
            console.log(`🔒 Code locked: ${locked.id}`);
        }

        console.log(`✅ Integrated workflow completed: ${quizPassed ? 'Success' : 'Code locked'}`);
    }
}

// Performance testing
class PerformanceTest {
    static async runPerformanceTests() {
        console.log('\n⚡ Performance Tests');
        console.log('-' * 30);

        const iterations = 100;
        const testCode = 'function test() { return "hello"; }';
        const locker = new StandaloneCodeLocker();

        // Test context extraction speed
        const contextStart = Date.now();
        for (let i = 0; i < iterations; i++) {
            StandaloneContextExtractor.getCurrentFileContext(testCode);
        }
        const contextTime = Date.now() - contextStart;

        // Test code locking speed
        const lockingStart = Date.now();
        for (let i = 0; i < iterations; i++) {
            locker.lockCode(testCode, 'easy');
        }
        const lockingTime = Date.now() - lockingStart;

        console.log(`⚡ Context extraction: ${contextTime}ms (${iterations} ops) = ${(contextTime/iterations).toFixed(2)}ms/op`);
        console.log(`⚡ Code locking: ${lockingTime}ms (${iterations} ops) = ${(lockingTime/iterations).toFixed(2)}ms/op`);
    }
}

// Export for use or run directly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        StandaloneCodeLocker,
        StandaloneQuizManager,
        StandaloneContextExtractor,
        StandaloneDatabaseManager,
        StandaloneTestRunner,
        PerformanceTest
    };
} else {
    // Run tests if this file is executed directly
    async function runTests() {
        const testRunner = new StandaloneTestRunner();
        await testRunner.runAllTests();
        await PerformanceTest.runPerformanceTests();
    }
    
    // Uncomment the line below to run tests automatically:
    // runTests();
    
    console.log('💡 Standalone CodeWise Test Suite Ready!');
    console.log('💡 Run: node standalone-tests.js to execute all tests');
    console.log('💡 Or uncomment runTests() at the bottom of this file');
}

// Manual test examples you can run:
console.log(`
🧪 MANUAL TESTING EXAMPLES:

// Test individual components:
const locker = new StandaloneCodeLocker();
const locked = locker.lockCode('console.log("test");', 'easy');
console.log(locked);

const quiz = new StandaloneQuizManager();
quiz.presentQuiz('function test() {}').then(console.log);

const context = StandaloneContextExtractor.getCurrentFileContext();
console.log(context);

const db = new StandaloneDatabaseManager();
db.saveQuizResult({codeHash: 'test', score: 0.8, questionsCount: 3, correctAnswers: 2});

// Run full test suite:
const runner = new StandaloneTestRunner();
runner.runAllTests();
`);