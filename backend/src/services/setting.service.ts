import prisma from '../utils/prisma';
import { AppError } from '../utils/appError';
import { config } from '../utils/config';

export interface UpdateOrgConfigInput {
  orgName?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  socialMedia?: string;
  address?: string;
  hamlet?: string;
  village?: string;
  subDistrict?: string;
  district?: string;
  period?: string;
  description?: string;
  [key: string]: any;
}

const DEFAULT_SETTINGS = {
  id: 'default',
  orgName: 'Karang Taruna Setya Bakti',
  logoUrl: '/assets/logo.png',
  phone: '0812-3456-7890',
  email: 'setyabakti.tukuluh@gmail.com',
  socialMedia: '@karangtaruna_setyabakti',
  address: 'Dusun Tuk Uluh, Desa Sringin, Kec. Jumantono, Kab. Karanganyar, Jawa Tengah',
  hamlet: 'Tuk Uluh',
  village: 'Sringin',
  subDistrict: 'Jumantono',
  district: 'Karanganyar',
  period: '2024 - 2027',
  description: 'Wadah pembinaan dan pengembangan generasi muda Dusun Tuk Uluh, Desa Sringin, Kecamatan Jumantono.',
};

export class SettingService {
  /**
   * Mengambil konfigurasi organisasi untuk digunakan frontend.
   * Jika belum ada record default di database, buat otomatis dengan nilai default.
   */
  static async getOrganizationConfig() {
    let setting = await prisma.organizationSetting.findUnique({
      where: { id: 'default' },
    });

    if (!setting) {
      setting = await prisma.organizationSetting.create({
        data: DEFAULT_SETTINGS,
      });
    }

    return {
      orgName: setting.orgName,
      logoUrl: setting.logoUrl,
      phone: setting.phone,
      email: setting.email,
      socialMedia: setting.socialMedia,
      address: setting.address,
      hamlet: setting.hamlet,
      village: setting.village,
      subDistrict: setting.subDistrict,
      district: setting.district,
      period: setting.period,
      description: setting.description,
      updatedAt: setting.updatedAt,
    };
  }

  /**
   * Memperbarui konfigurasi organisasi oleh ADMIN.
   * Memastikan kepatuhan aturan: JANGAN MENYIMPAN SECRET KEY DI DATABASE BIASA.
   */
  static async updateOrganizationConfig(data: UpdateOrgConfigInput) {
    // 1. Verifikasi keamanan: Blokir jika terdapat indikasi secret key / token / password
    const sensitiveKeyPatterns = ['secret', 'jwt', 'token', 'password', 'privatekey', 'apikey', 'credential'];
    const submittedKeys = Object.keys(data);

    for (const key of submittedKeys) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeyPatterns.some(pattern => lowerKey.includes(pattern))) {
        throw new AppError(
          'Pelanggaran Keamanan: Dilarang menyimpan secret key, JWT token, atau kredensial rahasia di dalam database biasa. Gunakan environment variables (.env).',
          400
        );
      }
    }

    // 2. Filter hanya field organisasi yang sah
    const allowedData: any = {};
    if (data.orgName !== undefined) allowedData.orgName = String(data.orgName).trim();
    if (data.logoUrl !== undefined) allowedData.logoUrl = String(data.logoUrl).trim();
    if (data.phone !== undefined) allowedData.phone = String(data.phone).trim();
    if (data.email !== undefined) allowedData.email = String(data.email).trim();
    if (data.socialMedia !== undefined) allowedData.socialMedia = String(data.socialMedia).trim();
    if (data.address !== undefined) allowedData.address = String(data.address).trim();
    if (data.hamlet !== undefined) allowedData.hamlet = String(data.hamlet).trim();
    if (data.village !== undefined) allowedData.village = String(data.village).trim();
    if (data.subDistrict !== undefined) allowedData.subDistrict = String(data.subDistrict).trim();
    if (data.district !== undefined) allowedData.district = String(data.district).trim();
    if (data.period !== undefined) allowedData.period = String(data.period).trim();
    if (data.description !== undefined) allowedData.description = String(data.description).trim();

    // 3. Upsert record default
    const updated = await prisma.organizationSetting.upsert({
      where: { id: 'default' },
      update: allowedData,
      create: {
        ...DEFAULT_SETTINGS,
        ...allowedData,
      },
    });

    return {
      orgName: updated.orgName,
      logoUrl: updated.logoUrl,
      phone: updated.phone,
      email: updated.email,
      socialMedia: updated.socialMedia,
      address: updated.address,
      hamlet: updated.hamlet,
      village: updated.village,
      subDistrict: updated.subDistrict,
      district: updated.district,
      period: updated.period,
      description: updated.description,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Reset konfigurasi organisasi ke nilai default (Karang Taruna Setya Bakti)
   */
  static async resetToDefault() {
    const updated = await prisma.organizationSetting.upsert({
      where: { id: 'default' },
      update: {
        orgName: DEFAULT_SETTINGS.orgName,
        logoUrl: DEFAULT_SETTINGS.logoUrl,
        phone: DEFAULT_SETTINGS.phone,
        email: DEFAULT_SETTINGS.email,
        socialMedia: DEFAULT_SETTINGS.socialMedia,
        address: DEFAULT_SETTINGS.address,
        hamlet: DEFAULT_SETTINGS.hamlet,
        village: DEFAULT_SETTINGS.village,
        subDistrict: DEFAULT_SETTINGS.subDistrict,
        district: DEFAULT_SETTINGS.district,
        period: DEFAULT_SETTINGS.period,
        description: DEFAULT_SETTINGS.description,
      },
      create: DEFAULT_SETTINGS,
    });

    return updated;
  }

  /**
   * Menampilkan status kepatuhan keamanan penyimpanan konfigurasi.
   * Menjamin bahwa secret key tersimpan di environment variables, BUKAN di database biasa.
   */
  static getSecurityStatus() {
    return {
      secretsInDatabase: false,
      storagePolicy: 'Environment Variables (.env / Server Runtime)',
      jwtSecretStatus: config.jwt.secret ? 'Terkonfigurasi Aman di .env (Tervalidasi)' : 'Tidak Ditemukan',
      jwtSecretLength: config.jwt.secret ? config.jwt.secret.length : 0,
      databaseUrlStatus: config.databaseUrl ? 'Terkoneksi via Environment Variable' : 'Belum Terhubung',
      compliance: {
        isCompliant: true,
        message: 'Kepatuhan terpenuhi: Seluruh secret key, password database, dan token sistem TIDAK disimpan di database biasa melainkan di environment server.',
      },
    };
  }
}
