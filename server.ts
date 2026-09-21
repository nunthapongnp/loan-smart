import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Enable permissive CORS and frame embedding for preview environments
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Lazy-initialized Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini Financial Advisor API Endpoint
app.post('/api/gemini/advisor', async (req, res) => {
  try {
    const { prompt, loanContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `คุณคือผู้เชี่ยวชาญด้านสินเชื่อบ้าน สินเชื่อรถยนต์ และการวางแผนการเงินส่วนบุคคลในประเทศไทย (Thai Financial & Loan Strategist)
ตอบคำถามด้วยภาษาไทยที่สุภาพ เข้าใจง่าย กระชับ ตรงประเด็น และเน้นตัวเลขที่จับต้องได้จริงตามหลักคณิตศาสตร์การเงินและข้อกำหนดของธนาคารแห่งประเทศไทย และสำนักงานคณะกรรมการคุ้มครองผู้บริโภค (สคบ.)
เช่น:
- ดอกเบี้ยลดต้นลดดอก (Reducing balance) ของสินเชื่อบ้าน และเทคนิคการโปะหนี้ให้หมดเร็ว
- สิทธิลดหย่อนภาษีดอกเบี้ยกู้บ้านสูงสุด 100,000 บาท/ปี
- การเปรียบเทียบ Refinance (ย้ายธนาคาร) กับ Retention (ขอลดดอกเบี้ยเดิม) พร้อมคำนึงถึงค่าจดจำนอง 1% ค่าประเมิน และความคุ้มค่า
- สัญญาเช่าซื้อรถยนต์ (Flat Rate + VAT 7%) การแปลงเป็นดอกเบี้ยที่แท้จริง (EIR) และเกณฑ์ส่วนลดดอกเบี้ยปิดบัญชีก่อนกำหนดตามประกาศ สคบ. ใหม่ (100%, 70%, 50%)

ข้อมูลบริบทปัจจุบันของผู้ใช้:
${loanContext ? JSON.stringify(loanContext, null, 2) : 'ไม่มีบริบทเฉพาะ'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    return res.json({
      text: response.text || 'ขออภัย ไม่สามารถประมวลผลคำแนะนำได้ในขณะนี้',
    });
  } catch (error: any) {
    console.error('Gemini Advisor Error:', error);
    return res.status(500).json({
      error: error.message || 'เกิดข้อผิดพลาดในการติดต่อระบบ AI',
    });
  }
});

// Vite middleware for development vs static build for production
async function startServer() {
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
    console.log(`LoanSmart Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
