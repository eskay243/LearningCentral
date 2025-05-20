# Assessment and Quiz Creation Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Assessment Types Overview](#assessment-types-overview)
3. [Quiz Creation Process](#quiz-creation-process)
4. [Assignment Creation Process](#assignment-creation-process)
5. [Question Types and Best Practices](#question-types-and-best-practices)
6. [Configuring Assessment Settings](#configuring-assessment-settings)
7. [Grading and Feedback](#grading-and-feedback)
8. [Assessment Analytics](#assessment-analytics)
9. [Assessment Security](#assessment-security)
10. [Troubleshooting](#troubleshooting)

## Introduction

This guide provides detailed instructions for creating and managing assessments within the Codelab Educare Learning Management System (LMS). It covers everything from simple quizzes to complex assignments, helping mentors and administrators create effective evaluation tools.

## Assessment Types Overview

The LMS supports several assessment formats to evaluate student learning:

### Quizzes
- Self-graded, automated assessments
- Immediate feedback and scoring
- Useful for knowledge checks and formative assessment
- Support for various question types
- Optional time limits and attempt restrictions

### Assignments
- Complex, manually-graded assessments
- Support for file submissions and text responses
- Detailed feedback capabilities
- Rubric-based grading
- Plagiarism detection options

### Practical Assessments
- Hands-on skill demonstrations
- Project-based evaluations
- Portfolio submissions
- Code execution and validation
- Peer review options

### Discussions
- Participation-based assessments
- Critical thinking evaluation
- Peer interaction and feedback
- Topic-based contributions
- Qualitative and quantitative grading options

## Quiz Creation Process

### Step 1: Quiz Setup

1. **Navigate to Quiz Creation**
   - Go to the desired course
   - Select the appropriate module and lesson
   - Click "Add Assessment" > "Quiz"

2. **Configure Basic Settings**
   - Title: Name your quiz
   - Description: Provide instructions and context
   - Time Limit: Set duration (if applicable)
   - Attempts: Configure allowed number of attempts
   - Due Date: Set completion deadline
   - Points: Establish total point value

3. **Set Visibility and Availability**
   - Publication status (draft/published)
   - Release date and time
   - Access restrictions (prerequisites, etc.)
   - Student visibility options

### Step 2: Question Creation

1. **Add Quiz Questions**
   - Click "Add Question"
   - Select question type
   - Enter question text
   - Add any media elements (images, videos, etc.)
   - Configure answer options

2. **Configure Question Settings**
   - Point value for the question
   - Partial credit options (if applicable)
   - Time limit per question (optional)
   - Difficulty level (for analytics)
   - Tags for categorization

3. **Set Correct Answers**
   - Define correct response(s)
   - Specify matching patterns for text answers
   - Configure scoring criteria
   - Add feedback for correct/incorrect answers

### Step 3: Quiz Organization

1. **Question Arrangement**
   - Reorder questions using drag-and-drop
   - Create question groups or sections
   - Set sequential or random question delivery
   - Configure page breaks for multi-page quizzes

2. **Random Question Banks**
   - Create question pools for randomization
   - Set number of questions to pull from each pool
   - Configure difficulty distribution
   - Enable question variations

### Step 4: Review and Publish

1. **Preview the Quiz**
   - Test the quiz from student perspective
   - Verify correct answers and scoring
   - Check timer functionality
   - Review question display and navigation

2. **Publish or Schedule**
   - Save as draft for further edits
   - Publish immediately
   - Schedule future publication
   - Set up prerequisite conditions

## Assignment Creation Process

### Step 1: Assignment Setup

1. **Navigate to Assignment Creation**
   - Go to the desired course
   - Select the appropriate module and lesson
   - Click "Add Assessment" > "Assignment"

2. **Configure Basic Settings**
   - Title: Name your assignment
   - Description: Provide detailed instructions
   - Due Date: Set submission deadline
   - Points: Establish total point value
   - Submission Type: Define expected deliverables

3. **Set Submission Requirements**
   - File upload settings (types, size limits)
   - Text response parameters
   - Multiple component submissions
   - Required vs. optional elements
   - Group submission options

### Step 2: Create Rubric (Optional)

1. **Define Rubric Criteria**
   - Create evaluation categories
   - Specify criteria descriptions
   - Set point allocations
   - Define performance level descriptions
   - Configure score calculation

2. **Rubric Settings**
   - Visibility to students
   - Score display options
   - Weighting of different criteria
   - Minimum passing thresholds

### Step 3: Configure Advanced Options

1. **Submission Validation**
   - Plagiarism detection settings
   - Required element checks
   - Word/character count requirements
   - Technical validation for code/project submissions

2. **Feedback Settings**
   - Automatic feedback upon submission
   - Staged feedback release
   - Peer feedback configuration
   - Self-assessment options

### Step 4: Review and Publish

1. **Preview the Assignment**
   - Review from student perspective
   - Verify all instructions are clear
   - Test submission process
   - Check rubric functionality

2. **Publish or Schedule**
   - Save as draft for further edits
   - Publish immediately
   - Schedule future publication
   - Set up prerequisite conditions

## Question Types and Best Practices

### Multiple Choice Questions
- **Format**: One correct answer from several options
- **Best Practices**:
  - Keep options similar in length and structure
  - Avoid obvious incorrect answers
  - Use plausible distractors based on common misconceptions
  - Make options mutually exclusive
  - Avoid negative phrasing when possible

### Multiple Answer Questions
- **Format**: Multiple correct answers from several options
- **Best Practices**:
  - Clearly state how many answers to select
  - Consider partial credit settings
  - Ensure independence of correct options
  - Balance number of correct and incorrect options
  - Use consistent formatting across options

### True/False Questions
- **Format**: Binary choice between true and false
- **Best Practices**:
  - Avoid ambiguity in statements
  - Use absolute terms sparingly
  - Test significant concepts, not trivial details
  - Keep statements concise
  - Focus on a single concept per question

### Matching Questions
- **Format**: Match items from two different lists
- **Best Practices**:
  - Use homogeneous content within each list
  - Provide more options in the answer column
  - Keep matching sets reasonable in size
  - Arrange options alphabetically to avoid pattern cues
  - Clearly state the matching relationship

### Fill-in-the-Blank Questions
- **Format**: Complete a sentence by filling in missing word(s)
- **Best Practices**:
  - Accept multiple correct answers/spellings
  - Place blanks strategically, not at the beginning
  - Provide clear context
  - Consider case sensitivity settings
  - Use for specific terminology or key concepts

### Essay/Short Answer Questions
- **Format**: Open-ended responses requiring elaboration
- **Best Practices**:
  - Provide clear evaluation criteria
  - Set appropriate word/character limits
  - Use specific, actionable verbs in the prompt
  - Consider creating a grading rubric
  - Provide example responses for graders

### Coding Questions
- **Format**: Programming challenges with code submission
- **Best Practices**:
  - Provide clear requirements and constraints
  - Include sample inputs and expected outputs
  - Set up appropriate testing cases
  - Define scoring criteria for partially working solutions
  - Consider performance metrics in evaluation

## Configuring Assessment Settings

### Time Management

1. **Time Limits**
   - Setting appropriate duration
   - Accommodations for special needs
   - Grace periods for submission
   - Time display options

2. **Due Dates and Availability Windows**
   - Setting open and close dates
   - Late submission policies
   - Time zone considerations
   - Calendar integration

### Attempt Management

1. **Multiple Attempts**
   - Setting attempt limits
   - Scoring methods across attempts (highest, latest, average)
   - Time between attempts
   - Question variation between attempts

2. **Progress Saving**
   - Auto-save functionality
   - Resume capabilities
   - Handling session timeouts
   - Draft saving options

### Assessment Display

1. **Question Delivery**
   - All-at-once vs. sequential presentation
   - Randomization options
   - Question grouping
   - Page breaks and navigation

2. **Results Display**
   - Immediate vs. delayed feedback
   - Score presentation
   - Correct answer reveal settings
   - Performance comparison

## Grading and Feedback

### Automated Grading

1. **Quiz Scoring**
   - Points allocation
   - Partial credit configuration
   - Negative marking options
   - Score calculation methods
   - Rounding and score adjustments

2. **Answer Validation**
   - Text answer matching methods
   - Case sensitivity options
   - Numerical response tolerance
   - Pattern matching for complex answers

### Manual Grading

1. **Assignment Evaluation Workflow**
   - Accessing submitted assignments
   - Using rubrics for consistent grading
   - Providing feedback annotations
   - Recording scores and comments
   - Batch grading features

2. **Feedback Tools**
   - Text comments
   - Audio/video feedback
   - Inline annotations
   - File attachments
   - Sample solutions

### Grading Policies

1. **Grade Calculation**
   - Weighted categories
   - Dropping lowest scores
   - Extra credit handling
   - Curve adjustments
   - Minimum passing scores

2. **Grade Appeals and Adjustments**
   - Student review process
   - Score adjustment procedures
   - Regrade requests
   - Documentation requirements

## Assessment Analytics

### Performance Metrics

1. **Individual Assessment Analytics**
   - Completion rates
   - Score distribution
   - Average time spent
   - Question difficulty analysis
   - Attempt patterns

2. **Question Analysis**
   - Discrimination index
   - Difficulty index
   - Distractor efficiency
   - Response distribution
   - Time spent per question

### Using Analytics for Improvement

1. **Identifying Problem Areas**
   - Locating challenging content
   - Finding potentially flawed questions
   - Recognizing knowledge gaps
   - Detecting potential academic integrity issues

2. **Assessment Refinement**
   - Adjusting difficulty based on data
   - Improving question clarity
   - Modifying distractors
   - Balancing assessment length
   - Refining rubrics based on outcomes

## Assessment Security

### Academic Integrity Measures

1. **Quiz Security**
   - Randomizing questions and answers
   - Time limitations
   - Restricting results visibility
   - Browser lockdown options
   - IP restriction options

2. **Plagiarism Prevention**
   - Similarity detection tools
   - Reference checking
   - Version comparisons across submissions
   - Historical submission database

### Data Security

1. **Submission Security**
   - Secure file upload handling
   - Backup and recovery systems
   - Access controls for submissions
   - Encryption for sensitive assessments

2. **Grading Security**
   - Role-based access for graders
   - Audit trails for grade changes
   - Multi-approver workflows for high-stakes assessments
   - Grade release security

## Troubleshooting

### Common Assessment Issues

1. **Quiz Problems**
   - Questions not displaying correctly
   - Timer malfunctions
   - Scoring discrepancies
   - Submission failures
   - Access restrictions issues

2. **Assignment Challenges**
   - File upload problems
   - Rubric calculation errors
   - Feedback display issues
   - Due date confusion
   - Batch operations failures

### Support Resources

1. **Technical Assistance**
   - Support contact information
   - Knowledge base articles
   - Video tutorials
   - Troubleshooting flowcharts
   - Community forums

2. **Best Practices Repository**
   - Example assessments by discipline
   - Question banks and templates
   - Rubric libraries
   - Assessment design guides
   - Accessibility guidelines

## Technical Implementation

### Quiz API Endpoints

The LMS implements REST API endpoints for quiz management:

```javascript
// Create a new quiz
app.post('/api/quizzes', isAuthenticated, hasRole([UserRole.ADMIN, UserRole.MENTOR]), async (req, res) => {
  try {
    const quiz = await storage.createQuiz(req.body);
    res.status(201).json(quiz);
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({ message: "Failed to create quiz" });
  }
});

// Get quizzes for a lesson
app.get('/api/lessons/:lessonId/quizzes', async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const quizzes = await storage.getQuizzesByLesson(lessonId);
    res.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ message: "Failed to fetch quizzes" });
  }
});

// Submit a quiz attempt
app.post('/api/quiz-attempts', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.claims.sub;
    
    const attempt = await storage.submitQuizAttempt({
      ...req.body,
      userId,
    });
    
    res.status(201).json(attempt);
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);
    res.status(500).json({ message: "Failed to submit quiz attempt" });
  }
});
```

### Quiz Data Model

The database schema includes the following for quizzes and assessments:

```typescript
// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description"),
  timeLimit: integer("time_limit"), // In minutes
  passingScore: integer("passing_score"),
  attempts: integer("attempts"),
  randomizeQuestions: boolean("randomize_questions").default(false),
  showCorrectAnswers: boolean("show_correct_answers").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz questions table
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  question: text("question").notNull(),
  questionType: text("question_type").notNull().default("multiple_choice"),
  options: jsonb("options"),
  correctAnswer: jsonb("correct_answer"),
  points: integer("points").notNull().default(1),
  orderIndex: integer("order_index").notNull().default(0),
  explanation: text("explanation"),
});

// Quiz attempts table
export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  answers: jsonb("answers"),
  score: integer("score"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  timeSpent: integer("time_spent"), // In seconds
});

// Assignments table
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date"),
  points: integer("points").notNull().default(100),
  submissionType: text("submission_type").notNull().default("file"),
  fileTypes: text("file_types").array(),
  rubric: jsonb("rubric"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assignment submissions table
export const assignmentSubmissions = pgTable("assignment_submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content"),
  fileUrl: text("file_url"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  grade: integer("grade"),
  feedback: text("feedback"),
  gradedBy: varchar("graded_by").references(() => users.id),
  gradedAt: timestamp("graded_at"),
});
```