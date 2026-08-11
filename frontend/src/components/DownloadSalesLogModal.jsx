import { useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import Modal from './Modal';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'first_half', label: 'First Half (Jan–Jun)' },
  { value: 'second_half', label: 'Second Half (Jul–Dec)' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom Date Range' },
];

export default function DownloadSalesLogModal({ onClose }) {
  const { showToast } = useToast();
  const [period, setPeriod] = useState('today');
  const [monthValue, setMonthValue] = useState('');
  const [yearValue, setYearValue] = useState(String(new Date().getFullYear()));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const params = { period };

      if (period === 'monthly') {
        if (!monthValue) {
          showToast('Month Required', 'Please select a month.', 'error');
          return;
        }
        params.startDate = `${monthValue}-01`;
      }

      if (period === 'yearly') {
        if (!yearValue) {
          showToast('Year Required', 'Please select a year.', 'error');
          return;
        }
        params.startDate = `${yearValue}-01-01`;
      }

      if (period === 'custom') {
        if (!startDate || !endDate) {
          showToast('Date Range Required', 'Select both start and end dates.', 'error');
          return;
        }
        if (new Date(startDate) > new Date(endDate)) {
          showToast('Invalid Range', 'Start date cannot be after end date.', 'error');
          return;
        }
        params.startDate = startDate;
        params.endDate = endDate;
      }

      if (period === 'first_half' || period === 'second_half') {
        params.startDate = yearValue ? `${yearValue}-01-01` : '';
      }

      params.format = 'pdf';
      const { blob, filename } = await api.downloadSalesLog(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Log Ready', 'Sales log downloaded successfully.');
      onClose();
    } catch (err) {
      showToast('Download Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Download Sales Log"
      onClose={onClose}
      size="md"
      footer={(
        <>
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold">Cancel</button>
          <button type="button" disabled={loading} onClick={handleDownload} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-60">{loading ? 'Generating...' : 'Download Log'}</button>
        </>
      )}
    >
      <p className="text-xs text-slate-300">Export the Customer & Sales Log to PDF for the selected period.</p>

      <fieldset className="space-y-2">
        <legend className="sr-only">Report period</legend>
        {PERIODS.map((item) => (
          <label key={item.value} className="flex items-center gap-2 text-sm text-slate-100">
            <input
              type="radio"
              name="sales-log-period"
              value={item.value}
              checked={period === item.value}
              onChange={() => setPeriod(item.value)}
            />
            {item.label}
          </label>
        ))}
      </fieldset>

      {period === 'monthly' && (
        <div>
          <label htmlFor="log-month" className="block text-xs font-bold uppercase text-slate-100 mb-1">Month</label>
          <input id="log-month" type="month" value={monthValue} onChange={(e) => setMonthValue(e.target.value)} className="w-full text-sm p-2.5 border border-slate-200 rounded-xl" />
        </div>
      )}

      {period === 'yearly' && (
        <div>
          <label htmlFor="log-year" className="block text-xs font-bold uppercase text-slate-100 mb-1">Year</label>
          <input id="log-year" type="number" min="2000" max="2100" value={yearValue} onChange={(e) => setYearValue(e.target.value)} className="w-full text-sm p-2.5 border border-slate-200 rounded-xl" />
        </div>
      )}

      {period === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="log-start-date" className="block text-xs font-bold uppercase text-slate-100 mb-1">Start Date</label>
            <input id="log-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full text-sm p-2.5 border border-slate-200 rounded-xl" />
          </div>
          <div>
            <label htmlFor="log-end-date" className="block text-xs font-bold uppercase text-slate-100 mb-1">End Date</label>
            <input id="log-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full text-sm p-2.5 border border-slate-200 rounded-xl" />
          </div>
        </div>
      )}
    </Modal>
  );
}
