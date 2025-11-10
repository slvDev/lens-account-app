// src/services/walletConnectService.ts
import { WalletKit, IWalletKit, WalletKitTypes } from "@reown/walletkit";
import { Core } from "@walletconnect/core";
import { ICore, SessionTypes, SignClientTypes } from "@walletconnect/types";
import { ErrorResponse, JsonRpcResponse } from "@walletconnect/jsonrpc-utils";
import EventEmitter from "events";

// --- Export Enums and Interfaces ---
export enum ServiceEvents {
  Initialized = "initialized",
  PairStatus = "pair_status",
  SessionProposal = "session_proposal",
  SessionConnect = "session_connect",
  SessionDelete = "session_delete",
  SessionRequest = "session_request", // <<<--- ADDED
  Error = "error",
  SessionsUpdated = "sessions_updated",
  IS_LOADING = "is_loading",
  IS_PAIRING = "is_pairing",
}

export interface WalletConnectServiceEvents {
  [ServiceEvents.Initialized]: (payload: { success: boolean; instance: IWalletKit | null }) => void;
  [ServiceEvents.PairStatus]: (payload: { status: "pairing" | "paired" | "error"; message?: string }) => void;
  [ServiceEvents.SessionProposal]: (payload: { proposal: WalletKitTypes.SessionProposal }) => void;
  [ServiceEvents.SessionConnect]: (payload: { session: SessionTypes.Struct }) => void;
  [ServiceEvents.SessionDelete]: (payload: { topic: string }) => void;
  [ServiceEvents.SessionRequest]: (payload: { request: WalletKitTypes.SessionRequest }) => void; // <<<--- ADDED
  [ServiceEvents.Error]: (payload: { message: string }) => void;
  [ServiceEvents.SessionsUpdated]: (payload: { sessions: Record<string, SessionTypes.Struct> }) => void;
  [ServiceEvents.IS_LOADING]: (payload: { isLoading: boolean }) => void;
  [ServiceEvents.IS_PAIRING]: (payload: { isPairing: boolean }) => void;
}
// ------------------------------------

// --- Export the Class Definition ---
export class WalletConnectService extends EventEmitter {
  private core: ICore | undefined;
  private walletKit: IWalletKit | undefined;
  private projectId: string;
  private metadata: WalletKitTypes.Metadata;
  private _isInitialized = false;
  private _isInitializing = false;
  private initPromise: Promise<IWalletKit> | null = null;

  constructor(projectId: string, metadata: WalletKitTypes.Metadata) {
    super();
    if (!projectId) {
      throw new Error("WalletConnectService: Project ID is required.");
    }
    this.projectId = projectId;
    this.metadata = JSON.parse(JSON.stringify(metadata));
  }

  // --- Getters (keep as before) ---
  public isInitialized(): boolean {
    return this._isInitialized;
  }
  public isInitializing(): boolean {
    return this._isInitializing;
  }
  public getWalletKitInstance(): IWalletKit | undefined {
    return this.walletKit;
  }
  public getActiveSessions(): Record<string, SessionTypes.Struct> {
    return this.walletKit?.getActiveSessions() || {};
  }

  // --- Core Initialization (Idempotent) ---
  async init(): Promise<IWalletKit> {
    if (this._isInitialized && this.walletKit) {
      this.emit(ServiceEvents.Initialized, { success: true, instance: this.walletKit });
      return this.walletKit;
    }
    if (this._isInitializing && this.initPromise) {
      return this.initPromise;
    }
    this._isInitializing = true;
    this.emit(ServiceEvents.IS_LOADING, { isLoading: true });
    this.initPromise = (async () => {
      try {
        this.core = new Core({ projectId: this.projectId });
        this.walletKit = await WalletKit.init({ core: this.core, metadata: this.metadata });
        this.setupInternalListeners();
        this._isInitialized = true;
        this.emit(ServiceEvents.Initialized, { success: true, instance: this.walletKit });
        this.emit(ServiceEvents.SessionsUpdated, { sessions: this.getActiveSessions() });
        return this.walletKit;
      } catch (error: unknown) {
        console.error("WalletConnectService: Initialization failed:", error);
        this._isInitialized = false;
        this.emit(ServiceEvents.Initialized, { success: false, instance: null });
        this.emit(ServiceEvents.Error, { message: `Initialization failed: ${(error as Error)?.message || "Unknown error"}` });
        throw error;
      } finally {
        this._isInitializing = false;
        this.emit(ServiceEvents.IS_LOADING, { isLoading: false });
        this.initPromise = null;
      }
    })();
    return this.initPromise;
  }

  private setupInternalListeners() {
    if (!this.walletKit) {
      console.error("WalletConnectService: Cannot setup listeners, WalletKit not ready.");
      return;
    }

    this.walletKit.off("session_proposal", this.handleSessionProposal);
    this.walletKit.on("session_proposal", this.handleSessionProposal);

    if (this.walletKit.engine?.signClient?.events) {
      this.walletKit.engine.signClient.events.off("session_connect", this.handleSessionConnect);
      this.walletKit.engine.signClient.events.on("session_connect", this.handleSessionConnect);
    } else {
      console.warn("WalletConnectService: SignClient events not available for session_connect listener.");
    }

    this.walletKit.off("session_delete", this.handleSessionDelete);
    this.walletKit.on("session_delete", this.handleSessionDelete);

    this.walletKit.off("session_request", this.handleSessionRequest);
    this.walletKit.on("session_request", this.handleSessionRequest);
  }

