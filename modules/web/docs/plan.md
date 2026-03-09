

The whole idea was to handle test cases in a more structured way. We want to be able to define test cases in a clear and concise manner

- Based on markdown filess i have alot of test cases defined in markdown files and defined as pattern and massive 

Current State of Testing Documentation

There are 26 markdown files in modules/web/docs/testing/ plus 3 error-testing files in the project root and an Auto Run doc. This is extensive but has significant issues.


Key Problems



Massive bloat - Many files are 800-1200+ lines of verbose, repetitive content with excessive examples, templates, and organizational scaffolding (champion programs, office hours schedules, Grafana setup, etc.)


Not grounded in reality - Documents describe aspirational programs (Testing Champions, quarterly reviews, Slack channels) and fake metrics (specific coverage percentages) rather than the actual codebase state. The tests currently fail (standalone component declared incorrectly).



Before I proceed, I want to clarify what you're looking for:



It would be great to define PRD's per feature ideanitfy exitsing features and then define the test cases for those features. This way we can have a clear mapping between features and their corresponding test cases, making it easier to manage and maintain our testing documentation.


Instead of JUMPING into writing test cases, we should first focus on defining the Product Requirement Documents (PRDs) for each feature. This will help us identify the existing features and their functionalities, which will then allow us to create specific test cases that are directly linked to those features. By doing this, we can ensure that our testing documentation is organized, relevant, and easier to maintain over time.


Check existing Test cases GENERATED files find PATTERNS and FIGURE what is the best way to handle 

- I see example-tests/ defined check if need this and FIX all dcos for testing.