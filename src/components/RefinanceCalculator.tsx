import React, { useState, useMemo } from 'react';
import { RefinanceInputs, RefinanceCalculationResult } from '../types';
import { calculateRefinance } from '../utils/calculator';
import {
  RefreshCw,
  TrendingDown,
  Coins,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Scale,
} from 'lucide-react';

export const RefinanceCalculator: React.FC = () => {
  // ค่าเริ่มต้นที่สมจริง
  const [currentRemainingDebt, setCurrentRemainingDebt] = useState<number>(3000000);
  const [currentRate, setCurrentRate] = useState<number>(5.75); // ดอกเบี้ยปัจจุบันหลังลอยตัว MRR
  const [currentMonthlyPay, setCurrentMonthlyPay] = useState<number>(20000);
  const [remainingYears, setRemainingYears] = useState<number>(25);

  // ข้อเสนอรีไฟแนนซ์ (ธนาคารใหม่)
  const [newRate3Y, setNewRate3Y] = useState<number>(3.25);
  const [newRateAfter3Y, setNewRateAfter3Y] = useState<number>(5.25);
  const [newTermYears, setNewTermYears] = useState<number>(25);

  // ข้อเสนอ Retention (ธนาคารเดิม)
  const [retentionRate3Y, setRetentionRate3Y] = useState<number>(4.15);

  // ค่าธรรมเนียม
  const [appraisalFee, setAppraisalFee] = useState<number>(2800);
  const [mortgageFeePercent, setMortgageFeePercent] = useState<number>(1.0);
  const [isFreeMortgagePromo, setIsFreeMortgagePromo] = useState<boolean>(false);
  const [insuranceAndOtherFees, setInsuranceAndOtherFees] = useState<number>(3000);

  const inputs: RefinanceInputs = useMemo(() => {
    return {
      currentRemainingDebt,
      currentRate,
      currentMonthlyPay,
      remainingYears,
      newRate3Y,
      newRateAfter3Y,
      newTermYears,
      retentionRate3Y,
      appraisalFee,
      mortgageFeePercent,
      stampDutyPercent: 0.05,
      insuranceAndOtherFees,
      isFreeMortgagePromo,
    };
  }, [
    currentRemainingDebt,
    currentRate,
    currentMonthlyPay,
    remainingYears,
    newRate3Y,
    newRateAfter3Y,
    newTermYears,
    retentionRate3Y,
    appraisalFee,
    mortgageFeePercent,
    insuranceAndOtherFees,
    isFreeMortgagePromo,
  ]);

  const result: RefinanceCalculationResult = useMemo(() => {
    return calculateRefinance(inputs);
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
      {/* Verdict Banner */}
      <div
        className={`rounded-3xl p-5 sm:p-6 border shadow-sm transition-all ${
          result.verdict.badge === 'strongly_refinance'
            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400'
            : result.verdict.badge === 'retention_better'
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400'
            : 'bg-gradient-to-br from-slate-700 to-slate-800 text-white border-slate-600'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>ผลการวิเคราะห์ความคุ้มค่า</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {result.verdict.title}
            </h2>
            <p className="text-xs sm:text-sm opacity-95 mt-1 leading-relaxed max-w-2xl">
              {result.verdict.description}
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:text-right border border-white/20 whitespace-nowrap">
            <div className="text-xs text-white/80 font-medium">ประหยัดสุทธิ 3 ปีแรก</div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono mt-0.5">
              ฿{Math.max(0, result.savings3YearNet).toLocaleString()}
            </div>
            <div className="text-xs text-white/90 font-medium mt-1">
              จุดคุ้มทุนค่าธรรมเนียม: {result.breakEvenMonths < 99 ? `${result.breakEvenMonths} เดือน` : 'ไม่คุ้มทุน'}
            </div>
          </div>
        </div>
      </div>

      {/* 3-Way Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ทางเลือก 1: สัญญาเดิม (ไม่ทำอะไร) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">ทางเลือก 1</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              สัญญาเดิม
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">ผ่อนตามเดิม (ลอยตัว)</div>
          <div className="text-xs text-slate-500 mb-4">
            ดอกเบี้ยเฉลี่ย: <span className="font-mono font-bold text-slate-800">{currentRate}%</span>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
            <div className="flex justify-between text-slate-600">
              <span>ค่างวดต่อเดือน:</span>
              <span className="font-mono font-semibold text-slate-900">
                ฿{inputs.currentMonthlyPay.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ดอกเบี้ย 3 ปีแรก:</span>
              <span className="font-mono font-bold text-rose-600">
                ฿{result.current3YearInterest.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ยอดผ่อนรวม 3 ปี:</span>
              <span className="font-mono text-slate-900">
                ฿{result.current3YearTotalPay.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ค่าธรรมเนียม:</span>
              <span className="font-mono text-slate-500">฿0</span>
            </div>
          </div>
        </div>

        {/* ทางเลือก 2: รีไฟแนนซ์ธนาคารใหม่ */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border-2 border-emerald-500 relative">
          <div className="absolute -top-3 right-6 bg-emerald-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm">
            แนะนำสูงสุด
          </div>
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">ทางเลือก 2</span>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              Refinance
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">ย้ายธนาคารใหม่</div>
          <div className="text-xs text-slate-500 mb-4">
            ดอกเบี้ย 3 ปีแรก: <span className="font-mono font-bold text-emerald-600">{newRate3Y}%</span>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
            <div className="flex justify-between text-slate-600">
              <span>ค่างวดใหม่ต่อเดือน:</span>
              <span className="font-mono font-semibold text-emerald-700">
                ฿{result.newMonthlyPayment.toLocaleString()}
                {result.monthlySavings > 0 && (
                  <span className="text-emerald-600 text-[11px] ml-1">
                    (ลด ฿{result.monthlySavings.toLocaleString()})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ดอกเบี้ย 3 ปีแรก:</span>
              <span className="font-mono font-bold text-emerald-600">
                ฿{result.refinance3YearInterest.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ค่าธรรมเนียมย้ายแบงก์:</span>
              <span className="font-mono text-amber-700 font-semibold">
                ฿{result.totalRefinanceCosts.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-100">
              <span className="text-emerald-700">ประหยัดสุทธิ 3 ปี:</span>
              <span className="font-mono text-emerald-600 text-sm">
                ฿{result.savings3YearNet.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ทางเลือก 3: Retention กับธนาคารเดิม */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">ทางเลือก 3</span>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              Retention
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">ขอลดดอกเบี้ยแบงก์เดิม</div>
          <div className="text-xs text-slate-500 mb-4">
            ดอกเบี้ย Retention: <span className="font-mono font-bold text-blue-600">{retentionRate3Y}%</span>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
            <div className="flex justify-between text-slate-600">
              <span>ค่างวดต่อเดือน:</span>
              <span className="font-mono font-semibold text-slate-900">
                ฿{Math.round(result.retention3YearTotalPay / 36).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ดอกเบี้ย 3 ปีแรก:</span>
              <span className="font-mono font-bold text-blue-600">
                ฿{result.retention3YearInterest.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ค่าธรรมเนียม:</span>
              <span className="font-mono text-emerald-600 font-semibold">
                ฿0 (ไม่ต้องจดจำนองใหม่)
              </span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-100">
              <span className="text-blue-700">ประหยัดสุทธิ 3 ปี:</span>
              <span className="font-mono text-blue-600 text-sm">
                ฿{result.retentionSavings3YearNet.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Adjust Inputs Panel */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100">
        <h3 className="text-base font-bold text-slate-900 mb-5">
          ตั้งค่าข้อมูลสัญญาเพื่อคำนวณเปรียบเทียบ
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ข้อมูลสัญญาปัจจุบัน */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>ข้อมูลสินเชื่อเดิม</span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="font-medium text-slate-700">ยอดหนี้คงเหลือ</label>
                <span className="font-mono font-bold text-slate-900">
                  ฿{currentRemainingDebt.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={500000}
                max={15000000}
                step={50000}
                value={currentRemainingDebt}
                onChange={(e) => setCurrentRemainingDebt(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  ดอกเบี้ยปัจจุบัน (%/ปี)
                </label>
                <input
                  type="number"
                  step={0.05}
                  value={currentRate}
                  onChange={(e) => setCurrentRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  ค่างวดเดิม (บ./เดือน)
                </label>
                <input
                  type="number"
                  step={500}
                  value={currentMonthlyPay}
                  onChange={(e) => setCurrentMonthlyPay(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                ระยะเวลาผ่อนที่เหลือ (ปี)
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={remainingYears}
                onChange={(e) => setRemainingYears(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold"
              />
            </div>
          </div>

          {/* ข้อมูลสัญญาใหม่และค่าธรรมเนียม */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ข้อเสนอใหม่ (Refinance & Retention)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  ดอกเบี้ย Refinance 3 ปีแรก (%)
                </label>
                <input
                  type="number"
                  step={0.05}
                  value={newRate3Y}
                  onChange={(e) => setNewRate3Y(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono font-bold text-emerald-800"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  ดอกเบี้ย Retention ธนาคารเดิม (%)
                </label>
                <input
                  type="number"
                  step={0.05}
                  value={retentionRate3Y}
                  onChange={(e) => setRetentionRate3Y(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-mono font-bold text-blue-800"
                />
              </div>
            </div>

            {/* ค่าธรรมเนียมรีไฟแนนซ์ */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="font-semibold text-slate-800">ค่าธรรมเนียมการรีไฟแนนซ์</div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-slate-600 block">ค่าประเมินราคา (บ.)</span>
                  <input
                    type="number"
                    value={appraisalFee}
                    onChange={(e) => setAppraisalFee(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-600 block">ค่าประกัน/อื่นๆ (บ.)</span>
                  <input
                    type="number"
                    value={insuranceAndOtherFees}
                    onChange={(e) => setInsuranceAndOtherFees(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              {/* โปรโมชั่นฟรีค่าจดจำนอง */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-700">
                  โปรโมชั่นฟรีค่าจดจำนอง 1% (฿{(currentRemainingDebt * 0.01).toLocaleString()}):
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFreeMortgagePromo}
                    onChange={(e) => setIsFreeMortgagePromo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
