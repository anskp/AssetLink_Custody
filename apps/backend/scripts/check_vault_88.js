import 'dotenv/config';
import { FireblocksWeb3Provider, ApiBaseUrl } from "@fireblocks/fireblocks-web3-provider";
import { ethers } from 'ethers';
import fs from 'fs';
import { config } from '../src/config/env.js';

async function main() {
    try {
        const vaultId = process.env.FIREBLOCKS_GAS_PROVIDER_VAULT || '88';
        console.log(`Checking Vault ${vaultId}...`);

        const privateKey = fs.readFileSync(config.fireblocks.secretKeyPath, "utf8");
        const fbProvider = new FireblocksWeb3Provider({
            apiKey: config.fireblocks.apiKey,
            privateKey: privateKey,
            vaultAccountIds: [String(vaultId)],
            chainId: 11155111,
            apiBaseUrl: ApiBaseUrl.Sandbox
        });

        const provider = new ethers.BrowserProvider(fbProvider);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        console.log(`\n🔑 Vault ${vaultId} Address: ${address}`);

        const balance = await provider.getBalance(address);
        console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
