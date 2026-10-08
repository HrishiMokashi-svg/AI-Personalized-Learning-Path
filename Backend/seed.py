"""Seed demo courses and quiz questions (runs only if tables are empty)."""
from models import Course, QuizQuestion

COURSES = [
    ("Python Programming Basics", "Programming", "Beginner", "python,programming,coding,basics,logic", 20,
     "Learn Python syntax, data types, loops, functions and simple projects."),
    ("Data Structures & Algorithms", "Programming", "Intermediate", "dsa,algorithms,problem solving,coding,logic,interview", 40,
     "Arrays, linked lists, trees, graphs, sorting and complexity analysis."),
    ("HTML, CSS & JavaScript Fundamentals", "Web Development", "Beginner", "web,html,css,javascript,frontend,design", 25,
     "Build responsive web pages and add interactivity with JavaScript."),
    ("Backend Development with FastAPI", "Web Development", "Intermediate", "backend,api,fastapi,python,web,database", 22,
     "Create REST APIs, authentication and database-backed services."),
    ("SQL & MySQL for Beginners", "Databases", "Beginner", "sql,mysql,database,data,queries", 15,
     "Design schemas, write queries, joins and aggregate functions."),
    ("Statistics for Data Science", "Data Science", "Beginner", "statistics,math,data science,probability,analysis", 18,
     "Descriptive statistics, probability and hypothesis testing."),
    ("Data Analysis with Pandas", "Data Science", "Intermediate", "pandas,data analysis,python,data science,visualization", 20,
     "Clean, transform and visualize data using pandas and matplotlib."),
    ("Machine Learning Foundations", "AI & ML", "Intermediate", "machine learning,ai,ml,python,math,models", 35,
     "Supervised and unsupervised learning with scikit-learn."),
    ("Generative AI & Prompt Engineering", "AI & ML", "Beginner", "generative ai,llm,prompt,ai,chatbot,rag", 12,
     "Understand LLMs, prompting techniques and building RAG apps."),
    ("Effective Study & Time Management", "Soft Skills", "Beginner", "study,time management,focus,habits,productivity", 6,
     "Build study routines, beat procrastination and retain more."),
    ("Communication & Presentation Skills", "Soft Skills", "Beginner", "communication,presentation,speaking,english,teamwork", 8,
     "Speak clearly, write professionally and present with confidence."),
    ("UI/UX Design Essentials", "Design", "Beginner", "design,ui,ux,creativity,art,figma", 14,
     "Design principles, wireframing and prototyping."),
]

