# Google Gemini Integration

## Visão Geral

O ProcureFlow agora suporta **Google Gemini** como uma alternativa ao OpenAI para funcionalidades de IA. A integração é feita através do LangChain e permite que você escolha qual provedor usar com base nas variáveis de ambiente configuradas.

## Configuração

### 1. Obter API Key do Google Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Get API Key"
4. Copie a chave gerada

### 2. Configurar Variável de Ambiente

Adicione a chave ao arquivo `.env.local`:

```bash
# Google Gemini API Key (Alternativa ao OpenAI)
GOOGLE_API_KEY=your-google-api-key-here
```

### 3. Prioridade de Providers

O sistema seleciona o provedor de IA automaticamente:

- **Se `GOOGLE_API_KEY` está definida**: Usa Google Gemini
- **Se apenas `OPENAI_API_KEY` está definida**: Usa OpenAI
- **Se nenhuma está definida**: Funcionalidades de IA são desabilitadas

## Modelos Utilizados

### Google Gemini

- **Modelo padrão**: `gemini-2.0-flash-exp`
- **Características**: Gratuito, muito rápido, suporta function calling, experimental (Gemini 2.0)
- **Alternativas gratuitas**: `gemini-1.5-flash-latest`, `gemini-1.5-pro-latest`
- **Documentação**: [Google AI Studio](https://ai.google.dev/)

### OpenAI

- **Modelo padrão**: `gpt-4o-mini`
- **Características**: Rápido, econômico, excelente para function calling
- **Documentação**: [OpenAI Platform](https://platform.openai.com/)

## Rate Limits

### Google Gemini (Free Tier)

- **Requisições por minuto (RPM)**: 15
- **Requisições por dia (RPD)**: 1500
- **Tokens por minuto (TPM)**: 1,000,000
- [Mais informações sobre pricing](https://ai.google.dev/pricing)

### OpenAI

- Varia de acordo com o plano e modelo
- Rate limits são retornados nos headers das respostas
- [Mais informações sobre rate limits](https://platform.openai.com/docs/guides/rate-limits)

## Health Check

O endpoint `/api/health` agora retorna informações sobre o provedor de IA configurado:

### Exemplo com Gemini

```json
{
  "status": "ok",
  "checks": {
    "ai": {
      "provider": "gemini",
      "available": true,
      "configured": true,
      "status": "healthy",
      "models": 15,
      "info": "Rate limits: 15 RPM (free tier), 1500 RPD"
    }
  }
}
```

### Exemplo com OpenAI

```json
{
  "status": "ok",
  "checks": {
    "ai": {
      "provider": "openai",
      "available": true,
      "configured": true,
      "status": "healthy",
      "rateLimits": {
        "requests": {
          "limit": 10000,
          "remaining": 9995,
          "reset": "5s"
        },
        "tokens": {
          "limit": 2000000,
          "remaining": 1999000,
          "reset": "1m30s"
        }
      }
    }
  }
}
```

## Uso no Código

A integração é transparente - você não precisa mudar nada no código existente. Todas as funções continuam funcionando da mesma forma:

```typescript
import {
  chatCompletion,
  chatCompletionWithTools,
} from '@/lib/ai/langchainClient';

// Funciona com OpenAI ou Gemini automaticamente
const response = await chatCompletion('Olá, como você está?', {
  systemMessage: 'Você é um assistente útil.',
});

// Function calling também funciona com ambos
const result = await chatCompletionWithTools(prompt, {
  tools: myTools,
  systemMessage: 'System prompt...',
});
```

## Verificar Provedor Ativo

Para verificar qual provedor está sendo usado:

```typescript
import { AI_PROVIDER, getModelConfig } from '@/lib/ai/langchainClient';

console.log('Provider ativo:', AI_PROVIDER); // 'openai' ou 'gemini'

const config = getModelConfig();
console.log('Configuração:', config);
// {
//   provider: 'gemini',
//   providerName: 'Google Gemini',
//   model: 'gemini-2.0-flash-exp',
//   temperature: 0.7,
//   maxTokens: 1000,
//   available: true
// }
```

## Alternar entre Providers

Para alternar entre OpenAI e Gemini, simplesmente mude as variáveis de ambiente:

### Usar Gemini

```bash
GOOGLE_API_KEY=your-google-key
# OPENAI_API_KEY pode estar definida ou não - Gemini tem prioridade
```

### Usar OpenAI

```bash
OPENAI_API_KEY=your-openai-key
# Remova ou comente GOOGLE_API_KEY
```

### Usar Ambos (Gemini tem prioridade)

```bash
GOOGLE_API_KEY=your-google-key
OPENAI_API_KEY=your-openai-key
# Sistema usará Gemini
```

## Vantagens do Gemini

1. **Gratuito para começar**: 15 RPM é suficiente para desenvolvimento
2. **Multimodal nativo**: Suporte a imagens, vídeo, áudio (em versões futuras)
3. **Context window grande**: 1M tokens no Gemini 1.5
4. **Rápido**: Latência comparável ou melhor que GPT-4o-mini
5. **Sem necessidade de cartão de crédito**: Free tier sem billing

## Limitações Conhecidas

1. **Rate limits mais baixos no free tier**: 15 RPM vs OpenAI que varia
2. **Headers de rate limit**: Gemini não expõe limites nos headers como OpenAI
3. **Disponibilidade regional**: Pode ter restrições em alguns países

## Troubleshooting

### Erro: "Invalid API key"

- Verifique se a chave foi copiada corretamente
- Verifique se a API está habilitada no Google Cloud Console

### Erro: "Rate limit exceeded"

- Free tier: 15 requisições por minuto
- Aguarde 1 minuto antes de tentar novamente
- Considere upgrade para tier pago

### Erro: "Quota exceeded"

- Limite diário de 1500 requisições atingido
- Aguarde reset (meia-noite Pacific Time)
- Considere upgrade para tier pago

## Recursos Adicionais

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini Pricing](https://ai.google.dev/pricing)
- [LangChain Google GenAI Integration](https://js.langchain.com/docs/integrations/chat/google_generativeai)

## Próximos Passos

Funcionalidades planejadas para integração com Gemini:

- [ ] Suporte a multimodal (imagens)
- [ ] Caching de contexto para economizar tokens
- [ ] Streaming de respostas
- [ ] Fine-tuning com dados customizados
