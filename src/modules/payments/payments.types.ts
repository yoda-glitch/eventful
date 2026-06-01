export interface InitiateOrderDto {
  tierId: string;
  quantity: number;
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: string;
    metadata?: Record<string, unknown>;
    customer: {
      email: string;
    };
  };
}

export interface RefundDto {
  orderId: string;
  amount?: number;
}
