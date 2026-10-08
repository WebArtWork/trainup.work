import { defineConfig } from 'vitest/config';

// Unit tests for framework-free code (validators, helpers). Angular components are not covered here.
export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.spec.ts'],
	},
});
