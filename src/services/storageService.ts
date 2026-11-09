/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, Member, BadmintonTeamConfig, SheetsConfig } from '../types';

const STORAGE_KEYS = {
  TRANSACTIONS: 'smashledger_transactions_v2',
  MEMBERS: 'smashledger_members_v2',
  CONFIG: 'smashledger_team_config_v2',
  SHEETS: 'smashledger_sheets_config_v1',
};

export const DEFAULT_CONFIG: BadmintonTeamConfig = {
  teamName: 'BJA Sports',
  homeCourt: 'GOR Bulutangkis',
  scheduleDay: 'Jadwal Rutin Mingguan',
  monthlyFee: 100000,
  sessionFee: 35000,
  defaultShuttleBrand: 'Samurai Hijau Speed 77',
  shuttleStock: 0,
  currency: 'IDR',
};

export const DEFAULT_MEMBERS: Member[] = [];

export const DEFAULT_TRANSACTIONS: Transaction[] = [];

export const getStoredTransactions = (): Transaction[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return DEFAULT_TRANSACTIONS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TRANSACTIONS;
  }
};

export const saveStoredTransactions = (transactions: Transaction[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions to localStorage', e);
  }
};

export const getStoredMembers = (): Member[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!raw) return DEFAULT_MEMBERS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MEMBERS;
  }
};

export const saveStoredMembers = (members: Member[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error('Failed to save members to localStorage', e);
  }
};

export const getStoredTeamConfig = (): BadmintonTeamConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    if (parsed.teamName === 'PB Badminton Kita' || parsed.teamName === 'PB Garuda Smash' || !parsed.teamName) {
      parsed.teamName = 'BJA Sports';
    }
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
};

export const saveStoredTeamConfig = (config: BadmintonTeamConfig) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save team config to localStorage', e);
  }
};

export const getStoredSheetsConfig = (): SheetsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHEETS);
    if (!raw) {
      return {
        spreadsheetId: null,
        spreadsheetUrl: null,
        spreadsheetTitle: 'Kas Badminton Team',
        autoSync: true,
        lastSyncedAt: null,
        isConfigured: false,
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      spreadsheetId: null,
      spreadsheetUrl: null,
      spreadsheetTitle: 'Kas Badminton Team',
      autoSync: true,
      lastSyncedAt: null,
      isConfigured: false,
    };
  }
};

export const saveStoredSheetsConfig = (config: SheetsConfig) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SHEETS, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save sheets config to localStorage', e);
  }
};
