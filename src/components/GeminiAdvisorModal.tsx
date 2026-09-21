import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, Loader2, ArrowRight } from 'lucide-react';

interface GeminiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanContext?: any;
  initialPrompt?: string;
}

interface Message {
  sender: 'user' | 'gemini';
  text: string;
}

export const GeminiAdvisorModal: React.FC<GeminiAdvisorModalProps> = ({
  isOpen,
  onClose,
  loanContext,
  initialPrompt = '',
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'gemini',
      text: 'สวัสดีครับ! ผมคือที่ปรึกษาการเงิน AI ยินดีช่วยวิเคราะห์แผนผ่อนบ้าน ผ่อนรถ หรือเปรียบเทียบความคุ้มค่าการรีไฟแนนซ์ ถามผมได้เลยครับ เช่น ควรโปะเดือนละเท่าไหร่ หรือ Retention กับ Refinance อะไรดีกว่า?',
    },
  ]);
  const [input, setInput] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickQuestions = [
    'วิเคราะห์แผนการโปะบ้านนี้ให้หน่อย ว่าประหยัดดอกเบี้ยคุ้มค่าไหม?',
    'เปรียบเทียบให้ดูหน่อยว่าควรเลือกรีไฟแนนซ์หรือขอ Retention กับธนาคารเดิม?',
    'สิทธิลดหย่อนภาษีดอกเบี้ยบ้านสูงสุด 100,000 บาท ช่วยประหยัดเงินได้กี่บาท?',
    'ถ้าจะปิดยอดรถยนต์ก่อนกำหนดตามเกณฑ์ สคบ. ใหม่ คุ้มค่าหรือไม่?',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: Message = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          loanContext,
        }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'gemini',
              text: 'ฟังก์ชัน AI ต้องการเซิร์ฟเวอร์แบ็กเอนด์ในการประมวลผล (หากเปิดใช้งานบน Static Hosting เช่น GitHub Pages เครื่องมือคำนวณผ่อนบ้าน รถ และรีไฟแนนซ์ทั้งหมดจะทำงานได้เต็ม 100% ส่วน AI แนะนำให้ใช้งานผ่าน Google AI Studio หรือโฮสต์ที่มี Node.js/Cloud Run ครับ)',
            },
          ]);
          return;
        }
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.text) {
        setMessages((prev) => [...prev, { sender: 'gemini', text: data.text }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'gemini',
            text: 'ขออภัยครับ ไม่สามารถให้คำแนะนำได้ในขณะนี้ กรุณาลองใหม่อีกครั้งครับ',
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'gemini',
          text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ตหรือลองใหม่อีกครั้งครับ',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <span>Ask Gemini Financial Advisor</span>
              </h3>
              <p className="text-[11px] text-slate-300">ผู้ช่วยวิเคราะห์สินเชื่อและการเงินส่วนบุคคล</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'gemini' && (
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white font-medium rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-none whitespace-pre-line'
                }`}
              >
                {msg.text}
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 items-center text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200/80 w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Gemini กำลังวิเคราะห์ตัวเลขความคุ้มค่า...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        <div className="p-3 bg-white border-t border-slate-100 overflow-x-auto">
          <div className="text-[11px] font-medium text-slate-600 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>คำถามแนะนำ:</span>
          </div>
          <div className="flex gap-1.5 flex-nowrap pb-1">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="text-[11px] text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="ถามคำถามสินเชื่อหรือขอคำแนะนำ..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-transparent focus:border-slate-300 focus:bg-white focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-sm shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
