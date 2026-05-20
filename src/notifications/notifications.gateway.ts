/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { NotificationPayload } from "./notifications.service";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? "http://localhost:3001",
    credentials: true,
  },
  namespace: "/notifications",
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  @SubscribeMessage("join-room")
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(room);
    this.logger.log(`Client ${client.id} a rejoint la room: ${room}`);
  }

  afterInit() {
    this.logger.log("WebSocket Gateway initialisé (/notifications)");
  }

  sendToAdmins(payload: NotificationPayload) {
    this.logger.log(`📨 [sendToAdmins] Message: ${payload.message}`);
    this.server.to("admins").emit(payload.event, payload);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté : ${client.id}`);
  }

  /** Broadcast à tous les clients connectés */
  sendNotification(payload: NotificationPayload) {
    this.server.emit(payload.event, payload);
    this.logger.debug(`[${payload.event}] ${payload.message}`);
  }

  /** Envoi ciblé à un utilisateur (room = email) */
  sendToUser(email: string, payload: NotificationPayload) {
    this.logger.log(`📨 [sendToUser] Destinataire: "${email}"`);
    this.logger.log(`📨 [sendToUser] Message: ${payload.message}`);
    this.logger.log(`📨 [sendToUser] Événement: ${payload.event}`);

    // ✅ Version corrigée - sans accéder à adapter.rooms
    // Vérifier si le serveur est initialisé
    if (!this.server) {
      this.logger.error(`❌ Server non initialisé pour l'envoi à ${email}`);
      return;
    }

    // Envoyer à la room
    this.server.to(email).emit(payload.event, payload);
    this.logger.log(`✅ Notification envoyée à la room: ${email}`);
  }
}
