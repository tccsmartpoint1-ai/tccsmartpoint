// ===== PROTEÇÃO DE ACESSO =====
const token = localStorage.getItem("token");
if (!token) {
  window.location.replace("index.html");
}

// ===== BLOQUEIO DE HISTÓRICO (impede retorno após logout) =====
window.history.pushState(null, null, window.location.href);
window.onpopstate = () => {
  window.history.pushState(null, null, window.location.href);
};

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

document.addEventListener("DOMContentLoaded", () => {
  const savedState = localStorage.getItem("sidebarState");
  if (savedState === "collapsed") sidebar.classList.add("collapsed");
});

// ===== FUNÇÃO DE ATUALIZAÇÃO DOS WIDGETS =====
async function atualizarStatus() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "block";

  try {
    const res = await fetch("http://localhost:3000/api/status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erro na resposta do servidor");
    const data = await res.json();

    document.getElementById("arduinoStatus").textContent =
      data?.arduino?.online ? "Conectado" : "Desconectado";
    document.getElementById("rfidStatus").textContent =
      data?.rfid?.online ? "Operando" : "Offline";
    document.getElementById("portaStatus").textContent = data?.porta || "—";
    document.getElementById("totalLeituras").textContent =
      data?.leiturasHoje ?? 0;
    document.getElementById("totalFunc").textContent = data?.funcionarios ?? 0;
    document.getElementById("leiturasRecusadasVal").textContent =
      data?.recusadas ?? 0;
  } catch (err) {
    console.error("❌ Erro ao buscar status:", err);
    document.getElementById("arduinoStatus").textContent = "Erro de conexão";
    document.getElementById("rfidStatus").textContent = "Erro de conexão";
    document.getElementById("portaStatus").textContent = "—";
    document.getElementById("totalLeituras").textContent = "0";
    document.getElementById("totalFunc").textContent = "0";
    document.getElementById("leiturasRecusadasVal").textContent = "0";
  } finally {
    if (loader) loader.style.display = "none";
  }
}

// ===== LEITURAS RECENTES =====
async function atualizarLeituras() {
  const tabela = document.getElementById("ultimasLeituras");
  try {
    const res = await fetch("http://localhost:3000/api/leituras/recentes", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();

    tabela.innerHTML = data.length
      ? data
          .slice(0, 5)
          .map(
            (l) => `
          <tr>
            <td>${new Date(l.dataHora).toLocaleString("pt-BR")}</td>
            <td>${l.tag}</td>
            <td>${l.status}</td>
          </tr>`
          )
          .join("")
      : `<tr><td colspan="3">Sem registros recentes</td></tr>`;
  } catch {
    tabela.innerHTML = `<tr><td colspan="3">Erro ao carregar</td></tr>`;
  }
}

// ===== COLABORADORES ATIVOS =====
async function atualizarColaboradores() {
  const tabela = document.getElementById("colaboradoresAtivos");
  try {
    const res = await fetch("http://localhost:3000/api/colaboradores/ativos", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();

    tabela.innerHTML = data.length
      ? data
          .slice(0, 5)
          .map(
            (c) => `
          <tr>
            <td>${c.nome}</td>
            <td>${c.cpf}</td>
            <td>${c.ultimaLeitura ? new Date(c.ultimaLeitura).toLocaleString("pt-BR") : "—"}</td>
          </tr>`
          )
          .join("")
      : `<tr><td colspan="3">Nenhum colaborador ativo</td></tr>`;
  } catch {
    tabela.innerHTML = `<tr><td colspan="3">Erro ao carregar</td></tr>`;
  }
}

// ===== STATUS DO SISTEMA =====
async function atualizarSistema() {
  const lista = document.getElementById("statusSistema");
  try {
    const res = await fetch("http://localhost:3000/api/sistema/status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();

    lista.innerHTML = `
      <li>API: <span class="status-indicador" style="color:${data.api ? "#2e7d32" : "#c62828"}">${data.api ? "Online" : "Offline"}</span></li>
      <li>Banco de Dados: <span class="status-indicador" style="color:${data.db ? "#2e7d32" : "#c62828"}">${data.db ? "Conectado" : "Erro"}</span></li>
      <li>Dispositivo: <span class="status-indicador" style="color:${data.device ? "#2e7d32" : "#c62828"}">${data.device ? "Ativo" : "Inativo"}</span></li>
    `;
  } catch {
    lista.innerHTML = `
      <li>API: <span class="status-indicador" style="color:#c62828">Erro</span></li>
      <li>Banco de Dados: <span class="status-indicador" style="color:#c62828">Erro</span></li>
      <li>Dispositivo: <span class="status-indicador" style="color:#c62828">Erro</span></li>
    `;
  }
}

// ===== CICLO DE ATUALIZAÇÃO AUTOMÁTICA =====
document.addEventListener("DOMContentLoaded", () => {
  atualizarStatus();
  atualizarLeituras();
  atualizarColaboradores();
  atualizarSistema();

  setInterval(atualizarStatus, 10000);
  setInterval(atualizarLeituras, 15000);
  setInterval(atualizarColaboradores, 20000);
  setInterval(atualizarSistema, 30000);
});

// ===== VERIFICAÇÃO DE SESSÃO EXPIRADA =====
function checkSession() {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      localStorage.removeItem("token");
      window.location.replace("index.html");
    }
  } catch {
    localStorage.removeItem("token");
    window.location.replace("index.html");
  }
}
setInterval(checkSession, 600000);

// ===== FECHAR MENU AO CLICAR (modo mobile) =====
document.querySelectorAll(".sidebar nav ul li a").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("collapsed");
    }
  });
});
