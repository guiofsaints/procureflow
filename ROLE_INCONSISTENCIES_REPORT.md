# Relatório de Padronização: `sender` e `role` no Projeto ProcureFlow

**Data:** 10 de novembro de 2025  
**Status:** ✅ **CONCLUÍDO** - Padronização para usar apenas `'agent'`

## Resumo Executivo

O projeto foi **padronizado com sucesso** para usar apenas **`'agent'`** em todas as camadas, eliminando a inconsistência anterior entre `'assistant'` (frontend) e `'agent'` (database).

### Mudança Implementada

**ANTES:** Duas convenções conflitantes
- Database: `sender: 'agent'`
- Frontend: `role: 'assistant'`

**DEPOIS:** Uma única convenção padronizada
- Database: `sender: 'agent'`  
- Frontend: `role: 'agent'`  
- **Sem necessidade de conversão entre camadas**

---

## 1. Definições Padronizadas dos Schemas

### 1.1 MongoDB Schema (Banco de Dados)
**Localização:** `lib/db/schemas/agent-conversation.schema.ts`

```typescript
export enum MessageSender {
  User = 'user',
  Agent = 'agent',    // ✅ Padronizado
  System = 'system',
}

const AgentMessageSchema = new Schema({
  sender: {  // ✅ Campo: "sender"
    type: String,
    enum: Object.values(MessageSender),
    required: true,
  },
  content: String,
  createdAt: Date,
  metadata: Schema.Types.Mixed,
});
```

**Valores válidos:** `'user'`, `'agent'`, `'system'`  
**Campo:** `sender`

---

### 1.2 Domain Entity (Camada de Domínio)
**Localização:** `domain/entities.ts`

```typescript
export enum AgentMessageRole {
  User = 'user',
  Agent = 'agent',  // ✅ Padronizado (era 'assistant')
  System = 'system',
}

export interface AgentMessage {
  role: AgentMessageRole;  // ✅ Campo: "role"
  content: string;
  timestamp: Date;
  items?: Array<...>;
  cart?: {...};
  // ...
}
```

**Valores válidos:** `'user'`, `'agent'`, `'system'`  
**Campo:** `role`

---

### 1.3 Feature Types (Frontend)
**Localização:** `features/agent/types.ts`

```typescript
export type AgentRole = 'user' | 'agent' | 'system';  // ✅ Padronizado (era 'assistant')

export interface AgentMessage {
  id: string;
  role: AgentRole;  // ✅ Campo: "role"
  content: string;
  items?: AgentItem[];
  cart?: AgentCart;
  checkoutConfirmation?: AgentCheckoutConfirmation;
  purchaseRequest?: AgentPurchaseRequest;
}
```

**Valores válidos:** `'user'`, `'agent'`, `'system'`  
**Campo:** `role`

---

## 2. Mapeamento Entre Camadas (Simplificado)

### 2.1 Service → Frontend (Padronizado - Sem Conversão Necessária)
**Localização:** `features/agent/lib/agent.service.ts:664`

```typescript
// Agora ambos usam 'agent', sem necessidade de conversão
return {
  role: msg.sender === 'user' ? 'user' : 'agent',  // ✅ Consistente
  content,
};
```

**Observação:** Mapeamento direto, sem conversão de valores:
- `sender: 'user'` → `role: 'user'`
- `sender: 'agent'` → `role: 'agent'`  ✅ **Padronizado**

---

## 3. Arquivos Alterados na Padronização

### ✅ Arquivos Corrigidos:

| Arquivo | Linha | Alteração | Status |
|---------|-------|-----------|--------|
| `domain/entities.ts` | 87 | `Assistant` → `Agent` | ✅ Concluído |
| `features/agent/types.ts` | 7 | `'assistant'` → `'agent'` | ✅ Concluído |
| `agent.service.ts` | 302 | `AgentMessageRole.Assistant` → `AgentMessageRole.Agent` | ✅ Concluído |
| `agent.service.ts` | 664 | `'assistant'` → `'agent'` | ✅ Concluído |
| `agent.service.ts` | 1396 | `AgentMessageRole.Assistant` → `AgentMessageRole.Agent` | ✅ Concluído |
| `AgentChatPageContent.tsx` | 226 | `.filter(...role === 'assistant')` → `'agent'` | ✅ Concluído |
| `AgentChatPageContent.tsx` | 232 | `role: 'assistant'` → `'agent'` | ✅ Concluído |
| `AgentChatPageContent.tsx` | 266 | `role: 'assistant'` (erro) → `'agent'` | ✅ Concluído |
| `langchainClient.ts` | 396 | Removida verificação redundante `\|\| msg.role === 'agent'` | ✅ Concluído |
| `AgentMessageWithCheckout.example.tsx` | 14 | `'user' \| 'agent'` (já estava correto) | ✅ Verificado |
| `settings.service.ts` | 59 | `m.role === 'user'` → `m.sender === 'user'` | ✅ Concluído (bug anterior) |

