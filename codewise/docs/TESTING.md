# 🧪 Testing CodeWise Without VS Code

You can test all the core CodeWise logic **without** installing or running VS Code! Here are three different ways to test the functionality:

## 🚀 Method 1: Node.js Command Line Testing

**Simplest and fastest way to test core logic**

### Setup:
```bash
# No installation needed - just run the test file
node run-tests.js
```

### What it tests:
- ✅ Code locking/unlocking logic
- ✅ Quiz generation from code
- ✅ Database operations (in-memory)
- ✅ Integrated workflow simulation
- ✅ Performance benchmarking

### Sample Output:
```
🧠 CodeWise Standalone Test Suite
==================================

🧪 Test 1: Code Locking
----------------------------------------
ℹ️ Code locked with ID: code_a1b2c3
ℹ️ Original length: 68 characters
✅ Code unlocked successfully
ℹ️ Stats: 1 total, 1 locked
✅ Code Locking completed successfully

📊 TEST SUMMARY
=================
⏱️  Duration: 45ms
📋 Tests Run: 5
✅ Tests Passed: 5
📈 Success Rate: 100%

🎉 All tests passed! CodeWise core functionality is working correctly.
```

---

## 🌐 Method 2: Interactive Browser Testing

**Visual testing with interactive UI**

### Setup:
```bash
# Just open the HTML file in any browser
open browser-test.html
# or double-click the file
```

### What you can test:
- 🔒 **Visual code locking** with blur effects
- 🧠 **Interactive quizzes** with real UI
- 📊 **Live statistics** and progress tracking
- ⚡ **Performance monitoring** in real-time
- 🎯 **All features** with buttons and forms

### Features:
- **Real-time output console** showing test results
- **Interactive code input** - paste your own code to test
- **Visual locked code display** with unlock buttons
- **Quiz interface** with multiple choice questions
- **Statistics dashboard** showing test progress
- **Performance benchmarks** with timing data

---

## 📝 Method 3: Manual Code Testing

**Test individual components programmatically**

### Setup:
```javascript
// Copy this code and run in Node.js or browser console

// Test Code Locking
const codeLocker = new CodeLocker();
const locked = codeLocker.lockCode('console.log("test");', 'medium');
console.log('Locked:', locked);
const unlocked = codeLocker.unlockCode(locked.id);
console.log('Unlocked:', unlocked);

// Test Quiz Generation
const quizManager = new QuizManager();
const questions = quizManager.generateQuestionsFromCode(`
function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
`);
console.log('Generated questions:', questions);

// Test Database
const db = new DatabaseManager();
db.saveQuizResult({
    codeHash: 'test123',
    score: 0.85,
    questionsCount: 4,
    correctAnswers: 3
});
console.log('Database stats:', db.getStats());
```

---

## 🎯 What Each Test Validates

### Code Locking System
- ✅ **Generates unique IDs** for each locked code snippet
- ✅ **Stores and retrieves** code correctly
- ✅ **Blurs code visually** while preserving structure
- ✅ **Handles different difficulty levels** (easy/medium/hard)
- ✅ **Tracks statistics** (total locked, etc.)

### Quiz System
- ✅ **Analyzes code content** to detect programming concepts
- ✅ **Generates relevant questions** based on code patterns
- ✅ **Creates multiple choice options** with correct answers
- ✅ **Calculates scores** and determines pass/fail (70% threshold)
- ✅ **Provides explanations** for educational value

### Database Operations
- ✅ **Saves quiz results** with timestamps and metadata
- ✅ **Tracks user progress** across different concepts
- ✅ **Calculates statistics** (average scores, pass rates)
- ✅ **Handles data persistence** (in-memory for testing)
- ✅ **Manages multiple data types** (results, progress, stats)

### Context Extraction
- ✅ **Extracts file information** (language, name, content)
- ✅ **Identifies cursor position** and selected text
- ✅ **Analyzes code structure** and surrounding context
- ✅ **Provides metadata** for intelligent processing

### Integrated Workflow
- ✅ **Combines all components** into complete learning flow
- ✅ **Handles success/failure paths** appropriately
- ✅ **Manages state transitions** (quiz → unlock/lock code)
- ✅ **Provides feedback** and next steps to users

---

## 🔧 Advanced Testing Options

### Custom Code Testing
```javascript
// Test with your own code examples
const myCode = `
class Calculator {
    constructor() {
        this.result = 0;
    }
    
    add(value) {
        this.result += value;
        return this;
    }
    
