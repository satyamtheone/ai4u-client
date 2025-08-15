export class QuizJavaScriptManager {
    
    public static getQuizVariables(): string {
        return `
                // Quiz variables for multiple questions
                let currentQuestionIndex = 0;
                let quizQuestions = [];
                let selectedAnswers = {}; // {questionId: selectedIndex}
                let learningGatesEnabled = true;
                let userStats = {
                    level: 1,
                    streak: 0,
                    accuracy: 0,
                    unlockedResponses: 0
                };
                
                // Legacy variables for backward compatibility
                let selectedAnswerIndex = -1;
                let currentQuestionId = null;
        `;
    }

    public static getQuizFunctions(): string {
        return `
                // FIXED: Multi-question functions with proper event handling
                function selectAnswerBatch(questionId, answerIndex) {
                    console.log('🎯 Answer selected for question:', questionId, 'answer:', answerIndex);
                    selectedAnswers[questionId] = answerIndex;
                    
                    // Update UI for current question
                    const currentQuestion = quizQuestions[currentQuestionIndex];
                    if (currentQuestion && currentQuestion.id === questionId) {
                        document.querySelectorAll('.quiz-option').forEach(function(option, i) {
                            option.classList.toggle('selected', i === answerIndex);
                        });
                    }
                    
                    updateNavigationButtons();
                }
                
                function nextQuestion() {
                    if (currentQuestionIndex < quizQuestions.length - 1) {
                        currentQuestionIndex++;
                        displayCurrentQuestion();
                    }
                    updateNavigationButtons();
                }
                
                function previousQuestion() {
                    if (currentQuestionIndex > 0) {
                        currentQuestionIndex--;
                        displayCurrentQuestion();
                    }
                    updateNavigationButtons();
                }
                
                function skipCurrentQuestion() {
                    // Remove answer for current question if exists
                    const currentQuestion = quizQuestions[currentQuestionIndex];
                    if (currentQuestion) {
                        delete selectedAnswers[currentQuestion.id];
                    }
                    
                    // Move to next question or stay on last
                    if (currentQuestionIndex < quizQuestions.length - 1) {
                        nextQuestion();
                    } else {
                        updateNavigationButtons(); // Just update UI
                    }
                }
                
                function submitAllAnswers() {
                    console.log('📤 Submitting all answers:', selectedAnswers);
                    
                    const answers = Object.keys(selectedAnswers).map(questionId => ({
                        question_id: questionId,
                        selected_answer: selectedAnswers[questionId]
                    }));
                    
                    if (answers.length === 0) {
                        alert('Please answer at least one question!');
                        return;
                    }
                    
                    // Update button state
                    const submitBtn = document.getElementById('submitAllBtn');
                    if (submitBtn) {
                        submitBtn.textContent = 'SUBMITTING...';
                        submitBtn.disabled = true;
                    }
                    
                    // Send to extension
                    vscode.postMessage({
                        type: 'submitBatchQuizAnswers',
                        answers: answers
                    });
                }
                
                function skipQuizBatch() {
                    console.log('⭐ Skip entire quiz batch clicked');
                    vscode.postMessage({ type: 'skipQuizBatch' });
                }
                
                function displayCurrentQuestion() {
                    const question = quizQuestions[currentQuestionIndex];
                    if (!question) return;
                    
                    // Update question display
                    const questionText = document.querySelector('.question-text');
                    const questionTopic = document.querySelector('.question-topic');
                    const questionDifficulty = document.querySelector('.question-difficulty');
                    const questionCounter = document.querySelector('.question-counter');
                    
                    if (questionText) questionText.textContent = question.question;
                    if (questionTopic) questionTopic.textContent = question.topic;
                    if (questionDifficulty) questionDifficulty.textContent = question.difficulty.toUpperCase();
                    if (questionCounter) {
                        questionCounter.textContent = 'Question ' + (currentQuestionIndex + 1) + ' of ' + quizQuestions.length;
                    }
                    
                    // Update options - FIXED: Proper HTML generation and event binding
                    const optionsContainer = document.querySelector('.quiz-options');
                    if (optionsContainer) {
                        optionsContainer.innerHTML = '';
                        
                        question.options.forEach(function(option, index) {
                            const isSelected = selectedAnswers[question.id] === index;
                            
                            // Create button element
                            const optionButton = document.createElement('button');
                            optionButton.className = 'quiz-option' + (isSelected ? ' selected' : '');
                            optionButton.setAttribute('data-index', index);
                            
                            // Add click event
                            optionButton.addEventListener('click', function() {
                                selectAnswerBatch(question.id, index);
                            });
                            
                            // Set inner HTML
                            optionButton.innerHTML = 
                                '<span class="option-letter">' + String.fromCharCode(65 + index) + '</span>' +
                                '<span class="option-text">' + option + '</span>';
                            
                            optionsContainer.appendChild(optionButton);
                        });
                    }
                }
                
                function updateNavigationButtons() {
                    const prevBtn = document.getElementById('prevBtn');
                    const nextBtn = document.getElementById('nextBtn');
                    
                    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
                    if (nextBtn) nextBtn.disabled = currentQuestionIndex === quizQuestions.length - 1;
                    
                    // Update submit button text
                    const answeredCount = Object.keys(selectedAnswers).length;
                    const submitBtn = document.getElementById('submitAllBtn');
                    if (submitBtn) {
                        submitBtn.textContent = 'SUBMIT (' + answeredCount + '/' + quizQuestions.length + ')';
                        submitBtn.disabled = answeredCount === 0;
                    }
                }
                
                function showQuizBatch(questions, stats) {
                    console.log('🎯 Showing quiz batch:', questions);
                    quizQuestions = questions;
                    currentQuestionIndex = 0;
                    selectedAnswers = {};
                    userStats = stats;
                    
                    // Generate quiz HTML with proper UX
                    const quizHTML = generateBatchQuizHTML();
                    document.body.insertAdjacentHTML('beforeend', quizHTML);
                    
                    // Bind navigation events
                    bindNavigationEvents();
                    
                    displayCurrentQuestion();
                    updateNavigationButtons();
                }
                
                function bindNavigationEvents() {
                    const prevBtn = document.getElementById('prevBtn');
                    const nextBtn = document.getElementById('nextBtn');
                    const skipBtn = document.getElementById('skipBtn');
                    const submitBtn = document.getElementById('submitAllBtn');
                    const skipAllBtn = document.getElementById('skipAllBtn');
                    
                    if (prevBtn) {
                        prevBtn.addEventListener('click', previousQuestion);
                    }
                    if (nextBtn) {
                        nextBtn.addEventListener('click', nextQuestion);
                    }
                    if (skipBtn) {
                        skipBtn.addEventListener('click', skipCurrentQuestion);
                    }
                    if (submitBtn) {
                        submitBtn.addEventListener('click', submitAllAnswers);
                    }
                    if (skipAllBtn) {
                        skipAllBtn.addEventListener('click', skipQuizBatch);
                    }
                }
                
                function generateBatchQuizHTML() {
                    return '<div class="quiz-gate-overlay" id="quizGate">' +
                        '<div class="quiz-container">' +
                        '<div class="quiz-header">' +
                        '<div class="lock-icon">🔒</div>' +
                        '<h3 class="quiz-title">Answer Quiz to Unlock Code</h3>' +
                        '<p class="quiz-subtitle">Learn while you code with AI4U</p>' +
                        '<div class="question-counter">Question 1 of ' + quizQuestions.length + '</div>' +
                        '<div class="quiz-stats">' +
                        '<span class="stat">Level ' + userStats.level + '</span>' +
                        '<span class="stat">Streak: ' + (userStats.currentStreak || userStats.streak || 0) + '</span>' +
                        '<span class="stat">Accuracy: ' + userStats.accuracy + '%</span>' +
                        '</div>' +
                        '</div>' +
                        '<div class="quiz-content">' +
                        '<div class="question-text"></div>' +
                        '<div class="question-meta">' +
                        '<div class="question-topic"></div>' +
                        '<div class="question-difficulty"></div>' +
                        '</div>' +
                        '<div class="quiz-options"></div>' +
                        '<div class="quiz-navigation">' +
                        '<button class="nav-btn" id="prevBtn">Previous</button>' +
                        '<button class="nav-btn" id="nextBtn">Next</button>' +
                        '<button class="nav-btn skip-btn" id="skipBtn">Skip This</button>' +
                        '</div>' +
                        '<div class="quiz-actions">' +
                        '<button class="quiz-submit-btn" id="submitAllBtn" disabled>SUBMIT (0/' + quizQuestions.length + ')</button>' +
                        '<button class="quiz-skip-btn" id="skipAllBtn">Skip All</button>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                }
                
                function showBatchQuizResult(results, stats) {
                    console.log('🎉 Showing batch quiz result:', results);
                    
                    // Remove quiz overlay
                    const quizGate = document.getElementById('quizGate');
                    if (quizGate) {
                        quizGate.remove();
                        console.log('✅ Quiz gate removed');
                    }
                    
                    // Process results
                    let correctCount = 0;
                    let totalPoints = 0;
                    let resultDetails = '';
                    
                    if (results && results.length > 0) {
                        results.forEach(function(result, index) {
                            if (result.correct) {
                                correctCount++;
                                totalPoints += result.points_earned || 1;
                            }
                            resultDetails += 'Q' + (index + 1) + ': ' + (result.correct ? '✅ Correct' : '❌ Incorrect') + '\\n';
                        });
                    }
                    
                    // Show comprehensive result with original UX feel
                    const resultText = '🎉 Quiz Complete!\\n\\n' +
                        '📊 Results:\\n' +
                        'Score: ' + correctCount + '/' + results.length + '\\n' +
                        'Points Earned: ' + totalPoints + '\\n' +
                        'Unlocked Responses: ' + (stats.unlockedResponses || 1) + '\\n\\n' +
                        '📝 Question Breakdown:\\n' + resultDetails +
                        '\\n🚀 Keep coding with AI4U!';
                    
                    alert(resultText);
                    
                    // Update stats in UI
                    userStats = stats;
                    updateLearningGatesUI();
                }
                
                // LEGACY: Single question support (preserved UX)
                function selectAnswer(index) {
                    console.log('🎯 Answer selected:', index);
                    selectedAnswerIndex = index;
                    
                    // Update UI
                    document.querySelectorAll('.quiz-option').forEach(function(option, i) {
                        option.classList.toggle('selected', i === index);
                    });
                    
                    // Enable submit button
                    const submitBtn = document.getElementById('submitBtn');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Submit Answer';
                    }
                }
                
                function submitQuizAnswer() {
                    console.log('📤 Submit clicked, selectedAnswer:', selectedAnswerIndex);
                    
                    if (selectedAnswerIndex === -1) {
                        alert('Please select an answer first!');
                        return;
                    }
                    
                    // Update button state
                    const submitBtn = document.getElementById('submitBtn');
                    if (submitBtn) {
                        submitBtn.textContent = 'SUBMITTING...';
                        submitBtn.disabled = true;
                    }
                    
                    // Send to extension
                    vscode.postMessage({
                        type: 'submitQuizAnswer',
                        questionId: currentQuestionId,
                        selectedAnswer: selectedAnswerIndex
                    });
                }
                
                function skipQuiz() {
                    console.log('⭐ Skip quiz clicked');
                    vscode.postMessage({ type: 'skipQuiz' });
                }
                
                function showQuiz(question, stats) {
                    console.log('🎯 Showing single quiz:', question);
                    currentQuestionId = question.id;
                    selectedAnswerIndex = -1;
                    userStats = stats;
                    
                    // Generate original single question HTML
                    var quizHTML = '<div class="quiz-gate-overlay" id="quizGate">' +
                        '<div class="quiz-container">' +
                        '<div class="quiz-header">' +
                        '<div class="lock-icon">🔒</div>' +
                        '<h3 class="quiz-title">Answer Quiz to Unlock Code</h3>' +
                        '<p class="quiz-subtitle">Learn while you code with AI4U</p>' +
                        '<div class="quiz-stats">' +
                        '<span class="stat">Level ' + stats.level + '</span>' +
                        '<span class="stat">Streak: ' + (stats.currentStreak || stats.streak || 0) + '</span>' +
                        '<span class="stat">Accuracy: ' + stats.accuracy + '%</span>' +
                        '</div>' +
                        '</div>' +
                        '<div class="quiz-content">' +
                        '<div class="question-text">' + question.question + '</div>' +
                        '<div class="question-meta">' +
                        '<div class="question-topic">' + question.topic + '</div>' +
                        '<div class="question-difficulty">' + question.difficulty.toUpperCase() + '</div>' +
                        '</div>' +
                        '<div class="quiz-options">';
                    
                    // Add options with proper event binding
                    for (var i = 0; i < question.options.length; i++) {
                        quizHTML += '<button class="quiz-option" data-index="' + i + '">' +
                            '<span class="option-letter">' + String.fromCharCode(65 + i) + '</span>' +
                            '<span class="option-text">' + question.options[i] + '</span>' +
                            '</button>';
                    }
                    
                    quizHTML += '</div>' +
                        '<div class="quiz-actions">' +
                        '<button class="quiz-submit-btn" id="submitBtn" disabled>Submit Answer</button>' +
                        '<button class="quiz-skip-btn" id="skipSingleBtn">Skip Quiz</button>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                    
                    document.body.insertAdjacentHTML('beforeend', quizHTML);
                    
                    // Bind events for single question
                    bindSingleQuestionEvents();
                }
                
                function bindSingleQuestionEvents() {
                    // Bind option clicks
                    document.querySelectorAll('.quiz-option').forEach(function(option, index) {
                        option.addEventListener('click', function() {
                            selectAnswer(index);
                        });
                    });
                    
                    // Bind submit and skip
                    const submitBtn = document.getElementById('submitBtn');
                    const skipBtn = document.getElementById('skipSingleBtn');
                    
                    if (submitBtn) {
                        submitBtn.addEventListener('click', submitQuizAnswer);
                    }
                    if (skipBtn) {
                        skipBtn.addEventListener('click', skipQuiz);
                    }
                }
                
                function showQuizResult(result) {
                    console.log('🎉 Showing quiz result:', result);
                    
                    // Remove quiz overlay
                    const quizGate = document.getElementById('quizGate');
                    if (quizGate) {
                        quizGate.remove();
                        console.log('✅ Quiz gate removed');
                    }
                    
                    // Show result with original UX style
                    const resultText = result.correct ? 
                        '🎉 Correct!\\n\\nYou unlocked ' + result.unlockedResponses + ' AI responses!\\n\\n' +
                        (result.explanation ? 'Explanation: ' + result.explanation : '') :
                        '❌ Incorrect!\\n\\n' + (result.explanation || 'Try again next time!') + 
                        '\\n\\nYou still get ' + result.unlockedResponses + ' response(s).';
                    
                    alert(resultText);
                    
                    // Update stats in UI
                    updateLearningGatesUI();
                }
                
                function closeQuizResult() {
                    const overlay = document.getElementById('quizResult');
                    if (overlay) {
                        overlay.remove();
                    }
                }
                
                function toggleLearningGates() {
                    learningGatesEnabled = !learningGatesEnabled;
                    updateLearningGatesUI();
                    console.log('🔄 Toggling learning gates to:', learningGatesEnabled);
                    vscode.postMessage({
                        type: 'toggleLearningGates',
                        enabled: learningGatesEnabled
                    });
                }
                
                function updateLearningGatesUI() {
                    const gatesSection = document.querySelector('.learning-gates-section');
                    const toggleBtn = document.querySelector('.gates-toggle');
                    const progressStats = document.querySelector('.progress-stats');
                    
                    if (toggleBtn) {
                        toggleBtn.textContent = learningGatesEnabled ? 'Disable' : 'Enable';
                    }
                    
                    if (gatesSection) {
                        gatesSection.style.opacity = learningGatesEnabled ? '1' : '0.6';
                    }
                    
                    if (progressStats) {
                        progressStats.innerHTML = 
                            '<div class="progress-item">' +
                            '<span>Level:</span>' +
                            '<span class="progress-value">' + userStats.level + '</span>' +
                            '</div>' +
                            '<div class="progress-item">' +
                            '<span>Streak:</span>' +
                            '<span class="progress-value">' + (userStats.currentStreak || userStats.streak || 0) + '</span>' +
                            '</div>' +
                            '<div class="progress-item">' +
                            '<span>Accuracy:</span>' +
                            '<span class="progress-value">' + userStats.accuracy + '%</span>' +
                            '</div>' +
                            '<div class="progress-item">' +
                            '<span class="unlocked-responses">' + userStats.unlockedResponses + ' responses left</span>' +
                            '</div>';
                    }
                }
        `;
    }

    public static getQuizMessageHandlers(): string {
        return `
                case 'showQuiz':
                    console.log('🎯 Handling showQuiz message (single question)');
                    showQuiz(message.question, message.stats);
                    break;
                    
                case 'showQuizBatch':
                    console.log('🎯 Handling showQuizBatch message (multiple questions)');
                    showQuizBatch(message.questions, message.stats);
                    break;
                    
                case 'showQuizResult':
                    console.log('🎉 Handling showQuizResult message (single)');
                    showQuizResult(message.result);
                    break;
                    
                case 'showBatchQuizResult':
                    console.log('🎉 Handling showBatchQuizResult message (batch)');
                    showBatchQuizResult(message.results, message.stats);
                    break;
                    
                case 'updateStats':
                    console.log('📊 Updating stats:', message.stats);
                    userStats = message.stats;
                    updateLearningGatesUI();
                    break;
                    
                case 'learningGatesToggled':
                    console.log('🔄 Learning gates toggled:', message.enabled);
                    learningGatesEnabled = message.enabled;
                    updateLearningGatesUI();
                    break;
        `;
    }
}