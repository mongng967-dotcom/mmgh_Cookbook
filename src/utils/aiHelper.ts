/** @format */
import { GEMINI_API_KEY } from '@env';

export const extractIngredientsFromAI = async (base64: string, type: string) => {
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
  
  const payload = {
    contents: [{
      parts: [
        { text: 'Extract ingredients. Return ONLY raw JSON array: [{"en": "Name", "zh": "Name", "category": "Meat"|"Vegetable"|"Seasoning and herbs"|"Other"}]. No markdown.' },
        { inline_data: { mime_type: type, data: cleanBase64 } }
      ]
    }]
  };

  const response = await fetch(API_URL, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(payload) 
  });
  
  const result = await response.json();
  const rawText = result.candidates[0].content.parts[0].text;
  const jsonMatch = rawText.replace(/```json|```/g, '').trim().match(/\[.*\]/s);
  
  if (!jsonMatch) throw new Error("Could not parse AI response");
  return JSON.parse(jsonMatch[0]);
};