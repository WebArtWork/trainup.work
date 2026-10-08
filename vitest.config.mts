import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests for framework-free code (planner, validators, helpers). Angular components are not covered here.
export default defineConfig({
	resolve: {
		alias: {
			'@trainup/planner': fileURLToPath(new URL('./planner/src/index.ts', import.meta.url)),
		},
	},
	test: {
		environment: 'node',
		include: ['src/**/*.spec.ts', 'planner/**/*.spec.ts'],
	},
});
