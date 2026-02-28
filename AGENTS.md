```markdown
# AGENTS.md - Guidelines for AI Coding Agents

These guidelines are designed to ensure the creation and maintenance of high-quality, maintainable, and reliable AI coding agents. Adherence to these principles is crucial for maximizing productivity and minimizing technical debt.

## 1. DRY (Don't Repeat Yourself)

*   **Code Reuse:**  All functionalities and logic should be encapsulated within reusable modules or classes.
*   **Standardized Components:** Utilize pre-defined, well-documented components whenever possible.
*   **Abstraction:** Implement abstraction where applicable to reduce code duplication.

## 2. KISS (Keep It Simple, Stupid)

*   **Minimalist Design:** Strive for the simplest possible implementation that achieves the required functionality.
*   **Avoid Complexity:** Resist unnecessary complexity; prioritize clarity over elaborate solutions.
*   **Readability:** Code should be written in a way that is easily understandable by other developers (including yourself in the future).

## 3. SOLID Principles

*   **Single Responsibility Principle:** Each class/module should have a single, well-defined purpose.
*   **Open/Closed Principle:**  The system should be extensible without modification; new functionality should be added through new classes rather than modifying existing ones.
*   **Liskov Substitution Principle:**  Subclasses should be substitutable for their base classes without altering the correctness of the program.
*   **Interface Segregation Principle:** Clients should not be forced to depend on methods they don't use.
*   **Dependency Inversion Principle:**  High-level modules should be dependent on low-level modules, and vice-versa, through abstractions.

## 4. YAGNI (You Aren't Gonna Need It)

*   **Avoid Unnecessary Features:**  Do not add functionality that is not currently required.  Refactor if necessary, but avoid adding additional complexity.
*   **Focus on Core Functionality:** Prioritize implementing the essential requirements of the agent.

## 5. Development Practices

*   **Unit Testing:** All code must pass thorough unit tests.
*   **Test-Driven Development (TDD):**  Write tests *before* writing the code.  The tests should cover all critical functionality.
*   **Code Reviews:**  All code changes must undergo review by at least one other developer.
*   **Documentation:** Provide clear and concise documentation for all modules, classes, and functions.
*   **Versioning:**  Use a consistent versioning scheme for all files.
*   **Error Handling:** Implement robust error handling and logging.

## 6. Code Length Constraints

*   **Maximum Length:** Each file must be maintained to a maximum of 180 lines of code.
*   **Code Formatting:** Strict code formatting is enforced (e.g., using `black` or `autopep8`).

## 7. Test Coverage

*   **Target Coverage:**  Aim for at least 80% test coverage.
*   **Test Case Design:**  Tests should cover all critical scenarios and edge cases.
*   **Test Suite:** A comprehensive test suite should be established to ensure that the codebase is thoroughly tested.

## 8.  Data Considerations

*   **Data Structures:** Utilize appropriate data structures for efficient data representation and manipulation.
*   **Data Validation:** Implement data validation to ensure data quality.

## 9.  Specific Guidelines for AI Agents

*   **State Management:**  Clearly define and manage the agent's state.
*   **Action Generation:**  Ensure that actions are generated consistently and accurately.
*   **Context Management:**  Handle context effectively, especially for multi-turn interactions.

## 10.  Submission & Review

*   **Submission:** All code must be submitted to the repository.
*   **Review:**  The repository administrator will review submitted code on a regular basis.

## 11.  Tooling

*   Utilize a linter (e.g., `flake8`) for code style and potential errors.
*   Employ a code formatter (e.g., `black`) to ensure consistent formatting.

## 12.  Dependencies

*   All dependencies should be clearly documented and versioned.
*   Dependencies should be self-contained and easily reproducible.

## 13.  Maintainability Considerations

*   Naming conventions: Use meaningful and consistent naming conventions.
*   Comments:  Write clear and concise comments explaining complex logic.

## 14.  Future Considerations

*   Include potential for automated testing.
*   Design for extensibility and future enhancements.

These guidelines are a living document and may be updated as the project evolves.  It is the responsibility of all developers to adhere to these principles.
```