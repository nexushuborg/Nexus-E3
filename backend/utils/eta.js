// Calculate ETA between two points using OSRM
async function calculateETA(from, to) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`OSRM API error: ${res.status} ${res.statusText}`);
      return null;
    }
    
    const data = await res.json();
    if (!data.routes || !data.routes.length) {
      console.error('No route found between points');
      return null;
    }

    return {
      minutes: Math.ceil(data.routes[0].duration / 60),
      km: (data.routes[0].distance / 1000).toFixed(2)
    };
  } catch (error) {
    console.error('Error calculating ETA:', error);
    return null;
  }
}

// Calculate ETAs to all stops from current bus location
async function calculateStopWiseETA(current, stops) {
  const result = [];

  for (const stop of stops) {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${current.lng},${current.lat};${stop.coordinates.lng},${stop.coordinates.lat}?overview=false`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`OSRM API error for stop ${stop.name}: ${res.status} ${res.statusText}`);
        continue;
      }
      
      const data = await res.json();
      if (!data.routes || !data.routes.length) {
        console.warn(`No route found for stop ${stop.name}`);
        continue;
      }

      result.push({
        stopName: stop.name,
        stopId: stop.sequenceOrder,
        minutes: Math.ceil(data.routes[0].duration / 60),
        km: (data.routes[0].distance / 1000).toFixed(2)
      });
    } catch (error) {
      console.error(`Error calculating ETA for stop ${stop.name}:`, error);
      continue;
    }
  }

  return result;
}

// Calculate ETA along the route considering the sequence of stops
async function calculateRouteETA(current, route) {
  const { lat, lng } = current;
  const stops = route.stoppages;
  
  // Find the closest upcoming stop
  let closestStopIndex = 0;
  let minDistance = Infinity;
  
  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const distance = calculateHaversineDistance(lat, lng, stop.coordinates.lat, stop.coordinates.lng);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestStopIndex = i;
    }
  }
  
  const result = {
    currentStopIndex: closestStopIndex,
    stops: []
  };
  
  // Calculate ETAs for all remaining stops from current position
  for (let i = closestStopIndex; i < stops.length; i++) {
    const stop = stops[i];
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${lng},${lat};${stop.coordinates.lng},${stop.coordinates.lat}?overview=false`;
    
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`OSRM API error for stop ${stop.name}: ${res.status} ${res.statusText}`);
        continue;
      }
      
      const data = await res.json();
      if (!data.routes || !data.routes.length) {
        console.warn(`No route found for stop ${stop.name}`);
        continue;
      }
      
      result.stops.push({
        stopName: stop.name,
        stopId: stop.sequenceOrder,
        minutes: Math.ceil(data.routes[0].duration / 60),
        km: (data.routes[0].distance / 1000).toFixed(2),
        sequenceOrder: stop.sequenceOrder,
        coordinates: stop.coordinates,
        arrivalTime: stop.arrivalTime
      });
    } catch (error) {
      console.error(`Error calculating ETA for stop ${stop.name}:`, error);
      continue;
    }
  }
  
  return result;
}

// Calculate Haversine distance between two points
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = {
  calculateETA,
  calculateStopWiseETA,
  calculateRouteETA
};
