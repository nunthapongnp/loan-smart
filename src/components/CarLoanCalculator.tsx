import React, { useState, useMemo } from 'react';
import { CarLoanInputs, CarCalculationResult } from '../types';
import { calculateCarLoan } from '../utils/calculator';
import {
  Car,
  Receipt,
  Percent,
  Calendar,
  Sparkles,
  Award,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const CarLoanCalculator: React.FC = () => {
  const [carPrice, setCarPrice] = useState<number>(850000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [flatRate, setFlatRate] = useState<number>(2.49);
  const [termMonths, setTermMonths] = useState<number>(60);
  const [includeVat, setIncludeVat] = useState<boolean>(true);
  const [earlyPayoffMonth, setEarlyPayoffMonth] = useState<number>(24);
  const [showAmortization, setShowAmortization] = useState<boolean>(false);

  // คำนวณเงินดาวน์เป็นบาท
  const downPaymentBaht = useMemo(() => {
    return Math.round(carPrice * (downPaymentPercent / 100));
  }, [carPrice, downPaymentPercent]);

  const inputs: CarLoanInputs = useMemo(() => {
    return {
      carPrice,
      downPayment: downPaymentBaht,
      loanAmount: Math.max(0, carPrice - downPaymentBaht),
      flatRate,
      termMonths,
      includeVat,
      earlyPayoffMonth,
    };
  }, [carPrice, downPaymentBaht, flatRate, termMonths, includeVat, earlyPayoffMonth]);

  const result: CarCalculationResult = useMemo(() => {
    return calculateCarLoan(inputs);
  }, [inputs]);

  return (
    <div className="space-y-6">
      {/* Top Key Result Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* ค่างวดต่อเดือน */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="text-xs font-medium">ค่างวดต่อเดือน (รวม VAT)</span>
            <Car className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono tracking-tight text-white">
            ฿{result.monthlyInstallment.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>ก่อน VAT: ฿{Math.round(result.monthlyInstallmentBeforeVat).toLocaleString()}</span>
            <span>VAT 7%: ฿{Math.round(result.monthlyVat).toLocaleString()}</span>
          </div>
        </div>

        {/* ยอดจัดไฟแนนซ์ & ดอกเบี้ยรวม */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">ดอกเบี้ยรวมตลอดสัญญา</span>
            <Percent className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            ฿{result.totalInterest.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            ยอดจัด: ฿{result.loanAmount.toLocaleString()} | ดอกเบี้ย {flatRate}%/ปี
          </div>
        </div>

        {/* ดอกเบี้ยแท้จริง (EIR) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">ดอกเบี้ยแท้จริง (EIR ตาม สคบ.)</span>
            <Receipt className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 font-mono tracking-tight">
            {result.effectiveInterestRate}%
          </div>
          <div className="text-xs text-slate-500 mt-2">
            เทียบเท่าดอกเบี้ยแบบลดต้นลดดอก ~{(result.effectiveInterestRate / flatRate).toFixed(1)}x ของ Flat Rate
          </div>
        </div>
      </div>

      {/* Main Form Sliders & Settings */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-5">
          ระบุข้อมูลสินเชื่อรถยนต์
        </h2>

        <div className="space-y-6">
          {/* ราคารถยนต์ */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-700">ราคารถยนต์</label>
              <div className="text-base font-bold text-slate-900 font-mono">
                ฿{carPrice.toLocaleString()}
              </div>
            </div>
            <input
              type="range"
              min={200000}
              max={5000000}
              step={10000}
              value={carPrice}
              onChange={(e) => setCarPrice(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {[500000, 750000, 850000, 1200000, 2000000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setCarPrice(amt)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    carPrice === amt
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ฿{(amt / 1000).toLocaleString()}k
                </button>
              ))}
            </div>
          </div>

          {/* เงินดาวน์ (% และ บาท) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div>
                <label className="text-sm font-medium text-slate-700">เงินดาวน์</label>
                <span className="text-xs text-slate-500 ml-2">
                  (ยอดจัด: ฿{result.loanAmount.toLocaleString()})
                </span>
              </div>
              <div className="text-base font-bold text-slate-900 font-mono">
                {downPaymentPercent}% (฿{downPaymentBaht.toLocaleString()})
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={5}
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {[0, 10, 15, 20, 25, 30].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setDownPaymentPercent(pct)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    downPaymentPercent === pct
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pct === 0 ? 'ดาวน์ 0%' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* อัตราดอกเบี้ยคงที่ (Flat Rate) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-700">อัตราดอกเบี้ยคงที่ (Flat Rate %/ปี)</label>
              <div className="text-base font-bold text-slate-900 font-mono">
                {flatRate.toFixed(2)}%
              </div>
            </div>
            <input
              type="range"
              min={0.99}
              max={6.5}
              step={0.1}
              value={flatRate}
              onChange={(e) => setFlatRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
            />
            <div className="flex justify-between text-[11px] text-slate-600 font-mono mt-1">
              <span>1.89% - 2.59% (รถใหม่ทั่วไป)</span>
              <span>2.79% - 3.59% (ผ่อน 72-84 เดือน)</span>
              <span>4.0% - 6.0% (รถมือสอง)</span>
            </div>
          </div>

          {/* ระยะเวลาผ่อน (จำนวนงวด) */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">ระยะเวลาผ่อน (งวด)</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { months: 24, label: '2 ปี (24)' },
                { months: 36, label: '3 ปี (36)' },
                { months: 48, label: '4 ปี (48)' },
                { months: 60, label: '5 ปี (60)' },
                { months: 72, label: '6 ปี (72)' },
                { months: 84, label: '7 ปี (84)' },
              ].map((item) => (
                <button
                  key={item.months}
                  onClick={() => setTermMonths(item.months)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                    termMonths === item.months
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* ภาษีมูลค่าเพิ่ม 7% */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">
                คิดภาษีมูลค่าเพิ่ม (VAT 7%)
              </span>
              <span className="text-[11px] text-slate-500">
                สัญญาเช่าซื้อรถยนต์ในไทยทั่วไปต้องบวก VAT 7% ในค่างวด
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeVat}
                onChange={(e) => setIncludeVat(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Feature: สิทธิส่วนลดปิดบัญชีก่อนกำหนดตามประกาศ สคบ. ใหม่ */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-5 sm:p-6 border border-emerald-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-emerald-700" />
          <h3 className="text-base font-bold text-emerald-900">
            จำลองการปิดยอดรถก่อนกำหนด (ตามเกณฑ์ สคบ. ใหม่)
          </h3>
        </div>
        <p className="text-xs text-emerald-800 leading-relaxed mb-4">
          ตามประกาศคณะกรรมการว่าด้วยสัญญา (สคบ.) หากผู้เช่าซื้อขอชำระค่างวดทั้งหมดเพื่อปิดบัญชีก่อนกำหนด จะได้รับส่วนลดดอกเบี้ยที่ยังไม่ถึงกำหนดชำระ:
          <br />• ชำระค่างวดมาแล้วไม่เกิน 1 ใน 3: ได้รับส่วนลด <strong>100%</strong>
          <br />• ชำระค่างวดมาแล้วเกิน 1 ใน 3 แต่ไม่เกิน 2 ใน 3: ได้รับส่วนลดไม่น้อยกว่า <strong>70%</strong>
          <br />• ชำระค่างวดมาแล้วเกิน 2 ใน 3: ได้รับส่วนลดไม่น้อยกว่า <strong>50%</strong>
        </p>

        {/* สไลเดอร์เลือกงวดที่จะปิดบัญชี */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-800">
              ต้องการปิดยอดรถในงวดที่:
            </span>
            <span className="text-sm font-bold text-emerald-700 font-mono">
              งวดที่ {earlyPayoffMonth} (ปีที่ {Math.ceil(earlyPayoffMonth / 12)})
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={termMonths - 1}
            step={1}
            value={earlyPayoffMonth}
            onChange={(e) => setEarlyPayoffMonth(Number(e.target.value))}
            className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />

          {result.earlySettlement && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="bg-emerald-50/70 p-3 rounded-xl">
                <span className="text-emerald-700 block text-[11px]">อัตราส่วนลดดอกเบี้ย</span>
                <span className="text-lg font-extrabold text-emerald-800 font-mono">
                  ลด {result.earlySettlement.discountPercent}%
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  จากดอกเบี้ยคงเหลือ ฿{result.earlySettlement.unearnedInterest.toLocaleString()}
                </span>
              </div>

              <div className="bg-emerald-50/70 p-3 rounded-xl">
                <span className="text-emerald-700 block text-[11px]">ประหยัดเงินได้ทันที</span>
                <span className="text-lg font-extrabold text-emerald-800 font-mono">
                  ฿{result.earlySettlement.discountAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  (ส่วนลดรวมภาษี VAT)
                </span>
              </div>

              <div className="bg-emerald-700 text-white p-3 rounded-xl">
                <span className="text-emerald-200 block text-[11px]">ยอดเงินสุทธิที่ต้องจ่ายปิดบัญชี</span>
                <span className="text-lg font-extrabold font-mono text-white">
                  ฿{result.earlySettlement.netPayoffAmount.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-200 block mt-0.5">
                  เหลือผ่อน {termMonths - earlyPayoffMonth} งวด
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle View Monthly Car Amortization Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100">
        <button
          onClick={() => setShowAmortization(!showAmortization)}
          className="w-full flex items-center justify-between text-left text-sm font-bold text-slate-900"
        >
          <span>ดูตารางแจกแจงค่างวดรถยนต์รายเดือน ({termMonths} งวด)</span>
          {showAmortization ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showAmortization && (
          <div className="overflow-x-auto mt-4 pt-4 border-t border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 font-semibold">
                  <th className="py-2.5 px-3 rounded-l-lg">งวดที่</th>
                  <th className="py-2.5 px-3 text-right">ค่างวดรวม VAT</th>
                  <th className="py-2.5 px-3 text-right">เงินต้น</th>
                  <th className="py-2.5 px-3 text-right">ดอกเบี้ย</th>
                  <th className="py-2.5 px-3 text-right">VAT 7%</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">เงินต้นคงเหลือ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {result.amortization.map((row) => (
                  <tr
                    key={row.month}
                    className={`hover:bg-slate-50 transition-colors ${
                      row.month === earlyPayoffMonth ? 'bg-emerald-50 font-bold' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-sans font-medium text-slate-900">
                      งวดที่ {row.month}
                      {row.month === earlyPayoffMonth && (
                        <span className="ml-2 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                          งวดปิดยอด
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-900 font-semibold">
                      ฿{row.installment.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-600 font-medium">
                      ฿{row.principal.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-rose-500 font-medium">
                      ฿{row.interest.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      ฿{row.vat.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-900 font-bold">
                      ฿{row.remainingBalance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
