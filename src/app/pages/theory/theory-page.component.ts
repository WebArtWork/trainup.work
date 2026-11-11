import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateService } from '@wawjs/ngx-translate';
import {
	THEORY_CATALOG,
	fillLabel,
	loadTheoryBody,
	loadTheoryTexts,
} from '../../feature/theory/theory.data';

/** One theory: short version first, the detailed version under "Read more", then sources and navigation. */
@Component({
	imports: [RouterLink],
	changeDetection: ChangeDetectionStrategy.OnPush,
	styles: `
		details[open] .read-more-closed,
		details:not([open]) .read-more-open {
			display: none;
		}
		summary::-webkit-details-marker {
			display: none;
		}
	`,
	template: `
		@if (view(); as v) {
			<article class="page-wrap max-w-[52rem] py-10 sm:py-14">
				<nav class="text-sm font-semibold" [attr.aria-label]="v.ui['backToList']">
					<a class="link inline-flex min-h-11 items-center gap-1" routerLink="/theories">
						<span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
						{{ v.ui['backToList'] }}
					</a>
					<span class="text-[var(--c-text-muted)]" aria-hidden="true"> · </span>
					<a
						class="link inline-flex min-h-11 items-center"
						routerLink="/theories"
						[queryParams]="{ topic: item.topic }"
					>
						{{ v.topic }}
					</a>
				</nav>

				<h1
					class="mt-4 font-display text-4xl leading-tight text-balance text-[var(--c-text-strong)] sm:text-5xl"
				>
					{{ v.title }}
				</h1>

				<section class="mt-8 max-w-[65ch]" aria-labelledby="theory-short">
					<h2
						id="theory-short"
						class="text-sm font-semibold uppercase tracking-wide text-[var(--c-text-muted)]"
					>
						{{ v.ui['short'] }}
					</h2>
					<p class="mt-2 text-xl leading-9 text-pretty text-[var(--c-text-strong)]">{{ v.short }}</p>
				</section>

				@if (body(); as b) {
					<details class="mt-8 max-w-[65ch]">
						<summary
							class="btn btn-outline btn-sm list-none"
						>
							<span class="read-more-closed">{{ v.ui['readMore'] }}</span>
							<span class="read-more-open">{{ v.ui['readLess'] }}</span>
							<span class="material-symbols-outlined read-more-closed text-[20px]" aria-hidden="true">
								expand_more
							</span>
							<span class="material-symbols-outlined read-more-open text-[20px]" aria-hidden="true">
								expand_less
							</span>
						</summary>

						@for (section of b.sections; track $index) {
							<section class="mt-8">
								<h2 class="font-display text-2xl text-balance text-[var(--c-text-strong)]">
									{{ section.title }}
								</h2>
								<p class="mt-3 text-base leading-8 text-pretty text-[var(--c-text)]">
									{{ section.text }}
								</p>
							</section>
						}

						<section class="mt-10 border-t border-[var(--c-border)] pt-6">
							<h2 class="text-base font-semibold text-[var(--c-text-strong)]">
								{{ v.ui['sources'] }}
							</h2>
							<ul class="mt-3 list-disc space-y-2 pl-6 text-base leading-7">
								@for (source of b.sources; track source.url) {
									<li>
										<a class="link" [href]="source.url" target="_blank" rel="noopener">
											{{ source.label }}
										</a>
									</li>
								}
							</ul>
						</section>
					</details>
				}

				<p class="mt-10 max-w-[65ch] text-sm leading-6 text-[var(--c-text-muted)]">
					{{ v.ui['disclaimer'] }}
				</p>

				<nav
					class="mt-10 grid gap-3 border-t border-[var(--c-border)] pt-6 sm:grid-cols-2"
					[attr.aria-label]="v.ui['previous'] + ' / ' + v.ui['next']"
				>
					@if (v.previous; as p) {
						<a
							class="theme-focus flex flex-col rounded-[var(--radius-card)] border-2 border-[var(--c-border)] bg-[var(--c-bg-secondary)] px-5 py-4 no-underline hover:bg-[var(--c-bg-tertiary)] dark:border"
							[routerLink]="['/theory', p.slug]"
						>
							<span class="text-sm text-[var(--c-text-muted)]">{{ v.ui['previous'] }}</span>
							<span class="mt-1 font-semibold leading-snug text-[var(--c-text-strong)]">{{ p.title }}</span>
						</a>
					} @else {
						<span class="max-sm:hidden"></span>
					}
					@if (v.next; as n) {
						<a
							class="theme-focus flex flex-col rounded-[var(--radius-card)] border-2 border-[var(--c-border)] bg-[var(--c-bg-secondary)] px-5 py-4 text-right no-underline hover:bg-[var(--c-bg-tertiary)] max-sm:text-left dark:border"
							[routerLink]="['/theory', n.slug]"
						>
							<span class="text-sm text-[var(--c-text-muted)]">{{ v.ui['next'] }}</span>
							<span class="mt-1 font-semibold leading-snug text-[var(--c-text-strong)]">{{ n.title }}</span>
						</a>
					}
				</nav>

				@if (v.related.length) {
					<section class="mt-10" aria-labelledby="theory-related">
						<h2 id="theory-related" class="font-display text-2xl text-[var(--c-text-strong)]">
							{{ v.relatedTitle }}
						</h2>
						<ul class="mt-3 space-y-1">
							@for (r of v.related; track r.slug) {
								<li>
									<a class="link inline-flex min-h-11 items-center" [routerLink]="['/theory', r.slug]">
										{{ r.title }}
									</a>
								</li>
							}
						</ul>
					</section>
				}
			</article>
		}
	`,
})
export class TheoryPageComponent {
	private readonly _language = inject(TranslateService).language;

	protected readonly item = THEORY_CATALOG.find(
		(theory) => theory.slug === inject(ActivatedRoute).snapshot.data['theory'],
	)!;

	private readonly _texts = resource({
		params: () => ({ language: this._language() }),
		loader: ({ params }) => loadTheoryTexts(params.language),
	});
	private readonly _body = resource({
		params: () => ({ language: this._language(), n: this.item.n }),
		loader: ({ params }) => loadTheoryBody(params.language, params.n),
	});

	protected readonly body = computed(() => (this._body.hasValue() ? this._body.value() : undefined));

	protected readonly view = computed(() => {
		if (!this._texts.hasValue()) {
			return undefined;
		}
		const texts = this._texts.value();
		const index = THEORY_CATALOG.indexOf(this.item);
		const link = (theory: (typeof THEORY_CATALOG)[number] | undefined) =>
			theory && { slug: theory.slug, title: texts.theories[theory.n].title };
		const topic = texts.topics[this.item.topic];

		return {
			ui: texts.ui,
			topic,
			title: texts.theories[this.item.n].title,
			short: texts.theories[this.item.n].short,
			previous: link(THEORY_CATALOG[index - 1]),
			next: link(THEORY_CATALOG[index + 1]),
			relatedTitle: fillLabel(texts.ui['inTopic'], { title: topic }),
			related: THEORY_CATALOG.filter(
				(theory) =>
					theory.topic === this.item.topic &&
					Math.abs(theory.n - this.item.n) > 1,
			).map((theory) => link(theory)!),
		};
	});
}
