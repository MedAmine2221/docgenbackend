/* eslint-disable @typescript-eslint/require-await */
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { NotificationsGateway } from "./notifications.gateway";
import { UserService } from "src/user/service/user.service";

export type NotificationEvent =
  | "doc:created"
  | "doc:updated"
  | "doc:deleted"
  | "user:created"
  | "user:updated"
  | "user:deleted"
  | "api:created"
  | "api:updated"
  | "api:deleted"
  | "activity:logged"
  | "email:sent";

export interface NotificationPayload {
  event: NotificationEvent;
  message: string;
  data?: Record<string, any>;
  triggeredBy?: string; // email de l'utilisateur qui a déclenché l'action
  timestamp?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly gateway: NotificationsGateway,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  emit(payload: NotificationPayload) {
    this.gateway.sendNotification({
      ...payload,
      timestamp: payload.timestamp ?? new Date().toISOString(),
    });
  }

  private async emitTargeted(
    payload: NotificationPayload,
    triggeredByEmail: string,
    docCreatorEmail?: string,
  ) {
    const actor = await this.userService.findUserByMail(triggeredByEmail);
    const roleName = actor?.role?.name_eng?.toLowerCase() ?? "";

    const isAdmin =
      roleName.includes("admin") || roleName.includes("administrateur");

    if (isAdmin && docCreatorEmail) {
      // ✅ Admin agit → notifier uniquement le CRÉATEUR du document (le développeur)
      this.gateway.sendToUser(docCreatorEmail, payload);
    } else if (
      !isAdmin &&
      docCreatorEmail &&
      triggeredByEmail !== docCreatorEmail
    ) {
      // ✅ Développeur agit sur le document d'un AUTRE développeur → notifier le créateur
      this.gateway.sendToUser(docCreatorEmail, payload);
    } else if (!isAdmin && !docCreatorEmail) {
      // ✅ Développeur agit (pas de créateur spécifique) → notifier tous les admins
      this.gateway.sendToAdmins(payload);
    } else if (!isAdmin && triggeredByEmail === docCreatorEmail) {
      // ✅ Développeur agit sur son PROPRE document → ne rien faire (pas d'auto-notification)
      // Ou optionnellement notifier les admins pour audit
      // this.gateway.sendToAdmins(payload);
    } else {
      // Fallback: notifier les admins
      this.gateway.sendToAdmins(payload);
    }
  }

  // ─── Helpers doc ─────────────────────────────────────────────────

  async notifyDocCreated(
    docId: string,
    title: string,
    triggeredBy: string,
    creatorEmail?: string,
  ) {
    const payload: NotificationPayload = {
      event: "doc:created",
      message: `Document "${title}" créé`,
      data: { docId, title },
      triggeredBy,
      timestamp: new Date().toISOString(),
    };

    // Pour la création, notifier les admins
    const actor = await this.userService.findUserByMail(triggeredBy);
    const isAdmin = actor?.role?.name_eng?.toLowerCase().includes("admin");

    if (isAdmin && creatorEmail) {
      // Admin crée un doc pour un développeur → notifier le développeur
      this.gateway.sendToUser(creatorEmail, payload);
    } else if (!isAdmin) {
      // Développeur crée un doc → notifier les admins
      this.gateway.sendToAdmins(payload);
    }
  }

  async notifyDocUpdated(
    docId: string,
    title: string,
    triggeredBy: string,
    creatorEmail?: string,
  ) {
    const payload: NotificationPayload = {
      event: "doc:updated",
      message: `Document "${title}" mis à jour`,
      data: { docId, title },
      triggeredBy,
      timestamp: new Date().toISOString(),
    };

    const actor = await this.userService.findUserByMail(triggeredBy);
    const isAdmin = actor?.role?.name_eng?.toLowerCase().includes("admin");

    if (isAdmin && creatorEmail && triggeredBy !== creatorEmail) {
      // Admin modifie le doc d'un développeur → notifier le développeur
      this.gateway.sendToUser(creatorEmail, payload);
    } else if (!isAdmin && creatorEmail && triggeredBy !== creatorEmail) {
      // Développeur modifie le doc d'un autre développeur → notifier le créateur
      this.gateway.sendToUser(creatorEmail, payload);
    } else if (!isAdmin && creatorEmail && triggeredBy === creatorEmail) {
      // Développeur modifie son propre doc → optionnel: notifier admins pour audit
      this.gateway.sendToAdmins(payload);
    } else {
      this.gateway.sendToAdmins(payload);
    }
  }

  async notifyDocDeleted(
    docId: string,
    title: string,
    triggeredBy: string,
    creatorEmail?: string,
  ) {
    const payload: NotificationPayload = {
      event: "doc:deleted",
      message: `Document "${title}" supprimé`,
      data: { docId, title },
      triggeredBy,
      timestamp: new Date().toISOString(),
    };

    const actor = await this.userService.findUserByMail(triggeredBy);
    const isAdmin = actor?.role?.name_eng?.toLowerCase().includes("admin");

    if (isAdmin && creatorEmail && triggeredBy !== creatorEmail) {
      // Admin supprime le doc d'un développeur → notifier le développeur
      this.gateway.sendToUser(creatorEmail, payload);
    } else if (!isAdmin && creatorEmail && triggeredBy !== creatorEmail) {
      // Développeur supprime le doc d'un autre développeur → notifier le créateur
      this.gateway.sendToUser(creatorEmail, payload);
    } else if (!isAdmin && creatorEmail && triggeredBy === creatorEmail) {
      // Développeur supprime son propre doc → notifier les admins
      this.gateway.sendToAdmins(payload);
    } else {
      this.gateway.sendToAdmins(payload);
    }
  }

