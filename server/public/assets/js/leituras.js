// ===== PROTEÇÃO DE ACESSO =====
const token = localStorage.getItem("token");
if (!token) window.location.replace("index.html");

// ===== BLOQUEIO DE HISTÓRICO =====
window.history.pushState(null, null, window.location.href);
window.onpopstate = () => window.history.pushState(null, null, window.location.href);

// ===== LOGOUT =====
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

// ===== MANTÉM ESTADO DA SIDEBAR =====
document.addEventListener("DOMContentLoaded", () => {
  const savedState = localStorage.getItem("sidebarState");
  if (savedState === "collapsed") sidebar.classList.add("collapsed");
});

document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://tccsmartpoint1-production.up.railway.app/api";
  const token = localStorage.getItem("token");
  if (!token) return window.location.replace("index.html");

  const statusEl = document.getElementById("status");
  const tbody = document.getElementById("leiturasBody");

  // ===== CONEXÃO SOCKET.IO =====
  const socket = io(API_URL.replace("/api", ""), { transports: ["websocket"] });

  socket.on("connect", () => {
    statusEl.textContent = "Conectado";
    statusEl.classList.add("online");
  });

  socket.on("disconnect", () => {
    statusEl.textContent = "Desconectado";
    statusEl.classList.remove("online");
  });

  // ===== NOVAS LEITURAS EM TEMPO REAL =====
  socket.on("novaLeitura", (payload) => {
    const leitura =
      payload && payload.leitura // retorno da rota Arduino
        ? payload.leitura
        : payload; // retorno direto do socket do backend

    adicionarLeitura(leitura);
  });

  // ===== CARREGAR LEITURAS INICIAIS =====
  async function carregarLeiturasIniciais() {
    try {
      const res = await fetch(`${API_URL}/leituras?limit=20&sort=desc`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

      const json = await res.json();
      const leituras = Array.isArray(json.data) ? json.data : [];

      tbody.innerHTML = "";
      if (leituras.length === 0) {
        tbody.innerHTML = "<tr><td colspan='7'>Nenhum registro encontrado.</td></tr>";
        return;
      }

      leituras.forEach((l) => adicionarLeitura(l));
    } catch (err) {
      tbody.innerHTML = "<tr><td colspan='7'>Erro ao carregar leituras.</td></tr>";
    }
  }

  // ===== INSERE UMA NOVA LINHA NA TABELA =====
  function adicionarLeitura(leitura) {
    if (!leitura) return;

    const tr = document.createElement("tr");

    const data = leitura.data || "-";

    const hora = leitura.hora || "--:--:--";

    const colaborador = leitura.Colaborador
      ? leitura.Colaborador.nome
      : "-";

    const dispositivo = leitura.Dispositivo
      ? leitura.Dispositivo.nome
      : "-";

    const mensagem = leitura.autorizado ? "Acesso permitido" : "Cartão não reconhecido";

    tr.innerHTML = `
      <td>${data}</td>
      <td>${hora}</td>
      <td>${colaborador}</td>
      <td>${dispositivo}</td>
      <td>${leitura.tag_uid || "-"}</td>
      <td>${leitura.autorizado ? "Sim" : "Não"}</td>
      <td>${mensagem}</td>
    `;

    tr.classList.add(leitura.autorizado ? "permitido" : "negado");

    tbody.prepend(tr);

    tr.classList.add("highlight");
    setTimeout(() => tr.classList.remove("highlight"), 2000);
  }

  carregarLeiturasIniciais();
});
