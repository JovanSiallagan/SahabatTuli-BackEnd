import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../../config/prisma';
import { snap } from '../../lib/midtrans';
import { auth } from '../../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

const PRO_MONTHLY_PRICE = 35000;

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { type, amount } = req.body as {
      type: 'SUBSCRIPTION' | 'DONATION';
      amount?: number;
    };

    if (type !== 'SUBSCRIPTION' && type !== 'DONATION') {
      return res.status(400).json({ message: 'type harus SUBSCRIPTION atau DONATION' });
    }

    const grossAmount = type === 'SUBSCRIPTION' ? PRO_MONTHLY_PRICE : Number(amount);

    if (!grossAmount || grossAmount < 1000) {
      return res.status(400).json({ message: 'Nominal transaksi minimal Rp1.000' });
    }

    const prefix = type === 'SUBSCRIPTION' ? 'SUB' : 'DON';
    const orderId = `ST-${prefix}-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: [
        {
          id: type === 'SUBSCRIPTION' ? 'SAHABATTULI-PRO-1M' : 'SAHABATTULI-DONATION',
          price: grossAmount,
          quantity: 1,
          name:
            type === 'SUBSCRIPTION'
              ? 'SahabatTuli Premium (1 Bulan)'
              : 'Donasi Impact Fund SahabatTuli',
        },
      ],
      customer_details: {
        first_name: session.user.name,
        email: session.user.email,
      },
    };

    const midtransResponse = await snap.createTransaction(parameter);

    const transaction = await prisma.transaction.create({
      data: {
        orderId,
        userId: session.user.id,
        type,
        amount: grossAmount,
        status: 'PENDING',
        snapToken: midtransResponse.token,
        redirectUrl: midtransResponse.redirect_url,
      },
    });

    return res.status(201).json({
      message: 'Transaksi berhasil dibuat',
      data: {
        orderId: transaction.orderId,
        snapToken: transaction.snapToken,
        redirectUrl: transaction.redirectUrl,
      },
    });
  } catch (error) {
    console.error('Error creating Midtrans transaction:', error);
    return res.status(500).json({ message: 'Gagal membuat transaksi pembayaran' });
  }
};

export const handleNotification = async (req: Request, res: Response) => {
  try {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = req.body;

    const secretKey =
      process.env.MIDTRANS_SIGNATURE_SECRET_KEY || process.env.MIDTRANS_SERVER_KEY || '';
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${secretKey}`)
      .digest('hex');

    if (signature_key !== expectedSignature) {
      return res.status(403).json({ message: 'Invalid signature key' });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { orderId: order_id },
      include: { user: true },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
    }

    if (transaction.status === 'SUCCESS') {
      return res.status(200).json({ message: 'Transaksi sudah diproses sebelumnya' });
    }

    let newStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' = 'PENDING';

    if (transaction_status === 'capture' && fraud_status === 'accept') {
      newStatus = 'SUCCESS';
    } else if (transaction_status === 'settlement') {
      newStatus = 'SUCCESS';
    } else if (['cancel', 'deny', 'failure'].includes(transaction_status)) {
      newStatus = 'FAILED';
    } else if (transaction_status === 'expire') {
      newStatus = 'EXPIRED';
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { orderId: order_id },
        data: {
          status: newStatus,
          paymentType: payment_type,
        },
      });

      if (newStatus === 'SUCCESS' && transaction.type === 'SUBSCRIPTION') {
        const now = new Date();
        const baseDate =
          transaction.user.subscriptionEnds && transaction.user.subscriptionEnds > now
            ? transaction.user.subscriptionEnds
            : now;

        const nextExpiry = new Date(baseDate);
        nextExpiry.setDate(nextExpiry.getDate() + 30);

        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            isPremium: true,
            subscriptionEnds: nextExpiry,
          },
        });
      }
    });

    return res.status(200).json({ message: 'Notification handled' });
  } catch (error) {
    console.error('Error handling Midtrans webhook:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};