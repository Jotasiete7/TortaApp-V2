fetch('https://SUA-SITE.netlify.app/.netlify/functions/get-forms')
  .then(r => r.json())
  .then(forms => {
    const container = document.getElementById('lista-anuncios');
    forms.forEach(f => {
      const data = f.data;
      const card = `
        <div class="card">
          <h3>${data.nick} <small>(${data.servidor})</small></h3>
          <p><strong>Contato:</strong> ${data.contato}</p>
          <div class="tags">
            ${data.servico1_categoria ? `<span class="tag ${data.servico1_categoria.toLowerCase()}">${data.servico1_skill} ${data.servico1_ql}QL – ${data.servico1_preco}</span>` : ''}
            ${data.servico2_categoria ? `<span class="tag ${data.servico2_categoria.toLowerCase()}">${data.servico2_skill} ${data.servico2_ql}QL – ${data.servico2_preco}</span>` : ''}
          </div>
        </div>
      `;
      container.innerHTML += card;
    });
  });
