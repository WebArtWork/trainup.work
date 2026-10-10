import { inject, Service, signal } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { FirebaseService } from '../firebase/firebase.service';

export type AiConnectionStatus = 'none' | 'active' | 'revoked';

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
	readonly status = signal<AiConnectionStatus>('none');
	readonly loaded = signal(false);

	async load(): Promise<void> {
		const { db, uid } = this._context();
		const data = (await getDoc(doc(db, 'users', uid, 'aiConnections', 'mcp'))).data();
		const status = data?.['status'];

		this.status.set(status === 'active' || status === 'revoked' ? status : 'none');
		this.loaded.set(true);
	}

	/** Creates a token (replacing any previous one) and returns it. Shown to the user once. */
	async connect(): Promise<string> {
		const { token } = await this._call<{ token: string }>('POST');

		await this.load();

		return token;
	}

	async disconnect(): Promise<void> {
		await this._call('DELETE');
		await this.load();
	}

	private async _call<T>(method: 'POST' | 'DELETE'): Promise<T> {
		const idToken = await this._firebase.auth?.currentUser?.getIdToken();

		if (!idToken) {
			throw new Error('No signed-in user.');
		}

		const response = await fetch(`${environment.apiUrl}/api/trainup/mcp-token`, {
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
