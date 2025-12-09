# 📝 Lista de Tarefas (TODO)

Este arquivo rastreia recursos planejados, melhorias e tarefas contínuas para o TortaApp.

## 📌 Convenções

### Prioridades
- **🔴 Alta**: Crítico ou bloqueador. Deve ser feito o mais rápido possível.
- **🟡 Média**: Importante, mas não crítico. Planejado para próximas atualizações.
- **🟢 Baixa**: Bom ter (Nice to have). Baixa urgência.

### Tipos/Tags
- **[Feature]**: Nova funcionalidade.
- **[Fix]**: Correção de bug.
- **[Doc]**: Documentação.
- **[Perm]**: Permanente/Recorrente (Melhoria contínua).
- **[DevOps]**: Infraestrutura e Build.

---

## 🚀 Futuro & Planejamento

| ID | Prioridade | Tipo | Tarefa | Detalhes | Status |
|----|------------|------|--------|----------|--------|
| 001 | 🟡 Média | [Feature] | **Tooltip/Info do Shout** | Adicionar dica visual (ao lado ou abaixo do shout) explicando:<br>• Duração dos tickers<br>• Funcionamento do ganho de shouts<br>• Tickers Premium: Investimento vai para **Prêmios** e **Banco de Dados**<br>• Ticker de Admin<br>• Cores do Market Standard | ⬜ Pendente |
| 002 | 🟡 Média | [Feature] | **Ticker Refresh** | Implementar atualização automática do ticker global ao lançar novos tickers. | ⬜ Pendente |
| 003 | 🔴 Alta | [Feature] | **Suporte SFI (Southern Freedom Isles)** | Implementação do app para o cluster SFI (Ilhas e servers novos com chat de mercado separado do NFI). | ⬜ Pendente |
| 004 | 🟢 Baixa | [DevOps] | **Compilação Linux** | Configurar ambiente ou pipeline (GitHub Actions) para gerar executáveis Linux (.deb/.AppImage) oficialmente. | ⬜ Pendente |

## 🔄 Permanente / Contínuo

Lista de tarefas que nunca "acabam" e exigem atenção constante.

- [Perm] **Otimização de Performance**: Monitorar e melhorar tempo de carregamento e uso de memória.
- [Perm] **Tradução PT-BR**: Manter `README_PT.md` e interfaces sincronizadas com novas features.
- [Perm] **Segurança**: Revisar RLS policies no Supabase regularmente.

