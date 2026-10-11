import { Component, inject, model, OnInit, signal } from '@angular/core';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { NovaPoshtaCity } from './nova-poshta-city.interface';
import { NovaPoshtaWarehouse } from './nova-poshta-warehouse.interface';
import { NovaPoshtaService } from './nova-poshta.service';

const MAX_SUGGESTIONS = 8;
const POPULAR_CITY_NAMES = ['Київ', 'Львів', 'Одеса', 'Дніпро', 'Харків', 'Вінниця', 'Тернопіль'];

export interface NovaPoshtaSelection {
	ref: string;
	name: string;
}

/** Nova Poshta city and branch pickers; both values must come from the suggestion lists. */
@Component({
	selector: 'app-nova-poshta-picker',
	imports: [TranslateDirective],
	template: `
		<div class="relative">
			<label class="text-sm font-semibold text-[var(--c-text-strong)]" for="np-city" translate>
				Місто
			</label>
			<input
				id="np-city"
				class="field mt-1"
				type="text"
				required
				autocomplete="off"
				role="combobox"
				aria-autocomplete="list"
				aria-controls="np-city-list"
				[attr.aria-expanded]="cityOpen()"
				[translate]="{ placeholder: 'Почніть вводити назву міста' }"
				[value]="cityQuery()"
				(input)="onCityInput($any($event.target).value)"
				(focus)="onCityInput(cityQuery())"
				(blur)="closeCity()"
			/>
			@if (cityOpen() && citySuggestions().length) {
				<ul
					id="np-city-list"
					class="surface-pop absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-auto p-1"
					role="listbox"
				>
					@for (option of citySuggestions(); track option.ref) {
						<li role="option" [attr.aria-selected]="option.ref === city()?.ref">
							<button
								class="theme-focus flex min-h-11 w-full items-baseline gap-2 rounded-lg px-3 text-left text-sm hover:bg-[var(--c-bg-tertiary)]"
								type="button"
								(mousedown)="$event.preventDefault(); pickCity(option)"
							>
								<span class="font-semibold text-[var(--c-text-strong)]">{{ option.name }}</span>
								<span class="text-xs text-[var(--c-text-muted)]">{{ option.area }}</span>
							</button>
						</li>
					}
				</ul>
			}
		</div>

		<div class="relative">
			<label class="text-sm font-semibold text-[var(--c-text-strong)]" for="np-warehouse" translate>
				Відділення або поштомат
			</label>
			<input
				id="np-warehouse"
				class="field mt-1"
				type="text"
				required
				autocomplete="off"
				role="combobox"
				aria-autocomplete="list"
				aria-controls="np-warehouse-list"
				[attr.aria-expanded]="warehouseOpen()"
				[disabled]="!city()"
				[translate]="{
					placeholder: city() ? 'Номер або адреса відділення' : 'Спершу оберіть місто',
				}"
				[value]="warehouseQuery()"
				(input)="onWarehouseInput($any($event.target).value)"
				(focus)="onWarehouseInput(warehouseQuery())"
				(blur)="closeWarehouse()"
			/>
			@if (warehouseOpen()) {
				<ul
					id="np-warehouse-list"
					class="surface-pop absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-auto p-1"
					role="listbox"
				>
					@if (warehousesLoading()) {
						<li class="px-3 py-3 text-sm text-[var(--c-text-muted)]" role="status" translate>
							Завантажуємо відділення…
						</li>
					} @else if (!warehouseSuggestions().length) {
						<li class="px-3 py-3 text-sm text-[var(--c-text-muted)]" translate>
							Нічого не знайдено
						</li>
					}
					@for (item of warehouseSuggestions(); track item.ref) {
						<li role="option" [attr.aria-selected]="item.ref === warehouse()?.ref">
							<button
								class="theme-focus min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--c-text-strong)] hover:bg-[var(--c-bg-tertiary)]"
								type="button"
								(mousedown)="$event.preventDefault(); pickWarehouse(item)"
							>
								{{ label(item) }}
							</button>
						</li>
					}
				</ul>
			}
		</div>
	`,
	host: { class: 'grid gap-4' },
})
export class NovaPoshtaPickerComponent implements OnInit {
	private readonly _novaPoshta = inject(NovaPoshtaService);
	private _cities: NovaPoshtaCity[] | null = null;
	private _warehouses: NovaPoshtaWarehouse[] = [];

