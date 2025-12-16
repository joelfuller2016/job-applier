# JobAutoApply

An automated job application system powered by AI. This TypeScript monorepo combines Claude API for resume parsing, Exa API for intelligent job discovery, and Playwright for browser automation.

## Features

- **AI-Powered Resume Parsing**: Extract structured data from PDF/DOCX resumes using Claude API
- **Intelligent Job Discovery**: Find relevant jobs using Exa's semantic search
- **Automated Applications**: Browser automation for LinkedIn Easy Apply and Indeed
- **Smart Matching**: Score jobs against your profile with detailed analysis
- **Application Tracking**: Track status, analytics, and follow-ups
- **CLI Interface**: Easy-to-use command-line tools

## Architecture

```
job-applier/
├── packages/
│   ├── core/                 # Types, schemas, utilities
│   ├── config/               # Configuration management
│   ├── database/             # SQLite with sql.js
│   ├── resume-parser/        # Claude API resume extraction
│   ├── job-discovery/        # Exa API job search
│   ├── browser-automation/   # Playwright browser control
│   ├── platforms/            # LinkedIn & Indeed adapters
│   ├── application-tracker/  # Tracking & analytics
│   ├── orchestrator/         # Job matching & engine
│   └── cli/                  # Command-line interface
```

## Prerequisites

- Node.js 18+ (tested with Node 24)
- npm 9+
- API Keys:
  - [Anthropic API Key](https://console.anthropic.com/) (for Claude)
  - [Exa API Key](https://exa.ai/) (for job discovery)

## Installation

```bash
# Clone the repository
git clone https://github.com/joelfuller2016/job-applier.git
cd job-applier

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Add your API keys:
```env
ANTHROPIC_API_KEY=your-anthropic-api-key
EXA_API_KEY=your-exa-api-key
```

3. (Optional) Configure platform credentials in the CLI:
```bash
npm run cli -- init
```

## Usage

### Parse Your Resume

```bash
# Parse a resume file
npm run cli -- resume parse path/to/resume.pdf

# View your parsed profile
npm run cli -- resume show
```

### Search for Jobs

```bash
# Search with default settings
npm run cli -- search

# Search with custom query
npm run cli -- search --query "Senior TypeScript Developer"

# Filter by location
npm run cli -- search --location "San Francisco, CA"
```

### Apply to Jobs

```bash
# Start auto-apply mode
npm run cli -- apply

# Apply to specific job
npm run cli -- apply --job-id <job-id>

# Dry run (no actual applications)
npm run cli -- apply --dry-run
```

### View Statistics

```bash
# View application statistics
npm run cli -- stats

# View detailed analytics
npm run cli -- stats --detailed
```

## Packages

### @job-applier/core

Core types, Zod schemas, and utilities shared across all packages.

```typescript
import { UserProfile, Job, Application, JobMatch } from '@job-applier/core';
```

### @job-applier/config

Configuration management with environment variable support.

```typescript
import { getConfigManager } from '@job-applier/config';

const config = getConfigManager();
config.initialize();

const claude = config.getClaude();
const rateLimit = config.getRateLimit();
```

### @job-applier/database

SQLite database using sql.js (pure JavaScript, works in any environment).

```typescript
import { initDatabase, profileRepository, jobRepository } from '@job-applier/database';

await initDatabase();
const profile = profileRepository.findById('...');
```

### @job-applier/resume-parser

Parse resumes using Claude API.

```typescript
import { ResumeParser } from '@job-applier/resume-parser';

const parser = new ResumeParser();
const profile = await parser.parseFile('resume.pdf');
```

### @job-applier/job-discovery

Discover jobs using Exa API.

```typescript
import { JobDiscoveryEngine } from '@job-applier/job-discovery';

const engine = new JobDiscoveryEngine();
const results = await engine.discoverForProfile(profile, {
  maxResults: 20,
  location: 'Remote',
});
```

### @job-applier/browser-automation

Playwright-based browser automation.

```typescript
import { BrowserManager, FormFiller } from '@job-applier/browser-automation';

const browser = new BrowserManager();
await browser.launch({ headless: false });
```

### @job-applier/platforms

Platform-specific adapters for job sites.

```typescript
import { LinkedInAdapter, IndeedAdapter } from '@job-applier/platforms';

const linkedin = new LinkedInAdapter(browserManager);
await linkedin.login(credentials);
await linkedin.applyToJob(job, profile);
```

### @job-applier/application-tracker

Track applications and view analytics.

```typescript
import { ApplicationTracker, ApplicationAnalytics } from '@job-applier/application-tracker';

const tracker = new ApplicationTracker();
const app = await tracker.createApplication(profile.id, job.id);
await tracker.markAsSubmitted(app.id);

const analytics = new ApplicationAnalytics();
const stats = analytics.getOverallStats(profile.id);
```

### @job-applier/orchestrator

Job matching and application orchestration.

```typescript
import { JobMatcher, ApplicationEngine } from '@job-applier/orchestrator';

const matcher = new JobMatcher();
const match = matcher.matchJob(profile, job);

const engine = new ApplicationEngine();
await engine.start(profile);
```

## Rate Limiting

The system includes built-in rate limiting to avoid detection:

- Default: 25 applications per day, 5 per hour
- Configurable delays between applications
- Randomized timing patterns

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific package tests
npm test -- --filter=core
```

## Development

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@job-applier/core

# Type check
npm run typecheck

# Lint
npm run lint
```

## Security Notes

- Never commit your `.env` file
- API keys are only loaded from environment variables
- Platform credentials are stored locally and encrypted
- No sensitive data is logged

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [Anthropic Claude](https://www.anthropic.com/) for AI-powered resume parsing
- [Exa](https://exa.ai/) for semantic job search
- [Playwright](https://playwright.dev/) for browser automation
- [sql.js](https://github.com/sql-js/sql.js/) for pure JavaScript SQLite
