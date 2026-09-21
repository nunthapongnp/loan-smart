import React, { useState } from 'react';
import { HomeLoanCalculator } from './components/HomeLoanCalculator';
import { CarLoanCalculator } from './components/CarLoanCalculator';
import { RefinanceCalculator } from './components/RefinanceCalculator';
import { GeminiAdvisorModal } from './components/GeminiAdvisorModal';
import { LoanTab } from './types';
import {
  Home,
  Car,
  RefreshCw,
  Sparkles,
  Plus,
  Mic,
  AudioWaveform,
  HelpCircle,
  Share2,
  Menu,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<LoanTab>('home');
  const [isGeminiOpen, setIsGeminiOpen] = useState<boolean>(false);
  const [geminiQuery, setGeminiQuery] = useState<string>('');
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  const handleOpenGemini = (query?: string) => {
    if (query) {
      setGeminiQuery(query);
    }
    setIsGeminiOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-28">
      {/* Top Navigation Header matching screenshot structure */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: Round button */}
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors shadow-2xs"
            title="ข้อมูลแอปและวิธีการคำนวณ"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Center: Tab Switcher dropdown/segmented pill */}
          <div className="bg-slate-100/90 p-1 rounded-2xl flex items-center shadow-inner">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'home'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>ผ่อนบ้าน & โปะ</span>
            </button>

            <button
              onClick={() => setActiveTab('car')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'car'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>ผ่อนรถยนต์</span>
            </button>

            <button
              onClick={() => setActiveTab('refinance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'refinance'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>รีไฟแนนซ์</span>
            </button>
          </div>

          {/* Right: Round action button */}
          <button
            onClick={() => handleOpenGemini('วิเคราะห์ภาพรวมการกู้เงินให้หน่อย')}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors shadow-2xs"
            title="ปรึกษา AI"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        {activeTab === 'home' && (
          <HomeLoanCalculator onOpenGeminiAdvisor={handleOpenGemini} />
        )}
        {activeTab === 'car' && <CarLoanCalculator />}
        {activeTab === 'refinance' && <RefinanceCalculator />}
      </main>

      {/* Floating Bottom Bar (Matching exact layout from IMG_6439.png) */}
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div
            onClick={() => handleOpenGemini()}
            className="w-full bg-white/95 backdrop-blur-md rounded-full px-4 py-2.5 shadow-xl border border-slate-200/90 flex items-center justify-between cursor-pointer hover:bg-white hover:border-slate-300 transition-all group"
          >
            {/* Left: Plus icon in circular badge */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors select-none">
                Ask Gemini
              </span>
            </div>

            {/* Right: Microphone and Audio Waveform icons matching screenshot */}
            <div className="flex items-center gap-2 text-slate-700">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenGemini('แนะนำวิธีคำนวณการผ่อนที่ประหยัดที่สุดให้หน่อย');
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                title="ถามด้วยเสียง"
              >
                <Mic className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <AudioWaveform className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              เกี่ยวกับ LoanSmart เครื่องมือคำนวณสินเชื่อ
            </h3>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <strong>1. สินเชื่อบ้าน (ลดต้นลดดอก):</strong> คำนวณตามสูตรค่างวดแบบมาตรฐานของธนาคารพาณิชย์ในไทย ดอกเบี้ยคิดจากเงินต้นคงเหลือจริงรายเดือน จำลองการโปะหนี้เพื่อดูยอดประหยัดและเวลาที่หมดหนี้เร็วขึ้น
              </p>
              <p>
                <strong>2. สินเชื่อรถยนต์ (Flat Rate + VAT 7%):</strong> คำนวณดอกเบี้ยคงที่ พร้อมแปลงเป็นดอกเบี้ยที่แท้จริง (EIR) และคำนวณส่วนลดดอกเบี้ยปิดบัญชีก่อนกำหนดตามประกาศ สคบ. ใหม่ (100%, 70%, 50%)
              </p>
              <p>
                <strong>3. รีไฟแนนซ์ & Retention:</strong> เปรียบเทียบผลประโยชน์สุทธิหลังหักค่าธรรมเนียมจริง (ค่าจดจำนอง 1%, ค่าประเมิน, ค่าอากร) พร้อมจุดคุ้มทุน (Break-even month)
              </p>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}

      {/* Gemini AI Advisor Modal */}
      <GeminiAdvisorModal
        isOpen={isGeminiOpen}
        onClose={() => setIsGeminiOpen(false)}
        initialPrompt={geminiQuery}
        loanContext={{
          activeTab,
          timestamp: new Date().toISOString(),
        }}
      />
    </div>
  );
}
