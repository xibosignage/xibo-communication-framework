import * as nanoevents from 'nanoevents';
import { Emitter } from 'nanoevents';
import { DateTime } from 'luxon';

interface XmrEvents {
    connected: () => void;
    disconnected: () => void;
    error: (e: string) => void;
    statusChange: (status: string) => void;
    collectNow: () => void;
    screenShot: () => void;
    licenceCheck: () => void;
    showStatusWindow: (timeout: number) => void;
}
declare class Xmr {
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
    on<E extends keyof XmrEvents>(event: E, callback: XmrEvents[E]): nanoevents.Unsubscribe;
    init(): Promise<void>;
    start(url: string, cmsKey: string): Promise<void>;
    stop(): Promise<void>;
    isActive(): boolean;
}

export { Xmr };
export type { XmrEvents };
