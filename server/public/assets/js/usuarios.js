// ===== PROTEÇÃO DE ACESSO =====
const token = localStorage.getItem("token");
if (!token) window.location.replace("index.html");

// ===== BLOQUEIO DE HISTÓRICO =====
window.history.pushState(null, null, window.location.href);
window.onpopstate = () => window.history.pushState(null, null, window.location.href);

// ===== LOGOUT SEGURO =====
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.replace("index.html");
});

// ===== CONTROLE DA SIDEBAR =====
const sidebar = document.querySelector(".sidebar");
const toggleBtn = document.getElementById("toggleSidebar");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
  localStorage.setItem(
    "sidebarState",
    sidebar.classList.contains("collapsed") ? "collapsed" : "expanded"
  );
});

// Mantém o estado da sidebar
document.addEventListener("DOMContentLoaded", () => {
  const savedState = localStorage.getItem("sidebarState");
  if (savedState === "collapsed") sidebar.classList.add("collapsed");
});

// ===== FUNCIONALIDADES DA PÁGINA =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("📘 Página de usuários carregada.");

  const form = document.querySelector("#formCadastro");
  const tabela = document.querySelector("#tabelaUsuarios tbody");

  // Mock inicial (simulação)
  const usuarios = [
    { cpf: "111.111.111-11", nome: "Maria Silva", tag: "TAG-01A2" },
    { cpf: "222.222.222-22", nome: "João Souza", tag: "TAG-09F8" }
  ];

  // Renderiza tabela
  function renderUsuarios() {
    tabela.innerHTML = "";
    usuarios.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.cpf}</td>
        <td>${u.nome}</td>
        <td>${u.tag}</td>
      `;
      tabela.appendChild(tr);
    });
  }

  renderUsuarios();

  // Cadastrar novo usuário
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const cpf = document.querySelector("#cpf").value.trim();
    const nome = document.querySelector("#nome").value.trim();
    const tag = document.querySelector("#tag").value.trim();

    if (!cpf || !nome || !tag) return alert("Preencha todos os campos.");

    usuarios.push({ cpf, nome, tag });
    renderUsuarios();
    form.reset();
  });
});
