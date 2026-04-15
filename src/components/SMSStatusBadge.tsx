'use client';

import React, { useEffect, useState } from 'react';
import { MessageSquare, CheckCircle, XCircle, Clock, Send, AlertCircle, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSMS } from '@/lib/hooks/useSMS';
import type { Database } from '@/lib/database.types';

type SMSNotification = Database['public']['Tables']['sms_notifications']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type BusinessProfile = Database['public']['Tables']['business_profiles']['Row'];

interface SMSStatusBadgeProps {
  repairId: string;
  customer?: Customer;
  businessProfile?: BusinessProfile | null;
}

const SMSStatusBadge: React.FC<SMSStatusBadgeProps> = ({ repairId, customer, businessProfile }) => {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<SMSNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);
  const { sendAcceptanceSMS, sendRepairStatusSMS, resendSMSWithMessage } = useSMS();

  const fetchNotifications = async () => {
    try {
      const { data: repairData } = await (supabase as any)
        .from('repairs')
        .select('id')
        .eq('repair_id', repairId)
        .maybeSingle();

      if (!repairData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('sms_notifications')
        .select('*')
        .eq('repair_id', repairData.id)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching SMS notifications:', error);
      } else {
        setNotifications(data || []);
      }
    } catch (err) {
      console.error('Exception fetching SMS notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [repairId]);

  const handleResend = async (notification?: SMSNotification) => {
    if (!customer) return;

    const resendKey = notification ? notification.id : 'resend';
    setResending(resendKey);

    try {
      let result;

      if (notification) {
        const notificationType = notification.notification_type;

        if (notificationType === 'acceptance' || notificationType === 'pickup_code') {
          result = await resendSMSWithMessage(
            customer.phone,
            notification.message,
            repairId,
            notificationType
          );
        } else if (notificationType === 'ready' || notificationType === 'completed') {
          result = await sendRepairStatusSMS(
            customer.phone,
            customer.name,
            notificationType,
            repairId,
            businessProfile?.business_name,
            businessProfile?.phone || undefined
          );
        } else {
          result = await resendSMSWithMessage(
            customer.phone,
            notification.message,
            repairId,
            'acceptance'
          );
        }
      } else {
        result = await sendAcceptanceSMS(
          customer.phone,
          customer.name,
          repairId,
          businessProfile?.business_name,
          businessProfile?.master_name || undefined,
          businessProfile?.phone || undefined
        );
      }

      if (result.success) await fetchNotifications();
    } finally {
      setResending(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-20 bg-gray-100 rounded"></div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-50 border-green-200';
      case 'delivered':
        return 'bg-blue-50 border-blue-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Yuborildi';
      case 'delivered':
        return 'Yetkazildi';
      case 'failed':
        return 'Xatolik';
      default:
        return 'Kutilmoqda';
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'ready':
        return 'Tayyor';
      case 'pickup_code':
        return 'Olish kodi';
      case 'completed':
        return 'Yakunlandi';
      case 'diagnosed':
        return 'Diagnostika';
      default:
        return 'SMS';
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-500">SMS xabarlari</h3>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-center mb-3">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Hech qanday SMS yuborilmagan</p>
          </div>
          {customer && (
            <div className="flex justify-center">
              <button
                onClick={() => handleResend()}
                disabled={resending === 'resend'}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs font-medium"
              >
                {resending === 'resend' ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Yuborilmoqda...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    Qayta yuborish
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-semibold text-gray-900">SMS xabarlari tarixi</h3>
        <span className="ml-auto text-xs text-gray-500">{notifications.length} ta xabar</span>
      </div>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-3 rounded-lg border ${getStatusColor(notification.status)}`}
          >
            <div className="mt-0.5">{getStatusIcon(notification.status)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">
                    {getNotificationTypeLabel(notification.notification_type)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    notification.status === 'sent' ? 'bg-green-100 text-green-700' :
                    notification.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                    notification.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {getStatusText(notification.status)}
                  </span>
                </div>
                <span className="text-xs text-gray-600">
                  {new Date(notification.sent_at).toLocaleString('uz-UZ', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <p className="text-xs text-gray-700 mb-1 leading-relaxed">{notification.message}</p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>{notification.phone_number}</span>
                {notification.message_id && (
                  <span className="font-mono">ID: {notification.message_id.slice(0, 8)}</span>
                )}
              </div>

              {notification.status === 'failed' && notification.error_message && (
                <div className="flex items-start gap-2 mb-2 p-2 bg-red-50 rounded">
                  <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700 leading-relaxed">
                    {notification.error_message}
                  </p>
                </div>
              )}

              {customer && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleResend(notification)}
                    disabled={resending === notification.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium transition-colors w-full justify-center ${
                      notification.status === 'failed'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {resending === notification.id ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Yuborilmoqda...
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        Qayta yuborish
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SMSStatusBadge;
