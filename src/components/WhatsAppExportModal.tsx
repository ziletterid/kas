/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  MessageCircle, 
  X, 
  FileSpreadsheet, 
  Send
} from 'lucide-react';
import { Transaction, Member, BadmintonTeamConfig, SheetsConfig } from '../types';

interface WhatsAppExportModalProps {
  isOpen: boolean;
  transactions: Transaction[];
  members: Member[];
  config: BadmintonTeamConfig;
  sheetsConfig: SheetsConfig;
  onClose: () => void;
}

export const WhatsAppExportModal: React.FC<WhatsAppExportModalProps> = ({
  isOpen,
  transactions,
  members,
  config,
  sheetsConfig,
  onClose,
}) => {
  const [periodType, setPeriodType] = useState<'bulan_ini' | 'semua'>('bulan_ini');
  const [includeMemberList, setIncludeMemberList] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const activeTransactions = useMemo(() => {
    if (periodType === 'bulan_ini') {
      return transactions.filter((t) => t.date.startsWith(currentMonthKey));
    }
    return transactions;
  }, [transactions, periodType, currentMonthKey]);

  const totalMasuk = activeTransactions
    .filter((t) => t.type === 'masuk')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalKeluar = activeTransactions
    .filter((t) => t.type === 'keluar')
    .reduce((sum, t) => sum + t.amount, 0);

  // Overall saldo
  const overallSaldo = transactions
    .filter((t) => t.type === 'masuk')
    .reduce((sum, t) => sum + t.amount, 0) -
    transactions
      .filter((t) => t.type === 'keluar')
      .reduce((sum, t) => sum + t.amount, 0);

  // Beli kok breakdown
  const kokTransactions = activeTransactions.filter(
    (t) => t.type === 'keluar' && t.category === 'beli_kok'
  );
  const totalSlop = kokTransactions.reduce(
    (acc, t) => acc + (t.shuttlecockDetails?.tubesCount || 0),
    0
  );

  // Sewa lapangan breakdown
  const sewaTransactions = activeTransactions.filter(
    (t) => t.type === 'keluar' && t.category === 'sewa_lapangan'
  );

  // Member payments
  const membersPaid = members.filter((m) => {
    return activeTransactions.some(
      (t) =>
        t.type === 'masuk' &&
        (t.memberId === m.id || t.memberName?.toLowerCase() === m.name.toLowerCase())
    );
  });

  const membersUnpaid = members.filter(
    (m) => m.isActive && m.type === 'tetap' && !membersPaid.some((p) => p.id === m.id)
  );

  const messageText = useMemo(() => {
    let text = `🏸 *LAPORAN KAS TRANSPARAN ${config.teamName.toUpperCase()}* 🏸\n`;
    text += `📅 Periode: *${periodType === 'bulan_ini' ? currentMonthName : 'Rekap Kumulatif'}*\n`;
    text += `🏟️ Homebase: ${config.homeCourt}\n`;
    text += `─────────────────────────\n\n`;

    text += `💰 *RINGKASAN KEUANGAN:*\n`;
    text += `• Total Saldo Kas Saat Ini: *Rp ${overallSaldo.toLocaleString('id-ID')}*\n`;
    text += `• Pemasukan (${periodType === 'bulan_ini' ? 'Bulan Ini' : 'Total'}): Rp ${totalMasuk.toLocaleString('id-ID')}\n`;
    text += `• Pengeluaran (${periodType === 'bulan_ini' ? 'Bulan Ini' : 'Total'}): Rp ${totalKeluar.toLocaleString('id-ID')}\n\n`;

    text += `🏸 *LOGISTIK KOK & LAPANGAN:*\n`;
    text += `• Sisa Stok Kok Pengurus: *${config.shuttleStock} Slop* (${config.defaultShuttleBrand})\n`;
    if (totalSlop > 0) {
      text += `• Kok Dibeli Periode Ini: ${totalSlop} Slop\n`;
    }
    if (sewaTransactions.length > 0) {
      text += `• Sewa Lapangan Tercatat: ${sewaTransactions.length} kali main\n`;
    }
    text += `\n`;

    if (includeMemberList) {
      text += `👥 *STATUS IURAN MEMBER TETAP:*\n`;
      text += `✅ *Sudah Masuk (${membersPaid.length}):*\n`;
      if (membersPaid.length > 0) {
        membersPaid.forEach((m, idx) => {
          text += `  ${idx + 1}. ${m.name}\n`;
        });
      } else {
        text += `  (Belum ada catatan iuran masuk)\n`;
      }

      if (membersUnpaid.length > 0) {
        text += `\n⏳ *Belum Masuk (${membersUnpaid.length}):*\n`;
        membersUnpaid.forEach((m, idx) => {
          text += `  ${idx + 1}. ${m.name}\n`;
        });
      }
      text += `\n`;
    }

    if (sheetsConfig.spreadsheetUrl) {
      text += `📊 *PANTISIPASI & CEK SPREADSHEET REAL-TIME:*\n`;
      text += `${sheetsConfig.spreadsheetUrl}\n\n`;
    }

    text += `_Terima kasih atas kekompakan & sportivitas seluruh anggota! Salam Smash!_ 🏸💥`;

    return text;
  }, [
    config,
    periodType,
    currentMonthName,
    overallSaldo,
    totalMasuk,
    totalKeluar,
    totalSlop,
    sewaTransactions,
    includeMemberList,
    membersPaid,
    membersUnpaid,
    sheetsConfig,
  ]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendToWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-6">
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Bagikan Rekap Kas ke Grup WhatsApp</h3>
          </div>
          <button onClick={onClose} className="p-1 text-emerald-200 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-700">Periode:</span>
              <button
                type="button"
                onClick={() => setPeriodType('bulan_ini')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  periodType === 'bulan_ini'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-gray-600'
                }`}
              >
                Bulan Ini ({currentMonthName})
              </button>
              <button
                type="button"
                onClick={() => setPeriodType('semua')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  periodType === 'semua'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-gray-600'
                }`}
              >
                Semua Riwayat
              </button>
            </div>

            <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMemberList}
                onChange={(e) => setIncludeMemberList(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm"
              />
              <span>Sertakan Daftar Member</span>
            </label>
          </div>

          {/* Preview Box */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Pratinjau Pesan WhatsApp:
            </label>
            <div className="bg-emerald-950 text-emerald-100 p-4 rounded-2xl font-mono text-xs whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed border border-emerald-800 selection:bg-emerald-500 selection:text-white">
              {messageText}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={handleSendToWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Buka & Kirim Langsung ke WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
