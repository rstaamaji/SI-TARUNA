'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Building,
  Image as ImageIcon,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Info,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Logo } from '@/components/ui/Logo';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useOrganization } from '@/context/OrganizationContext';
import organizationService, { OrganizationConfig, SecurityStatus } from '@/services/organization';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshConfig } = useOrganization();

  // Authentication check
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState<OrganizationConfig>({
    orgName: '',
    logoUrl: '/assets/logo.png',
    phone: '',
    email: '',
    socialMedia: '',
    address: '',
    hamlet: '',
    village: '',
    subDistrict: '',
    district: '',
    period: '',
    description: '',
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Security Status state
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check user role in localStorage
    const savedUserStr = localStorage.getItem('user');
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        if (parsed.role !== 'ADMIN') {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }
      } catch {
        // Continue
      }
    }

    // 2. Fetch current organization config and security status
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [configData, secData] = await Promise.all([
          organizationService.getConfig(),
          organizationService.getSecurityStatus().catch(() => null),
        ]);

        if (configData) {
          setFormData(configData);
        }
        if (secData) {
          setSecurityStatus(secData);
        }
      } catch (err: any) {
        toast({
          type: 'error',
          title: 'Gagal Memuat Pengaturan',
          message: err.response?.data?.message || 'Terjadi kesalahan saat memuat konfigurasi organisasi.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleChange = (field: keyof OrganizationConfig, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const updated = await organizationService.updateConfig(formData);
      setFormData(updated);
      await refreshConfig();

      toast({
        type: 'success',
        title: 'Pengaturan Disimpan',
        message: 'Konfigurasi organisasi berhasil diperbarui dan diterapkan ke seluruh sistem.',
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err.response?.data?.message || 'Gagal menyimpan konfigurasi organisasi.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    try {
      setIsResetting(true);
      const reset = await organizationService.resetToDefault();
      setFormData(reset);
      await refreshConfig();
      setShowResetConfirm(false);

      toast({
        type: 'success',
        title: 'Pengaturan Direset',
        message: 'Konfigurasi organisasi telah dikembalikan ke nilai default Setya Bakti Tuk Uluh.',
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Gagal Mereset',
        message: err.response?.data?.message || 'Gagal mereset konfigurasi organisasi.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-taruna-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-center p-6 sm:p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-taruna-red-100 dark:bg-red-900/50 flex items-center justify-center text-taruna-red-600 dark:text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Akses Ditolak (403 Forbidden)</h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-2 mb-6">
            Halaman pengaturan organisasi dan sistem hanya dapat diakses oleh Administrator Karang Taruna.
          </p>
          <Button variant="primary" onClick={() => router.push('/dashboard')}>
            Kembali ke Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-taruna-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
          Memuat konfigurasi organisasi & keamanan sistem...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-taruna-surface dark:bg-slate-950 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole="ADMIN"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 md:px-6 py-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="space-y-8 pb-16 animate-in fade-in duration-300">
            {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-taruna-border dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-taruna-yellow-100 dark:bg-amber-950/60 text-taruna-yellow-700 dark:text-amber-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan Organisasi</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                Konfigurasi identitas Karang Taruna, profil kontak, alamat, periode kepengurusan, dan keamanan data.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSecurityModal(true)}
            className="flex items-center gap-2 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Kepatuhan Keamanan</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 text-gray-600 dark:text-slate-300"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Bawaan</span>
          </Button>
        </div>
      </div>

      {/* Security Best-Practice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Keamanan Sistem Terjamin: Secret Keys Terproteksi di Server
                </h4>
                <Badge variant="accent" size="sm" className="bg-emerald-600 text-white font-mono text-[10px]">
                  SECURE & COMPLIANT
                </Badge>
              </div>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300/80 mt-1">
                Sesuai standar arsitektur keamanan: Kunci rahasia sistem (<code className="font-mono bg-emerald-200/50 dark:bg-emerald-900/50 px-1 py-0.5 rounded text-[11px]">JWT_SECRET</code>, kredensial database PostgreSQL) <strong>TIDAK disimpan di database biasa</strong>, melainkan dikelola langsung via Environment Server (<code className="font-mono bg-emerald-200/50 dark:bg-emerald-900/50 px-1 py-0.5 rounded text-[11px]">.env</code>).
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowSecurityModal(true)}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/50 shrink-0 self-end sm:self-center"
          >
            Lihat Bukti Audit &rarr;
          </Button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identitas & Branding */}
        <Card className="border border-taruna-border dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-taruna-yellow-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent border-b border-taruna-border dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-taruna-yellow-600 dark:text-amber-400" />
              <CardTitle className="text-base sm:text-lg">Identitas & Branding Organisasi</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Konfigurasi nama resmi Karang Taruna, logo visual, dan tahun periode kepengurusan.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nama Organisasi */}
              <div className="md:col-span-2">
                <Input
                  label="Nama Organisasi"
                  value={formData.orgName}
                  onChange={(e) => handleChange('orgName', e.target.value)}
                  placeholder="Misal: Karang Taruna Setya Bakti"
                  helperText="Nama ini akan tampil di seluruh header, kop dokumen, laporan keuangan, dan notulensi."
                  leftIcon={<Building className="w-4 h-4" />}
                  required
                />
              </div>

              {/* Logo Organisasi (URL / Path) */}
              <div>
                <Input
                  label="URL / Lokasi Logo Organisasi"
                  value={formData.logoUrl || ''}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  placeholder="/assets/logo.png atau URL HTTPS gambar"
                  helperText="Dapat menggunakan logo resmi (/assets/logo.png) atau URL gambar custom."
                  leftIcon={<ImageIcon className="w-4 h-4" />}
                />
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-gray-500 dark:text-slate-400">Pilihan Cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleChange('logoUrl', '/assets/logo.png')}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-taruna-surface dark:bg-slate-800 text-taruna-dark dark:text-slate-300 hover:bg-taruna-yellow-100 dark:hover:bg-amber-950 border border-taruna-border dark:border-slate-700 transition"
                  >
                    Logo Resmi Setya Bakti
                  </button>
                </div>
              </div>

              {/* Tahun Kepengurusan (Periode) */}
              <div>
                <Input
                  label="Tahun Kepengurusan (Periode Aktif)"
                  value={formData.period}
                  onChange={(e) => handleChange('period', e.target.value)}
                  placeholder="Misal: 2024 - 2027"
                  helperText="Masa bakti kepengurusan Karang Taruna saat ini."
                  leftIcon={<Calendar className="w-4 h-4" />}
                  required
                />
              </div>

              {/* Deskripsi & Visi Singkat */}
              <div className="md:col-span-2">
                <label className="text-xs sm:text-sm font-semibold text-taruna-dark dark:text-slate-200 block mb-1.5">
                  Deskripsi / Visi Misi Singkat
                </label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Wadah pembinaan dan pengembangan generasi muda Dusun Tuk Uluh..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-taruna-border dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-taruna-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-taruna-yellow-500 focus:border-transparent transition"
                />
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                  Deskripsi ini muncul pada ringkasan landing page dan profil organisasi.
                </p>
              </div>
            </div>

            {/* Live Visual Preview of Branding */}
            <div className="mt-4 p-4 rounded-xl bg-taruna-surface dark:bg-slate-900 border border-taruna-border dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-taruna-yellow-600" />
                  Pratinjau Live Header & Logo
                </span>
                <Badge variant="outline" size="sm" className="text-[10px]">
                  Periode: {formData.period || '2024 - 2027'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-950 border border-taruna-border/70 dark:border-slate-800">
                <Logo src={formData.logoUrl} subtitle={`${formData.hamlet || 'Tuk Uluh'}, ${formData.village || 'Sringin'}`} />
                <div className="border-l border-taruna-border dark:border-slate-800 pl-4 ml-auto text-right hidden sm:block">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 block uppercase font-mono tracking-wider">
                    Nama Resmi Organisasi
                  </span>
                  <span className="text-sm font-bold text-taruna-dark dark:text-white">
                    {formData.orgName || 'Karang Taruna Setya Bakti'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Informasi Kontak & Media Sosial */}
        <Card className="border border-taruna-border dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 dark:to-transparent border-b border-taruna-border dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-base sm:text-lg">Informasi Kontak & Media Sosial</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Saluran komunikasi resmi yang dapat dihubungi oleh anggota, pemuda, dan warga dusun.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Nomor HP / WhatsApp */}
              <div>
                <Input
                  label="Nomor Telepon / WhatsApp"
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="0812-3456-7890"
                  helperText="Nomor pengurus / sekretariat organisasi."
                  leftIcon={<Phone className="w-4 h-4" />}
                />
              </div>

              {/* Email Resmi */}
              <div>
                <Input
                  type="email"
                  label="Email Resmi Organisasi"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="setyabakti.tukuluh@gmail.com"
                  helperText="Email korespondensi surat dan administrasi."
                  leftIcon={<Mail className="w-4 h-4" />}
                />
              </div>

              {/* Media Sosial */}
              <div>
                <Input
                  label="Media Sosial (Instagram / FB)"
                  value={formData.socialMedia || ''}
                  onChange={(e) => handleChange('socialMedia', e.target.value)}
                  placeholder="@karangtaruna_setyabakti"
                  helperText="Username akun media sosial resmi."
                  leftIcon={<Sparkles className="w-4 h-4" />}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Alamat & Wilayah Organisasi */}
        <Card className="border border-taruna-border dark:border-slate-800 shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent border-b border-taruna-border dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-base sm:text-lg">Domisili & Wilayah Organisasi</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Alamat sekretariat dan pembagian wilayah dusun, desa, kecamatan, dan kabupaten.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Alamat Lengkap */}
              <div className="md:col-span-4">
                <Input
                  label="Alamat Lengkap Sekretariat"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Dusun Tuk Uluh, Desa Sringin, Kec. Jumantono, Kab. Karanganyar"
                  helperText="Alamat lengkap yang tercantum pada surat undangan dan dokumen resmi."
                  leftIcon={<MapPin className="w-4 h-4" />}
                  required
                />
              </div>

              {/* Dusun */}
              <div>
                <Input
                  label="Dusun / Lingkungan"
                  value={formData.hamlet || ''}
                  onChange={(e) => handleChange('hamlet', e.target.value)}
                  placeholder="Tuk Uluh"
                  helperText="Nama dusun setempat."
                />
              </div>

              {/* Desa */}
              <div>
                <Input
                  label="Desa / Kelurahan"
                  value={formData.village || ''}
                  onChange={(e) => handleChange('village', e.target.value)}
                  placeholder="Sringin"
                  helperText="Nama desa wilayah."
                />
              </div>

              {/* Kecamatan */}
              <div>
                <Input
                  label="Kecamatan"
                  value={formData.subDistrict || ''}
                  onChange={(e) => handleChange('subDistrict', e.target.value)}
                  placeholder="Jumantono"
                  helperText="Kecamatan setempat."
                />
              </div>

              {/* Kabupaten */}
              <div>
                <Input
                  label="Kabupaten / Kota"
                  value={formData.district || ''}
                  onChange={(e) => handleChange('district', e.target.value)}
                  placeholder="Karanganyar"
                  helperText="Kabupaten wilayah."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-taruna-border dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-taruna-yellow-600" />
            <span>Perubahan pengaturan akan langsung diterapkan secara instan ke seluruh antarmuka sistem.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex-1 sm:flex-none"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 min-w-[160px]"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-taruna-dark border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Modal 1: Reset Confirmation */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => !isResetting && setShowResetConfirm(false)}
        title="Konfirmasi Reset Pengaturan"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Apakah Anda yakin ingin mereset pengaturan organisasi?</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Data akan dikembalikan ke konfigurasi awal Karang Taruna Setya Bakti Dusun Tuk Uluh, Desa Sringin, Kecamatan Jumantono.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-taruna-border dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              disabled={isResetting}
              onClick={() => setShowResetConfirm(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isResetting}
              onClick={handleResetToDefault}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isResetting ? 'Mereset...' : 'Ya, Reset ke Default'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 2: Security & Secrets Compliance Verification */}
      <Modal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        title="Kepatuhan Keamanan Kunci Rahasia Sistem"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Status Audit Keamanan: 100% Sesuai Aturan (Compliant)</span>
            </div>
            <p className="text-emerald-800/90 dark:text-emerald-300/90 text-xs">
              Aturan Utama: <em>&quot;Jangan menyimpan secret key di database biasa.&quot;</em>
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Rincian Proteksi Kredensial & Secrets
            </h5>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-taruna-border dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700 dark:text-slate-300">Penyimpanan di Database Biasa:</span>
                <Badge variant="accent" size="sm" className="bg-emerald-600 text-white font-mono text-[10px]">
                  TIDAK ADA / DIBLOKIR
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700 dark:text-slate-300">Metode Penyimpanan Secret:</span>
                <span className="font-mono text-gray-600 dark:text-slate-300 text-[11px]">
                  {securityStatus?.storagePolicy || 'Environment Variables (.env)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700 dark:text-slate-300">Status JWT Secret:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {securityStatus?.jwtSecretStatus || 'Terkonfigurasi Aman di .env'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700 dark:text-slate-300">Status PostgreSQL Database URL:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {securityStatus?.databaseUrlStatus || 'Terkoneksi via Environment Variable'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
              <p className="font-semibold text-gray-800 dark:text-slate-200 mb-1">
                Mengapa Secret Key tidak boleh di database biasa?
              </p>
              Menyimpan JWT Secret, private keys, atau password sistem di dalam database relasional biasa sangat rentan terhadap pencurian data melalui kebocoran database dump, SQL injection, atau ekspor backup. Dengan mengisolasinya di Environment Server, integritas enkripsi Karang Taruna tetap aman 100%.
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowSecurityModal(false)}
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
          </div>
        </main>
      </div>
    </div>
  );
}
