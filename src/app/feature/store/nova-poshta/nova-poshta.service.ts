import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NovaPoshtaCity } from './nova-poshta-city.interface';
import { NovaPoshtaWarehouse } from './nova-poshta-warehouse.interface';

const API_BASE = 'https://it.webart.work/api/novaposhta';
const CITIES_STORAGE_KEY = 'novaposhta-cities';
const WAREHOUSES_STORAGE_KEY_PREFIX = 'novaposhta-warehouses-';

@Service()
export class NovaPoshtaService {
	private readonly _http = inject(HttpClient);
	private _citiesPromise: Promise<NovaPoshtaCity[]> | null = null;
	private readonly _warehousePromises = new Map<string, Promise<NovaPoshtaWarehouse[]>>();

	getCities(): Promise<NovaPoshtaCity[]> {
		this._citiesPromise ??= this._fetchWithEtagCache<NovaPoshtaCity[]>(`${API_BASE}/cities`, CITIES_STORAGE_KEY).catch(
			() => {
				this._citiesPromise = null;

				return [];
			},
		);

		return this._citiesPromise;
	}

	getWarehouses(cityRef: string): Promise<NovaPoshtaWarehouse[]> {
		let promise = this._warehousePromises.get(cityRef);

		if (!promise) {
			promise = this._fetchWithEtagCache<NovaPoshtaWarehouse[]>(
				`${API_BASE}/warehouses/${cityRef}`,
				`${WAREHOUSES_STORAGE_KEY_PREFIX}${cityRef}`,
			).catch(() => {
				this._warehousePromises.delete(cityRef);

				return [];
			});

			this._warehousePromises.set(cityRef, promise);
		}

		return promise;
	}

	private async _fetchWithEtagCache<T>(url: string, storageKey: string): Promise<T> {
		const etag = readStorage<string>(`${storageKey}-etag`);
		const headers = etag ? new HttpHeaders({ 'If-None-Match': etag }) : undefined;

		try {
			const response = await firstValueFrom(this._http.get<T>(url, { headers, observe: 'response' }));

			const data = response.body as T;
			const newEtag = response.headers.get('Etag');

			writeStorage(storageKey, data);
			writeStorage(`${storageKey}-etag`, newEtag);

			return data;
		} catch (error) {
			if (error instanceof HttpErrorResponse && error.status === 304) {
				const cached = readStorage<T>(storageKey);

				if (cached) {
					return cached;
				}
			}

			throw error;
		}
	}
}

function readStorage<T>(key: string): T | null {
	if (typeof localStorage === 'undefined') {
		return null;
	}

	try {
		const raw = localStorage.getItem(key);

		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

function writeStorage(key: string, value: unknown): void {
	if (typeof localStorage === 'undefined' || value == null) {
		return;
	}

	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Storage may be full or unavailable (private browsing) — safe to ignore.
	}
}
