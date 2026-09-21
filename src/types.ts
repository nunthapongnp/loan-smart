export type LoanTab = 'home' | 'car' | 'refinance';

export interface PrepaymentConfig {
  extraMonthly: number; // โปะเพิ่มทุกเดือน
  extraYearly: number; // โปะโบนัสทุกสิ้นปี
  oneTimeExtraAmount: number; // โปะเงินก้อนครั้งเดียว
  oneTimeExtraMonth: number; // งวดที่ต้องการโปะเงินก้อนครั้งเดียว
}

export interface HomeLoanInputs {
  propertyPrice: number;
  downPayment: number;
  loanAmount: number;
  loanTermYears: number;
  interestType: 'fixed' | 'stepped';
  avgInterestRate: number; // % ต่อปี (เฉลี่ย)
  steppedRates: {
    year1: number;
    year2: number;
    year3: number;
    yearAfter: number;
  };
  prepayment: PrepaymentConfig;
  annualTaxBracketPercent: number; // สำหรับคำนวณลดหย่อนภาษีดอกเบี้ยบ้าน (สูงสุด 100,000 บ.)
}

export interface CarLoanInputs {
  carPrice: number;
  downPayment: number;
  loanAmount: number;
  flatRate: number; // % ต่อปี (Flat Rate)
  termMonths: number; // 12, 24, 36, 48, 60, 72, 84
  includeVat: boolean; // VAT 7%
  earlyPayoffMonth: number; // เดือนที่ต้องการปิดยอดก่อนกำหนดเพื่อดูส่วนลด สคบ.
}

export interface RefinanceInputs {
  currentRemainingDebt: number; // หนี้คงเหลือ
  currentRate: number; // ดอกเบี้ยเดิม (% ต่อปี)
  currentMonthlyPay: number; // ค่างวดเดิมต่อเดือน
  remainingYears: number; // ระยะเวลาผ่อนที่เหลือ
  // ข้อเสนอใหม่ (รีไฟแนนซ์)
  newRate3Y: number; // ดอกเบี้ยใหม่เฉลี่ย 3 ปีแรก (%)
  newRateAfter3Y: number; // ดอกเบี้ยใหม่ปีที่ 4 เป็นต้นไป (%)
  newTermYears: number; // จำนวนปีสัญญาใหม่
  newMonthlyPayCustom?: number; // ถ้ามี
  // ข้อเสนอ Retention (ขอลดดอกเบี้ยธนาคารเดิม)
  retentionRate3Y: number; // ดอกเบี้ย retention เฉลี่ย 3 ปี (%)
  // ค่าธรรมเนียมรีไฟแนนซ์
  appraisalFee: number; // ค่าประเมินราคาหลักทรัพย์ (ปกติ 2,500 - 3,500 บ.)
  mortgageFeePercent: number; // ค่าจดจำนอง (ปกติ 1%)
  stampDutyPercent: number; // ค่าอากรแสตมป์ (0.05%)
  insuranceAndOtherFees: number; // ค่าประกัน/อื่นๆ
  isFreeMortgagePromo: boolean; // ได้โปรโมชั่นธนาคารออกค่าจดจำนองให้ฟรีหรือไม่
}

export interface MonthlyAmortizationItem {
  month: number;
  year: number;
  monthInYear: number;
  payment: number;
  principal: number;
  interest: number;
  extraPayment: number;
  totalPrincipalPaid: number;
  balance: number;
  accumulatedInterest: number;
  accumulatedTotalPaid: number;
}

export interface AmortizationSchedule {
  monthlySchedule: MonthlyAmortizationItem[];
  yearlySummary: {
    year: number;
    totalPayment: number;
    principalPaid: number;
    interestPaid: number;
    endBalance: number;
  }[];
  monthlyInstallment: number;
  totalPayments: number;
  totalInterest: number;
  payoffMonths: number;
  payoffYears: number;
}

export interface HomeCalculationResult {
  standard: AmortizationSchedule;
  withPrepayment: AmortizationSchedule;
  interestSaved: number;
  timeSavedMonths: number;
  totalAmountSaved: number;
  taxDeductionEstimateStandard: number;
  taxDeductionEstimatePrepay: number;
}

export interface CarCalculationResult {
  carPrice: number;
  downPayment: number;
  downPaymentPercent: number;
  loanAmount: number;
  totalInterest: number;
  totalDebtBeforeVat: number;
  vatTotal: number;
  totalDebtWithVat: number;
  monthlyInstallment: number;
  monthlyInstallmentBeforeVat: number;
  monthlyVat: number;
  effectiveInterestRate: number; // EIR ดอกเบี้ยที่แท้จริงตาม สคบ.
  amortization: {
    month: number;
    installment: number;
    principal: number;
    interest: number;
    vat: number;
    remainingBalance: number;
  }[];
  earlySettlement?: {
    month: number;
    unearnedInterest: number;
    discountPercent: number; // สคบ: ผ่อนมา < 1/3 ลด 100%, 1/3 - 2/3 ลด 70%, > 2/3 ลด 50%
    discountAmount: number;
    netPayoffAmount: number;
  };
}

export interface RefinanceCalculationResult {
  // ดอกเบี้ยและค่างวด 3 ปีแรก
  current3YearInterest: number;
  current3YearTotalPay: number;
  refinance3YearInterest: number;
  refinance3YearTotalPay: number;
  retention3YearInterest: number;
  retention3YearTotalPay: number;
  
  // ยอดผ่อนใหม่ต่อเดือน
  newMonthlyPayment: number;
  monthlySavings: number;

  // ค่าธรรมเนียมรีไฟแนนซ์รวม
  totalRefinanceCosts: number;
  costBreakdown: {
    appraisal: number;
    mortgage: number;
    stampDuty: number;
    other: number;
  };

  // การประหยัดสุทธิ 3 ปีแรก
  savings3YearNet: number;
  breakEvenMonths: number;

  // ตลอดอายุสัญญา
  totalLifetimeSavings: number;
  
  // เปรียบเทียบกับ Retention
  retentionSavings3YearNet: number;
  refinanceVsRetentionDiff: number; // > 0 แปลว่ารีไฟแนนซ์ประหยัดกว่า Retention

  verdict: {
    title: string;
    description: string;
    badge: 'strongly_refinance' | 'retention_better' | 'stay_current';
  };
}
