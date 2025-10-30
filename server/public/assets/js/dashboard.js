// ===== PROTEÇÃO DE ACESSO =====
const token = localStorage.getItem("token");
if (!token) window.location.href = "index.html";

// ===== LOGOUT =====
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "index.html";
});

// ===== CONTROLE DA SIDEBAR =====
const sidebar = document.querySelector(".sidebar");
const toggleBtn = document.getElementById("toggleSidebar");

// Alterna o estado da sidebar (expandida/recolhida)
toggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("collapsed");
  // (Opcional) salvar estado no localStorage
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
    // Substitua pela rota real do seu backend
    const res = await fetch("http://localhost:3000/api/status");
    if (!res.ok) throw new Error("Erro na resposta do servidor");

    const data = await res.json();

    // Arduino
    document.getElementById("arduinoStatus").textContent = data?.arduino?.online
      ? "Conectado"
      : "Desconectado";

    // RFID
    document.getElementById("rfidStatus").textContent = data?.rfid?.online
      ? "Operando"
      : "Offline";

    // Porta / Canal
    document.getElementById("portaStatus").textContent = data?.porta || "—";

    // Leituras Totais
    document.getElementById("totalLeituras").textContent =
      data?.leiturasHoje ?? 0;

    // Funcionários Ativos
    document.getElementById("totalFunc").textContent = data?.funcionarios ?? 0;

    // Leituras Recusadas
    document.getElementById("leiturasRecusadasVal").textContent =
      data?.recusadas ?? 0;
  } catch (err) {
    console.error("❌ Erro ao buscar status:", err);
    // Exibe fallback visual
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
  setInterval(atualizarStatus, 10000); // a cada 10 segundos
});

// ===== VERIFICAÇÃO DE SESSÃO EXPIRADA =====
function checkSession() {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && payload.exp < Date.now() / 1000) {
      localStorage.removeItem("token");
      window.location.href = "index.html";
    }
  } catch {
    localStorage.removeItem("token");
    window.location.href = "index.html";
  }
}
setInterval(checkSession, 600000); // a cada 10 minutos

// ===== FECHAR MENU AO CLICAR EM LINK (modo mobile) =====
document.querySelectorAll(".sidebar nav ul li a").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("collapsed");
    }
  });
});
