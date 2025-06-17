# MCP FASTA - Testing Suite

This directory contains a comprehensive testing framework for the MCP FASTA server, built with Vitest and TypeScript for superior ES module support and performance.

## Overview

The testing suite provides thorough coverage of all 14 FASTA manipulation tools through both unit and integration testing, ensuring reliability and correctness of the MCP server implementation.

## Structure

```
tests/
├── unit/                     # Unit tests for individual components
│   ├── fastaParser.test.ts         # Tests for FASTA parsing utilities
│   ├── calculateGC.test.ts         # Tests for GC content calculation
│   ├── loadFasta.test.ts           # Tests for FASTA file loading
│   ├── reverseComplement.test.ts   # Tests for reverse complement generation
│   ├── validateSequence.test.ts    # Tests for sequence validation
│   ├── translateSequence.test.ts   # Tests for DNA translation
│   ├── searchSequence.test.ts      # Tests for sequence searching
│   ├── getSequence.test.ts         # Tests for sequence retrieval
│   ├── filterFasta.test.ts         # Tests for FASTA filtering
│   ├── writeFasta.test.ts          # Tests for FASTA writing
│   ├── splitFasta.test.ts          # Tests for FASTA splitting
│   ├── mergeFasta.test.ts          # Tests for FASTA merging
│   ├── extractSubsequence.test.ts  # Tests for subsequence extraction
│   ├── findDuplicates.test.ts      # Tests for duplicate detection
│   └── summarizeFasta.test.ts      # Tests for FASTA summarization
├── integration/              # Integration tests
│   └── mcpServer.test.ts           # End-to-end MCP server tests
├── fixtures/                 # Test data and fixtures
│   └── fastaData.ts                # Comprehensive FASTA test datasets
├── utils/                    # Testing utilities
│   └── testHelpers.ts              # Helper functions and validators
├── setup.ts                  # Test environment setup
└── README.md                # This file
```

## Test Framework

We use **Vitest** as our testing framework, providing:
- Native TypeScript and ES module support
- Superior performance compared to Jest
- Excellent development experience with hot reloading
- Comprehensive coverage reporting via V8
- Jest-compatible API for easy migration

## Available Tools Coverage

Our test suite covers all 14 FASTA manipulation tools:

### Core Tools
1. **load_fasta** - Load and parse FASTA files into metadata records
2. **summarize_fasta** - Generate comprehensive statistics about FASTA files
3. **get_sequence_by_id** - Retrieve specific sequences by identifier
4. **write_fasta** - Write sequences to FASTA format files

### Analysis Tools
5. **calculate_gc_content** - Calculate nucleotide composition and GC content
6. **validate_sequence** - Validate sequences against DNA/RNA/protein patterns
7. **search_sequence** - Search for patterns within sequences
8. **find_duplicates** - Identify duplicate sequences

### Manipulation Tools
9. **reverse_complement** - Generate reverse complement of DNA sequences
10. **translate_sequence** - Translate DNA to protein using genetic codes
11. **extract_subsequence** - Extract specific regions from sequences
12. **filter_fasta_by_length** - Filter sequences by length criteria

### File Operations
13. **split_fasta** - Split FASTA files by various criteria
14. **merge_fasta** - Merge multiple FASTA files with duplicate handling

## Running Tests

### Prerequisites
```bash
npm install
npm run build  # Required for integration tests
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (automatic re-run on changes)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage

# Run tests with interactive UI
npm run test:ui
```

### Coverage Goals

We maintain high test coverage standards:
- **Overall coverage**: 85%+
- **Functions**: 90%+
- **Lines**: 85%+
- **Branches**: 80%+

## Test Categories

### Unit Tests (200+ tests)

#### FASTA Parser Tests (40+ tests)
- Parse single and multiple sequences
- Handle various header formats and special characters
- Support wrapped sequences and mixed line endings
- Graceful error handling for malformed input

#### Tool-Specific Tests (160+ tests)
Each tool has comprehensive tests covering:
- **Basic functionality**: Core operations with valid input
- **Parameter validation**: Required/optional parameters, type checking
- **Edge cases**: Empty files, large files, malformed data
- **Error handling**: File not found, invalid parameters
- **Output format**: JSON structure, file output validation
- **Performance**: Large dataset handling, execution time limits

### Integration Tests (50+ tests)

#### Server Lifecycle
- MCP server startup and shutdown
- Process communication via JSON-RPC
- Error recovery and graceful degradation

#### Tool Registration
- All 14 tools properly registered and discoverable
- Correct tool definitions and parameter schemas
- Help text and documentation completeness

#### End-to-End Workflows
- Complex tool chains (load → analyze → manipulate → output)
- Data consistency across multiple operations
- File I/O operations with proper cleanup

#### Performance Testing
- Concurrent request handling
- Large file processing (1000+ sequences)
- Memory usage and leak detection

#### Error Scenarios
- Invalid tool names and parameters
- Malformed JSON-RPC requests
- File system permission issues

## Test Data and Fixtures

### Comprehensive FASTA Datasets (`fixtures/fastaData.ts`)

#### Basic Sequences
- Single and multiple sequence files
- DNA, RNA, and protein sequences
- Various sequence lengths (short, medium, long)

#### Special Cases
- Empty sequences and files
- Wrapped sequences with different line lengths
- Mixed case sequences
- Sequences with N bases and gaps

#### Format Variations
- Different header formats (GenBank, EMBL, custom)
- Special characters in headers and sequences
- Unix/Windows/mixed line endings

