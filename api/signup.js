// /api/signup.js

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Extract data from request body
    const { name, phone, email, smsConsent, source, eventType, eventName } = req.body;
    
    // Validate required fields
    if (!name || !phone || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'phone', 'email'] 
      });
    }
    
    // Clean phone number (remove non-digits)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Format internal message for OpenPhone
    let internalMessage = `🎯 New Rustlers Club Signup!\n\n`;
    internalMessage += `Name: ${name}\n`;
    internalMessage += `Phone: ${phone}\n`;
    internalMessage += `Email: ${email}\n`;
    internalMessage += `SMS Consent: ${smsConsent ? 'Yes' : 'No'}\n`;
    internalMessage += `Source: ${source || 'website'}\n`;
    
    if (eventType && eventName) {
      internalMessage += `\n🎮 Interested in: ${eventName}\n`;
      internalMessage += `Type: ${eventType}\n`;
    }

    // Send to OpenPhone
    if (process.env.OPENPHONE_API_KEY && process.env.OPENPHONE_NUMBER) {
      try {
        // Create or update contact
        const contact = await findOrCreateContact(cleanPhone, name, email);
        
        // Add internal note
        if (contact) {
          await addInternalNote(contact.id, internalMessage);
        }
        
        // Send welcome SMS if consented
        if (smsConsent) {
          await sendWelcomeSMS(cleanPhone, name, eventName);
        }
      } catch (openPhoneError) {
        console.error('OpenPhone error:', openPhoneError);
        // Continue even if OpenPhone fails
      }
    }
    
    // Return success response
    return res.status(200).json({ 
      success: true,
      message: 'Signup successful! Check your phone for a welcome message.'
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Helper Functions (put these OUTSIDE the main handler)

// Find or create contact in OpenPhone
async function findOrCreateContact(phoneNumber, name, email) {
  const apiKey = process.env.OPENPHONE_API_KEY;
  const formattedPhone = phoneNumber.startsWith('+1') ? phoneNumber : `+1${phoneNumber}`;
  
  try {
    // Search for existing contact
    const searchUrl = `https://api.openphone.com/v1/contacts?phoneNumber=${encodeURIComponent(formattedPhone)}`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.data && searchData.data.length > 0) {
        console.log('Found existing contact:', searchData.data[0].id);
        return searchData.data[0];
      }
    }
    
    // Create new contact
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');
    
    const createResponse = await fetch('https://api.openphone.com/v1/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        firstName: firstName || name,
        lastName: lastName || '',
        emails: email ? [{ email }] : [],
        phoneNumbers: [{
          phoneNumber: formattedPhone
        }],
        customFields: [{
          key: 'source',
          value: 'Website Signup'
        }]
      })
    });
    
    if (createResponse.ok) {
      const newContact = await createResponse.json();
      console.log('Created new contact:', newContact.data.id);
      return newContact.data;
    } else {
      const errorText = await createResponse.text();
      console.error('Failed to create contact:', errorText);
      return null;
    }
    
  } catch (error) {
    console.error('Contact operation error:', error);
    return null;
  }
}

// Add internal note to contact
async function addInternalNote(contactId, message) {
  const apiKey = process.env.OPENPHONE_API_KEY;
  
  try {
    const response = await fetch(`https://api.openphone.com/v1/contacts/${contactId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        content: message
      })
    });
    
    if (response.ok) {
      console.log('Internal note added successfully');
    } else {
      const errorText = await response.text();
      console.error('Failed to add note:', errorText);
    }
  } catch (error) {
    console.error('Note error:', error);
  }
}

// Send welcome SMS
async function sendWelcomeSMS(phoneNumber, name, eventName) {
  const apiKey = process.env.OPENPHONE_API_KEY;
  const fromNumber = process.env.OPENPHONE_NUMBER;
  
  const firstName = name.split(' ')[0];
  let messageBody = `Hi ${firstName}! Welcome to Rustlers Club 🎯\n\n`;
  
  if (eventName) {
    messageBody += `We see you're interested in ${eventName}. `;
    messageBody += `Our team will text you details shortly!\n\n`;
  }
  
  messageBody += `Show this text for $5 off your first visit!\n\n`;
  messageBody += `📍 6436 NW Loop 410\n`;
  messageBody += `📞 (210) 957-1550\n`;
  messageBody += `💬 Text: (726) 600-8996\n`;
  messageBody += `⏰ Tue-Sat • No time charges!\n\n`;
  messageBody += `Reply STOP to opt out.`;

  try {
    const toNumber = phoneNumber.startsWith('+1') ? phoneNumber : `+1${phoneNumber}`;
    
    const response = await fetch('https://api.openphone.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to: [toNumber],
        from: fromNumber,
        body: messageBody
      })
    });

    if (response.ok) {
      console.log('Welcome SMS sent successfully');
    } else {
      const errorText = await response.text();
      console.error('SMS send failed:', errorText);
    }
  } catch (error) {
    console.error('SMS error:', error);
  }
}
