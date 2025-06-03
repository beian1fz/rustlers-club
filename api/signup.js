// Place this file at: /api/signup.js in your Vercel project

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get form data
  const { name, phone, email } = req.body;

  // Validate required fields
  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Format the data for email
  const emailContent = {
    to: 'info@rustlersclub.com', // CHANGE THIS to your actual email
    from: 'noreply@rustlersclub.com', // CHANGE THIS to your verified sender email
    subject: 'New Rustlers Club Sign Up Request',
    html: `
      <h2>New Sign Up Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}</p>
      <hr>
      <p>Send them the Cardopz sign-up link to complete their membership.</p>
    `,
    text: `
      New Sign Up Request
      
      Name: ${name}
      Phone: ${phone}
      Email: ${email}
      Submitted: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}
      
      Send them the Cardopz sign-up link to complete their membership.
    `
  };

  try {
    // Option 1: Using SendGrid (Recommended)
    // First install: npm install @sendgrid/mail
    // Then uncomment this section:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Add this to your Vercel env vars
    
    await sgMail.send(emailContent);
    */

    // Option 2: Using Resend (Alternative)
    // First install: npm install resend
    // Then uncomment this section:
    /*
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY); // Add this to your Vercel env vars
    
    await resend.emails.send(emailContent);
    */

    // Option 3: Using a webhook (e.g., Zapier, Make.com)
    // Uncomment and configure:
    /*
    const webhookUrl = process.env.WEBHOOK_URL; // Add this to your Vercel env vars
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        phone,
        email,
        timestamp: new Date().toISOString()
      })
    });
    */

    // Option 4: Using Nodemailer with SMTP
    // First install: npm install nodemailer
    // Then uncomment this section:
    /*
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    await transporter.sendMail(emailContent);
    */

    // For testing, just log the data
    console.log('New signup:', { name, phone, email });

    // Send success response
    res.status(200).json({ 
      success: true, 
      message: 'Sign up request received successfully' 
    });

  } catch (error) {
    console.error('Error processing signup:', error);
    res.status(500).json({ 
      error: 'Failed to process sign up request' 
    });
  }
}
