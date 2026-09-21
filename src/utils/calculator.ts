import {
  HomeLoanInputs,
  HomeCalculationResult,
  AmortizationSchedule,
  MonthlyAmortizationItem,
  CarLoanInputs,
  CarCalculationResult,
  RefinanceInputs,
  RefinanceCalculationResult,
} from '../types';

/**
 * คำนวณค่างวดรายเดือนมาตรฐาน (PMT) สำหรับดอกเบี้ยลดต้นลดดอก
 */
export function calculatePMT(principal: number, annualRatePercent: number, totalMonths: number): number {
  if (totalMonths <= 0 || principal <= 0) return 0;
  if (annualRatePercent <= 0) return principal / totalMonths;

  const monthlyRate = annualRatePercent / 100 / 12;
  const pmt = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
  return Math.round(pmt);
}

/**
 * คำนวณตารางผ่อนบ้านแบบลดต้นลดดอก พร้อมจำลองการโปะหนี้
 */
export function calculateHomeAmortization(
  inputs: HomeLoanInputs,
  applyPrepayment: boolean = false
): AmortizationSchedule {
  const { loanAmount, loanTermYears, interestType, avgInterestRate, steppedRates, prepayment } = inputs;
  const totalContractMonths = loanTermYears * 12;

  // อัตราดอกเบี้ยเริ่มต้น
  const initialRate = interestType === 'stepped' ? steppedRates.year1 : avgInterestRate;
  const standardMonthlyPayment = calculatePMT(loanAmount, initialRate, totalContractMonths);

  let currentBalance = loanAmount;
  let accumulatedInterest = 0;
  let accumulatedTotalPaid = 0;
  let month = 1;

  const monthlySchedule: MonthlyAmortizationItem[] = [];
  const yearlyMap = new Map<number, { payment: number; principal: number; interest: number; endBalance: number }>();

  while (currentBalance > 0.01 && month <= totalContractMonths * 2) {
    const currentYear = Math.ceil(month / 12);
    const monthInYear = ((month - 1) % 12) + 1;

    // อัตราดอกเบี้ยประจำปีตามประเภท
    let currentAnnualRate = avgInterestRate;
    if (interestType === 'stepped') {
      if (currentYear === 1) currentAnnualRate = steppedRates.year1;
      else if (currentYear === 2) currentAnnualRate = steppedRates.year2;
      else if (currentYear === 3) currentAnnualRate = steppedRates.year3;
      else currentAnnualRate = steppedRates.yearAfter;
    }

    const monthlyRate = currentAnnualRate / 100 / 12;
    const interestForMonth = currentBalance * monthlyRate;

    // ค่างวดพื้นฐาน
    let plannedPayment = standardMonthlyPayment;
    // ปรับค่างวดตามอัตราดอกเบี้ยใหม่ถ้าเป็น stepped
    if (interestType === 'stepped') {
      const remainingMonths = Math.max(1, totalContractMonths - month + 1);
      plannedPayment = calculatePMT(currentBalance, currentAnnualRate, remainingMonths);
    }

    let extraPay = 0;
    if (applyPrepayment) {
      // โปะรายเดือน
      if (prepayment.extraMonthly > 0) {
        extraPay += prepayment.extraMonthly;
      }
      // โปะรายปี (ทุกเดือนที่ 12)
      if (monthInYear === 12 && prepayment.extraYearly > 0) {
        extraPay += prepayment.extraYearly;
      }
      // โปะก้อนเดียวตามงวดที่กำหนด
      if (month === prepayment.oneTimeExtraMonth && prepayment.oneTimeExtraAmount > 0) {
        extraPay += prepayment.oneTimeExtraAmount;
      }
    }

    // เงินต้นที่ชำระได้ตามงวดปกติ
    let regularPrincipal = plannedPayment - interestForMonth;
    if (regularPrincipal < 0) {
      // ดอกเบี้ยสูงกว่าค่างวด (เกิดกรณีตั้งค่างวดต่ำเกินไป)
      regularPrincipal = 0;
      plannedPayment = interestForMonth;
    }

    let totalPrincipalPaidThisMonth = regularPrincipal + extraPay;
    let actualPaymentThisMonth = interestForMonth + totalPrincipalPaidThisMonth;

    // ถ้ายอดชำระเกินยอดหนี้คงเหลือ ให้ตัดจบพอดี
    if (totalPrincipalPaidThisMonth >= currentBalance) {
      totalPrincipalPaidThisMonth = currentBalance;
      actualPaymentThisMonth = currentBalance + interestForMonth;
      currentBalance = 0;
    } else {
      currentBalance -= totalPrincipalPaidThisMonth;
    }

    accumulatedInterest += interestForMonth;
    accumulatedTotalPaid += actualPaymentThisMonth;

    monthlySchedule.push({
      month,
      year: currentYear,
      monthInYear,
      payment: Math.round(actualPaymentThisMonth),
      principal: Math.round(totalPrincipalPaidThisMonth),
      interest: Math.round(interestForMonth),
      extraPayment: Math.round(extraPay),
      totalPrincipalPaid: Math.round(loanAmount - currentBalance),
      balance: Math.round(currentBalance),
      accumulatedInterest: Math.round(accumulatedInterest),
      accumulatedTotalPaid: Math.round(accumulatedTotalPaid),
    });

    // สรุปรายปี
    const prevYearData = yearlyMap.get(currentYear) || { payment: 0, principal: 0, interest: 0, endBalance: 0 };
    yearlyMap.set(currentYear, {
      payment: prevYearData.payment + actualPaymentThisMonth,
      principal: prevYearData.principal + totalPrincipalPaidThisMonth,
      interest: prevYearData.interest + interestForMonth,
      endBalance: currentBalance,
    });

    if (currentBalance <= 0) break;
    month++;
  }

  const payoffMonths = monthlySchedule.length;
  const yearlySummary = Array.from(yearlyMap.entries()).map(([year, data]) => ({
    year,
    totalPayment: Math.round(data.payment),
    principalPaid: Math.round(data.principal),
    interestPaid: Math.round(data.interest),
    endBalance: Math.round(data.endBalance),
  }));

  return {
    monthlySchedule,
    yearlySummary,
    monthlyInstallment: Math.round(standardMonthlyPayment),
    totalPayments: Math.round(accumulatedTotalPaid),
    totalInterest: Math.round(accumulatedInterest),
    payoffMonths,
    payoffYears: Number((payoffMonths / 12).toFixed(1)),
  };
}

