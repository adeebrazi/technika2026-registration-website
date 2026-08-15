const { GoogleGenAI, Type } = require('@google/genai');

const verifyPaymentScreenshot = async (imageUrl) => {
  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.warn('WARNING: GEMINI_API_KEY is not set. Mocking payment verification.');
    return {
      utr: 'MOCK' + Math.floor(1000000000 + Math.random() * 9000000000),
      internalId: null,
      appName: 'MOCKPAY',
      finalAiUtr: 'MOCK' + Math.floor(1000000000 + Math.random() * 9000000000),
      amount: 150, // default match
      payeeUpi: 'mock@upi',
      status: 'SUCCESS',
      isEdited: false
    };
  }

  try {
    // 1. Fetch image buffer
    // Handle relative local paths for local testing fallback
    let imageBuffer;
    let mimeType = 'image/jpeg';
    
    if (imageUrl.startsWith('/uploads/')) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'public', imageUrl);
      imageBuffer = fs.readFileSync(filePath);
      if (imageUrl.endsWith('.png')) mimeType = 'image/png';
      else if (imageUrl.endsWith('.webp')) mimeType = 'image/webp';
    } else {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type');
      if (contentType) mimeType = contentType;
    }

    // 2. Call Gemini model via @google/genai SDK
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBuffer.toString('base64'),
          },
        },
        {
          text: 'You are an automated payment verification assistant. Analyze this UPI payment screenshot. Extract the 12-digit UPI reference/UTR string, any alternative bank reference/transaction ID, the payment app name (e.g. GPay, PhonePe, Paytm), the amount paid, payee UPI ID, payment status, and check if the image has been edited or tampered with.',
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            utr: { type: Type.STRING, description: '12-digit UPI reference/UTR string. Null or empty if not found.' },
            internalId: { type: Type.STRING, description: 'Any internal bank transaction ID, transaction reference code, or sequence ID from the receipt. Null or empty if not found.' },
            appName: { type: Type.STRING, description: 'Name of the payment app used (e.g. GPay, PhonePe, Paytm, BHIM, Axis Pay, etc.)' },
            amount: { type: Type.NUMBER, description: 'Amount paid as a number' },
            payeeUpi: { type: Type.STRING, description: 'Payee UPI ID' },
            status: { type: Type.STRING, enum: ['SUCCESS', 'FAILED', 'PENDING', 'UNKNOWN'] },
            isEdited: { type: Type.BOOLEAN, description: 'True if there are signs of image editing or tampering' },
          },
          required: ['amount', 'status', 'isEdited'],
        },
      },
    });

    const resultText = response.text;
    console.log('Gemini raw response:', resultText);
    const parsed = JSON.parse(resultText);
    
    // Fallback Logic:
    let finalAiUtr = '';
    if (parsed.utr && parsed.utr.trim()) {
      finalAiUtr = parsed.utr.trim();
    } else if (parsed.internalId && parsed.internalId.trim()) {
      finalAiUtr = parsed.internalId.trim();
    } else {
      const app = (parsed.appName || 'UNKNOWN').toUpperCase();
      finalAiUtr = `NO_UTR_FOUND | PAID VIA ${app}`;
    }
    
    parsed.finalAiUtr = finalAiUtr;
    return parsed;
  } catch (error) {
    console.error('AI payment verification failed:', error.message);
    return {
      utr: null,
      internalId: null,
      appName: 'UNKNOWN',
      finalAiUtr: 'NO_UTR_FOUND | PAID VIA UNKNOWN',
      amount: 0,
      payeeUpi: '',
      status: 'FAILED',
      isEdited: false,
      error: error.message
    };
  }
};

module.exports = {
  verifyPaymentScreenshot
};
