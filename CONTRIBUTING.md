# Contributing to Enterprise Multimodal Incident Resolution Platform

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

All contributors are expected to follow these principles:
- **Respect**: Treat all contributors with kindness and respect
- **Inclusivity**: Welcome contributors from all backgrounds
- **Professionalism**: Maintain professional communication
- **Collaboration**: Work together to solve problems

## Getting Started

### 1. Fork and Clone
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/incident-resolver.git
cd incident-resolver

# Add upstream remote
git remote add upstream https://github.com/original/incident-resolver.git
```

### 2. Setup Development Environment
```bash
# Install dependencies
npm install

# Create .env.local for testing
cp .env.example .env.local

# Start PostgreSQL (Docker)
docker-compose up postgres

# Run migrations
npm run migrate

# Start dev server
npm run dev
```

### 3. Create Feature Branch
```bash
# Update main branch
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

## Development Workflow

### Coding Standards

#### TypeScript
- Enable strict mode (already configured in tsconfig.json)
- Use meaningful variable/function names
- Add JSDoc comments for public functions
- Target ES2020

```typescript
/**
 * Generate AI resolution for incident
 * @param incidentId - ID of the incident
 * @param organizationId - Organization context
 * @param provider - Optional AI provider override
 * @returns Generated resolution with confidence score
 */
export async function generateAIResolution(
  incidentId: string,
  organizationId: string,
  provider?: AIProviderType
): Promise<AIResolutionResponse>
```

#### Code Organization
- Controllers: Request/response handling
- Services: Business logic
- Middleware: Request processing
- Routes: Endpoint definitions
- Types: TypeScript interfaces
- Utilities: Shared functions
- Config: Environment & settings

#### Error Handling
```typescript
try {
  // operation
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new AppError('User-friendly message', 400);
}
```

#### Validation
Use Zod for all input validation:
```typescript
const CreateIncidentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  organizationId: z.string().uuid(),
});

const validated = CreateIncidentSchema.parse(req.body);
```

### Testing

#### Unit Tests
```bash
npm test
```

Tests should cover:
- Happy path scenarios
- Error conditions
- Edge cases
- Validation failures

```typescript
describe('AuthController', () => {
  describe('signup', () => {
    it('should create user with valid input', async () => {
      const req = { body: {...} };
      const res = mockResponse();
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject invalid email', async () => {
      const req = { body: { email: 'invalid' } };
      const res = mockResponse();
      await signup(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
```

#### Integration Tests
```bash
npm run test:integration
```

Test with real database:
- User signup → login flow
- Incident creation → resolution flow
- File upload → extraction flow

#### Test Coverage
Target: >80% coverage
```bash
npm run test:coverage
```

### Linting and Formatting

```bash
# Check for issues
npm run lint

# Fix issues
npm run lint:fix

# Format code
npm run format
```

## Submitting Changes

### Before Committing
1. Update code to follow standards
2. Run tests locally
3. Run linter and formatter
4. Update documentation if needed
5. Add changeset if user-facing

### Commit Messages

Follow conventional commits:
```
type(scope): short description

Longer explanation if needed. Wrap at 72 characters.

Closes #123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (no logic changes)
- `refactor`: Refactoring
- `perf`: Performance improvement
- `test`: Test additions/changes
- `chore`: Build/dependencies/tooling

Examples:
```
feat(auth): implement OAuth2 support

Add OAuth2 provider factory and Google/Microsoft implementations.
Supports user sign-in via social providers.

Closes #456
```

```
fix(ai): handle Ollama connection timeout

Implement retry logic with exponential backoff for Ollama connections.
Timeout after 30s instead of hanging indefinitely.

Closes #789
```

### Pull Request Process

1. **Create PR with descriptive title**
   - Title format: `[TYPE] Short description`
   - Example: `[FEAT] Add Slack notifications for incidents`

2. **Fill PR template**
   ```markdown
   ## Description
   Brief description of changes

   ## Related Issues
   Closes #123

   ## Type of Change
   - [ ] New feature
   - [ ] Bug fix
   - [ ] Breaking change

   ## Testing
   How to test the changes

   ## Checklist
   - [ ] Tests pass
   - [ ] Linter passes
   - [ ] Documentation updated
   - [ ] No breaking changes
   ```

3. **Ensure CI passes**
   - All tests pass
   - Linting passes
   - No security issues

4. **Request review**
   - Assign reviewers
   - Respond to feedback
   - Make requested changes

5. **Merge**
   - Squash commits if requested
   - Delete feature branch
   - Update changelog

## Documentation

### README Updates
- Update README.md if adding features
- Keep architecture section current
- Update API endpoints list
- Add new configuration options

### Code Comments
```typescript
// Use for complex logic explanations
// This implements exponential backoff for retries
// to avoid overwhelming the AI service

