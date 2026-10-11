import apiClient from '../api/client';
import { Appointment } from '../types/appointment';

export interface PaymentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
  gateway: 'razorpay' | 'stripe' | 'upi' | 'cash';
}

export interface PaymentVerificationPayload {
  appointmentId: string;
  orderId: string;
  paymentId: string;
  signature?: string;
}

export const paymentService = {
  getPaymentDetails: (appointment: Appointment) => {
    return {
      appointmentId: appointment._id,
      treatment: appointment.treatment,
      cost: appointment.cost || (appointment.treatment === 'Consultation' ? 500 : 1500),
      currency: 'INR',
      isPaid: !!appointment.isPaid,
      paymentStatus: appointment.isPaid ? ('PAID' as const) : ('UNPAID' as const),
    };
  },

  initiatePaymentOrder: async (appointmentId: string, amount: number): Promise<PaymentOrderResponse> => {
    try {
      const response = await apiClient.post<PaymentOrderResponse>('/payments/create-order', {
        appointmentId,
        amount,
        currency: 'INR',
      });
      return response.data;
    } catch (err: any) {
      return {
        orderId: `order_${Date.now()}`,
        amount,
        currency: 'INR',
        gateway: 'upi',
      };
    }
  },

  verifyPaymentSignature: async (payload: PaymentVerificationPayload): Promise<Appointment> => {
    const response = await apiClient.put<Appointment>(`/appointments/${payload.appointmentId}/pay`, {
      isPaid: true,
      paymentId: payload.paymentId,
      orderId: payload.orderId,
    });
    return response.data;
  },

  settleCashPayment: async (appointmentId: string): Promise<Appointment> => {
    const response = await apiClient.put<Appointment>(`/appointments/${appointmentId}/pay`, {
      isPaid: true,
      paymentMethod: 'cash',
    });
    return response.data;
  },
};

export default paymentService;
