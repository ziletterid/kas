/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Plus, 
  Minus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calculator,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Transaction, BadmintonTeamConfig } from '../types';

interface SummaryCardsProps {
  transactions: Transaction[];
  config: BadmintonTeamConfig;
  onOpenAddModal: (type: 'masuk' | 'keluar') => void;
  onOpenCalculator: () => void;
  onUpdateStock: (delta: number) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  transactions,
  config,
  onOpenAddModal,
  onOpenCalculator,
  onUpdateStock,
}) => {
  const totalMasuk = transactions
    .filter((t) => t.type === 'masuk')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalKeluar = transactions
    .filter((t) => t.type === 'keluar')
    .reduce((sum, t) => sum + t.amount, 0);

  const saldo = totalMasuk - totalKeluar;

  // Breakdown Uang Keluar
  const totalBeliKok = transactions
    .filter((t) => t.type === 'keluar' && t.category === 'beli_kok')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSewaLapangan = transactions
    .filter((t) => t.type === 'keluar' && t.category === 'sewa_lapangan')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSlopDibeli = transactions
    .filter((t) => t.type === 'keluar' && t.category === 'beli_kok')
    .reduce((acc, t) => acc + (t.shuttlecockDetails?.tubesCount || 0), 0);

  // Estimasi sesi tercover (asumsi 1 sesi butuh sewa ~200k + 1 slop kok ~125k = ~325k)
  const estimasiBiayaPerSesi = 325000;
  const estimasiSesiAman = Math.max(0, Math.floor(saldo / estimasiBiayaPerSesi));

  return (
    <div className="space-y-6">
      {/* Top Main Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Saldo Kas Bersih */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 sm:p-6 text-white border border-slate-700/60 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Total Saldo Kas Tim
            </span>
            <div className={`p-2.5 rounded-2xl ${saldo >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono text-white">
              Rp {saldo.toLocaleString('id-ID')}
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              {saldo >= 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Kas Sehat & Transparan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Saldo Kas Defisit
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Estimasi Dana Lapangan</span>
            <span className="font-semibold text-slate-200">~{estimasiSesiAman} Sesi Mabar</span>
          </div>

          {/* Decorative court net pattern */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Total Uang Masuk */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              Total Uang Masuk
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono text-gray-900">
              Rp {totalMasuk.toLocaleString('id-ID')}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Dari {transactions.filter((t) => t.type === 'masuk').length} transaksi iuran & donasi
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Tarif Member Rutin</span>
            <span className="font-semibold text-gray-800">Rp {config.monthlyFee.toLocaleString('id-ID')}/bln</span>
          </div>
        </div>

        {/* Card 3: Total Uang Keluar */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
              Total Uang Keluar
            </span>
            <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black tracking-tight font-mono text-rose-600">
              Rp {totalKeluar.toLocaleString('id-ID')}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span>Kok: Rp {totalBeliKok.toLocaleString('id-ID')}</span>
              <span>•</span>
              <span>Sewa: Rp {totalSewaLapangan.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Total Pengeluaran</span>
            <span className="font-semibold text-gray-800">{transactions.filter((t) => t.type === 'keluar').length} Bukti Catat</span>
          </div>
        </div>

        {/* Card 4: Sisa Stok Kok (Shuttlecock) */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/40 rounded-3xl p-5 sm:p-6 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-emerald-800 uppercase">
              Sisa Stok Kok Tim
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-black tracking-tight text-emerald-950 font-mono">
                {config.shuttleStock} <span className="text-lg font-bold text-emerald-700">Slop</span>
              </div>
              <p className="text-xs text-emerald-700 truncate max-w-[150px] mt-0.5">
                {config.defaultShuttleBrand}
              </p>
            </div>

            {/* Quick stock adjusters */}
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xs p-1 rounded-2xl border border-emerald-200 shadow-xs">
              <button
                onClick={() => onUpdateStock(-1)}
                title="Kurangi 1 Slop (Terpakai main)"
                className="w-7 h-7 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-sm transition-colors active:scale-90"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateStock(1)}
                title="Tambah 1 Slop Kok"
                className="w-7 h-7 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-sm transition-colors active:scale-90"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-800">
            <span>Riwayat Beli:</span>
            <span className="font-semibold">{totalSlopDibeli} Slop total</span>
          </div>
        </div>
      </div>

      {/* Action CTA Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span>Aksi Cepat Kas Lapangan:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Button Transaksi Masuk */}
          <button
            onClick={() => onOpenAddModal('masuk')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>+ Transaksi Masuk</span>
          </button>

          {/* Button Transaksi Keluar */}
          <button
            onClick={() => onOpenAddModal('keluar')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/20 transition-all active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>- Transaksi Keluar</span>
          </button>

          {/* Button Hitung Patungan Mabar */}
          <button
            onClick={onOpenCalculator}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all active:scale-95"
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Kalkulator Patungan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
