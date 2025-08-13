# Centralized Automated Testing Application

A comprehensive automated testing application built with Express.js, TypeScript, and Playwright for testing multiple websites and their routes.

## Features

- 🧪 **Automated E2E Testing**: Test multiple websites using Playwright
- 📊 **Comprehensive Logging**: Detailed logs for each test execution
- 🖼️ **Screenshot Capture**: Automatic screenshot capture for failed tests
- 📈 **Performance Monitoring**: Track page load times and performance metrics
- 🔄 **Route Management**: Define and manage test routes for each website
- 📋 **Test Reports**: Generate detailed reports and analytics
- 🚀 **RESTful API**: Complete API for managing tests and websites

## Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── testController.ts
│   └── websiteController.ts
├── middleware/           # Express middleware
│   ├── errorHandler.ts
│   └── notFoundHandler.ts
├── routes/              # API routes
│   ├── testRoutes.ts
│   ├── websiteRoutes.ts
│   └── reportRoutes.ts
├── services/            # Business logic
│   ├── testService.ts
│   └── playwrightService.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   └── logger.ts
└── index.ts             # Application entry point
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

4. Copy environment file:
   ```bash
   cp env.example .env
   ```

5. Build the project:
   ```bash
   npm run build
   ```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Tests
- `POST /api/tests/execute` - Execute a new test
- `GET /api/tests/executions` - Get all test executions
- `GET /api/tests/executions/:executionId` - Get specific execution
- `GET /api/tests/executions/website/:websiteId` - Get website executions
- `PATCH /api/tests/executions/:executionId/cancel` - Cancel execution

### Websites
- `GET /api/websites` - Get all websites
- `GET /api/websites/:websiteId` - Get specific website
- `POST /api/websites` - Add new website
- `GET /api/websites/:websiteId/routes` - Get website routes
- `POST /api/websites/:websiteId/routes` - Add route to website

### Reports
- `GET /api/reports/execution/:executionId` - Get execution report
- `GET /api/reports/website/:websiteId/summary` - Get website summary
- `GET /api/reports/system/summary` - Get system summary

### Choice-AI Specific Tests
- `POST /api/choice-ai/` - Execute Choice-AI complete E2E test
- `POST /api/choice-ai/e2e` - Execute Choice-AI complete E2E test (alternative)
- `GET /api/choice-ai/e2e/status/:executionId` - Get E2E test status
- `GET /api/choice-ai/e2e/history` - Get Choice-AI E2E test history

### Opticall Specific Tests
- `POST /api/opticall/` - Execute Opticall complete E2E test
- `POST /api/opticall/e2e` - Execute Opticall complete E2E test (alternative)
- `GET /api/opticall/e2e/status/:executionId` - Get E2E test status
- `GET /api/opticall/e2e/history` - Get Opticall E2E test history

#### Choice-AI Status Filtering Test
The Choice-AI E2E test now includes comprehensive status filtering verification:

**Features:**
- **Pending Status Test**: Verifies that clicking "Pending" shows only pending video content
- **Approved Status Test**: Verifies that clicking "Approved" shows only approved video content  
- **Rejected Status Test**: Verifies that clicking "Rejected" shows only rejected video content
- **Content Validation**: Checks up to 10 video divisions per status to ensure correct filtering
- **Status Verification**: Validates that each video division displays the correct status indicator
- **Detailed Logging**: Provides comprehensive logs for each status test with success/failure details

**Test Flow:**
1. Login to Choice-AI dashboard
2. Navigate to video content page
3. Test "Pending" status filter and verify content
4. Test "Approved" status filter and verify content
5. Test "Rejected" status filter and verify content
6. Generate detailed report with verification results

**Example Usage:**
```bash
# Run the Choice-AI status filtering test
node examples/choice-ai-status-test-example.js

# Run the Opticall E2E test
node examples/opticall-e2e-test-example.js
```

## Choice-AI Testing

The application includes dedicated testing for the Choice-AI website at `https://qtw9nd7zyi.execute-api.ap-south-1.amazonaws.com/login`.

## Opticall Testing

The application includes dedicated testing for the Opticall website at `https://app.opticall.io/`.

### Configuration
Add your Choice-AI credentials to the `.env` file:
```bash
CHOICE_UID=your_user_id
CHOICE_PASS=your_password
```

