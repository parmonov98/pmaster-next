'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, User, Phone, Wrench, Clock, Banknote, Printer as PrinterIcon, FileText, CheckCircle, AlertCircle, Search, Clipboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import type { Database } from '@/lib/database.types';
import { formatPhoneNumber, formatDateTime, getRepairStageDates } from '@/lib/utils';
import { useBusinessProfile } from '@/lib/businessProfileContext';
import QRCode from 'qrcode';

type Repair = Database['public']['Tables']['repairs']['Row'] & {
  customer: Database['public']['Tables']['customers']['Row'];
  diagnostic: Database['public']['Tables']['diagnostics']['Row'][];
};
type CompletionRecord = Database['public']['Tables']['completion_records']['Row'];
type RepairPhoto = Database['public']['Tables']['repair_photos']['Row'];
type RepairStatusHistory = Database['public']['Tables']['repair_status_history']['Row'];

const RepairHistoryDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations();
  const { businessProfile } = useBusinessProfile();
  const supabase = createClient();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];

  const [repair, setRepair] = useState<Repair | null>(null);
  const [completionRecord, setCompletionRecord] = useState<CompletionRecord | null>(null);
  const [statusHistory, setStatusHistory] = useState<RepairStatusHistory[] | null>(null);
  const [photos, setPhotos] = useState<RepairPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchRepair = async () => {
      if (!id) { setError('Invalid repair ID'); setLoading(false); return; }
      try {
        setLoading(true);
        const { data: repairData, error: repairError } = await supabase.from('repairs').select(`*, customer:customers(*), diagnostic:diagnostics(*)`).eq('id', id).single();
        if (repairError || !repairData) { setError(repairError?.message || 'Repair not found'); setRepair(null); setLoading(false); return; }
        const typedRepairData = repairData as Repair;
        setRepair(typedRepairData);
        const [{ data: crData }, { data: historyData }, { data: photosData }] = await Promise.all([
          supabase.from('completion_records').select('*').eq('repair_id', typedRepairData.id).maybeSingle(),
          supabase.from('repair_status_history').select('*').eq('repair_id', typedRepairData.id).order('changed_at', { ascending: true }),
          supabase.from('repair_photos').select('*').eq('repair_id', typedRepairData.id).order('created_at', { ascending: true }),
        ]);
        setCompletionRecord(crData || null);
        setStatusHistory(historyData || []);
        setPhotos(photosData || []);
      } catch (err) {
        console.error('Error fetching repair:', err);
        setError(err instanceof Error ? err.message : 'Failed to load repair');
      } finally {
        setLoading(false);
      }
    };
    fetchRepair();
  }, [id]);

  const getNotesHistory = () => {
    if (!repair) return [];
    const history: Array<{ stage: string; notes: string; date: string; icon: React.ReactNode }> = [];
    if (repair.issue_description) {
      history.push({ stage: 'Qabul qilish', notes: repair.issue_description, date: repair.created_at, icon: <FileText className="w-4 h-4" /> });
    }
    if (repair.diagnostic?.length) {
      repair.diagnostic.forEach((d) => {
        if (d.notes) {
          history.push({ stage: 'Diagnostika', notes: d.notes, date: d.created_at, icon: <Search className="w-4 h-4" /> });
        }
      });
    }
    if (completionRecord?.notes) {
      history.push({ stage: 'Yakunlash', notes: completionRecord.notes, date: completionRecord.completed_at, icon: <CheckCircle className="w-4 h-4" /> });
    }
    if (repair.status === 'picked' || repair.status === 'completed') {
      history.push({ stage: 'Topshirish', notes: '', date: repair.updated_at, icon: <CheckCircle className="w-4 h-4" /> });
    }
    if (repair.cancellation_note) {
      history.push({ stage: 'Bekor qilish', notes: repair.cancellation_note, date: repair.updated_at, icon: <AlertCircle className="w-4 h-4" /> });
    }
    return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  if (loading) return <div className="flex items-center justify-center min-h-[200px]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  if (error || !repair) return <div className="p-4"><button onClick={() => router.back()} className="flex items-center gap-2 text-blue-600 mb-4 min-h-[44px]"><ChevronLeft className="w-6 h-6" />Orqaga</button><div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error || 'Repair not found'}</div></div>;

  const stageDates = getRepairStageDates(repair, repair.diagnostic, completionRecord, statusHistory);
  const currentStatusDate = repair.status === 'diagnosed' ? stageDates.diagnosed : repair.status === 'fixed' ? stageDates.fixed : repair.status === 'picked' ? stageDates.picked : repair.status === 'cancelled' ? stageDates.cancelled : stageDates.accepted;
  const notesHistory = getNotesHistory();

  return (
    <div className="pb-14 md:pb-16 lg:pb-0">
      <div className="sticky top-12 z-10 bg-white border-b border-gray-200 px-3 md:px-5 lg:px-6 py-2 flex items-center justify-between gap-2">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium min-h-[36px] text-sm">
          <ChevronLeft className="w-5 h-5" />Orqaga
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/diagnostic/repair/${repair.id}`)} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 min-h-[36px] text-sm">
            <Clipboard className="w-4 h-4" />Diagnostika
          </button>
          <button onClick={async () => {
            if (!businessProfile?.id) return;
            setGenerating(true);
            try {
              const labelUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/shop/${businessProfile.id}`;
              const qrDataUrl = await QRCode.toDataURL(labelUrl, { width: 200, margin: 0 });
              const printWindow = window.open('', '_blank', 'width=800,height=600');
              if (!printWindow) return;
              const companyName = businessProfile?.master_name || 'MasterProUZ';
              printWindow.document.write(`<!DOCTYPE html><html><head><title>Print Label - ${repair.repair_id}</title><style>@page { size: 70mm 30mm; margin: 0; }html, body { width: 70mm; height: 30mm; margin: 0; padding: 0; }body { font-family: Arial, sans-serif; }.label-container { width: 70mm; height: 30mm; padding: 1mm 2mm 1.5mm 2mm; overflow: hidden; display: flex; flex-direction: column; }</style></head><body><div class="label-container"><div class="header"><div class="company-info"><h3 style="font-size: 4mm; font-weight: 700;">${companyName}</h3><div style="font-size: 3mm;">Tel: ${businessProfile?.phone || '+998 XX XXX XX XX'}</div></div></div><div style="display: flex; justify-content: space-between; flex: 1;"><div><div style="font-size: 3.5mm; font-weight: 700;">Tiket ID: ${repair.repair_id}</div><div style="font-size: 2.8mm;">Sana: ${new Date(repair.created_at).toLocaleDateString('uz-UZ')}</div></div><div style="width: 20mm; height: 20mm;"><img src="${qrDataUrl}" alt="QR" style="width: 100%; height: 100%;" /></div></div></div></body></html>`);
              printWindow.document.close();
              printWindow.onload = () => { printWindow.focus(); printWindow.print(); printWindow.onafterprint = () => printWindow.close(); };
            } catch (err) { console.error('Error:', err); } finally { setGenerating(false); }
          }} disabled={generating} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 min-h-[36px] text-sm">
            <PrinterIcon className="w-4 h-4" />{generating ? '...' : 'Chop etish'}
          </button>
        </div>
      </div>
      <div className="max-w-4xl space-y-3 md:space-y-4">
        <div className="p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-xs font-medium text-gray-400 uppercase mb-3">{t('customerInformation')}</h3>
          {repair.customer ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <a href={`/customer/${repair.customer.id}`} onClick={(e) => { e.preventDefault(); router.push(`/customer/${repair.customer.id}`); }} className="text-blue-600 hover:underline font-medium">{repair.customer.name}</a>
                <a href={`tel:${repair.customer.phone}`} className="text-gray-600 hover:text-blue-600 text-sm">{formatPhoneNumber(repair.customer.phone)}</a>
              </div>
              <div className="text-sm text-gray-900">{repair.device_type}{repair.device_model && ` - ${repair.device_model}`}</div>
            </div>
          ) : <div className="text-sm text-gray-500">No customer info</div>}
        </div>
        {repair.issue_description && <div className="p-3 md:p-4 bg-blue-50 border border-blue-100 rounded-lg"><p className="text-sm text-blue-800">{repair.issue_description}</p></div>}
        {photos.length > 0 && (
          <div className="p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {photos.map((photo) => <div key={photo.id} className="relative aspect-[2/1]"><img src={photo.image_url} alt="Photo" className="w-full h-full object-cover rounded-lg" /></div>)}
            </div>
          </div>
        )}
        {notesHistory.length > 0 && (
          <div className="p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-xs font-medium text-gray-400 uppercase mb-2">Eslatmalar tarixi</h3>
            <div className="space-y-2">
              {notesHistory.map((item, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">{item.icon}</div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-900">{item.stage}</div>
                      {item.notes && <p className="text-xs text-gray-600 mt-1">{item.notes}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairHistoryDetailPage;