  // --- Event Handlers (bound methods) ---
  private handleSessionProposal = (proposal: WalletKitTypes.SessionProposal) => {
    this.emit(ServiceEvents.SessionProposal, { proposal });
    this.emit(ServiceEvents.IS_PAIRING, { isPairing: false });
  };

  private handleSessionConnect = (sessionArgs: SignClientTypes.EventArguments["session_connect"]) => {
    this.emit(ServiceEvents.SessionConnect, { session: sessionArgs.session });
    this.emit(ServiceEvents.SessionsUpdated, { sessions: this.getActiveSessions() });
  };

  private handleSessionDelete = (event: { id: number; topic: string }) => {
    this.emit(ServiceEvents.SessionDelete, { topic: event.topic });
    this.emit(ServiceEvents.SessionsUpdated, { sessions: this.getActiveSessions() });
  };

  private handleSessionRequest = (request: WalletKitTypes.SessionRequest) => {
    this.emit(ServiceEvents.SessionRequest, { request });
  };

  // --- Public Methods ---
  async pair(uri: string): Promise<void> {
    if (!this._isInitialized || !this.walletKit) throw new Error("WalletConnectService: Not initialized. Cannot pair.");
    this.emit(ServiceEvents.IS_PAIRING, { isPairing: true });
    this.emit(ServiceEvents.PairStatus, { status: "pairing" });
    try {
      await this.walletKit.pair({ uri });
    } catch (error: unknown) {
      console.error("WalletConnectService: Pairing failed:", error);
      const message = (error as Error).message || "Pairing failed";
      this.emit(ServiceEvents.PairStatus, { status: "error", message });
      this.emit(ServiceEvents.IS_PAIRING, { isPairing: false });
      this.emit(ServiceEvents.Error, { message });
      throw error;
    }
  }

  async approveSession(proposal: WalletKitTypes.SessionProposal, approvedNamespaces: SessionTypes.Namespaces): Promise<SessionTypes.Struct> {
    if (!this._isInitialized || !this.walletKit) throw new Error("WalletConnectService: Not initialized. Cannot approve session.");
    this.emit(ServiceEvents.IS_LOADING, { isLoading: true });
    try {
      const session = await this.walletKit.approveSession({ id: proposal.id, namespaces: approvedNamespaces });
      return session;
    } catch (error: unknown) {
      console.error("WalletConnectService: Failed to approve session:", error);
      this.emit(ServiceEvents.Error, { message: (error as Error).message || "Failed to approve session" });
      throw error;
    } finally {
      this.emit(ServiceEvents.IS_LOADING, { isLoading: false });
    }
  }

  async rejectSession(proposal: WalletKitTypes.SessionProposal, reason: ErrorResponse): Promise<void> {
    if (!this._isInitialized || !this.walletKit) throw new Error("WalletConnectService: Not initialized. Cannot reject session.");
    this.emit(ServiceEvents.IS_LOADING, { isLoading: true });
    try {
      await this.walletKit.rejectSession({ id: proposal.id, reason: reason });
    } catch (error: unknown) {
      console.error("WalletConnectService: Failed to reject session:", error);
      this.emit(ServiceEvents.Error, { message: (error as Error).message || "Failed to reject session" });
      throw error;
    } finally {
      this.emit(ServiceEvents.IS_LOADING, { isLoading: false });
    }
  }

  async disconnectSession(topic: string, reason: ErrorResponse): Promise<void> {
    if (!this._isInitialized || !this.walletKit) throw new Error("WalletConnectService: Not initialized. Cannot disconnect session.");
    this.emit(ServiceEvents.IS_LOADING, { isLoading: true });
    try {
      await this.walletKit.disconnectSession({ topic: topic, reason: reason });
    } catch (error: unknown) {
      console.error("WalletConnectService: Failed to disconnect session:", error);
      this.emit(ServiceEvents.Error, { message: (error as Error).message || "Failed to disconnect session" });
      throw error;
    } finally {
      this.emit(ServiceEvents.IS_LOADING, { isLoading: false });
    }
  }

  async respondSessionRequest(topic: string, response: JsonRpcResponse): Promise<void> {
    if (!this._isInitialized || !this.walletKit) {
      throw new Error("WalletConnectService: Not initialized. Cannot respond to request.");
    }
    this.emit(ServiceEvents.IS_LOADING, { isLoading: true });
    try {
      await this.walletKit.respondSessionRequest({ topic, response });
    } catch (error: unknown) {
      console.error("WalletConnectService: Failed to respond to session request:", error);
      this.emit(ServiceEvents.Error, { message: (error as Error).message || "Failed to respond to request" });
      throw error;
    } finally {
      this.emit(ServiceEvents.IS_LOADING, { isLoading: false });
    }
  }

  // Typed EventEmitter methods (Apply this pattern to on, once, off, removeListener)
  on<E extends keyof WalletConnectServiceEvents>(event: E, listener: WalletConnectServiceEvents[E]): this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.on(event, listener as (...args: any[]) => void);
  }

  once<E extends keyof WalletConnectServiceEvents>(event: E, listener: WalletConnectServiceEvents[E]): this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.once(event, listener as (...args: any[]) => void);
  }

  off<E extends keyof WalletConnectServiceEvents>(event: E, listener: WalletConnectServiceEvents[E]): this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.off(event, listener as (...args: any[]) => void);
  }

  removeListener<E extends keyof WalletConnectServiceEvents>(event: E, listener: WalletConnectServiceEvents[E]): this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return super.removeListener(event, listener as (...args: any[]) => void);
  }

  emit<E extends keyof WalletConnectServiceEvents>(event: E, ...args: Parameters<WalletConnectServiceEvents[E]>): boolean {
    return super.emit(event, ...args);
  }
}