Add your Opticall credentials to the `.env` file:
```bash
OPTICALL_EMAIL=ce@opticall.io
OPTICALL_PASSWORD=DishD2h#6
```

### Login Verification Improvements

The Opticall E2E test includes enhanced login verification that:

1. **Waits for URL changes**: Uses `waitForUrlChange()` to detect when the page navigates away from the login URL
2. **Waits for page load**: Uses `waitForNavigation()` to ensure the new page is fully loaded
3. **Checks for dashboard elements**: Looks for dashboard-related DOM elements to confirm successful login
4. **Fallback verification**: If URL-based verification fails, checks for the absence of login form elements
5. **Comprehensive logging**: Provides detailed logs of the login process for debugging

This approach is more robust than simple timeout-based waiting and handles various login scenarios including redirects and SPA navigation.

### Running Choice-AI E2E Tests
```bash
# Execute complete E2E test
curl -X POST http://localhost:3000/api/choice-ai/

# Get E2E test history
curl -X GET http://localhost:3000/api/choice-ai/e2e/history
```

### Running Opticall E2E Tests
```bash
# Execute complete E2E test
curl -X POST http://localhost:3000/api/opticall/

# Get E2E test history
curl -X GET http://localhost:3000/api/opticall/e2e/history
```

### Choice-AI E2E Test Features
- ✅ **Complete User Journey**: Login → Dashboard → Navigation → Validation
- 📸 **Comprehensive Screenshots**: Captures every step of the process
- 📊 **Performance Monitoring**: Tracks page load times and responsiveness
- 🔍 **Content Validation**: Checks for headings, forms, images, and interactive elements
- 🛡️ **Error Handling**: Detects error messages and alerts
- 📝 **Detailed Logging**: Step-by-step execution logs with emojis for easy reading
- 🔄 **Responsive Testing**: Tests different viewport sizes
- 📋 **Navigation Exploration**: Automatically discovers and validates UI elements

### Opticall E2E Test Features
- ✅ **Complete User Journey**: Login → Dashboard → Reports → Charts → Call Records
- 📊 **Chart Testing**: Verifies all charts in each section
- 🖥️ **Full Screen Testing**: Tests full screen chart functionality
- 📈 **Chart Interaction**: Clicks on first data point of any chart type (bar, line, pie, etc.) and retrieves call records
- 🆔 **Call ID Testing**: Clicks on Call ID elements and navigates to call details
- 🎵 **Call Recording Testing**: Scrolls and plays call recordings
- 🎧 **Playback Verification**: Confirms call recording playback functionality
- 📸 **Comprehensive Screenshots**: Captures every step of the process
- 📊 **Performance Monitoring**: Tracks page load times and responsiveness
- 📝 **Detailed Logging**: Step-by-step execution logs with emojis for easy reading

## Example Usage

### Execute a Test
```bash
curl -X POST http://localhost:3000/api/tests/execute \
  -H "Content-Type: application/json" \
  -d '{
    "websiteId": "1",
    "routeId": "1",
    "screenshot": true,
    "playwrightConfig": {
      "browser": "chrome",
      "headless": true,
      "timeout": 30000
    }
  }'
```

### Add a Website
```bash
curl -X POST http://localhost:3000/api/websites \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Website",
    "baseUrl": "https://example.com",
    "description": "A test website"
  }'
```

### Add a Route
```bash
curl -X POST http://localhost:3000/api/websites/1/routes \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/about",
    "method": "GET",
    "name": "About Page Test",
    "description": "Test the about page",
    "expectedStatus": 200,
    "screenshot": true
  }'
```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (default: info)
- `LOG_FILE_PATH` - Log file directory (default: ./logs)
- `PLAYWRIGHT_BROWSER` - Default browser (chrome/chromium/firefox/webkit)
- `PLAYWRIGHT_HEADLESS` - Run browser in headless mode
- `PLAYWRIGHT_TIMEOUT` - Default timeout in milliseconds
- `SCREENSHOT_PATH` - Screenshot directory
- `VIDEO_PATH` - Video recording directory

## Logging

The application uses Winston for comprehensive logging:

- **Console logs**: Real-time logging during development
- **Combined logs**: All logs saved to `logs/combined.log`
- **Error logs**: Error logs saved to `logs/error.log`
- **Test execution logs**: Test-specific logs saved to `logs/test-executions.log`

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License 