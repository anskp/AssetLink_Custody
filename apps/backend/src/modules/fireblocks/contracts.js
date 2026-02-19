/**
 * RWA Contract Artifacts
 * Loaded from compiled Hardhat artifacts in src/modules/fireblocks/*.json
 * Source: rwa-fireblock-oracle/artifacts/contracts/
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const RWAOracleArtifact = require("./RWAOracle.json");
const FireblocksProxyArtifact = require("./FireblocksProxy.json");
const UniqueAssetTokenArtifact = require("./UniqueAssetToken.json");

export const RWA_ORACLE = {
    bytecode: RWAOracleArtifact.bytecode,
    abi: RWAOracleArtifact.abi
};

export const FIREBLOCKS_PROXY = {
    bytecode: FireblocksProxyArtifact.bytecode,
    abi: FireblocksProxyArtifact.abi
};

export const UNIQUE_ASSET_TOKEN = {
    abi: UniqueAssetTokenArtifact.abi
};

// The shared UniqueAssetToken logic contract already deployed on Sepolia
export const UAT_IMPLEMENTATION_ADDRESS = "0xE47bE2d9e49F281Db51c52B8cae21C9E700a923F";
