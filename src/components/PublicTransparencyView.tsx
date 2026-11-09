/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  FileSpreadsheet, 
  ExternalLink, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Package, 
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { Transaction, Member, BadmintonTeamConfig, SheetsConfig } from '../types';
import { formatCategoryLabel } from '../services/sheetsService';

interface PublicTransparencyViewProps {
  transactions: Transaction[];
  members: Member[];
  config: BadmintonTeamConfig;
  sheetsConfig: SheetsConfig;
  onExitPublicView: () => void;
}

export const PublicTransparencyView: React.FC<PublicTransparencyViewProps> = ({
  transactions,
  members,
  config,
  sheetsConfig,
  onExitPublicView,
}) => {
  const [memberSearch, setMemberSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'masuk' | 'beli_kok' | 'sewa_lapangan'>('all');

  const totalMasuk = transactions
    .filter((t) => t.type === 'masuk')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalKeluar = transactions
    .filter((t) => t.type === 'keluar')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldo = totalMasuk - totalKeluar;

  const totalSlopKok = transactions
    .filter((t) => t.type === 'keluar' && t.category === 'beli_kok')
    .reduce((acc, t) => acc + (t.shuttlecockDetails?.tubesCount || 0), 0);

  const filteredTransactions = transactions.filter((t) => {
    if (activeCategory === 'masuk' && t.type !== 'masuk') return false;
    if (activeCategory === 'beli_kok' && (t.type !== 'keluar' || t.category !== 'beli_kok')) return false;
    if (activeCategory === 'sewa_lapangan' && (t.type !== 'keluar' || t.category !== 'sewa_lapangan')) return false;

    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      const matchMember = t.memberName?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchCategory = formatCategoryLabel(t.category).toLowerCase().includes(q);
      return matchMember || matchDesc || matchCategory;
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner Transparansi Publik */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Portal Transparansi Kas Anggota (Read-Only)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-sans">
              Laporan Kas Tim {config.teamName}
            </h2>
            <p className="text-xs text-emerald-200/80 max-w-xl">
              Halaman ini terbuka untuk seluruh anggota tim memantau saldo kas, uang masuk iuran, serta pengeluaran kok & lapangan secara transparan dan akuntabel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {sheetsConfig.spreadsheetUrl && (
              <a
                href={sheetsConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Lihat di Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={onExitPublicView}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Mode Bendahara</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Saldo Kas Bersih
          </span>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-2">
            Rp {saldo.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-gray-400 mt-1">Tersedia untuk sesi mendatang</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Total Uang Masuk
          </span>
          <div className="text-2xl font-black font-mono text-gray-900 mt-2">
            Rp {totalMasuk.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-gray-400 mt-1">Iuran & donasi anggota</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Total Uang Keluar
          </span>
          <div className="text-2xl font-black font-mono text-rose-600 mt-2">
            Rp {totalKeluar.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-gray-400 mt-1">Kok, lapangan & operasional</p>
        </div>

        <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Sisa Stok Kok Tim
          </span>
          <div className="text-2xl font-black font-mono text-emerald-950 mt-2">
            {config.shuttleStock} <span className="text-base font-bold text-emerald-700">Slop</span>
          </div>
          <p className="text-xs text-emerald-700 mt-1 truncate">{config.defaultShuttleBrand}</p>
        </div>
      </div>

      {/* Member Self-Check Search */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Cek Catatan Iuran & Pengeluaran Anda</h3>
            <p className="text-xs text-gray-500">
              Ketik nama Anda untuk memeriksa riwayat iuran atau cari nota pembelian kok
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Ketik nama Anda (e.g. Budi, Hendra)..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua ({filteredTransactions.length})
          </button>
          <button
            onClick={() => setActiveCategory('masuk')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeCategory === 'masuk'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Uang Masuk (Iuran)
          </button>
          <button
            onClick={() => setActiveCategory('beli_kok')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeCategory === 'beli_kok'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            🏸 Beli Kok
          </button>
          <button
            onClick={() => setActiveCategory('sewa_lapangan')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeCategory === 'sewa_lapangan'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            🏟️ Sewa Lapangan
          </button>
        </div>

        {/* Transactions Table for Member Transparency */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
              <tr>
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Keterangan / Nama Member</th>
                <th className="py-3 px-3">Rincian Khusus</th>
                <th className="py-3 px-3 text-right">Nominal</th>
                <th className="py-3 px-3">Metode</th>
                <th className="py-3 px-3">Dicatat Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.map((t) => {
                const isMasuk = t.type === 'masuk';
                return (
                  <tr key={t.id} className="hover:bg-gray-50/70">
                    <td className="py-3 px-3 font-medium text-gray-700 whitespace-nowrap">
                      {t.date}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          isMasuk
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.category === 'beli_kok'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {formatCategoryLabel(t.category)}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-900">
                      {isMasuk ? (
                        <span>
                          {t.memberName}
                          {t.description && (
                            <span className="text-gray-500 font-normal ml-1">
                              ({t.description})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span>{t.description}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {t.shuttlecockDetails ? (
                        <span>
                          🏸 {t.shuttlecockDetails.brand} ({t.shuttlecockDetails.tubesCount} slop @ Rp {t.shuttlecockDetails.pricePerTube.toLocaleString('id-ID')})
                        </span>
                      ) : t.courtDetails ? (
                        <span>
                          🏟️ {t.courtDetails.venueName} ({t.courtDetails.durationHours} Jam, Lap. {t.courtDetails.courtNumber || '-'})
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-bold font-mono whitespace-nowrap ${
                        isMasuk ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isMasuk ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 uppercase text-[10px] font-semibold text-gray-500">
                      {t.paymentMethod}
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-[11px]">
                      {t.recordedBy || 'Bendahara'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
