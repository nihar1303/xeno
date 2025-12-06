import prisma from '../db/prisma';
import { onboardTenant } from './onboarding.service'; 
import cron from 'node-cron';

/**
 * Executes a full sync run for all tenants that have been successfully onboarded.
 */
export async function runScheduledSync() {
    console.log('--- STARTING SCHEDULED SYNC RUN ---');
    
    // Fetch all tenants that are marked as complete
    const activeTenants = await prisma.tenant.findMany({
        where: {
            onboarding_status: 'INGESTION_COMPLETE',
        },
    });

    if (activeTenants.length === 0) {
        console.log('No active tenants found to sync.');
        return;
    }

    console.log(`Found ${activeTenants.length} tenants requiring sync...`);

    // Iterate through each tenant and trigger the ingestion logic
    for (const tenant of activeTenants) {
        try {
            console.log(`[SYNC] Syncing data for store: ${tenant.shopify_store_domain}`);
            
            // Pass the last sync time for filtering, running the same function used for bulk sync
            await onboardTenant(
                tenant.shopify_store_domain, 
                tenant.shopify_access_token, 
                tenant.last_synced_at 
            );
            
            console.log(`[SYNC] Sync successful for ${tenant.shopify_store_domain}`);

        } catch (error) {
            console.error(`[SYNC] Failed to sync ${tenant.shopify_store_domain}:`, error);
        }
    }

    console.log('--- SCHEDULED SYNC RUN COMPLETE ---');
}

/**
 * Sets up the cron job to run the sync function periodically.
 * Runs every hour at 0 minutes (e.g., 1:00, 2:00, etc.)
 */
export function startCronScheduler() {
    // Cron schedule: 0 * * * * (At minute 0 past every hour)
    cron.schedule('0 * * * *', () => {
        runScheduledSync();
    });
    console.log('Scheduler started. Syncing every hour.');
}