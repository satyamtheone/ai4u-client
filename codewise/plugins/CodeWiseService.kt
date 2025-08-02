// CodeWiseToolWindow.kt (continued)
class CodeWiseToolWindow(private val project: Project) : JPanel(BorderLayout()) {
   private val service = project.service<CodeWiseService>()
   private val chatPanel = ChatPanel()
   private val quizPanel = QuizPanel()
   private var currentSession: String? = null
   
   init {
       setupUI()
       setupEventHandlers()
   }
   
   private fun setupUI() {
       val splitter = JBSplitter(true, 0.7f).apply {
           firstComponent = chatPanel
           secondComponent = quizPanel
       }
       
       add(splitter, BorderLayout.CENTER)
       add(createToolbar(), BorderLayout.NORTH)
   }
   
   private fun createToolbar(): JPanel {
       val toolbar = JPanel(FlowLayout(FlowLayout.LEFT))
       
       val generateButton = JButton("Generate Code").apply {
           addActionListener { 
               GlobalScope.launch { 
                   handleCodeGeneration() 
               }
           }
       }
       
       val progressBar = JProgressBar().apply {
           isVisible = false
       }
       
       toolbar.add(generateButton)
       toolbar.add(progressBar)
       
       return toolbar
   }
   
   private suspend fun handleCodeGeneration() {
       val prompt = chatPanel.getCurrentPrompt()
       if (prompt.isBlank()) return
       
       try {
           chatPanel.addMessage("Generating code...", MessageType.SYSTEM)
           
           val context = extractEditorContext()
           val result = service.generateCode(prompt, context)
           
           currentSession = result.sessionId
           
           // Show locked code
           chatPanel.addLockedCode(result.lockedCode, result.sessionId)
           
           // Load quiz
           quizPanel.loadQuiz(result.questions)
           
       } catch (e: Exception) {
           chatPanel.addMessage("Error: ${e.message}", MessageType.ERROR)
       }
   }
   
   private fun extractEditorContext(): EditorContext {
       val editor = FileEditorManager.getInstance(project).selectedTextEditor
       return EditorContext(
           language = editor?.document?.let { 
               FileDocumentManager.getInstance().getFile(it)?.fileType?.name 
           } ?: "text",
           fileName = editor?.virtualFile?.name ?: "",
           selectedText = editor?.selectionModel?.selectedText ?: "",
           projectType = detectProjectType()
       )
   }
}
