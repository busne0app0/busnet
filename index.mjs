import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Configure the OpenAI provider to use your Vercel AI Gateway
const openai = createOpenAI({
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  // Use VERCEL_OIDC_TOKEN (or AI_GATEWAY_API_KEY if available)
  apiKey: process.env.VERCEL_OIDC_TOKEN || process.env.AI_GATEWAY_API_KEY,
});

const result = await streamText({
  // Using the model you specified
  model: openai('gpt-5.5'),
  prompt: 'Why is the sky blue?',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
