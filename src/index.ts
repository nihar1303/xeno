import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // <-- CORS Middleware Import

// Route Imports
import tenantRoutes from './routes/tenant.routes'; 
import authRoutes from './routes/auth.routes';
import insightsRoutes from './routes/insights.routes'; 

// Service & Middleware Imports
import { startCronScheduler } from './services/sync.service';
import { authenticate } from './middleware/auth.middleware'; // Phase 3: Authorization

dotenv.config();

// --- Express App Declaration (Declare only once!) ---
const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------------------------------------
//             --- MIDDLEWARE SETUP ---
// ----------------------------------------------------

// 1. CORS Configuration (Allows frontend on 3001 to talk to backend on 3000)
app.use(cors({ 
    origin: 'http://localhost:3001', 
    methods: 'GET,POST,PUT,DELETE',
}));

// 2. JSON Body Parser (Essential for reading POST requests like /login, /onboard)
app.use(express.json()); 


// --- Health Check Route ---
app.get('/', (_req: Request, res: Response) => {
    res.status(200).send({
        message: 'Xeno FDE Ingestion Service is running!',
        uptime: process.uptime(),
        dbStatus: process.env.DATABASE_URL ? 'Configured' : 'Missing URL',
    });
});

// ----------------------------------------------------
//               --- API ROUTES ---
// ----------------------------------------------------

// 1. Authentication (Login/Register - NOT protected)
app.use('/api/v1/auth', authRoutes);

// 2. Tenant Management (Onboarding/Status - Not protected by user auth)
app.use('/api/v1/tenants', tenantRoutes);

// 3. Data Insights (Dashboard queries - PROTECTED)
// All routes mounted here require the JWT authentication middleware.
app.use('/api/v1/insights', authenticate, insightsRoutes); 

// ----------------------------------------------------
//             --- SERVER STARTUP ---
// ----------------------------------------------------

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    
    // Start the Data Synchronization Scheduler (Phase 2 Requirement)
    startCronScheduler(); 
    
    console.log('Scheduler and services initialized.');
});