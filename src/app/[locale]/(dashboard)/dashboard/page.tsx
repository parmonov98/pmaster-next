'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Laptop,
  Printer,
  Monitor,
  Settings,
  AlertCircle,
  Search,
  User,
  Phone,
  Camera,
  X,
  MessageSquare,
  Loader2,
  Plus,
  Smartphone,
  Tablet,
  Tv,
  Cpu,
  HardDrive,
  Wifi,
  Headphones,
  Gamepad2,
  Watch,
  Refrigerator,
  WashingMachine,
  Microwave,
  AirVent,
  Speaker,
  Keyboard,
  Mouse,
  Projector,
  Battery,
  Plug,
  Lamp,
  Radio,
  Cctv,
  PcCase,
  Usb,
  Bluetooth,
  Cable,
  Fan,
  Power,
  Wrench,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useRepairOps } from '@/lib/hooks/useRepairOps';
import { generateRepairId, formatPhoneNumber as formatPhoneDisplay } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/database.types';
import { useBusinessProfile } from '@/lib/businessProfileContext';
import { useSMS } from '@/lib/hooks/useSMS';
import { useDeviceTypes, DEVICE_TYPE_ICONS, type DeviceType, type DeviceIconId } from '@/lib/hooks/useDeviceTypes';
import { usePlanLimits } from '@/lib/hooks/usePlanLimits';
import PlanLimitBanner from '@/components/PlanLimitBanner';
import PhotoSourceSheet from '@/components/PhotoSourceSheet';
import CameraCapture from '@/components/CameraCapture';

// Helper to build icon maps from components
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  'laptop': Laptop,
  'printer': Printer,
  'monitor': Monitor,
  'smartphone': Smartphone,
  'tablet': Tablet,
  'tv': Tv,
  'cpu': Cpu,
  'hard-drive': HardDrive,
  'wifi': Wifi,
  'camera': Camera,
  'headphones': Headphones,
  'gamepad': Gamepad2,
  'watch': Watch,
  'refrigerator': Refrigerator,
  'washing-machine': WashingMachine,
  'microwave': Microwave,
  'air-vent': AirVent,
  'speaker': Speaker,
  'keyboard': Keyboard,
  'mouse': Mouse,
  'projector': Projector,
  'battery': Battery,
  'plug': Plug,
  'lamp': Lamp,
  'radio': Radio,
  'cctv': Cctv,
  'pc-case': PcCase,
  'usb': Usb,
  'bluetooth': Bluetooth,
  'cable': Cable,
  'fan': Fan,
  'power': Power,
  'wrench': Wrench,
  'settings': Settings,
};

const buildIconMap = (size: string): Record<string, React.ReactNode> => {
  const map: Record<string, React.ReactNode> = {};
  for (const [key, Icon] of Object.entries(iconComponents)) {
    map[key] = <Icon className={size} />;
  }
  return map;
};

const iconMap = buildIconMap("w-6 h-6");
const smallIconMap = buildIconMap("w-5 h-5");

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerFormData = Database['public']['Tables']['customers']['Insert'];
type RepairFormData = Omit<Database['public']['Tables']['repairs']['Insert'], 'customer_id'>;

type FormErrors = {
  name?: string;
  phone?: string;
  device_type?: string;
  device_model?: string;
  serial_number?: string;
  issue_description?: string;
};

const MAX_PHOTOS = 4;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type IntakePhoto = {
  id: string;
  storagePath: string;
  url: string;
};

