import { Router } from "express";
import { searchUsers, getFriends, addFriend, removeFriend } from "./friend.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/friends/search:
 *   get:
 *     summary: Mencari pengguna berdasarkan nama atau email
 *     tags: [Friends]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         example: "Budi"
 *     responses:
 *       200:
 *         description: Pencarian pengguna berhasil
 *       401:
 *         description: Unauthorized
 */
router.get("/search", searchUsers);

/**
 * @openapi
 * /api/friends:
 *   get:
 *     summary: Mengambil semua daftar teman
 *     tags: [Friends]
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar teman
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Menambahkan teman baru
 *     tags: [Friends]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - friendId
 *             properties:
 *               friendId:
 *                 type: string
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       201:
 *         description: Teman berhasil ditambahkan
 *       400:
 *         description: Input tidak valid atau menambahkan diri sendiri
 *       404:
 *         description: Pengguna tidak ditemukan
 *       409:
 *         description: Pengguna sudah menjadi teman
 */
router.get("/", getFriends);
router.post("/", addFriend);

/**
 * @openapi
 * /api/friends/{friendId}:
 *   delete:
 *     summary: Menghapus teman berdasarkan ID pengguna
 *     tags: [Friends]
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Teman berhasil dihapus
 *       404:
 *         description: Relasi pertemanan tidak ditemukan
 */
router.delete("/:friendId", removeFriend);

export default router;