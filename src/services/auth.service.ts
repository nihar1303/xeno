import { User } from '@prisma/client'; // Imports the type definition for the User model
import prisma from '../db/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Ensure you set a SECRET key in your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECURE_DEFAULT_SECRET'; 
const SALT_ROUNDS = 10;

/**
 * Creates a new user and links them to a tenant (e.g., after initial onboarding).
 * @param email - New user email.
 * @param passwordPlain - Plain text password.
 * @param tenantId - The UUID of the store this user belongs to.
 */
export async function registerUser(email: string, passwordPlain: string, tenantId: string) {
    // 1. Check if user already exists
    if (await prisma.user.findUnique({ where: { email } })) {
        throw new Error('User already exists.');
    }

    // 2. Hash the password before storing it
    const hashedPassword = await bcrypt.hash(passwordPlain, SALT_ROUNDS);

    // 3. Create the user
    const user = await prisma.user.create({
        data: {
            email: email,
            password: hashedPassword,
            tenant_id: tenantId,
        }
    });

    return user;
}

/**
 * Validates user login credentials and returns a JWT token for authorization.
 * @param email - User email.
 * @param passwordPlain - Plain text password.
 */
export async function loginUser(email: string, passwordPlain: string) {
    // 1. Retrieve the user record from the database
    const user: User | null = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new Error('Invalid credentials.');
    }

    // 2. Compare the plain password with the stored hash
    const isPasswordValid = await bcrypt.compare(passwordPlain, user.password);

    if (!isPasswordValid) {
        throw new Error('Invalid credentials.');
    }

    // 3. Create JWT payload containing necessary info for auth/authz
    // The tenantId in the token is critical for multi-tenancy authorization middleware.
    const token = jwt.sign(
        { userId: user.id, tenantId: user.tenant_id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1d' } // Token expires in 1 day
    );

    return { token, tenantId: user.tenant_id, email: user.email };
}