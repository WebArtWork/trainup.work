import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateDirective } from '@wawjs/ngx-translate';
import { CompanyService } from '../../feature/company/company.service';
import { LEGAL_DOCUMENTS, LEGAL_TEXT, LegalDocumentId } from './legal.content';

/** Privacy policy and terms of use. The route's `data.document` picks the text. */
@Component({
	imports: [RouterLink, TranslateDirective],
	template: `
		<article class="page-wrap max-w-[65ch] py-10 sm:py-14">
			<h1
				class="font-display text-4xl leading-tight text-[var(--c-text-strong)] sm:text-5xl"
				[translate]="doc.title"
			>
				{{ doc.title }}
			</h1>
			<p class="mt-2 text-sm text-[var(--c-text-muted)]" [translate]="doc.updated">
				{{ doc.updated }}
			</p>
			<p class="mt-6 text-lg leading-8 text-[var(--c-text-strong)]" [translate]="doc.intro">
				{{ doc.intro }}
			</p>

			@for (section of doc.sections; track section.title) {
				<section class="mt-10">
					<h2
						class="font-display text-2xl text-[var(--c-text-strong)]"
						[translate]="section.title"
					>
						{{ section.title }}
					</h2>
					@for (paragraph of section.paragraphs ?? []; track paragraph) {
						<p class="mt-3 text-base leading-8 text-[var(--c-text)]" [translate]="paragraph">
							{{ paragraph }}
						</p>
					}
					@if (section.items?.length) {
						<ul class="mt-3 list-disc space-y-2 pl-6 text-base leading-8 text-[var(--c-text)]">
							@for (item of section.items; track item) {
								<li [translate]="item">{{ item }}</li>
							}
						</ul>
					}
				</section>
			}

			<section class="mt-10">
				<h2 class="font-display text-2xl text-[var(--c-text-strong)]" translate>Зв’язок</h2>
				@if (company().email) {
					<p
						class="mt-3 text-base leading-8 text-[var(--c-text)]"
						[translate]="text.contactWithEmail"
						[vars]="{ email: company().email }"
					>
						{{ text.contactWithEmail }}
					</p>
				} @else {
					<p class="mt-3 text-base leading-8 text-[var(--c-text)]" translate>
						Питання щодо цієї сторінки та ваших даних можна надіслати через сайт trainup.work.
					</p>
				}
			</section>

			<nav
				class="mt-12 flex flex-wrap gap-x-6 gap-y-1 border-t border-[var(--c-border)] pt-4 text-sm font-semibold"
				[translate]="{ ariaLabel: 'Юридична інформація' }"
			>
				<a class="link inline-flex min-h-11 items-center" routerLink="/privacy" translate>
					Політика конфіденційності
				</a>
				<a class="link inline-flex min-h-11 items-center" routerLink="/terms" translate>
					Умови користування
				</a>
				<a class="link inline-flex min-h-11 items-center" routerLink="/" translate>
					На головну
				</a>
			</nav>
		</article>
	`,
})
export class LegalPageComponent {
	protected readonly text = LEGAL_TEXT;
	protected readonly doc =
		LEGAL_DOCUMENTS[inject(ActivatedRoute).snapshot.data['document'] as LegalDocumentId];
	protected readonly company = inject(CompanyService).company;
}
