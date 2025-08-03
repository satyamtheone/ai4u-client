import {LOGGER} from '../../logger'
export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // index of correct option
    explanation?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
}

export interface LearningGateConfig {
    enabled: boolean;
    questionsPerGate: number;
    gateFrequency: number; // Every N messages
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
    topics: string[];
}

export interface UserProgress {
    totalQuestions: number;
    correctAnswers: number;
    streak: number;
    lastQuizTime: Date;
    unlockedResponses: number;
    level: number;
}

export class LearningGateService {
    private config: LearningGateConfig;
    private userProgress: UserProgress;
    private questionBank: QuizQuestion[];
    private messageCount: number = 0;

    constructor(config: LearningGateConfig) {
        this.config = config;
        this.userProgress = {
            totalQuestions: 0,
            correctAnswers: 0,
            streak: 0,
            lastQuizTime: new Date(),
            unlockedResponses: 0,
            level: 1
        };
        this.questionBank = this.initializeQuestionBank();
    }

    public shouldShowGate(): boolean {
        if (!this.config.enabled) {
            return false;
        }

        // Check if user has unlocked responses remaining
        if (this.userProgress.unlockedResponses > 0) {
            this.userProgress.unlockedResponses--;
            return false;
        }

        // Show gate based on frequency
        this.messageCount++;
        return this.messageCount % this.config.gateFrequency === 0;
    }

    public getQuizQuestion(): QuizQuestion | null {
        if (!this.config.enabled) {
            return null;
        }

        const availableQuestions = this.questionBank.filter(q => {
            if (this.config.difficulty === 'mixed') {
                return true;
            }
            return q.difficulty === this.config.difficulty;
        });

        if (availableQuestions.length === 0) {
            return null;
        }

        // Get random question
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        return availableQuestions[randomIndex];
    }

    public submitAnswer(questionId: string, selectedAnswer: number): {
        correct: boolean;
        explanation?: string;
        unlockedResponses: number;
        levelUp?: boolean;
    } {
        const question = this.questionBank.find(q => q.id === questionId);
        if (!question) {
            throw new Error('Question not found');
        }

        const correct = selectedAnswer === question.correctAnswer;
        LOGGER(`AI4U User submitted answer:${correct ? ' correct' : ' incorrect'}`);
        // Update progress
        this.userProgress.totalQuestions++;
        this.userProgress.lastQuizTime = new Date();

        if (correct) {
            this.userProgress.correctAnswers++;
            this.userProgress.streak++;
            
            // Calculate unlocked responses based on streak
            const bonusResponses = Math.floor(this.userProgress.streak / 3);
            this.userProgress.unlockedResponses = this.config.questionsPerGate + bonusResponses;
            LOGGER(`AI4U User unlocked responses:${this.userProgress.unlockedResponses}`);
        } else {
            this.userProgress.streak = 0;
            this.userProgress.unlockedResponses = 1; // Give at least one response
        }

        // Check for level up
        const oldLevel = this.userProgress.level;
        this.userProgress.level = Math.floor(this.userProgress.correctAnswers / 10) + 1;
        const levelUp = this.userProgress.level > oldLevel;
        LOGGER(`AI4U User level up:${levelUp}`);
        return {
            correct,
            explanation: question.explanation,
            unlockedResponses: this.userProgress.unlockedResponses,
            levelUp
        };
    }

    public getProgress(): UserProgress {
        return { ...this.userProgress };
    }

    public getConfig(): LearningGateConfig {
        return { ...this.config };
    }

    public updateConfig(newConfig: Partial<LearningGateConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    public resetProgress(): void {
        this.userProgress = {
            totalQuestions: 0,
            correctAnswers: 0,
            streak: 0,
            lastQuizTime: new Date(),
            unlockedResponses: 0,
            level: 1
        };
        this.messageCount = 0;
    }

    private initializeQuestionBank(): QuizQuestion[] {
        return [
            {
                id: 'js-1',
                question: 'What does "const" keyword do in JavaScript?',
                options: [
                    'Creates a variable that can be reassigned',
                    'Creates a constant that cannot be reassigned',
                    'Creates a global variable',
                    'Creates a function'
                ],
                correctAnswer: 1,
                explanation: 'The "const" keyword creates a constant that cannot be reassigned after declaration.',
                difficulty: 'easy',
                topic: 'JavaScript'
            },
            {
                id: 'js-2',
                question: 'Which method adds an element to the end of an array?',
                options: ['push()', 'pop()', 'shift()', 'unshift()'],
                correctAnswer: 0,
                explanation: 'The push() method adds one or more elements to the end of an array.',
                difficulty: 'easy',
                topic: 'JavaScript'
            },
            {
                id: 'py-1',
                question: 'How do you create a list in Python?',
                options: ['list = {}', 'list = []', 'list = ()', 'list = ""'],
                correctAnswer: 1,
                explanation: 'Square brackets [] are used to create lists in Python.',
                difficulty: 'easy',
                topic: 'Python'
            },
            {
                id: 'ts-1',
                question: 'What is TypeScript?',
                options: [
                    'A JavaScript runtime',
                    'A superset of JavaScript with static typing',
                    'A database language',
                    'A CSS framework'
                ],
                correctAnswer: 1,
                explanation: 'TypeScript is a superset of JavaScript that adds static typing.',
                difficulty: 'medium',
                topic: 'TypeScript'
            },
            {
                id: 'react-1',
                question: 'What is JSX in React?',
                options: [
                    'A database query language',
                    'A syntax extension for JavaScript',
                    'A CSS framework',
                    'A testing library'
                ],
                correctAnswer: 1,
                explanation: 'JSX is a syntax extension for JavaScript that allows you to write HTML-like code in JavaScript.',
                difficulty: 'medium',
                topic: 'React'
            },
            {
                id: 'algo-1',
                question: 'What is the time complexity of binary search?',
                options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
                correctAnswer: 1,
                explanation: 'Binary search has O(log n) time complexity because it halves the search space in each iteration.',
                difficulty: 'hard',
                topic: 'Algorithms'
            }
        ];
    }

    public addQuestion(question: QuizQuestion): void {
        this.questionBank.push(question);
    }

    public getStats(): {
        accuracy: number;
        totalQuestions: number;
        currentStreak: number;
        level: number;
        unlockedResponses: number;
    } {
        const accuracy = this.userProgress.totalQuestions > 0 
            ? (this.userProgress.correctAnswers / this.userProgress.totalQuestions) * 100 
            : 0;

        return {
            accuracy: Math.round(accuracy),
            totalQuestions: this.userProgress.totalQuestions,
            currentStreak: this.userProgress.streak,
            level: this.userProgress.level,
            unlockedResponses: this.userProgress.unlockedResponses
        };
    }
}