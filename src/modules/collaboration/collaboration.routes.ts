import { Router } from "express";
import {
    createRoom,
    getActiveRooms,
    getRoomDetail,
    joinRoom,
    leaveRoom,
    addTranscript,
    getRoomHistory,
} from "./collaboration.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

/**
 * @openapi
 * /api/collaborations:
 *   get:
 *     summary: Mengambil daftar room kolaborasi yang sedang aktif dari user dan teman
 *     tags: [Collaborations]
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar room aktif
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Membuat room kolaborasi baru
 *     tags: [Collaborations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Collaboration Room 1"
 *     responses:
 *       201:
 *         description: Room berhasil dibuat
 */
router.get("/", getActiveRooms);
router.post("/", createRoom);

/**
 * @openapi
 * /api/collaborations/history:
 *   get:
 *     summary: Mengambil riwayat sesi room yang sudah berakhir beserta transkripnya
 *     tags: [Collaborations]
 *     responses:
 *       200:
 *         description: Berhasil mengambil riwayat room
 */
router.get("/history", getRoomHistory);

/**
 * @openapi
 * /api/collaborations/{roomId}:
 *   get:
 *     summary: Mengambil detail room, daftar peserta aktif, dan riwayat transkrip
 *     tags: [Collaborations]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail room ditemukan
 *       403:
 *         description: Bukan teman pembuat room
 *       404:
 *         description: Room tidak ditemukan
 */
router.get("/:roomId", getRoomDetail);

/**
 * @openapi
 * /api/collaborations/{roomId}/join:
 *   post:
 *     summary: Bergabung ke room kolaborasi milik teman
 *     tags: [Collaborations]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil bergabung ke room
 *       403:
 *         description: Harus berteman dengan host terlebih dahulu
 *       404:
 *         description: Room tidak ditemukan
 */
router.post("/:roomId/join", joinRoom);

/**
 * @openapi
 * /api/collaborations/{roomId}/leave:
 *   post:
 *     summary: Keluar dari room (jika Host keluar, room otomatis berakhir)
 *     tags: [Collaborations]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Berhasil keluar atau mengakhiri room
 *       404:
 *         description: Room tidak ditemukan
 */
router.post("/:roomId/leave", leaveRoom);

/**
 * @openapi
 * /api/collaborations/{roomId}/transcripts:
 *   post:
 *     summary: Menyimpan hasil transkrip kalimat ke dalam room
 *     tags: [Collaborations]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "Halo semuanya, kali ini saya akan menjelaskan materi sebelumnya."
 *     responses:
 *       201:
 *         description: Transkrip berhasil disimpan
 */
router.post("/:roomId/transcripts", addTranscript);

export default router;