SYLLABI = {
    "Python Programming Basics": [
        ("Getting Started with Python", ["Installing Python and running scripts", "Variables, comments and naming", "Input, output and basic errors"]),
        ("Core Data Types", ["Numbers, strings and booleans", "Lists, tuples, sets and dictionaries", "Type conversion and string formatting"]),
        ("Logic and Reusable Code", ["Comparisons and conditional statements", "For and while loops", "Functions, parameters and return values"]),
        ("Build with Python", ["Reading and writing files", "Exceptions and debugging", "Create a command-line mini project"]),
    ],
    "Data Structures & Algorithms": [
        ("Algorithm Foundations", ["Problem decomposition and pseudocode", "Time and space complexity", "Big-O analysis"]),
        ("Linear Data Structures", ["Arrays and strings", "Linked lists", "Stacks, queues and hash tables"]),
        ("Trees and Graphs", ["Binary trees and traversal", "Binary search trees and heaps", "Graph representations and traversal"]),
        ("Searching, Sorting and Problem Solving", ["Binary search", "Sorting algorithms", "Recursion, dynamic programming and practice problems"]),
    ],
    "HTML, CSS & JavaScript Fundamentals": [
        ("HTML and Web Structure", ["Semantic HTML elements", "Links, images, lists and forms", "Accessible page structure"]),
        ("CSS and Responsive Layout", ["Selectors, cascade and box model", "Flexbox and CSS Grid", "Responsive design and media queries"]),
        ("JavaScript Essentials", ["Variables, types and operators", "Conditions, loops and functions", "Arrays, objects and DOM interaction"]),
        ("Interactive Web Project", ["Events and form validation", "Fetch and JSON basics", "Build and publish a responsive website"]),
    ],
    "Backend Development with FastAPI": [
        ("HTTP and API Foundations", ["Requests, responses and status codes", "REST resource design", "Create a FastAPI application"]),
        ("Routes and Data Validation", ["Path and query parameters", "Pydantic request and response models", "Validation and useful error responses"]),
        ("Persistence and Authentication", ["SQLAlchemy models and database sessions", "CRUD operations", "Password hashing and token-based authentication"]),
        ("Testing and Deployment", ["API tests and interactive documentation", "Configuration and environment variables", "Deploy and monitor a small API"]),
    ],
    "SQL & MySQL for Beginners": [
        ("Relational Database Basics", ["Tables, rows and columns", "Data types and primary keys", "Create databases and tables"]),
        ("Querying Data", ["SELECT, WHERE and ORDER BY", "Filtering with LIKE, IN and BETWEEN", "Aggregate functions and GROUP BY"]),
        ("Combining and Changing Data", ["INNER and OUTER JOINs", "INSERT, UPDATE and DELETE", "Subqueries and common table expressions"]),
        ("Reliable Database Design", ["Relationships and foreign keys", "Normalization fundamentals", "Indexes, transactions and a mini project"]),
    ],
    "Statistics for Data Science": [
        ("Describing Data", ["Data types and sampling", "Mean, median, mode and percentiles", "Variance, standard deviation and distributions"]),
        ("Probability Essentials", ["Events and probability rules", "Conditional probability and Bayes' theorem", "Random variables and common distributions"]),
        ("Sampling and Inference", ["Sampling distributions and the central limit theorem", "Confidence intervals", "Hypothesis testing and p-values"]),
        ("Relationships and Practical Analysis", ["Correlation and covariance", "Linear regression intuition", "Interpret statistical results responsibly"]),
    ],
    "Data Analysis with Pandas": [
        ("Python Data Analysis Toolkit", ["NumPy arrays and notebooks", "Load CSV and spreadsheet data", "Series and DataFrame fundamentals"]),
        ("Clean and Prepare Data", ["Inspecting types and missing values", "Filtering, sorting and transforming", "Duplicates, inconsistent values and data quality"]),
        ("Analyze and Combine", ["GroupBy and summary statistics", "Merge, join and reshape", "Dates, strings and categorical data"]),
        ("Visualize and Communicate", ["Charts with Matplotlib", "Exploratory data analysis", "Build a reproducible analysis project"]),
    ],
    "Machine Learning Foundations": [
        ("Machine Learning Workflow", ["Problem framing and datasets", "Features, labels and data leakage", "Train, validation and test splits"]),
        ("Supervised Learning", ["Linear and logistic regression", "Decision trees and ensemble basics", "Classification and regression metrics"]),
        ("Unsupervised Learning", ["Clustering with k-means", "Dimensionality reduction concepts", "When to use unsupervised methods"]),
        ("Model Improvement and Delivery", ["Preprocessing pipelines and cross-validation", "Overfitting, regularization and tuning", "Build and evaluate an end-to-end model"]),
    ],
    "Generative AI & Prompt Engineering": [
        ("Generative AI and Language Models", ["Tokens, context windows and next-token prediction", "Strengths, limitations and responsible use", "Choosing a model for a task"]),
        ("Prompting Fundamentals", ["Clear instructions and context", "Few-shot examples and structured outputs", "Iterating and evaluating prompts"]),
        ("Working with Model APIs", ["API requests and response handling", "Parameters, latency and cost awareness", "Safety, privacy and output validation"]),
        ("Build a Grounded AI Assistant", ["Embeddings and semantic search concepts", "Retrieval-augmented generation workflow", "Prototype and evaluate a small assistant"]),
    ],
    "Effective Study & Time Management": [
        ("Set Goals and Make a Plan", ["Turn long-term goals into weekly milestones", "Estimate effort and prioritize tasks", "Create a realistic study schedule"]),
        ("Focus and Manage Time", ["Time blocking and focused study sessions", "Reduce distractions and procrastination", "Break large tasks into manageable steps"]),
        ("Learn and Remember", ["Active recall and practice questions", "Spaced repetition", "Interleaving and useful study notes"]),
        ("Review and Sustain Habits", ["Track progress and reflect weekly", "Plan breaks and avoid burnout", "Adjust routines when plans change"]),
    ],
    "Communication & Presentation Skills": [
        ("Clear Everyday Communication", ["Audience, purpose and key messages", "Active listening and asking useful questions", "Concise professional writing"]),
        ("Speaking with Confidence", ["Organize a short talk", "Voice, pacing and body language", "Manage nerves and respond to questions"]),
        ("Present Ideas Visually", ["Build a clear story arc", "Design readable slides", "Use examples and evidence effectively"]),
        ("Practice and Collaborate", ["Give and receive constructive feedback", "Facilitate discussions and meetings", "Deliver a final presentation"]),
    ],
    "UI/UX Design Essentials": [
        ("Understand Users and Problems", ["User-centered design principles", "Personas and user journeys", "Write problem statements and requirements"]),
        ("Information Architecture and Wireframes", ["Organize content and navigation", "Sketch low-fidelity wireframes", "Map task flows"]),
        ("Visual and Interaction Design", ["Layout, hierarchy, color and typography", "Reusable components and design systems", "Interaction states and accessible design"]),
        ("Prototype and Test", ["Build an interactive prototype", "Plan and run usability tests", "Iterate on findings and present a case study"]),
    ],
}

