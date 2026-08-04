/**
 * ocrService.js
 * Handles scanning receipts via the Gemini API
 */

import { SettingsService } from './settingsService.js';
import { todayISO } from '../utils/formatter.js';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const OCRService = {
  /**
   * Process an image file and extract transaction data
   * @param {File} file 
   * @returns {Promise<{ amount: number, date: string, notes: string, suggestedCategoryId: string }>}
   */
  async scanReceipt(file) {
    const apiKey = await SettingsService.get('geminiApiKey');
    if (!apiKey) {
      throw new Error('Gemini API key is not configured. Please set it in Settings.');
    }

    // Convert file to base64
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // e.g. "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        const b64 = reader.result.toString().split(',')[1];
        resolve(b64);
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });

    const prompt = `
      You are an expert expense parser. Look at this receipt/invoice.
      Extract the following information:
      1. amount: The final total amount in numbers (e.g. 120.50). Do not include currency symbols.
      2. date: The date of the transaction in YYYY-MM-DD format. If not found, use ${todayISO()}.
      3. notes: The name of the merchant, store, or a brief description of the expense. Keep it short (e.g. "Starbucks Coffee" or "Uber Ride").
      4. suggestedCategoryId: Guess the category. Allowed values: food, transport, shopping, bills, housing, medical, entertainment, travel, kids, education, investment, loan, insurance, recharge, fuel, miscellaneous.

      Return ONLY a valid JSON object matching this schema. No markdown, no backticks, no other text.
      {"amount": 120.50, "date": "2026-08-04", "notes": "Merchant Name", "suggestedCategoryId": "food"}
    `;

    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: file.type || 'image/jpeg',
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      }
    };

    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`API Error: ${errorData?.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('No data extracted from image');
    }

    try {
      const parsed = JSON.parse(textResponse);
      return {
        amount: Number(parsed.amount) || 0,
        date: parsed.date || todayISO(),
        notes: parsed.notes || '',
        suggestedCategoryId: parsed.suggestedCategoryId || 'miscellaneous',
      };
    } catch (e) {
      throw new Error('Failed to parse API response');
    }
  }
};