/**
 * คำนวณภาพรวมสินเชื่อบ้าน ทั้งผ่อนปกติ และแผนโปะ
 */
export function calculateHomeLoan(inputs: HomeLoanInputs): HomeCalculationResult {
  const standard = calculateHomeAmortization(inputs, false);
  const withPrepayment = calculateHomeAmortization(inputs, true);

  const interestSaved = Math.max(0, standard.totalInterest - withPrepayment.totalInterest);
  const timeSavedMonths = Math.max(0, standard.payoffMonths - withPrepayment.payoffMonths);
  const totalAmountSaved = Math.max(0, standard.totalPayments - withPrepayment.totalPayments);

  // คำนวณสิทธิลดหย่อนภาษีดอกเบี้ยกู้บ้าน (สูงสุด 100,000 บาทต่อปี)
  const taxBracket = (inputs.annualTaxBracketPercent || 15) / 100;

  const taxDeductionEstimateStandard = standard.yearlySummary.reduce((acc, y) => {
    return acc + Math.min(100000, y.interestPaid) * taxBracket;
  }, 0);

  const taxDeductionEstimatePrepay = withPrepayment.yearlySummary.reduce((acc, y) => {
    return acc + Math.min(100000, y.interestPaid) * taxBracket;
  }, 0);

  return {
    standard,
    withPrepayment,
    interestSaved: Math.round(interestSaved),
    timeSavedMonths,
    totalAmountSaved: Math.round(totalAmountSaved),
    taxDeductionEstimateStandard: Math.round(taxDeductionEstimateStandard),
    taxDeductionEstimatePrepay: Math.round(taxDeductionEstimatePrepay),
  };
}

/**
 * คำนวณดอกเบี้ยที่แท้จริง (Effective Interest Rate - EIR) สำหรับรถยนต์
 */
function solveCarEIR(principal: number, monthlyPayment: number, months: number): number {
  if (principal <= 0 || monthlyPayment <= 0 || months <= 0) return 0;
  // Binary search for monthly rate r such that sum PMT / (1+r)^t = principal
  let low = 0;
  let high = 1.0;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    let presentValue = 0;
    for (let t = 1; t <= months; t++) {
      presentValue += monthlyPayment / Math.pow(1 + mid, t);
    }
    if (presentValue > principal) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const annualEIR = low * 12 * 100;
  return Number(annualEIR.toFixed(2));
}

/**
 * คำนวณสินเชื่อรถยนต์ (Flat Rate + VAT 7% + ส่วนลดปิดบัญชีก่อนกำหนดตาม สคบ.)
 */
