import { useState, useEffect } from 'react';

export function useCampusGPS() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGPSLocked, setIsGPSLocked] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser.");
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setLatitude(position.coords.latitude);
      setLongitude(position.coords.longitude);
      setIsGPSLocked(true);
      setGpsError(null);
    };

    const handleError = (error: GeolocationPositionError) => {
      setIsGPSLocked(false);
      if (error.code === error.PERMISSION_DENIED) {
        setGpsError("Location Access Denied");
      } else {
        setGpsError("Unable to retrieve your location");
      }
    };

    const geoOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    };

    // 1. Get initial location instantly
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);

    // 2. Set up watchPosition to track movement
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, geoOptions);

    // Cleanup watcher on component unmount
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { latitude, longitude, isGPSLocked, gpsError };
}
