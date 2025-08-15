export class QuizRenderer {
    
    public static getQuestionTypeDetection(): string {
        return `
                // Question type detection
                function detectQuestionType(question) {
                    if (question.question_type) {
                        return question.question_type;
                    }
                    
                    if (question.correct_answers && Array.isArray(question.correct_answers)) {
                        return 'multiple_choice';
                    }
                    
                    if (question.options && question.options.length > 0) {
                        return 'single_choice';
                    }
                    
                    return 'short_answer';
                }
                
                function getQuestionTypeDisplay(type) {
                    switch(type) {
                        case 'single_choice': return 'Single Choice';
                        case 'multiple_choice': return 'Multiple Choice';
                        case 'short_answer': return 'Short Answer';
                        default: return 'Single Choice';
                    }
                }
        `;
    }

    public static getRenderingFunctions(): string {
        return `
                function displayCurrentQuestion() {
                    const question = quizQuestions[currentQuestionIndex];
                    if (!question) return;
                    
                    const questionText = document.querySelector('.question-text');
                    const questionTopic = document.querySelector('.question-topic');
                    const questionDifficulty = document.querySelector('.question-difficulty');
                    const questionCounter = document.querySelector('.question-counter');
                    const questionType = document.querySelector('.question-type');
                    
                    if (questionText) questionText.textContent = question.question;
                    if (questionTopic) questionTopic.textContent = question.topic;
                    if (questionDifficulty) questionDifficulty.textContent = question.difficulty.toUpperCase();
                    if (questionCounter) {
                        questionCounter.textContent = 'Question ' + (currentQuestionIndex + 1) + ' of ' + quizQuestions.length;
                    }
                    
                    const detectedType = detectQuestionType(question);
                    console.log('Detected question type:', detectedType, 'for question:', question.id);
                    
                    if (questionType) {
                        questionType.textContent = getQuestionTypeDisplay(detectedType);
                    }
                    
                    const optionsContainer = document.querySelector('.quiz-options');
                    if (optionsContainer) {
                        optionsContainer.innerHTML = '';
                        
                        if (detectedType === 'single_choice') {
                            renderSingleChoiceOptions(question, optionsContainer);
                        } else if (detectedType === 'multiple_choice') {
                            renderMultipleChoiceOptions(question, optionsContainer);
                        } else if (detectedType === 'short_answer') {
                            renderShortAnswerInput(question, optionsContainer);
                        }
                    }
                }
                
                function renderSingleChoiceOptions(question, container) {
                    const currentAnswer = selectedAnswers[question.id];
                    const selectedIndex = currentAnswer && currentAnswer.type === 'single_choice' ? currentAnswer.answer : -1;
                    
                    question.options.forEach(function(option, index) {
                        const isSelected = selectedIndex === index;
                        
                        const optionDiv = document.createElement('div');
                        optionDiv.className = 'quiz-option' + (isSelected ? ' selected' : '');
                        
                        optionDiv.style.display = 'flex';
                        optionDiv.style.alignItems = 'flex-start';
                        optionDiv.style.padding = '12px 16px';
                        optionDiv.style.marginBottom = '8px';
                        optionDiv.style.background = 'var(--vscode-input-background)';
                        optionDiv.style.color = 'var(--vscode-input-foreground)';
                        optionDiv.style.border = '2px solid ' + (isSelected ? '#4CAF50' : 'var(--vscode-input-border)');
                        optionDiv.style.borderRadius = '8px';
                        optionDiv.style.cursor = 'pointer';
                        optionDiv.style.transition = 'all 0.2s ease';
                        
                        if (isSelected) {
                            optionDiv.style.background = 'rgba(76, 175, 80, 0.1)';
                        }
                        
                        const radioInput = document.createElement('input');
                        radioInput.type = 'radio';
                        radioInput.name = 'answer_' + question.id;
                        radioInput.value = index;
                        radioInput.checked = isSelected;
                        radioInput.id = 'option_' + question.id + '_' + index;
                        radioInput.style.marginRight = '12px';
                        radioInput.style.transform = 'scale(1.3)';
                        radioInput.style.cursor = 'pointer';
                        
                        const label = document.createElement('label');
                        label.htmlFor = radioInput.id;
                        label.style.display = 'flex';
                        label.style.alignItems = 'center';
                        label.style.cursor = 'pointer';
                        label.style.width = '100%';
                        
                        const optionLetter = document.createElement('span');
                        optionLetter.className = 'option-letter';
                        optionLetter.style.display = 'inline-flex';
                        optionLetter.style.alignItems = 'center';
                        optionLetter.style.justifyContent = 'center';
                        optionLetter.style.width = '24px';
                        optionLetter.style.height = '24px';
                        optionLetter.style.background = isSelected ? '#4CAF50' : 'var(--vscode-button-background)';
                        optionLetter.style.color = isSelected ? 'white' : 'var(--vscode-button-foreground)';
                        optionLetter.style.borderRadius = '50%';
                        optionLetter.style.fontSize = '12px';
                        optionLetter.style.fontWeight = 'bold';
                        optionLetter.style.marginRight = '12px';
                        optionLetter.style.flexShrink = '0';
                        optionLetter.textContent = String.fromCharCode(65 + index);
                        
                        const optionText = document.createElement('span');
                        optionText.className = 'option-text';
                        optionText.style.flex = '1';
                        optionText.style.fontSize = '14px';
                        optionText.style.lineHeight = '1.4';
                        optionText.textContent = option;
                        
                        label.appendChild(optionLetter);
                        label.appendChild(optionText);
                        optionDiv.appendChild(radioInput);
                        optionDiv.appendChild(label);
                        
                        optionDiv.addEventListener('click', function() {
                            selectSingleAnswer(question.id, index);
                        });
                        
                        container.appendChild(optionDiv);
                    });
                }
                
                function renderMultipleChoiceOptions(question, container) {
                    console.log('Rendering multiple choice options for:', question.id);
                    
                    const currentAnswer = selectedAnswers[question.id];
                    const selectedIndexes = currentAnswer && currentAnswer.type === 'multiple_choice' ? currentAnswer.answers : [];
                    
                    const instruction = document.createElement('div');
                    instruction.className = 'multiple-choice-instruction';
                    instruction.textContent = 'Select all that apply:';
                    instruction.style.fontSize = '14px';
                    instruction.style.color = 'var(--vscode-descriptionForeground)';
                    instruction.style.marginBottom = '16px';
                    instruction.style.fontStyle = 'italic';
                    container.appendChild(instruction);
                    
                    question.options.forEach(function(option, index) {
                        const isSelected = selectedIndexes.includes(index);
                        
                        const optionDiv = document.createElement('div');
                        optionDiv.className = 'quiz-option' + (isSelected ? ' selected' : '');
                        
                        optionDiv.style.display = 'flex';
                        optionDiv.style.alignItems = 'flex-start';
                        optionDiv.style.padding = '12px 16px';
                        optionDiv.style.marginBottom = '8px';
                        optionDiv.style.background = 'var(--vscode-input-background)';
                        optionDiv.style.color = 'var(--vscode-input-foreground)';
                        optionDiv.style.border = '2px solid ' + (isSelected ? '#4CAF50' : 'var(--vscode-input-border)');
                        optionDiv.style.borderRadius = '8px';
                        optionDiv.style.cursor = 'pointer';
                        optionDiv.style.transition = 'all 0.2s ease';
                        
                        if (isSelected) {
                            optionDiv.style.background = 'rgba(76, 175, 80, 0.1)';
                        }
                        
                        const checkboxInput = document.createElement('input');
                        checkboxInput.type = 'checkbox';
                        checkboxInput.value = index;
                        checkboxInput.checked = isSelected;
                        checkboxInput.id = 'option_' + question.id + '_' + index;
                        checkboxInput.style.marginRight = '12px';
                        checkboxInput.style.transform = 'scale(1.3)';
                        checkboxInput.style.cursor = 'pointer';
                        
                        const label = document.createElement('label');
                        label.htmlFor = checkboxInput.id;
                        label.style.display = 'flex';
                        label.style.alignItems = 'center';
                        label.style.cursor = 'pointer';
                        label.style.width = '100%';
                        
                        const optionLetter = document.createElement('span');
                        optionLetter.className = 'option-letter';
                        optionLetter.style.display = 'inline-flex';
                        optionLetter.style.alignItems = 'center';
                        optionLetter.style.justifyContent = 'center';
                        optionLetter.style.width = '24px';
                        optionLetter.style.height = '24px';
                        optionLetter.style.background = isSelected ? '#4CAF50' : 'var(--vscode-button-background)';
                        optionLetter.style.color = isSelected ? 'white' : 'var(--vscode-button-foreground)';
                        optionLetter.style.borderRadius = '50%';
                        optionLetter.style.fontSize = '12px';
                        optionLetter.style.fontWeight = 'bold';
                        optionLetter.style.marginRight = '12px';
                        optionLetter.style.flexShrink = '0';
                        optionLetter.textContent = String.fromCharCode(65 + index);
                        
                        const optionText = document.createElement('span');
                        optionText.className = 'option-text';
                        optionText.style.flex = '1';
                        optionText.style.fontSize = '14px';
                        optionText.style.lineHeight = '1.4';
                        optionText.textContent = option;
                        
                        label.appendChild(optionLetter);
                        label.appendChild(optionText);
                        optionDiv.appendChild(checkboxInput);
                        optionDiv.appendChild(label);
                        
                        optionDiv.addEventListener('click', function(e) {
                            if (e.target.type !== 'checkbox') {
                                e.preventDefault();
                                checkboxInput.checked = !checkboxInput.checked;
                            }
                            toggleMultipleAnswer(question.id, index);
                        });
                        
                        checkboxInput.addEventListener('change', function() {
                            toggleMultipleAnswer(question.id, index);
                        });
                        
                        container.appendChild(optionDiv);
                    });
                    
                    console.log('Multiple choice options rendered successfully');
                }
                
                function renderShortAnswerInput(question, container) {
                    const currentAnswer = selectedAnswers[question.id];
                    const currentValue = currentAnswer && currentAnswer.type === 'short_answer' ? currentAnswer.answer : '';
                    
                    const instruction = document.createElement('div');
                    instruction.className = 'short-answer-instruction';
                    instruction.textContent = 'Type your answer below:';
                    instruction.style.fontSize = '14px';
                    instruction.style.color = 'var(--vscode-descriptionForeground)';
                    instruction.style.marginBottom = '16px';
                    instruction.style.fontStyle = 'italic';
                    container.appendChild(instruction);
                    
                    const inputContainer = document.createElement('div');
                    inputContainer.className = 'short-answer-container';
                    inputContainer.style.width = '100%';
                    inputContainer.style.margin = '16px 0';
                    
                    const textInput = document.createElement('textarea');
                    textInput.className = 'short-answer-input';
                    textInput.placeholder = 'Enter your answer here...';
                    textInput.value = currentValue;
                    textInput.id = 'short_answer_' + question.id;
                    
                    textInput.style.width = '100%';
                    textInput.style.minHeight = '100px';
                    textInput.style.padding = '12px';
                    textInput.style.background = 'var(--vscode-input-background)';
                    textInput.style.color = 'var(--vscode-input-foreground)';
                    textInput.style.border = '2px solid var(--vscode-input-border)';
                    textInput.style.borderRadius = '8px';
                    textInput.style.fontFamily = 'var(--vscode-font-family)';
                    textInput.style.fontSize = '14px';
                    textInput.style.resize = 'vertical';
                    textInput.style.boxSizing = 'border-box';
                    
                    textInput.addEventListener('input', function() {
                        updateShortAnswer(question.id, textInput.value);
                    });
                    
                    textInput.addEventListener('focus', function() {
                        textInput.style.borderColor = 'var(--vscode-focusBorder)';
                    });
                    
                    textInput.addEventListener('blur', function() {
                        textInput.style.borderColor = 'var(--vscode-input-border)';
                    });
                    
                    inputContainer.appendChild(textInput);
                    
                    if (question.max_length) {
                        const charCounter = document.createElement('div');
                        charCounter.className = 'char-counter';
                        charCounter.textContent = currentValue.length + ' / ' + question.max_length;
                        charCounter.style.textAlign = 'right';
                        charCounter.style.fontSize = '12px';
                        charCounter.style.color = 'var(--vscode-descriptionForeground)';
                        charCounter.style.marginTop = '4px';
                        
                        textInput.addEventListener('input', function() {
                            charCounter.textContent = textInput.value.length + ' / ' + question.max_length;
                            if (textInput.value.length > question.max_length) {
                                textInput.value = textInput.value.substring(0, question.max_length);
                                charCounter.textContent = question.max_length + ' / ' + question.max_length;
                            }
                        });
                        
                        inputContainer.appendChild(charCounter);
                    }
                    
                    container.appendChild(inputContainer);
                }
                
                function generateEnhancedQuizHTML() {
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
                        '<div class="question-type"></div>' +
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
        `;
    }
}