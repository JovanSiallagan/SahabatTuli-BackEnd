import prisma from "../../config/prisma";

export const collaborationRepository = {
    async findFriendIdsByUserId(userId: string): Promise<string[]> {
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            select: {
                senderId: true,
                receiverId: true,
            },
        });

        return friendships.map((f) =>
            f.senderId === userId ? f.receiverId : f.senderId
        );
    },

    async areUsersFriends(userIdA: string, userIdB: string): Promise<boolean> {
        if (userIdA === userIdB) return true;

        const friendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { senderId: userIdA, receiverId: userIdB },
                    { senderId: userIdB, receiverId: userIdA },
                ],
            },
            select: { id: true },
        });

        return Boolean(friendship);
    },

    async createRoom(hostId: string, title: string) {
        return prisma.collaborationRoom.create({
            data: {
                title,
                hostId,
                isActive: true,
                participants: {
                    create: {
                        userId: hostId,
                    },
                },
            },
            include: {
                host: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });
    },

    async findActiveRoomsByHostIds(hostIds: string[]) {
        return prisma.collaborationRoom.findMany({
            where: {
                isActive: true,
                hostId: { in: hostIds },
            },
            include: {
                host: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                _count: {
                    select: {
                        participants: {
                            where: { leftAt: null },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    },

    async findRoomById(roomId: string) {
        return prisma.collaborationRoom.findUnique({
            where: { id: roomId },
            include: {
                host: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                participants: {
                    where: { leftAt: null },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                    orderBy: {
                        joinedAt: "asc",
                    },
                },
                transcripts: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });
    },

    async upsertParticipant(roomId: string, userId: string) {
        return prisma.roomParticipant.upsert({
            where: {
                roomId_userId: {
                    roomId,
                    userId,
                },
            },
            update: {
                leftAt: null,
                joinedAt: new Date(),
            },
            create: {
                roomId,
                userId,
            },
        });
    },

    async markParticipantLeft(roomId: string, userId: string) {
        return prisma.roomParticipant.updateMany({
            where: {
                roomId,
                userId,
                leftAt: null,
            },
            data: {
                leftAt: new Date(),
            },
        });
    },

    async endRoom(roomId: string) {
        const now = new Date();

        return prisma.$transaction(async (tx) => {
            await tx.roomParticipant.updateMany({
                where: {
                    roomId,
                    leftAt: null,
                },
                data: {
                    leftAt: now,
                },
            });

            return tx.collaborationRoom.update({
                where: { id: roomId },
                data: {
                    isActive: false,
                    endedAt: now,
                },
            });
        });
    },

    async createTranscript(roomId: string, speakerId: string, text: string) {
        return prisma.roomTranscript.create({
            data: {
                roomId,
                speakerId,
                text,
            },
        });
    },

    async findRoomHistoryByUserId(userId: string) {
        return prisma.collaborationRoom.findMany({
            where: {
                isActive: false,
                OR: [
                    { hostId: userId },
                    { participants: { some: { userId } } },
                ],
            },
            include: {
                host: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                transcripts: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
            orderBy: {
                endedAt: "desc",
            },
        });
    },
};