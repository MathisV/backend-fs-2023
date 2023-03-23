import { Router } from 'express';
import stocksRoutes from './stocks';
import userRoutes from './login';

const router = Router();

router.use('/stocks', stocksRoutes);
router.use('/user', userRoutes);

export default router;