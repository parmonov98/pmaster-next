'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Search, User, Phone, Wrench, Filter, Banknote, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import type { Database } from '@/lib/database.types';
import { formatPhoneNumber, formatDateTime } from '@/lib/utils';
import { useBusinessProfile } from '@/lib/businessProfileContext';

type Customer = Database['public']['Tables']['customers']['Row'];
type Repair = Database['public']['Tables']['repairs']['Row'] & {
  customer: Database['public']['Tables']['customers']['Row'];
  diagnostic: Database['public']['Tables']['diagnostics']['Row'][];
};

type CustomerWithRepairs = Customer & {
  repairs: Repair[];
};

type FilterState = {
  dateRange: {
    start: string;
    end: string;
  };
  paymentStatus: 'all' | 'paid' | 'unpaid' | 'partial';
  repairStatus: string[];
  hasdiagnostic: boolean | null;
};

type CustomerHistoryTabProps = {
  listOnly?: boolean;
};

const CustomerHistoryTab = ({ listOnly = false }: CustomerHistoryTabProps) => {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const selectedRepairId = params.id as string;
  const { businessProfile } = useBusinessProfile();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [repairSearchResults, setRepairSearchResults] = useState<Repair[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithRepairs | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [latestRepairs, setLatestRepairs] = useState<Repair[]>([]);
  const [latestRepairsLoading, setLatestRepairsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [repairsPage, setRepairsPage] = useState(0);
  const REPAIRS_PER_PAGE = 10;
  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      start: '',
      end: '',
    },
    paymentStatus: 'all',
    repairStatus: [],
    hasdiagnostic: null,
  });

  // Load latest repairs on component mount and when status filter changes
  useEffect(() => {
    const fetchLatestRepairs = async () => {
      if (selectedCustomer || searchQuery.length >= 2) return; // Don't fetch if customer selected or search active

      try {
        setLatestRepairsLoading(true);
        const supabase = createClient();

        const from = 0;
        const to = REPAIRS_PER_PAGE - 1;

        let query = supabase
          .from('repairs')
          .select(`
            *,
            customer:customers(*),
            diagnostic:diagnostics(*)
          `);

        // Apply status filter if not "all"
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        query = query.order('updated_at', { ascending: false }).range(from, to);

        const { data, error } = await query;

        if (error) throw error;

        setLatestRepairs(data || []);

        // Check if there are more repairs to load
        setHasMore((data || []).length === REPAIRS_PER_PAGE);
        setRepairsPage(0);
      } catch (err) {
        console.error('Error fetching latest repairs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load latest repairs');
      } finally {
        setLatestRepairsLoading(false);
      }
    };

    fetchLatestRepairs();
  }, [statusFilter, selectedCustomer, searchQuery]);

  // Ensure latest repairs are shown when search is cleared
  useEffect(() => {
    if (searchQuery.length < 2 && !selectedCustomer) {
      // Search is cleared, ensure we're showing latest repairs
      // The repairsToDisplay logic will handle this automatically
    }
  }, [searchQuery, selectedCustomer]);

  // Load more repairs on scroll
  const loadMoreRepairs = useCallback(async () => {
    if (loadingMore || !hasMore || latestRepairsLoading || selectedCustomer || searchQuery.length >= 2) return;

    const nextPage = repairsPage + 1;
    setRepairsPage(nextPage);

    try {
      setLoadingMore(true);
      const supabase = createClient();

      const from = nextPage * REPAIRS_PER_PAGE;
      const to = from + REPAIRS_PER_PAGE - 1;

      let query = supabase
        .from('repairs')
        .select(`
          *,
          customer:customers(*),
          diagnostic:diagnostics(*)
        `);

      // Apply status filter if not "all"
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      query = query.order('updated_at', { ascending: false }).range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      setLatestRepairs(prev => [...prev, ...(data || [])]);
      setHasMore((data || []).length === REPAIRS_PER_PAGE);
    } catch (err) {
      console.error('Error loading more repairs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more repairs');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, latestRepairsLoading, selectedCustomer, repairsPage, statusFilter, searchQuery]);

  // Scroll detection for infinite scroll
  useEffect(() => {
    if (selectedCustomer) return; // Don't load more when a customer is selected

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      // Load more when user is 200px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadMoreRepairs();
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [selectedCustomer, loadMoreRepairs]);


  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.length < 2) {
      setRepairSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const supabase = createClient();

        // Search for customers
        const customerPromise = supabase
          .from('customers')
          .select('*')
          .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(5);

        // Search for repairs by repair_id, device_model, customer name, or customer phone
        // We'll make multiple queries and combine results to handle related table searches
        const repairQueries = [];

        // Search repairs by repair_id or device_model (direct fields)
        if (query.length >= 2) {
          repairQueries.push(
            supabase
              .from('repairs')
              .select(`
                *,
                customer:customers(*),
                diagnostic:diagnostics(*)
              `)
              .or(`repair_id.ilike.%${query}%,device_model.ilike.%${query}%`)
              .order('created_at', { ascending: false })
              .limit(10)
          );
        }

        // Search repairs by customer name or phone (through customer relation)
        // First, get customer IDs that match the query
        const matchingCustomersQuery = supabase
          .from('customers')
          .select('id')
          .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
          .limit(50); // Get up to 50 matching customers

        const [customerResult, matchingCustomersResult] = await Promise.all([
          customerPromise,
          matchingCustomersQuery
        ]);

        if (customerResult.error) throw customerResult.error;

        // If we found matching customers, search repairs by their IDs
        if (matchingCustomersResult.data && matchingCustomersResult.data.length > 0) {
          const customerIds = matchingCustomersResult.data.map((c: Customer) => c.id);
          repairQueries.push(
            supabase
              .from('repairs')
              .select(`
                *,
                customer:customers(*),
                diagnostic:diagnostics(*)
              `)
              .in('customer_id', customerIds)
              .order('created_at', { ascending: false })
              .limit(10)
          );
        }

        // Execute all repair queries
        const repairResults = await Promise.all(repairQueries);

        // Combine and deduplicate repair results
        const allRepairs: Repair[] = [];
        const seenIds = new Set<string>();

        for (const result of repairResults) {
          if (result.error) {
            console.error('Error searching repairs:', result.error);
            continue;
          }

          if (result.data) {
            for (const repair of result.data as Repair[]) {
              if (!seenIds.has(repair.id)) {
                seenIds.add(repair.id);
                allRepairs.push(repair);
        }
            }
          }
        }

        // Sort by created_at descending and limit to 10 results
        allRepairs.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setRepairSearchResults(allRepairs.slice(0, 10));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search');
      }
    }, 300);

    setSearchTimeout(timeout);
  };

  const selectCustomer = async (customer: Customer) => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('repairs')
        .select(`
          *,
          diagnostic:diagnostics(*)
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSelectedCustomer({
        ...customer,
        repairs: data || []
      });
      setSearchQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer repairs');
    } finally {
      setLoading(false);
    }
  };

  const getLatestDiagnostic = (repair: Repair) => {
    if (!repair.diagnostic || repair.diagnostic.length === 0) return null;
    return repair.diagnostic.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  };

  const getFilteredRepairs = () => {
    if (!selectedCustomer) return [];

    return selectedCustomer.repairs.filter(repair => {
      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const repairDate = new Date(repair.created_at);
        if (filters.dateRange.start && repairDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && repairDate > new Date(filters.dateRange.end)) {
          return false;
        }
      }

      // Repair status filter
      if (filters.repairStatus.length > 0 && !filters.repairStatus.includes(repair.status)) {
        return false;
      }

      // Diagnostic filter
      if (filters.hasdiagnostic !== null) {
        const hasDiagnostic = repair.diagnostic && repair.diagnostic.length > 0;
        if (filters.hasdiagnostic !== hasDiagnostic) {
          return false;
        }
      }

      return true;
    });
  };

  const resetFilters = () => {
    setFilters({
      dateRange: {
        start: '',
        end: '',
      },
      paymentStatus: 'all',
      repairStatus: [],
      hasdiagnostic: null,
    });
  };

  const handleRepairSelect = (repair: Repair) => {
    router.push(`/history/repair/${repair.id}`);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const filteredRepairs = getFilteredRepairs();

  // Filter repairs by status (only needed for customer repairs and search results, not for latestRepairs which are already filtered)
  const getRepairsByStatus = (repairs: Repair[]) => {
    if (statusFilter === 'all') return repairs;
    return repairs.filter(repair => repair.status === statusFilter);
  };

  // Get repairs to display in left panel
  const repairsToDisplay = selectedCustomer
    ? getRepairsByStatus(filteredRepairs)
    : searchQuery.length >= 2
    ? getRepairsByStatus(repairSearchResults)
    : latestRepairs; // latestRepairs are already filtered by status from the database

  const listColumn = (
    <div className={`${listOnly ? 'bg-white' : 'col-span-1 lg:col-span-4 bg-white'} rounded-lg shadow-sm p-3 md:p-4 lg:p-4 lg:sticky lg:top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto pb-16 lg:pb-4`}>
        {/* Sticky Filter Bar - mobile */}
        <div className="sticky top-0 z-10 bg-white pb-2 -mx-2 px-2 lg:static lg:mx-0 lg:px-0 lg:z-auto">
          {/* Chip filters - mobile only */}
          <div className="flex overflow-x-auto gap-2 pb-2 mb-2 lg:hidden scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {[
              { value: 'all', label: t('filterAll') },
              { value: 'accepted', label: t('accepted') },
              { value: 'diagnosed', label: t('filterDiagnosed') },
              { value: 'fixed', label: t('fixed') },
              { value: 'picked', label: t('picked') },
              { value: 'completed', label: t('filterCompleted') },
              { value: 'cancelled', label: t('cancelled') },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`flex-shrink-0 py-2 px-3 rounded-full text-sm font-medium min-h-[44px] transition-colors ${
                  statusFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Status Filter - desktop only */}
          <div className="hidden lg:block mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Holat bo'yicha filtrlash
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">{t('filterAll')}</option>
              <option value="accepted">{t('accepted')}</option>
              <option value="diagnosed">{t('filterDiagnosed')}</option>
              <option value="fixed">{t('fixed')}</option>
              <option value="picked">{t('picked')}</option>
              <option value="completed">{t('filterCompleted')}</option>
              <option value="cancelled">{t('cancelled')}</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative mb-3 md:mb-4 lg:mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('searchByRepairIdCustomerNamePhoneDeviceModel')}
                className="w-full px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Repairs List */}
        <div ref={scrollContainerRef} className="max-h-[calc(100vh-18rem)] overflow-y-auto space-y-4 pr-2">
          {selectedCustomer && (
            <div className="mb-4">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                ← Barcha ta'mirlashlar
              </button>
            </div>
          )}

          {latestRepairsLoading && !selectedCustomer ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          ) : repairsToDisplay.length > 0 ? (
            <>
              {repairsToDisplay.map((repair) => {
                const diagnostic = getLatestDiagnostic(repair);
                if (!repair.customer) return null;

                return (
                  <div
                    key={repair.id}
                    className={`flex gap-1.5 p-2 md:p-3 lg:p-4 border rounded-lg transition-colors min-h-[44px] ${
                      selectedRepairId === repair.id ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-500'
                    }`}
                  >
                    <button
                      onClick={() => handleRepairSelect(repair)}
                      className="flex-1 min-w-0 text-left py-1"
                    >
                      <div className="flex justify-between items-center gap-2 mb-0.5">
                        <span className="font-mono text-sm md:text-base text-blue-600 font-semibold truncate">{repair.repair_id}</span>
                        <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium ${
                          repair.status === 'picked'
                            ? 'bg-green-100 text-green-800'
                            : repair.status === 'fixed'
                            ? 'bg-green-100 text-green-800'
                            : repair.status === 'diagnosed'
                            ? 'bg-blue-100 text-blue-800'
                            : repair.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : repair.status === 'accepted'
                            ? 'bg-yellow-100 text-yellow-800'
                            : repair.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {repair.status === 'picked' ? 'Olib ketilgan' :
                           repair.status === 'fixed' ? 'Tayyor' :
                           repair.status === 'diagnosed' ? 'Sozlanmoqda' :
                           repair.status === 'cancelled' ? 'Bekor qilingan' :
                           repair.status === 'accepted' ? 'Qabul qilingan' :
                           repair.status === 'completed' ? 'Yakunlangan' :
                           'Noma\'lum'}
                        </span>
                      </div>
                      <div className="text-xs md:text-sm text-gray-500 capitalize truncate">
                        {repair.device_type}
                        {repair.device_model && (
                          <span className="font-bold text-blue-600 text-sm md:text-base"> {`- ${repair.device_model}`}</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center gap-2 mt-0.5">
                        <a
                          href={`/customer/${repair.customer.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            selectCustomer(repair.customer);
                          }}
                          className="text-sm md:text-base text-blue-600 hover:text-blue-700 hover:underline transition-colors font-medium truncate"
                        >
                          {repair.customer.name}
                        </a>
                        <span className="text-xs md:text-sm text-gray-400 flex-shrink-0">{formatDateTime(repair.created_at)}</span>
                      </div>
                      {diagnostic && diagnostic.estimated_cost && (
                        <div className="flex items-center gap-1 text-xs md:text-sm text-blue-600 mt-0.5">
                          <Banknote className="w-4 h-4" />
                          <span>{diagnostic.estimated_cost.toLocaleString()} UZS</span>
                        </div>
                      )}
                    </button>
                    <a
                      href={`tel:${repair.customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                      aria-label="Qo'ng'iroq"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>
                );
              })}

              {/* Loading more indicator */}
              {loadingMore && !selectedCustomer && (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-pulse text-gray-500">Yuklanmoqda...</div>
                </div>
              )}

              {/* End of list indicator */}
              {!hasMore && repairsToDisplay.length > 0 && !selectedCustomer && (
                <div className="text-center text-gray-500 py-4 text-sm">
                  Barcha ta'mirlashlar yuklandi
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>
                {searchQuery.length >= 2
                  ? 'Ta\'mirlash topilmadi'
                  : 'Hozircha ta\'mirlashlar yo\'q'}
              </p>
            </div>
          )}
        </div>
      </div>
  );

  if (listOnly) {
    return (
      <>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {listColumn}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
      {error && (
        <div className="col-span-12 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      {listColumn}

      {/* Right Column - Details */}
      <div className="col-span-1 lg:col-span-8 bg-white rounded-lg shadow-sm p-3 md:p-4 lg:p-4">

        {selectedCustomer ? (
        <div className="space-y-6">
          {/* Customer Info */}
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{selectedCustomer.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Phone className="w-5 h-5 text-gray-500" />
                    <a
                      href={`tel:${selectedCustomer.phone}`}
                      className="text-2xl font-medium text-gray-700 hover:text-blue-600 hover:underline transition-colors"
                    >
                      {formatPhoneNumber(selectedCustomer.phone)}
                    </a>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {t('customerSince')}: {new Date(selectedCustomer.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <Filter className="w-5 h-5" />
                <span>{showFilters ? t('hideFilters') : t('showFilters')}</span>
              </button>
              {showFilters && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('resetFilters')}
                </button>
              )}
            </div>

            {showFilters && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('startDate')}
                    </label>
                    <input
                      type="date"
                      value={filters.dateRange.start}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                      className="w-full px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('endDate')}
                    </label>
                    <input
                      type="date"
                      value={filters.dateRange.end}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                      className="w-full px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('repairStatus')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'diagnosed', 'completed', 'cancelled'].map((status) => (
                      <label key={status} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.repairStatus.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                repairStatus: [...prev.repairStatus, status]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                repairStatus: prev.repairStatus.filter(s => s !== status)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm capitalize">{t(status)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('diagnosticStatus')}
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={filters.hasdiagnostic === null}
                        onChange={() => setFilters(prev => ({ ...prev, hasdiagnostic: null }))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{t('all')}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={filters.hasdiagnostic === true}
                        onChange={() => setFilters(prev => ({ ...prev, hasdiagnostic: true }))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{t('withDiagnostic')}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={filters.hasdiagnostic === false}
                        onChange={() => setFilters(prev => ({ ...prev, hasdiagnostic: false }))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{t('withoutDiagnostic')}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Repair History */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">{t('repairHistory')}</h3>
              <div className="text-sm text-gray-500">
                {t('showingRepairs').replace('{{shown}}', filteredRepairs.length.toString()).replace('{{total}}', selectedCustomer.repairs.length.toString())}
              </div>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
                ))}
              </div>
            ) : filteredRepairs.length > 0 ? (
              <div className="space-y-6">
                {filteredRepairs.map((repair) => {
                  const diagnostic = getLatestDiagnostic(repair);

                  return (
                    <button
                      key={repair.id}
                      onClick={() => handleRepairSelect(repair)}
                      className="w-full border rounded-lg p-4 space-y-4 text-left hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-gray-400" />
                            <span className="text-base capitalize">
                              {repair.device_type}
                              {repair.device_model && (
                                <span className="font-bold text-blue-600 text-lg">
                                  {` - ${repair.device_model}`}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm">
                          <span className={`px-3 py-1 rounded-full ${
                            repair.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : repair.status === 'diagnosed'
                              ? 'bg-blue-100 text-blue-800'
                              : repair.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {t(repair.status)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-2">
                        <div className="font-mono text-2xl text-blue-600">ID: {repair.repair_id}</div>
                        <div className="text-2xl text-gray-500">{formatDateTime(repair.created_at)}</div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <strong>{t('issue')}:</strong> {repair.issue_description}
                      </div>

                      {diagnostic && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 mb-1">{t('diagnosticNotes')}</div>
                            <div>{diagnostic.notes}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">{t('requiredParts')}</div>
                            <div>{diagnostic.required_parts || t('none')}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end pt-4 border-t">

                        {diagnostic && diagnostic.estimated_cost && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Banknote className="w-4 h-4" />
                            <span>{t('estimatedCost')}: {diagnostic.estimated_cost.toLocaleString()} UZS</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {t('noRepairsMatch')}
              </div>
            )}
          </div>
        </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <Wrench className="w-16 h-16 mb-4" />
            <p>Ta'mirlash yoki mijozni tanlang</p>
        </div>
      )}
      </div>
    </div>
  );
};

export default CustomerHistoryTab;