const CustomerIntakePage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const { createCustomerWithRepair, createRepairForExistingCustomer, searchCustomers, loading, error } = useRepairOps();
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const { businessProfile } = useBusinessProfile();
  const { sendAcceptanceSMS } = useSMS();
  const { canCreateRepair, loading: planLoading } = usePlanLimits();

  // Device types hook and state
  const { getDeviceTypes, createDeviceType, updateDeviceType, deleteDeviceType, error: deviceTypeError, loading: deviceTypesLoading } = useDeviceTypes();
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | null>(null);
  const [showNewDeviceTypeModal, setShowNewDeviceTypeModal] = useState(false);
  const [newDeviceTypeName, setNewDeviceTypeName] = useState('');
  const [newDeviceTypeIcon, setNewDeviceTypeIcon] = useState<DeviceIconId>('settings');
  const [isCreatingDeviceType, setIsCreatingDeviceType] = useState(false);

  // Edit device type state
  const [editingDeviceType, setEditingDeviceType] = useState<DeviceType | null>(null);
  const [editDeviceTypeName, setEditDeviceTypeName] = useState('');
  const [editDeviceTypeIcon, setEditDeviceTypeIcon] = useState<DeviceIconId>('settings');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editDeleteError, setEditDeleteError] = useState<string | null>(null);

  const [customerData, setCustomerData] = useState<CustomerFormData>({
    name: '',
    phone: '+998',
  });

  const [repairData, setRepairData] = useState<RepairFormData>({
    repair_id: '',
    device_type: '',
    device_model: '',
    serial_number: '',
    issue_description: '',
    status: 'accepted',
  });

  const [photos, setPhotos] = useState<IntakePhoto[]>([]);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPriceField, setShowPriceField] = useState(false);
  const [price, setPrice] = useState<string>('');

  // Initialize price field visibility
  useEffect(() => {
    if (businessProfile) {
      setShowPriceField(!businessProfile.is_price_hidden);
    }
  }, [businessProfile]);

  // Load device types on mount
  useEffect(() => {
    const loadDeviceTypes = async () => {
      const types = await getDeviceTypes();
      setDeviceTypes(types);
    };
    loadDeviceTypes();
  }, [getDeviceTypes]);

  // Device type handlers...
  const handleCreateDeviceType = async () => {
    if (!newDeviceTypeName.trim()) return;
    setIsCreatingDeviceType(true);
    const newType = await createDeviceType(newDeviceTypeName.trim(), newDeviceTypeIcon);
    if (newType) {
      const types = await getDeviceTypes();
      setDeviceTypes(types);
      setSelectedDeviceType(newType);
      setRepairData(prev => ({ ...prev, device_type: newType.name, device_type_id: newType.id }));
      setFormErrors(prev => ({ ...prev, device_type: undefined }));
      setShowNewDeviceTypeModal(false);
      setNewDeviceTypeName('');
      setNewDeviceTypeIcon('settings');
    }
    setIsCreatingDeviceType(false);
  };

  const handleEditDeviceType = (e: React.MouseEvent, deviceType: DeviceType) => {
    e.stopPropagation();
    setEditingDeviceType(deviceType);
    setEditDeviceTypeName(deviceType.name);
    setEditDeviceTypeIcon((deviceType.icon || 'settings') as DeviceIconId);
    setEditDeleteError(null);
  };

  const handleSaveEditDeviceType = async () => {
    if (!editingDeviceType || !editDeviceTypeName.trim()) return;
    setIsSavingEdit(true);
    const updated = await updateDeviceType(editingDeviceType.id, {
      name: editDeviceTypeName.trim().toLowerCase(),
      icon: editDeviceTypeIcon,
    });
    if (updated) {
      const types = await getDeviceTypes();
      setDeviceTypes(types);
      if (selectedDeviceType?.id === editingDeviceType.id) {
        setSelectedDeviceType(updated);
        setRepairData(prev => ({ ...prev, device_type: updated.name, device_type_id: updated.id }));
      }
      setEditingDeviceType(null);
    }
    setIsSavingEdit(false);
  };

  const handleDeleteDeviceType = async () => {
    if (!editingDeviceType) return;
    setEditDeleteError(null);
    setIsSavingEdit(true);
    const success = await deleteDeviceType(editingDeviceType.id);
    if (success) {
      const types = await getDeviceTypes();
      setDeviceTypes(types);
      if (selectedDeviceType?.id === editingDeviceType.id) {
        setSelectedDeviceType(null);
        setRepairData(prev => ({ ...prev, device_type: '', device_type_id: undefined }));
      }
      setEditingDeviceType(null);
    } else {
      setEditDeleteError(deviceTypeError || "O'chirishda xatolik yuz berdi");
    }
    setIsSavingEdit(false);
  };

  const handleSelectDeviceType = (deviceType: DeviceType) => {
    setSelectedDeviceType(deviceType);
    setRepairData(prev => ({ ...prev, device_type: deviceType.name, device_type_id: deviceType.id }));
    setFormErrors(prev => ({ ...prev, device_type: undefined }));
  };

  const getDeviceTypeIcon = (iconKey: string | null) => {
    return iconMap[iconKey || 'settings'] || iconMap['settings'];
  };

  const getDeviceTypeLabel = (deviceType: DeviceType) => {
    if (deviceType.is_system) {
      const translationKey = deviceType.name === 'other' ? 'other' : deviceType.name;
      return t(translationKey);
    }
    return deviceType.name.charAt(0).toUpperCase() + deviceType.name.slice(1);
  };

  const validateUzbekPhone = (phone: string): boolean => {
    const phoneWithoutPrefix = phone.replace('+998', '');
    const uzbekPhoneRegex = /^\d{9}$/;
    return uzbekPhoneRegex.test(phoneWithoutPrefix);
  };

  const formatPhoneNumber = (value: string): string => {
    if (!value.startsWith('+998')) {
      value = '+998' + value.replace(/^\+?998?/, '');
    }
    value = '+998' + value.slice(4).replace(/\D/g, '');
    if (value.length > 13) {
      value = value.slice(0, 13);
    }
    return value;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newErrors: string[] = [];
    const newPhotos: IntakePhoto[] = [];

    if (!user) {
      newErrors.push(t('genericError'));
    } else {
      for (const file of files) {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          newErrors.push(t('unsupportedImageType', { name: file.name }));
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          newErrors.push(t('fileTooLarge', { name: file.name }));
          continue;
        }
        if (photos.length + newPhotos.length >= MAX_PHOTOS) {
          newErrors.push(t('maxPhotosReached'));
          break;
        }
        try {
          const ext = file.name.split('.').pop() || 'jpg';
          const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const filePath = `${user.id}/${id}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('repair-images')
            .upload(filePath, file, { upsert: false, contentType: file.type });

          if (uploadError) {
            console.error('Photo upload error:', uploadError);
            newErrors.push(t('genericError'));
            continue;
          }

          const { data: { publicUrl } } = supabase.storage.from('repair-images').getPublicUrl(filePath);
          newPhotos.push({ id, storagePath: filePath, url: publicUrl });
        } catch (err) {
          console.error('Photo upload error:', err);
          newErrors.push(t('genericError'));
        }
      }
    }

    if (newPhotos.length > 0) {
      setPhotos(prev => [...prev, ...newPhotos]);
    }
    if (newErrors.length > 0) {
      setPhotoErrors(newErrors);
    } else {
      setPhotoErrors([]);
    }
    e.target.value = '';
  };

  const handleCameraCapture = async (file: File) => {
    if (!user) return;
    if (photos.length >= MAX_PHOTOS) {
      setPhotoErrors([t('maxPhotosReached')]);
      return;
    }
    try {
      const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const filePath = `${user.id}/${id}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('repair-images')
        .upload(filePath, file, { upsert: false, contentType: 'image/jpeg' });
      if (uploadError) {
        setPhotoErrors([t('genericError')]);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('repair-images').getPublicUrl(filePath);
      setPhotos(prev => [...prev, { id, storagePath: filePath, url: publicUrl }]);
      setPhotoErrors([]);
    } catch {
      setPhotoErrors([t('genericError')]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoErrors([]);
  };

  const handleSearch = async (field: 'name' | 'phone', value: string) => {
    if (field === 'phone') {
      value = formatPhoneNumber(value);
    }
    if (searchTimeout) clearTimeout(searchTimeout);
    setCustomerData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: undefined }));

    if (field === 'name' && value.length < 2) {
      setSearchResults([]);
      return;
    }
    if (field === 'phone' && value.length < 8) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const results = await searchCustomers(value);
      if (results) setSearchResults(results);
    }, 300);
    setSearchTimeout(timeout);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    const formattedPhone = customer.phone.startsWith('+998') ? customer.phone : formatPhoneNumber(customer.phone);
    setCustomerData({ name: customer.name, phone: formattedPhone });
    setSearchResults([]);
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!customerData.name.trim()) {
      errors.name = t('nameRequired');
      isValid = false;
    }
    if (customerData.phone && !customerData.phone.startsWith('+998')) {
      const formattedPhone = formatPhoneNumber(customerData.phone);
      setCustomerData(prev => ({ ...prev, phone: formattedPhone }));
    }
    if (!customerData.phone.trim() || customerData.phone === '+998') {
      errors.phone = t('phoneRequired');
      isValid = false;
    } else if (customerData.phone.length === 13 && !validateUzbekPhone(customerData.phone)) {
      errors.phone = t('invalidPhone');
      isValid = false;
    } else if (customerData.phone.length < 13) {
      errors.phone = t('phoneIncomplete');
      isValid = false;
    }

    if (!repairData.device_type) {
      errors.device_type = t('deviceTypeRequired');
      isValid = false;
    }
    if (!repairData.device_model?.trim()) {
      errors.device_model = t('deviceModelRequired');
      isValid = false;
    }
    if (!repairData.serial_number?.trim()) {
      errors.serial_number = t('serialNumberRequired');
      isValid = false;
    }
    if (!repairData.issue_description.trim()) {
      errors.issue_description = t('issueDescriptionRequired');
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || loading || !canCreateRepair || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const repairId = await generateRepairId();
      const finalRepairData = {
        ...repairData,
        repair_id: repairId,
        price: price && price.trim() !== '' ? parseFloat(price) : null,
        device_model: repairData.device_model ?? null,
        serial_number: repairData.serial_number ?? null,
        status: repairData.status ?? 'accepted',
      };

      let repair: Database['public']['Tables']['repairs']['Row'] | null = null;
      if (selectedCustomer) {
        repair = await createRepairForExistingCustomer(selectedCustomer.id, finalRepairData);
      } else {
        repair = await createCustomerWithRepair(customerData, finalRepairData);
      }

      if (repair) {
        if (photos.length > 0 && user) {
          try {
            type RepairPhoto = Database['public']['Tables']['repair_photos']['Insert'];
            const photoInserts: RepairPhoto[] = photos.map(photo => ({
              repair_id: repair!.id,
              user_id: user.id,
              business_profile_id: businessProfile?.id ?? null,
              image_url: photo.url,
            }));
            const { error: photosError } = await (supabase.from('repair_photos') as any).insert(photoInserts);
            if (photosError) console.error('Failed to save repair photos:', photosError);
          } catch (photoInsertErr) {
            console.error('Unexpected error saving repair photos:', photoInsertErr);
          }
        }

        if (customerData.phone && customerData.name) {
          await sendAcceptanceSMS(
            customerData.phone,
            customerData.name,
            repair.repair_id,
            businessProfile?.business_name || undefined,
            businessProfile?.master_name || undefined,
            businessProfile?.phone || undefined
          );
        }
        router.push(`/repair/${repair.repair_id}`);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);

  return (
    <div className="max-w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-0 lg:px-4">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <PlanLimitBanner />
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 lg:space-y-8">
        <div className="bg-white p-3 md:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            {t('customerInformation')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
            <div className="relative">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                {t('customerName')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={customerData.name}
                  onChange={(e) => handleSearch('name', e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 md:pl-10 md:pr-4 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('searchOrEnterNewName')}
                />
              </div>
              {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
              {searchResults.length > 0 && customerData.name.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                  {searchResults.map((customer) => (
                    <button key={customer.id} type="button" onClick={() => selectCustomer(customer)} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <a href={`/customer/${customer.id}`} onClick={(e) => { e.preventDefault(); router.push(`/customer/${customer.id}`); }} className="text-sm md:text-base text-blue-600 hover:text-blue-700 hover:underline transition-colors font-medium">
                          {customer.name}
                        </a>
                        <a href={`tel:${customer.phone}`} className="text-sm md:text-base text-gray-500 hover:text-blue-600 hover:underline transition-colors font-medium">
                          {formatPhoneDisplay(customer.phone)}
                        </a>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                {t('phoneNumber')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => handleSearch('phone', e.target.value)}
                  className={`w-full pl-9 pr-3 py-1.5 md:pl-10 md:pr-4 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+998901234567"
                  maxLength={13}
                />
              </div>
              {formErrors.phone && <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>}
              {searchResults.length > 0 && customerData.phone.length >= 8 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                  {searchResults.map((customer) => (
                    <button key={customer.id} type="button" onClick={() => selectCustomer(customer)} className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <a href={`/customer/${customer.id}`} onClick={(e) => { e.preventDefault(); router.push(`/customer/${customer.id}`); }} className="text-sm md:text-base text-blue-600 hover:text-blue-700 hover:underline transition-colors font-medium">
                          {customer.name}
                        </a>
                        <a href={`tel:${customer.phone}`} className="text-sm md:text-base text-gray-500 hover:text-blue-600 hover:underline transition-colors font-medium">
                          {formatPhoneDisplay(customer.phone)}
                        </a>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-3 md:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center gap-2">
            <Laptop className="w-5 h-5 text-blue-600" />
            {t('deviceInformation')}
          </h3>

          <div className="mb-3 md:mb-4">
            {deviceTypesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Yuklanmoqda...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 md:gap-3">
                {deviceTypes.map((deviceType) => (
                  <div key={deviceType.id} className="relative">
                    <button
                      type="button"
                      onClick={() => handleSelectDeviceType(deviceType)}
                      className={`w-full p-3 border rounded-lg flex flex-row items-center justify-center gap-2 transition-all duration-150 ${
                        selectedDeviceType?.id === deviceType.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                          : formErrors.device_type
                          ? 'border-red-500'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      {getDeviceTypeIcon(deviceType.icon)}
                      <span className="text-sm font-medium">{getDeviceTypeLabel(deviceType)}</span>
                    </button>
                    {!deviceType.is_system && (
                      <button
                        type="button"
                        onClick={(e) => handleEditDeviceType(e, deviceType)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-blue-50 hover:border-blue-400 transition-colors"
                        title="Tahrirlash"
                      >
                        <Pencil className="w-2.5 h-2.5 text-gray-500" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setShowNewDeviceTypeModal(true)}
                  className={`p-3 border-2 border-dashed rounded-lg flex flex-row items-center justify-center gap-2 transition-all duration-150 ${
                    formErrors.device_type ? 'border-red-500' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-500'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-medium">Yangi qo'shish</span>
                </button>
              </div>
            )}
            {formErrors.device_type && <p className="mt-2 text-sm text-red-600">{formErrors.device_type}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 lg:gap-6 mb-3 md:mb-5">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                {t('deviceModel')}
              </label>
              <input
                type="text"
                value={repairData.device_model || ''}
                onChange={(e) => {
                  setRepairData(prev => ({ ...prev, device_model: e.target.value }));
                  setFormErrors(prev => ({ ...prev, device_model: undefined }));
                }}
                placeholder="e.g., ThinkPad X1 Carbon"
                className={`w-full px-3 py-1.5 md:px-4 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base ${
                  formErrors.device_model ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.device_model && <p className="mt-1 text-sm text-red-600">{formErrors.device_model}</p>}
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Seriya raqami
              </label>
              <input
                type="text"
                value={repairData.serial_number || ''}
                onChange={(e) => {
                  setRepairData(prev => ({ ...prev, serial_number: e.target.value }));
                  setFormErrors(prev => ({ ...prev, serial_number: undefined }));
                }}
                placeholder="ABC123456789"
                className={`w-full px-3 py-1.5 md:px-4 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base ${
                  formErrors.serial_number ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.serial_number && <p className="mt-1 text-sm text-red-600">{formErrors.serial_number}</p>}
            </div>
          </div>

          <div className="mb-3 md:mb-5">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              {t('devicePhotos')}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              {photos.length < MAX_PHOTOS && (
                <div className="relative">
                  <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePhotoUpload} className="hidden" />
                  <button
                    type="button"
                    onClick={() => setShowPhotoSheet(true)}
                    className="w-full aspect-[3/2] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-150"
                  >
                    <Camera className="w-7 h-7 text-gray-400 mb-1.5" />
                    <span className="text-xs font-medium text-gray-500">{t('addPhoto')}</span>
                  </button>
                </div>
              )}
              {photos.map((photo, index) => (
                <div key={photo.id} className="relative aspect-[3/2]">
                  <img src={photo.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {photoErrors.length > 0 && <div className="mt-2">{photoErrors.map((error, index) => <p key={index} className="text-sm text-red-600">{error}</p>)}</div>}
            <p className="mt-2 text-sm text-gray-500">{t('photoUploadInfo')}</p>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              {t('issueDescription')}
            </label>
            <textarea
              value={repairData.issue_description}
              onChange={(e) => {
                setRepairData(prev => ({ ...prev, issue_description: e.target.value }));
                setFormErrors(prev => ({ ...prev, issue_description: undefined }));
              }}
              rows={4}
              className={`w-full px-3 py-1.5 md:px-4 md:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base ${
                formErrors.issue_description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.issue_description && <p className="mt-1 text-sm text-red-600">{formErrors.issue_description}</p>}
          </div>

          <div className="mb-6">
            {showPriceField && (
              <div className="mb-4">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                  {t('price')} (UZS)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150000"
                  min="0"
                  step="1000"
                  className="w-full px-3 py-1.5 md:px-4 md:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowPriceField(prev => !prev)}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              {showPriceField ? t('hidePriceField') : t('showPriceField')}
            </button>
          </div>
        </div>

        <div className="bg-white p-3 md:p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            SMS xabar ko'rinishi
          </h3>
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                <p className="text-gray-600">
                  Hurmatli, {customerData.name || '[Mijoz ismi]'}. Sizning {businessProfile?.business_name || '[Biznes nomi]'}ga qoldirgan qurilmangiz qabul qilindi. ID: {repairData.repair_id}. master {businessProfile?.master_name || '[Master ismi]'}: {businessProfile?.phone || '[Biznes telefoni]'}
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Bu xabar mijozga qurilma qabul qilingandan so'ng yuboriladi
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pb-4">
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className={`flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 min-h-[48px] bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition-all ${
              loading || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {(loading || isSubmitting) && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading || isSubmitting ? 'Qabul qilinmoqda...' : 'Qabul qilish va Yorliq yaratish'}
          </button>
        </div>
      </form>

      {/* Edit device type modal */}
      {editingDeviceType && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
          onClick={() => setEditingDeviceType(null)}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Qurilma turini tahrirlash</h3>
              <button onClick={() => setEditingDeviceType(null)} className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                value={editDeviceTypeName}
                onChange={(e) => setEditDeviceTypeName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <div className="grid grid-cols-7 gap-2 max-h-48 overflow-y-auto">
                {DEVICE_TYPE_ICONS.map((iconOption) => (
                  <button
                    key={iconOption.id}
                    type="button"
                    onClick={() => setEditDeviceTypeIcon(iconOption.id)}
                    className={`p-2 rounded-lg flex items-center justify-center ${
                      editDeviceTypeIcon === iconOption.id
                        ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                        : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {smallIconMap[iconOption.id]}
                  </button>
                ))}
              </div>
              {editDeleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{editDeleteError}</p>
                </div>
              )}
            </div>
            <div className="flex justify-between p-6 border-t">
              <button
                type="button"
                onClick={handleDeleteDeviceType}
                disabled={isSavingEdit}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                O'chirish
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingDeviceType(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditDeviceType}
                  disabled={!editDeviceTypeName.trim() || isSavingEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingEdit && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSavingEdit ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewDeviceTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4" onClick={() => setShowNewDeviceTypeModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Yangi qurilma turi</h3>
              <button onClick={() => setShowNewDeviceTypeModal(false)} className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                value={newDeviceTypeName}
                onChange={(e) => setNewDeviceTypeName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Konditsioner"
                autoFocus
              />
              <div className="grid grid-cols-7 gap-2 max-h-48 overflow-y-auto">
                {DEVICE_TYPE_ICONS.map((iconOption) => (
                  <button
                    key={iconOption.id}
                    type="button"
                    onClick={() => setNewDeviceTypeIcon(iconOption.id)}
                    className={`p-2 rounded-lg flex items-center justify-center ${
                      newDeviceTypeIcon === iconOption.id
                        ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                        : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {smallIconMap[iconOption.id]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-4 p-6 border-t">
              <button
                type="button"
                onClick={() => setShowNewDeviceTypeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleCreateDeviceType}
                disabled={!newDeviceTypeName.trim() || isCreatingDeviceType}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isCreatingDeviceType && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCreatingDeviceType ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
      <PhotoSourceSheet
        isOpen={showPhotoSheet}
        onClose={() => setShowPhotoSheet(false)}
        onSelectCamera={() => { setShowPhotoSheet(false); setTimeout(() => setShowCamera(true), 150); }}
        onSelectGallery={() => setTimeout(() => galleryInputRef.current?.click(), 100)}
      />
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};

export default CustomerIntakePage;
