import { PrismaClient } from '@prisma/client';

// Initialize a single instance of PrismaClient
const prisma = new PrismaClient();

// Export the instance for use across your application
export default prisma;