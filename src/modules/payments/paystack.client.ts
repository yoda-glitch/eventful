import axios, { AxiosInstance } from 'axios';
import { env } from '@/config';

class PaystackClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async initializeTransaction(data: {
    email: string;
    amount: number;
    reference: string;
    metadata?: Record<string, unknown>;
  }) {
    const response = await this.client.post('/transaction/initialize', {
      ...data,
      amount: data.amount * 100, // convert to kobo
    });
    return response.data;
  }

  async verifyTransaction(reference: string) {
    const response = await this.client.get(`/transaction/verify/${reference}`);
    return response.data;
  }

  async refundTransaction(data: {
    transaction: string;
    amount?: number;
  }) {
    const response = await this.client.post('/refund', data);
    return response.data;
  }
}

export const paystackClient = new PaystackClient();
