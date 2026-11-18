import { Router } from 'express';
import { createTransaction, handleNotification } from './transaction.controller';

const router = Router();

// Endpoint untuk Flutter membuat pembayaran (Subscription / Donasi)
router.post('/checkout', createTransaction);

// Endpoint Webhook untuk menerima callback status dari server Midtrans (Public)
router.post('/webhook', handleNotification);

export default router;