/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, Member, BadmintonTeamConfig } from '../types';

/**
 * Extract clean Google Spreadsheet ID from either raw ID or full Google Sheets URL.
 */
export const extractSpreadsheetId = (input: string): string => {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  return trimmed;
};

/**
 * Verify access to a spreadsheet and return its title and sheets list.
 */
export const verifySpreadsheetAccess = async (accessToken: string, spreadsheetId: string) => {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Akses ke spreadsheet gagal (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return {
    title: data.properties?.title || 'Spreadsheet Kas Badminton',
    sheets: data.sheets?.map((s: any) => s.properties?.title) || [],
  };
};

/**
 * Create a beautifully formatted Google Spreadsheet for Badminton Team Finances.
 */
export const createBadmintonSpreadsheet = async (
  accessToken: string,
  teamName: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; title: string }> => {
  const title = `Kas Badminton - ${teamName || 'Tim Kita'}`;

  const requestBody = {
    properties: {
      title,
      locale: 'id_ID',
      autoRecalc: 'ON_CHANGE',
    },
    sheets: [
      {
        properties: {
          title: 'Ringkasan_Kas',
          gridProperties: { rowCount: 50, columnCount: 10, frozenRowCount: 1 },
          tabColor: { red: 0.05, green: 0.6, blue: 0.4 },
        },
      },
      {
        properties: {
          title: 'Kas_Masuk',
          gridProperties: { rowCount: 500, columnCount: 10, frozenRowCount: 1 },
          tabColor: { red: 0.1, green: 0.7, blue: 0.3 },
        },
      },
      {
        properties: {
          title: 'Kas_Keluar',
          gridProperties: { rowCount: 500, columnCount: 12, frozenRowCount: 1 },
          tabColor: { red: 0.85, green: 0.25, blue: 0.2 },
        },
      },
      {
        properties: {
          title: 'Daftar_Anggota',
          gridProperties: { rowCount: 100, columnCount: 8, frozenRowCount: 1 },
          tabColor: { red: 0.2, green: 0.5, blue: 0.85 },
        },
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal membuat spreadsheet baru: ${errorText}`);
  }

  const result = await response.json();
  const spreadsheetId = result.spreadsheetId;
  const spreadsheetUrl = result.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
};

/**
 * Sync entire current local state (summary, inflows, outflows, members) to Google Sheets.
 */
export const syncAllToSheets = async (
  accessToken: string,
  spreadsheetId: string,
  transactions: Transaction[],
  members: Member[],
  config: BadmintonTeamConfig
): Promise<void> => {
  const inflows = transactions.filter((t) => t.type === 'masuk');
  const outflows = transactions.filter((t) => t.type === 'keluar');

  const totalMasuk = inflows.reduce((sum, t) => sum + t.amount, 0);
  const totalKeluar = outflows.reduce((sum, t) => sum + t.amount, 0);
  const saldoKas = totalMasuk - totalKeluar;

  const totalShuttleTubesPurchased = outflows.reduce((acc, t) => {
    return acc + (t.shuttlecockDetails?.tubesCount || 0);
  }, 0);

  // 1. Prepare Ringkasan_Kas sheet values
  const ringkasanValues = [
    ['METRIK KEUANGAN TIM BADMINTON', 'NILAI / JUMLAH', 'KETERANGAN'],
    ['Nama Klub / Tim', config.teamName, `Jadwal: ${config.scheduleDay}`],
    ['Homebase / GOR Rutin', config.homeCourt, 'Lokasi latihan bersama'],
    ['Total Saldo Kas Saat Ini', `Rp ${saldoKas.toLocaleString('id-ID')}`, saldoKas >= 0 ? 'Surplus / Aman' : 'Defisit!'],
    ['Total Uang Masuk', `Rp ${totalMasuk.toLocaleString('id-ID')}`, `${inflows.length} transaksi iuran & pemasukan`],
    ['Total Uang Keluar', `Rp ${totalKeluar.toLocaleString('id-ID')}`, `${outflows.length} transaksi pengeluaran`],
    ['Total Kok Dibeli (Semua)', `${totalShuttleTubesPurchased} Slop`, `Merk favorit: ${config.defaultShuttleBrand}`],
    ['Estimasi Sisa Stok Kok Pengurus', `${config.shuttleStock} Slop`, 'Dipegang pengurus untuk sesi mendatang'],
    ['Jumlah Anggota Terdaftar', `${members.length} Orang`, `${members.filter(m => m.isActive).length} anggota aktif`],
    ['Tarif Iuran Bulanan Default', `Rp ${config.monthlyFee.toLocaleString('id-ID')}`, 'Per member per bulan'],
    ['Tarif Per Kedatangan (Mabar)', `Rp ${config.sessionFee.toLocaleString('id-ID')}`, 'Per sesi per kedatangan'],
    ['Waktu Pembaruan Terakhir', new Date().toLocaleString('id-ID', { timeZoneName: 'short' }), 'Sinkronisasi Real-Time SmashLedger'],
  ];

  // 2. Prepare Kas_Masuk sheet values
  const kasMasukHeaders = [
    'ID Transaksi',
    'Tanggal',
    'Nama Anggota / Donatur',
    'Kategori Pemasukan',
    'Nominal (Rp)',
    'Metode Bayar',
    'Keterangan / Catatan',
    'Dicatat Oleh',
    'Waktu Catat',
  ];
  const kasMasukRows = inflows.map((t) => [
    t.id,
    t.date,
    t.memberName || '-',
    formatCategoryLabel(t.category),
    t.amount,
    t.paymentMethod.toUpperCase(),
    t.description || '-',
    t.recordedBy || 'Bendahara',
    t.createdAt || t.date,
  ]);
  const kasMasukValues = [kasMasukHeaders, ...kasMasukRows];

  // 3. Prepare Kas_Keluar sheet values
  const kasKeluarHeaders = [
    'ID Transaksi',
    'Tanggal',
    'Keperluan / Deskripsi',
    'Kategori Pengeluaran',
    'Rincian Kok (Merk & Jml Slop)',
    'Rincian Lapangan (GOR & Durasi)',
    'Nominal (Rp)',
    'Metode Bayar',
    'Dicatat Oleh',
    'Waktu Catat',
  ];
  const kasKeluarRows = outflows.map((t) => {
    let kokInfo = '-';
    if (t.shuttlecockDetails && t.shuttlecockDetails.tubesCount > 0) {
      kokInfo = `${t.shuttlecockDetails.brand} (${t.shuttlecockDetails.tubesCount} slop @ Rp ${t.shuttlecockDetails.pricePerTube.toLocaleString('id-ID')})`;
    }

    let courtInfo = '-';
    if (t.courtDetails && t.courtDetails.venueName) {
      courtInfo = `${t.courtDetails.venueName} (${t.courtDetails.durationHours} Jam, Lap ${t.courtDetails.courtNumber || '-'})`;
    }

    return [
      t.id,
      t.date,
      t.description,
      formatCategoryLabel(t.category),
      kokInfo,
      courtInfo,
      t.amount,
      t.paymentMethod.toUpperCase(),
      t.recordedBy || 'Bendahara',
      t.createdAt || t.date,
    ];
  });
  const kasKeluarValues = [kasKeluarHeaders, ...kasKeluarRows];

  // 4. Prepare Daftar_Anggota sheet values
  const memberHeaders = [
    'ID Anggota',
    'Nama Lengkap',
    'No. WhatsApp',
    'Tipe Keanggotaan',
    'Tanggal Bergabung',
    'Total Iuran Terbayar (Rp)',
    'Status',
    'Catatan',
  ];
  const memberRows = members.map((m) => {
    const totalContributed = inflows
      .filter((inf) => inf.memberId === m.id || inf.memberName?.toLowerCase() === m.name.toLowerCase())
      .reduce((sum, inf) => sum + inf.amount, 0);

    return [
      m.id,
      m.name,
      m.phone || '-',
      m.type === 'tetap' ? 'Member Tetap' : m.type === 'reguler' ? 'Member Reguler' : 'Tamu / Insidental',
      m.joinedDate,
      totalContributed,
      m.isActive ? 'Aktif' : 'Non-Aktif',
      m.notes || '-',
    ];
  });
  const memberValues = [memberHeaders, ...memberRows];

  // Batch update all sheets
  const batchData = [
    { range: 'Ringkasan_Kas!A1:C20', values: ringkasanValues },
    { range: 'Kas_Masuk!A1:I' + Math.max(kasMasukValues.length + 10, 20), values: kasMasukValues },
    { range: 'Kas_Keluar!A1:J' + Math.max(kasKeluarValues.length + 10, 20), values: kasKeluarValues },
    { range: 'Daftar_Anggota!A1:H' + Math.max(memberValues.length + 10, 20), values: memberValues },
  ];

  // Check if tabs exist or ensure tabs first
  await ensureSheetsExist(accessToken, spreadsheetId);

  // Clear existing ranges to avoid old orphaned rows
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Kas_Masuk!A2:I500:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => null);

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Kas_Keluar!A2:J500:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => null);

  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: batchData,
      }),
    }
  );

  if (!updateResponse.ok) {
    const err = await updateResponse.text();
    throw new Error(`Gagal menyinkronkan data ke Google Sheets: ${err}`);
  }
};

/**
 * Ensure the 4 required sheets exist in the spreadsheet.
 */
export const ensureSheetsExist = async (accessToken: string, spreadsheetId: string): Promise<void> => {
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) return;

  const meta = await metaRes.json();
  const existingTitles = (meta.sheets || []).map((s: any) => s.properties?.title);

  const requiredSheets = ['Ringkasan_Kas', 'Kas_Masuk', 'Kas_Keluar', 'Daftar_Anggota'];
  const missing = requiredSheets.filter((req) => !existingTitles.includes(req));

  if (missing.length === 0) return;

  const requests = missing.map((title) => ({
    addSheet: {
      properties: {
        title,
        gridProperties: { rowCount: 300, columnCount: 12, frozenRowCount: 1 },
      },
    },
  }));

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });
};

/**
 * Append single transaction in real-time to Google Sheets.
 */
export const appendTransactionToSheets = async (
  accessToken: string,
  spreadsheetId: string,
  transaction: Transaction
): Promise<void> => {
  const isMasuk = transaction.type === 'masuk';
  const sheetName = isMasuk ? 'Kas_Masuk' : 'Kas_Keluar';

  let rowValues: any[] = [];
  if (isMasuk) {
    rowValues = [
      transaction.id,
      transaction.date,
      transaction.memberName || '-',
      formatCategoryLabel(transaction.category),
      transaction.amount,
      transaction.paymentMethod.toUpperCase(),
      transaction.description || '-',
      transaction.recordedBy || 'Bendahara',
      transaction.createdAt || new Date().toISOString(),
    ];
  } else {
    let kokInfo = '-';
    if (transaction.shuttlecockDetails && transaction.shuttlecockDetails.tubesCount > 0) {
      kokInfo = `${transaction.shuttlecockDetails.brand} (${transaction.shuttlecockDetails.tubesCount} slop @ Rp ${transaction.shuttlecockDetails.pricePerTube.toLocaleString('id-ID')})`;
    }

    let courtInfo = '-';
    if (transaction.courtDetails && transaction.courtDetails.venueName) {
      courtInfo = `${transaction.courtDetails.venueName} (${transaction.courtDetails.durationHours} Jam, Lap ${transaction.courtDetails.courtNumber || '-'})`;
    }

    rowValues = [
      transaction.id,
      transaction.date,
      transaction.description,
      formatCategoryLabel(transaction.category),
      kokInfo,
      courtInfo,
      transaction.amount,
      transaction.paymentMethod.toUpperCase(),
      transaction.recordedBy || 'Bendahara',
      transaction.createdAt || new Date().toISOString(),
    ];
  }

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:A:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error('Failed to append transaction to sheet:', err);
    throw new Error(`Gagal menambahkan baris transaksi ke Google Sheets: ${err}`);
  }
};

/**
 * Format human-friendly labels for Indonesian badminton treasury categories.
 */
export const formatCategoryLabel = (category: string): string => {
  switch (category) {
    case 'iuran_bulanan':
      return 'Iuran Bulanan Member';
    case 'iuran_sesi':
      return 'Iuran Main Per Sesi (Mabar)';
    case 'tamu_insidental':
      return 'Tamu / Member Pengganti';
    case 'donasi_sponsor':
      return 'Donasi / Sponsor / Kas Masuk';
    case 'beli_kok':
      return 'Beli Kok (Shuttlecock)';
    case 'sewa_lapangan':
      return 'Sewa Lapangan Badminton';
    case 'minuman_konsumsi':
      return 'Minuman & Konsumsi Tim';
    case 'senar_peralatan':
      return 'Senar / Perlengkapan Bersama';
    case 'hadiah_turnamen':
      return 'Turnamen Internal / Hadiah';
    case 'lainnya':
    default:
      return 'Kebutuhan Lainnya';
  }
};

/**
 * 100% Free Google Apps Script Template
 * Free forever, runs directly on Google Sheets without any GCP billing or credit card.
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Sheet Ringkasan Kas
    var sheetRingkasan = ss.getSheetByName("Ringkasan_Kas") || ss.insertSheet("Ringkasan_Kas");
    sheetRingkasan.clear();
    if (data.ringkasan && data.ringkasan.length > 0) {
      sheetRingkasan.getRange(1, 1, data.ringkasan.length, data.ringkasan[0].length).setValues(data.ringkasan);
      sheetRingkasan.getRange(1, 1, 1, data.ringkasan[0].length).setFontWeight("bold").setBackground("#d1e7dd");
    }

    // 2. Sheet Kas Masuk
    var sheetMasuk = ss.getSheetByName("Kas_Masuk") || ss.insertSheet("Kas_Masuk");
    sheetMasuk.clear();
    if (data.kasMasuk && data.kasMasuk.length > 0) {
      sheetMasuk.getRange(1, 1, data.kasMasuk.length, data.kasMasuk[0].length).setValues(data.kasMasuk);
      sheetMasuk.getRange(1, 1, 1, data.kasMasuk[0].length).setFontWeight("bold").setBackground("#cff4fc");
    }

    // 3. Sheet Kas Keluar
    var sheetKeluar = ss.getSheetByName("Kas_Keluar") || ss.insertSheet("Kas_Keluar");
    sheetKeluar.clear();
    if (data.kasKeluar && data.kasKeluar.length > 0) {
      sheetKeluar.getRange(1, 1, data.kasKeluar.length, data.kasKeluar[0].length).setValues(data.kasKeluar);
      sheetKeluar.getRange(1, 1, 1, data.kasKeluar[0].length).setFontWeight("bold").setBackground("#f8d7da");
    }

    // 4. Sheet Daftar Anggota
    var sheetMember = ss.getSheetByName("Daftar_Anggota") || ss.insertSheet("Daftar_Anggota");
    sheetMember.clear();
    if (data.members && data.members.length > 0) {
      sheetMember.getRange(1, 1, data.members.length, data.members[0].length).setValues(data.members);
      sheetMember.getRange(1, 1, 1, data.members[0].length).setFontWeight("bold").setBackground("#fff3cd");
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

/**
 * Sync directly to Google Sheets via Free Apps Script Webhook (No billing, no cloud console)
 */
export const syncViaGasWebhook = async (
  webhookUrl: string,
  transactions: Transaction[],
  members: Member[],
  config: BadmintonTeamConfig
): Promise<void> => {
  const inflows = transactions.filter((t) => t.type === 'masuk');
  const outflows = transactions.filter((t) => t.type === 'keluar');
  const totalMasuk = inflows.reduce((sum, t) => sum + t.amount, 0);
  const totalKeluar = outflows.reduce((sum, t) => sum + t.amount, 0);
  const saldoKas = totalMasuk - totalKeluar;

  const ringkasan = [
    ['METRIK KEUANGAN BJA SPORTS', 'NILAI / JUMLAH', 'KETERANGAN'],
    ['Nama Klub / Tim', config.teamName, `Jadwal: ${config.scheduleDay}`],
    ['Homebase / GOR Rutin', config.homeCourt, 'Lokasi latihan rutin'],
    ['Total Saldo Kas Saat Ini', `Rp ${saldoKas.toLocaleString('id-ID')}`, saldoKas >= 0 ? 'Surplus' : 'Defisit'],
    ['Total Uang Masuk', `Rp ${totalMasuk.toLocaleString('id-ID')}`, `${inflows.length} transaksi`],
    ['Total Uang Keluar', `Rp ${totalKeluar.toLocaleString('id-ID')}`, `${outflows.length} transaksi`],
    ['Sisa Stok Kok Pengurus', `${config.shuttleStock} Slop`, config.defaultShuttleBrand],
    ['Jumlah Anggota Terdaftar', `${members.length} Orang`, `${members.filter(m => m.isActive).length} aktif`],
    ['Tarif Iuran Bulanan', `Rp ${config.monthlyFee.toLocaleString('id-ID')}`, 'Per member'],
    ['Tarif Sesi Mabar', `Rp ${config.sessionFee.toLocaleString('id-ID')}`, 'Per kedatangan'],
    ['Waktu Terakhir Sinkronisasi', new Date().toLocaleString('id-ID'), 'BJA Sports Ledger (100% Free)'],
  ];

  const kasMasukHeaders = [
    'ID Transaksi',
    'Tanggal',
    'Nama Anggota / Pembayar',
    'Kategori Pemasukan',
    'Nominal (Rp)',
    'Metode Bayar',
    'Keterangan / Catatan',
    'Dicatat Oleh',
  ];
  const kasMasukRows = inflows.map((t) => [
    t.id,
    t.date,
    t.memberName || '-',
    formatCategoryLabel(t.category),
    t.amount,
    t.paymentMethod.toUpperCase(),
    t.description || '-',
    t.recordedBy || 'Bendahara',
  ]);

  const kasKeluarHeaders = [
    'ID Transaksi',
    'Tanggal',
    'Keperluan / Deskripsi',
    'Kategori Pengeluaran',
    'Rincian Kok (Merk & Jml Slop)',
    'Rincian Lapangan (GOR & Durasi)',
    'Nominal (Rp)',
    'Metode Bayar',
    'Dicatat Oleh',
  ];
  const kasKeluarRows = outflows.map((t) => {
    let kokInfo = '-';
    if (t.shuttlecockDetails && t.shuttlecockDetails.tubesCount > 0) {
      kokInfo = `${t.shuttlecockDetails.brand} (${t.shuttlecockDetails.tubesCount} slop @ Rp ${t.shuttlecockDetails.pricePerTube.toLocaleString('id-ID')})`;
    }
    let courtInfo = '-';
    if (t.courtDetails && t.courtDetails.venueName) {
      courtInfo = `${t.courtDetails.venueName} (${t.courtDetails.durationHours} Jam, Lap ${t.courtDetails.courtNumber || '-'})`;
    }
    return [
      t.id,
      t.date,
      t.description,
      formatCategoryLabel(t.category),
      kokInfo,
      courtInfo,
      t.amount,
      t.paymentMethod.toUpperCase(),
      t.recordedBy || 'Bendahara',
    ];
  });

  const memberHeaders = [
    'ID Anggota',
    'Nama Lengkap',
    'No. WhatsApp',
    'Tipe Keanggotaan',
    'Total Iuran Terbayar (Rp)',
    'Status',
  ];
  const memberRows = members.map((m) => {
    const totalContributed = inflows
      .filter((inf) => inf.memberId === m.id || inf.memberName?.toLowerCase() === m.name.toLowerCase())
      .reduce((sum, inf) => sum + inf.amount, 0);

    return [
      m.id,
      m.name,
      m.phone || '-',
      m.type === 'tetap' ? 'Member Tetap' : m.type === 'reguler' ? 'Member Reguler' : 'Tamu',
      totalContributed,
      m.isActive ? 'Aktif' : 'Non-Aktif',
    ];
  });

  const payload = {
    ringkasan,
    kasMasuk: [kasMasukHeaders, ...kasMasukRows],
    kasKeluar: [kasKeluarHeaders, ...kasKeluarRows],
    members: [memberHeaders, ...memberRows],
  };

  // Google Apps Script accepts text/plain POST to avoid preflight CORS
  await fetch(webhookUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });
};

/**
 * 1-Click Export to CSV File (100% Offline, no account, no billing)
 */
export const exportToCSV = (
  transactions: Transaction[],
  teamName: string = 'BJA Sports'
) => {
  const headers = ['ID', 'Tanggal', 'Jenis', 'Kategori', 'Keterangan / Nama', 'Nominal (Rp)', 'Metode Bayar', 'Dicatat Oleh'];
  const rows = transactions.map((t) => [
    t.id,
    t.date,
    t.type === 'masuk' ? 'Uang Masuk' : 'Uang Keluar',
    formatCategoryLabel(t.category),
    `"${(t.type === 'masuk' ? t.memberName || t.description : t.description).replace(/"/g, '""')}"`,
    t.amount,
    t.paymentMethod.toUpperCase(),
    `"${(t.recordedBy || 'Bendahara').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Kas_${teamName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
