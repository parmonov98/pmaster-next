'use client';

import { useState, useCallback, useRef } from 'react';
import { createClient } from '../supabase/client';
import { useAuth } from '../auth';
import { isClickConfigured } from '../click';

interface Order {
  id: string;
  order_id: number;
  user_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  order_type: 'balance_topup';
  payment_provider: 'click' | 'payme';
  description: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CreatePaymentRequestParams {
  amount: number;
}

export const useClick = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);

  /**
   * Create a payment request and redirect to Click
   */
  const createPayment = useCallback(async (params: CreatePaymentRequestParams) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    if (!isClickConfigured()) {
      throw new Error('Click is not configured');
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

      // Call backend to create order and generate Click URL
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-click-order`;

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

      const { url: clickUrl, order, order_id } = await response.json();

      // Log URL for debugging
      console.log('=== Click Payment Debug Info ===');
      console.log('Order ID:', order_id);
      console.log('Amount:', amount);
      console.log('Opening Click in new tab:', clickUrl);

      // Open Click checkout in a new tab
      window.open(clickUrl, '_blank', 'noopener,noreferrer');

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
        .eq('payment_provider', 'click')
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
        .eq('payment_provider', 'click')
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

  /**
   * Stop payment status polling
   */
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current !== null) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setPolling(false);
    }
  }, []);

  /**
   * Poll payment status automatically after redirect
   * Polls the database every 2-3 seconds until payment completes or timeout
   *
   * @param orderId - The order ID to poll
   * @param onStatusChange - Callback when status changes
   * @param timeout - Maximum polling time in seconds (default: 60)
   * @param interval - Polling interval in seconds (default: 3)
   */
  const pollPaymentStatus = useCallback(
    async (
      orderId: number,
      onStatusChange?: (order: Order | null) => void,
      timeout: number = 60,
      interval: number = 3
    ): Promise<Order | null> => {
      if (!user) {
        return null;
      }

      // Stop any existing polling
      stopPolling();

      setPolling(true);
      const startTime = Date.now();
      const timeoutMs = timeout * 1000;
      const intervalMs = interval * 1000;

      return new Promise<Order | null>((resolve) => {
        const poll = async () => {
          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            console.log(`Payment polling timeout after ${timeout} seconds`);
            stopPolling();
            resolve(null);
            return;
          }

          try {
            const order = await checkOrderStatus(orderId);

            if (onStatusChange) {
              onStatusChange(order);
            }

            // If order is completed or cancelled/failed, stop polling
            if (order && (order.status === 'completed' || order.status === 'cancelled' || order.status === 'failed')) {
              console.log(`Payment polling stopped: order status is ${order.status}`);
              stopPolling();
              resolve(order);
              return;
            }

            // Continue polling
            pollingIntervalRef.current = window.setTimeout(poll, intervalMs);
          } catch (err) {
            console.error('Error during payment polling:', err);
            stopPolling();
            resolve(null);
          }
        };

        // Start polling immediately
        poll();
      });
    },
    [user, checkOrderStatus, stopPolling]
  );

  return {
    createPayment,
    checkOrderStatus,
    getOrders,
    pollPaymentStatus,
    stopPolling,
    loading,
    polling,
    error,
    isConfigured: isClickConfigured(),
  };
};