#### Test Scenarios
- High/low GC content sequences
- Palindromic sequences for reverse complement testing
- Duplicate sequences for deduplication testing
- Coding sequences for translation testing
- Large sequences for performance testing

### Test Utilities (`utils/testHelpers.ts`)

#### Sequence Validation
- DNA/RNA/protein format validators
- Sequence composition calculators
- Reverse complement generation
- Translation utilities

#### File Operations
- Temporary file creation and cleanup
- FASTA format validation
- Performance measurement utilities

#### MCP Testing
- JSON-RPC request/response validators
- Mock request generators
- Response structure validation

## Configuration

### Vitest Configuration (`vitest.config.ts`)
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      thresholds: {
        branches: 80,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
  },
});
```

### Coverage Exclusions
- Node modules and build artifacts
- Test files themselves
- TypeScript declaration files

## Development Workflow

### Test-Driven Development
1. Write failing tests for new features
2. Implement minimum code to pass tests
3. Refactor while maintaining test coverage
4. Add edge case and error handling tests

### Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names explaining expected behavior
- Follow Arrange-Act-Assert pattern
- Include both positive and negative test cases

### Debugging Tests
```bash
# Run specific test file
npm test calculateGC.test.ts

# Run tests matching pattern
npm test -- --reporter=verbose --testNamePattern="GC content"

# Debug with Node.js inspector
npm test -- --inspect-brk

# Run without coverage for faster debugging
npm test -- --coverage=false
```

## Common Test Patterns

### File-Based Testing
```typescript
beforeAll(() => {
  // Create test files
  writeFileSync(testFile, testData);
});

afterAll(() => {
  // Clean up test files
  if (existsSync(testFile)) unlinkSync(testFile);
});
```

### Error Testing
```typescript
it('should handle file not found', async () => {
  await expect(tool.handler({ 
    path: 'non_existent.fasta' 
  })).rejects.toThrow();
});
```

### Performance Testing
```typescript
it('should handle large files efficiently', async () => {
  const { result, timeMs } = await TestUtils.measureExecutionTime(
    () => tool.handler({ path: largeFile })
  );
  expect(timeMs).toBeLessThan(5000);
});
```

### Integration Testing
```typescript
it('should work via MCP protocol', async () => {
  const request = TestUtils.createMCPRequest('tools/call', {
    name: 'tool_name',
    arguments: { path: testFile }
  });
  
  const response = await sendMCPRequest(request);
  expect(TestUtils.validateMCPResponse(response)).toBe(true);
});
```

## Performance Benchmarks

### Target Performance Standards
- **File Loading**: < 1s for 10MB FASTA files
- **GC Calculation**: < 2s for 1000 sequences
- **Reverse Complement**: < 1s for 100kb sequences
- **Translation**: < 3s for 50kb coding sequences
- **Search Operations**: < 5s for pattern search in 1MB files

### Memory Usage
- Peak memory < 500MB for largest test cases
- No memory leaks detected in long-running tests
- Efficient cleanup of temporary files

## Continuous Integration

### Pre-commit Checks
```bash
npm run build          # TypeScript compilation
npm test              # All tests pass
npm run test:coverage # Coverage thresholds met
```

### CI Pipeline Requirements
- Tests must pass on Node.js 18.x and 20.x
- Coverage thresholds must be maintained
- No test timeout failures
- All integration tests must pass

## Why Vitest over Jest?

We chose Vitest for several advantages:

1. **Native ES Module Support**: No complex configuration needed
2. **Superior TypeScript Integration**: Faster compilation and better error reporting
3. **Performance**: Significantly faster test execution
4. **Modern Tooling**: Built on Vite with excellent developer experience
5. **Compatibility**: Jest-compatible API makes migration seamless
6. **Hot Reloading**: Instant feedback during development

## Contributing

### Adding New Tests
1. Create test file in appropriate directory (`unit/` or `integration/`)
2. Follow existing naming conventions (`toolName.test.ts`)
3. Include comprehensive test cases (positive, negative, edge cases)
4. Update test fixtures if new data patterns needed
5. Ensure coverage thresholds are maintained

### Test Quality Guidelines
- **Descriptive Names**: Clearly state what is being tested
- **Single Responsibility**: Each test validates one specific behavior
- **Deterministic**: Tests should produce consistent results
- **Independent**: Tests should not depend on each other
- **Comprehensive**: Cover normal cases, edge cases, and error conditions

### Best Practices
- Use `beforeAll`/`afterAll` for expensive setup/cleanup
- Use `beforeEach`/`afterEach` for test isolation
- Mock external dependencies appropriately
- Use real implementations in integration tests
- Validate both success and failure scenarios
- Include performance tests for critical operations

## Troubleshooting

### Common Issues

1. **Test Timeouts**
   - Increase timeout in vitest.config.ts
   - Check for infinite loops or hanging operations
   - Ensure proper cleanup of resources

2. **File System Issues**
   - Verify test file paths are correct
   - Check file permissions
   - Ensure proper cleanup in afterAll hooks

3. **Integration Test Failures**
   - Verify server builds successfully (`npm run build`)
   - Check that dist/ directory exists
   - Ensure no port conflicts

4. **Coverage Issues**
   - Review uncovered code paths
   - Add tests for error conditions
   - Verify test file inclusion patterns

### Debug Commands
```bash
# Verbose test output
npm test -- --reporter=verbose

# Run single test file
npm test specific.test.ts

# Run with debugging
npm test -- --inspect-brk

# Check coverage details
npm run test:coverage -- --reporter=html
```

This comprehensive testing framework ensures the reliability and correctness of the MCP FASTA server while providing an excellent development experience through modern tooling and best practices.