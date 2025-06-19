# Testing Documentation

This directory contains all the tests for the Operantis application.

## Structure

```
tests/
├── unit/                    # Unit tests for controllers and middleware
│   ├── auth.controller.test.js
│   ├── product.controller.test.js
│   └── auth.middleware.test.js
├── integration/             # Integration tests for API routes
│   ├── auth.routes.test.js
│   └── product.routes.test.js
├── setup.js                 # Jest setup configuration
├── database.js              # Database utilities for testing
└── README.md               # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

## Test Configuration

### Jest Configuration
- **Environment**: Node.js
- **Test Timeout**: 10 seconds
- **Coverage**: HTML, LCOV, and text reports
- **Setup File**: `tests/setup.js`

### Database Configuration
- **Test Database**: `operantis_test`
- **URL**: `postgresql://postgres:password@localhost:5432/operantis_test`
- **Environment Variable**: `DATABASE_URL`

## Test Categories

### Unit Tests
Unit tests focus on testing individual functions and methods in isolation:
- **Controllers**: Test business logic without HTTP layer
- **Middleware**: Test authentication and authorization logic
- **Utilities**: Test helper functions

### Integration Tests
Integration tests test the complete API endpoints:
- **Routes**: Test HTTP endpoints with real database operations
- **Authentication**: Test login, registration, and token refresh
- **CRUD Operations**: Test create, read, update, delete operations

## Test Utilities

### Global Test Utilities
Located in `tests/setup.js`:
- `createTestUser()`: Create a test user with default or custom data
- `createTestProduct()`: Create a test product with default or custom data
- `createTestCustomer()`: Create a test customer with default or custom data

### Database Utilities
Located in `tests/database.js`:
- `cleanDatabase()`: Clean all tables before tests
- `createTestData()`: Create comprehensive test data
- `disconnect()`: Disconnect from test database

## Writing Tests

### Unit Test Example
```javascript
describe('Function Name', () => {
  it('should do something when condition is met', async () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = await functionToTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Integration Test Example
```javascript
describe('API Endpoint', () => {
  it('should return data when authenticated', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Clean Database**: Always clean the database before and after tests
3. **Mock External Dependencies**: Use mocks for external services and databases in unit tests
4. **Descriptive Names**: Use descriptive test names that explain what is being tested
5. **Arrange-Act-Assert**: Structure tests with clear arrange, act, and assert sections
6. **Coverage**: Aim for high test coverage, especially for critical business logic

## Adding New Tests

1. **Unit Tests**: Add to `tests/unit/` directory
2. **Integration Tests**: Add to `tests/integration/` directory
3. **Follow Naming Convention**: `*.test.js` or `*.spec.js`
4. **Update Documentation**: Update this README if adding new test categories

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and test database exists
2. **Environment Variables**: Set `DATABASE_URL` for test database
3. **Timeout Issues**: Increase timeout in Jest config if needed
4. **Mock Issues**: Ensure all external dependencies are properly mocked

### Database Setup
```bash
# Create test database
createdb operantis_test

# Run migrations
npx prisma migrate dev --name test_setup
``` 