'use client';

import { useState, useEffect, useCallback } from 'react';
import { uzbekistanDataService, Region, District, RegionWithDistricts } from '../uzbekistanData';

export interface UseUzbekistanDataReturn {
  regions: Region[];
  districts: District[];
  regionsWithDistricts: RegionWithDistricts[];
  loading: boolean;
  error: string | null;
  getDistrictsByRegion: (regionId: number) => District[];
  getRegionById: (regionId: number) => Region | undefined;
  getDistrictById: (districtId: number) => District | undefined;
  findRegionByName: (name: string) => Region | undefined;
  findDistrictByName: (name: string, regionId?: number) => District | undefined;
}

// Global state to prevent multiple initializations
let globalRegions: Region[] = [];
let globalDistricts: District[] = [];
let globalRegionsWithDistricts: RegionWithDistricts[] = [];
let globalLoading = true;
let globalError: string | null = null;
let initializationPromise: Promise<void> | null = null;
let isInitializing = false;

export function useUzbekistanData(): UseUzbekistanDataReturn {
  const [regions, setRegions] = useState<Region[]>(globalRegions);
  const [districts, setDistricts] = useState<District[]>(globalDistricts);
  const [regionsWithDistricts, setRegionsWithDistricts] = useState<RegionWithDistricts[]>(globalRegionsWithDistricts);
  const [loading, setLoading] = useState(globalLoading);
  const [error, setError] = useState<string | null>(globalError);

  useEffect(() => {

    // If data is already loaded globally, use it
    if (!globalLoading && globalRegions.length > 0) {
      setRegions(globalRegions);
      setDistricts(globalDistricts);
      setRegionsWithDistricts(globalRegionsWithDistricts);
      setLoading(false);
      setError(null);
      return;
    }

    // If initialization is already in progress, wait for it
    if (isInitializing && initializationPromise) {
      initializationPromise.then(() => {
        setRegions(globalRegions);
        setDistricts(globalDistricts);
        setRegionsWithDistricts(globalRegionsWithDistricts);
        setLoading(globalLoading);
        setError(globalError);
      });
      return;
    }

    // Start initialization
    isInitializing = true;
    const loadData = async () => {
      try {
        globalLoading = true;
        setLoading(true);
        setError(null);

        const [regionsData, districtsData, regionsWithDistrictsData] = await Promise.all([
          uzbekistanDataService.getRegions(),
          uzbekistanDataService.getDistricts(),
          uzbekistanDataService.getRegionsWithDistricts()
        ]);

        // Update global state
        globalRegions = regionsData;
        globalDistricts = districtsData;
        globalRegionsWithDistricts = regionsWithDistrictsData;
        globalLoading = false;
        globalError = null;


        // Update local state
        setRegions(regionsData);
        setDistricts(districtsData);
        setRegionsWithDistricts(regionsWithDistrictsData);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Failed to load Uzbekistan data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        globalError = errorMessage;
        globalLoading = false;
        setError(errorMessage);
        setLoading(false);
      } finally {
        isInitializing = false;
        initializationPromise = null;
      }
    };

    initializationPromise = loadData();
  }, []);

  const getDistrictsByRegion = useCallback((regionId: number): District[] => {
    return districts.filter(district => district.region_id === regionId);
  }, [districts]);

  const getRegionById = useCallback((regionId: number): Region | undefined => {
    return regions.find(region => region.id === regionId);
  }, [regions]);

  const getDistrictById = useCallback((districtId: number): District | undefined => {
    return districts.find(district => district.id === districtId);
  }, [districts]);

  const findRegionByName = useCallback((name: string): Region | undefined => {
    const lowerName = name.toLowerCase();
    return regions.find(region =>
      region.name_uz.toLowerCase().includes(lowerName) ||
      region.name_ru.toLowerCase().includes(lowerName) ||
      region.name_oz.toLowerCase().includes(lowerName)
    );
  }, [regions]);

  const findDistrictByName = useCallback((name: string, regionId?: number): District | undefined => {
    const lowerName = name.toLowerCase();
    const searchDistricts = regionId
      ? districts.filter(d => d.region_id === regionId)
      : districts;

    return searchDistricts.find(district =>
      district.name_uz.toLowerCase().includes(lowerName) ||
      district.name_ru.toLowerCase().includes(lowerName) ||
      district.name_oz.toLowerCase().includes(lowerName)
    );
  }, [districts]);

  return {
    regions,
    districts,
    regionsWithDistricts,
    loading,
    error,
    getDistrictsByRegion,
    getRegionById,
    getDistrictById,
    findRegionByName,
    findDistrictByName
  };
}
