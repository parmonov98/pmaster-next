'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { YMaps, Map, Placemark, SearchControl } from '@pbe/react-yandex-maps';
import { getYandexMapsQuery } from '@/lib/yandexMaps';

interface YandexMapLocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
}

const YandexMapLocationPicker: React.FC<YandexMapLocationPickerProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  height = '300px'
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.2995, 69.2401]); // Tashkent default
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize map center and marker position
  useEffect(() => {
    if (latitude && longitude) {
      const center: [number, number] = [latitude, longitude];
      setMapCenter(center);
      setMarkerPosition(center);
    }
  }, [latitude, longitude]);

  // Handle map click
  const handleMapClick = (event: any) => {
    const coords = event.get('coords');
    setMarkerPosition(coords);
    onLocationSelect(coords[0], coords[1]);
  };

  // Handle search result selection
  const handleSearchResult = (event: any) => {
    const index = event.get('index');
    const geoObjects = event.get('target').getResultsArray();
    const selectedObject = geoObjects.get(index);
    const coords = selectedObject.geometry.getCoordinates();

    setMarkerPosition(coords);
    onLocationSelect(coords[0], coords[1]);
    setMapCenter(coords);
  };

  // Get current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Brauzeringiz joriy joylashuvni qo\'llab-quvvatlamaydi.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const coords: [number, number] = [lat, lng];
        setMapCenter(coords);
        setMarkerPosition(coords);
        onLocationSelect(lat, lng);
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting current location:', error);
        setIsLocating(false);

        let errorMessage = 'Joriy joylashuvni olishda xatolik yuz berdi.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Joylashuv ruxsati berilmagan. Brauzer sozlamalaridan ruxsat bering.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Joylashuv ma\'lumotlari mavjud emas.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Joylashuv so\'rovi vaqt tugadi. Qayta urinib ko\'ring.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Joylashuvni tanlang</span>
        </div>
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLocating ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700"></div>
              Joylashuv...
            </>
          ) : (
            <>
              <Navigation className="w-3 h-3" />
              Joriy joylashuv
            </>
          )}
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden" style={{ height }}>
        <YMaps
          query={getYandexMapsQuery()}
        >
          <Map
            state={{
              center: mapCenter,
              zoom: 13,
              controls: ['zoomControl', 'fullscreenControl', 'typeSelector']
            }}
            width="100%"
            height="100%"
            onClick={handleMapClick}
          >
            <SearchControl
              options={{
                provider: 'yandex#search',
                noPopup: true,
                noPlacemark: true
              }}
              onResultSelect={handleSearchResult}
            />

            {markerPosition && (
              <Placemark
                geometry={markerPosition}
                options={{
                  preset: 'islands#redDotIcon',
                  draggable: true
                }}
                onDragEnd={(event: any) => {
                  const newCoords = event.get('target').geometry.getCoordinates();
                  setMarkerPosition(newCoords);
                  onLocationSelect(newCoords[0], newCoords[1]);
                }}
              />
            )}
          </Map>
        </YMaps>
      </div>

      <div className="text-xs text-gray-500">
        Xaritada qidirish qutisidan foydalaning, kerakli joyga bosing yoki marker'ni sudrab o'tkazing
      </div>
    </div>
  );
};

export default YandexMapLocationPicker;
