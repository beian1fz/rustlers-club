// api/signup.js - Vercel Serverless Function for handling sign-ups

export default async function handler(req, res) {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, phone, email, smsConsent, source } = req.body;

    // Basic validation
    if (!name || !phone || !email) {
      return res.status(400).json({ 
        message: 'Please provide all required fields' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }

    // Phone validation (basic)
    const phoneRegex = /^\d{10,}$/;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ 
        message: 'Please provide a valid phone number' 
      });
    }

    // Here you would typically:
    // 1. Save to your database
    // 2. Send to your CRM/Email service
    // 3. Send SMS notifications
    // 4. Create member account

    // For now, we'll just log and return success
    console.log('New signup:', {
      name,
      phone: cleanPhone,
      email,
      smsConsent,
      source: source || 'website',
      timestamp: new Date().toISOString()
    });

    // TODO: Integrate with your services:
    // - Database (MongoDB, PostgreSQL, etc.)
    // - Email service (SendGrid, Mailgun, etc.)
    // - SMS service (Twilio, etc.)
    // - CRM (HubSpot, Salesforce, etc.)

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Successfully signed up!',
      data: {
        name,
        email
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'An error occurred. Please try again.' 
    });
  }
}

// Example integration with Twilio for SMS (uncomment and configure):
/*
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendWelcomeSMS(phone, name) {
  try {
    await twilioClient.messages.create({
      body: `Welcome to Rustlers Club, ${name}! Show this text for your first-time member bonus. Reply STOP to unsubscribe.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+1${phone}`
    });
  } catch (error) {
    console.error('SMS error:', error);
  }
}
*/

// Example integration with SendGrid for Email (uncomment and configure):
/*
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendWelcomeEmail(email, name) {
  const msg = {
    to: email,
    from: 'welcome@rustlersclub.com',
    subject: 'Welcome to Rustlers Club!',
    text: `Hi ${name}, welcome to Rustlers Club...`,
    html: `<h1>Welcome ${name}!</h1><p>Thank you for joining...</p>`,
  };
  
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Email error:', error);
  }
}
*/
