// ===============================
// PROTEÇÃO DE ACESSO
// ===============================
const token = localStorage.getItem("token");
if (!token) window.location.replace("index.html");

// ===============================
// BLOQUEIO DE HISTÓRICO
// ===============================
window.history.pushState(null, null, window.location.href);
window.onpopstate = () => window.history.pushState(null, null, window.location.href);

// ===============================
// LOGOUT
// ===============================
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.replace("index.html");
});

// ===============================
// SIDEBAR
// ===============================
const sidebar = document.querySelector(".sidebar");
const toggleBtn = document.getElementById("toggleSidebar");

toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
  localStorage.setItem(
    "sidebarState",
    sidebar.classList.contains("collapsed") ? "collapsed" : "expanded"
  );
});

// ===============================
// MAIN
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  const savedState = localStorage.getItem("sidebarState");
  if (savedState === "collapsed") sidebar.classList.add("collapsed");

  const API_URL = "https://tccsmartpoint.onrender.com/api";

  const token = localStorage.getItem("token");
  const statusEl = document.getElementById("status");
  const tbody = document.getElementById("leiturasBody");

  // ===============================
  // SOCKET.IO
  // ===============================
  const socket = io("https://tccsmartpoint.onrender.com", {
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    statusEl.textContent = "Conectado";
    statusEl.classList.add("online");
  });

  socket.on("disconnect", () => {
    statusEl.textContent = "Desconectado";
    statusEl.classList.remove("online");
  });

  // ===============================
  // FORMATADORES
  // ===============================
  function formatarDataISO(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR");
  }

  function formatarHoraISO(iso) {
    if (!iso) return "--:--:--";
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR");
  }

  // ===============================
  // LEITURA AO VIVO
  // ===============================
  socket.on("novaLeitura", (payload) => {
    const leitura = payload?.leitura ?? payload;
    adicionarLeitura(leitura);
  });

  // ===============================
  // CARREGAR INICIAIS
  // ===============================
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
        tbody.innerHTML = "<tr><td colspan='8'>Nenhum registro encontrado.</td></tr>";
        return;
      }

      leituras.forEach((l) => adicionarLeitura(l));

    } catch (err) {
      tbody.innerHTML = "<tr><td colspan='8'>Erro ao carregar leituras.</td></tr>";
    }
  }

  // ===============================
  // ADICIONAR LINHA NA TABELA
  // ===============================
  function adicionarLeitura(leitura) {
    if (!leitura) return;

    const dataFormatada = formatarDataISO(leitura.data);
    const horaFormatada = formatarHoraISO(leitura.data);

    const colaborador = leitura.colaborador
      ? leitura.colaborador.nome
      : "-";

    const dispositivo = leitura.dispositivo
      ? leitura.dispositivo.nome
      : "-";

    const tipo = leitura.tipo_batida || "-";
    const autorizado = leitura.autorizado ? "Sim" : "Não";

    const msg = leitura.autorizado
      ? "Acesso permitido"
      : "Cartão não reconhecido";

    const tr = document.createElement("tr");
    tr.classList.add(leitura.autorizado ? "permitido" : "negado");

    tr.innerHTML = `
      <td>${dataFormatada}</td>
      <td>${horaFormatada}</td>
      <td><span class="tipo ${tipo}">${tipo}</span></td>
      <td>${colaborador}</td>
      <td>${dispositivo}</td>
      <td>${leitura.tag_uid || "-"}</td>
      <td>${autorizado}</td>
      <td>${msg}</td>
    `;

    tbody.prepend(tr);

    tr.classList.add("highlight");
    setTimeout(() => tr.classList.remove("highlight"), 2000);

    if (tbody.children.length > 100) {
      tbody.removeChild(tbody.lastChild);
    }
  }

  carregarLeitrasIniciais();
});
