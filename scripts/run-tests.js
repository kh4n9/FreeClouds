const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Free Clouds - Master Test Runner\n');

const tests = [
  {
    name: 'Email Configuration Test',
    file: 'test-email.js',
    description: 'Tests email service configuration and sending'
  },
  {
    name: 'Login Flow Test',
    file: 'test-login.js',
    description: 'Tests authentication and login functionality'
  },
  {
    name: 'Admin Access Test',
    file: 'test-admin.js',
    description: 'Tests admin authentication and API access'
  }
];

function runTest(testFile) {
  return new Promise((resolve, reject) => {
    const testPath = path.join(__dirname, 'tests', testFile);
    const child = spawn('node', [testPath], {
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      error += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ output, error, code });
      } else {
        reject({ output, error, code });
      }
    });

    child.on('error', (err) => {
      reject({ error: err.message, code: -1 });
    });
  });
}

async function runAllTests() {
  console.log('🚀 Starting all tests...\n');

  const results = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Test ${i + 1}/${tests.length}: ${test.name}`);
    console.log(`📄 ${test.description}`);
    console.log(`📁 File: ${test.file}`);
    console.log('='.repeat(60));

    try {
      const result = await runTest(test.file);
      results.push({
        test: test.name,
        status: 'PASSED',
        ...result
      });
      console.log(`\n✅ ${test.name} - PASSED`);
    } catch (error) {
      results.push({
        test: test.name,
        status: 'FAILED',
        ...error
      });
      console.log(`\n❌ ${test.name} - FAILED`);
      console.log(`Exit code: ${error.code}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;

  results.forEach((result, index) => {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${result.test} - ${result.status}`);
  });

  console.log('\n📈 STATISTICS:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  console.log(`🎯 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! Your Free Clouds system is working correctly.');
    process.exit(0);
  }
}

async function runSingleTest(testName) {
  const test = tests.find(t => t.file === testName || t.name.toLowerCase().includes(testName.toLowerCase()));

  if (!test) {
    console.log(`❌ Test not found: ${testName}`);
    console.log('\n📋 Available tests:');
    tests.forEach((t, index) => {
      console.log(`  ${index + 1}. ${t.name} (${t.file})`);
    });
    process.exit(1);
  }

  console.log(`🚀 Running single test: ${test.name}\n`);

  try {
    await runTest(test.file);
    console.log(`\n✅ ${test.name} completed successfully!`);
  } catch (error) {
    console.log(`\n❌ ${test.name} failed!`);
    console.log(`Exit code: ${error.code}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log('📚 Free Clouds Test Runner Usage:\n');
  console.log('Run all tests:');
  console.log('  npm run test');
  console.log('  node scripts/run-tests.js\n');
  console.log('Run specific test:');
  console.log('  node scripts/run-tests.js email');
  console.log('  node scripts/run-tests.js login');
  console.log('  node scripts/run-tests.js admin\n');
  console.log('Available tests:');
  tests.forEach((test, index) => {
    console.log(`  ${index + 1}. ${test.name}`);
    console.log(`     📄 ${test.description}`);
    console.log(`     📁 File: ${test.file}\n`);
  });
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
} else if (args.length > 0) {
  runSingleTest(args[0]);
} else {
  runAllTests();
}
