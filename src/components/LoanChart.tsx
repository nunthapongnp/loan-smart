import React, { useState, useMemo, useRef } from 'react';
import { AmortizationSchedule } from '../types';

interface LoanChartProps {
  standardSchedule: AmortizationSchedule;
  prepaymentSchedule: AmortizationSchedule;
  initialLoanAmount: number;
  totalYears: number;
  monthlyPaymentWithPrepay: number;
  avgInterestRate: number;
}

export const LoanChart: React.FC<LoanChartProps> = ({
  standardSchedule,
  prepaymentSchedule,
  initialLoanAmount,
  totalYears,
  monthlyPaymentWithPrepay,
  avgInterestRate,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    year: number;
    standardBalance: number;
    prepayBalance: number;
    savedSoFar: number;
    x: number;
    yStandard: number;
    yPrepay: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // คำนวณช่วงแกน Y สูงสุด (เช่น 1M, 2M, 3M, 4M, 5M)
  const maxDebt = useMemo(() => {
    const rawMax = Math.max(initialLoanAmount, 1000000);
    // ปัดขึ้นให้ลงตัว เช่น 4M -> 5M
    const millionUnit = 1000000;
    const roundedMillions = Math.ceil(rawMax / millionUnit);
    return Math.max(roundedMillions * millionUnit, 5000000);
  }, [initialLoanAmount]);

  // สร้างจุด Y grid lines
  const yTicks = useMemo(() => {
    const step = maxDebt / 5;
    return [0, step, step * 2, step * 3, step * 4, maxDebt];
  }, [maxDebt]);

  // แกน X (ปี) 0 ถึง totalYears
  const xTicks = useMemo(() => {
    const ticks: number[] = [0];
    const max = Math.max(totalYears, 30);
    const interval = max <= 10 ? 2 : max <= 20 ? 4 : 4;
    for (let y = interval; y < max; y += interval) {
      ticks.push(y);
    }
    if (!ticks.includes(totalYears)) {
      ticks.push(totalYears);
    }
    return ticks.sort((a, b) => a - b);
  }, [totalYears]);

  // สกัดข้อมูลยอดหนี้คงเหลือ ณ สิ้นปี (Year 0 ถึง Year Max)
  const chartPoints = useMemo(() => {
    const maxYears = Math.max(totalYears, 30);
    const points: Array<{
      year: number;
      standardBalance: number;
      prepayBalance: number;
      standardAccInterest: number;
      prepayAccInterest: number;
    }> = [];

    // Year 0
    points.push({
      year: 0,
      standardBalance: initialLoanAmount,
      prepayBalance: initialLoanAmount,
      standardAccInterest: 0,
      prepayAccInterest: 0,
    });

    for (let y = 1; y <= maxYears; y++) {
      const targetMonth = y * 12;
      // Standard schedule
      const stdItem = standardSchedule.monthlySchedule.find((item) => item.month === targetMonth)
        || (y * 12 > standardSchedule.payoffMonths
            ? { balance: 0, accumulatedInterest: standardSchedule.totalInterest }
            : null);

      // Prepayment schedule
      const prepayItem = prepaymentSchedule.monthlySchedule.find((item) => item.month === targetMonth)
        || (y * 12 > prepaymentSchedule.payoffMonths
            ? { balance: 0, accumulatedInterest: prepaymentSchedule.totalInterest }
            : null);

      points.push({
        year: y,
        standardBalance: stdItem ? stdItem.balance : 0,
        prepayBalance: prepayItem ? prepayItem.balance : 0,
        standardAccInterest: stdItem ? stdItem.accumulatedInterest : standardSchedule.totalInterest,
        prepayAccInterest: prepayItem ? prepayItem.accumulatedInterest : prepaymentSchedule.totalInterest,
      });
    }

    return points;
  }, [initialLoanAmount, standardSchedule, prepaymentSchedule, totalYears]);

  // ขนาด SVG ViewBox
  const svgWidth = 600;
  const svgHeight = 290;
  const paddingLeft = 52;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;
  const maxX = Math.max(totalYears, 30);

  const getX = (year: number) => paddingLeft + (year / maxX) * chartW;
  const getY = (val: number) => paddingTop + chartH - (Math.min(val, maxDebt) / maxDebt) * chartH;

  // สร้าง Path สำหรับ SVG
  const { standardPath, standardAreaPath, prepayPath } = useMemo(() => {
    if (chartPoints.length === 0) return { standardPath: '', standardAreaPath: '', prepayPath: '' };

    // Standard Line & Area
    let sPath = `M ${getX(chartPoints[0].year)} ${getY(chartPoints[0].standardBalance)}`;
    let pPath = `M ${getX(chartPoints[0].year)} ${getY(chartPoints[0].prepayBalance)}`;

    for (let i = 1; i < chartPoints.length; i++) {
      const pt = chartPoints[i];
      sPath += ` L ${getX(pt.year)} ${getY(pt.standardBalance)}`;
      pPath += ` L ${getX(pt.year)} ${getY(pt.prepayBalance)}`;
    }

    const sArea = `${sPath} L ${getX(chartPoints[chartPoints.length - 1].year)} ${paddingTop + chartH} L ${getX(chartPoints[0].year)} ${paddingTop + chartH} Z`;

    return {
      standardPath: sPath,
      standardAreaPath: sArea,
      prepayPath: pPath,
    };
  }, [chartPoints, maxDebt, maxX]);

  // Format Millions
  const formatM = (val: number) => {
    if (val === 0) return '฿0';
    const m = val / 1000000;
    return `฿${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (mouseX - paddingLeft) / chartW));
    const targetYear = Math.round(ratio * maxX);

    const point = chartPoints.find((p) => p.year === targetYear) || chartPoints[0];
    if (point) {
      setHoveredPoint({
        year: point.year,
        standardBalance: point.standardBalance,
        prepayBalance: point.prepayBalance,
        savedSoFar: Math.max(0, point.standardAccInterest - point.prepayAccInterest),
        x: getX(point.year),
        yStandard: getY(point.standardBalance),
        yPrepay: getY(point.prepayBalance),
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100" ref={containerRef}>
      {/* Top Header Metrics matching the screenshot */}
      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 mb-4">
        <div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ฿{monthlyPaymentWithPrepay.toLocaleString()}
          </div>
          <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            ยอดผ่อน+โปะ (ต่อเดือน)
          </div>
        </div>
        <div className="text-right border-l border-slate-100 pl-4">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {avgInterestRate.toFixed(1)}%
          </div>
          <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            อัตราดอกเบี้ย
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-slate-800">ยอดหนี้คงเหลือ</h3>
        <div className="text-xs font-normal text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
          ลดลงตามระยะเวลา
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full aspect-[2/1] min-h-[220px] max-h-[300px]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            {/* Soft Blue Gradient Area for minimum payment */}
            <linearGradient id="blueAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#eff6ff" stopOpacity="0.05" />
            </linearGradient>
            {/* Green Drop Glow */}
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#10b981" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Grid lines horizontal (dashed) */}
          {yTicks.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={`y-grid-${idx}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={paddingLeft + chartW}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                  fontWeight="500"
                  className="font-mono"
                >
                  {formatM(val)}
                </text>
              </g>
            );
          })}

          {/* X Axis ticks & labels */}
          {xTicks.map((yearVal, idx) => {
            const x = getX(yearVal);
            return (
              <g key={`x-grid-${idx}`}>
                <line
                  x1={x}
                  y1={paddingTop + chartH}
                  x2={x}
                  y2={paddingTop + chartH + 4}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={paddingTop + chartH + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748b"
                  fontWeight="500"
                >
                  {yearVal}
                </text>
              </g>
            );
          })}

          {/* X Axis Unit Label */}
          <text
            x={paddingLeft + chartW / 2}
            y={paddingTop + chartH + 32}
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
            fontWeight="500"
          >
            ปี (Years)
          </text>

          {/* Area Fill for Standard Minimum Payment */}
          <path d={standardAreaPath} fill="url(#blueAreaGrad)" />

          {/* Standard Curve (Blue line) */}
          <path
            d={standardPath}
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Prepayment Curve (Bright Green line with glow) */}
          <path
            d={prepayPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glowGreen)"
          />

          {/* Hover Crosshair & Dots */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={paddingTop}
                x2={hoveredPoint.x}
                y2={paddingTop + chartH}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* Point on standard curve */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.yStandard}
                r="4.5"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="2"
              />
              {/* Point on prepay curve */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.yPrepay}
                r="5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute top-2 pointer-events-none z-20 bg-slate-900/90 backdrop-blur-sm text-white text-xs rounded-xl py-2 px-3 shadow-lg border border-slate-700/50 flex flex-col gap-1 transition-all"
            style={{
              left: `${Math.min(Math.max(hoveredPoint.x - 70, 10), 440)}px`,
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 flex justify-between gap-3">
              <span>สิ้นปีที่ {hoveredPoint.year}</span>
              <span className="text-emerald-400 font-mono">
                {hoveredPoint.prepayBalance <= 0 ? '✓ หมดหนี้แล้ว!' : ''}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-blue-300">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                ผ่อนปกติ:
              </span>
              <span className="font-mono font-bold">฿{hoveredPoint.standardBalance.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                แผนโปะ:
              </span>
              <span className="font-mono font-bold text-emerald-400">
                ฿{hoveredPoint.prepayBalance.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend below the chart (exactly matching screenshot) */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-2 border-t border-slate-100 text-xs sm:text-sm font-medium">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-3 h-3 rounded-sm bg-blue-500 shadow-sm" />
          <span>ผ่อนขั้นต่ำ ({standardSchedule.payoffYears} ปี)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 shadow-sm" />
          <span>แผนโปะปิดหนี้ ({prepaymentSchedule.payoffYears} ปี)</span>
        </div>
      </div>
    </div>
  );
};
