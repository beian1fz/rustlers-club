// Place this file at: /api/hours.js in your Vercel project
// This fetches your Google Business hours and returns them to your website

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enable CORS for your domain
  res.setHeader('Access-Control-Allow-Origin', 'https://rustlersclub.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    // Option 1: Google Places API (Requires API Key)
    const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    const PLACE_ID = process.env.GOOGLE_PLACE_ID || 'ChIJYourPlaceIdHere'; // Find your Place ID
    
    if (GOOGLE_API_KEY) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${PLACE_ID}&` +
        `fields=opening_hours,name,formatted_phone_number&` +
        `key=${GOOGLE_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.result && data.result.opening_hours) {
        // Parse Google's format into our format
        const hours = parseGoogleHours(data.result.opening_hours);
        
        return res.status(200).json({
          success: true,
          source: 'google',
          hours: hours,
          isOpen: data.result.opening_hours.open_now || false,
          lastUpdated: new Date().toISOString()
        });
      }
    }
    
    // Option 2: Fallback to manual hours (update these when you change hours)
    const manualHours = {
      monday: { open: '10:00', close: '02:00', nextDay: true },
      tuesday: { open: '10:00', close: '02:00', nextDay: true },
      wednesday: { open: '10:00', close: '02:00', nextDay: true },
      thursday: { open: '10:00', close: '02:00', nextDay: true },
      friday: { open: '10:00', close: '03:00', nextDay: true },
      saturday: { open: '10:00', close: '03:00', nextDay: true },
      sunday: { open: '12:00', close: '02:00', nextDay: true }
    };
    
    // Calculate if currently open
    const isOpen = isCurrentlyOpen(manualHours);
    
    res.status(200).json({
      success: true,
      source: 'manual',
      hours: manualHours,
      isOpen: isOpen,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching hours:', error);
    res.status(500).json({ 
      error: 'Failed to fetch hours',
      fallback: true 
    });
  }
}

// Helper function to parse Google's hours format
function parseGoogleHours(googleHours) {
  const hours = {
    monday: { open: null, close: null },
    tuesday: { open: null, close: null },
    wednesday: { open: null, close: null },
    thursday: { open: null, close: null },
    friday: { open: null, close: null },
    saturday: { open: null, close: null },
    sunday: { open: null, close: null }
  };
  
  if (!googleHours.periods) return hours;
  
  const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  googleHours.periods.forEach(period => {
    if (period.open) {
      const dayName = dayMap[period.open.day];
      hours[dayName] = {
        open: formatTime(period.open.time),
        close: period.close ? formatTime(period.close.time) : '00:00',
        nextDay: period.close && period.close.day !== period.open.day
      };
    }
  });
  
  return hours;
}

// Helper function to format time from Google's format (HHMM) to our format (HH:MM)
function formatTime(timeStr) {
  if (!timeStr || timeStr.length !== 4) return '00:00';
  return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
}

// Helper function to check if currently open
function isCurrentlyOpen(hours) {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const currentTime = now.getHours() * 100 + now.getMinutes();
  
  const todayHours = hours[currentDay];
  if (!todayHours || !todayHours.open) return false;
  
  const openTime = parseInt(todayHours.open.replace(':', ''));
  const closeTime = parseInt(todayHours.close.replace(':', ''));
  
  // Handle closing after midnight
  if (todayHours.nextDay || closeTime < openTime) {
    return currentTime >= openTime || currentTime < closeTime;
  }
  
  return currentTime >= openTime && currentTime < closeTime;
}
