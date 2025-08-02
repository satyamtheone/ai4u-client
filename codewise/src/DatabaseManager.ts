// src/DatabaseManager.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface QuizResult {
    codeHash: string;
    score: number;
    timestamp: Date;
    questionsCount: number;
    correctAnswers: number;
}

export interface UserProgress {
    concept: string;
    correctAnswers: number;
    totalAttempts: number;
    lastUpdated: Date;
}

/**
 * Simple database manager using JSON files instead of SQLite for basic functionality
 * This can be upgraded to SQLite later when needed
 */
export class DatabaseManager {
    private static instance: DatabaseManager;
    private dataPath: string;
    private quizHistoryFile: string;
    private progressFile: string;

    constructor(extensionPath: string) {
        this.dataPath = path.join(extensionPath, 'data');
        this.quizHistoryFile = path.join(this.dataPath, 'quiz_history.json');
        this.progressFile = path.join(this.dataPath, 'user_progress.json');
        
        this.initializeDataDirectory();
    }

    static getInstance(extensionPath?: string): DatabaseManager {
        if (!DatabaseManager.instance && extensionPath) {
            DatabaseManager.instance = new DatabaseManager(extensionPath);
        }
        return DatabaseManager.instance;
    }

    /**
     * Initialize data directory and files
     */
    private initializeDataDirectory(): void {
        try {
            // Create data directory if it doesn't exist
            if (!fs.existsSync(this.dataPath)) {
                fs.mkdirSync(this.dataPath, { recursive: true });
                console.log('Created data directory:', this.dataPath);
            }

            // Initialize quiz history file
            if (!fs.existsSync(this.quizHistoryFile)) {
                fs.writeFileSync(this.quizHistoryFile, JSON.stringify([], null, 2));
                console.log('Created quiz history file');
            }

            // Initialize progress file
            if (!fs.existsSync(this.progressFile)) {
                fs.writeFileSync(this.progressFile, JSON.stringify({}, null, 2));
                console.log('Created user progress file');
            }

        } catch (error) {
            console.error('Failed to initialize database:', error);
            vscode.window.showErrorMessage('Failed to initialize CodeWise database');
        }
    }

    /**
     * Save quiz result
     */
    async saveQuizResult(result: QuizResult): Promise<boolean> {
        try {
            const history = this.loadQuizHistory();
            history.push({
                ...result,
                timestamp: new Date()
            });

            fs.writeFileSync(this.quizHistoryFile, JSON.stringify(history, null, 2));
            console.log('Quiz result saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving quiz result:', error);
            return false;
        }
    }

    /**
     * Load quiz history
     */
    private loadQuizHistory(): QuizResult[] {
        try {
            const data = fs.readFileSync(this.quizHistoryFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading quiz history:', error);
            return [];
        }
    }

    /**
     * Get quiz statistics
     */
    getQuizStats(): {
        totalQuizzes: number;
        averageScore: number;
        passRate: number;
        recentQuizzes: QuizResult[];
    } {
        const history = this.loadQuizHistory();
        
        if (history.length === 0) {
            return {
                totalQuizzes: 0,
                averageScore: 0,
                passRate: 0,
                recentQuizzes: []
            };
        }

        const totalScore = history.reduce((sum, result) => sum + result.score, 0);
        const passedQuizzes = history.filter(result => result.score >= 0.7).length;
        
        return {
            totalQuizzes: history.length,
            averageScore: totalScore / history.length,
            passRate: passedQuizzes / history.length,
            recentQuizzes: history.slice(-5).reverse() // Last 5 quizzes
        };
    }

    /**
     * Update user progress for a concept
     */
    async updateProgress(concept: string, correct: boolean): Promise<void> {
        try {
            const progress = this.loadUserProgress();
            
            if (!progress[concept]) {
                progress[concept] = {
                    concept,
                    correctAnswers: 0,
                    totalAttempts: 0,
                    lastUpdated: new Date()
                };
            }

            progress[concept].totalAttempts++;
            if (correct) {
                progress[concept].correctAnswers++;
            }
            progress[concept].lastUpdated = new Date();

            fs.writeFileSync(this.progressFile, JSON.stringify(progress, null, 2));
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    }

    /**
     * Load user progress
     */
    private loadUserProgress(): { [concept: string]: UserProgress } {
        try {
            const data = fs.readFileSync(this.progressFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading user progress:', error);
            return {};
        }
    }

    /**
     * Get user progress for all concepts
     */
    getUserProgress(): UserProgress[] {
        const progress = this.loadUserProgress();
        return Object.values(progress);
    }

    /**
     * Get progress for a specific concept
     */
    getConceptProgress(concept: string): UserProgress | null {
        const progress = this.loadUserProgress();
        return progress[concept] || null;
    }

    /**
     * Clear all data (for testing or reset purposes)
     */
    async clearAllData(): Promise<boolean> {
        try {
            fs.writeFileSync(this.quizHistoryFile, JSON.stringify([], null, 2));
            fs.writeFileSync(this.progressFile, JSON.stringify({}, null, 2));
            console.log('All data cleared successfully');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    /**
     * Export data for backup
     */
    exportData(): { quizHistory: QuizResult[]; userProgress: UserProgress[] } | null {
        try {
            return {
                quizHistory: this.loadQuizHistory(),
                userProgress: this.getUserProgress()
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    /**
     * Get data file paths (for debugging)
     */
    getDataPaths(): { dataDir: string; quizHistory: string; progress: string } {
        return {
            dataDir: this.dataPath,
            quizHistory: this.quizHistoryFile,
            progress: this.progressFile
        };
    }

    /**
     * Simple health check
     */
    healthCheck(): { status: 'ok' | 'error'; message: string } {
        try {
            // Check if files exist and are readable
            fs.accessSync(this.quizHistoryFile, fs.constants.R_OK | fs.constants.W_OK);
            fs.accessSync(this.progressFile, fs.constants.R_OK | fs.constants.W_OK);
            
            // Try to load data
            this.loadQuizHistory();
            this.loadUserProgress();
            
            return { status: 'ok', message: 'Database is healthy' };
        } catch (error) {
            return { 
                status: 'error', 
                message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}` 
            };
        }
    }
}