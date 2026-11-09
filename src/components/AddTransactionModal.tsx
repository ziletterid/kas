/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Package, 
  MapPin, 
  Check, 
  UserPlus, 
  Sparkles,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import { 
  Transaction, 
  TransactionType, 
  InflowCategory, 
  OutflowCategory, 
  PaymentMethod, 
  Member, 
  BadmintonTeamConfig 
} from '../types';

interface AddTransactionModalProps {
  isOpen: boolean;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  members: Member[];
  config: BadmintonTeamConfig;
  onClose: () => void;
  onSave: (transactionData: Partial<Transaction>, shouldAddShuttleStock?: number) => void;
  onAddMemberQuick: (name: string, phone: string) => Promise<string>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  initialType = 'masuk',
  editingTransaction = null,
  members,
  config,
  onClose,
  onSave,
  onAddMemberQuick,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);

  // Inflow states
  const [memberId, setMemberId] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');
  const [inflowCategory, setInflowCategory] = useState<InflowCategory>('iuran_bulanan');

  // Outflow states
  const [outflowCategory, setOutflowCategory] = useState<OutflowCategory>('beli_kok');
  const [shuttleBrand, setShuttleBrand] = useState<string>(config.defaultShuttleBrand || 'Samurai Hijau');
  const [shuttleTubes, setShuttleTubes] = useState<number>(3);
  const [shuttlePricePerTube, setShuttlePricePerTube] = useState<number>(125000);
  const [autoAddStock, setAutoAddStock] = useState<boolean>(true);

  // Court states
  const [courtVenue, setCourtVenue] = useState<string>(config.homeCourt || 'GOR Bulutangkis');
  const [courtDuration, setCourtDuration] = useState<number>(3);
  const [courtNumber, setCourtNumber] = useState<string>('Lap. 1 & 2');

  // Common states
  const [amount, setAmount] = useState<number>(config.monthlyFee);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [description, setDescription] = useState<string>('');
  const [recordedBy, setRecordedBy] = useState<string>('Bendahara');

  // Quick new member mini-form
  const [isAddingNewMember, setIsAddingNewMember] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberPhone, setNewMemberPhone] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setAmount(editingTransaction.amount);
      setPaymentMethod(editingTransaction.paymentMethod);
      setDescription(editingTransaction.description || '');
      setRecordedBy(editingTransaction.recordedBy || 'Bendahara');

      if (editingTransaction.type === 'masuk') {
        setInflowCategory(editingTransaction.category as InflowCategory);
        setMemberId(editingTransaction.memberId || '');
        setMemberName(editingTransaction.memberName || '');
      } else {
        setOutflowCategory(editingTransaction.category as OutflowCategory);
        if (editingTransaction.shuttlecockDetails) {
          setShuttleBrand(editingTransaction.shuttlecockDetails.brand);
          setShuttleTubes(editingTransaction.shuttlecockDetails.tubesCount);
          setShuttlePricePerTube(editingTransaction.shuttlecockDetails.pricePerTube);
        }
        if (editingTransaction.courtDetails) {
          setCourtVenue(editingTransaction.courtDetails.venueName);
          setCourtDuration(editingTransaction.courtDetails.durationHours);
          setCourtNumber(editingTransaction.courtDetails.courtNumber || '');
        }
      }
    } else {
      // Reset for new entry
      setType(initialType);
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('transfer');
      setDescription('');

      if (initialType === 'masuk') {
        setInflowCategory('iuran_bulanan');
        setAmount(config.monthlyFee);
        if (members.length > 0) {
          setMemberId(members[0].id);
          setMemberName(members[0].name);
        }
      } else {
        setOutflowCategory('beli_kok');
        setShuttleBrand(config.defaultShuttleBrand || 'Samurai Hijau');
        setShuttleTubes(3);
        setShuttlePricePerTube(125000);
        setAmount(3 * 125000);
      }
    }
  }, [isOpen, initialType, editingTransaction, config, members]);

  // Recalculate kok amount automatically when tube count or price changes
  const handleShuttleTubesChange = (val: number) => {
    const tubes = Math.max(1, val);
    setShuttleTubes(tubes);
    if (type === 'keluar' && outflowCategory === 'beli_kok') {
      setAmount(tubes * shuttlePricePerTube);
    }
  };

  const handleShuttlePriceChange = (price: number) => {
    setShuttlePricePerTube(price);
    if (type === 'keluar' && outflowCategory === 'beli_kok') {
      setAmount(shuttleTubes * price);
    }
  };

  // Quick preset amount handler
  const setQuickAmount = (val: number) => {
    setAmount(val);
  };

  const handleMemberChange = (id: string) => {
    setMemberId(id);
    const m = members.find((mem) => mem.id === id);
    if (m) {
      setMemberName(m.name);
    }
  };

  const handleQuickAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    try {
      const createdId = await onAddMemberQuick(newMemberName.trim(), newMemberPhone.trim());
      setMemberId(createdId);
      setMemberName(newMemberName.trim());
      setNewMemberName('');
      setNewMemberPhone('');
      setIsAddingNewMember(false);
    } catch (err) {
      console.error('Failed to quick add member', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      alert('Nominal harus lebih besar dari 0');
      return;
    }

    const transactionData: Partial<Transaction> = {
      id: editingTransaction ? editingTransaction.id : `trx-${Date.now()}`,
      type,
      date,
      category: type === 'masuk' ? inflowCategory : outflowCategory,
      amount: Number(amount),
      description: description.trim() || (type === 'masuk' ? `Iuran ${memberName}` : 'Pengeluaran Tim'),
      paymentMethod,
      recordedBy: recordedBy.trim() || 'Bendahara',
      createdAt: editingTransaction?.createdAt || new Date().toISOString(),
    };

    if (type === 'masuk') {
      transactionData.memberId = memberId;
      transactionData.memberName = memberName;
    } else {
      if (outflowCategory === 'beli_kok') {
        transactionData.shuttlecockDetails = {
          brand: shuttleBrand,
          tubesCount: Number(shuttleTubes),
          pricePerTube: Number(shuttlePricePerTube),
        };
      } else if (outflowCategory === 'sewa_lapangan') {
        transactionData.courtDetails = {
          venueName: courtVenue,
          durationHours: Number(courtDuration),
          courtNumber: courtNumber,
          playDate: date,
        };
      }
    }

    // Check if we should update shuttlecock stock in the team inventory
    const deltaStock =
      !editingTransaction && type === 'keluar' && outflowCategory === 'beli_kok' && autoAddStock
        ? Number(shuttleTubes)
        : 0;

    onSave(transactionData, deltaStock);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8">
        {/* Modal Top Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏸</span>
            <h3 className="text-lg font-bold">
              {editingTransaction ? 'Edit Catatan Kas' : 'Catat Transaksi Kas Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Tab Switch: Uang Masuk vs Uang Keluar */}
        {!editingTransaction && (
          <div className="p-3 bg-gray-50 border-b border-gray-100 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setType('masuk');
                setAmount(config.monthlyFee);
              }}
              className={`flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                type === 'masuk'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Transaksi Masuk</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('keluar');
                setAmount(shuttleTubes * shuttlePricePerTube);
              }}
              className={`flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                type === 'keluar'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Transaksi Keluar</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Section: INFLOW FORM */}
          {type === 'masuk' && (
            <div className="space-y-4">
              {/* Member Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">Nama Anggota / Pembayar</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewMember(!isAddingNewMember)}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isAddingNewMember ? 'Pilih dari List' : '+ Tambah Member Baru'}</span>
                  </button>
                </div>

                {isAddingNewMember ? (
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                    <p className="text-xs text-emerald-800 font-semibold">Tambah Cepat Anggota Baru:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nama Lengkap"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs text-gray-800"
                      />
                      <input
                        type="tel"
                        placeholder="No. WhatsApp (opsional)"
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs text-gray-800"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingNewMember(false)}
                        className="px-3 py-1 text-xs text-gray-600 hover:bg-emerald-100 rounded-lg"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleQuickAddMemberSubmit}
                        className="px-3 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        Simpan Member
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={memberId}
                    onChange={(e) => handleMemberChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.type === 'tetap' ? 'Member Tetap' : m.type === 'reguler' ? 'Reguler' : 'Tamu'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Inflow Category */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Jenis Pemasukan / Iuran
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'iuran_bulanan', label: 'Iuran Bulanan', defAmount: config.monthlyFee },
                    { key: 'iuran_sesi', label: 'Iuran Per Sesi (Mabar)', defAmount: config.sessionFee },
                    { key: 'tamu_insidental', label: 'Pemain Tamu', defAmount: config.sessionFee + 5000 },
                    { key: 'donasi_sponsor', label: 'Donasi / Sponsor', defAmount: 200000 },
                    { key: 'lainnya', label: 'Pemasukan Lain', defAmount: 50000 },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        setInflowCategory(cat.key as InflowCategory);
                        setAmount(cat.defAmount);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${
                        inflowCategory === cat.key
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section: OUTFLOW FORM */}
          {type === 'keluar' && (
            <div className="space-y-4">
              {/* Outflow Category */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Kategori Pengeluaran
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'beli_kok', label: '🏸 Beli Kok' },
                    { key: 'sewa_lapangan', label: '🏟️ Sewa Lapangan' },
                    { key: 'minuman_konsumsi', label: '🥤 Minum & Galon' },
                    { key: 'senar_peralatan', label: '🎾 Senar & Alat Tim' },
                    { key: 'hadiah_turnamen', label: '🏆 Mini Turnamen' },
                    { key: 'lainnya', label: '📦 Kebutuhan Lain' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setOutflowCategory(cat.key as OutflowCategory)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${
                        outflowCategory === cat.key
                          ? 'bg-rose-50 border-rose-500 text-rose-800 font-bold'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Shuttlecock inputs */}
              {outflowCategory === 'beli_kok' && (
                <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-3">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <Package className="w-4 h-4 text-rose-600" />
                    <span>Rincian Pembelian Kok (Shuttlecock):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-rose-800 mb-1">
                        Merk / Tipe Kok
                      </label>
                      <input
                        type="text"
                        value={shuttleBrand}
                        onChange={(e) => setShuttleBrand(e.target.value)}
                        placeholder="e.g. Samurai Hijau"
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-rose-800 mb-1">
                        Jumlah (Slop/Tube)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={shuttleTubes}
                        onChange={(e) => handleShuttleTubesChange(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-rose-800 mb-1">
                        Harga per Slop (Rp)
                      </label>
                      <input
                        type="number"
                        step="1000"
                        value={shuttlePricePerTube}
                        onChange={(e) => handleShuttlePriceChange(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  {!editingTransaction && (
                    <label className="flex items-center gap-2 text-xs text-rose-900 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={autoAddStock}
                        onChange={(e) => setAutoAddStock(e.target.checked)}
                        className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500"
                      />
                      <span>
                        Tambahkan otomatis <strong>+{shuttleTubes} slop</strong> ke stok kok tim
                      </span>
                    </label>
                  )}
                </div>
              )}

              {/* Specific Court inputs */}
              {outflowCategory === 'sewa_lapangan' && (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>Rincian Sewa Lapangan Badminton:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                        Nama GOR / Hall
                      </label>
                      <input
                        type="text"
                        value={courtVenue}
                        onChange={(e) => setCourtVenue(e.target.value)}
                        placeholder="e.g. GOR Sejahtera"
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                        Durasi (Jam)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={courtDuration}
                        onChange={(e) => setCourtDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                        Nomor Lapangan
                      </label>
                      <input
                        type="text"
                        value={courtNumber}
                        onChange={(e) => setCourtNumber(e.target.value)}
                        placeholder="Lap. 1 & 2"
                        className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount & Quick Chips */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700">Nominal Uang (Rupiah)</label>
              {type === 'masuk' && (
                <div className="flex items-center gap-1">
                  {[35000, 50000, 100000, 150000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuickAmount(preset)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-600 transition-colors"
                    >
                      {preset >= 1000 ? `${preset / 1000}k` : preset}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">
                Rp
              </span>
              <input
                type="number"
                step="1000"
                min="1000"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-lg font-black font-mono text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Transaksi</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'transfer', label: 'Transfer', icon: CreditCard },
                  { key: 'qris', label: 'QRIS', icon: QrCode },
                  { key: 'tunai', label: 'Tunai', icon: Banknote },
                ].map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <button
                      key={pm.key}
                      type="button"
                      onClick={() => setPaymentMethod(pm.key as PaymentMethod)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 border transition-all ${
                        paymentMethod === pm.key
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Keterangan / Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Keterangan / Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'masuk'
                  ? 'Contoh: Iuran Kas Rutin November 2026'
                  : 'Contoh: Beli Kok Samurai Hijau 3 slop di Toko Smash'
              }
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Pencatat */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Dicatat Oleh (Penanggung Jawab)
            </label>
            <input
              type="text"
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              placeholder="Bendahara / Nama Anda"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Live Sheets Notification */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
            <span className="text-base">📊</span>
            <span>
              Data akan otomatis dicatat secara lokal dan disinkronkan ke Google Spreadsheet tim jika terhubung.
            </span>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-95 ${
                type === 'masuk'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
              }`}
            >
              {editingTransaction ? 'Simpan Perubahan' : 'Catat ke Kas Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
