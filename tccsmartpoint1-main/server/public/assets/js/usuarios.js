document.addEventListener("DOMContentLoaded", () => {
  console.log("Página de usuários carregada.");

  const form = document.querySelector("form");
  const tabela = document.querySelector("tbody");

  // Mock inicial
  const usuarios = [
    { cpf: "111.111.111-11", nome: "Maria Silva", tag: "TAG-01A2" },
    { cpf: "222.222.222-22", nome: "João Souza", tag: "TAG-09F8" }
  ];

  // Renderiza tabela
  function renderUsuarios() {
    tabela.innerHTML = "";
    usuarios.forEach(u => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${u.cpf}</td><td>${u.nome}</td><td>${u.tag}</td>`;
      tabela.appendChild(tr);
    });
  }

  renderUsuarios();

  // Adiciona novo usuário (simulação)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputs = form.querySelectorAll("input");
    const novoUsuario = {
      cpf: inputs[0].value,
      nome: inputs[1].value,
      tag: inputs[2].value
    };
    usuarios.push(novoUsuario);
    renderUsuarios();
    form.reset();
  });
});
