'use client';

import { useState } from 'react';
import { createClient } from '../supabase/client';
import type { Database } from '../database.types';

export type DeviceType = Database['public']['Tables']['device_types']['Row'];
type DeviceTypeInsert = Database['public']['Tables']['device_types']['Insert'];

// Available icons for device types
export const DEVICE_TYPE_ICONS = [
  { id: 'laptop', label: 'Noutbuk' },
  { id: 'printer', label: 'Printer' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'smartphone', label: 'Telefon' },
  { id: 'tablet', label: 'Planshet' },
  { id: 'tv', label: 'Televizor' },
  { id: 'cpu', label: 'Kompyuter' },
  { id: 'hard-drive', label: 'Xotira qurilmasi' },
  { id: 'wifi', label: 'Router' },
  { id: 'camera', label: 'Kamera' },
  { id: 'headphones', label: 'Quloqchin' },
  { id: 'gamepad', label: "O'yin qurilmasi" },
  { id: 'watch', label: 'Soat' },
  { id: 'refrigerator', label: 'Muzlatgich' },
  { id: 'washing-machine', label: 'Kir yuvish mashinasi' },
  { id: 'microwave', label: 'Mikrovolnovka' },
  { id: 'air-vent', label: 'Konditsioner' },
  { id: 'speaker', label: 'Karnay' },
  { id: 'keyboard', label: 'Klaviatura' },
  { id: 'mouse', label: 'Sichqoncha' },
  { id: 'projector', label: 'Proyektor' },
  { id: 'battery', label: 'Batareya' },
  { id: 'plug', label: 'Rozetka' },
  { id: 'lamp', label: 'Lampa' },
  { id: 'radio', label: 'Radio' },
  { id: 'cctv', label: 'Kuzatuv kamerasi' },
  { id: 'pc-case', label: 'Kompyuter bloki' },
  { id: 'usb', label: 'USB qurilma' },
  { id: 'bluetooth', label: 'Bluetooth' },
  { id: 'cable', label: 'Kabel' },
  { id: 'fan', label: 'Ventilyator' },
  { id: 'power', label: 'Quvvat manbai' },
  { id: 'wrench', label: "Ta'mirlash" },
  { id: 'settings', label: 'Boshqa' },
] as const;

export type DeviceIconId = typeof DEVICE_TYPE_ICONS[number]['id'];

export function useDeviceTypes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDeviceTypes = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from('device_types')
        .select('*')
        .eq('is_active', true)
        .order('is_system', { ascending: false }) // System types first
        .order('name');

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Error fetching device types:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch device types');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createDeviceType = async (name: string, icon: string = 'settings'): Promise<DeviceType | null> => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: insertError } = await (supabase as any)
        .from('device_types')
        .insert({
          name: name.toLowerCase(),
          icon,
          is_system: false
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      console.error('Error creating device type:', err);
      setError(err instanceof Error ? err.message : 'Failed to create device type');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateDeviceType = async (id: string, updates: Partial<DeviceTypeInsert>): Promise<DeviceType | null> => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data, error: updateError } = await (supabase as any)
        .from('device_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
    } catch (err) {
      console.error('Error updating device type:', err);
      setError(err instanceof Error ? err.message : 'Failed to update device type');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getRepairCountForDeviceType = async (deviceTypeId: string): Promise<number> => {
    try {
      const supabase = createClient();

      const { count, error: countError } = await supabase
        .from('repairs')
        .select('*', { count: 'exact', head: true })
        .eq('device_type_id', deviceTypeId);

      if (countError) throw countError;
      return count || 0;
    } catch (err) {
      console.error('Error counting repairs for device type:', err);
      return -1; // Return -1 to indicate error, prevent deletion
    }
  };

  const deleteDeviceType = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check if there are repairs using this device type
      const repairCount = await getRepairCountForDeviceType(id);
      if (repairCount !== 0) {
        const msg = repairCount === -1
          ? 'Tekshirishda xatolik yuz berdi'
          : `Bu kategoriyada ${repairCount} ta ta'mir bor. Avval ta'mirlarni o'chirib tashlang.`;
        setError(msg);
        return false;
      }

      const supabase = createClient();

      // Soft delete - just set is_active to false
      const { error: deleteError } = await (supabase as any)
        .from('device_types')
        .update({ is_active: false })
        .eq('id', id)
        .eq('is_system', false); // Cannot delete system types

      if (deleteError) throw deleteError;
      return true;
    } catch (err) {
      console.error('Error deleting device type:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete device type');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getDeviceTypes,
    createDeviceType,
    updateDeviceType,
    deleteDeviceType,
    DEVICE_TYPE_ICONS,
  };
}
