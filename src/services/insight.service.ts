import prisma from '../db/prisma';

/**
 * 1. Calculates the key summary metrics for the dashboard.
 * @param tenantId The authenticated tenant's ID.
 */
export async function getSummaryMetrics(tenantId: string) {
    // We use Prisma's aggregate and count functions, always filtered by tenantId.

    // Calculate total orders and total revenue in one efficient query
    const orderAggregate = await prisma.order.aggregate({
        where: { tenant_id: tenantId },
        _sum: { total_price: true },
        _count: { id: true },
    });

    // Calculate total customers
    const totalCustomers = await prisma.customer.count({
        where: { tenant_id: tenantId },
    });

    const totalRevenue = orderAggregate._sum.total_price?.toNumber() || 0;
    const totalOrders = orderAggregate._count.id;

    // Optional: Calculate Average Order Value (AOV)
    const aov = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

    return {
        totalCustomers,
        totalOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        aov: parseFloat(aov.toFixed(2)),
    };
}

/**
 * 2. Gets the top 5 customers based on their total spend (required by assignment).
 * @param tenantId The authenticated tenant's ID.
 */
export async function getTopCustomers(tenantId: string) {
    // This query uses the `total_spent` field which was populated during ingestion.
    const topCustomers = await prisma.customer.findMany({
        where: { tenant_id: tenantId },
        orderBy: {
            total_spent: 'desc',
        },
        take: 5, // Limits to the top 5
        select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            total_spent: true,
        },
    });

    return topCustomers.map(c => ({
        ...c,
        total_spent: c.total_spent.toNumber(), // Convert Decimal to number for frontend
    }));
}

/**
 * 3. Retrieves time-series data for orders (required for trend chart).
 * @param tenantId The authenticated tenant's ID.
 * @param startDate The start date for filtering (e.g., '2024-01-01').
 * @param endDate The end date for filtering.
 */
export async function getOrdersByDate(tenantId: string, startDate: string, endDate: string) {
    // Note: Prisma does not support GROUP BY date functions directly, 
    // so we use a raw query for better performance and aggregation.

    // 1. Convert input strings to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 2. SQL Query: Group orders by day and sum the total price
    const result: { date: Date, total_orders: number, total_revenue: number }[] = await prisma.$queryRaw`
        SELECT
            DATE_TRUNC('day', "order_date" AT TIME ZONE 'UTC') AS date,
            COUNT(id)::int AS total_orders,
            SUM(total_price)::float AS total_revenue
        FROM "orders"
        WHERE 
            "tenant_id" = ${tenantId} AND 
            "order_date" >= ${start}::timestamp AND 
            "order_date" <= ${end}::timestamp
        GROUP BY 1
        ORDER BY date ASC;
    `;

    return result.map(r => ({
        date: r.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
        totalOrders: r.total_orders,
        totalRevenue: parseFloat(r.total_revenue.toFixed(2)),
    }));
}

// You can add more creative metrics here, e.g., AOV by month, customer retention rate.