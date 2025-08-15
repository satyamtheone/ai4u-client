export class HTMLGenerator {
    
    public static getMainHTML(): string {
        return `
            <div class="mode-section">
                <div class="mode-toggle">
                    <span class="mode-indicator mode-backend">BACKEND</span>
                    <button class="btn btn-secondary" onclick="testConnection()" id="testBtn">Test Connection</button>
                </div>
                <div class="status" id="connectionStatus">Backend mode active</div>
                <div class="control-buttons">
                    <button class="btn btn-secondary" onclick="loadHistory()" id="historyBtn">Load History</button>
                    <button class="btn btn-secondary" onclick="clearSession()">Clear Session</button>
                </div>
            </div>
            
            <div class="chat-container">
                <div class="messages" id="messages"></div>
                <div class="input-container">
                    <input type="text" class="message-input" id="messageInput" placeholder="Type your message..." onkeypress="handleKeyPress(event)">
                    <button class="send-btn" id="sendBtn" onclick="sendMessage()">Send</button>
                </div>
            </div>
        `;
    }
    public static getLearningGatesHTML(): string {
        return `
            <div class="learning-gates-section" id="learningGatesSection">
                <div class="gates-header">
                    <div class="gates-title">
                        <span>🎓</span>
                        <span>Learning Gates</span>
                    </div>
                    <button class="gates-toggle" onclick="toggleLearningGates()">Disable</button>
                </div>
                <div class="progress-stats">
                    <div class="progress-item">
                        <span>Level:</span>
                        <span class="progress-value">1</span>
                    </div>
                    <div class="progress-item">
                        <span>Streak:</span>
                        <span class="progress-value">0</span>
                    </div>
                    <div class="progress-item">
                        <span>Accuracy:</span>
                        <span class="progress-value">0%</span>
                    </div>
                    <div class="progress-item">
                        <span class="unlocked-responses">0 responses left</span>
                    </div>
                </div>
            </div>
        `;
    }

    public static getCompleteBodyHTML(): string {
        return this.getMainHTML() + this.getLearningGatesHTML();
    }
}