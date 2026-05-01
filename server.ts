import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import { db } from './src/lib/firebase.js';
import { doc, updateDoc } from 'firebase/firestore';
import puppeteer from 'puppeteer';

import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-03-25.dahlia',
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// No admin initialization needed

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stripe Webhook (needs raw body)
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        
        if (userId) {
          try {
            await updateDoc(doc(db, 'users', userId), {
              subscriptionStatus: 'pro',
              stripeSubscriptionId: session.subscription
            });
            console.log('Payment succeeded and user upgraded to Pro for session:', session.id);
          } catch (error) {
            console.error('Error updating user in Firestore:', error);
          }
        } else {
          console.log('Payment succeeded but no userId found. Session:', session.id);
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // AI Optimization API
  app.post('/api/optimize-resume', async (req, res) => {
    const { resumeText, jdText } = req.body;

    console.log('Received optimization request:', { 
      resumeLength: resumeText?.length, 
      jdLength: jdText?.length 
    });

    if (!resumeText || !jdText) {
      console.warn('Optimization failed: Missing input');
      return res.status(400).json({ error: 'Resume text and job description are required' });
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY' || process.env.GEMINI_API_KEY === '') {
      console.error('GEMINI_API_KEY is missing or invalid');
      // For demo purposes, if key is missing, return a mock response instead of 500
      // This allows the UI to be tested even without a key
      console.log('Returning mock response due to missing API key');
      return res.json({
        score: 75,
        matched_keywords: ["Communication", "Teamwork"],
        missing_keywords: ["React", "TypeScript"],
        weak_areas: [
          {
            "area": "Technical Skills",
            "issue": "Missing modern frontend frameworks like React",
            "impact": "Most frontend roles require React, so ATS ranking is reduced",
            "fix": "Add React, TypeScript, and mention projects using them"
          },
          {
            "area": "Experience",
            "issue": "Descriptions are too basic and lack measurable impact",
            "impact": "Recruiters prefer results-driven statements",
            "fix": "Use action verbs and metrics like 'improved performance by 30%'"
          }
        ],
        improved_bullets: ["Collaborated with cross-functional teams to deliver high-quality software solutions."],
        suggestions: ["Add specific technical skills like React and TypeScript to match the JD."]
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an expert ATS resume analyzer and career coach.
        Your job is NOT just to give basic suggestions, but to deeply analyze the resume against the job description and provide highly detailed, actionable, and specific feedback.

        Analyze the following Job Description (JD) and Resume.
        
        1. Calculate ATS score (0–100).
        2. Identify matched keywords.
        3. Identify missing keywords.
        4. Analyze weak areas in depth (area, issue, impact, fix).
        5. Suggest concrete improvements.
        6. Rewrite weak resume bullets professionally.

        IMPORTANT RULES:
        * Do NOT give generic advice.
        * Be specific and practical.
        * Explain WHY something is weak.
        * Give examples of how to fix it.
        * Think like a recruiter reviewing a resume.
        * Be strict and realistic in scoring.
        * If keywords are missing → score must be low.
        * Output must be consistent (no contradictions).

        INPUT:
        Job Description:
        ${jdText}

        Resume:
        ${resumeText}

        Return ONLY a JSON object with:
        {
          "score": number,
          "matched_keywords": string[],
          "missing_keywords": string[],
          "weak_areas": [
            {
              "area": string,
              "issue": string,
              "impact": string,
              "fix": string
            }
          ],
          "improved_bullets": string[],
          "suggestions": string[]
        }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              matched_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              missing_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              weak_areas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    area: { type: Type.STRING },
                    issue: { type: Type.STRING },
                    impact: { type: Type.STRING },
                    fix: { type: Type.STRING }
                  },
                  required: ["area", "issue", "impact", "fix"]
                }
              },
              improved_bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["score", "matched_keywords", "missing_keywords", "weak_areas", "improved_bullets", "suggestions"],
          },
        },
      });

    //   const resultText = response.text;
    //   console.log('AI Response received');
    //   res.json(JSON.parse(resultText));
    // } catch (error: any) {
    //   console.error('AI Optimization Error:', error);
    //   res.status(500).json({ error: error.message || 'Failed to optimize resume' });
    // }

    const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;

console.log("RAW AI RESPONSE:", resultText);

if (!resultText) {
  return res.json({
    error: "Empty AI response"
  });
}

const cleanText = resultText.replace(/```json|```/g, '').trim();

try {
  const parsed = JSON.parse(cleanText);
  res.json(parsed);
} catch (e) {
  console.error("Invalid JSON from Gemini:", cleanText);

  res.json({
    error: "Invalid AI response",
    raw: cleanText
});
}
} catch (error: any) {
    console.error("AI Error:", error);
    return res.status(500).json({ error: error.message });
}
    }); 



  // Stripe Checkout API
  app.post('/api/create-checkout-session', async (req, res) => {
    const { userId, email } = req.body;

    console.log('Creating checkout session for:', { userId, email });

    try {
      if (!process.env.VITE_STRIPE_PRO_PRICE_ID) {
        throw new Error('VITE_STRIPE_PRO_PRICE_ID is not defined in environment variables');
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.VITE_STRIPE_PRO_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/pricing`,
        customer_email: email,
        client_reference_id: userId,
      });

      console.log('Checkout session created successfully:', session.id);
      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error('Stripe Checkout Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/generate-pdf', async (req, res) => {
    const { html } = req.body;

    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      });

      await browser.close();

      res.contentType('application/pdf');
      res.send(pdf);
    } catch (error: any) {
      console.error('PDF Generation Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
