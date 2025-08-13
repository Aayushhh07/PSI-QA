const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Centralized Testing Application...\n');

// Create necessary directories
const directories = [
  'logs',
  'screenshots',
  'videos',
  'test-results',
  'har-files'
];

console.log('📁 Creating directories...');
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`ℹ️  Directory already exists: ${dir}`);
  }
});

// Copy environment file if it doesn't exist
if (!fs.existsSync('.env')) {
  if (fs.existsSync('env.example')) {
    fs.copyFileSync('env.example', '.env');
    console.log('✅ Created .env file from env.example');
  } else {
    console.log('⚠️  env.example not found, please create .env manually');
  }
} else {
  console.log('ℹ️  .env file already exists');
}

console.log('\n📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

console.log('\n🎭 Installing Playwright browsers...');
try {
  execSync('npx playwright install chromium', { stdio: 'inherit' });
  console.log('✅ Playwright browsers installed successfully');
} catch (error) {
  console.error('❌ Failed to install Playwright browsers:', error.message);
  process.exit(1);
}

console.log('\n🔨 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Project built successfully');
} catch (error) {
  console.error('❌ Failed to build project:', error.message);
  process.exit(1);
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Start the development server: npm run dev');
console.log('2. Test the API: node examples/test-example.js');
console.log('3. View logs in the logs/ directory');
console.log('4. Check screenshots in the screenshots/ directory');
console.log('\n🌐 API will be available at: http://localhost:3000');
console.log('📊 Health check: http://localhost:3000/health'); 