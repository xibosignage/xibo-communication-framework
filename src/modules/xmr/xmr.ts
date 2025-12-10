/*
 * Copyright (C) 2025 Xibo Signage Ltd
 *
 * Xibo - Digital Signage - https://xibosignage.com
 *
 * This file is part of Xibo.
 *
 * Xibo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * Xibo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Xibo.  If not, see <http://www.gnu.org/licenses/>.
 */
import {createNanoEvents, type Emitter} from 'nanoevents';
import {DateTime} from 'luxon';

export interface XmrEvents {
    connected: () => void;
    disconnected: () => void;
    error: (e: string) => void;
    statusChange: (status: string) => void;

    collectNow: () => void;
    screenShot: () => void;
    licenceCheck: () => void;
    showStatusWindow: (timeout: number) => void;
    forceUpdateChromeOS: () => void;
    criteriaUpdate: (
        criteriaUpdates: {
            metric: string;
            value: string;
            ttl: number
        }[]
    ) => void;
    currentGeoLocation: () => void;
}

export default class Xmr {
    emitter: Emitter<XmrEvents>;

    url: string | null;
    cmsKey: string | null;
    channel: string;
    socket!: WebSocket;

    // State
    isConnectionWanted: boolean;
    isConnected: boolean;
    lastMessageAt: DateTime;

    interval: NodeJS.Timeout | undefined;

    constructor (channel: string) {
        // Emitter
        this.emitter = createNanoEvents<XmrEvents>();
        this.url = null;
        this.cmsKey = null;
        this.channel = channel;
        this.isConnected = false;
        this.isConnectionWanted = false;
        this.lastMessageAt = DateTime.now().minus({year: 1});
    }

    on<E extends keyof XmrEvents>(event: E, callback: XmrEvents[E]) {
        return this.emitter.on(event, callback);
    }

    async init() {
        this.interval = setInterval(() => {
            if (this.isConnectionWanted && !this.isActive()) {
                console.debug('Xmr::setInterval: should be active');

                // Call start again
                this.start(this.url || 'DISABLED', this.cmsKey || 'n/a');
            }
        }, 60000);
    }

    async start(url: string, cmsKey: string){
        if (!this.channel || this.channel === 'unknown') {
            console.error('Xmr::start: channel unknown, XMR will be disabled');
            return;
        }

        // Disable XMR if we've been told to.
        if (this.url === 'DISABLED') {
            console.info('Xmr::start: XMR disabled');
            this.isConnectionWanted = false;
            if (this.isActive()) {
                stop();
            }
            return;
        }

        this.isConnectionWanted = true;

        // Are we already connected?
        if (this.isActive() && this.url === url) {
            console.debug('Xmr::start: already connected to this URL');
            this.cmsKey = cmsKey;
            return;
        } else if (this.isConnected) {
            console.debug('Xmr::start: already connected but not active, or a different URL');
            await this.stop();
        } else {
            console.debug('Xmr::start: not connected yet');
        }

        // Set the URL and cmsKey.
        this.url = url;
        this.cmsKey = cmsKey;

        console.debug('Xmr::start: connecting to ' + this.url);

        try {
            this.socket = new WebSocket(this.url);
        } catch (e) {
            console.debug('Xmr::start: failed connecting to ' + this.url + ', e = ' + e);
            this.emitter.emit('error', 'Failed to connect');
            return;
        }

        /**
         * Listener for socket open
         */
        this.socket.addEventListener('open', (event) => {
            console.debug('Xmr::' + event.type);

            if (this.socket.readyState !== WebSocket.OPEN) {
                console.info('Xmr::' + event.type + ': not open yet');
                return;
            }

            // Create and send an initialisation message.
            this.socket.send(JSON.stringify({
                'type': 'init',
                'key': this.cmsKey,
                'channel': this.channel,
            }));

            this.isConnected = true;

            this.emitter.emit('connected');
        });

        /**
         * Listener for socket close
         */
        this.socket.addEventListener('close', (event) => {
            console.debug('Xmr::' + event.type);

            this.isConnected = false;

            this.emitter.emit('disconnected');
        });

        /**
         * Listener for socket error
         */
        this.socket.addEventListener('error', (event) => {
            console.debug('Xmr::' + event.type);

            this.emitter.emit('error', 'error');
        });

        /**
         * Listener for socket message
         */
        this.socket.addEventListener('message', (event) => {
            console.debug(event);

            this.lastMessageAt = DateTime.now();
            this.emitter.emit('statusChange', this.lastMessageAt.toISO() || '');

            // Expect a JSON message or a H
            if (event.data === 'H') {
                console.debug('Xmr::message: Heartbeat...');
            } else {
                // JSON message.
                const message = JSON.parse(event.data);

                console.debug('Xmr::message: action is ' + message.action);

                // Check the createdDt and TTL against the current date time.
                const expiresAt = DateTime.fromISO(message.createdDt).plus({seconds: parseInt(message.ttl)});
                if (expiresAt < DateTime.now()) {
                    console.debug('Xmr::message: message expired at ' + expiresAt.toString());
                } else if (message.action === 'collectNow') {
                    this.emitter.emit('collectNow');
                } else if (message.action === 'screenShot') {
                    this.emitter.emit('screenShot');
                } else if (message.action === 'licenceCheck') {
                    this.emitter.emit('licenceCheck');
                } else if (message.action == 'commandAction' && message.commandCode.startsWith('showStatusWindow')) {
                    const split = message.commandCode.split('|');
                    this.emitter.emit('showStatusWindow', parseInt(split[1]) || 60);
                } else if (message.action == 'commandAction' && message.commandCode.startsWith('forceUpdateChromeOS')) {
                    this.emitter.emit('forceUpdateChromeOS');
                } else if (message.action == 'commandAction' && message.commandCode.startsWith('currentGeoLocation')) {
                    this.emitter.emit('currentGeoLocation');
                } else if (message.action == 'criteriaUpdate') {
                    this.emitter.emit('criteriaUpdate', message.criteriaUpdates);
                } else {
                    console.error('Xmr::message: unknown action: ' + message.action);
                }
            }
        });
    }

    async stop() {
        console.debug('Xmr::stop');
        if (this.socket) {
            console.debug('Xmr::stop: closing active socket');
            this.socket.close();
            this.isConnected = false;
        }
    }

    isActive(): boolean {
        console.debug('Xmr::isActive: lastMessageAt: ' + this.lastMessageAt.toString());
        return this.isConnected && this.lastMessageAt > DateTime.now().minus({minute: 15});
    }
}
