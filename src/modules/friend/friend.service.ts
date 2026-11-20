import { friendRepository } from './friend.repository';

export class FriendServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const friendService = {
    async searchUsers(currentUserId: string, keyword: string) {
        const trimmedKeyword = keyword.trim();
        if (!trimmedKeyword) {
            return [];
        }

        const users = await friendRepository.searchUsers(currentUserId, trimmedKeyword);

        return users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            isFriend:
                user.sentFriendships.length > 0 || user.receivedFriendships.length > 0,
        }));
    },

    async addFriend(currentUserId: string, friendId: string) {
        if (!friendId) {
            throw new FriendServiceError('friendId wajib diisi', 400);
        }

        if (currentUserId === friendId) {
            throw new FriendServiceError('Tidak dapat menambahkan diri sendiri sebagai teman', 400);
        }

        const targetUser = await friendRepository.findUserById(friendId);
        if (!targetUser) {
            throw new FriendServiceError('Pengguna tidak ditemukan', 404);
        }

        const existingFriendship = await friendRepository.findFriendshipBetween(
            currentUserId,
            friendId
        );
        if (existingFriendship) {
            throw new FriendServiceError('Pengguna sudah berada dalam daftar teman', 409);
        }

        const friendship = await friendRepository.createFriendship(currentUserId, friendId);

        return {
            friendshipId: friendship.id,
            friend: friendship.receiver,
            createdAt: friendship.createdAt,
        };
    },

    async getFriends(currentUserId: string) {
        const friendships = await friendRepository.findAllFriendshipsByUserId(currentUserId);

        return friendships.map((item) => {
            const friendProfile =
                item.senderId === currentUserId ? item.receiver : item.sender;

            return {
                friendshipId: item.id,
                ...friendProfile,
                addedAt: item.createdAt,
            };
        });
    },

    async removeFriend(currentUserId: string, friendId: string) {
        const existingFriendship = await friendRepository.findFriendshipBetween(
            currentUserId,
            friendId
        );

        if (!existingFriendship) {
            throw new FriendServiceError('Relasi pertemanan tidak ditemukan', 404);
        }

        await friendRepository.deleteFriendshipById(existingFriendship.id);
    },
};