import { Router, Request, Response } from 'express';
import { onboardTenant } from '../services/onboarding.service'; 
import prisma from '../db/prisma'; // <-- Fix for 'prisma is undefined'

const router = Router();

/**
 * POST /api/v1/tenants/onboard
 * Initiates the multi-tenant ingestion process.
 */
router.post('/onboard', async (req: Request, res: Response) => {
    try {
        const { shopifyStoreDomain, accessToken } = req.body;
        
        if (!shopifyStoreDomain || !accessToken) {
            return res.status(400).json({ 
                message: 'Missing required fields: shopifyStoreDomain and accessToken.' 
            });
        }
        
        // Pass a null timestamp, triggering a full bulk sync
        const tenant = await onboardTenant(shopifyStoreDomain, accessToken, null);

        return res.status(202).json({ 
            message: 'Tenant onboarding initiated. Data ingestion is running.',
            tenantId: tenant.id,
            storeDomain: tenant.shopify_store_domain
        });

    } catch (error) {
        console.error('Onboarding Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown internal error during ingestion.';
        
        return res.status(500).json({ 
            message: 'Failed to onboard tenant.', 
            error: errorMessage 
        });
    }
});

/**
 * GET /api/v1/tenants/:tenantId/status
 * Checks the ingestion status of a tenant.
 */
router.get('/:tenantId/status', async (req: Request, res: Response) => {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: req.params.tenantId },
            select: { onboarding_status: true, last_synced_at: true }
        });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found.' });
        }

        return res.status(200).json(tenant);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve status.' });
    }
});

export default router;