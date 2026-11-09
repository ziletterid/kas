/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calculator, 
  X, 
  Copy, 
  Check, 
  Share2, 
  PlusCircle, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { BadmintonTeamConfig } from '../types';

interface MabarCalculatorProps {
  isOpen: boolean;
  config: BadmintonTeamConfig;
  onClose: () => void;
  onSaveToLedger?: (courtCost: number, shuttleCost: number, otherCost: number, players: number, perPlayer: number) => void;
}

export const MabarCalculator: React.FC<MabarCalculatorProps> = ({
  isOpen,
  config,
  onClose,
  onSaveToLedger,
}) => {
  const [courtCost, setCourtCost] = useState<number>(140000); // 2 jam @ 70k
  const [shuttleTubes, setShuttleTubes] = useState<number>(2);
  const [shuttlePrice, setShuttlePrice] = useState<number>(125000);
  const [otherCost, setOtherCost] = useState<number>(35000); // galon + es
  const [playersCount, setPlayersCount] = useState<number>(8);
  const [roundToFiveThousand, setRoundToFiveThousand] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalShuttleCost = shuttleTubes * shuttlePrice;
  const grandTotal = courtCost + totalShuttleCost + otherCost;
  const rawCostPerPlayer = playersCount > 0 ? Math.ceil(grandTotal / playersCount) : 0;

  // Round up to nearest 1.000 or 5.000 for realistic cash handling
  const finalCostPerPlayer = roundToFiveThousand
    ? Math.ceil(rawCostPerPlayer / 5000) * 5000
    : Math.ceil(rawCostPerPlayer / 1000) * 1000;

  const totalCollectedIfAllPay = finalCostPerPlayer * playersCount;
  const surplusToKas = totalCollectedIfAllPay - grandTotal;

  const generateWhatsAppShare = () => {
    const text = `🏸 *HITUNGAN PATUNGAN MABAR BADMINTON* 🏸
*Tim: ${config.teamName}*
Tanggal: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}

📋 *Rincian Pengeluaran Sesi:*
• Sewa Lapangan: Rp ${courtCost.toLocaleString('id-ID')}
• Kok (${shuttleTubes} Slop @ Rp ${shuttlePrice.toLocaleString('id-ID')}): Rp ${totalShuttleCost.toLocaleString('id-ID')}
• Minum / Kebutuhan Lain: Rp ${otherCost.toLocaleString('id-ID')}
─────────────────────
💰 *Total Biaya Sesi:* Rp ${grandTotal.toLocaleString('id-ID')}
👥 *Jumlah Pemain Hadir:* ${playersCount} Orang

👉 *Patungan per Orang:* *Rp ${finalCostPerPlayer.toLocaleString('id-ID')}*
${surplusToKas > 0 ? `*(Sisa Rp ${surplusToKas.toLocaleString('id-ID')} dimasukkan ke Kas Tim)*\n` : ''}
Bisa langsung transfer atau bayar tunai ke bendahara yaa. Terima kasih! 🏸`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-6">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Kalkulator Patungan Mabar Badminton</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <p className="text-xs text-gray-500">
            Hitung biaya patungan per pemain untuk sesi latihan/mabar secara adil dan transparan.
          </p>

          <div className="space-y-3">
            {/* Sewa Lapangan */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Biaya Sewa Lapangan (Rp)
              </label>
              <input
                type="number"
                step="5000"
                value={courtCost}
                onChange={(e) => setCourtCost(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold font-mono text-gray-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Pemakaian Kok */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kok Terpakai (Slop)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={shuttleTubes}
                  onChange={(e) => setShuttleTubes(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Harga per Slop (Rp)
                </label>
                <input
                  type="number"
                  step="5000"
                  value={shuttlePrice}
                  onChange={(e) => setShuttlePrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold font-mono text-gray-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Minuman / Konsumsi */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Biaya Minuman / Es / Lain-lain (Rp)
              </label>
              <input
                type="number"
                step="1000"
                value={otherCost}
                onChange={(e) => setOtherCost(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold font-mono text-gray-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Jumlah Pemain */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Jumlah Pemain yang Hadir
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={playersCount}
                  onChange={(e) => setPlayersCount(Number(e.target.value))}
                  className="w-32 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-black text-gray-900 focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex gap-1.5">
                  {[6, 8, 10, 12].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setPlayersCount(cnt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        playersCount === cnt
                          ? 'bg-slate-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cnt} org
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Opsi Pembulatan */}
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={roundToFiveThousand}
                onChange={(e) => setRoundToFiveThousand(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm"
              />
              <span>Bulatkan ke kelipatan Rp 5.000 terdekat (agar uang pas/mudah)</span>
            </label>
          </div>

          {/* Result Box */}
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between text-xs text-emerald-300">
              <span>Total Biaya Pengeluaran Sesi:</span>
              <span className="font-mono font-bold text-white text-sm">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="pt-2 border-t border-emerald-800/80 flex items-baseline justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
                  Patungan per Orang
                </span>
                <div className="text-3xl font-black font-mono text-white mt-0.5">
                  Rp {finalCostPerPlayer.toLocaleString('id-ID')}
                </div>
              </div>
              <span className="text-xs text-emerald-200/80 bg-emerald-800/50 px-2.5 py-1 rounded-lg">
                ÷ {playersCount} Pemain
              </span>
            </div>

            {surplusToKas > 0 && (
              <p className="text-[11px] text-emerald-300/80">
                💡 Ada selisih pembulatan +Rp {surplusToKas.toLocaleString('id-ID')} yang bisa masuk saldo kas tim.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              onClick={generateWhatsAppShare}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-emerald-700/20"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Format Rekap WhatsApp'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
