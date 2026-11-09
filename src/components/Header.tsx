/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { User } from 'firebase/auth';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  Eye, 
  Share2, 
  Settings, 
  LogOut, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { BadmintonTeamConfig, SheetsConfig } from '../types';

interface HeaderProps {
  config: BadmintonTeamConfig;
  sheetsConfig: SheetsConfig;
  user: User | null;
  isLoggingIn: boolean;
  isSyncing: boolean;
  isPublicView: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSheetsModal: () => void;
  onOpenWhatsAppModal: () => void;
  onOpenConfigModal: () => void;
  onTogglePublicView: () => void;
  onManualSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  sheetsConfig,
  user,
  isLoggingIn,
  isSyncing,
  isPublicView,
  onLogin,
  onLogout,
  onOpenSheetsModal,
  onOpenWhatsAppModal,
  onOpenConfigModal,
  onTogglePublicView,
  onManualSync,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-emerald-950/60 shadow-lg text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Team Details */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-lime-400 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <span className="text-2xl select-none" role="img" aria-label="shuttlecock">🏸</span>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate font-sans">
                  {config.teamName}
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Kas Transparan
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                <span>{config.homeCourt}</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400/90">{config.scheduleDay}</span>
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Google Sheets Status Pill */}
            <div className="hidden lg:flex items-center">
              {sheetsConfig.isConfigured && sheetsConfig.spreadsheetId ? (
                <div className="flex items-center gap-2 bg-slate-800/90 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Sheets Terhubung</span>
                  </div>

                  <button
                    onClick={onManualSync}
                    disabled={isSyncing}
                    title="Sinkronkan Sekarang"
                    className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700/60 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>

                  {sheetsConfig.spreadsheetUrl && (
                    <a
                      href={sheetsConfig.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Buka Spreadsheet di Tab Baru"
                      className="p-1 text-slate-400 hover:text-emerald-300 rounded-md hover:bg-slate-700/60 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenSheetsModal}
                  className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02]"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Hubungkan Sheets</span>
                </button>
              )}
            </div>

            {/* Quick Share / Rekap WhatsApp Button */}
            <button
              onClick={onOpenWhatsAppModal}
              title="Buat Rekap WhatsApp Kas Badminton"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-emerald-900/30 transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Rekap WA</span>
            </button>

            {/* Mode Transparansi Anggota Toggle */}
            <button
              onClick={onTogglePublicView}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                isPublicView
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Mode Tampilan Khusus Anggota (Hanya Lihat)"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">{isPublicView ? 'Mode Pengurus' : 'Mode Anggota'}</span>
            </button>

            {/* Settings (Pengaturan Tim) */}
            {!isPublicView && (
              <button
                onClick={onOpenConfigModal}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors"
                title="Pengaturan Klub & Tarif"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Google Authentication Control */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div 
                  onClick={onOpenSheetsModal}
                  className="flex items-center gap-2 cursor-pointer bg-slate-800/80 hover:bg-slate-800 py-1.5 px-2.5 rounded-xl border border-slate-700"
                  title={`Login sebagai: ${user.email}`}
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-6 h-6 rounded-full border border-emerald-400/40"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-[10px] font-bold flex items-center justify-center">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden xl:inline text-xs font-medium text-slate-200 max-w-[120px] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Keluar Google"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 bg-white text-gray-800 hover:bg-gray-100 font-semibold px-3 py-2 rounded-xl text-xs sm:text-sm border border-gray-200 shadow-sm transition-all active:scale-95 disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="hidden sm:inline">Google Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile sheets indicator banner */}
      <div className="lg:hidden bg-slate-950/80 px-4 py-1.5 border-t border-slate-800 text-[11px] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">
            {sheetsConfig.isConfigured ? 'Spreadsheet Terhubung' : 'Sheets Belum Terhubung'}
          </span>
        </div>
        <button
          onClick={onOpenSheetsModal}
          className="text-emerald-400 font-semibold hover:underline"
        >
          {sheetsConfig.isConfigured ? 'Kelola Sync' : 'Hubungkan'}
        </button>
      </div>
    </header>
  );
};
