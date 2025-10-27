# PomoTodoApp Test Suite

This test suite provides comprehensive testing for the PomoTodoApp application with a focus on achieving 100% branch coverage.

## Test Structure

The test suite includes:

1. **Test Perspective Table**: Documented in `test_perspective_table.md` with equivalence partitioning and boundary value analysis
2. **Test Code**: Comprehensive test implementations covering all functionality
3. **Test Runners**: Both browser-based and Node.js-based test execution options

## Execution Commands

### Running Tests in Browser

1. Open `test-runner.html` in your browser:
   ```bash
   open test-runner.html  # On macOS
   xdg-open test-runner.html  # On Linux
   start test-runner.html  # On Windows
   ```

2. Click the "Run All Tests" button to execute all tests

### Running Tests in Node.js

1. First, ensure you have Node.js installed

2. Run the Node.js tests directly:
   ```bash
   node node-tests.js
   ```

### Running with Jest (if available)

If you have Jest installed, you can run:

```bash
# Install Jest if not already installed
npm install --save-dev jest

# Run tests with Jest
npx jest tests.js
```

## Coverage Analysis

To get coverage information, you can use Istanbul/nyc with Jest:

```bash
# Install nyc for coverage
npm install --save-dev nyc

# Run tests with coverage
npx nyc node node-tests.js

# Or with Jest
npx nyc --reporter=html --reporter=text npm test
```

## Test Categories Covered

The test suite includes coverage for:

- ✅ Normal scenarios (primary use cases)
- ✅ Error scenarios (validation errors, exceptions)
- ✅ Boundary values (0, minimum, maximum, ±1, empty, NULL)
- ✅ Invalid type/format input
- ✅ External dependency failures (where applicable)
- ✅ Exception type and error message validation

## Test Perspective Table

For detailed test cases and expected outcomes, refer to `test_perspective_table.md`.

## Test Implementation Details

The test suite follows the Given/When/Then format:

- **Given**: The initial state or preconditions
- **When**: The action or event being tested
- **Then**: The expected outcome or postconditions

## Branch Coverage Target

The test suite is designed to achieve 100% branch coverage by testing:
- All conditional branches (if/else, switch statements)
- Success and failure paths for each function
- Boundary conditions for all numeric inputs
- Null and undefined value handling
- Error handling paths

## Files Included

- `test_perspective_table.md` - Equivalence partitioning and boundary value analysis table
- `tests.js` - Comprehensive test implementation
- `test-runner.html` - Browser-based test runner
- `node-tests.js` - Node.js-compatible test runner
- `README.md` - This file with execution instructions