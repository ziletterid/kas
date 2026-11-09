/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from './firebase';
import { 
  Transaction, 
  Member, 
  BadmintonTeamConfig, 
  SheetsConfig, 
  TransactionType 
} from './types';
import { 
  getStoredTransactions, 
  saveStoredTransactions,
  getStoredMembers,
  saveStoredMembers,
  getStoredTeamConfig,
  saveStoredTeamConfig,
  getStoredSheetsConfig,
  saveStoredSheetsConfig,
  DEFAULT_CONFIG,
  DEFAULT_MEMBERS,
  DEFAULT_TRANSACTIONS
} from './services/storageService';
import { 
  createBadmintonSpreadsheet, 
  syncAllToSheets, 
  appendTransactionToSheets, 
  verifySpreadsheetAccess, 
  extractSpreadsheetId,
  syncViaGasWebhook,
  exportToCSV
} from './services/sheetsService';

// UI Components
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { TransactionList } from './components/TransactionList';
import { MemberManager } from './components/MemberManager';
import { AddTransactionModal } from './components/AddTransactionModal';
import { MabarCalculator } from './components/MabarCalculator';
import { SheetsSyncModal } from './components/SheetsSyncModal';
import { WhatsAppExportModal } from './components/WhatsAppExportModal';
import { TeamConfigModal } from './components/TeamConfigModal';
import { PublicTransparencyView } from './components/PublicTransparencyView';
import { ConfirmDialog } from './components/ConfirmDialog';
import { 
  Wallet, 
  Users, 
  Calculator, 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export default function App() {
  // Core Data (Starts at 0)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      localStorage.removeItem('smashledger_transactions_v1');
      localStorage.removeItem('smashledger_members_v1');
      localStorage.removeItem('smashledger_team_config_v1');
    } catch {}
    return getStoredTransactions();
  });
  const [members, setMembers] = useState<Member[]>(getStoredMembers);
  const [config, setConfig] = useState<BadmintonTeamConfig>(getStoredTeamConfig);
  const [sheetsConfig, setSheetsConfig] = useState<SheetsConfig>(getStoredSheetsConfig);

  // Authentication & Sync State
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // View & Navigation
  const [activeNav, setActiveNav] = useState<'transaksi' | 'anggota' | 'kalkulator'>('transaksi');
  const [isPublicView, setIsPublicView] = useState<boolean>(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addModalType, setAddModalType] = useState<TransactionType>('masuk');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  // Confirmation Dialog
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Show temporary toast notification
  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Save changes locally whenever data changes
  useEffect(() => {
    saveStoredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveStoredMembers(members);
  }, [members]);

  useEffect(() => {
    saveStoredTeamConfig(config);
  }, [config]);

  useEffect(() => {
    saveStoredSheetsConfig(sheetsConfig);
  }, [sheetsConfig]);

  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        showToast(`Berhasil login sebagai ${result.user.displayName || result.user.email}!`, 'success');
      }
    } catch (err: any) {
      console.error('Google Sign-in failed', err);
      showToast(err.message || 'Gagal login dengan akun Google.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google Logout Handler
  const handleGoogleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      showToast('Berhasil keluar dari akun Google.', 'info');
    } catch (err: any) {
      console.error('Logout error', err);
    }
  };

  // Manual or Auto Sync to Google Sheets (Supports both 100% Free Webhook and OAuth)
  const performSyncToSheets = useCallback(
    async (tokenToUse?: string, targetSheetId?: string) => {
      // 1. If using Google Apps Script Webhook (100% Free, No login/billing)
      if (sheetsConfig.syncMethod === 'gas_webhook' && sheetsConfig.gasWebhookUrl) {
        setIsSyncing(true);
        try {
          await syncViaGasWebhook(sheetsConfig.gasWebhookUrl, transactions, members, config);
          const now = new Date().toISOString();
          setSheetsConfig((prev) => ({
            ...prev,
            lastSyncedAt: now,
            isConfigured: true,
          }));
          showToast('Data kas BJA Sports berhasil dikirim ke Google Sheets (100% Gratis)! 🏸', 'success');
          try {
            confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
          } catch {}
        } catch (err: any) {
          showToast(`Gagal menyinkronkan: ${err.message}`, 'error');
        } finally {
          setIsSyncing(false);
        }
        return;
      }

      // 2. Otherwise Google OAuth Direct
      const currentToken = tokenToUse || accessToken || (await getAccessToken());
      const currentSheetId = targetSheetId || sheetsConfig.spreadsheetId;

      if (!currentToken) {
        showToast('Silakan pilih metode sinkronisasi (Apps Script atau Google Login).', 'info');
        setIsSheetsModalOpen(true);
        return;
      }

      if (!currentSheetId) {
        showToast('Spreadsheet belum dipilih atau dihubungkan.', 'info');
        setIsSheetsModalOpen(true);
        return;
      }

      setIsSyncing(true);
      try {
        await syncAllToSheets(currentToken, currentSheetId, transactions, members, config);

        const now = new Date().toISOString();
        setSheetsConfig((prev) => ({
          ...prev,
          lastSyncedAt: now,
          isConfigured: true,
        }));

        showToast('Data kas berhasil disinkronkan ke Google Sheets! 🏸', 'success');

        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.8 },
          });
        } catch {}
      } catch (err: any) {
        console.error('Sync failed:', err);
        showToast(`Gagal menyinkronkan: ${err.message}`, 'error');
      } finally {
        setIsSyncing(false);
      }
    },
    [accessToken, sheetsConfig, transactions, members, config, showToast]
  );

  // Create brand new Badminton Spreadsheet
  const handleCreateNewSheet = async () => {
    let currentToken = accessToken || (await getAccessToken());
    if (!currentToken) {
      await handleGoogleLogin();
      currentToken = await getAccessToken();
      if (!currentToken) return;
    }

    setIsSyncing(true);
    try {
      const res = await createBadmintonSpreadsheet(currentToken, config.teamName);
      
      const newConfig: SheetsConfig = {
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        spreadsheetTitle: res.title,
        autoSync: true,
        lastSyncedAt: new Date().toISOString(),
        isConfigured: true,
      };

      setSheetsConfig(newConfig);

      // Perform initial push
      await syncAllToSheets(currentToken, res.spreadsheetId, transactions, members, config);

      showToast(`Spreadsheet "${res.title}" berhasil dibuat dan disinkronkan!`, 'success');

      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err: any) {
      console.error('Failed to create spreadsheet', err);
      showToast(`Gagal membuat spreadsheet: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect existing spreadsheet by URL or ID
  const handleConnectExistingSheet = async (idOrUrl: string) => {
    let currentToken = accessToken || (await getAccessToken());
    if (!currentToken) {
      await handleGoogleLogin();
      currentToken = await getAccessToken();
      if (!currentToken) return;
    }

    const cleanId = extractSpreadsheetId(idOrUrl);
    if (!cleanId) {
      showToast('URL atau ID Spreadsheet tidak valid.', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      const verified = await verifySpreadsheetAccess(currentToken, cleanId);

      const newConfig: SheetsConfig = {
        spreadsheetId: cleanId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
        spreadsheetTitle: verified.title,
        autoSync: true,
        lastSyncedAt: new Date().toISOString(),
        isConfigured: true,
      };

      setSheetsConfig(newConfig);

      // Push current data into the connected spreadsheet
      await syncAllToSheets(currentToken, cleanId, transactions, members, config);

      showToast(`Spreadsheet "${verified.title}" berhasil dihubungkan!`, 'success');
    } catch (err: any) {
      console.error('Failed to connect existing sheet', err);
      showToast(`Gagal menghubungkan spreadsheet: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect Google Apps Script Webhook (100% Free, no billing, no cloud console)
  const handleConnectWebhook = async (url: string) => {
    setIsSyncing(true);
    try {
      await syncViaGasWebhook(url, transactions, members, config);

      const newConfig: SheetsConfig = {
        ...sheetsConfig,
        gasWebhookUrl: url,
        syncMethod: 'gas_webhook',
        spreadsheetTitle: 'Google Sheet BJA Sports (Apps Script Webhook)',
        autoSync: true,
        lastSyncedAt: new Date().toISOString(),
        isConfigured: true,
      };

      setSheetsConfig(newConfig);
      showToast('Berhasil terhubung ke Google Sheet via Apps Script (100% Bebas Biaya)! 🏸', 'success');

      try {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err: any) {
      console.error('Failed to connect webhook', err);
      showToast(`Gagal sinkron via Webhook: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Export to CSV directly (100% Offline, no account required)
  const handleExportCSV = () => {
    exportToCSV(transactions, config.teamName);
    showToast('File CSV Kas BJA Sports berhasil diunduh.', 'success');
  };

  // Disconnect spreadsheet
  const handleDisconnectSheet = () => {
    setConfirmState({
      isOpen: true,
      title: 'Putuskan Sambungan Google Sheets?',
      message:
        'Aplikasi tidak akan lagi menyinkronkan data kas ke spreadsheet tersebut secara otomatis. Data lokal Anda tetap aman.',
      confirmLabel: 'Putuskan',
      isDestructive: false,
      onConfirm: () => {
        setSheetsConfig({
          spreadsheetId: null,
          spreadsheetUrl: null,
          spreadsheetTitle: 'Kas Badminton Team',
          autoSync: true,
          lastSyncedAt: null,
          isConfigured: false,
        });
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        showToast('Sambungan Google Sheets diputuskan.', 'info');
      },
    });
  };

  // Save Transaction (Add or Edit)
  const handleSaveTransaction = async (
    transactionData: Partial<Transaction>,
    shouldAddShuttleStock: number = 0
  ) => {
    let updatedTransactions: Transaction[];

    if (editingTransaction) {
      // Edit
      updatedTransactions = transactions.map((t) =>
        t.id === editingTransaction.id ? ({ ...t, ...transactionData } as Transaction) : t
      );
      showToast('Transaksi berhasil diperbarui.', 'success');
    } else {
      // New
      const newTrx = transactionData as Transaction;
      updatedTransactions = [newTrx, ...transactions];
      showToast('Transaksi kas baru berhasil dicatat!', 'success');

      // Update shuttle stock if requested
      if (shouldAddShuttleStock > 0) {
        setConfig((prev) => ({
          ...prev,
          shuttleStock: prev.shuttleStock + shouldAddShuttleStock,
        }));
      }

      // Confetti for new entry celebration
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.8 },
        });
      } catch {}

      // Try appending directly to sheet if connected
      const currentToken = accessToken || (await getAccessToken());
      if (sheetsConfig.isConfigured && sheetsConfig.spreadsheetId && sheetsConfig.autoSync && currentToken) {
        appendTransactionToSheets(currentToken, sheetsConfig.spreadsheetId, newTrx).catch((e) => {
          console.warn('Background append failed, full sync will recover:', e);
        });
      }
    }

    setTransactions(updatedTransactions);
    setEditingTransaction(null);

    // If autoSync is enabled and connected, trigger full sync in background
    if (sheetsConfig.isConfigured && sheetsConfig.spreadsheetId && sheetsConfig.autoSync) {
      performSyncToSheets();
    }
  };

  // Delete Transaction with Mandatory Confirmation
  const handleDeleteTransaction = (id: string, description: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Catatan Transaksi?',
      message: `Apakah Anda yakin ingin menghapus transaksi "${description}"? Tindakan ini akan memperbarui saldo kas dan tidak dapat dibatalkan.`,
      confirmLabel: 'Hapus Transaksi',
      isDestructive: true,
      onConfirm: () => {
        const remaining = transactions.filter((t) => t.id !== id);
        setTransactions(remaining);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        showToast('Transaksi telah dihapus.', 'info');

        if (sheetsConfig.isConfigured && sheetsConfig.spreadsheetId && sheetsConfig.autoSync) {
          performSyncToSheets();
        }
      },
    });
  };

  // Stock Quick Adjuster
  const handleUpdateStock = (delta: number) => {
    setConfig((prev) => {
      const nextStock = Math.max(0, prev.shuttleStock + delta);
      return { ...prev, shuttleStock: nextStock };
    });
    showToast(
      delta > 0
        ? `Stok kok ditambah +${delta} slop.`
        : `Stok kok dikurangi ${delta} slop (terpakai sesi).`,
      'info'
    );
  };

  // Member management handlers
  const handleAddMember = (memberData: Omit<Member, 'id'>) => {
    const newMember: Member = {
      ...memberData,
      id: `mem-${Date.now()}`,
    };
    setMembers((prev) => [...prev, newMember]);
    showToast(`Anggota "${newMember.name}" berhasil ditambahkan!`, 'success');

    if (sheetsConfig.isConfigured && sheetsConfig.spreadsheetId && sheetsConfig.autoSync) {
      performSyncToSheets();
    }
  };

  const handleQuickAddMember = async (name: string, phone: string): Promise<string> => {
    const id = `mem-${Date.now()}`;
    const newMember: Member = {
      id,
      name,
      phone,
      type: 'tetap',
      joinedDate: new Date().toISOString().split('T')[0],
      isActive: true,
    };
    setMembers((prev) => [...prev, newMember]);
    return id;
  };

  const handleUpdateMember = (id: string, memberData: Partial<Member>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...memberData } : m))
    );
    showToast('Data anggota berhasil diperbarui.', 'success');
  };

  const handleDeleteMember = (id: string, name: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Hapus Anggota Tim?',
      message: `Hapus anggota "${name}" dari daftar tim badminton? Riwayat transaksi iuran sebelumnya akan tetap tersimpan di kas.`,
      confirmLabel: 'Hapus Anggota',
      isDestructive: true,
      onConfirm: () => {
        setMembers((prev) => prev.filter((m) => m.id !== id));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        showToast(`Anggota "${name}" telah dihapus.`, 'info');
      },
    });
  };

  // Quick Pay from Member List
  const handleQuickPayFromMember = (member: Member) => {
    setEditingTransaction(null);
    setAddModalType('masuk');
    setIsAddModalOpen(true);
  };

  // Reset all data to 0
  const handleResetData = () => {
    setConfirmState({
      isOpen: true,
      title: 'Reset Semua Data Kas ke 0?',
      message: 'Ini akan mengosongkan seluruh riwayat transaksi kas, anggota, dan menyetel saldo serta stok kok ke 0 agar Anda dapat memulai pencatatan baru yang bersih.',
      confirmLabel: 'Reset Semua ke 0',
      isDestructive: true,
      onConfirm: () => {
        setTransactions([]);
        setMembers([]);
        setConfig((prev) => ({
          ...prev,
          shuttleStock: 0,
        }));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        setIsConfigModalOpen(false);
        showToast('Semua data kas berhasil di-reset ke 0.', 'info');

        if (sheetsConfig.isConfigured && sheetsConfig.spreadsheetId && sheetsConfig.autoSync) {
          performSyncToSheets();
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 animate-in slide-in-from-top-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        config={config}
        sheetsConfig={sheetsConfig}
        user={user}
        isLoggingIn={isLoggingIn}
        isSyncing={isSyncing}
        isPublicView={isPublicView}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        onTogglePublicView={() => setIsPublicView(!isPublicView)}
        onManualSync={() => performSyncToSheets()}
      />

      {/* App Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* PUBLIC TRANSPARENCY VIEW */}
        {isPublicView ? (
          <PublicTransparencyView
            transactions={transactions}
            members={members}
            config={config}
            sheetsConfig={sheetsConfig}
            onExitPublicView={() => setIsPublicView(false)}
          />
        ) : (
          /* TREASURER / ADMIN DASHBOARD VIEW */
          <div className="space-y-6">
            {/* Summary & KPI Cards */}
            <SummaryCards
              transactions={transactions}
              config={config}
              onOpenAddModal={(type) => {
                setEditingTransaction(null);
                setAddModalType(type);
                setIsAddModalOpen(true);
              }}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
              onUpdateStock={handleUpdateStock}
            />

            {/* Navigation Tabs (Transaksi Kas vs Anggota) */}
            <div className="flex items-center gap-2 border-b border-gray-200/80 pb-1">
              <button
                onClick={() => setActiveNav('transaksi')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  activeNav === 'transaksi'
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Buku Kas & Transaksi</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-mono">
                  {transactions.length}
                </span>
              </button>

              <button
                onClick={() => setActiveNav('anggota')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  activeNav === 'anggota'
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span>Daftar Anggota & Iuran</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500 text-white font-mono">
                  {members.length}
                </span>
              </button>

              <button
                onClick={() => setIsCalculatorOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-900 hover:bg-white transition-all ml-auto"
              >
                <Calculator className="w-4 h-4 text-amber-500" />
                <span>Kalkulator Mabar</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeNav === 'transaksi' ? (
              <TransactionList
                transactions={transactions}
                isPublicView={false}
                onEdit={(t) => {
                  setEditingTransaction(t);
                  setAddModalType(t.type);
                  setIsAddModalOpen(true);
                }}
                onDelete={handleDeleteTransaction}
                onOpenAddModal={(type) => {
                  setEditingTransaction(null);
                  setAddModalType(type);
                  setIsAddModalOpen(true);
                }}
              />
            ) : (
              <MemberManager
                members={members}
                transactions={transactions}
                config={config}
                isPublicView={false}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                onQuickPay={handleQuickPayFromMember}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-gray-200/80 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span role="img" aria-label="badminton">🏸</span>
            <span>{config.teamName} — Transparansi Kas Badminton & Real-Time Google Sheets</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            {sheetsConfig.isConfigured && sheetsConfig.spreadsheetUrl && (
              <a
                href={sheetsConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Lihat Google Spreadsheet</span>
              </a>
            )}
            <span>Diperbarui secara real-time</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* 1. Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        initialType={addModalType}
        editingTransaction={editingTransaction}
        members={members}
        config={config}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        onAddMemberQuick={handleQuickAddMember}
      />

      {/* 2. Mabar Calculator Modal */}
      <MabarCalculator
        isOpen={isCalculatorOpen}
        config={config}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* 3. Google Sheets Real-Time Sync Modal */}
      <SheetsSyncModal
        isOpen={isSheetsModalOpen}
        sheetsConfig={sheetsConfig}
        user={user}
        config={config}
        transactionsCount={transactions.length}
        membersCount={members.length}
        isSyncing={isSyncing}
        onClose={() => setIsSheetsModalOpen(false)}
        onLogin={handleGoogleLogin}
        onCreateNewSheet={handleCreateNewSheet}
        onConnectExistingSheet={handleConnectExistingSheet}
        onConnectWebhook={handleConnectWebhook}
        onExportCSV={handleExportCSV}
        onManualSync={() => performSyncToSheets()}
        onToggleAutoSync={(enabled) =>
          setSheetsConfig((prev) => ({ ...prev, autoSync: enabled }))
        }
        onDisconnectSheet={handleDisconnectSheet}
      />

      {/* 4. WhatsApp Export Modal */}
      <WhatsAppExportModal
        isOpen={isWhatsAppModalOpen}
        transactions={transactions}
        members={members}
        config={config}
        sheetsConfig={sheetsConfig}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />

      {/* 5. Team Configuration Modal */}
      <TeamConfigModal
        isOpen={isConfigModalOpen}
        config={config}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={(newCfg) => {
          setConfig(newCfg);
          showToast('Pengaturan klub berhasil disimpan.', 'success');
        }}
        onResetData={handleResetData}
      />

      {/* 6. Destructive Actions Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        isDestructive={confirmState.isDestructive}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
