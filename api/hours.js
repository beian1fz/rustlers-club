// api/hours.js - Returns business hours and current status

export default function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Business hours configuration
  const businessHours = {
    monday: { open: '10:00', close: '02:00', nextDay: true },
    tuesday: { open: '10:00', close: '02:00', nextDay: true },
    wednesday: { open: '10:00', close: '02:00', nextDay: true },
    thursday: { open: '10:00', close: '02:00', nextDay: true },
    friday: { open: '10:00', close: '03:00', nextDay: true },
    saturday: { open: '10:00', close: '03:00', nextDay: true },
    sunday: { open: '12:00', close: '02:00', nextDay: true }
  };

  // Get current time in CST/CDT (San Antonio timezone)
  const now = new Date();
  const sanAntonioTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
  
  const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][sanAntonioTime.getDay()];
  const currentHour = sanAntonioTime.getHours();
  const currentMinute = sanAntonioTime.getMinutes();
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Check if currently open
  const todayHours = businessHours[currentDay];
  let isOpen = false;

  if (todayHours && todayHours.open) {
    const [openHour, openMinute] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);
    
    const openTimeInMinutes = openHour * 60 + openMinute;
    let closeTimeInMinutes = closeHour * 60 + closeMinute;
    
    // Handle next day closing
    if (todayHours.nextDay) {
      if (currentTimeInMinutes >= openTimeInMinutes) {
        isOpen = true;
      } else if (currentTimeInMinutes < closeTimeInMinutes) {
        isOpen = true;
      }
    } else {
      isOpen = currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
    }
  }

  res.status(200).json({
    hours: businessHours,
    currentDay,
    isOpen,
    currentTime: sanAntonioTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Chicago'
    })
  });
}
