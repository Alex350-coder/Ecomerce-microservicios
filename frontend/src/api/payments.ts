import { apiClient } from './client';

export interface PaymentIntentDto {
  id: string;
  status: 'pending' | 'approved' | 'declined' | 'error';
  orderId: string;
  amount: number;
  method: string;
  createdAt: string;
}

export interface CreatePaymentIntentInput {
  orderId: string;
  amount: number;
  method: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<PaymentIntentDto> {
  return apiClient<PaymentIntentDto>('/payments/intents', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function fetchPaymentByOrder(orderId: string): Promise<PaymentIntentDto> {
  return apiClient<PaymentIntentDto>(`/payments/orders/${orderId}`);
}
