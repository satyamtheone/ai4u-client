export class QuizJavaScriptManager {
    
    public static getQuizVariables(): string {
        return `
                // Quiz variables
                let selectedAnswerIndex = -1;
                let currentQuestionId = null;
                let learningGatesEnabled = true;
                let userStats = {
                    level: 1,
                    streak: 0,
                    accuracy: 0,
                    unlockedResponses: 0
                };
        `;
    }

    public static getQuizFunctions(): string {
        return `
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
                    console.log('⏭️ Skip quiz clicked');
                    vscode.postMessage({ type: 'skipQuiz' });
                }
                
                function showQuiz(question, stats) {
                    console.log('🎯 Showing quiz:', question);
                    currentQuestionId = question.id;
                    selectedAnswerIndex = -1;
                    userStats = stats;
                    
                    // Generate quiz HTML using simple string concatenation
                    var quizHTML = '<div class="quiz-gate-overlay" id="quizGate">' +
                        '<div class="quiz-container">' +
                        '<div class="quiz-header">' +
                        '<div class="lock-icon">🔒</div>' +
                        '<h3 class="quiz-title">Answer Quiz to Unlock Code</h3>' +
                        '<p class="quiz-subtitle">Learn while you code with AI4U</p>' +
                        '<div class="quiz-stats">' +
                        '<span class="stat">Level ' + stats.level + '</span>' +
                        '<span class="stat">Streak: ' + stats.currentStreak + '</span>' +
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
                    
                    // Add options
                    for (var i = 0; i < question.options.length; i++) {
                        quizHTML += '<button class="quiz-option" onclick="selectAnswer(' + i + ')" data-index="' + i + '">' +
                            '<span class="option-letter">' + String.fromCharCode(65 + i) + '</span>' +
                            '<span class="option-text">' + question.options[i] + '</span>' +
                            '</button>';
                    }
                    
                    quizHTML += '</div>' +
                        '<div class="quiz-actions">' +
                        '<button class="quiz-submit-btn" id="submitBtn" onclick="submitQuizAnswer()" disabled>Submit Answer</button>' +
                        '<button class="quiz-skip-btn" onclick="skipQuiz()">Skip Quiz</button>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                    
                    document.body.insertAdjacentHTML('beforeend', quizHTML);
                }
                
                function showQuizResult(result) {
                    console.log('🎉 Showing quiz result:', result);
                    
                    // Remove quiz overlay
                    const quizGate = document.getElementById('quizGate');
                    if (quizGate) {
                        quizGate.remove();
                        console.log('✅ Quiz gate removed');
                    }
                    
                    // Show result alert (simple for now)
                    const resultText = result.correct ? 
                        'Correct! You unlocked ' + result.unlockedResponses + ' responses!' : 
                        'Incorrect! ' + (result.explanation || 'Try again next time!');
                    
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
                            '<span class="progress-value">' + userStats.streak + '</span>' +
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
                    console.log('🎯 Handling showQuiz message');
                    showQuiz(message.question, message.stats);
                    break;
                    
                case 'showQuizResult':
                    console.log('🎉 Handling showQuizResult message');
                    showQuizResult(message.result);
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