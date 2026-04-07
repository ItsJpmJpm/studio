import { config } from 'dotenv';
config();

import '@/ai/flows/contextual-memory.ts';
import '@/ai/flows/ambiguity-resolution.ts';
import '@/ai/flows/ai-conversation.ts';
import '@/ai/flows/multi-agent-orchestrator.ts';
