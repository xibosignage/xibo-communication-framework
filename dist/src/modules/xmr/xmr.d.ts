import { type Emitter } from 'nanoevents';
import { DateTime } from 'luxon';
export interface XmrEvents {
    connected: () => void;
    disconnected: () => void;
    error: (e: string) => void;
    statusChange: (status: string) => void;
    collectNow: () => void;
    screenShot: () => void;
    licenceCheck: () => void;
    showStatusWindow: (timeout: number) => void;
}
export default class Xmr {
    emitter: Emitter<XmrEvents>;
    url: string | null;
    cmsKey: string | null;
    channel: string;
    socket: WebSocket;
    isConnectionWanted: boolean;
    isConnected: boolean;
    lastMessageAt: DateTime;
    interval: NodeJS.Timeout | undefined;
    constructor(channel: string);
    on<E extends keyof XmrEvents>(event: E, callback: XmrEvents[E]): import("nanoevents").Unsubscribe;
    init(): Promise<void>;
    start(url: string, cmsKey: string): Promise<void>;
    stop(): Promise<void>;
    isActive(): boolean;
}
