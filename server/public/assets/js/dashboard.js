// ===== PROTEÇÃO DE ACESSO =====
const token = localStorage.getItem("token");
if (!token) {
  window.location.replace("index.html");
}

// ===== BLOQUEIO DE HISTÓRICO (impede retorno após logout) =====
window.history.pushState(null, null, window.location.href);
window.onpopstate = function () {
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

// Alterna o estado da sidebar (expandida/recolhida)
toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
  localStorage.setItem(
    "sidebarState",
    sidebar.classList.contains("collapsed") ? "collapsed" : "expanded"
  );
});

// Mantém o estado da sidebar entre atualizações
document.addEventListener("DOMContentLoaded", () => {
  const savedState = localStorage.getItem("sidebarState");
  if (savedState === "collapsed") sidebar.classList.add("collapsed");
});

// ===== FUNÇÃO DE ATUALIZAÇÃO DOS WIDGETS =====
async function atualizarStatus() {
  const loader = document.getElementById("loader");
  loader.style.display = "block";

  try {
    // ===== Substitua pela rota real da sua API backend =====
    const response = await fetch("http://localhost:3000/api/status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Erro na resposta do servidor");

    const data = await response.json();

    // Arduino
    document.getElementById("arduinoStatus").textContent =
      data?.arduino?.online ? "Conectado" : "Desconectado";

    // RFID
    document.getElementById("rfidStatus").textContent =
      data?.rfid?.online ? "Operando" : "Offline";

    // Porta / Canal
    document.getElementById("portaStatus").textContent = data?.porta || "—";

    // Leituras Totais (Hoje)
    document.getElementById("totalLeituras").textContent =
      data?.leiturasHoje ?? 0;

    // Funcionários Ativos
    document.getElementById("totalFunc").textContent = data?.funcionarios ?? 0;

    // Leituras Recusadas
    document.getElementById("leiturasRecusadasVal").textContent =
      data?.recusadas ?? 0;
  } catch (err) {
    console.error("❌ Erro ao buscar status:", err);
    // Fallback visual
    document.getElementById("arduinoStatus").textContent = "Erro de conexão";
    document.getElementById("rfidStatus").textContent = "Erro de conexão";
    document.getElementById("portaStatus").textContent = "—";
    document.getElementById("totalLeituras").textContent = "0";
    document.getElementById("totalFunc").textContent = "0";
    document.getElementById("leiturasRecusadasVal").textContent = "0";
  } finally {
    loader.style.display = "none";
  }
}

// ===== ATUALIZAÇÃO AUTOMÁTICA =====
document.addEventListener("DOMContentLoaded", () => {
  atualizarStatus();
  setInterval(atualizarStatus, 10000); // Atualiza a cada 10s
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
setInterval(checkSession, 600000); // Verifica a cada 10min

// ===== FECHAR MENU AO CLICAR EM LINK (modo mobile) =====
document.querySelectorAll(".sidebar nav ul li a").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("collapsed");
    }
  });
});
