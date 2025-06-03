// Place this file at: /api/reviews.js in your Vercel project
// This fetches your Google reviews and rating

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
    const PLACE_ID = process.env.GOOGLE_PLACE_ID || 'ChIJYourPlaceIdHere';
    
    if (GOOGLE_API_KEY) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?` +
        `place_id=${PLACE_ID}&` +
        `fields=rating,user_ratings_total,reviews&` +
        `key=${GOOGLE_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.result) {
        // Get the most recent positive review
        const reviews = data.result.reviews || [];
        const positiveReview = reviews
          .filter(r => r.rating >= 4)
          .sort((a, b) => b.time - a.time)[0];
        
        return res.status(200).json({
          success: true,
          source: 'google',
          rating: data.result.rating || 4.8,
          totalReviews: data.result.user_ratings_total || 0,
          recentReview: positiveReview ? {
            text: positiveReview.text.substring(0, 200) + (positiveReview.text.length > 200 ? '...' : ''),
            author: positiveReview.author_name,
            rating: positiveReview.rating,
            time: formatTimeAgo(positiveReview.time)
          } : null,
          lastUpdated: new Date().toISOString()
        });
      }
    }
    
    // Option 2: Manual/Fallback data
    // UPDATE THESE VALUES when you check your Google reviews
    const manualData = {
      rating: 4.8,
      totalReviews: 127,
      recentReview: {
        text: "Best poker room in San Antonio! No time charges and the biggest jackpots. Staff is super friendly and professional.",
        author: "Michael R.",
        rating: 5,
        time: "2 weeks ago"
      }
    };
    
    res.status(200).json({
      success: true,
      source: 'manual',
      ...manualData,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reviews',
      fallback: true 
    });
  }
}

// Helper function to format time ago
function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() / 1000) - timestamp);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}
