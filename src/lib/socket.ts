import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth";
import { collaborationService } from "../modules/collaboration/collaboration.service";

export const initSocket = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "*",
            credentials: true,
        },
    });

    // Middleware autentikasi Better Auth untuk koneksi WebSocket
    io.use(async (socket, next) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(socket.handshake.headers),
            });

            if (!session || !session.user) {
                return next(new Error("Unauthorized"));
            }

            socket.data.user = session.user;
            next();
        } catch (error) {
            next(new Error("Authentication failed"));
        }
    });

    io.on("connection", (socket: Socket) => {
        const user = socket.data.user;

        // 1. User masuk ke channel room
        socket.on("join_room", async (roomId: string) => {
            try {
                await collaborationService.getRoomDetail(user.id, roomId);
                socket.join(roomId);

                const roomSockets = await io.in(roomId).fetchSockets();
                io.to(roomId).emit("participant_count", {
                    roomId,
                    count: roomSockets.length,
                });
            } catch (error: any) {
                socket.emit("error_message", { message: error.message });
            }
        });

        // 2. Streaming teks berjalan saat guru masih berbicara (tidak masuk DB)
        socket.on(
            "transcript_interim",
            (payload: { roomId: string; text: string }) => {
                socket.to(payload.roomId).emit("transcript_interim", {
                    speakerId: user.id,
                    speakerName: user.name,
                    text: payload.text,
                });
            }
        );

        // 3. Teks kalimat selesai -> simpan ke DB & broadcast ke semua peserta
        socket.on(
            "transcript_final",
            async (payload: { roomId: string; text: string }) => {
                try {
                    const saved = await collaborationService.saveTranscript(
                        user.id,
                        payload.roomId,
                        payload.text
                    );

                    io.to(payload.roomId).emit("transcript_final", {
                        id: saved.id,
                        speakerId: user.id,
                        speakerName: user.name,
                        text: saved.text,
                        createdAt: saved.createdAt,
                    });
                } catch (error: any) {
                    socket.emit("error_message", { message: error.message });
                }
            }
        );

        // 4. User keluar dari room atau Host mengakhiri sesi
        socket.on("leave_room", async (roomId: string) => {
            socket.leave(roomId);

            const roomSockets = await io.in(roomId).fetchSockets();
            io.to(roomId).emit("participant_count", {
                roomId,
                count: roomSockets.length,
            });
        });

        socket.on("room_ended", (roomId: string) => {
            io.to(roomId).emit("room_ended", {
                roomId,
                message: "Sesi kolaborasi telah diakhiri oleh Host",
            });
        });
    });

    return io;
};