  async notifyUserCreated(
    userId: string,
    userEmail: string,
    triggeredBy: string,
  ) {
    const payload: NotificationPayload = {
      event: "user:created",
      message: `Nouvel utilisateur : ${userEmail}`,
      data: { userId, userEmail },
      triggeredBy,
      timestamp: new Date().toISOString(),
    };

    // Notifier tous les admins
    this.gateway.sendToAdmins(payload);
  }

  async notifyUserUpdated(
    userId: string,
    userEmail: string,
    triggeredBy: string,
    targetUserEmail?: string, // L'utilisateur qui a été modifié
  ) {
    const actor = await this.userService.findUserByMail(triggeredBy);
    const isAdmin = actor?.role?.name_eng?.toLowerCase().includes("admin");

    console.log("📣 notifyUserUpdated:", {
      triggeredBy,
      targetUserEmail,
      isAdmin,
      userEmail,
    });

    // ✅ IMPORTANT: Le message doit être personnalisé
    const payload: NotificationPayload = {
      event: "user:updated",
      message:
        isAdmin && targetUserEmail !== triggeredBy
          ? `Votre profil a été modifié par ${triggeredBy}`
          : `Profil utilisateur "${userEmail}" mis à jour`,
      data: { userId, userEmail },
      triggeredBy,
      timestamp: new Date().toISOString(),
    };

    if (isAdmin && targetUserEmail && targetUserEmail !== triggeredBy) {
      // ✅ Admin modifie un utilisateur → notifier l'utilisateur modifié
      console.log(`✅ Envoi notification à l'utilisateur: ${targetUserEmail}`);
      this.gateway.sendToUser(targetUserEmail, payload);
    } else if (targetUserEmail === triggeredBy) {
      // L'utilisateur modifie son propre profil → notifier les admins
      console.log(
        `✅ Utilisateur modifie son propre profil, notification aux admins`,
      );
      this.gateway.sendToAdmins(payload);
    } else {
      // Fallback → notifier les admins
      console.log(`✅ Fallback: notification aux admins`);
      this.gateway.sendToAdmins(payload);
    }
  }
  // notifications.service.ts
  async notifyUserDeleted(
    userId: string,
    userEmail: string,
    triggeredBy: string,
    targetUserEmail?: string,
  ) {
    const actor = await this.userService.findUserByMail(triggeredBy);
    const isAdmin = actor?.role?.name_eng?.toLowerCase().includes("admin");

    console.log("📣 notifyUserDeleted:", {
      triggeredBy,
      targetUserEmail,
      isAdmin,
      userEmail,
    });

    const payload: NotificationPayload = {
      event: "user:deleted",
      message:
        isAdmin && targetUserEmail !== triggeredBy
          ? `Votre compte a été supprimé par ${triggeredBy}`
          : `Utilisateur "${userEmail}" supprimé`,
      data: { userId, userEmail },
      triggeredBy,
      timestamp: new Date().toISOString(),
    };

    if (isAdmin && targetUserEmail && targetUserEmail !== triggeredBy) {
      // ✅ Admin supprime un utilisateur → notifier l'utilisateur supprimé
      console.log(`✅ Envoi notification de suppression à: ${targetUserEmail}`);
      this.gateway.sendToUser(targetUserEmail, payload);
    } else if (targetUserEmail === triggeredBy) {
      // L'utilisateur supprime son propre compte → notifier les admins
      console.log(
        `✅ Utilisateur supprime son propre compte, notification aux admins`,
      );
      this.gateway.sendToAdmins(payload);
    } else {
      // Fallback → notifier les admins
      console.log(`✅ Fallback: notification aux admins`);
      this.gateway.sendToAdmins(payload);
    }
  }
  notifyApiCreated(apiId: string, name: string, triggeredBy?: string) {
    this.emit({
      event: "api:created",
      message: `API "${name}" créée`,
      data: { apiId, name },
      triggeredBy,
    });
  }

  notifyApiUpdated(apiId: string, name: string, triggeredBy?: string) {
    this.emit({
      event: "api:updated",
      message: `API "${name}" mise à jour`,
      data: { apiId, name },
      triggeredBy,
    });
  }

  notifyApiDeleted(apiId: string, name: string, triggeredBy?: string) {
    this.emit({
      event: "api:deleted",
      message: `API "${name}" supprimée`,
      data: { apiId, name },
      triggeredBy,
    });
  }

  notifyActivityLogged(userId: string, action: string) {
    this.emit({
      event: "activity:logged",
      message: `Activité : ${action}`,
      data: { userId, action },
    });
  }

  notifyEmailSent(to: string, subject: string, triggeredBy?: string) {
    this.emit({
      event: "email:sent",
      message: `Email envoyé à ${to} : "${subject}"`,
      data: { to, subject },
      triggeredBy,
    });
  }
}
