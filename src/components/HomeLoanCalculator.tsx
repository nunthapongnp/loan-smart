import React, { useState, useMemo } from 'react';
import { HomeLoanInputs, HomeCalculationResult } from '../types';
import { calculateHomeLoan, calculatePMT } from '../utils/calculator';
import { LoanChart } from './LoanChart';
import { AmortizationTable } from './AmortizationTable';
import {
  TrendingDown,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  PiggyBank,
  Clock,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface HomeLoanCalculatorProps {
  onOpenGeminiAdvisor?: (query?: string) => void;
}

export const HomeLoanCalculator: React.FC<HomeLoanCalculatorProps> = ({ onOpenGeminiAdvisor }) => {
  // ค่าเริ่มต้นที่ตรงกับภาพ IMG_6439.png
  // ภาพแสดง: ยอดหนี้เริ่มต้น ฿4.0M, ยอดส่งต่อเดือน (รวมโปะ) ฿24,000 (หรือค่างวดปรับได้), อัตราดอกเบี้ยเฉลี่ย 4.5% - 6%, กรอบเวลา 30 ปี
  const [loanAmount, setLoanAmount] = useState<number>(4000000);
  const [loanTermYears, setLoanTermYears] = useState<number>(30);
  const [avgInterestRate, setAvgInterestRate] = useState<number>(4.5);

  // คำนวณค่างวดขั้นต่ำมาตรฐาน
  const minRequiredMonthlyPayment = useMemo(() => {
    return calculatePMT(loanAmount, avgInterestRate, loanTermYears * 12);
  }, [loanAmount, avgInterestRate, loanTermYears]);

  // ยอดส่งต่อเดือน (รวมโปะ) - ค่าเริ่มต้นให้มากกว่าขั้นต่ำเล็กน้อย เช่น ยอดขั้นต่ำ + โปะ 5,000 หรือปรับตามต้องการ
  const [totalMonthlyTarget, setTotalMonthlyTarget] = useState<number>(24000);

  // ซิงค์ totalMonthlyTarget เมื่อ minRequiredMonthlyPayment สูงกว่า
  const effectiveMonthlyTarget = Math.max(minRequiredMonthlyPayment, totalMonthlyTarget);
  const extraMonthlyFromSlider = Math.max(0, effectiveMonthlyTarget - minRequiredMonthlyPayment);

  // ออปชันขั้นสูง
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [interestType, setInterestType] = useState<'fixed' | 'stepped'>('fixed');
  const [steppedRates, setSteppedRates] = useState({
    year1: 2.75,
    year2: 3.5,
    year3: 4.25,
    yearAfter: 5.75,
  });

  const [extraYearlyBonus, setExtraYearlyBonus] = useState<number>(0);
  const [oneTimeAmount, setOneTimeAmount] = useState<number>(0);
  const [oneTimeMonth, setOneTimeMonth] = useState<number>(36);
  const [taxBracket, setTaxBracket] = useState<number>(15);

  // รวม inputs
  const inputs: HomeLoanInputs = useMemo(() => {
    return {
      propertyPrice: loanAmount,
      downPayment: 0,
      loanAmount,
      loanTermYears,
      interestType,
      avgInterestRate,
      steppedRates,
      prepayment: {
        extraMonthly: extraMonthlyFromSlider,
        extraYearly: extraYearlyBonus,
        oneTimeExtraAmount: oneTimeAmount,
        oneTimeExtraMonth: oneTimeMonth,
      },
      annualTaxBracketPercent: taxBracket,
    };
  }, [
    loanAmount,
    loanTermYears,
    interestType,
    avgInterestRate,
    steppedRates,
    extraMonthlyFromSlider,
    extraYearlyBonus,
    oneTimeAmount,
    oneTimeMonth,
    taxBracket,
  ]);

  // ผลลัพธ์การคำนวณ
  const calculationResult: HomeCalculationResult = useMemo(() => {
    return calculateHomeLoan(inputs);
  }, [inputs]);

  // Format Helper
  const formatM = (val: number) => {
    if (val >= 1000000) {
      const m = val / 1000000;
      return `฿${m % 1 === 0 ? m.toFixed(1) : m.toFixed(2)}M`;
    }
    return `฿${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Real-time Visual Chart (Matching IMG_6439.png) */}
      <LoanChart
        standardSchedule={calculationResult.standard}
        prepaymentSchedule={calculationResult.withPrepayment}
        initialLoanAmount={loanAmount}
        totalYears={loanTermYears}
        monthlyPaymentWithPrepay={effectiveMonthlyTarget}
        avgInterestRate={avgInterestRate}
      />

      {/* Sliders Control Panel matching the screenshot title "ปรับแผนการโปะบ้านของคุณ" */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            ปรับแผนการโปะบ้านของคุณ
          </h2>
          <span className="text-xs text-emerald-600 bg-emerald-50 font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3" /> คำนวณเรียลไทม์
          </span>
        </div>

        <div className="space-y-6">
          {/* Slider 1: ยอดหนี้เริ่มต้น */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-700">ยอดหนี้เริ่มต้น</label>
              <div className="text-base font-bold text-slate-900 font-mono">
                {formatM(loanAmount)}
              </div>
            </div>
            <input
              type="range"
              min={500000}
              max={15000000}
              step={100000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
              {[2000000, 3000000, 4000000, 5000000, 7000000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setLoanAmount(amt)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    loanAmount === amt
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {formatM(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Slider 2: ยอดส่งต่อเดือน (รวมโปะ) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  ยอดส่งต่อเดือน (รวมโปะ)
                </label>
                <div className="text-xs text-slate-500">
                  ขั้นต่ำสัญญา: ฿{minRequiredMonthlyPayment.toLocaleString()}/เดือน
                  {extraMonthlyFromSlider > 0 && (
                    <span className="text-emerald-600 font-semibold ml-1.5">
                      (โปะเพิ่ม +฿{extraMonthlyFromSlider.toLocaleString()})
                    </span>
                  )}
                </div>
              </div>
              <div className="text-base font-bold text-slate-900 font-mono">
                ฿{effectiveMonthlyTarget.toLocaleString()}
              </div>
            </div>
            <input
              type="range"
              min={minRequiredMonthlyPayment}
              max={Math.max(minRequiredMonthlyPayment * 2.5, 100000)}
              step={1000}
              value={effectiveMonthlyTarget}
              onChange={(e) => setTotalMonthlyTarget(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            {/* Quick add extra buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-slate-600">โปะเพิ่ม:</span>
              {[0, 2000, 5000, 10000, 20000].map((addAmt) => (
                <button
                  key={addAmt}
                  onClick={() => setTotalMonthlyTarget(minRequiredMonthlyPayment + addAmt)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    extraMonthlyFromSlider === addAmt
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {addAmt === 0 ? 'ผ่อนขั้นต่ำ' : `+฿${addAmt.toLocaleString()}`}
                </button>
              ))}
            </div>
          </div>

          {/* Slider 3: อัตราดอกเบี้ยเฉลี่ย (%) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-700">อัตราดอกเบี้ยเฉลี่ย (%)</label>
              <div className="text-base font-bold text-slate-900 font-mono">
                {avgInterestRate.toFixed(2)}%
              </div>
            </div>
            <input
              type="range"
              min={1.5}
              max={9.0}
              step={0.1}
              value={avgInterestRate}
              onChange={(e) => setAvgInterestRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            <div className="flex justify-between text-[11px] text-slate-600 font-mono mt-1">
              <span>1.5% (โปรโมชั่น)</span>
              <span>4.5% (เฉลี่ย 3 ปีแรก)</span>
              <span>6.5% - 7.5% (MRR ปัจจุบัน)</span>
            </div>
          </div>

          {/* Slider 4: กรอบเวลา (ปี) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-700">กรอบเวลาสัญญา (ปี)</label>
              <div className="text-base font-bold text-slate-900 font-mono">
                {loanTermYears} ปี ({loanTermYears * 12} งวด)
              </div>
            </div>
            <input
              type="range"
              min={5}
              max={40}
              step={1}
              value={loanTermYears}
              onChange={(e) => setLoanTermYears(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            <div className="flex justify-between text-[11px] text-slate-600 font-mono mt-1">
              <span>10 ปี</span>
              <span>20 ปี</span>
              <span>30 ปี (ยอดนิยม)</span>
              <span>40 ปี</span>
            </div>
          </div>
        </div>

        {/* Circular Down Arrow / Expand Details matching screenshot center icon */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all shadow-sm"
            title="ตัวเลือกเพิ่มเติม"
          >
            {showAdvanced ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Advanced Prepayment & Stepped Rate Settings */}
        {showAdvanced && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-6">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-emerald-600" />
              <span>การโปะเงินก้อน & อัตราดอกเบี้ยขั้นบันได</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* โปะโบนัสรายปี */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  โปะโบนัสทุกสิ้นปี (บาท/ปี)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                    ฿
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={extraYearlyBonus || ''}
                    placeholder="เช่น 30,000 หรือ 50,000"
                    onChange={(e) => setExtraYearlyBonus(Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  ระบบจะหักตัดเงินต้นทุกๆ เดือนที่ 12 ของแต่ละปี
                </p>
              </div>

              {/* โปะเงินก้อนครั้งเดียว */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  โปะเงินก้อนครั้งเดียว (Lump sum)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">
                      ฿
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={10000}
                      value={oneTimeAmount || ''}
                      placeholder="จำนวนเงิน"
                      onChange={(e) => setOneTimeAmount(Number(e.target.value) || 0)}
                      className="w-full pl-7 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min={1}
                      max={loanTermYears * 12}
                      value={oneTimeMonth || ''}
                      placeholder="งวดที่โปะ"
                      onChange={(e) => setOneTimeMonth(Number(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  เช่น งวดที่ 36 (ครบ 3 ปีหลังรีไฟแนนซ์) โปะ 100,000 บาท
                </p>
              </div>
            </div>

            {/* Stepped Rate Options */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-800">
                  รูปแบบอัตราดอกเบี้ย
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setInterestType('fixed')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      interestType === 'fixed'
                        ? 'bg-slate-900 text-white font-medium shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    เฉลี่ยคงที่ ({avgInterestRate}%)
                  </button>
                  <button
                    onClick={() => setInterestType('stepped')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      interestType === 'stepped'
                        ? 'bg-slate-900 text-white font-medium shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    ขั้นบันได (ปี 1-3)
                  </button>
                </div>
              </div>

              {interestType === 'stepped' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[11px] text-slate-600 block mb-0.5">ปีที่ 1 (%)</span>
                    <input
                      type="number"
                      step={0.05}
                      value={steppedRates.year1}
                      onChange={(e) =>
                        setSteppedRates({ ...steppedRates, year1: Number(e.target.value) })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-600 block mb-0.5">ปีที่ 2 (%)</span>
                    <input
                      type="number"
                      step={0.05}
                      value={steppedRates.year2}
                      onChange={(e) =>
                        setSteppedRates({ ...steppedRates, year2: Number(e.target.value) })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-600 block mb-0.5">ปีที่ 3 (%)</span>
                    <input
                      type="number"
                      step={0.05}
                      value={steppedRates.year3}
                      onChange={(e) =>
                        setSteppedRates({ ...steppedRates, year3: Number(e.target.value) })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-600 block mb-0.5">
                      ปีที่ 4 เป็นต้นไป (%)
                    </span>
                    <input
                      type="number"
                      step={0.05}
                      value={steppedRates.yearAfter}
                      onChange={(e) =>
                        setSteppedRates({ ...steppedRates, yearAfter: Number(e.target.value) })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tax Bracket */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
              <span className="text-emerald-900 font-medium">
                คำนวณสิทธิลดหย่อนภาษีดอกเบี้ยกู้บ้าน (สูงสุด 100,000 บาท/ปี)
              </span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700">ฐานภาษีของคุณ:</span>
                <select
                  value={taxBracket}
                  onChange={(e) => setTaxBracket(Number(e.target.value))}
                  className="bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800"
                >
                  <option value={5}>5%</option>
                  <option value={10}>10%</option>
                  <option value={15}>15%</option>
                  <option value={20}>20%</option>
                  <option value={25}>25%</option>
                  <option value={30}>30%</option>
                  <option value={35}>35%</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Outcome Cards (ผ่อนปกติ vs แผนโปะ) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: ดอกเบี้ยที่ประหยัดได้ */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-100 mb-1">
            <span className="text-xs font-medium">ประหยัดดอกเบี้ยได้</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
            ฿{calculationResult.interestSaved.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-100 mt-2">
            เทียบกับการผ่อนปกติแบบขั้นต่ำ
          </p>
        </div>

        {/* Card 2: ระยะเวลาที่หมดหนี้เร็วขึ้น */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">หมดหนี้เร็วขึ้น</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {Math.floor(calculationResult.timeSavedMonths / 12)} ปี{' '}
            {calculationResult.timeSavedMonths % 12} เดือน
          </div>
          <p className="text-xs text-slate-500 mt-2">
            เหลือเวลาผ่อนจริง {calculationResult.withPrepayment.payoffYears} ปี (จากเดิม {loanTermYears} ปี)
          </p>
        </div>

        {/* Card 3: ลดหย่อนภาษีสะสม */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">ประหยัดภาษีสะสม</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            ฿{calculationResult.taxDeductionEstimatePrepay.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            จากสิทธิลดหย่อนภาษีดอกเบี้ยกู้บ้านฐาน {taxBracket}%
          </p>
        </div>
      </div>

      {/* Comparison Breakdown Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          เปรียบเทียบ: ผ่อนขั้นต่ำ vs แผนโปะปิดหนี้
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* แผนขั้นต่ำ */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>ผ่อนขั้นต่ำตามสัญญา</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>ค่างวดต่อเดือน:</span>
                <span className="font-mono font-bold text-slate-900">
                  ฿{calculationResult.standard.monthlyInstallment.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ดอกเบี้ยรวมตลอดสัญญา:</span>
                <span className="font-mono font-bold text-rose-600">
                  ฿{calculationResult.standard.totalInterest.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ยอดเงินจ่ายรวมทั้งหมด:</span>
                <span className="font-mono font-bold text-slate-900">
                  ฿{calculationResult.standard.totalPayments.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ระยะเวลาผ่อน:</span>
                <span className="font-mono font-bold text-slate-900">
                  {calculationResult.standard.payoffYears} ปี ({calculationResult.standard.payoffMonths} งวด)
                </span>
              </div>
            </div>
          </div>

          {/* แผนโปะ */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>แผนโปะปิดหนี้รวดเร็ว</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>ค่างวดส่งต่อเดือน:</span>
                <span className="font-mono font-bold text-emerald-800">
                  ฿{effectiveMonthlyTarget.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ดอกเบี้ยรวมตลอดสัญญา:</span>
                <span className="font-mono font-bold text-emerald-600">
                  ฿{calculationResult.withPrepayment.totalInterest.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ยอดเงินจ่ายรวมทั้งหมด:</span>
                <span className="font-mono font-bold text-emerald-800">
                  ฿{calculationResult.withPrepayment.totalPayments.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ระยะเวลาผ่อนจริง:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {calculationResult.withPrepayment.payoffYears} ปี ({calculationResult.withPrepayment.payoffMonths} งวด)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Monthly / Yearly Amortization Schedule Table */}
      <AmortizationTable
        schedule={calculationResult.withPrepayment}
        title={extraMonthlyFromSlider > 0 || extraYearlyBonus > 0 ? 'แผนโปะปิดหนี้' : 'ผ่อนขั้นต่ำ'}
        isHomeLoan={true}
      />
    </div>
  );
};