---

## 4. Benefícios da Padronização

### ✅ Vantagens Obtidas:

1. **Simplicidade:** Não há mais necessidade de conversão entre `'assistant'` e `'agent'`
2. **Consistência:** Mesma nomenclatura em todas as camadas do projeto
3. **Menor Propensão a Bugs:** Não há risco de esquecer a conversão
4. **Código Mais Limpo:** Mapeamentos diretos sem lógica condicional extra
5. **Melhor Alinhamento:** Nome `'agent'` reflete melhor o domínio do negócio (procurement agent)

---

## 5. Regras de Uso Padronizadas (Guidelines)

### ✅ Quando usar `sender`:
- Ao trabalhar com **dados do MongoDB** (documentos do banco)
- Dentro de **serviços** que manipulam `AgentConversationModel`
- Ao **salvar** mensagens no banco de dados

**Valores:** `'user'`, `'agent'`, `'system'`

---

### ✅ Quando usar `role`:
- Ao trabalhar com **dados do frontend** (componentes React)
- Ao **retornar dados da API** para o cliente
- Dentro de **tipos TypeScript** para a UI

**Valores:** `'user'`, `'agent'`, `'system'`  ✅ **Agora consistente com DB**

---

### ✅ Conversão necessária:
**Apenas de campo, não de valor:**

Quando **buscar do DB** e **retornar para frontend**:
```typescript
{
  role: dbMessage.sender === 'user' ? 'user' : 'agent',  // ✅ Valores iguais
  content: dbMessage.content,
}
```

Quando **receber do frontend** e **salvar no DB**:
```typescript
conversation.messages.push({
  sender: frontendMessage.role === 'user' ? 'user' : 'agent',  // ✅ Valores iguais
  content: frontendMessage.content,
  createdAt: new Date(),
});
```

---

## 6. Arquivos Afetados (Resumo Final)

| Camada | Arquivo | Campo | Valores | Status |
|--------|---------|-------|---------|--------|
| **Database** | `lib/db/schemas/agent-conversation.schema.ts` | `sender` | `user`, `agent`, `system` | ✅ Já estava correto |
| **Domain** | `domain/entities.ts` | `role` | `user`, `agent`, `system` | ✅ Padronizado |
| **Feature Types** | `features/agent/types.ts` | `role` | `user`, `agent`, `system` | ✅ Padronizado |
| **Service** | `features/agent/lib/agent.service.ts` | Ambos (mapeia) | Valores consistentes | ✅ Padronizado |
| **Frontend** | `features/agent/components/*.tsx` | `role` | `user`, `agent`, `system` | ✅ Padronizado |
| **AI Client** | `lib/ai/langchainClient.ts` | `role` | `user`, `agent`, `system` | ✅ Padronizado |

---

## 7. Checklist Final de Validação

- [x] ✅ **Concluído:** Alterar `AgentMessageRole.Assistant` → `AgentMessageRole.Agent` em `domain/entities.ts`
- [x] ✅ **Concluído:** Alterar `AgentRole` de `'assistant'` → `'agent'` em `features/agent/types.ts`
- [x] ✅ **Concluído:** Atualizar todos os mapeamentos em `agent.service.ts`
- [x] ✅ **Concluído:** Atualizar filtros em `AgentChatPageContent.tsx`
- [x] ✅ **Concluído:** Remover verificação redundante em `langchainClient.ts`
- [x] ✅ **Concluído:** Corrigir exemplo `AgentMessageWithCheckout.example.tsx`
- [x] ✅ **Concluído:** Corrigir bug em `settings.service.ts` (m.role → m.sender)

---

## 8. Conclusão

✅ **Padronização completa e bem-sucedida!**

O projeto agora usa **exclusivamente `'agent'`** para representar mensagens do AI agent em todas as camadas (database, domain, frontend). Isso elimina a necessidade de conversões complexas e reduz significativamente a chance de bugs relacionados a nomenclatura inconsistente.

**Próximos passos recomendados:**
- � Atualizar documentação técnica (`.guided/` files) se necessário
- ✅ Executar testes para validar que nenhuma funcionalidade foi quebrada
- 🔍 Code review para garantir que nenhum caso foi esquecido

**Prioridade:** ✅ Concluído - Padronização aplicada com sucesso em todos os arquivos relevantes.
