// Uzbekistan regions and districts data service
// Data source: https://github.com/MIMAXUZ/uzbekistan-regions-data
// NOTE: We bundle JSON locally to avoid runtime HTTP requests.

// Local JSON data (generated from the upstream repo)
import regionsJson from './uzbekistanData/regions.json';
import districtsJson from './uzbekistanData/districts.json';

export interface Region {
  id: number;
  soato_id: number;
  name_uz: string;
  name_oz: string;
  name_ru: string;
}

export interface District {
  id: number;
  region_id: number;
  soato_id: number;
  name_uz: string;
  name_oz: string;
  name_ru: string;
}

export interface RegionWithDistricts extends Region {
  districts: District[];
}

class UzbekistanDataService {
  private regions: Region[] = [];
  private districts: District[] = [];
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // If initialization is already in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }


    this.initializationPromise = (async () => {
      try {
        // Use bundled JSON instead of remote fetch
        this.regions = regionsJson as Region[];
        this.districts = districtsJson as District[];
        this.initialized = true;
      } catch (error) {
        console.error('Failed to load Uzbekistan data from local JSON:', error);
        this.regions = [];
        this.districts = [];
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  async getRegions(): Promise<Region[]> {
    await this.initialize();
    return this.regions;
  }

  async getDistricts(): Promise<District[]> {
    await this.initialize();
    return this.districts;
  }

  async getDistrictsByRegion(regionId: number): Promise<District[]> {
    await this.initialize();
    return this.districts.filter(district => district.region_id === regionId);
  }

  async getRegionsWithDistricts(): Promise<RegionWithDistricts[]> {
    await this.initialize();

    return this.regions.map(region => ({
      ...region,
      districts: this.districts.filter(district => district.region_id === region.id)
    }));
  }

  // Helper method to get region by ID
  async getRegionById(regionId: number): Promise<Region | undefined> {
    await this.initialize();
    return this.regions.find(region => region.id === regionId);
  }

  // Helper method to get district by ID
  async getDistrictById(districtId: number): Promise<District | undefined> {
    await this.initialize();
    return this.districts.find(district => district.id === districtId);
  }

  // Helper method to find region by name (case insensitive)
  async findRegionByName(name: string): Promise<Region | undefined> {
    await this.initialize();
    const lowerName = name.toLowerCase();
    return this.regions.find(region =>
      region.name_uz.toLowerCase().includes(lowerName) ||
      region.name_ru.toLowerCase().includes(lowerName) ||
      region.name_oz.toLowerCase().includes(lowerName)
    );
  }

  // Helper method to find district by name (case insensitive)
  async findDistrictByName(name: string, regionId?: number): Promise<District | undefined> {
    await this.initialize();
    const lowerName = name.toLowerCase();
    const searchDistricts = regionId
      ? this.districts.filter(d => d.region_id === regionId)
      : this.districts;

    return searchDistricts.find(district =>
      district.name_uz.toLowerCase().includes(lowerName) ||
      district.name_ru.toLowerCase().includes(lowerName) ||
      district.name_oz.toLowerCase().includes(lowerName)
    );
  }
}

// Export singleton instance
export const uzbekistanDataService = new UzbekistanDataService();
