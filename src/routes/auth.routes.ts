import { Router, Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service';

const router = Router();

// Endpoint for creating the first user after a tenant is onboarded
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, tenantId } = req.body;
        
        if (!email || !password || !tenantId) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const user = await registerUser(email, password, tenantId);
        
        return res.status(201).json({ 
            message: 'User created successfully. Please login.',
            userId: user.id 
        });
    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
});

// Endpoint for user login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Missing email or password.' });
        }

        const result = await loginUser(email, password);
        
        return res.status(200).json(result);

    } catch (error: any) {
        return res.status(401).json({ message: error.message });
    }
});

export default router;