	readonly city = model<NovaPoshtaSelection | null>(null);
	readonly warehouse = model<NovaPoshtaSelection | null>(null);

	protected readonly cityQuery = signal('');
	protected readonly cityOpen = signal(false);
	protected readonly citySuggestions = signal<NovaPoshtaCity[]>([]);
	protected readonly warehouseQuery = signal('');
	protected readonly warehouseOpen = signal(false);
	protected readonly warehouseSuggestions = signal<NovaPoshtaWarehouse[]>([]);
	protected readonly warehousesLoading = signal(false);

	/** Shows a selection that was set from outside, e.g. restored from a previous order. */
	ngOnInit() {
		const city = this.city();

		if (!city) {
			return;
		}

		this.cityQuery.set(city.name);
		this.warehouseQuery.set(this.warehouse()?.name ?? '');
		this.warehousesLoading.set(true);

		this._novaPoshta
			.getWarehouses(city.ref)
			.then((warehouses) => {
				if (this.city()?.ref === city.ref) {
					this._warehouses = [...warehouses].sort((a, b) => Number(a.number) - Number(b.number));
					this._filterWarehouses(this.warehouseQuery());
				}
			})
			.catch(() => undefined)
			.finally(() => this.warehousesLoading.set(false));
	}

	protected async onCityInput(query: string) {
		this.cityQuery.set(query);

		if (this.city() && query !== this.city()!.name) {
			this.city.set(null);
			this._resetWarehouse();
		}

		this.cityOpen.set(true);
		this._cities ??= await this._novaPoshta.getCities();

		const normalized = query.trim().toLowerCase();
		const cities = this._cities;
		const matches = normalized
			? cities.filter((city) => city.name.toLowerCase().startsWith(normalized))
			: cities.filter(
					(city) => city.settlementType === 'місто' && POPULAR_CITY_NAMES.includes(city.name),
				);

		this.citySuggestions.set(matches.slice(0, MAX_SUGGESTIONS));
	}

	protected closeCity() {
		this.cityOpen.set(false);

		// Free text that was not picked from the list is not a valid city.
		if (!this.city()) {
			this.cityQuery.set('');
		}
	}

	protected async pickCity(city: NovaPoshtaCity) {
		if (this.city()?.ref !== city.ref) {
			this._resetWarehouse();
		}

		this.city.set({ ref: city.ref, name: city.name });
		this.cityQuery.set(city.name);
		this.cityOpen.set(false);
		this.warehousesLoading.set(true);

		const warehouses = await this._novaPoshta.getWarehouses(city.ref);

		// The city may have changed while the branches were loading.
		if (this.city()?.ref === city.ref) {
			this._warehouses = [...warehouses].sort((a, b) => Number(a.number) - Number(b.number));
			this.warehousesLoading.set(false);
			this._filterWarehouses(this.warehouseQuery());
		}
	}

	protected onWarehouseInput(query: string) {
		this.warehouseQuery.set(query);

		if (this.warehouse() && query !== this.warehouse()!.name) {
			this.warehouse.set(null);
		}

		this.warehouseOpen.set(!!this.city());
		this._filterWarehouses(query);
	}

	protected closeWarehouse() {
		this.warehouseOpen.set(false);

		if (!this.warehouse()) {
			this.warehouseQuery.set('');
		}
	}

	protected pickWarehouse(item: NovaPoshtaWarehouse) {
		this.warehouse.set({ ref: item.ref, name: this.label(item) });
		this.warehouseQuery.set(this.label(item));
		this.warehouseOpen.set(false);
	}

	protected label(item: NovaPoshtaWarehouse) {
		return `№${item.number}: ${item.shortAddress}`;
	}

	private _filterWarehouses(query: string) {
		const normalized = query.trim().toLowerCase().replace('№', '');
		const matches = normalized
			? this._warehouses.filter(
					(item) =>
						item.number.startsWith(normalized) ||
						item.shortAddress.toLowerCase().includes(normalized),
				)
			: this._warehouses;

		this.warehouseSuggestions.set(matches.slice(0, 50));
	}

	private _resetWarehouse() {
		this._warehouses = [];
		this.warehouse.set(null);
		this.warehouseQuery.set('');
		this.warehouseSuggestions.set([]);
	}
}
