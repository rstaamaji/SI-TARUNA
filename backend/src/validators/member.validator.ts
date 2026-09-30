import { z } from 'zod';

export const createMemberSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Nama anggota wajib diisi' })
      .min(2, 'Nama minimal 2 karakter')
      .max(100, 'Nama maksimal 100 karakter'),
    gender: z.enum(['MALE', 'FEMALE'], {
      required_error: 'Jenis kelamin wajib dipilih (MALE / FEMALE)',
    }),
    phone: z
      .string()
      .regex(/^[0-9+-\s]{8,20}$/, 'Format nomor HP tidak valid')
      .optional()
      .nullable()
      .or(z.literal('')),
    address: z
      .string({ required_error: 'Alamat anggota wajib diisi' })
      .min(3, 'Alamat minimal 3 karakter')
      .max(255, 'Alamat maksimal 255 karakter'),
    status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE').optional(),
    memberNumber: z.string().optional(),
    joinDate: z.string().optional(),
  }),
});

export const updateMemberSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID anggota tidak valid'),
  }),
  body: z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter').max(100).optional(),
    gender: z.enum(['MALE', 'FEMALE']).optional(),
    phone: z
      .string()
      .regex(/^[0-9+-\s]{8,20}$/, 'Format nomor HP tidak valid')
      .optional()
      .nullable()
      .or(z.literal('')),
    address: z.string().min(3, 'Alamat minimal 3 karakter').max(255).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    memberNumber: z.string().optional(),
    joinDate: z.string().optional(),
  }),
});

export const getMemberByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID anggota tidak valid'),
  }),
});

export const memberQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    gender: z.enum(['MALE', 'FEMALE']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.enum(['name', 'memberNumber', 'createdAt', 'joinDate']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const toggleStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID anggota tidak valid'),
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE'], {
      required_error: 'Status wajib diisi (ACTIVE / INACTIVE)',
    }),
  }),
});