/**
 * Public function comments use JSDoc format
 * @param param - Description
 * @returns Description
 */
```

### API Documentation
If adding endpoints, document in:
- [API.md](API.md) - Full endpoint reference
- [README.md](README.md) - Quick examples
- Code comments - Implementation details

## Areas for Contribution

### High Priority
- [ ] Knowledge base matching (find existing resolutions)
- [ ] Advanced text extraction (OCR, PDF)
- [ ] Performance optimization
- [ ] Test coverage improvements
- [ ] Documentation improvements

### Medium Priority
- [ ] Slack/Teams integration
- [ ] Email notifications
- [ ] Custom provider templates
- [ ] Monitoring dashboard
- [ ] Cost tracking

### Community Welcome
- Bug reports
- Documentation improvements
- Code examples
- Security advisories
- Performance ideas

## Reporting Issues

### Bug Reports
Include:
- Reproducible steps
- Expected behavior
- Actual behavior
- Environment (OS, Node version, etc.)
- Error logs

```markdown
## Description
Brief description of bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. ...

## Expected
What should happen

## Actual
What actually happens

## Environment
- OS: macOS 14.2
- Node: 20.10.0
- Database: PostgreSQL 16

## Logs
```
Error message here
```
```

### Feature Requests
Include:
- Use case/problem it solves
- Proposed solution
- Alternative solutions
- Impact (how many users affected)

```markdown
## Problem
Users currently can't do X, which causes Y

## Proposed Solution
Implement feature Z

## Alternative Solutions
Solution A, Solution B

## Impact
Affects X% of users
```

## Project Structure

```
.
├── src/
│   ├── index.ts              # App entry point
│   ├── config/               # Configuration
│   ├── controllers/          # Request handlers
│   ├── database/             # Database setup
│   ├── middleware/           # Express middleware
│   ├── routes/               # Route definitions
│   ├── services/             # Business logic
│   │   └── ai/               # AI service layer
│   ├── types/                # TypeScript definitions
│   └── utils/                # Utilities
├── migrations/               # Database migrations
├── tests/                    # Test files
├── .env.example              # Environment template
├── docker-compose.yml        # Local dev environment
├── README.md                 # Project overview
├── API.md                    # API documentation
├── ARCHITECTURE.md           # Architecture details
└── package.json              # Dependencies
```

## Performance Considerations

### Database
- Use indexes for frequently queried columns
- Use connection pooling
- Parameterize queries to prevent SQL injection
- Use transactions for atomic operations

### Caching
- Cache AI resolutions by incident type
- Cache correlation results
- Implement TTL for cached data

### APIs
- Implement pagination for list endpoints
- Use compression for responses
- Batch operations when possible
- Implement rate limiting

## Security Considerations

### Before Submitting
- [ ] No hardcoded secrets/API keys
- [ ] No SQL injection vulnerabilities
- [ ] Input validation on all endpoints
- [ ] Authentication required for sensitive endpoints
- [ ] RBAC checks in place
- [ ] Error messages don't leak information
- [ ] No exposed sensitive data in logs

### Security Tools
```bash
npm audit                    # Check dependencies
npm run lint                 # Code linting
npm run test                 # Unit tests
npm run test:security        # Security tests
```

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag: `v1.0.0`
4. Push tag: `git push --tags`
5. GitHub Actions builds and publishes

## Getting Help

- **Questions**: Open GitHub Discussion
- **Bugs**: Open GitHub Issue
- **Security**: Email security@example.com (private)
- **Chat**: Join our Discord community

## Recognition

Contributors are recognized in:
- CHANGELOG.md
- GitHub contributors page
- Annual contributor acknowledgments

## License

By contributing, you agree your contributions are licensed under the project's license (MIT).

---

**Thank you for contributing to making incident resolution smarter and more accessible! 🚀**
