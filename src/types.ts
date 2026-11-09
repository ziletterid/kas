/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'masuk' | 'keluar';

export type InflowCategory = 'iuran_bulanan' | 'iuran_sesi' | 'tamu_insidental' | 'donasi_sponsor' | 'lainnya';

export type OutflowCategory = 'beli_kok' | 'sewa_lapangan' | 'minuman_konsumsi' | 'senar_peralatan' | 'hadiah_turnamen' | 'lainnya';

export type PaymentMethod = 'transfer' | 'qris' | 'tunai';

export interface ShuttlecockDetails {
  brand: string;        // contoh: JP Gold, Samurai Hijau, Yonex AS, DMAX
  tubesCount: number;   // jumlah slop/tube
  pricePerTube: number; // harga satuan per slop
}

export interface CourtDetails {
  venueName: string;    // nama GOR / hall
  durationHours: number;// durasi jam
  courtNumber?: string; // no lapangan
  playDate?: string;    // tanggal main
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  category: InflowCategory | OutflowCategory;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  recordedBy: string;
  
  // Specific for inflow
  memberId?: string;
  memberName?: string;
  
  // Specific for outflow
  shuttlecockDetails?: ShuttlecockDetails;
  courtDetails?: CourtDetails;
  
  // Google Sheets sync tracking
  syncedToSheets?: boolean;
  sheetsRowIndex?: number;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  phone: string; // no whatsapp (e.g. 08123456789)
  type: 'tetap' | 'reguler' | 'tamu';
  joinedDate: string;
  avatarColor?: string;
  notes?: string;
  isActive: boolean;
}

export interface BadmintonTeamConfig {
  teamName: string;
  homeCourt: string;
  scheduleDay: string; // e.g. "Setiap Rabu & Sabtu Malam"
  monthlyFee: number;  // nominal iuran bulanan default
  sessionFee: number;  // nominal per kedatangan
  defaultShuttleBrand: string;
  shuttleStock: number; // estimasi slop kok tersisa di pengurus
  currency: string;
}

export interface SheetsConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetTitle: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
  isConfigured: boolean;
  gasWebhookUrl?: string | null;
  syncMethod?: 'oauth' | 'gas_webhook';
}

export interface MabarCalculation {
  courtCost: number;
  shuttleTubesUsed: number;
  shuttlePricePerTube: number;
  otherCosts: number;
  playersCount: number;
  totalCost: number;
  costPerPlayer: number;
}
