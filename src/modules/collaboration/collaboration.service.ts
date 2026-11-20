import { collaborationRepository } from "./colaboration.repository";

export class CollaborationServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const collaborationService = {
    async createRoom(userId: string, title?: string) {
        const roomTitle = title?.trim() || "Collaboration Room";
        return collaborationRepository.createRoom(userId, roomTitle);
    },

    async getActiveRooms(userId: string) {
        const friendIds = await collaborationRepository.findFriendIdsByUserId(userId);
        const allowedHostIds = [userId, ...friendIds];

        const rooms = await collaborationRepository.findActiveRoomsByHostIds(
            allowedHostIds
        );

        return rooms.map((room) => ({
            id: room.id,
            title: room.title,
            hostId: room.hostId,
            host: room.host,
            isActive: room.isActive,
            activeParticipantsCount: room._count.participants,
            createdAt: room.createdAt,
        }));
    },

    async joinRoom(userId: string, roomId: string) {
        const room = await collaborationRepository.findRoomById(roomId);
        if (!room) {
            throw new CollaborationServiceError("Room tidak ditemukan", 404);
        }

        if (!room.isActive) {
            throw new CollaborationServiceError("Sesi room sudah berakhir", 400);
        }

        const isAllowed = await collaborationRepository.areUsersFriends(
            userId,
            room.hostId
        );
        if (!isAllowed) {
            throw new CollaborationServiceError(
                "Kamu harus berteman dengan pembuat room terlebih dahulu",
                403
            );
        }

        await collaborationRepository.upsertParticipant(roomId, userId);

        return collaborationRepository.findRoomById(roomId);
    },

    async getRoomDetail(userId: string, roomId: string) {
        const room = await collaborationRepository.findRoomById(roomId);
        if (!room) {
            throw new CollaborationServiceError("Room tidak ditemukan", 404);
        }

        const isAllowed = await collaborationRepository.areUsersFriends(
            userId,
            room.hostId
        );
        if (!isAllowed) {
            throw new CollaborationServiceError(
                "Kamu tidak memiliki akses ke room ini",
                403
            );
        }

        return {
            ...room,
            activeParticipantsCount: room.participants.length,
        };
    },

    async leaveRoom(userId: string, roomId: string) {
        const room = await collaborationRepository.findRoomById(roomId);
        if (!room) {
            throw new CollaborationServiceError("Room tidak ditemukan", 404);
        }

        if (room.hostId === userId) {
            await collaborationRepository.endRoom(roomId);
            return {
                roomEnded: true,
                message: "Room telah diakhiri oleh Host",
            };
        }

        await collaborationRepository.markParticipantLeft(roomId, userId);
        return {
            roomEnded: false,
            message: "Berhasil keluar dari room",
        };
    },

    async saveTranscript(userId: string, roomId: string, text: string) {
        const cleanText = text?.trim();
        if (!cleanText) {
            throw new CollaborationServiceError("Teks transkrip tidak boleh kosong", 400);
        }

        const room = await collaborationRepository.findRoomById(roomId);
        if (!room) {
            throw new CollaborationServiceError("Room tidak ditemukan", 404);
        }

        if (!room.isActive) {
            throw new CollaborationServiceError("Sesi room sudah berakhir", 400);
        }

        const isParticipant = room.participants.some((p) => p.userId === userId);
        if (!isParticipant && room.hostId !== userId) {
            throw new CollaborationServiceError(
                "Kamu bukan peserta aktif di room ini",
                403
            );
        }

        return collaborationRepository.createTranscript(roomId, userId, cleanText);
    },

    async getRoomHistory(userId: string) {
        return collaborationRepository.findRoomHistoryByUserId(userId);
    },
};