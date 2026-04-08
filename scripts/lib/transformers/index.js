import { createTransformer } from './factory.js';
import { PROVIDERS } from './providers.js';

export const transformClaudeCode = createTransformer(PROVIDERS['claude-code']);
export const transformCodex = createTransformer(PROVIDERS.codex);

export { createTransformer, PROVIDERS };
