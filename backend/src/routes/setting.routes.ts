import { Router } from 'express';
import { SettingController } from '../controllers/setting.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// 1. Endpoint publik untuk Frontend: Membaca konfigurasi organisasi
router.get('/', SettingController.getOrganizationConfig);
router.get('/organization', SettingController.getOrganizationConfig);
router.get('/config', SettingController.getOrganizationConfig);

// 2. Endpoint terproteksi ADMIN: Mengubah konfigurasi organisasi
router.put('/', authenticate, requireAdmin, SettingController.updateOrganizationConfig);
router.put('/organization', authenticate, requireAdmin, SettingController.updateOrganizationConfig);
router.put('/config', authenticate, requireAdmin, SettingController.updateOrganizationConfig);

// 3. Endpoint terproteksi ADMIN: Reset konfigurasi organisasi ke default
router.post('/reset', authenticate, requireAdmin, SettingController.resetOrganizationConfig);
router.post('/organization/reset', authenticate, requireAdmin, SettingController.resetOrganizationConfig);

// 4. Endpoint terproteksi ADMIN: Status kepatuhan keamanan penyimpanan rahasia (No secrets in DB)
router.get('/security-status', authenticate, requireAdmin, SettingController.getSecurityStatus);
router.get('/security', authenticate, requireAdmin, SettingController.getSecurityStatus);

export default router;
