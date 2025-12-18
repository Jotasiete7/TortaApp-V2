# TortaApp - Guia do Administrador

**Versão:** 0.1.0-beta  
**Para:** Administradores do Sistema

---

## 🛡️ Visão Geral do Painel Admin

O Painel Admin fornece ferramentas poderosas para gerenciar usuários, dados e configurações do sistema.

**Acesso:** Sidebar → Admin Panel (requer função admin)

---

## 👥 Gerenciamento de Usuários

### Visualizando Usuários

Navegue até **Admin Panel** → **User Manager**

**Informações Exibidas:**
- ID do Usuário
- Email
- Nick do jogo (se verificado)
- Função (user/admin)
- Data de registro
- Total de trades

### Atribuindo Função Admin

1. Encontre o usuário no User Manager
2. Clique em "Edit"
3. Alterne a função "Admin"
4. Salve as alterações

> **⚠️ Aviso:** Usuários admin têm acesso completo. Atribua apenas a indivíduos confiáveis.

---

## �� Gerenciamento de Preços

### Atualizando Preços de Referência

**Para Atualizar:**
1. Navegue até **Price Manager**
2. Busque pelo nome do item
3. Insira o novo preço (em copper)
4. Clique em "Save"

---

## 📦 Upload em Massa de Dados

### Formato NDJSON

Para importações de grandes conjuntos de dados, use NDJSON:

```json
{"nick":"PlayerName","item":"Iron ore","price":50,"quantity":100}
```

### Processo de Upload

1. Navegue até **Bulk Upload**
2. Selecione arquivo NDJSON
3. Revise a prévia
4. Clique em "Import"
5. Aguarde o processamento

---

## 📊 Estatísticas do Sistema

Visualize métricas em tempo real:
- Total de usuários
- Total de trades
- Usuários ativos (7 dias)
- Uso de armazenamento

---

## 📢 Mensagens do Ticker

**Para Adicionar:**
1. Navegue até **Ticker Manager**
2. Clique em "New Message"
3. Insira o texto
4. Defina prioridade
5. Salve

---

## 🔒 Segurança & Permissões

Todos os dados são protegidos com políticas RLS do Supabase:
- Usuários só veem seus próprios dados
- Admins podem ver todos (para suporte)

---

**Lembre-se:** Com grandes poderes vêm grandes responsabilidades! 🛡️
