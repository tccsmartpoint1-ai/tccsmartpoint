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

// Mantém o estado entre recarregamentos
document.addEventListener("DOMContentLoaded", () => {
  const savedState = localStorage.getItem("sidebarState");
  if (savedState === "collapsed") sidebar.classList.add("collapsed");
});

document.addEventListener("DOMContentLoaded", () => {
  const API = "https://tccsmartpoint.onrender.com/api";
  const token = localStorage.getItem("token");
  if (!token) return window.location.replace("index.html");

  const tabelaBody = document.getElementById("leiturasBody");
  const statusLeituras = document.getElementById("status");

  // ===== CONEXÃO SOCKET.IO =====
  const socket = io(API.replace("/api", ""), { transports: ["websocket"] });

  socket.on("connect", () => {
    statusLeituras.textContent = "Conectado";
    statusLeituras.classList.add("online");
  });

  socket.on("disconnect", () => {
    statusLeituras.textContent = "Desconectado";
    statusLeituras.classList.remove("online");
  });

  socket.on("novaLeitura", (leitura) => adicionarLeitura(leitura));

  // ===== BUSCA INICIAL =====
  async function carregarLeituras() {
    try {
      const res = await fetch(`${API}/leituras?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

      const data = await res.json();
      tabelaBody.innerHTML = "";
      (data.data || []).forEach((l) => adicionarLeitura(l));
    } catch (err) {
      console.error("Erro ao carregar leituras:", err);
    }
  }

  // ===== INSERE UMA NOVA LINHA =====
  function adicionarLeitura(l) {
    const tr = document.createElement("tr");

    const data = l.data || new Date(l.hora).toLocaleDateString("pt-BR");
    const hora = l.hora ? l.hora.split(".")[0] : "--:--:--";
    const colaborador = l.Colaborador ? l.Colaborador.nome : "-";
    const dispositivo = l.Dispositivo ? l.Dispositivo.nome : "-";

    const mensagem = l.mensagem?.includes("Acesso permitido")
      ? "Acesso permitido"
      : "Cartão não reconhecido";

    tr.innerHTML = `
      <td>${data}</td>
      <td>${hora}</td>
      <td>${colaborador}</td>
      <td>${dispositivo}</td>
      <td>${l.tag_uid || "-"}</td>
      <td>${l.autorizado ? "✅ Sim" : "❌ Não"}</td>
      <td>${mensagem}</td>
    `;

    tr.classList.add(l.autorizado ? "permitido" : "negado");

    tabelaBody.prepend(tr);
    tr.classList.add("highlight");
    setTimeout(() => tr.classList.remove("highlight"), 2000);
  }

  carregarLeituras();
});
