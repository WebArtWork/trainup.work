import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateService } from '@wawjs/ngx-translate';
import { map } from 'rxjs';
import {
	THEORY_CATALOG,
	THEORY_TOPICS,
	fillLabel,
	loadTheoryTexts,
} from '../../feature/theory/theory.data';

/** Theory library: every theory grouped by topic, with search and a topic filter kept in the URL. */
@Component({
	imports: [RouterLink],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (texts(); as t) {
			<div class="page-wrap max-w-[52rem] py-10 sm:py-14">
				<h1
					class="font-display text-4xl leading-tight text-balance text-[var(--c-text-strong)] sm:text-5xl"
				>
					{{ t.ui['title'] }}
				</h1>
				<p class="mt-4 max-w-[65ch] text-lg leading-8 text-pretty text-[var(--c-text-strong)]">
					{{ t.ui['intro'] }}
				</p>
				<p class="mt-3 max-w-[65ch] text-sm leading-6 text-[var(--c-text-muted)]">
					{{ t.ui['disclaimer'] }}
				</p>

				<div class="mt-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_16rem]" role="search">
					<label class="block">
						<span class="mb-2 block text-sm font-semibold text-[var(--c-text-strong)]">
							{{ t.ui['searchLabel'] }}
						</span>
						<input
							class="field"
							type="search"
							autocomplete="off"
							[placeholder]="t.ui['searchPlaceholder']"
							[value]="query()"
							(input)="setQuery($any($event.target).value)"
						/>
					</label>
					<label class="block">
						<span class="mb-2 block text-sm font-semibold text-[var(--c-text-strong)]">
							{{ t.ui['topicLabel'] }}
						</span>
						<select
							class="field"
							[value]="topic()"
							(change)="setTopic($any($event.target).value)"
						>
							<option value="">{{ t.ui['allTopics'] }}</option>
							@for (id of topics; track id) {
								<option [value]="id" [selected]="id === topic()">{{ t.topics[id] }}</option>
							}
						</select>
					</label>
				</div>

				<p class="mt-4 text-sm tabular-nums text-[var(--c-text-muted)]" aria-live="polite">
					{{ countLabel() }}
				</p>

				@for (group of groups(); track group.id) {
					<section class="mt-10" [attr.aria-labelledby]="'topic-' + group.id">
						<h2
							class="font-display text-2xl text-[var(--c-text-strong)]"
							[id]="'topic-' + group.id"
						>
							{{ group.title }}
						</h2>
						<ul
							class="mt-4 divide-y divide-[var(--c-border)] overflow-hidden rounded-[var(--radius-card)] border-2 border-[var(--c-border)] bg-[var(--c-bg-secondary)] dark:border"
						>
							@for (item of group.items; track item.slug) {
								<li>
									<a
										class="theme-focus flex items-start gap-4 px-5 py-4 no-underline transition-colors hover:bg-[var(--c-bg-tertiary)]"
										[routerLink]="['/theory', item.slug]"
									>
										<span
											class="mt-0.5 w-8 shrink-0 text-sm font-semibold tabular-nums text-[var(--c-text-muted)]"
										>
											{{ item.n }}
										</span>
										<span class="min-w-0 flex-1">
											<span
												class="block text-base font-semibold leading-snug text-[var(--c-text-strong)]"
											>
												{{ item.title }}
											</span>
											<span
												class="mt-1 line-clamp-2 text-sm leading-6 text-[var(--c-text)]"
											>
												{{ item.short }}
											</span>
										</span>
										<span
											class="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-[var(--c-text-muted)]"
											aria-hidden="true"
										>
											chevron_right
										</span>
									</a>
								</li>
							}
						</ul>
					</section>
				} @empty {
					<div class="mt-10 rounded-[var(--radius-card)] bg-[var(--c-bg-tertiary)] px-5 py-6">
						<p class="text-base font-semibold text-[var(--c-text-strong)]">{{ t.ui['empty'] }}</p>
						<button class="btn btn-outline btn-sm mt-4" type="button" (click)="reset()">
							{{ t.ui['reset'] }}
						</button>
					</div>
				}
			</div>
		}
	`,
})
export class TheoriesComponent {
	private readonly _router = inject(Router);
	private readonly _route = inject(ActivatedRoute);
	private readonly _language = inject(TranslateService).language;

	protected readonly topics = THEORY_TOPICS;

	private readonly _textsResource = resource({
		params: () => ({ language: this._language() }),
		loader: ({ params }) => loadTheoryTexts(params.language),
	});
	protected readonly texts = computed(() =>
		this._textsResource.hasValue() ? this._textsResource.value() : undefined,
	);

	private readonly _params = toSignal(this._route.queryParamMap.pipe(map((p) => p)), {
		initialValue: this._route.snapshot.queryParamMap,
	});
	protected readonly query = computed(() => this._params().get('q') ?? '');
	protected readonly topic = computed(() => {
		const topic = this._params().get('topic') ?? '';
		return THEORY_TOPICS.includes(topic) ? topic : '';
	});

	private readonly _matches = computed(() => {
		const texts = this.texts();
		if (!texts) {
			return [];
		}
		const words = this.query().toLowerCase().split(/\s+/).filter(Boolean);
		return THEORY_CATALOG.map((item) => ({ ...item, ...texts.theories[item.n] })).filter(
			(item) => {
				if (this.topic() && item.topic !== this.topic()) {
					return false;
				}
				const haystack = `${item.n} ${item.title} ${item.short}`.toLowerCase();
				return words.every((word) => haystack.includes(word));
			},
		);
	});

	protected readonly groups = computed(() => {
		const texts = this.texts();
		const matches = this._matches();
		return THEORY_TOPICS.map((id) => ({
			id,
			title: texts?.topics[id] ?? id,
			items: matches.filter((item) => item.topic === id),
		})).filter((group) => group.items.length);
	});

	protected readonly countLabel = computed(() =>
		fillLabel(this.texts()?.ui['count'] ?? '', {
			shown: this._matches().length,
			n: THEORY_CATALOG.length,
		}),
	);

	protected setQuery(value: string): void {
		this._updateUrl({ q: value.trim() ? value : null });
	}

	protected setTopic(value: string): void {
		this._updateUrl({ topic: value || null });
	}

	protected reset(): void {
		this._updateUrl({ q: null, topic: null });
	}

	private _updateUrl(queryParams: Record<string, string | null>): void {
		void this._router.navigate([], {
			relativeTo: this._route,
			queryParams,
			queryParamsHandling: 'merge',
			replaceUrl: true,
		});
	}
}
