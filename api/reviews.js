// api/reviews.js - Returns Google Reviews data

export default function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Mock review data - replace with actual Google Places API integration
  const reviewData = {
    rating: 4.8,
    totalReviews: 147,
    recentReview: {
      text: "Best poker room in San Antonio! No time charges and the biggest jackpots. Staff is super friendly and professional. The Bullseye tournament was amazing!",
      author: "Michael R.",
      rating: 5,
      time: "1 week ago"
    },
    // Additional reviews for rotation
    reviews: [
      {
        text: "Finally a poker room that doesn't charge by the hour! Great games, friendly dealers, and the food is actually good. Will definitely be back.",
        author: "Sarah T.",
        rating: 5,
        time: "3 days ago"
      },
      {
        text: "Love the exclusive table games here. TX Bullseye is addictive! Much better value than The Lodge or SA Card House.",
        author: "James L.",
        rating: 5,
        time: "5 days ago"
      },
      {
        text: "Military discount is awesome! Free membership and they matched my points from another club. Great atmosphere and professional staff.",
        author: "David M.",
        rating: 5,
        time: "2 weeks ago"
      }
    ]
  };

  // Randomly select a recent review
  const allReviews = [reviewData.recentReview, ...reviewData.reviews];
  const randomReview = allReviews[Math.floor(Math.random() * allReviews.length)];

  res.status(200).json({
    rating: reviewData.rating,
    totalReviews: reviewData.totalReviews,
    recentReview: randomReview
  });
}

// To integrate with actual Google Places API:
/*
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const GOOGLE_PLACE_ID = 'ChIJtUcGE4hdXIYRXSONnFBgbMA';
  const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${GOOGLE_PLACE_ID}&fields=rating,user_ratings_total,reviews&key=${API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.result) {
      const { rating, user_ratings_total, reviews } = data.result;
      const recentReview = reviews && reviews[0] ? {
        text: reviews[0].text,
        author: reviews[0].author_name,
        rating: reviews[0].rating,
        time: reviews[0].relative_time_description
      } : null;
      
      res.status(200).json({
        rating,
        totalReviews: user_ratings_total,
        recentReview
      });
    } else {
      throw new Error('No data found');
    }
  } catch (error) {
    console.error('Google Places API error:', error);
    // Return fallback data
    res.status(200).json({
      rating: 4.8,
      totalReviews: 147,
      recentReview: {
        text: "Best poker room in San Antonio!",
        author: "Guest",
        rating: 5,
        time: "Recently"
      }
    });
  }
}
*/
