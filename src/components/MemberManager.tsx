/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  MessageCircle, 
  CheckCircle, 
  AlertCircle, 
  Search, 
  Edit, 
  Trash2, 
  ArrowDownLeft,
  X,
  CreditCard
} from 'lucide-react';
import { Member, Transaction, BadmintonTeamConfig } from '../types';

interface MemberManagerProps {
  members: Member[];
  transactions: Transaction[];
  config: BadmintonTeamConfig;
  isPublicView: boolean;
  onAddMember: (memberData: Omit<Member, 'id'>) => void;
  onUpdateMember: (id: string, memberData: Partial<Member>) => void;
  onDeleteMember: (id: string, name: string) => void;
  onQuickPay: (member: Member) => void;
}

export const MemberManager: React.FC<MemberManagerProps> = ({
  members,
  transactions,
  config,
  isPublicView,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onQuickPay,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'tetap' | 'reguler' | 'tamu'>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'tetap' | 'reguler' | 'tamu'>('tetap');
  const [notes, setNotes] = useState('');

  // Calculate current month's payment status for each member
  const currentMonthKey = new Date().toISOString().slice(0, 7); // YYYY-MM

  const openAddModal = () => {
    setEditingMember(null);
    setName('');
    setPhone('');
    setType('tetap');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setName(member.name);
    setPhone(member.phone || '');
    setType(member.type);
    setNotes(member.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingMember) {
      onUpdateMember(editingMember.id, {
        name: name.trim(),
        phone: phone.trim(),
        type,
        notes: notes.trim(),
      });
    } else {
      onAddMember({
        name: name.trim(),
        phone: phone.trim(),
        type,
        joinedDate: new Date().toISOString().split('T')[0],
        notes: notes.trim(),
        isActive: true,
      });
    }
    setIsModalOpen(false);
  };

  const filteredMembers = members.filter((m) => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || (m.phone && m.phone.includes(q));
    }
    return true;
  });

  const getMemberInflows = (memberId: string, memberName: string) => {
    return transactions.filter(
      (t) =>
        t.type === 'masuk' &&
        (t.memberId === memberId || t.memberName?.toLowerCase() === memberName.toLowerCase())
    );
  };

  const hasPaidCurrentMonth = (memberId: string, memberName: string) => {
    const inflows = getMemberInflows(memberId, memberName);
    return inflows.some(
      (t) =>
        t.date.startsWith(currentMonthKey) &&
        (t.category === 'iuran_bulanan' || t.amount >= config.monthlyFee)
    );
  };

  const sendWhatsAppReminder = (member: Member) => {
    const cleanPhone = (member.phone || '').replace(/\D/g, '');
    const phoneFormatted = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    const message = encodeURIComponent(
      `Halo Bro ${member.name}! 👋🏸\n\nIzin mengingatkan info kas tim *${config.teamName}* untuk bulan ini.\nIuran bulanan sebesar *Rp ${config.monthlyFee.toLocaleString('id-ID')}* belum tercatat di buku kas tim yaa.\n\nBisa langsung ditransfer agar pembukuan & transparansi kas tim tetap rapi dan lancar. Terima kasih banyak bro! 🏸💪`
    );

    window.open(`https://wa.me/${phoneFormatted}?text=${message}`, '_blank');
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Daftar Anggota Tim & Transparansi Iuran</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Pantau status pembayaran iuran kas seluruh pemain badminton
            </p>
          </div>

          {!isPublicView && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Anggota</span>
            </button>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua ({members.length})
            </button>
            <button
              onClick={() => setFilterType('tetap')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                filterType === 'tetap'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Member Tetap
            </button>
            <button
              onClick={() => setFilterType('reguler')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                filterType === 'reguler'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              Member Reguler
            </button>
            <button
              onClick={() => setFilterType('tamu')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                filterType === 'tamu'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Tamu / Pengganti
            </button>
          </div>

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari anggota..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Member Cards Grid */}
      {filteredMembers.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-gray-800">Belum Ada Anggota Terdaftar</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {search ? 'Tidak ada anggota yang cocok dengan pencarian.' : 'Tambahkan nama-nama pemain dalam tim badminton Anda.'}
          </p>
          {!isPublicView && (
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors inline-flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Anggota Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((m) => {
            const inflows = getMemberInflows(m.id, m.name);
            const totalPaid = inflows.reduce((sum, t) => sum + t.amount, 0);
            const isPaidThisMonth = hasPaidCurrentMonth(m.id, m.name);

            return (
              <div
                key={m.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-emerald-300 hover:shadow-md transition-all space-y-3 relative group"
              >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${
                      m.avatarColor || 'from-emerald-500 to-teal-600'
                    } text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0`}
                  >
                    {m.name
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate">{m.name}</h4>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        m.type === 'tetap'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.type === 'reguler'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {m.type === 'tetap' ? 'Member Tetap' : m.type === 'reguler' ? 'Reguler' : 'Tamu'}
                    </span>
                  </div>
                </div>

                {/* Status Lunas Bulan Ini */}
                {isPaidThisMonth ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-xl border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Lunas</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Belum</span>
                  </span>
                )}
              </div>

              {/* Stats & Info */}
              <div className="bg-gray-50/80 rounded-xl p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Total Iuran Terbayar:</span>
                  <span className="font-bold font-mono text-gray-900">
                    Rp {totalPaid.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-500 text-[11px]">
                  <span>Frekuensi Bayar:</span>
                  <span>{inflows.length} kali transaksi</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 gap-2 border-t border-gray-100">
                {/* WhatsApp button */}
                {m.phone ? (
                  <button
                    onClick={() => sendWhatsAppReminder(m)}
                    title="Kirim pengingat iuran via WhatsApp"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WA Tagihan</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-gray-400">No WA belum ada</span>
                )}

                {/* Quick Pay Button */}
                {!isPublicView && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onQuickPay(m)}
                      title="Catat Iuran Masuk dari Member Ini"
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bayar</span>
                    </button>
                    <button
                      onClick={() => openEditModal(m)}
                      title="Edit Anggota"
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteMember(m.id, m.name)}
                      title="Hapus Anggota"
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Member Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingMember ? 'Edit Data Anggota' : 'Tambah Anggota Tim Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Lengkap Pemain
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Anthony Sinisuka Ginting"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nomor WhatsApp (Aktif)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Status Keanggotaan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'tetap', label: 'Member Tetap' },
                    { key: 'reguler', label: 'Reguler' },
                    { key: 'tamu', label: 'Tamu / Mabar' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setType(t.key as any)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all ${
                        type === t.key
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Pegang kunci loker, kapten tim"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
                >
                  {editingMember ? 'Simpan' : 'Tambah Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
