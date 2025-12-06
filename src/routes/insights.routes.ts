import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware'; // Import the extended Request type
import { 
    getSummaryMetrics, 
    getTopCustomers, 
    getOrdersByDate 
} from '../services/insight.service';

const router = Router();

/**
 * GET /api/v1/insights/summary
 * Retrieves total customers, orders, and revenue for the authenticated tenant.
 * Requires: Authentication token (middleware ensures tenantId is present)
 */
router.get('/summary', async (req: AuthRequest, res: Response) => {
    // 1. Authorization: The tenantId is safely available from the middleware
    const tenantId = req.tenantId as string; 

    try {
        const summary = await getSummaryMetrics(tenantId);
        return res.status(200).json(summary);
    } catch (error) {
        console.error('Error fetching summary metrics:', error);
        return res.status(500).json({ message: 'Failed to retrieve summary metrics.' });
    }
});

/**
 * GET /api/v1/insights/top-customers
 * Retrieves the top 5 customers by total spend for the authenticated tenant.
 * Requires: Authentication token
 */
router.get('/top-customers', async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId as string; 

    try {
        const customers = await getTopCustomers(tenantId);
        return res.status(200).json(customers);
    } catch (error) {
        console.error('Error fetching top customers:', error);
        return res.status(500).json({ message: 'Failed to retrieve top customers.' });
    }
});

/**
 * GET /api/v1/insights/orders-by-date?start=...&end=...
 * Retrieves time series data for order trends (required for charts).
 * Requires: Authentication token, start and end date query params.
 */
router.get('/orders-by-date', async (req: AuthRequest, res: Response) => {
    const tenantId = req.tenantId as string; 
    const { start: startDate, end: endDate } = req.query;

    // Input validation for date range filtering (assignment requirement)
    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Missing required query parameters: start and end.' });
    }

    try {
        // Pass the tenant ID and date filters to the service
        const trendData = await getOrdersByDate(
            tenantId, 
            startDate as string, 
            endDate as string
        );
        return res.status(200).json(trendData);
    } catch (error) {
        console.error('Error fetching order trends:', error);
        return res.status(500).json({ message: 'Failed to retrieve order trend data.' });
    }
});

export default router;