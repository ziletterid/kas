/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  QrCode, 
  Banknote,
  Sparkles
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatCategoryLabel } from '../services/sheetsService';

interface TransactionListProps {
  transactions: Transaction[];
  isPublicView: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string, description: string) => void;
  onOpenAddModal: (type: TransactionType) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isPublicView,
  onEdit,
  onDelete,
  onOpenAddModal,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'masuk' | 'beli_kok' | 'sewa_lapangan' | 'keluar_lain'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Extract available months from transaction dates
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.date) {
        set.add(t.date.slice(0, 7)); // YYYY-MM
      }
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Tab filter
      if (activeTab === 'masuk' && t.type !== 'masuk') return false;
      if (activeTab === 'beli_kok' && (t.type !== 'keluar' || t.category !== 'beli_kok')) return false;
      if (activeTab === 'sewa_lapangan' && (t.type !== 'keluar' || t.category !== 'sewa_lapangan')) return false;
      if (activeTab === 'keluar_lain' && (t.type !== 'keluar' || t.category === 'beli_kok' || t.category === 'sewa_lapangan')) return false;

      // Month filter
      if (selectedMonth !== 'all' && !t.date.startsWith(selectedMonth)) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const memberMatch = t.memberName?.toLowerCase().includes(query);
        const descMatch = t.description?.toLowerCase().includes(query);
        const categoryMatch = formatCategoryLabel(t.category).toLowerCase().includes(query);
        const shuttleBrandMatch = t.shuttlecockDetails?.brand?.toLowerCase().includes(query);
        const courtVenueMatch = t.courtDetails?.venueName?.toLowerCase().includes(query);

        return memberMatch || descMatch || categoryMatch || shuttleBrandMatch || courtVenueMatch;
      }

      return true;
    });
  }, [transactions, activeTab, selectedMonth, searchQuery]);

  const renderPaymentBadge = (method: string) => {
    switch (method) {
      case 'qris':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <QrCode className="w-3 h-3" /> QRIS
          </span>
        );
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <CreditCard className="w-3 h-3" /> Transfer
          </span>
        );
      case 'tunai':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Banknote className="w-3 h-3" /> Tunai
          </span>
        );
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header and Filter Controls */}
      <div className="p-4 sm:p-6 border-b border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>Buku Kas & Transaksi</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {filteredTransactions.length} Data
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Semua catatan pemasukan dan pengeluaran kas tim badminton
            </p>
          </div>

          {/* Quick Month Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Periode</option>
              {availableMonths.map((m) => {
                const [year, month] = m.split('-');
                const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('id-ID', {
                  month: 'long',
                  year: 'numeric',
                });
                return (
                  <option key={m} value={m}>
                    {monthName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua Transaksi
          </button>
          <button
            onClick={() => setActiveTab('masuk')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'masuk'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span>Uang Masuk (Iuran)</span>
          </button>
          <button
            onClick={() => setActiveTab('beli_kok')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'beli_kok'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <span>🏸 Beli Kok</span>
          </button>
          <button
            onClick={() => setActiveTab('sewa_lapangan')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'sewa_lapangan'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>🏟️ Sewa Lapangan</span>
          </button>
          <button
            onClick={() => setActiveTab('keluar_lain')}
            className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'keluar_lain'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pengeluaran Lainnya
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi berdasarkan nama member, merk kok, keperluan, atau catatan..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-gray-800 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Transaction List Body */}
      {filteredTransactions.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🏸</span>
          </div>
          <h3 className="text-base font-bold text-gray-800">Belum Ada Transaksi Ditemukan</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Tidak ada transaksi yang cocok dengan kata kunci pencarian Anda.'
              : 'Mulai catat uang masuk dari iuran atau pengeluaran kok untuk tim badminton Anda.'}
          </p>
          {!isPublicView && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => onOpenAddModal('masuk')}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                + Transaksi Masuk
              </button>
              <button
                onClick={() => onOpenAddModal('keluar')}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors"
              >
                - Transaksi Keluar
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredTransactions.map((t) => {
            const isMasuk = t.type === 'masuk';

            return (
              <div
                key={t.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left Side: Type Icon, Category & Details */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`p-3 rounded-2xl flex-shrink-0 mt-0.5 ${
                      isMasuk
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : t.category === 'beli_kok'
                        ? 'bg-rose-50 text-rose-600 border border-rose-100'
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}
                  >
                    {isMasuk ? (
                      <span className="text-lg">💰</span>
                    ) : t.category === 'beli_kok' ? (
                      <span className="text-lg">🏸</span>
                    ) : (
                      <span className="text-lg">🏟️</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">
                        {formatDisplayDate(t.date)}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isMasuk
                            ? 'bg-emerald-100/70 text-emerald-800'
                            : t.category === 'beli_kok'
                            ? 'bg-rose-100/70 text-rose-800'
                            : 'bg-amber-100/70 text-amber-800'
                        }`}
                      >
                        {formatCategoryLabel(t.category)}
                      </span>
                      {renderPaymentBadge(t.paymentMethod)}
                    </div>

                    {/* Member or Item Title */}
                    <h4 className="text-sm font-bold text-gray-900 mt-1 leading-snug">
                      {isMasuk ? (
                        <span>
                          {t.memberName || 'Member Kas'}
                          {t.description && (
                            <span className="font-normal text-gray-600 text-xs ml-1.5">
                              — {t.description}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>{t.description}</span>
                      )}
                    </h4>

                    {/* Sub-details (Shuttlecock or Court specific chips) */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
                      {t.shuttlecockDetails && t.shuttlecockDetails.tubesCount > 0 && (
                        <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                          🏸 {t.shuttlecockDetails.brand} ({t.shuttlecockDetails.tubesCount} Slop @ Rp {t.shuttlecockDetails.pricePerTube.toLocaleString('id-ID')})
                        </span>
                      )}

                      {t.courtDetails && t.courtDetails.venueName && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-medium text-[11px]">
                          🏟️ {t.courtDetails.venueName} • {t.courtDetails.durationHours} Jam (Lap. {t.courtDetails.courtNumber || '-'})
                        </span>
                      )}

                      <span className="text-[11px] text-gray-400">
                        Dicatat: {t.recordedBy || 'Bendahara'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Amount, Sync Status & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center pl-12 sm:pl-0 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                  <div className="text-right">
                    <div
                      className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                        isMasuk ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isMasuk ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Tercatat Kas</span>
                    </div>
                  </div>

                  {/* Actions for Treasurer */}
                  {!isPublicView && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(t)}
                        title="Edit Transaksi"
                        className="p-1.5 text-gray-400 hover:text-slate-800 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(t.id, t.description || t.memberName || 'transaksi')}
                        title="Hapus Transaksi"
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
