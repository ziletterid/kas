/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, X, Save, RefreshCw } from 'lucide-react';
import { BadmintonTeamConfig } from '../types';

interface TeamConfigModalProps {
  isOpen: boolean;
  config: BadmintonTeamConfig;
  onClose: () => void;
  onSave: (newConfig: BadmintonTeamConfig) => void;
  onResetData: () => void;
}

export const TeamConfigModal: React.FC<TeamConfigModalProps> = ({
  isOpen,
  config,
  onClose,
  onSave,
  onResetData,
}) => {
  const [teamName, setTeamName] = useState(config.teamName);
  const [homeCourt, setHomeCourt] = useState(config.homeCourt);
  const [scheduleDay, setScheduleDay] = useState(config.scheduleDay);
  const [monthlyFee, setMonthlyFee] = useState(config.monthlyFee);
  const [sessionFee, setSessionFee] = useState(config.sessionFee);
  const [defaultShuttleBrand, setDefaultShuttleBrand] = useState(config.defaultShuttleBrand);
  const [shuttleStock, setShuttleStock] = useState(config.shuttleStock);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      teamName: teamName.trim() || 'Tim Badminton',
      homeCourt: homeCourt.trim() || 'GOR Bulutangkis',
      scheduleDay: scheduleDay.trim() || 'Setiap Minggu',
      monthlyFee: Number(monthlyFee) || 100000,
      sessionFee: Number(sessionFee) || 35000,
      defaultShuttleBrand: defaultShuttleBrand.trim() || 'Samurai Hijau',
      shuttleStock: Number(shuttleStock) || 0,
      currency: 'IDR',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-6">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Pengaturan Tim & Kebijakan Kas</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nama Tim / Klub</label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Contoh: BJA Sports"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Homebase / Lokasi GOR Rutin
            </label>
            <input
              type="text"
              value={homeCourt}
              onChange={(e) => setHomeCourt(e.target.value)}
              placeholder="Contoh: GOR Champion (Lap. 1 & 2)"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Jadwal Main Rutin
            </label>
            <input
              type="text"
              value={scheduleDay}
              onChange={(e) => setScheduleDay(e.target.value)}
              placeholder="Contoh: Setiap Rabu (19:00-22:00) & Sabtu (16:00-19:00)"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tarif Iuran Bulanan (Rp)
              </label>
              <input
                type="number"
                step="5000"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold font-mono text-gray-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tarif Per Kedatangan (Rp)
              </label>
              <input
                type="number"
                step="5000"
                value={sessionFee}
                onChange={(e) => setSessionFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold font-mono text-gray-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Merk Kok Standar Tim
              </label>
              <input
                type="text"
                value={defaultShuttleBrand}
                onChange={(e) => setDefaultShuttleBrand(e.target.value)}
                placeholder="Contoh: Samurai Hijau Speed 77"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Stok Kok Saat Ini (Slop)
              </label>
              <input
                type="number"
                min="0"
                value={shuttleStock}
                onChange={(e) => setShuttleStock(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold font-mono text-gray-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onResetData}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              Reset Semua Data ke 0
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