# (topic, question, options, answer_index, explanation)
QUESTIONS = [
    ("Python", "Which keyword defines a function in Python?", ["func", "def", "function", "lambda only"], 1, "Functions are defined with def."),
    ("Python", "What is the output of len([1, 2, 3])?", ["2", "3", "4", "Error"], 1, "The list has three items."),
    ("Python", "Which data type is immutable?", ["list", "dict", "tuple", "set"], 2, "Tuples cannot be changed after creation."),
    ("Python", "How do you start a comment in Python?", ["//", "#", "/*", "--"], 1, "# starts a single-line comment."),
    ("Python", "What does range(3) produce?", ["1,2,3", "0,1,2", "0,1,2,3", "1,2"], 1, "range(3) gives 0, 1, 2."),
    ("SQL", "Which statement retrieves data from a table?", ["GET", "SELECT", "FETCH", "PULL"], 1, "SELECT reads rows."),
    ("SQL", "Which clause filters rows?", ["ORDER BY", "GROUP BY", "WHERE", "LIMIT"], 2, "WHERE filters rows before grouping."),
    ("SQL", "Which join returns only matching rows from both tables?", ["LEFT JOIN", "INNER JOIN", "FULL JOIN", "CROSS JOIN"], 1, "INNER JOIN keeps matches only."),
    ("SQL", "What does PRIMARY KEY guarantee?", ["Unique and not null", "Only numbers", "Can repeat", "Is optional"], 0, "A primary key uniquely identifies each row."),
    ("SQL", "Which function counts rows?", ["SUM()", "COUNT()", "TOTAL()", "ROWS()"], 1, "COUNT() counts rows."),
    ("Web", "Which tag creates a hyperlink in HTML?", ["<link>", "<a>", "<href>", "<url>"], 1, "The anchor tag <a> makes links."),
    ("Web", "Which CSS property changes text color?", ["font-color", "text-color", "color", "foreground"], 2, "Use the color property."),
    ("Web", "Which method parses a JSON string in JavaScript?", ["JSON.parse()", "JSON.stringify()", "parse.JSON()", "toJSON()"], 0, "JSON.parse turns a string into an object."),
    ("Web", "What does CSS stand for?", ["Creative Style Sheets", "Cascading Style Sheets", "Computer Style Sheets", "Colorful Style Sheets"], 1, "Cascading Style Sheets."),
    ("Web", "Which HTTP method is typically used to create a resource?", ["GET", "POST", "DELETE", "HEAD"], 1, "POST creates new resources."),
    ("AI & ML", "What does RAG stand for?", ["Rapid AI Generation", "Retrieval-Augmented Generation", "Random Answer Generator", "Recursive Agent Graph"], 1, "RAG retrieves documents to ground LLM answers."),
    ("AI & ML", "Which is a supervised learning task?", ["Clustering", "Classification", "Dimensionality reduction", "Association"], 1, "Classification uses labeled data."),
    ("AI & ML", "What is overfitting?", ["Model too simple", "Model memorizes training data", "Model has no data", "Model is too fast"], 1, "It performs well on training data but poorly on new data."),
    ("AI & ML", "What is an embedding?", ["A numeric vector representing meaning", "A database index", "A type of loop", "A GPU feature"], 0, "Embeddings place similar meanings close together."),
    ("AI & ML", "What does LLM stand for?", ["Large Language Model", "Linear Learning Machine", "Logical Layer Mapping", "Long Loop Memory"], 0, "Large Language Model."),
]


def seed(db):
    if db.query(Course).count() == 0:
        for t, cat, lvl, tags, hrs, desc in COURSES:
            db.add(Course(title=t, category=cat, level=lvl, tags=tags, duration_hours=hrs, description=desc))
        db.flush()
    for course in db.query(Course).all():
        if not course.lessons and course.title in SYLLABI:
            course.lessons = [
                {"title": title, "topics": topics}
                for title, topics in SYLLABI[course.title]
            ]
    if db.query(QuizQuestion).count() == 0:
        for topic, q, opts, ans, exp in QUESTIONS:
            db.add(QuizQuestion(topic=topic, question=q, options=opts, answer_index=ans, explanation=exp))
    db.commit()
