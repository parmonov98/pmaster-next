'use client';

import { useState, useCallback } from 'react';
import { createClient } from '../supabase/client';
import { useAuth } from '../auth';
import { isPaymeConfigured } from '../payme';

interface Order {
  id: string;
  order_id: number;
  user_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  order_type: 'balance_topup';
  description: string | null;
  transaction_id: string | null;
  payme_transaction_time: number | null;
  created_at: string;
  updated_at: string;
}

interface CreatePaymentRequestParams {
  amount: number;
}

export const usePayme = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a payment request and redirect to Payme
   */
  const createPayment = useCallback(async (params: CreatePaymentRequestParams) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    if (!isPaymeConfigured()) {
      throw new Error('Payme is not configured');
    }

    const { amount } = params;

    if (!amount || amount < 1000) {
      throw new Error('Amount must be at least 1,000 UZS');
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Get session token for backend API
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error('User session expired. Please log in again.');
      }

      // Call backend to create order and generate Payme URL
      // Backend handles: order creation, URL generation
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-order`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          description: `Balans to'ldirish: ${amount.toLocaleString()} UZS`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create payment: ${response.statusText}`);
      }

      const { url: paymeUrl, order, order_id } = await response.json();

      // Log URL for debugging
      console.log('=== Payme Payment Debug Info ===');
      console.log('Order ID:', order_id);
      console.log('Amount:', amount);
      console.log('Opening Payme in new tab:', paymeUrl);

      // Open Payme checkout in a new tab
      // This allows users to keep the original page open while paying
      // Silent open - no popups or alerts
      window.open(paymeUrl, '_blank', 'noopener,noreferrer');

      return { order };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment';
      setError(errorMessage);
      console.error('Error creating payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Check order status by order_id
   */
  const checkOrderStatus = useCallback(async (orderId: number): Promise<Order | null> => {
    if (!user) {
      return null;
    }

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking order status:', error);
        return null;
      }

      return data as Order;
    } catch (err) {
      console.error('Error checking order status:', err);
      return null;
    }
  }, [user]);

  /**
   * Get user's orders (order history)
   */
  const getOrders = useCallback(async (): Promise<Order[]> => {
    if (!user) {
      return [];
    }

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching orders:', error);
        return [];
      }

      return (data || []) as Order[];
    } catch (err) {
      console.error('Error fetching orders:', err);
      return [];
    }
  }, [user]);

  return {
    createPayment,
    checkOrderStatus,
    getOrders,
    loading,
    error,
    isConfigured: isPaymeConfigured(),
  };
};
