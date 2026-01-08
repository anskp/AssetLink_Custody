import { mapToFireblocksAsset } from './src/utils/blockchain.js';

const tests = [
    { input: '11155111', expected: 'ETH_TEST5' },
    { input: 11155111, expected: 'ETH_TEST5' },
    { input: '1', expected: 'ETH' },
    { input: '137', expected: 'MATIC' },
    { input: 'ETH_TEST5', expected: 'ETH_TEST5' },
    { input: 'unknown', expected: 'unknown' },
    { input: null, expected: 'ETH_TEST5' },
    { input: '', expected: 'ETH_TEST5' }
];

console.log('Running Blockchain Mapping Utility Tests...\n');

let passed = 0;
tests.forEach((test, index) => {
    const result = mapToFireblocksAsset(test.input);
    const success = result === test.expected;
    if (success) passed++;

    console.log(`Test #${index + 1}: ${test.input} => ${result} [${success ? 'PASS' : 'FAIL'}] (Expected: ${test.expected})`);
});

console.log(`\nSummary: ${passed}/${tests.length} tests passed.`);

if (passed === tests.length) {
    console.log('\x1b[32m%s\x1b[0m', 'All tests passed!');
    process.exit(0);
} else {
    console.log('\x1b[31m%s\x1b[0m', 'Some tests failed.');
    process.exit(1);
}
