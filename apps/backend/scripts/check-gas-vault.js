
import { Fireblocks, BasePath } from '@fireblocks/ts-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hardcoded config for diagnosis - matching the user's .env in apps/backend
const config = {
    apiKey: 'cdfb14c1-72ca-4f26-bd54-32a53b1550a0',
    secretKeyPath: 'C:\\Users\\anask\\Desktop\\AssetLink Custody\\apps\\backend\\fireblocks_secret.key',
    baseUrl: 'https://sandbox-api.fireblocks.io'
};

async function checkVault88() {
    try {
        fs.appendFileSync('gas_report.txt', '🔒 Initializing Fireblocks SDK...\n');
        const secretKey = fs.readFileSync(config.secretKeyPath, 'utf8');

        const fireblocks = new Fireblocks({
            apiKey: config.apiKey,
            secretKey: secretKey,
            basePath: BasePath.Sandbox
        });

        fs.appendFileSync('gas_report.txt', '🔍 Checking Vault 88 (Gas Vault)...\n');

        // Get Vault Account 88
        const vaultId = '88';
        const vault = await fireblocks.vaults.getVaultAccount({ vaultAccountId: vaultId });

        fs.appendFileSync('gas_report.txt', `\n🏦 Vault Name: ${vault.data.name}\n`);
        fs.appendFileSync('gas_report.txt', `🆔 Vault ID: ${vault.data.id}\n`);
        fs.appendFileSync('gas_report.txt', `💰 Assets:\n`);

        if (vault.data.assets.length === 0) {
            fs.appendFileSync('gas_report.txt', '   ⚠️ No assets found in vault!\n');
        } else {
            vault.data.assets.forEach(asset => {
                fs.appendFileSync('gas_report.txt', `   - ${asset.id}: ${asset.total} (Available: ${asset.available})\n`);
            });
        }

        // Specifically check ETH_TEST5 (Sepolia)
        const ethAsset = vault.data.assets.find(a => a.id === 'ETH_TEST5');
        if (!ethAsset) {
            fs.appendFileSync('gas_report.txt', '\n❌ CRITICAL: ETH_TEST5 not found in Vault 88!\n');
            fs.appendFileSync('gas_report.txt', '   The system relies on this asset for gas fees.\n');
        } else if (parseFloat(ethAsset.available) < 0.01) {
            fs.appendFileSync('gas_report.txt', `\n⚠️ WARNING: Low Gas Balance in Vault 88: ${ethAsset.available} ETH_TEST5\n`);
            fs.appendFileSync('gas_report.txt', '   Transfers and mints might fail.\n');
        } else {
            fs.appendFileSync('gas_report.txt', `\n✅ Gas Balance looks healthy: ${ethAsset.available} ETH_TEST5\n`);
        }

    } catch (error) {
        const errorMsg = `\n❌ Error checking vault: ${error.message}\n`;
        fs.appendFileSync('gas_report.txt', errorMsg);
        if (error.response) {
            fs.appendFileSync('gas_report.txt', `   API Response: ${JSON.stringify(error.response.data, null, 2)}\n`);
        }
    }
}

// Clear report file on start
fs.writeFileSync('gas_report.txt', '--- Gas Vault Report ---\n');

// Ensure output is flushed
checkVault88().then(() => setTimeout(() => process.exit(0), 1000));
