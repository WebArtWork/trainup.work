import type { ThemeConfig } from '@wawjs/ngx-ui';

/**
 * Runtime tokens for `ThemeService` (it writes them inline on <html>, which beats any stylesheet).
 * Keep in sync with `src/styles/_theme.scss`, which holds the SSR/first-paint values and every
 * token the service does not manage (text colours, elevation, fonts, display type).
 *
 * light = "Sunrise" (warm, chunky, tactile)   dark = "Midnight Focus" (navy, violet, layered)
 */
export const themeConfig: ThemeConfig = {
	mode: 'light',
	modes: ['light', 'dark'],
	lightTokens: {
		primary: '#d6410f',
		primaryHover: '#b8340a',
		secondary: '#0b6b5f',
		secondaryHover: '#08564c',
		bgPrimary: '#fff8f0',
		bgSecondary: '#ffffff',
		bgTertiary: '#ffefd9',
		border: '#f0dfcb',
		placeholder: '#8c7763',
		danger: '#b3261e',
		onDanger: '#ffffff',
		onPrimary: '#ffffff',
		focusRing: '0 0 0 3px #fff8f0, 0 0 0 6px rgba(184, 52, 10, 0.75)',
		shadowSm: '0 3px 0 #f0dfcb',
		shadowMd: '0 6px 0 #e8d3b8',
		ffBase: "'Sora', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
		letterSpacing: '0',
		radius: '14px',
		radiusCard: '22px',
		radiusBtn: '999px',
		radiusPill: '999px',
	},
	darkTokens: {
		primary: '#6a5af0',
		primaryHover: '#5b4ae4',
		secondary: '#34d3b8',
		secondaryHover: '#5ee3cb',
		bgPrimary: '#0b0f1c',
		bgSecondary: '#121829',
		bgTertiary: '#1a2136',
		border: '#232b44',
		placeholder: '#7480a0',
		danger: '#ff8a8a',
		onDanger: '#2a0a0a',
		onPrimary: '#ffffff',
		focusRing: '0 0 0 2px #0b0f1c, 0 0 0 4px rgba(169, 159, 255, 0.9)',
		shadowSm:
			'inset 0 1px 0 0 rgba(255, 255, 255, 0.07), inset 0 0 0 1px rgba(255, 255, 255, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.35), 0 1px 1px -0.5px rgba(0, 0, 0, 0.3)',
		shadowMd:
			'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.35), 0 3px 3px -1.5px rgba(0, 0, 0, 0.3), 0 12px 24px -8px rgba(106, 90, 240, 0.18)',
		ffBase: "'Geist', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
		letterSpacing: '-0.005em',
		radius: '10px',
		radiusCard: '16px',
		radiusBtn: '12px',
		radiusPill: '999px',
	},
};
