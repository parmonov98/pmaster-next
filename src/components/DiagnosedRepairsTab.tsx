'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, MessageSquare, AlertCircle, Search, Clock, XCircle, Settings, Info } from 'lucide-react';
import { useRepairOps } from '@/lib/hooks/useRepairOps';
import { useSMS } from '@/lib/hooks/useSMS';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth';
import type { Database } from '@/lib/database.types';
import { useBusinessProfile } from '@/lib/businessProfileContext';
import { useRouter } from 'next/navigation';

type Repair = Database['public']['Tables']['repairs']['Row'] & {
  customer: Database['public']['Tables']['customers']['Row'];
  diagnostic: Database['public']['Tables']['diagnostics']['Row'][];
  pickup_codes?: Database['public']['Tables']['pickup_codes']['Row'][];
};

type BusinessProfile = Database['public']['Tables']['business_profiles']['Row'];

type CompletionFormData = {
  notes: string;
};

type DiagnosedRepairsTabProps = {
  onRepairCompleted: () => void;
};

const DiagnosedRepairsTab = ({ onRepairCompleted }: DiagnosedRepairsTabProps) => {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();
  const { completeRepair, cancelRepair, loading, error } = useRepairOps();
  const { sendRepairStatusSMS, sendPickupCodeSMS, sending: smsSending } = useSMS();
  const [diagnosedRepairs, setDiagnosedRepairs] = useState<Repair[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { businessProfile } = useBusinessProfile();
  const [formData, setFormData] = useState<CompletionFormData>({
    notes: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [codeGenerating, setCodeGenerating] = useState(false);


  useEffect(() => {
    const fetchDiagnosedRepairs = async () => {
      try {
        const supabase = createClient();

        const { data, error: diagnosedError } = await supabase
          .from('repairs')
          .select(`
            *,
            customer:customers(*),
            diagnostic:diagnostics(*),
            pickup_codes(*)
          `)
          .eq('status', 'diagnosed')
          .order('created_at', { ascending: true })
          .limit(20);

        if (diagnosedError) throw diagnosedError;
        setDiagnosedRepairs(data as Repair[] || []);
      } catch (err) {
        console.error('Error fetching diagnosed repairs:', err);
      }
    };

    fetchDiagnosedRepairs();
  }, []);

  const filteredRepairs = diagnosedRepairs.filter(repair => {
    const searchLower = searchQuery.toLowerCase();
    return (
      repair.repair_id.toLowerCase().includes(searchLower) ||
      repair.customer.name.toLowerCase().includes(searchLower) ||
      repair.device_type.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = async () => {
    if (!selectedRepair) return;

    setSubmitLoading(true);
    try {
      const supabase = createClient();

      // Update repair status to 'fixed'
      const { error: updateError } = await (supabase as any)
        .from('repairs')
        .update({ status: 'fixed' })
        .eq('id', selectedRepair.id);

      if (updateError) throw updateError;

      // Create completion record
      const completion = await completeRepair(selectedRepair.id, {
        notes: formData.notes || null,
        notification_sent: false,
        user_id: user?.id || '',
        business_profile_id: businessProfile?.id || null,
        checklist_completed: true,
      });

      if (completion) {
        // Send SMS notification
        try {
          console.log('Sending SMS with business info:', {
            businessName: businessProfile?.business_name,
            businessPhone: businessProfile?.phone,
            customerPhone: selectedRepair.customer.phone,
            customerName: selectedRepair.customer.name
          });

          const pickupCode = getPickupCode(selectedRepair);
          const smsResult = await sendRepairStatusSMS(
            selectedRepair.customer.phone,
            selectedRepair.customer.name,
            'ready',
            selectedRepair.repair_id,
            businessProfile?.business_name,
            businessProfile?.phone,
            pickupCode !== 'XXXX' ? pickupCode : undefined
          );

          console.log('SMS result:', smsResult);
        } catch (smsError) {
          console.error('Failed to send SMS:', smsError);
        }

        // Remove from diagnosed repairs
        setDiagnosedRepairs(prev => prev.filter(r => r.id !== selectedRepair.id));
        setSelectedRepair(null);
        setFormData({ notes: '' });
        onRepairCompleted();
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedRepair) return;

    setCancelLoading(true);
    try {
      const success = await cancelRepair(selectedRepair.id);
      if (success) {
        setDiagnosedRepairs(prev => prev.filter(r => r.id !== selectedRepair.id));
        setSelectedRepair(null);
        setFormData({ notes: '' });
        setShowCancelConfirm(false);
      }
    } finally {
      setCancelLoading(false);
    }
  };

  const getLatestDiagnostic = (repair: Repair) => {
    if (!repair.diagnostic || repair.diagnostic.length === 0) return null;
    return repair.diagnostic[repair.diagnostic.length - 1];
  };

  const getPickupCode = (repair: Repair) => {
    if (!repair.pickup_codes || repair.pickup_codes.length === 0) return 'XXXX';
    const activeCode = repair.pickup_codes.find(code => code.is_active);
    return activeCode?.code || 'XXXX';
  };

  const generatePickupCode = async (repairId: string) => {
    setCodeGenerating(true);
    try {
      const supabase = createClient();

      const { data, error } = await (supabase as any).rpc('generate_unique_pickup_code', {
        repair_id_param: repairId
      });

      if (error) throw error;

      // Refresh the repair data to get the new pickup code
      const { data: updatedRepair, error: fetchError } = await supabase
        .from('repairs')
        .select(`
          *,
          customer:customers(*),
          diagnostic:diagnostics(*),
          pickup_codes(*)
        `)
        .eq('id', repairId)
        .single();

      if (fetchError) throw fetchError;

      setDiagnosedRepairs(prev =>
        prev.map(r => r.id === repairId ? updatedRepair as Repair : r)
      );

      if (selectedRepair?.id === repairId) {
        setSelectedRepair(updatedRepair as Repair);
      }

      // Send SMS with pickup code
      if (updatedRepair && data) {
        try {
          const repair = updatedRepair as Repair;
          const pickupCode = getPickupCode(repair);

          console.log('Sending pickup code SMS with business info:', {
            businessName: businessProfile?.business_name,
            customerPhone: repair.customer.phone,
            pickupCode
          });

          const smsResult = await sendPickupCodeSMS(
            repair.customer.phone,
            repair.customer.name,
            pickupCode,
            repair.repair_id,
            businessProfile?.business_name
          );

          console.log('Pickup code SMS result:', smsResult);
        } catch (smsError) {
          console.error('Failed to send pickup code SMS:', smsError);
        }
      }

      return data;
    } catch (err) {
      console.error('Error generating pickup code:', err);
      return null;
    } finally {
      setCodeGenerating(false);
    }
  };

  const handleRepairClick = async (repair: Repair) => {
    setSelectedRepair(repair);

    // Check if repair needs a pickup code
    const hasActiveCode = repair.pickup_codes?.some(code => code.is_active);
    const needsCode = !hasActiveCode;

    if (needsCode) {
      await generatePickupCode(repair.id);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
      {/* Repair Selection */}
      <div className="col-span-1 md:col-span-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchRepairs')}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="h-96 overflow-y-auto space-y-4 pr-2">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
                ))}
              </div>
            ) : filteredRepairs.length > 0 ? (
              filteredRepairs.map((repair) => {
                const diagnostic = getLatestDiagnostic(repair);
                return (
                  <button
                    key={repair.id}
                    onClick={() => handleRepairClick(repair)}
                    disabled={codeGenerating}
                    className={`w-full p-4 border rounded-lg transition-colors text-left
                      ${
                        selectedRepair?.id === repair.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-blue-500'
                      } ${codeGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="font-mono text-sm text-gray-500">{repair.repair_id}</div>
                    <div className="text-base text-gray-500 capitalize">
                      {repair.device_type}
                      {repair.device_model && (
                        <span className="font-bold text-blue-600 text-lg">
                          {` - ${repair.device_model}`}
                        </span>
                      )}
                    </div>
                    <a
                      href={`/customer/${repair.customer.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/customer/${repair.customer.id}`);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      {repair.customer.name}
                    </a>
                    {diagnostic && (
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        {diagnostic.estimated_time && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{diagnostic.estimated_time}h</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Jarayonda
                      </span>
                      {codeGenerating && selectedRepair?.id === repair.id && (
                        <span className="ml-2 text-xs text-gray-500">
                          Kod yaratilmoqda...
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-12 px-4">
                Sozlab qo'yilayotgan ta'mirlashlar yo'q
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Form */}
      <div className="col-span-1 md:col-span-8">
        {selectedRepair ? (
          <div className="space-y-6">
            {/* Diagnostic Information */}
            {(() => {
              const diagnostic = getLatestDiagnostic(selectedRepair);
              return diagnostic ? (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Diagnostika ma'lumotlari
                  </h3>
                  <div className="space-y-3">
                    {diagnostic.notes && (
                      <div>
                        <dt className="text-sm font-medium text-blue-700 mb-1">Diagnostika eslatmalari:</dt>
                        <dd className="text-blue-800 bg-white p-3 rounded border">{diagnostic.notes}</dd>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {diagnostic.estimated_time && (
                        <div>
                          <dt className="text-sm font-medium text-blue-700 mb-1">Taxminiy vaqt:</dt>
                          <dd className="text-blue-800">{diagnostic.estimated_time} soat</dd>
                        </div>
                      )}
                      {diagnostic.estimated_cost && (
                        <div>
                          <dt className="text-sm font-medium text-blue-700 mb-1">Taxminiy narx:</dt>
                          <dd className="text-blue-800">{diagnostic.estimated_cost.toLocaleString()} UZS</dd>
                        </div>
                      )}
                    </div>
                    {diagnostic.required_parts && (
                      <div>
                        <dt className="text-sm font-medium text-blue-700 mb-1">Kerakli qismlar:</dt>
                        <dd className="text-blue-800 bg-white p-3 rounded border">{diagnostic.required_parts}</dd>
                      </div>
                    )}
                  </div>
                </div>
              ) : null;
            })()}

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('completionNotes')}</h3>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                placeholder={t('enterCompletionNotes')}
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('customerNotification')}</h3>
              <div className="flex items-start gap-4">
                <MessageSquare className="w-6 h-6 text-gray-400 mt-1" />
                <div className="flex-1">
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-gray-600">
                      Bizning "{businessProfile?.business_name || 'biznesimiz'}" XKga sozlash uchun qoldirgan qurilmangiz tayyor bo'ldi. master {businessProfile?.master_name || 'Master'}: {businessProfile?.phone || '+998 XX XXX XX XX'} KOD: {getPickupCode(selectedRepair)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-3">
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={cancelLoading}
                className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 min-h-[44px] bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-5 h-5" />
                {cancelLoading ? t('cancelling') : t('cancelRepair')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitLoading}
                className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors
                  ${
                    !submitLoading
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <CheckCircle className="w-5 h-5" />
                {submitLoading ? t('completing') : t('completeRepair')}
              </button>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                  <h4 className="text-xl font-semibold text-gray-800 mb-4">{t('confirmCancellation')}</h4>
                  <p className="text-gray-600 mb-6">
                    {t('cancelRepairWarning')}
                  </p>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      {t('keepRepair')}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={cancelLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {cancelLoading ? t('cancelling') : t('confirmCancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-6 md:p-12 rounded-lg shadow-sm h-full flex flex-col items-center justify-center text-gray-500">
            <Settings className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-center px-4">Yakunlash uchun ta'mirlashni tanlang</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosedRepairsTab;
