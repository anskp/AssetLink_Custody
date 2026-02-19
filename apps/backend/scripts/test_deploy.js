import 'dotenv/config';
import { FireblocksWeb3Provider, ApiBaseUrl } from "@fireblocks/fireblocks-web3-provider";
import { ethers } from 'ethers';
import fs from 'fs';
import { config } from '../src/config/env.js';
import { RWA_ORACLE } from '../src/modules/fireblocks/contracts.js';

async function main() {
    try {
        console.log("Testing deployment (Direct ContractFactory)...");
        const vaultId = process.env.FIREBLOCKS_GAS_PROVIDER_VAULT || '88';

        const privateKey = fs.readFileSync(config.fireblocks.secretKeyPath, "utf8");
        const fbProvider = new FireblocksWeb3Provider({
            apiKey: config.fireblocks.apiKey,
            privateKey: privateKey,
            vaultAccountIds: [String(vaultId)],
            chainId: 11155111,
            apiBaseUrl: ApiBaseUrl.Sandbox,
            logTransactionStatusChanges: true // Enable logging to see Fireblocks reasoning
        });

        const provider = new ethers.BrowserProvider(fbProvider);
        const signer = await provider.getSigner();

        const factory = new ethers.ContractFactory(RWA_ORACLE.abi, RWA_ORACLE.bytecode, signer);

        console.log(`Deploying RWA_ORACLE to Sepolia (Vault ${vaultId})...`);

        // constructor(string description, uint8 decimals, int256 initialValue)
        const contract = await factory.deploy("Test Oracle Direct", 8, 100000000n, {
            gasLimit: 3000000 // Explicit gas limit
        });

        console.log(`Deployment transaction sent: ${contract.deploymentTransaction().hash}`);
        await contract.waitForDeployment();

        console.log(`Contract deployed at: ${await contract.getAddress()}`);

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