export function calculateCarLoan(inputs: CarLoanInputs): CarCalculationResult {
  const { carPrice, downPayment, flatRate, termMonths, includeVat, earlyPayoffMonth } = inputs;
  const loanAmount = Math.max(0, carPrice - downPayment);
  const downPaymentPercent = carPrice > 0 ? Number(((downPayment / carPrice) * 100).toFixed(1)) : 0;

  const totalYears = termMonths / 12;
  const totalInterest = loanAmount * (flatRate / 100) * totalYears;
  const totalDebtBeforeVat = loanAmount + totalInterest;

  const monthlyInstallmentBeforeVat = termMonths > 0 ? totalDebtBeforeVat / termMonths : 0;
  const monthlyVat = includeVat ? monthlyInstallmentBeforeVat * 0.07 : 0;
  const monthlyInstallment = monthlyInstallmentBeforeVat + monthlyVat;
  const vatTotal = monthlyVat * termMonths;
  const totalDebtWithVat = totalDebtBeforeVat + vatTotal;

  const effectiveInterestRate = solveCarEIR(loanAmount, monthlyInstallmentBeforeVat, termMonths);

  // คำนวณตารางค่างวดรถยนต์
  // สำหรับการปิดยอดก่อนกำหนดตามเกณฑ์ สคบ. ใหม่ (Rule of 78 หรือ ดอกเบี้ยลดต้นลดดอก):
  // รวมตัวเลขงวด (Sum of digits: n*(n+1)/2)
  const sumOfDigits = (termMonths * (termMonths + 1)) / 2;

  let remainingPrincipal = loanAmount;
  let remainingTotalDebt = totalDebtWithVat;
  const amortization = [];

  for (let m = 1; m <= termMonths; m++) {
    // ดอกเบี้ยตามงวดแบบ Rule of 78
    const digitsRemaining = termMonths - m + 1;
    const interestThisMonth = (digitsRemaining / sumOfDigits) * totalInterest;
    const principalThisMonth = monthlyInstallmentBeforeVat - interestThisMonth;

    remainingPrincipal = Math.max(0, remainingPrincipal - principalThisMonth);
    remainingTotalDebt = Math.max(0, remainingTotalDebt - monthlyInstallment);

    amortization.push({
      month: m,
      installment: Math.round(monthlyInstallment),
      principal: Math.round(principalThisMonth),
      interest: Math.round(interestThisMonth),
      vat: Math.round(monthlyVat),
      remainingBalance: Math.round(remainingPrincipal),
    });
  }

  // คำนวณส่วนลดปิดบัญชีก่อนกำหนดตามประกาศ สคบ. ใหม่
  let earlySettlement: CarCalculationResult['earlySettlement'] = undefined;
  if (earlyPayoffMonth > 0 && earlyPayoffMonth < termMonths) {
    // ดอกเบี้ยที่ยังไม่ถึงกำหนดชำระ (Unearned Interest)
    // ผลรวม digits ของงวดที่เหลือ (termMonths - earlyPayoffMonth)
    const remainingCount = termMonths - earlyPayoffMonth;
    const sumDigitsRemaining = (remainingCount * (remainingCount + 1)) / 2;
    const unearnedInterest = (sumDigitsRemaining / sumOfDigits) * totalInterest;

    // เกณฑ์ สคบ. ใหม่:
    // 1) ผ่อนมาแล้ว < 1/3 (33.33%): ได้รับส่วนลด 100% ของดอกเบี้ยที่ยังไม่ถึงกำหนดชำระ
    // 2) ผ่อนมาแล้ว 1/3 ถึง 2/3 (33.33% - 66.66%): ได้รับส่วนลดไม่น้อยกว่า 70%
    // 3) ผ่อนมาแล้ว > 2/3 (66.66%): ได้รับส่วนลดไม่น้อยกว่า 50%
    const progressRatio = earlyPayoffMonth / termMonths;
    let discountPercent = 50;
    if (progressRatio < 1 / 3) {
      discountPercent = 100;
    } else if (progressRatio <= 2 / 3) {
      discountPercent = 70;
    } else {
      discountPercent = 50;
    }

    const discountAmount = unearnedInterest * (discountPercent / 100);
    // ค่างวดที่เหลือรวม VAT หักส่วนลดดอกเบี้ย (+VAT ของส่วนลด)
    const remainingInstallmentsTotal = remainingCount * monthlyInstallment;
    const discountWithVat = includeVat ? discountAmount * 1.07 : discountAmount;
    const netPayoffAmount = Math.max(0, remainingInstallmentsTotal - discountWithVat);

    earlySettlement = {
      month: earlyPayoffMonth,
      unearnedInterest: Math.round(unearnedInterest),
      discountPercent,
      discountAmount: Math.round(discountWithVat),
      netPayoffAmount: Math.round(netPayoffAmount),
    };
  }

  return {
    carPrice,
    downPayment,
    downPaymentPercent,
    loanAmount,
    totalInterest: Math.round(totalInterest),
    totalDebtBeforeVat: Math.round(totalDebtBeforeVat),
    vatTotal: Math.round(vatTotal),
    totalDebtWithVat: Math.round(totalDebtWithVat),
    monthlyInstallment: Math.round(monthlyInstallment),
    monthlyInstallmentBeforeVat: Math.round(monthlyInstallmentBeforeVat),
    monthlyVat: Math.round(monthlyVat),
    effectiveInterestRate,
    amortization,
    earlySettlement,
  };
}

