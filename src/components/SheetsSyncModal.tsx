/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  PlusCircle, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  Unlink,
  Copy,
  Check,
  Download,
  Code2,
  Sparkles,
  Zap
} from 'lucide-react';
import { SheetsConfig, BadmintonTeamConfig } from '../types';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../services/sheetsService';

interface SheetsSyncModalProps {
  isOpen: boolean;
  sheetsConfig: SheetsConfig;
  user: User | null;
  config: BadmintonTeamConfig;
  transactionsCount: number;
  membersCount: number;
  isSyncing: boolean;
  onClose: () => void;
  onLogin: () => void;
  onCreateNewSheet: () => void;
  onConnectExistingSheet: (idOrUrl: string) => void;
  onConnectWebhook: (url: string) => void;
  onExportCSV: () => void;
  onManualSync: () => void;
  onToggleAutoSync: (enabled: boolean) => void;
  onDisconnectSheet: () => void;
}

export const SheetsSyncModal: React.FC<SheetsSyncModalProps> = ({
  isOpen,
  sheetsConfig,
  user,
  config,
  transactionsCount,
  membersCount,
  isSyncing,
  onClose,
  onLogin,
  onCreateNewSheet,
  onConnectExistingSheet,
  onConnectWebhook,
  onExportCSV,
  onManualSync,
  onToggleAutoSync,
  onDisconnectSheet,
}) => {
  const [activeTab, setActiveTab] = useState<'webhook' | 'oauth' | 'csv'>('webhook');
  const [customSheetInput, setCustomSheetInput] = useState('');
  const [webhookInput, setWebhookInput] = useState(sheetsConfig.gasWebhookUrl || '');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);

  if (!isOpen) return null;

  const handleConnectExistingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSheetInput.trim()) return;
    onConnectExistingSheet(customSheetInput.trim());
    setCustomSheetInput('');
  };

  const handleWebhookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookInput.trim()) return;
    onConnectWebhook(webhookInput.trim());
  };

  const copyAppsScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const copySpreadsheetLink = () => {
    if (sheetsConfig.spreadsheetUrl) {
      navigator.clipboard.writeText(sheetsConfig.spreadsheetUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isConnected = sheetsConfig.isConfigured && (sheetsConfig.spreadsheetId || sheetsConfig.gasWebhookUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-6">
        {/* Modal Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Sinkronisasi Google Sheets</h3>
              <p className="text-xs text-emerald-300/80">
                Transparansi kas tim badminton BJA Sports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 100% Free / No Billing Notice Banner */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex items-center gap-2.5 text-xs text-emerald-900">
          <span className="flex-shrink-0 px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-600 text-white">
            100% GRATIS
          </span>
          <span className="leading-tight">
            <strong>Tanpa Billing &amp; Tanpa Kartu Kredit:</strong> Seluruh fitur sinkronisasi berjalan menggunakan kuota gratis Google tanpa dipungut biaya sepeser pun.
          </span>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Active Connection Status Card (If Connected) */}
          {isConnected && (
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Spreadsheet Terhubung &amp; Siap Pakai</span>
                  </div>
                  <div className="text-sm font-black text-gray-900">
                    {sheetsConfig.syncMethod === 'gas_webhook'
                      ? 'Terkoneksi via Google Apps Script (Tanpa Login)'
                      : sheetsConfig.spreadsheetTitle || 'Kas Badminton BJA Sports'}
                  </div>
                </div>

                {sheetsConfig.spreadsheetUrl && (
                  <a
                    href={sheetsConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    <span>Buka Sheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Sync Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Kirim Data Kas (Sinkronkan Sekarang)'}</span>
                </button>

                {sheetsConfig.spreadsheetUrl && (
                  <button
                    type="button"
                    onClick={copySpreadsheetLink}
                    className="p-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold"
                    title="Salin Link Spreadsheet"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onDisconnectSheet}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-gray-200"
                  title="Putuskan Sambungan"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              </div>

              {sheetsConfig.lastSyncedAt && (
                <div className="text-[11px] text-gray-500 text-right">
                  Terakhir sinkron: {new Date(sheetsConfig.lastSyncedAt).toLocaleString('id-ID')}
                </div>
              )}
            </div>
          )}

          {/* Integration Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-2xl text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('webhook')}
              className={`py-2 px-2 rounded-xl font-bold transition-all ${
                activeTab === 'webhook'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              1. Apps Script (Bebas Akun)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('oauth')}
              className={`py-2 px-2 rounded-xl font-bold transition-all ${
                activeTab === 'oauth'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              2. Google Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('csv')}
              className={`py-2 px-2 rounded-xl font-bold transition-all ${
                activeTab === 'csv'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              3. Unduh CSV
            </button>
          </div>

          {/* TAB 1: GOOGLE APPS SCRIPT WEBHOOK (100% Free, No Billing, No Login, Direct to Personal Sheet) */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>Metode Termudah &amp; Bebas Akun Cloud (Google Apps Script)</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Cukup buat Google Sheet kosong di Google Drive Anda, pasang script 1 kali, dan data kas tim BJA Sports akan langsung terisi otomatis ke lembar kerja tersebut.
                </p>

                {/* Steps Accordion */}
                <div className="bg-white p-3 rounded-xl border border-emerald-100 space-y-2 text-xs text-gray-700">
                  <div className="font-bold text-gray-800">Cara Pasang (Hanya 1 Menit):</div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-600">
                    <li>Buka Google Sheets baru di Google Drive Anda.</li>
                    <li>
                      Klik menu <strong>Ekstensi &gt; Apps Script</strong>.
                    </li>
                    <li>Hapus kode bawaan dan tempel kode script gratis di bawah ini.</li>
                    <li>
                      Klik <strong>Deploy &gt; New deployment &gt; Pilih Web App &gt; Who has access: Anyone</strong>.
                    </li>
                    <li>Salin <strong>Web App URL</strong> dan tempel di kotak bawah ini.</li>
                  </ol>

                  <div className="pt-1 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={copyAppsScript}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? 'Kode Tersalin!' : 'Salin Kode Apps Script'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowScriptCode(!showScriptCode)}
                      className="text-xs text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{showScriptCode ? 'Tutup Kode' : 'Lihat Kode'}</span>
                    </button>
                  </div>

                  {showScriptCode && (
                    <pre className="p-2 bg-slate-900 text-emerald-300 rounded-lg text-[10px] overflow-x-auto max-h-36 font-mono">
                      {GOOGLE_APPS_SCRIPT_TEMPLATE}
                    </pre>
                  )}
                </div>

                {/* Webhook Input Form */}
                <form onSubmit={handleWebhookSubmit} className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-gray-700">
                    Tempel Web App URL Google Script Anda di Sini:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={webhookInput}
                      onChange={(e) => setWebhookInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono text-gray-800 focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={isSyncing}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {isSyncing ? 'Menghubungkan...' : 'Simpan & Sinkronkan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE LOGIN (Standard Google Sheets API) */}
          {activeTab === 'oauth' && (
            <div className="space-y-4">
              {!user ? (
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Login dengan Akun Google Anda</h4>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      Layanan ini gratis dan tidak memungut biaya apapun. Akun Anda hanya digunakan untuk membuat lembar kerja kas di Google Drive Anda sendiri.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={onLogin}
                      className="flex items-center gap-2.5 bg-white text-gray-800 hover:bg-gray-50 font-bold px-4 py-2 rounded-xl text-xs border border-gray-300 shadow-sm transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Masuk dengan Google (Gratis)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="text-gray-600">Login sebagai: <strong>{user.email}</strong></span>
                    <span className="text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                      Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onCreateNewSheet}
                      disabled={isSyncing}
                      className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all text-left flex flex-col justify-between gap-2 shadow-xs"
                    >
                      <PlusCircle className="w-5 h-5 text-emerald-200" />
                      <div>
                        <div className="font-bold">Buat Sheet Baru Otomatis</div>
                        <div className="text-[10px] text-emerald-100 font-normal">Buat file "Kas Badminton - BJA Sports"</div>
                      </div>
                    </button>

                    <form onSubmit={handleConnectExistingSubmit} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                      <label className="block text-[11px] font-bold text-gray-700">
                        Atau Sambungkan URL Sheet:
                      </label>
                      <input
                        type="text"
                        value={customSheetInput}
                        onChange={(e) => setCustomSheetInput(e.target.value)}
                        placeholder="Tempel URL Spreadsheet..."
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs"
                      />
                      <button
                        type="submit"
                        className="w-full py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Hubungkan
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: UNDUH FILE CSV (100% Offline, no network requirement) */}
          {activeTab === 'csv' && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 text-center">
              <div className="w-10 h-10 bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center mx-auto">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800">Unduh Data Kas ke File CSV / Excel</h4>
                <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  Tidak ingin menghubungkan akun sama sekali? Anda dapat langsung mengunduh seluruh transaksi kas dan membuka filenya di Microsoft Excel atau Google Sheets kapan saja.
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={onExportCSV}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Kas (Kas_BJA_Sports.csv)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
