import { Router } from 'express';
import { prisma } from '../prisma/prisma';

const router = Router();

router.get('/', async (req, res) => {
    res.json(await prisma.user.findMany());
});

export default router;