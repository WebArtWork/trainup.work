import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import type { StoreProduct } from '../../feature/store/store.interface';

@Component({
	selector: 'app-product-image',
	imports: [NgOptimizedImage],
	host: {
		class: 'flex h-full w-full items-center justify-center overflow-hidden rounded-[inherit]',
	},
	template: `
		@if (src(); as source) {
			<img
				class="h-full w-full object-contain"
				[ngSrc]="source"
				[alt]="alt()"
				width="1200"
				height="900"
				[loading]="lazy() ? 'lazy' : 'eager'"
				(error)="failed.set(source)"
			/>
		} @else {
			<span class="material-symbols-outlined" [class]="iconClass()" aria-hidden="true">
				{{ product().icon }}
			</span>
		}
	`,
})
export class ProductImageComponent {
	readonly product = input.required<StoreProduct>();
	readonly alt = input('');
	readonly lazy = input(true);
	readonly iconClass = input('text-[56px]');

	protected readonly failed = signal<string | null>(null);
	protected readonly src = computed(() => {
		const source = this.product().image;
		return source && source !== this.failed() ? source : null;
	});
}
