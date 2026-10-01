import { Request, Response, NextFunction } from 'express';
import { MemberService } from '../services/member.service';
import { sendSuccess } from '../utils/response';
import { Gender, MemberStatus } from '@prisma/client';

export class MemberController {
  /**
   * GET /api/members
   * Melihat seluruh anggota dengan fitur search, filter status, dan pagination
   */
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, status, gender, page, limit, sortBy, sortOrder } = req.query as {
        search?: string;
        status?: MemberStatus;
        gender?: Gender;
        page?: string;
        limit?: string;
        sortBy?: 'name' | 'memberNumber' | 'createdAt' | 'joinDate';
        sortOrder?: 'asc' | 'desc';
      };

      const result = await MemberService.getAllMembers({
        search,
        status,
        gender,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sortBy,
        sortOrder,
      });

      sendSuccess(res, 'Berhasil memuat daftar anggota', result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/members/:id
   * Melihat detail anggota berdasarkan ID
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const member = await MemberService.getMemberById(id as string);

      sendSuccess(res, 'Berhasil memuat data detail anggota', member, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/members
   * Menambahkan anggota baru (ADMIN only)
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newMember = await MemberService.createMember(req.body);

      sendSuccess(res, 'Data anggota baru berhasil ditambahkan', newMember, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/members/:id
   * Mengubah data anggota (ADMIN only)
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updatedMember = await MemberService.updateMember(id as string, req.body);

      sendSuccess(res, 'Data anggota berhasil diperbarui', updatedMember, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/members/:id/status
   * Mengubah status aktif / nonaktif anggota (ADMIN only)
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedMember = await MemberService.updateMemberStatus(id as string, status);

      sendSuccess(
        res,
        `Status anggota berhasil diubah menjadi ${status === MemberStatus.ACTIVE ? 'AKTIF' : 'TIDAK AKTIF'}`,
        updatedMember,
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/members/:id
   * Menghapus atau menonaktifkan anggota (ADMIN only)
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await MemberService.deleteMember(id as string);

      sendSuccess(res, result.message, result, 200);
    } catch (error) {
      next(error);
    }
  }
}
