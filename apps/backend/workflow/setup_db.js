import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const keys = [
    {
        publicKey: 'ak_83a84a990f86d438d3d2c351962faa37',
        secretKey: 'sk_402ac0ab604273cbebe947c552b64bb8dd9c98cb84e0dd52',
        role: 'MAKER',
        permissions: ['read', 'write'],
        tenantId: 'platform_test_tenant'
    },
    {
        publicKey: 'ak_cba55b501da24894d83d1d74d7022d81',
        secretKey: 'sk_d7accf74dde6d93dd6d5d9bcbe504743cd599a5b0d57ab58',
        role: 'CHECKER',
        permissions: ['read', 'write', 'admin'],
        tenantId: 'platform_test_tenant'
    }
];

async function setup() {
    console.log('--- Setting up Workflow API Keys ---');

    for (const key of keys) {
        const secretKeyHash = await bcrypt.hash(key.secretKey, 10);

        await prisma.apiKey.upsert({
            where: { publicKey: key.publicKey },
            update: {
                secretKey: key.secretKey,
                secretKeyHash: secretKeyHash,
                permissions: key.permissions,
                role: key.role,
                tenantId: key.tenantId,
                isActive: true
            },
            create: {
                publicKey: key.publicKey,
                secretKey: key.secretKey,
                secretKeyHash: secretKeyHash,
                permissions: key.permissions,
                role: key.role,
                tenantId: key.tenantId,
                isActive: true
            }
        });

        console.log(`✅ Key ${key.publicKey} (${key.role}) is ready.`);
    }

    await prisma.$disconnect();
}

setup().catch(console.error);
