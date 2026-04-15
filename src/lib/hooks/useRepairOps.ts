'use client';

import { useState } from 'react';
import { createClient } from '../supabase/client';
import type { Database } from '../database.types';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type Repair = Database['public']['Tables']['repairs']['Row'];
type RepairInsert = Database['public']['Tables']['repairs']['Insert'];
type Diagnostic = Database['public']['Tables']['diagnostics']['Row'];
type CompletionRecord = Database['public']['Tables']['completion_records']['Row'];

export function useRepairOps() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFinancialSummary = async () => {
    try {
      const supabase = createClient();

      // Get total serviced amount (completed repairs with diagnostics)
      const { data: servicedData, error: servicedError } = await (supabase as any)
        .from('repairs')
        .select(`
          id,
          diagnostic:diagnostics(estimated_cost)
        `)
        .eq('status', 'fixed');

      if (servicedError) throw servicedError;

      // Calculate totals
      const servicedTotal = (servicedData || []).reduce((sum: number, repair: any) => {
        const diagnostic = repair.diagnostic?.[0];
        return sum + (diagnostic?.estimated_cost || 0);
      }, 0);

      return {
        servicedAmount: servicedTotal,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  };

  const searchCustomers = async (query: string) => {
    try {
      const supabase = createClient();

      const { data, error: searchError } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
        .limit(5);

      if (searchError) throw searchError;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  };

  const createCustomerWithRepair = async (
    customerData: Omit<CustomerInsert, 'id' | 'created_at'>,
    repairData: Omit<RepairInsert, 'customer_id'>
  ): Promise<Repair | null> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Insert customer
      const { data: customer, error: customerError } = await (supabase as any)
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      if (customerError) throw customerError;
      if (!customer) throw new Error('Failed to create customer');

      // Insert repair
      const { data: repair, error: repairError } = await (supabase as any)
        .from('repairs')
        .insert({
          ...repairData,
          customer_id: customer.id,
        })
        .select()
        .single();

      if (repairError) throw repairError;
      return repair;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createRepairForExistingCustomer = async (
    customerId: string,
    repairData: Omit<RepairInsert, 'customer_id'>
  ): Promise<Repair | null> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: repair, error: repairError } = await (supabase as any)
        .from('repairs')
        .insert({
          ...repairData,
          customer_id: customerId,
        })
        .select()
        .single();

      if (repairError) throw repairError;
      return repair;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getRepairs = async (limit = 5, status = 'pending') => {
    try {
      const supabase = createClient();

      // Fetch repairs with full details, ordered by update date (latest first)
      const { data, error } = await supabase
        .from('repairs')
        .select(`
          *,
          customer:customers(*),
          diagnostic:diagnostics(*),
          pickup_codes:pickup_codes(*)
        `)
        .eq('status', status === 'pending' ? 'accepted' : status)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error in getRepairs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  };

  const createDiagnostic = async (diagnosticData: Omit<Diagnostic, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const supabase = createClient();

      // Start a transaction by first creating the diagnostic
      const { data: diagnostic, error: diagnosticError } = await (supabase as any)
        .from('diagnostics')
        .insert(diagnosticData)
        .select()
        .single();

      if (diagnosticError) throw diagnosticError;

      // Then update the repair status to 'diagnosed'
      const { error: repairError } = await (supabase as any)
        .from('repairs')
        .update({ status: 'diagnosed' })
        .eq('id', diagnosticData.repair_id);

      if (repairError) throw repairError;

      return diagnostic;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  };

  const cancelRepair = async (repairId: string, cancellationNote?: string | null) => {
    try {
      const supabase = createClient();

      const { error } = await (supabase as any)
        .rpc('cancel_repair', {
          repair_id_param: repairId,
          cancellation_note_param: cancellationNote || null
        });

      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  const completeRepair = async (
    repairId: string,
    completionData: Omit<CompletionRecord, 'id' | 'repair_id' | 'completed_at'>
  ) => {
    try {
      const supabase = createClient();

      // Create completion record (status update handled in component)
      const { data, error: completionError } = await (supabase as any)
        .from('completion_records')
        .insert({
          ...completionData,
          repair_id: repairId,
        })
        .select()
        .single();

      if (completionError) throw completionError;

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  };

  return {
    loading,
    error,
    searchCustomers,
    createCustomerWithRepair,
    createRepairForExistingCustomer,
    getRepairs,
    createDiagnostic,
    completeRepair,
    cancelRepair,
    getFinancialSummary,
  };
}
