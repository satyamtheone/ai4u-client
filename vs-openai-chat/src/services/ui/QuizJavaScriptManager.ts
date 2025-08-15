import { QuizRenderer } from './QuizRenderer';

export class QuizJavaScriptManager {
    
    public static getQuizVariables(): string {
        return `
                // Enhanced quiz variables for multiple question types
                let currentQuestionIndex = 0;
                let quizQuestions = [];
                let selectedAnswers = {}; // {questionId: answer_data}
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
                ${QuizRenderer.getQuestionTypeDetection()}
                
                ${QuizRenderer.getRenderingFunctions()}
                
                // Answer selection functions
                function selectSingleAnswer(questionId, answerIndex) {
                    console.log('Single choice selected for question:', questionId, 'answer:', answerIndex);
                    selectedAnswers[questionId] = {
                        type: 'single_choice',
                        answer: answerIndex
                    };
                    
                    const currentQuestion = quizQuestions[currentQuestionIndex];
                    if (currentQuestion && currentQuestion.id === questionId) {
                        document.querySelectorAll('.quiz-option').forEach(function(option, i) {
                            const radio = option.querySelector('input[type="radio"]');
                            const optionLetter = option.querySelector('.option-letter');
                            
                            if (radio) {
                                radio.checked = (i === answerIndex);
                                option.classList.toggle('selected', i === answerIndex);
                                
                                if (i === answerIndex) {
                                    option.style.borderColor = '#4CAF50';
                                    option.style.background = 'rgba(76, 175, 80, 0.1)';
                                    if (optionLetter) {
                                        optionLetter.style.background = '#4CAF50';
                                        optionLetter.style.color = 'white';
                                    }
                                } else {
                                    option.style.borderColor = 'var(--vscode-input-border)';
                                    option.style.background = 'var(--vscode-input-background)';
                                    if (optionLetter) {
                                        optionLetter.style.background = 'var(--vscode-button-background)';
                                        optionLetter.style.color = 'var(--vscode-button-foreground)';
                                    }
                                }
                            }
                        });
                    }
                    
                    updateNavigationButtons();
                }
                
                function toggleMultipleAnswer(questionId, answerIndex) {
                    console.log('Multiple choice toggled for question:', questionId, 'answer:', answerIndex);
                    
                    if (!selectedAnswers[questionId]) {
                        selectedAnswers[questionId] = {
                            type: 'multiple_choice',
                            answers: []
                        };
                    }
                    
                    const answers = selectedAnswers[questionId].answers;
                    const existingIndex = answers.indexOf(answerIndex);
                    
                    if (existingIndex > -1) {
                        answers.splice(existingIndex, 1);
                    } else {
                        answers.push(answerIndex);
                    }
                    
                    console.log('Updated answers for', questionId, ':', answers);
                    
                    // Force UI update immediately
                    const currentQuestion = quizQuestions[currentQuestionIndex];
                    if (currentQuestion && currentQuestion.id === questionId) {
                        document.querySelectorAll('.quiz-option').forEach(function(option, i) {
                            const checkbox = option.querySelector('input[type="checkbox"]');
                            const optionLetter = option.querySelector('.option-letter');
                            
                            if (checkbox && i === answerIndex) {
                                // Update the clicked checkbox
                                checkbox.checked = answers.includes(i);
                                option.classList.toggle('selected', answers.includes(i));
                                
                                if (answers.includes(i)) {
                                    option.style.borderColor = '#4CAF50';
                                    option.style.background = 'rgba(76, 175, 80, 0.1)';
                                    if (optionLetter) {
                                        optionLetter.style.background = '#4CAF50';
                                        optionLetter.style.color = 'white';
                                    }
                                } else {
                                    option.style.borderColor = 'var(--vscode-input-border)';
                                    option.style.background = 'var(--vscode-input-background)';
                                    if (optionLetter) {
                                        optionLetter.style.background = 'var(--vscode-button-background)';
                                        optionLetter.style.color = 'var(--vscode-button-foreground)';
                                    }
                                }
                            }
                        });
                    }
                    
                    updateNavigationButtons();
                }
                
                function updateShortAnswer(questionId, value) {
                    console.log('Short answer updated for question:', questionId, 'value:', value);
                    selectedAnswers[questionId] = {
                        type: 'short_answer',
                        answer: value.trim()
                    };
                    
                    updateNavigationButtons();
                }
                
                // Navigation functions
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
                    const currentQuestion = quizQuestions[currentQuestionIndex];
                    if (currentQuestion) {
                        delete selectedAnswers[currentQuestion.id];
                    }
                    
                    if (currentQuestionIndex < quizQuestions.length - 1) {
                        nextQuestion();
                    } else {
                        updateNavigationButtons();
                    }
                }
                
                function updateNavigationButtons() {
                    const prevBtn = document.getElementById('prevBtn');
                    const nextBtn = document.getElementById('nextBtn');
                    
                    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;
                    if (nextBtn) nextBtn.disabled = currentQuestionIndex === quizQuestions.length - 1;
                    
                    const answeredCount = Object.keys(selectedAnswers).length;
                    const submitBtn = document.getElementById('submitAllBtn');
                    if (submitBtn) {
                        submitBtn.textContent = 'SUBMIT (' + answeredCount + '/' + quizQuestions.length + ')';
                        submitBtn.disabled = answeredCount === 0;
                    }
                }
                
                // Submit functions
                function submitAllAnswers() {
                    console.log('Submitting all answers:', selectedAnswers);
                    
                    const answers = Object.keys(selectedAnswers).map(questionId => {
                        const answerData = selectedAnswers[questionId];
                        const question = quizQuestions.find(q => q.id === questionId);
                        const detectedType = detectQuestionType(question);
                        
                        return {
                            question_id: questionId,
                            answer_type: detectedType,
                            selected_answer: answerData.answer || answerData.answers || null
                        };
                    });
                    
                    if (answers.length === 0) {
                        alert('Please answer at least one question!');
                        return;
                    }
                    
                    const submitBtn = document.getElementById('submitAllBtn');
                    if (submitBtn) {
                        submitBtn.textContent = 'SUBMITTING...';
                        submitBtn.disabled = true;
                    }
                    
                    vscode.postMessage({
                        type: 'submitBatchQuizAnswers',
                        answers: answers
                    });
                }
                
                function skipQuizBatch() {
                    console.log('Skip entire quiz batch clicked');
                    vscode.postMessage({ type: 'skipQuizBatch' });
                }
                
                // Main quiz functions
                function showQuizBatch(questions, stats) {
                    console.log('Showing enhanced quiz batch:', questions);
                    quizQuestions = questions;
                    currentQuestionIndex = 0;
                    selectedAnswers = {};
                    userStats = stats;
                    
                    const quizHTML = generateEnhancedQuizHTML();
                    document.body.insertAdjacentHTML('beforeend', quizHTML);
                    
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
                
                function showBatchQuizResult(results, stats) {
                    console.log('Showing enhanced quiz result:', results);
                    
                    const quizGate = document.getElementById('quizGate');
                    if (quizGate) {
                        quizGate.remove();
                        console.log('Quiz gate removed');
                    }
                    
                    let correctCount = 0;
                    let totalPoints = 0;
                    let resultDetails = '';
                    
                    if (results && results.length > 0) {
                        results.forEach(function(result, index) {
                            if (result.correct) {
                                correctCount++;
                                totalPoints += result.points_earned || 1;
                            }
                            const answerType = result.answer_type || 'single_choice';
                            const typeIcon = answerType === 'multiple_choice' ? '☑️' : 
                                           answerType === 'short_answer' ? '✏️' : '🔘';
                            resultDetails += 'Q' + (index + 1) + ' ' + typeIcon + ': ' + 
                                           (result.correct ? '✅ Correct' : '❌ Incorrect') + '\\n';
                        });
                    }
                    
                    const resultText = '🎉 Quiz Complete!\\n\\n' +
                        '📊 Results:\\n' +
                        'Score: ' + correctCount + '/' + results.length + '\\n' +
                        'Points Earned: ' + totalPoints + '\\n' +
                        'Unlocked Responses: ' + (stats.unlockedResponses || 1) + '\\n\\n' +
                        '📝 Question Breakdown:\\n' + resultDetails +
                        '\\n🚀 Keep coding with AI4U!';
                    
                    alert(resultText);
                    
                    userStats = stats;
                    updateLearningGatesUI();
                }
                
                // Legacy functions for backward compatibility
                function selectAnswer(index) {
                    console.log('Legacy answer selected:', index);
                    selectedAnswerIndex = index;
                    
                    document.querySelectorAll('.quiz-option').forEach(function(option, i) {
                        option.classList.toggle('selected', i === index);
                    });
                    
                    const submitBtn = document.getElementById('submitBtn');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Submit Answer';
                    }
                }
                
                function submitQuizAnswer() {
                    console.log('Legacy submit clicked, selectedAnswer:', selectedAnswerIndex);
                    
                    if (selectedAnswerIndex === -1) {
                        alert('Please select an answer first!');
                        return;
                    }
                    
                    const submitBtn = document.getElementById('submitBtn');
                    if (submitBtn) {
                        submitBtn.textContent = 'SUBMITTING...';
                        submitBtn.disabled = true;
                    }
                    
                    vscode.postMessage({
                        type: 'submitQuizAnswer',
                        questionId: currentQuestionId,
                        selectedAnswer: selectedAnswerIndex
                    });
                }
                
                function skipQuiz() {
                    console.log('Legacy skip quiz clicked');
                    vscode.postMessage({ type: 'skipQuiz' });
                }
                
                function showQuiz(question, stats) {
                    console.log('Legacy showing single quiz:', question);
                    currentQuestionId = question.id;
                    selectedAnswerIndex = -1;
                    userStats = stats;
                    
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
                    bindSingleQuestionEvents();
                }
                
                function bindSingleQuestionEvents() {
                    document.querySelectorAll('.quiz-option').forEach(function(option, index) {
                        option.addEventListener('click', function() {
                            selectAnswer(index);
                        });
                    });
                    
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
                    console.log('Legacy showing quiz result:', result);
                    
                    const quizGate = document.getElementById('quizGate');
                    if (quizGate) {
                        quizGate.remove();
                        console.log('Quiz gate removed');
                    }
                    
                    const resultText = result.correct ? 
                        '🎉 Correct!\\n\\nYou unlocked ' + result.unlockedResponses + ' AI responses!\\n\\n' +
                        (result.explanation ? 'Explanation: ' + result.explanation : '') :
                        '❌ Incorrect!\\n\\n' + (result.explanation || 'Try again next time!') + 
                        '\\n\\nYou still get ' + result.unlockedResponses + ' response(s).';
                    
                    alert(resultText);
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
                    console.log('Toggling learning gates to:', learningGatesEnabled);
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
                    console.log('Handling showQuiz message (single question)');
                    showQuiz(message.question, message.stats);
                    break;
                    
                case 'showQuizBatch':
                    console.log('Handling showQuizBatch message (multiple questions)');
                    showQuizBatch(message.questions, message.stats);
                    break;
                    
                case 'showQuizResult':
                    console.log('Handling showQuizResult message (single)');
                    showQuizResult(message.result);
                    break;
                    
                case 'showBatchQuizResult':
                    console.log('Handling showBatchQuizResult message (batch)');
                    showBatchQuizResult(message.results, message.stats);
                    break;
                    
                case 'updateStats':
                    console.log('Updating stats:', message.stats);
                    userStats = message.stats;
                    updateLearningGatesUI();
                    break;
                    
                case 'learningGatesToggled':
                    console.log('Learning gates toggled:', message.enabled);
                    learningGatesEnabled = message.enabled;
                    updateLearningGatesUI();
                    break;
        `;
    }
}