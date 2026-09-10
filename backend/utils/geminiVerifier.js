const { GoogleGenAI, Type } = require('@google/genai');

const verifyPaymentScreenshot = async (imageInput, mimeTypeInput = 'image/jpeg', fallbackUrl = '') => {
  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.warn('WARNING: GEMINI_API_KEY is not set. Mocking payment verification.');
    return {
      utr: 'MOCK' + Math.floor(1000000000 + Math.random() * 9000000000),
      internalId: null,
      appName: 'MOCKPAY',
      finalAiUtr: 'MOCK' + Math.floor(1000000000 + Math.random() * 9000000000),
      amount: 150, // default match
      payeeName: 'ARKA JAIN UNIVERSITY',
      payeeUpi: '3217855a@bandhan',
      isPayeeArkaJain: true,
      status: 'SUCCESS',
      isEdited: false
    };
  }

  try {
    // 1. Resolve image buffer & mimeType
    let imageBuffer;
    let mimeType = mimeTypeInput || 'image/jpeg';

    if (Buffer.isBuffer(imageInput)) {
      imageBuffer = imageInput;
    } else if (typeof imageInput === 'string') {
      if (imageInput.startsWith('/uploads/')) {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '..', 'public', imageInput);
        imageBuffer = fs.readFileSync(filePath);
        if (imageInput.endsWith('.png')) mimeType = 'image/png';
        else if (imageInput.endsWith('.webp')) mimeType = 'image/webp';
      } else {
        const response = await fetch(imageInput);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type');
        if (contentType) mimeType = contentType;
      }
    } else {
      throw new Error('Invalid image input provided to verifier');
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
          text: `You are an automated payment verification assistant for Technika 6.0 at ARKA JAIN University.
Analyze this UPI / Net Banking payment screenshot or receipt thoroughly.

Security & Verification Instructions:
1. Payee Verification:
   - Official Fest Payee: "ARKA JAIN UNIVERSITY" (or "Arka Jain", "AJU").
   - Official Fest UPI ID / VPA: "3217855a@bandhan" (or Bandhan Bank account for Arka Jain University).
   - Check who the payment was sent to.
   - Set isPayeeArkaJain to true ONLY if the payment recipient is clearly ARKA JAIN UNIVERSITY or the UPI ID 3217855a@bandhan.
   - If the recipient is any other individual, unrelated merchant, or personal UPI account, set isPayeeArkaJain to false.
2. 12-digit UTR / UPI Reference Number:
   - Extract the 12-digit UPI reference number / UTR / transaction sequence number if visible on the screen.
3. Amount Paid:
   - Extract the exact numeric amount in INR paid (e.g. 150, 500, etc.).
4. Payment Status:
   - Set to SUCCESS only if the transaction was completed successfully (e.g., "Paid successfully", "Payment Successful", green checkmark). Otherwise mark FAILED, PENDING, or UNKNOWN.
5. Image Tampering:
   - Check if the receipt shows signs of digital editing, pixel distortion, font mismatch, or fake screenshot generator templates. Set isEdited to true if suspicious.`,
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
            amount: { type: Type.NUMBER, description: 'Amount paid in INR as a number' },
            payeeName: { type: Type.STRING, description: 'Name of the payee/merchant displayed on the receipt' },
            payeeUpi: { type: Type.STRING, description: 'Payee UPI ID displayed on the receipt' },
            isPayeeArkaJain: { type: Type.BOOLEAN, description: 'True ONLY if the payment was sent to ARKA JAIN UNIVERSITY or 3217855a@bandhan' },
            status: { type: Type.STRING, enum: ['SUCCESS', 'FAILED', 'PENDING', 'UNKNOWN'] },
            isEdited: { type: Type.BOOLEAN, description: 'True if there are signs of image editing or tampering' },
            summaryReason: { type: Type.STRING, description: 'Brief 1-sentence explanation of verification result' },
          },
          required: ['amount', 'status', 'isPayeeArkaJain', 'isEdited'],
        },
      },
    });

    const resultText = response.text;
    console.log('Gemini raw response:', resultText);
    const parsed = JSON.parse(resultText);
    
    // Safety check: pattern match if AI was conservative or text is visible
    const payeeText = `${parsed.payeeName || ''} ${parsed.payeeUpi || ''}`.toLowerCase();
    if (payeeText.includes('arka jain') || payeeText.includes('3217855a') || payeeText.includes('bandhan')) {
      parsed.isPayeeArkaJain = true;
    }

    // Fallback Logic for UTR:
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
      payeeName: '',
      payeeUpi: '',
      isPayeeArkaJain: false,
      status: 'FAILED',
      isEdited: false,
      error: error.message
    };
  }
};

module.exports = {
  verifyPaymentScreenshot
};
