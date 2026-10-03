import api from './api';

export interface OrganizationConfig {
  orgName: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  socialMedia?: string;
  address: string;
  hamlet?: string;
  village?: string;
  subDistrict?: string;
  district?: string;
  period: string;
  description?: string;
  updatedAt?: string;
}

export interface SecurityStatus {
  secretsInDatabase: boolean;
  storagePolicy: string;
  jwtSecretStatus: string;
  jwtSecretLength: number;
  databaseUrlStatus: string;
  compliance: {
    isCompliant: boolean;
    message: string;
  };
}

export const organizationService = {
  /**
   * Mengambil konfigurasi organisasi (bisa diakses publik / seluruh komponen frontend)
   */
  async getConfig(): Promise<OrganizationConfig> {
    const res = await api.get('/settings/organization');
    return res.data.data;
  },

  /**
   * Memperbarui konfigurasi organisasi (khusus ADMIN)
   */
  async updateConfig(data: Partial<OrganizationConfig>): Promise<OrganizationConfig> {
    const res = await api.put('/settings/organization', data);
    return res.data.data;
  },

  /**
   * Reset konfigurasi ke nilai default Setya Bakti Tuk Uluh (khusus ADMIN)
   */
  async resetToDefault(): Promise<OrganizationConfig> {
    const res = await api.post('/settings/organization/reset');
    return res.data.data;
  },

  /**
   * Mengambil status kepatuhan keamanan penyimpanan rahasia (khusus ADMIN)
   */
  async getSecurityStatus(): Promise<SecurityStatus> {
    const res = await api.get('/settings/security-status');
    return res.data.data;
  },

  /**
   * Menjalankan audit keamanan komprehensif 11 poin arsitektur SI-TARUNA (Module 28)
   */
  async getSecurityAudit(): Promise<any> {
    const res = await api.get('/admin/security-audit');
    return res.data.data;
  },
};

export default organizationService;
