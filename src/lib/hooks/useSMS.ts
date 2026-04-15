'use client';

import { useState } from 'react';
import { createClient } from '../supabase/client';
import { useAuth } from '../auth';
import { useBusinessProfile } from '../businessProfileContext';
import { useBalance } from '../balanceContext';

interface SendSMSParams {
  to: string;
  message: string;
  senderId?: string;
  priority?: number;
  repairId?: string;
  notificationType?: 'ready' | 'pickup_code' | 'completed' | 'acceptance';
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

export const useSMS = () => {
  const { user } = useAuth();
  const { businessProfile } = useBusinessProfile();
  const { balance } = useBalance();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logSMSNotification = async (
    repairId: string,
    phoneNumber: string,
    message: string,
    notificationType: string,
    status: 'sent' | 'delivered' | 'failed',
    messageId?: string,
    errorMessage?: string
  ) => {
    try {
      const supabase = createClient();

      const { data: repairData } = await (supabase as any)
        .from('repairs')
        .select('id')
        .eq('repair_id', repairId)
        .maybeSingle();

      if (!repairData) {
        console.error('Repair not found for logging SMS:', repairId);
        return;
      }

      const { error: insertError } = await (supabase as any)
        .from('sms_notifications')
        .insert({
          repair_id: repairData.id,
          phone_number: phoneNumber,
          message: message,
          status: status,
          message_id: messageId || null,
          notification_type: notificationType,
          error_message: errorMessage || null,
        });

      if (insertError) {
        console.error('Error logging SMS notification:', insertError);
      } else {
        console.log('SMS notification logged successfully');
      }
    } catch (err) {
      console.error('Exception logging SMS notification:', err);
    }
  };

  const sendSMS = async (params: SendSMSParams): Promise<SMSResponse> => {
    setSending(true);
    setError(null);

    try {
      // Check if SMS is enabled in business settings
      const isSmsEnabled = businessProfile?.sms_enabled ?? true;
      if (!isSmsEnabled) {
        const errorMsg = 'SMS xabarnomalar sozlamalarda o\'chirilgan. SMS yuborish mumkin emas.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Check balance before sending (using context)
      const currentBalance = balance ?? 0;
      const hasBalance = currentBalance > 0;

      if (!hasBalance || currentBalance <= 0) {
        const errorMsg = `Balans yetarli emas. Joriy balans: ${currentBalance.toLocaleString()} UZS. Iltimos, balansni to'ldiring.`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-sms`;

      const headers = {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      const data: SMSResponse = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error || 'SMS yuborishda xatolik yuz berdi';
        console.error('SMS Error:', errorMsg);
        setError(errorMsg);

        if (params.repairId && params.notificationType) {
          await logSMSNotification(
            params.repairId,
            params.to,
            params.message,
            params.notificationType,
            'failed',
            undefined,
            errorMsg
          );
        }

        return { success: false, error: errorMsg };
      }

      // CRITICAL: Ensure messageId is always present for successful sends
      if (!data.messageId) {
        const errorMsg = 'SMS yuborildi, lekin message_id olinmadi. SMS kuzatilmaydi.';
        console.error('SMS Error - Missing messageId:', errorMsg);
        setError(errorMsg);

        if (params.repairId && params.notificationType) {
          await logSMSNotification(
            params.repairId,
            params.to,
            params.message,
            params.notificationType,
            'failed',
            undefined,
            errorMsg
          );
        }

        return { success: false, error: errorMsg };
      }

      if (params.repairId && params.notificationType) {
        await logSMSNotification(
          params.repairId,
          params.to,
          params.message,
          params.notificationType,
          'sent',
          data.messageId
        );
      }

      return data;
    } catch (err) {
      console.error('SMS Exception:', err);
      const errorMsg = err instanceof Error ? err.message : 'SMS yuborishda xatolik yuz berdi';
      setError(errorMsg);

      if (params.repairId && params.notificationType) {
        await logSMSNotification(
          params.repairId,
          params.to,
          params.message,
          params.notificationType,
          'failed',
          undefined,
          errorMsg
        );
      }

      return { success: false, error: errorMsg };
    } finally {
      setSending(false);
    }
  };

  const sendRepairStatusSMS = async (
    phoneNumber: string,
    customerName: string,
    status: string,
    repairId: string,
    businessName?: string,
    businessPhone?: string,
    pickupCode?: string
  ): Promise<SMSResponse> => {
    console.log('sendRepairStatusSMS called with:', {
      phoneNumber,
      customerName,
      status,
      repairId,
      businessName,
      businessPhone,
      pickupCode
    });

    let message = '';
    let notificationType: 'ready' | 'completed' | 'acceptance' = 'acceptance';
    const businessInfo = businessName || 'Master';
    const contactInfo = businessPhone ? ` Tel: ${businessPhone}` : '';
    const pickupCodeInfo = pickupCode ? ` KOD: ${pickupCode}` : '';

    switch (status) {
      case 'ready':
        notificationType = 'ready';
        message = `Hurmatli ${customerName}, sizning qurilmangiz tayyor! 5 ish kunidan kechikmasdan olib ketishingizni so'raymiz. ID: ${repairId}. ${businessInfo}${contactInfo}${pickupCodeInfo}`;
        break;
      case 'completed':
        notificationType = 'completed';
        message = `Hurmatli ${customerName}, ta'mirlash muvaffaqiyatli yakunlandi. Xizmatimizdan foydalanganingiz uchun rahmat! ID: ${repairId}. ${businessInfo}`;
        break;
      case 'acceptance':
        notificationType = 'acceptance';
        // For acceptance status, use a generic message or the original message if provided
        message = `Hurmatli ${customerName}, xabar. ID: ${repairId}. ${businessInfo}${contactInfo}`;
        break;
      default:
        throw new Error(`Unknown status: ${status}`);
    }

    console.log('Generated message:', message);

    return sendSMS({
      to: phoneNumber,
      message,
      priority: 3,
      repairId,
      notificationType
    });
  };

  const sendPickupCodeSMS = async (
    phoneNumber: string,
    customerName: string,
    pickupCode: string,
    repairId: string,
    businessName?: string
  ): Promise<SMSResponse> => {
    console.log('sendPickupCodeSMS called with:', {
      phoneNumber,
      customerName,
      pickupCode,
      repairId,
      businessName
    });

    const businessInfo = businessName || 'Master';
    const message = `Hurmatli ${customerName}, olish kodi: ${pickupCode}. Bu kodni qurilmani olishda ko'rsating. ID: ${repairId}. ${businessInfo}`;

    console.log('Generated pickup message:', message);

    return sendSMS({
      to: phoneNumber,
      message,
      priority: 4,
      repairId,
      notificationType: 'pickup_code'
    });
  };

  // Acceptance (device received) SMS helper
  const sendAcceptanceSMS = async (
    phoneNumber: string,
    customerName: string,
    repairId: string,
    businessName?: string,
    masterName?: string,
    businessPhone?: string
  ): Promise<SMSResponse> => {
    const safeCustomer = customerName || 'mijoz';
    const safeBusiness = businessName || 'Biznes';
    const safeMaster = masterName || 'MASTER';
    const safePhone = businessPhone || '';
    const message = `Hurmatli, ${safeCustomer}. Sizning ${safeBusiness}ga qoldirgan qurilmangiz qabul qilindi. ID: ${repairId}. master ${safeMaster}: ${safePhone}`;

    return sendSMS({
      to: phoneNumber,
      message,
      priority: 3,
      repairId,
      notificationType: 'acceptance',
    });
  };

  // Resend SMS using stored message (for acceptance notifications)
  const resendSMSWithMessage = async (
    phoneNumber: string,
    message: string,
    repairId: string,
    notificationType: 'ready' | 'pickup_code' | 'completed' | 'acceptance'
  ): Promise<SMSResponse> => {
    return sendSMS({
      to: phoneNumber,
      message,
      priority: 3,
      repairId,
      notificationType
    });
  };

  return {
    sendSMS,
    sendRepairStatusSMS,
    sendPickupCodeSMS,
    sendAcceptanceSMS,
    resendSMSWithMessage,
    sending,
    error
  };
};
