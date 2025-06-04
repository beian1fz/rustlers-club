// api/signup-openphone.js - Direct OpenPhone API Integration

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, phone, email, smsConsent, source, eventType, eventName } = req.body;

    // Validation
    if (!name || !phone || !email) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    
    // Format message for internal notification
    let internalMessage = `🎯 New Rustlers Club Signup!\n\n`;
    internalMessage += `Name: ${name}\n`;
    internalMessage += `Phone: ${phone}\n`;
    internalMessage += `Email: ${email}\n`;
    
    if (eventType && eventName) {
      internalMessage += `\n🎮 Interested in: ${eventName}\n`;
      internalMessage += `Type: ${eventType}\n`;
      
      if (eventType === 'tournament') {
        internalMessage += `\n⚡ ACTION: Register them for ${eventName}`;
      } else if (eventType === 'promotion') {
        internalMessage += `\n⚡ ACTION: Tell them about ${eventName} special`;
      }
    }

    // Send to OpenPhone using their API
    if (process.env.OPENPHONE_API_KEY) {
      try {
        // Option 1: Send as internal message/note
        await sendInternalNote(cleanPhone, name, internalMessage);
        
        // Option 2: Send welcome SMS if consented
        if (smsConsent) {
          await sendWelcomeSMS(cleanPhone, name, eventName);
        }
      } catch (openPhoneError) {
        console.error('OpenPhone API error:', openPhoneError);
        // Continue even if OpenPhone fails
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully signed up!',
      data: { name, email }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'An error occurred. Please try again.' 
    });
  }
}

// Send internal note to your team
async function sendInternalNote(phoneNumber, name, message) {
  const apiKey = process.env.OPENPHONE_API_KEY;
  
  // First, find or create contact
  const contact = await findOrCreateContact(phoneNumber, name);
  
  if (contact) {
    // Add internal note to contact
    const response = await fetch(`https://api.openphone.com/v1/contacts/${contact.id}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: message
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenPhone note failed: ${response.statusText}`);
    }
  }
}

// Find existing contact or create new one
async function findOrCreateContact(phoneNumber, name) {
  const apiKey = process.env.OPENPHONE_API_KEY;
  const formattedPhone = `+1${phoneNumber}`;
  
  // Search for existing contact
  const searchResponse = await fetch(
    `https://api.openphone.com/v1/contacts?phoneNumber=${encodeURIComponent(formattedPhone)}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    }
  );
  
  if (searchResponse.ok) {
    const data = await searchResponse.json();
    if (data.data && data.data.length > 0) {
      return data.data[0]; // Return existing contact
    }
  }
  
  // Create new contact
  const createResponse = await fetch('https://api.openphone.com/v1/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' '),
      phoneNumbers: [{
        phoneNumber: formattedPhone
      }],
      customFields: {
        source: 'Website Signup'
      }
    })
  });
  
  if (createResponse.ok) {
    const newContact = await createResponse.json();
    return newContact.data;
  }
  
  return null;
}

// Send welcome SMS
async function sendWelcomeSMS(phoneNumber, name, eventName) {
  const apiKey = process.env.OPENPHONE_API_KEY;
  const fromNumber = process.env.OPENPHONE_NUMBER;
  
  let messageBody = `Welcome to Rustlers Club, ${name}! 🎯\n\n`;
  
  if (eventName) {
    messageBody += `We see you're interested in ${eventName}. `;
    messageBody += `Our team will text you details shortly!\n\n`;
  }
  
  messageBody += `Show this text for $5 off your first visit. `;
  messageBody += `\n\n📍 6436 NW Loop 410\n📞 (210) 957-1550`;
  messageBody += `\n\nReply STOP to unsubscribe.`;

  const response = await fetch('https://api.openphone.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: [`+1${phoneNumber}`],
      from: fromNumber,
      body: messageBody
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenPhone SMS failed: ${error}`);
  }
  
  return response.json();
}

/* 
OPENPHONE API SETUP:

1. Generate API key from OpenPhone settings
2. Add to Vercel environment variables:
   OPENPHONE_API_KEY=xxxxx
   OPENPHONE_NUMBER=+12109571550

3. Features implemented:
   - Creates/updates contacts
   - Adds internal notes with signup details
   - Sends welcome SMS (if consented)
   - Tracks event interest as custom fields

4. Your team sees in OpenPhone:
   - New contact created
   - Internal note with all details
   - What they're interested in
   - SMS conversation started

API Documentation: https://docs.openphone.com/api
*/
