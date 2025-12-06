import prisma from '../db/prisma';
import fetch from 'node-fetch'; 
import { Customer } from '@prisma/client'; 

const API_VERSION = '2024-04'; 
const MAX_FETCH_LIMIT = 250; 

/**
 * Helper function to fetch data from the Shopify Admin API.
 */
async function shopifyFetch(tenant: any, path: string, params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    let url = `https://${tenant.shopify_store_domain}/admin/api/${API_VERSION}/${path}.json?${query}`;
    
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'X-Shopify-Access-Token': tenant.shopify_access_token,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API Error: ${response.status} for path ${path}. Details: ${errorText}`);
    }

    return response.json();
}

/**
 * Main service function to handle tenant onboarding (full bulk) and scheduled sync (filtered).
 */
export async function onboardTenant(
    storeDomain: string, 
    accessToken: string, 
    lastSyncedAt: Date | null // Accepts null for initial bulk sync
) {
    // 1. Find or create the Tenant record
    let tenant = await prisma.tenant.findUnique({
        where: { shopify_store_domain: storeDomain },
    });

    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                shopify_store_domain: storeDomain,
                shopify_access_token: accessToken,
                onboarding_status: 'PROCESSING_INGESTION',
            },
        });
    } else {
        // Update token if it's a re-onboarding run
        await prisma.tenant.update({
             where: { id: tenant.id },
             data: { shopify_access_token: accessToken }
        });
    }

    const tenantId = tenant.id;
    
    // Determine filter: use updated_at_min if lastSyncedAt is available (for sync jobs)
    const dateFilter = lastSyncedAt ? { updated_at_min: lastSyncedAt.toISOString() } : {};
    const isBulkSync = !lastSyncedAt;

    // --- CORE BULK INGESTION / SYNC ---
    console.log(`Starting ${isBulkSync ? 'BULK' : 'SCHEDULED'} ingestion for tenant ${tenantId}...`);

    // --- A. Ingest Customers ---
    try {
        const customerData = await shopifyFetch(tenant, 'customers', { limit: MAX_FETCH_LIMIT, ...dateFilter });
        const customerRecords = customerData.customers.map((c: any) => ({
            tenant_id: tenantId,
            shopify_customer_id: c.id.toString(), 
            email: c.email,
            first_name: c.first_name,
            last_name: c.last_name,
            total_spent: parseFloat(c.total_spent) || 0.0,
            created_at_shopify: c.created_at,
        }));
        
        await prisma.customer.createMany({
            data: customerRecords,
            skipDuplicates: true, 
        });
        console.log(`[Tenant ${tenantId}] Ingested ${customerRecords.length} customers.`);
    } catch (e) {
        console.error(`[Tenant ${tenantId}] Failed to ingest customers:`, e);
    }
    
    // --- B. Ingest Products ---
    try {
        const productData = await shopifyFetch(tenant, 'products', { limit: MAX_FETCH_LIMIT, ...dateFilter });
        const productRecords = productData.products.map((p: any) => ({
            tenant_id: tenantId,
            shopify_product_id: p.id.toString(),
            title: p.title,
            vendor: p.vendor,
            price: parseFloat(p.variants[0]?.price) || 0.0, 
            created_at_shopify: p.created_at,
        }));
        
        await prisma.product.createMany({
            data: productRecords,
            skipDuplicates: true,
        });
        console.log(`[Tenant ${tenantId}] Ingested ${productRecords.length} products.`);
    } catch (e) {
        console.error(`[Tenant ${tenantId}] Failed to ingest products:`, e);
    }
    
    // --- C. Ingest Orders (Requires local customer lookup) ---
    try {
        const orderData = await shopifyFetch(tenant, 'orders', { limit: MAX_FETCH_LIMIT, ...dateFilter });
        
        // Use a type alias for the selected fields to fix the TS error
        type LocalCustomerMap = Pick<Customer, 'id' | 'shopify_customer_id'>;

        // Fetch local customers to map Shopify IDs to our internal UUIDs
        const localCustomers: LocalCustomerMap[] = await prisma.customer.findMany({
            where: { tenant_id: tenantId },
            select: { id: true, shopify_customer_id: true }
        });
        const customerIdMap: Map<string, string> = new Map(
            localCustomers.map((c: LocalCustomerMap) => [c.shopify_customer_id.toString(), c.id])
        );

        const orderRecords = orderData.orders.map((o: any) => {
            const shopifyCustomerId = o.customer?.id.toString();
            
            return {
                tenant_id: tenantId,
                shopify_order_id: o.id.toString(),
                order_date: o.created_at,
                total_price: parseFloat(o.total_price) || 0.0,
                status: o.financial_status,
                created_at_shopify: o.created_at,
                customer_id: shopifyCustomerId ? customerIdMap.get(shopifyCustomerId) : null,
            };
        });
        
        await prisma.order.createMany({
            data: orderRecords,
            skipDuplicates: true,
        });
        console.log(`[Tenant ${tenantId}] Ingested ${orderRecords.length} orders.`);
    } catch (e) {
        console.error(`[Tenant ${tenantId}] Failed to ingest orders:`, e);
    }

    // 3. Update status on completion
    await prisma.tenant.update({
        where: { id: tenantId },
        data: { 
            onboarding_status: 'INGESTION_COMPLETE', 
            last_synced_at: new Date() 
        },
    });
    
    console.log(`Ingestion complete for tenant ${tenantId}.`);

    return tenant;
}