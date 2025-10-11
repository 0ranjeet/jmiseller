// src/hooks/useGeoLocation.jsx
import { useState, useCallback } from "react";

export const useGeoLocation = () => {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if we're in a Capacitor native environment (more robust)
  const isCapacitor = (() => {
    if (typeof window === 'undefined') return false;
    const cap = window.Capacitor;
    try {
      // Prefer Capacitor.isNativePlatform() if available (v5+)
      if (cap && typeof cap.isNativePlatform === 'function') {
        return cap.isNativePlatform();
      }
      // Fallback: presence of Capacitor object implies native webview at runtime
      return !!cap;
    } catch {
      return !!cap;
    }
  })();

  // Web-based geolocation
  const getWebLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let errorMessage = "Unable to retrieve location";
          // Provide clearer guidance for common web failures
          if (typeof window !== 'undefined' && window.isSecureContext === false) {
            errorMessage = "This page is not served over HTTPS. Enable HTTPS or use a secure context to access location.";
          }
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please allow location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable. Please check your GPS or network connection.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = "An unknown error occurred while getting location";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 1500, // Increased timeout
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    });
  }, []);

  // Capacitor-based geolocation for mobile apps
  const getCapacitorLocation = useCallback(async () => {
    try {
      // Import Geolocation dynamically to avoid issues when not available
      const { Geolocation } = await import("@capacitor/geolocation");
      const AppMod = await import("@capacitor/app").catch(() => null);

      // Check and request permissions (supporting both fine/coarse schemas)
      const perm = await Geolocation.checkPermissions();
      const status = perm?.location || perm?.coarseLocation || perm?.locationWhenInUse;
      if (status === 'denied') {
        // Try requesting
        const req = await Geolocation.requestPermissions();
        const reqStatus = req?.location || req?.coarseLocation || req?.locationWhenInUse;
        if (reqStatus !== 'granted') {
          throw new Error("Location permission not granted. Please enable location permissions in your device settings.");
        }
      } else if (status !== 'granted') {
        const req = await Geolocation.requestPermissions();
        const reqStatus = req?.location || req?.coarseLocation || req?.locationWhenInUse;
        if (reqStatus !== 'granted') {
          throw new Error("Location permission not granted. Please enable location permissions in your device settings.");
        }
      }

      // Try high-accuracy first
      let position;
      try {
        position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 1500,
        });
      } catch (e1) {
        // Retry with low accuracy (network-based) if GPS is off or fails
        try {
          position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: false,
            timeout: 1500,
          });
        } catch (e2) {
          // Optionally prompt to open settings if available
          const message = e2?.message || e1?.message || "Failed to get location";
          const likelyServicesOff = /location.*(disabled|off)/i.test(message) || /provider.*disabled/i.test(message);
          if (likelyServicesOff && typeof window !== 'undefined' && window.confirm && AppMod?.App?.openSettings) {
            const confirmOpen = window.confirm("Location seems disabled. Open device settings to enable location services?");
            if (confirmOpen) {
              try { await AppMod.App.openSettings(); } catch {}
            }
          }
          throw new Error(message);
        }
      }

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
    } catch (err) {
      throw new Error(err.message || "Failed to get location from device. Please ensure GPS is enabled.");
    }
  }, []);

  // Main function to get current position
  const getCurrentPosition = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let result;

      if (isCapacitor) {
        // Use Capacitor for mobile apps
        result = await getCapacitorLocation();
      } else {
        // Use web geolocation for browsers
        result = await getWebLocation();
      }

      setCoords(result);
      setError(null);
      return result;
    } catch (err) {
      const errorMessage = err.message || "Failed to get location";
      setError(errorMessage);
      setCoords(null);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isCapacitor, getCapacitorLocation, getWebLocation]);

  // Function to open Google Maps with coordinates
  const openInGoogleMaps = useCallback((latitude, longitude, label = "Selected Location") => {
    if (!latitude || !longitude) {
      console.error("Invalid coordinates provided");
      return;
    }

    // Create Google Maps URL
    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}&ll=${latitude},${longitude}&z=17`;
    
    if (isCapacitor) {
      // For mobile apps, use Capacitor's Browser plugin
      import("@capacitor/browser")
        .then(({ Browser }) => {
          Browser.open({ url: googleMapsUrl });
        })
        .catch(() => {
          // Fallback to window.open if Browser plugin is not available
          window.open(googleMapsUrl, "_blank");
        });
    } else {
      // For web, open in new tab
      window.open(googleMapsUrl, "_blank");
    }
  }, [isCapacitor]);

  // Function to get address from coordinates (reverse geocoding)
  const getAddressFromCoords = useCallback(async (latitude, longitude) => {
    try {
      // Using OpenStreetMap Nominatim (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch address");
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }
      
      throw new Error("No address found");
    } catch (err) {
      console.error("Error getting address:", err);
      return null;
    }
  }, []);

  // Function to watch position changes
  const watchPosition = useCallback((callback) => {
    let watchId;

    const startWatching = async () => {
      if (isCapacitor) {
        // For mobile apps
        const { Geolocation } = await import("@capacitor/geolocation");
        watchId = Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 10000,
          },
          (position, err) => {
            if (err) {
              setError(err.message);
              return;
            }
            const result = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            };
            setCoords(result);
            callback(result);
          }
        );
      } else {
        // For web
        if (navigator.geolocation) {
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              const result = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              };
              setCoords(result);
              callback(result);
            },
            (error) => {
              setError(error.message);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            }
          );
        }
      }
    };

    startWatching();

    // Return cleanup function
    return () => {
      if (watchId) {
        if (isCapacitor) {
          import("@capacitor/geolocation").then(({ Geolocation }) => {
            Geolocation.clearWatch({ id: watchId });
          });
        } else {
          navigator.geolocation.clearWatch(watchId);
        }
      }
    };
  }, [isCapacitor]);

  // Function to clear location data
  const clearLocation = useCallback(() => {
    setCoords(null);
    setError(null);
  }, []);

  // Proactively ask for location permission (call on app start if desired)
  const askForLocationPermission = useCallback(async () => {
    try {
      if (isCapacitor) {
        const { Geolocation } = await import("@capacitor/geolocation");
        const statusBefore = await Geolocation.checkPermissions();
        const before = statusBefore?.location || statusBefore?.coarseLocation || statusBefore?.locationWhenInUse || 'unknown';
        if (before === 'granted') return { status: 'granted' };
        const req = await Geolocation.requestPermissions();
        const after = req?.location || req?.coarseLocation || req?.locationWhenInUse || 'unknown';
        return { status: after };
      }
      // Web: cannot proactively prompt without a user gesture; report current state if available
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        try {
          const permStatus = await navigator.permissions.query({ name: 'geolocation' });
          return { status: permStatus.state }; // 'granted' | 'prompt' | 'denied'
        } catch {
          return { status: 'prompt' };
        }
      }
      return { status: 'prompt' };
    } catch (e) {
      return { status: 'error', error: e?.message || 'permission check failed' };
    }
  }, [isCapacitor]);

  return {
    coords,
    error,
    loading,
    getCurrentPosition,
    openInGoogleMaps,
    getAddressFromCoords,
    watchPosition,
    clearLocation,
    isCapacitor,
    askForLocationPermission,
  };
};