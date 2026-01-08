import fs from 'fs';
import path from 'path';

const projectStatusPath = path.resolve(process.cwd(), 'PROJECT_STATUS.md');
const todoPath = path.resolve(process.cwd(), 'TODO.md');

// Update PROJECT_STATUS.md
try {
    let content = fs.readFileSync(projectStatusPath, 'utf8');

    // Update Last Updated date
    content = content.replace(
        /\*\*📅 Última Atualização:\*\* .*/,
        `**📅 Última Atualização:** ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} BRT`
    );

    // Add Release v2.1.5 to Recent Implementations if not present
    if (!content.includes('Release v2.1.5')) {
        const newImplementation = `
### Janeiro 2026
- **08/01** - Release v2.1.5 "Clean Slate" 🧹 (Cleanup & Mobile Ready)
- **08/01** - Project Documentation Standardization`;

        content = content.replace('### Janeiro 2026', newImplementation);
    }

    // Update Status
    content = content.replace(
        /\| \*\*Status\*\* \| .*/,
        '| **Status** | 🟢 Produção Ativa (v2.1.5) |'
    );

    fs.writeFileSync(projectStatusPath, content, 'utf8');
    console.log('Updated PROJECT_STATUS.md');
} catch (err) {
    console.error('Error updating PROJECT_STATUS.md:', err);
}

// Update TODO.md
try {
    let content = fs.readFileSync(todoPath, 'utf8');

    // Mark cleanup task as complete
    content = content.replace(
        /\| 015 \| 🟢 Baixa \| \[DevOps\] \| \*\*Organização do Projeto\*\* \| .* \| ✅ Concluído .* \|/,
        '| 015 | 🟢 Baixa | [DevOps] | **Organização do Projeto** | Estruturação de pastas e limpeza da raiz (_archive). | ✅ Concluído (08/01) |'
    );

    // Update Project Status link task if exists or add note
    content = content.replace(
        /\| 018 \| 🔴 Alta \| \[DevOps\] \| \*\*Auto-Update Signing \(CI\/CD\)\*\* \| .* \| ⬜ Pendente \|/,
        '| 018 | 🔴 Alta | [DevOps] | **Auto-Update Signing (CI/CD)** | Corrigir automação de chaves/assinatura. (Adiado v2.1.5) | ⬜ Pendente |'
    );

    fs.writeFileSync(todoPath, content, 'utf8');
    console.log('Updated TODO.md');

} catch (err) {
    console.error('Error updating TODO.md:', err);
}
