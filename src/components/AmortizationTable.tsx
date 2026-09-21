import React, { useState, useMemo } from 'react';
import { AmortizationSchedule } from '../types';
import { Download, Printer, Calendar, ListFilter, Search, ArrowUpDown } from 'lucide-react';

interface AmortizationTableProps {
  schedule: AmortizationSchedule;
  title: string;
  isHomeLoan?: boolean;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  schedule,
  title,
  isHomeLoan = true,
}) => {
  const [viewMode, setViewMode] = useState<'yearly' | 'monthly'>('yearly');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 24;

  const filteredMonthly = useMemo(() => {
    if (!searchTerm) return schedule.monthlySchedule;
    const term = searchTerm.trim().toLowerCase();
    return schedule.monthlySchedule.filter(
      (item) =>
        item.month.toString() === term ||
        item.year.toString() === term ||
        `ปีที่ ${item.year}`.includes(term) ||
        `งวดที่ ${item.month}`.includes(term)
    );
  }, [schedule.monthlySchedule, searchTerm]);

  const totalPages = Math.ceil(filteredMonthly.length / pageSize);
  const paginatedMonthly = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMonthly.slice(start, start + pageSize);
  }, [filteredMonthly, page]);

  // Export to CSV
  const handleExportCSV = () => {
    let csv = 'งวดที่,ปีที่,เดือนที่,ยอดชำระ,เงินต้น,ดอกเบี้ย,เงินโปะเพิ่ม,เงินต้นสะสม,เงินต้นคงเหลือ,ดอกเบี้ยสะสม\n';
    schedule.monthlySchedule.forEach((item) => {
      csv += `${item.month},${item.year},${item.monthInYear},${item.payment},${item.principal},${item.interest},${item.extraPayment},${item.totalPrincipalPaid},${item.balance},${item.accumulatedInterest}\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `loan_amortization_schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>ตารางผ่อนชำระ ({title})</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-normal">
              {schedule.payoffMonths} งวด ({schedule.payoffYears} ปี)
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            แจกแจงสัดส่วนเงินต้น ดอกเบี้ย และยอดหนี้คงเหลือในแต่ละงวด
          </p>
        </div>

        {/* Action buttons & mode toggler */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-xs font-medium">
            <button
              onClick={() => {
                setViewMode('yearly');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              สรุปรายปี ({schedule.yearlySummary.length} ปี)
            </button>
            <button
              onClick={() => {
                setViewMode('monthly');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              รายเดือน ({schedule.payoffMonths} งวด)
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            title="ดาวน์โหลด CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
            title="พิมพ์ตาราง"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์</span>
          </button>
        </div>
      </div>

      {/* Monthly Search bar if in monthly mode */}
      {viewMode === 'monthly' && (
        <div className="flex items-center justify-between gap-4 mt-4 mb-3">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาปีที่ หรือ งวดที่ เช่น 12, 36..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="text-xs text-slate-500 whitespace-nowrap">
            แสดง {paginatedMonthly.length} จาก {filteredMonthly.length} งวด
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto mt-3">
        {viewMode === 'yearly' ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 font-semibold">
                <th className="py-2.5 px-3 rounded-l-lg">ปีที่</th>
                <th className="py-2.5 px-3 text-right">ยอดผ่อนทั้งปี</th>
                <th className="py-2.5 px-3 text-right">ตัดเงินต้น</th>
                <th className="py-2.5 px-3 text-right">ดอกเบี้ย</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">เงินต้นคงเหลือสิ้นปี</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {schedule.yearlySummary.map((row) => (
                <tr key={`year-${row.year}`} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                    ปีที่ {row.year}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-800 font-semibold">
                    ฿{row.totalPayment.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">
                    ฿{row.principalPaid.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-500 font-medium">
                    ฿{row.interestPaid.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-900 font-bold">
                    ฿{row.endBalance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                <td className="py-3 px-3 font-sans">รวมตลอดสัญญา</td>
                <td className="py-3 px-3 text-right font-mono text-slate-900">
                  ฿{schedule.totalPayments.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-600">
                  ฿{(schedule.totalPayments - schedule.totalInterest).toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono text-rose-600">
                  ฿{schedule.totalInterest.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-600">
                  ฿0 (ปิดยอด)
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 bg-slate-50 font-semibold">
                <th className="py-2.5 px-3 rounded-l-lg">งวดที่</th>
                <th className="py-2.5 px-3 text-center">ปี/เดือน</th>
                <th className="py-2.5 px-3 text-right">ยอดผ่อน</th>
                <th className="py-2.5 px-3 text-right">เงินต้น</th>
                <th className="py-2.5 px-3 text-right">ดอกเบี้ย</th>
                {isHomeLoan && <th className="py-2.5 px-3 text-right">เงินโปะ</th>}
                <th className="py-2.5 px-3 text-right rounded-r-lg">หนี้คงเหลือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {paginatedMonthly.map((row) => (
                <tr
                  key={`month-${row.month}`}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    row.extraPayment > 0 ? 'bg-emerald-50/40' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-sans font-medium text-slate-900">
                    งวดที่ {row.month}
                  </td>
                  <td className="py-2 px-3 text-center font-sans text-slate-500">
                    ปี {row.year} ด.{row.monthInYear}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-900 font-semibold">
                    ฿{row.payment.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-600 font-medium">
                    ฿{row.principal.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right text-rose-500 font-medium">
                    ฿{row.interest.toLocaleString()}
                  </td>
                  {isHomeLoan && (
                    <td className="py-2 px-3 text-right text-emerald-700 font-medium">
                      {row.extraPayment > 0 ? `+฿${row.extraPayment.toLocaleString()}` : '-'}
                    </td>
                  )}
                  <td className="py-2 px-3 text-right text-slate-900 font-bold">
                    ฿{row.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination for monthly view */}
      {viewMode === 'monthly' && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-slate-700"
          >
            ก่อนหน้า
          </button>
          <span className="text-xs text-slate-500">
            หน้า {page} จาก {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-medium text-slate-700"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
};
