import { inject, Service, signal } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { FirebaseService } from '../firebase/firebase.service';

export type AiConnectionStatus = 'none' | 'active' | 'revoked';

/** One connected assistant: the pasted token (`mcp`) or an OAuth client (`oauth-<clientId>`). */
export interface AiConnection {
	id: string;
	name: string | null;
}

/** What the OAuth consent screen gets from the URL the assistant sent the user to. */
export interface OAuthRequest {
	client_id: string;
	redirect_uri: string;
	code_challenge: string;
	state: string | null;
}

/**
 * The user's connection for an AI assistant (ChatGPT, Claude, ...) over MCP. The WAW API creates
 * the token and stores only its hash; the plain token is returned once and the component keeps it
 * only until the user leaves the screen.
 */
@Service()
export class AiConnectionService {
	private readonly _firebase = inject(FirebaseService);

	/** The address the assistant connects to. */
	readonly mcpUrl = `${environment.apiUrl}/api/trainup/mcp`;
	/** Status of the pasted-token connection. */
	readonly status = signal<AiConnectionStatus>('none');
	/** Assistants connected through "Allow" (OAuth), one per assistant. */
	readonly connections = signal<AiConnection[]>([]);
	readonly loaded = signal(false);

	async load(): Promise<void> {
		const { db, uid } = this._context();
		const snapshot = await getDocs(collection(db, 'users', uid, 'aiConnections'));
		const active = snapshot.docs.filter((item) => item.data()['status'] === 'active');
		const manual = snapshot.docs.find((item) => item.id === 'mcp')?.data()['status'];

		this.status.set(manual === 'active' || manual === 'revoked' ? manual : 'none');
		this.connections.set(
			active
				.filter((item) => item.id.startsWith('oauth-'))
				.map((item) => ({ id: item.id, name: String(item.data()['clientName'] ?? '') || null })),
		);
		this.loaded.set(true);
	}

	/** Who is asking, according to the server (never the URL), for the consent screen. */
	async describeClient(request: OAuthRequest): Promise<{ name: string; redirectHost: string }> {
		const query = new URLSearchParams({
			client_id: request.client_id,
			redirect_uri: request.redirect_uri,
		});
		const response = await fetch(`${environment.apiUrl}/api/trainup/oauth/client?${query}`);

		if (!response.ok) {
			throw new Error(`Unknown assistant: ${response.status}`);
		}

		return (await response.json()) as { name: string; redirectHost: string };
	}

	/** The user allowed the assistant; returns where to send the browser back to it. */
	async approve(request: OAuthRequest): Promise<string> {
		const idToken = await this._firebase.auth?.currentUser?.getIdToken();

		if (!idToken) {
			throw new Error('No signed-in user.');
		}

		const response = await fetch(`${environment.apiUrl}/api/trainup/oauth/approve`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(request),
		});

		if (!response.ok) {
			throw new Error(`Approval failed: ${response.status}`);
		}

		return ((await response.json()) as { redirectTo: string }).redirectTo;
	}

	/** Creates a token (replacing any previous one) and returns it. Shown to the user once. */
	async connect(): Promise<string> {
		const { token } = await this._call<{ token: string }>('POST');

		await this.load();

		return token;
	}

	/** Revokes the pasted token (default) or one OAuth assistant by connection id. */
	async disconnect(connection = 'mcp'): Promise<void> {
		await this._call('DELETE', `?connection=${encodeURIComponent(connection)}`);
		await this.load();
	}

	private async _call<T>(method: 'POST' | 'DELETE', query = ''): Promise<T> {
		const idToken = await this._firebase.auth?.currentUser?.getIdToken();

		if (!idToken) {
			throw new Error('No signed-in user.');
		}

		const response = await fetch(`${environment.apiUrl}/api/trainup/mcp-token${query}`, {
			method,
			headers: { Authorization: `Bearer ${idToken}` },
		});

		if (!response.ok) {
			throw new Error(`MCP token request failed: ${response.status}`);
		}

		return (await response.json()) as T;
	}

	private _context() {
		const uid = this._firebase.auth?.currentUser?.uid;
		const db = this._firebase.firestore;

		if (!uid || !db) {
			throw new Error('No signed-in user.');
		}

		return { db, uid };
	}
}
