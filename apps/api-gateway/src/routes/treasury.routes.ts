import { Router } from 'express';
import { shieldPayController } from '../controllers/cloak.controller';

const router = Router();

/**
 * @route POST /v1/treasury/shield-pay
 * @desc Executes a shielded payment via Cloak SDK and logs the intent
 * @access Private (Requires Session Key / Bearer Token)
 */
router.post('/shield-pay', shieldPayController);

export default router;