/**
 * คำนวณเปรียบเทียบการรีไฟแนนซ์ (Refinance) vs Retention vs ผ่อนตามสัญญาเดิม
 */
export function calculateRefinance(inputs: RefinanceInputs): RefinanceCalculationResult {
  const {
    currentRemainingDebt,
    currentRate,
    remainingYears,
    newRate3Y,
    newRateAfter3Y,
    newTermYears,
    retentionRate3Y,
    appraisalFee,
    mortgageFeePercent,
    stampDutyPercent,
    insuranceAndOtherFees,
    isFreeMortgagePromo,
  } = inputs;

  const currentTotalMonths = remainingYears * 12;
  const newTotalMonths = newTermYears * 12;

  // ค่างวดเดิม
  const currentMonthly = inputs.currentMonthlyPay > 0
    ? inputs.currentMonthlyPay
    : calculatePMT(currentRemainingDebt, currentRate, currentTotalMonths);

  // คำนวณสัญญาเดิม 3 ปีแรก (36 เดือน)
  let curBal = currentRemainingDebt;
  let current3YearInterest = 0;
  let current3YearTotalPay = 0;
  for (let m = 1; m <= 36 && curBal > 0; m++) {
    const interest = curBal * (currentRate / 100 / 12);
    const principal = Math.min(curBal, currentMonthly - interest);
    current3YearInterest += interest;
    current3YearTotalPay += (interest + principal);
    curBal -= principal;
  }

  // คำนวณข้อเสนอรีไฟแนนซ์ 3 ปีแรก (36 เดือน)
  const newMonthlyPayment = calculatePMT(currentRemainingDebt, newRate3Y, newTotalMonths);
  let refBal = currentRemainingDebt;
  let refinance3YearInterest = 0;
  let refinance3YearTotalPay = 0;
  for (let m = 1; m <= 36 && refBal > 0; m++) {
    const interest = refBal * (newRate3Y / 100 / 12);
    const principal = Math.min(refBal, newMonthlyPayment - interest);
    refinance3YearInterest += interest;
    refinance3YearTotalPay += (interest + principal);
    refBal -= principal;
  }

  // คำนวณ Retention 3 ปีแรก (ธนาคารเดิม ไม่มีค่าจดจำนองและค่าธรรมเนียม)
  const retentionMonthly = calculatePMT(currentRemainingDebt, retentionRate3Y, currentTotalMonths);
  let retBal = currentRemainingDebt;
  let retention3YearInterest = 0;
  let retention3YearTotalPay = 0;
  for (let m = 1; m <= 36 && retBal > 0; m++) {
    const interest = retBal * (retentionRate3Y / 100 / 12);
    const principal = Math.min(retBal, retentionMonthly - interest);
    retention3YearInterest += interest;
    retention3YearTotalPay += (interest + principal);
    retBal -= principal;
  }

  // ค่าธรรมเนียมการรีไฟแนนซ์
  const mortgageCost = isFreeMortgagePromo ? 0 : currentRemainingDebt * (mortgageFeePercent / 100);
  const stampCost = Math.min(10000, currentRemainingDebt * (stampDutyPercent / 100));
  const totalRefinanceCosts = appraisalFee + mortgageCost + stampCost + insuranceAndOtherFees;

  // ประหยัดดอกเบี้ย 3 ปีแรกจากการรีไฟแนนซ์
  const grossInterestSavings3Y = current3YearInterest - refinance3YearInterest;
  const savings3YearNet = grossInterestSavings3Y - totalRefinanceCosts;

  // จุดคุ้มทุน (กี่เดือนคืนทุนค่าธรรมเนียม)
  const monthlyInterestSavings = grossInterestSavings3Y / 36;
  const breakEvenMonths = monthlyInterestSavings > 0
    ? Math.ceil(totalRefinanceCosts / monthlyInterestSavings)
    : 999;

  // การประหยัด Retention
  const retentionSavings3YearNet = current3YearInterest - retention3YearInterest;
  const refinanceVsRetentionDiff = savings3YearNet - retentionSavings3YearNet;

  // ค่างวดที่ลดลงต่อเดือน
  const monthlySavings = currentMonthly - newMonthlyPayment;

  // คำนวณตลอดอายุสัญญา (ประมาณการ)
  // สัญญาเดิมตลอดอายุ:
  const curFullSchedule = calculateHomeAmortization({
    propertyPrice: currentRemainingDebt,
    downPayment: 0,
    loanAmount: currentRemainingDebt,
    loanTermYears: remainingYears,
    interestType: 'fixed',
    avgInterestRate: currentRate,
    steppedRates: { year1: currentRate, year2: currentRate, year3: currentRate, yearAfter: currentRate },
    prepayment: { extraMonthly: 0, extraYearly: 0, oneTimeExtraAmount: 0, oneTimeExtraMonth: 0 },
    annualTaxBracketPercent: 15,
  });

  // รีไฟแนนซ์ตลอดอายุ:
  const refFullSchedule = calculateHomeAmortization({
    propertyPrice: currentRemainingDebt,
    downPayment: 0,
    loanAmount: currentRemainingDebt,
    loanTermYears: newTermYears,
    interestType: 'stepped',
    avgInterestRate: newRate3Y,
    steppedRates: { year1: newRate3Y, year2: newRate3Y, year3: newRate3Y, yearAfter: newRateAfter3Y },
    prepayment: { extraMonthly: 0, extraYearly: 0, oneTimeExtraAmount: 0, oneTimeExtraMonth: 0 },
    annualTaxBracketPercent: 15,
  });

  const totalLifetimeSavings = Math.max(0, curFullSchedule.totalInterest - refFullSchedule.totalInterest - totalRefinanceCosts);

  // วินิจฉัยคำแนะนำ
  let verdict: RefinanceCalculationResult['verdict'] = {
    title: 'คุ้มค่ามาก แนะนำรีไฟแนนซ์ (Refinance)',
    description: `ประหยัดดอกเบี้ยสุทธิกว่า ฿${Math.round(savings3YearNet).toLocaleString()} ใน 3 ปีแรก จุดคุ้มทุนเพียง ${breakEvenMonths} เดือน`,
    badge: 'strongly_refinance',
  };

  if (savings3YearNet <= 0) {
    verdict = {
      title: 'ยังไม่แนะนำให้รีไฟแนนซ์',
      description: 'ค่าธรรมเนียมในการย้ายธนาคารสูงกว่าดอกเบี้ยที่ประหยัดได้ หรืออัตราดอกเบี้ยต่างกันน้อยเกินไป',
      badge: 'stay_current',
    };
  } else if (refinanceVsRetentionDiff < 15000 && retentionRate3Y > 0) {
    verdict = {
      title: 'แนะนำขอ Retention กับธนาคารเดิม',
      description: `การรีไฟแนนซ์ประหยัดกว่า Retention เพียง ฿${Math.round(Math.max(0, refinanceVsRetentionDiff)).toLocaleString()} ซึ่งอาจไม่คุ้มค่าความยุ่งยากในการเตรียมเอกสารและย้ายหลักทรัพย์`,
      badge: 'retention_better',
    };
  }

  return {
    current3YearInterest: Math.round(current3YearInterest),
    current3YearTotalPay: Math.round(current3YearTotalPay),
    refinance3YearInterest: Math.round(refinance3YearInterest),
    refinance3YearTotalPay: Math.round(refinance3YearTotalPay),
    retention3YearInterest: Math.round(retention3YearInterest),
    retention3YearTotalPay: Math.round(retention3YearTotalPay),
    newMonthlyPayment: Math.round(newMonthlyPayment),
    monthlySavings: Math.round(monthlySavings),
    totalRefinanceCosts: Math.round(totalRefinanceCosts),
    costBreakdown: {
      appraisal: Math.round(appraisalFee),
      mortgage: Math.round(mortgageCost),
      stampDuty: Math.round(stampCost),
      other: Math.round(insuranceAndOtherFees),
    },
    savings3YearNet: Math.round(savings3YearNet),
    breakEvenMonths,
    totalLifetimeSavings: Math.round(totalLifetimeSavings),
    retentionSavings3YearNet: Math.round(retentionSavings3YearNet),
    refinanceVsRetentionDiff: Math.round(refinanceVsRetentionDiff),
    verdict,
  };
}
