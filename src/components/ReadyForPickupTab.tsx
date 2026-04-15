'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, Clock, Package, UserCheck, Info, CheckCircle, Banknote } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Database } from '@/lib/database.types';
import { useBusinessProfile } from '@/lib/businessProfileContext';

type Repair = Database['public']['Tables']['repairs']['Row'] & {
  customer: Database['public']['Tables']['customers']['Row'];
  diagnostic: Database['public']['Tables']['diagnostics']['Row'][];
  pickup_codes?: Database['public']['Tables']['pickup_codes']['Row'][];
};

type ReadyForPickupTabProps = {
  onRepairPickedUp: () => void;
};

type SMSLog = {
  repair_id: string;
  phone_number: string;
  message_type: 'pickup_ready' | 'pickup_reminder';
  sent_at: string;
  status: 'sent' | 'failed';
};

const isSmsEnabled = true; // Set to false if SMS is disabled in your environment

const ReadyForPickupTab = ({ onRepairPickedUp }: ReadyForPickupTabProps) => {
  const t = useTranslations();
  const router = useRouter();
  const [fixedRepairs, setFixedRepairs] = useState<Repair[]>([]);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pickupLoading, setPickupLoading] = useState(false);
  const [completionRecord, setCompletionRecord] = useState<any>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [sendingSMS, setSendingSMS] = useState(false);

  useEffect(() => {
    const fetchFixedRepairs = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        const { data, error: fixedError } = await supabase
          .from('repairs')
          .select(`
            *,
            customer:customers(*),
            diagnostic:diagnostics(*),
            pickup_codes(*)
          `)
          .eq('status', 'fixed')
          .order('created_at', { ascending: true })
          .limit(20);

        if (fixedError) throw fixedError;
        setFixedRepairs(data as Repair[] || []);
      } catch (err) {
        console.error('Error fetching fixed repairs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load repairs');
      } finally {
        setLoading(false);
      }
    };

    fetchFixedRepairs();
  }, []);

  useEffect(() => {
    const fetchCompletionRecord = async () => {
      if (!selectedRepair) {
        setCompletionRecord(null);
        return;
      }

      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('completion_records')
          .select('*')
          .eq('repair_id', selectedRepair.id)
          .maybeSingle();

        if (!error && data) {
          setCompletionRecord(data);
        } else {
          setCompletionRecord(null);
        }
      } catch (err) {
        console.error('Error fetching completion record:', err);
        setCompletionRecord(null);
      }
    };

    fetchCompletionRecord();
  }, [selectedRepair]);

  useEffect(() => {
    const fetchSMSLogs = async () => {
      if (!selectedRepair) {
        setSmsLogs([]);
        return;
      }

      try {
        // In a real implementation, you would fetch from an SMS logs table
        // For now, we'll simulate based on pickup codes created
        const mockSMSLogs: SMSLog[] = selectedRepair.pickup_codes?.map((code, index) => ({
          repair_id: selectedRepair.id,
          phone_number: selectedRepair.customer.phone,
          message_type: index === 0 ? 'pickup_ready' : 'pickup_reminder',
          sent_at: code.created_at,
          status: 'sent' as const
        })) || [];

        setSmsLogs(mockSMSLogs);
      } catch (err) {
        console.error('Error fetching SMS logs:', err);
        setSmsLogs([]);
      }
    };

    fetchSMSLogs();
  }, [selectedRepair]);

  const filteredRepairs = fixedRepairs.filter(repair => {
    const searchLower = searchQuery.toLowerCase();
    return (
      repair.repair_id.toLowerCase().includes(searchLower) ||
      repair.customer.name.toLowerCase().includes(searchLower) ||
      repair.device_type.toLowerCase().includes(searchLower)
    );
  });

  const handleMarkAsPicked = async () => {
    if (!selectedRepair) return;

    // Validate OTP only if SMS is enabled
    if (isSmsEnabled) {
      const expectedCode = getPickupCode(selectedRepair);
      if (otpInput.trim() !== expectedCode) {
        setOtpError('Noto\'g\'ri kod kiritildi');
        return;
      }
      setOtpError('');
    }
    setPickupLoading(true);
    try {
      const supabase = createClient();

      // Update repair status to 'picked'
      const { error: updateError } = await (supabase as any)
        .from('repairs')
        .update({ status: 'picked' })
        .eq('id', selectedRepair.id);

      if (updateError) throw updateError;

      // Remove from fixed repairs list
      setFixedRepairs(prev => prev.filter(r => r.id !== selectedRepair.id));
      setSelectedRepair(null);
      setOtpInput('');
      onRepairPickedUp();
    } catch (err) {
      console.error('Error marking repair as picked:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as picked up');
    } finally {
      setPickupLoading(false);
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

  const sendPickupSMS = async () => {
    if (!selectedRepair) return;

    setSendingSMS(true);
    try {
      // In a real implementation, you would call your SMS service here
      // For now, we'll simulate by creating a new pickup code (which triggers SMS)
      await generatePickupCode(selectedRepair.id);

      // Add to SMS logs
      const newSMSLog: SMSLog = {
        repair_id: selectedRepair.id,
        phone_number: selectedRepair.customer.phone,
        message_type: 'pickup_reminder',
        sent_at: new Date().toISOString(),
        status: 'sent'
      };

      setSmsLogs(prev => [...prev, newSMSLog]);
    } catch (err) {
      console.error('Error sending SMS:', err);
    } finally {
      setSendingSMS(false);
    }
  };

  const sendNewOTP = async () => {
    if (!selectedRepair) return;

    setSendingSMS(true);
    try {
      // Generate new pickup code
      await generatePickupCode(selectedRepair.id);

      // Add to SMS logs
      const newSMSLog: SMSLog = {
        repair_id: selectedRepair.id,
        phone_number: selectedRepair.customer.phone,
        message_type: 'pickup_reminder',
        sent_at: new Date().toISOString(),
        status: 'sent'
      };

      setSmsLogs(prev => [...prev, newSMSLog]);

      // Clear the OTP input and error
      setOtpInput('');
      setOtpError('');

    } catch (err) {
      console.error('Error sending new OTP:', err);
    } finally {
      setSendingSMS(false);
    }
  };

  const generatePickupCode = async (repairId: string) => {
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

      setFixedRepairs(prev =>
        prev.map(r => r.id === repairId ? updatedRepair as Repair : r)
      );

      if (selectedRepair?.id === repairId) {
        setSelectedRepair(updatedRepair as Repair);
      }

      return data;
    } catch (err) {
      console.error('Error generating pickup code:', err);
      return null;
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

          <div className="space-y-4">
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
                    onClick={() => setSelectedRepair(repair)}
                    className={`w-full p-4 border rounded-lg transition-colors text-left
                      ${
                        selectedRepair?.id === repair.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-blue-500'
                      }`}
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
                        {diagnostic.estimated_cost && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Banknote className="w-4 h-4" />
                            <span>{diagnostic.estimated_cost.toLocaleString()} UZS</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Tayyor
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-8">
                Olib ketishga tayyor ta'mirlashlar yo'q
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Repair Details */}
      <div className="col-span-1 md:col-span-8">
        {selectedRepair ? (
          <div className="space-y-6">
            {/* Repair Details Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Ta'mirlash tafsilotlari</h3>

              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ta'mirlash ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{selectedRepair.repair_id}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Mijoz</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a
                      href={`/customer/${selectedRepair.customer.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        router.push(`/customer/${selectedRepair.customer.id}`);
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      {selectedRepair.customer.name}
                    </a>
                    <div className="text-gray-500">{selectedRepair.customer.phone}</div>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Qurilma</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedRepair.device_type}
                    {selectedRepair.device_model && ` - ${selectedRepair.device_model}`}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Muammo</dt>
                  <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded border">{selectedRepair.issue_description}</dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Holat</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Olib ketishga tayyor
                    </span>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Yakunlangan sana</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(selectedRepair.updated_at).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Diagnostic Notes */}
            {(() => {
              const diagnostic = getLatestDiagnostic(selectedRepair);
              return diagnostic ? (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Diagnostika eslatmalari
                  </h4>
                  <div className="space-y-3">
                    {diagnostic.notes && (
                      <div>
                        <dt className="text-sm font-medium text-blue-700 mb-1">Diagnostika:</dt>
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

            {/* Completion Notes */}
            {completionRecord && completionRecord.notes && (
              <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                <h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Yakunlash eslatmalari
                </h4>
                <div className="text-green-800 bg-white p-3 rounded border">
                  {completionRecord.notes}
                </div>
              </div>
            )}

            {/* OTP Verification */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Olib ketishni tasdiqlash
              </h4>

              {/* SMS and OTP Statistics */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">SMS yuborilgan:</span>
                    <span className="ml-2 text-blue-600 font-semibold">{smsLogs.length} marta</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">OTP kodlar soni:</span>
                    <span className="ml-2 text-green-600 font-semibold">{selectedRepair?.pickup_codes?.length || 0} ta</span>
                  </div>
                </div>

                {smsLogs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-2">SMS tarixi:</p>
                    <div className="space-y-1">
                      {smsLogs.slice(-3).map((log, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="text-gray-500">
                            {log.message_type === 'pickup_ready' ? 'Tayyor xabari' : 'Eslatma xabari'}
                          </span>
                          <span className="text-gray-400">
                            {new Date(log.sent_at).toLocaleString('uz-UZ', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={sendPickupSMS}
                    disabled={sendingSMS}
                    className="w-full md:w-auto px-4 py-2 min-h-[44px] text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingSMS ? 'Yuborilmoqda...' : 'SMS eslatma yuborish'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* OTP Section - Only show if SMS is enabled */}
                {isSmsEnabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Olib ketish kodi
                    </label>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={otpInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setOtpInput(val);
                          setOtpError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && otpInput.length === 4 && !pickupLoading) {
                            handleMarkAsPicked();
                          }
                        }}
                        placeholder="Kodini kiriting"
                        className={`flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center ${
                          otpError ? 'border-red-500' : 'border-gray-300'
                        }`}
                        maxLength={4}
                      />
                    </div>
                    {otpError && (
                      <p className="mt-1 text-sm text-red-600">{otpError}</p>
                    )}
                    <div className="mt-2">
                      <button
                        onClick={sendNewOTP}
                        disabled={sendingSMS}
                        className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingSMS ? 'Yangi OTP yuborilmoqda...' : 'Yangi OTP jo\'natish'}
                      </button>
                    </div>
                  </div>
                )}
                {!isSmsEnabled && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      SMS xabarnomalar o'chirilgan. Mijoz Talon (chek) orqali olib ketadi.
                    </p>
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleMarkAsPicked}
                    disabled={pickupLoading || (isSmsEnabled && otpInput.length !== 4)}
                    className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 min-h-[44px] bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserCheck className="w-5 h-5" />
                    {pickupLoading ? 'Belgilanmoqda...' : 'Olib ketilgan deb belgilash'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm h-full flex flex-col items-center justify-center text-gray-500">
            <Package className="w-16 h-16 mb-4" />
            <p>Tafsilotlarni ko'rish uchun ta'mirlashni tanlang</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadyForPickupTab;