    getResult() {
        return this.result;
    }
}
`;

// Run through complete workflow
const testWorkflow = async (code) => {
    console.log('🔄 Testing complete workflow...');
    
    // 1. Lock the code
    const locked = codeLocker.lockCode(code, 'medium');
    console.log('✅ Code locked:', locked.id);
    
    // 2. Generate quiz
    const questions = quizManager.generateQuestionsFromCode(code);
    console.log('✅ Questions generated:', questions.length);
    
    // 3. Simulate quiz taking
    const quizResult = await quizManager.simulateQuiz(questions);
    console.log('✅ Quiz completed:', quizResult);
    
    // 4. Save results
    await db.saveQuizResult({
        codeHash: locked.id,
        score: quizResult.score,
        questionsCount: questions.length,
        correctAnswers: quizResult.correct
    });
    
    // 5. Unlock if passed
    if (quizResult.passed) {
        const unlocked = codeLocker.unlockCode(locked.id);
        console.log('✅ Code unlocked:', unlocked.success);
    } else {
        console.log('🔒 Code remains locked - retake quiz');
    }
};

testWorkflow(myCode);
```

### Performance Testing
```javascript
// Benchmark all operations
const runBenchmarks = () => {
    const iterations = 1000;
    const testCode = 'function test() { return 42; }';
    
    console.time('Code Locking');
    for (let i = 0; i < iterations; i++) {
        codeLocker.lockCode(testCode, 'easy');
    }
    console.timeEnd('Code Locking');
    
    console.time('Quiz Generation');
    for (let i = 0; i < iterations; i++) {
        quizManager.generateQuestionsFromCode(testCode);
    }
    console.timeEnd('Quiz Generation');
    
    console.log(`✅ Benchmarked ${iterations} operations each`);
};

runBenchmarks();
```

### Edge Case Testing
```javascript
// Test edge cases
const edgeCases = [
    '', // Empty code
    'console.log("hello");', // Simple one-liner
    'a'.repeat(10000), // Very long code
    '// Just a comment', // Comment only
    'function(){return function(){return 42;};}', // Nested functions
];

edgeCases.forEach((code, i) => {
    console.log(`Testing edge case ${i + 1}:`);
    try {
        const locked = codeLocker.lockCode(code, 'easy');
        const questions = quizManager.generateQuestionsFromCode(code);
        console.log(`  ✅ Handled successfully: ${questions.length} questions`);
    } catch (error) {
        console.log(`  ❌ Failed: ${error.message}`);
    }
});
```

---

## 📊 Expected Test Results

When everything is working correctly, you should see:

### ✅ **All Basic Tests Pass**
- Code locking and unlocking works
- Quiz generation produces relevant questions
- Database operations save and retrieve data
- Performance is acceptable (usually < 5ms per operation)

### ✅ **Integration Works**
- Components work together seamlessly
- State transitions happen correctly
- Error handling is robust

### ✅ **Performance is Good**
- Code locking: ~1-3ms per operation
- Quiz generation: ~2-5ms per operation  
- Database operations: ~1-2ms per operation
- Memory usage stays reasonable

---

## 🐛 Troubleshooting

### Common Issues:

**"ReferenceError: CodeLocker is not defined"**
- Make sure you're running the correct test file
- Check that all class definitions are loaded

**"No questions generated"**
- Normal for very simple code (like empty strings)
- Try code with functions, loops, or conditionals

**"Performance seems slow"**
- Expected for first run (JavaScript engine warmup)
- Run benchmarks multiple times for accurate results

**"Tests fail in browser but work in Node.js"**
- Some features may be browser-specific
- Check browser console for detailed error messages

---

## 🎉 What This Proves

By running these tests successfully, you've verified that:

1. **✅ Core Logic is Sound** - All the fundamental algorithms work correctly
2. **✅ Architecture is Solid** - Components integrate well together  
3. **✅ Performance is Acceptable** - Code runs efficiently
4. **✅ Error Handling Works** - Edge cases are handled gracefully
5. **✅ Ready for VS Code** - The logic is ready to be integrated into the VS Code extension

**You can be confident that the VS Code extension will work correctly because all the core functionality has been thoroughly tested!**

---

## 🚀 Next Steps

After testing, you can:

1. **Run the VS Code extension** with confidence
2. **Extend functionality** by adding new features
3. **Optimize performance** based on benchmark results
4. **Add more test cases** for specific scenarios
5. **Deploy to production** knowing the core logic is solid

Happy testing! 🧪✨