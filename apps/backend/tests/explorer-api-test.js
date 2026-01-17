// Using built-in fetch (Node 18+)

const BASE_URL = 'http://localhost:3000/v1/explorer';

async function testExplorerAPI() {
    console.log('🚀 Starting Explorer API Tests...');

    try {
        // 1. Test Latest Transactions
        console.log('\n--- Testing /latest-txs ---');
        const latestRes = await fetch(`${BASE_URL}/latest-txs`);
        const latestData = await latestRes.json();
        console.log('Status:', latestRes.status);
        if (latestData.success) {
            console.log('Success! Count:', latestData.data.length);
            if (latestData.data.length > 0) {
                const sample = latestData.data[0];
                console.log('Sample Tx Hash:', sample.offchainTxHash);
            }
        } else {
            console.error('Failed:', latestData);
        }

        // 2. Test Asset Search (if address available)
        if (latestData.data && latestData.data.length > 0) {
            const assetAddress = latestData.data[0].assetAddress;
            if (assetAddress) {
                console.log(`\n--- Testing /asset/${assetAddress} ---`);
                const assetRes = await fetch(`${BASE_URL}/asset/${assetAddress}`);
                const assetData = await assetRes.json();
                console.log('Status:', assetRes.status);
                console.log('Found Asset:', assetData.success ? assetData.data.assetMetadata?.assetName : 'No');
            }

            const txHash = latestData.data[0].offchainTxHash;
            if (txHash) {
                console.log(`\n--- Testing /tx/${txHash} ---`);
                const txRes = await fetch(`${BASE_URL}/tx/${txHash}`);
                const txData = await txRes.json();
                console.log('Status:', txRes.status);
                console.log('Found Tx:', txData.success ? txData.data.offchainTxHash : 'No');
            }
        }

        console.log('\n✅ Explorer API Tests Completed');
    } catch (error) {
        console.error('\n❌ Test execution failed:', error.message);
    }
}

testExplorerAPI();
