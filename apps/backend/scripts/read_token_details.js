import { ethers } from 'ethers';
import { FireblocksWeb3Provider, ChainId } from '@fireblocks/fireblocks-web3-provider';
import { readFileSync } from 'fs';
import path from 'path';
import 'dotenv/config';
import { UNIQUE_ASSET_TOKEN } from '../src/modules/fireblocks/contracts.js';
import prisma from '../src/config/db.js';

async function main() {
    const r = await prisma.custodyRecord.findFirst({
        where: { status: 'MINTED' },
        orderBy: { createdAt: 'desc' }
    });

    if (!r || !r.tokenAddress) {
        console.error('❌ No minted tokens found with address');
        process.exit(1);
    }

    console.log('--- DB RECORD ---');
    console.log('AssetId:      ', r.assetId);
    console.log('Token Address:', r.tokenAddress);
    console.log('NAV Oracle:   ', r.navOracleAddress);
    console.log('PoR Oracle:   ', r.porOracleAddress);
    console.log('');

    const fbConfig = {
        apiKey: process.env.FIREBLOCKS_API_KEY,
        privateKey: readFileSync(process.env.FIREBLOCKS_API_PRIVATE_KEY_PATH || './fireblocks_secret.key', 'utf8'),
        chainId: ChainId.ETH_TEST5,
    };

    const provider = new ethers.BrowserProvider(new FireblocksWeb3Provider(fbConfig));
    const token = new ethers.Contract(r.tokenAddress, UNIQUE_ASSET_TOKEN.abi, provider);

    console.log('--- ON-CHAIN DATA ---');
    try {
        const name = await token.name();
        const symbol = await token.symbol();
        const totalSupply = await token.totalSupply();
        const nav = await token.getNAV();
        const por = await token.getProofOfReserve();
        const navAddr = await token.navOracle();
        const porAddr = await token.porOracle();

        console.log('Name:        ', name);
        console.log('Symbol:      ', symbol);
        console.log('Total Supply:', ethers.formatUnits(totalSupply, 18));
        console.log('NAV (Wei):   ', nav.toString(), `($${ethers.formatUnits(nav, 8)})`);
        console.log('PoR (Wei):   ', por.toString(), `($${ethers.formatUnits(por, 18)})`);
        console.log('NAV Oracle:  ', navAddr);
        console.log('PoR Oracle:  ', porAddr);

        if (navAddr.toLowerCase() !== r.navOracleAddress?.toLowerCase()) {
            console.warn('⚠️ NAV Oracle Address MISMATCH between DB and Chain!');
        }
        if (porAddr.toLowerCase() !== r.porOracleAddress?.toLowerCase()) {
            console.warn('⚠️ PoR Oracle Address MISMATCH between DB and Chain!');
        }

    } catch (err) {
        console.error('❌ Failed to read on-chain data:', err.message);
    }

    await prisma.$disconnect();
}

main();
