// QuizPanel.kt
class QuizPanel : JPanel(BorderLayout()) {
   private var currentQuestions: List<Question> = emptyList()
   private var userAnswers: MutableMap<Int, Int> = mutableMapOf()
   private val questionContainer = JPanel()
   
   fun loadQuiz(questions: List<Question>) {
       currentQuestions = questions
       userAnswers.clear()
       renderQuestions()
   }
   
   private fun renderQuestions() {
       questionContainer.removeAll()
       questionContainer.layout = BoxLayout(questionContainer, BoxLayout.Y_AXIS)
       
       currentQuestions.forEachIndexed { index, question ->
           val questionPanel = createQuestionPanel(index, question)
           questionContainer.add(questionPanel)
           questionContainer.add(Box.createVerticalStrut(10))
       }
       
       val submitButton = JButton("Submit Quiz").apply {
           addActionListener { submitQuiz() }
       }
       
       questionContainer.add(submitButton)
       
       removeAll()
       add(JScrollPane(questionContainer), BorderLayout.CENTER)
       revalidate()
       repaint()
   }
   
   private fun createQuestionPanel(index: Int, question: Question): JPanel {
       val panel = JPanel().apply {
           layout = BoxLayout(this, BoxLayout.Y_AXIS)
           border = BorderFactory.createTitledBorder("Question ${index + 1}")
       }
       
       panel.add(JLabel(question.text))
       panel.add(Box.createVerticalStrut(5))
       
       val buttonGroup = ButtonGroup()
       question.options.forEachIndexed { optionIndex, option ->
           val radioButton = JRadioButton(option).apply {
               addActionListener { 
                   userAnswers[index] = optionIndex 
               }
           }
           buttonGroup.add(radioButton)
           panel.add(radioButton)
       }
       
       return panel
   }
   
   private fun submitQuiz() {
       GlobalScope.launch {
           try {
               val service = project.service<CodeWiseService>()
               val result = service.submitQuiz(currentSession!!, userAnswers)
               
               SwingUtilities.invokeLater {
                   if (result.passed) {
                       showSuccess(result)
                   } else {
                       showFailure(result)
                   }
               }
               
           } catch (e: Exception) {
               SwingUtilities.invokeLater {
                   Messages.showErrorDialog(
                       "Failed to submit quiz: ${e.message}",
                       "Error"
                   )
               }
           }
       }
   }
}