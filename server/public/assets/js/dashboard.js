/* ============================
   BLOCO A — AUTENTICAÇÃO / ACESSO
   ============================ */

// Obtém o token salvo
const token = localStorage.getItem("token");

// Se não houver token → volta para o login
if (!token) {
  window.location.replace("index.html");
}

// Verifica se o token está válido (não corrompido)
try {
  const payload = JSON.parse(atob(token.split(".")[1]));

  // Se expirar → força logout imediato
  if (payload.exp && payload.exp < Date.now() / 1000) {
    localStorage.removeItem("token");
    window.location.replace("index.html");
  }
} catch {
  // Token inválido/corrompido → logout forçado
  localStorage.removeItem("token");
  window.location.replace("index.html");
}

/* Impede voltar ao sistema após logout */
window.history.pushState(null, null, window.location.href);
window.onpopstate = () => {
  window.history.pushState(null, null, window.location.href);
};

/* Logout seguro */
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.replace("index.html");
    });
  }
});


/* ============================
   BLOCO B — CONTROLE DA SIDEBAR
   ============================ */

const sidebar = document.querySelector(".sidebar");
const toggleBtn = document.getElementById("toggleSidebar");

/* Função para controlar sidebar conforme o tamanho da tela */
function toggleSidebarAction() {
  if (window.innerWidth > 768) {
    // DESKTOP → utiliza "collapsed"
    sidebar.classList.toggle("collapsed");

    // Salva estado para desktop
    localStorage.setItem(
      "sidebarState",
      sidebar.classList.contains("collapsed") ? "collapsed" : "expanded"
    );
  } else {
    // MOBILE → utiliza "active"
    sidebar.classList.toggle("active");
  }
}

toggleBtn.addEventListener("click", toggleSidebarAction);

/* Restaura estado da sidebar (apenas desktop) */
document.addEventListener("DOMContentLoaded", () => {
  if (window.innerWidth > 768) {
    const savedState = localStorage.getItem("sidebarState");
    if (savedState === "collapsed") sidebar.classList.add("collapsed");
  }
});

/* Fechar sidebar ao clicar fora no mobile */
document.addEventListener("click", (e) => {
  if (
    window.innerWidth <= 768 &&
    !sidebar.contains(e.target) &&
    !toggleBtn.contains(e.target)
  ) {
    sidebar.classList.remove("active");
  }
});




/* ============================
   BLOCO C — CONFIGURAÇÃO DE API
   ============================ */

/* Detecta automaticamente o ambiente */
const isLocalhost =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1";

/* Define API base */
const API = isLocalhost
  ? "http://localhost:3000/api"
  : "https://tccsmartpoint.onrender.com/api";

/* Opcional (debug) */
// console.log("API em uso:", API);


/* ============================
   BLOCO D — FUNÇÕES DE DADOS
   ============================ */

/* ------- WIDGET: STATUS ------- */
async function atualizarStatus() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "block";

  const widgetArduino = document.getElementById("statusArduino");
  const widgetRFID = document.getElementById("statusRFID");

  try {
    const res = await fetch(`${API}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error();
    const data = await res.json();

    // Arduino
    const arduinoOnline = data?.arduino?.online === true;
    widgetArduino.querySelector("p").textContent = arduinoOnline
      ? "Conectado"
      : "Desconectado";
    widgetArduino.classList.remove("ok", "error");
    widgetArduino.classList.add(arduinoOnline ? "ok" : "error");

    // RFID
    const rfidOnline = data?.rfid?.online === true;
    widgetRFID.querySelector("p").textContent = rfidOnline
      ? "Operando"
      : "Offline";
    widgetRFID.classList.remove("ok", "error");
    widgetRFID.classList.add(rfidOnline ? "ok" : "error");

    // Porta
    document.getElementById("portaStatus").textContent =
      data?.porta || "—";

    // Leituras hoje
    document.getElementById("totalLeituras").textContent =
      data?.leiturasHoje ?? 0;

    // Funcionários ativos
    document.getElementById("totalFunc").textContent =
      data?.funcionarios ?? 0;

    // Recusadas
    document.getElementById("leiturasRecusadasVal").textContent =
      data?.recusadas ?? 0;

  } catch (err) {
    console.error("Erro ao atualizar status:", err);

    widgetArduino.querySelector("p").textContent = "Erro";
    widgetRFID.querySelector("p").textContent = "Erro";

    widgetArduino.classList.remove("ok");
    widgetArduino.classList.add("error");

    widgetRFID.classList.remove("ok");
    widgetRFID.classList.add("error");

    document.getElementById("portaStatus").textContent = "—";
    document.getElementById("totalLeituras").textContent = "0";
    document.getElementById("totalFunc").textContent = "0";
    document.getElementById("leiturasRecusadasVal").textContent = "0";
  } finally {
    if (loader) loader.style.display = "none";
  }
}




/* ------- LEITURAS RECENTES ------- */
async function atualizarLeituras() {
  const tabela = document.getElementById("ultimasLeituras");

  try {
    const res = await fetch(`${API}/leituras/recentes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();

    if (!data.length) {
      tabela.innerHTML = `<tr><td colspan="3">Sem registros</td></tr>`;
      return;
    }

    tabela.innerHTML = data
      .slice(0, 5)
      .map(
        (l) => `
        <tr>
          <td>${new Date(l.dataHora).toLocaleString("pt-BR")}</td>
          <td>${l.tag}</td>
          <td>${l.status}</td>
        </tr>
      `
      )
      .join("");

  } catch (err) {
    tabela.innerHTML = `<tr><td colspan="3">Erro ao carregar</td></tr>`;
  }
}



/* ------- COLABORADORES ATIVOS ------- */
async function atualizarColaboradores() {
  const tabela = document.getElementById("colaboradoresAtivos");

  try {
    const res = await fetch(`${API}/colaboradores/ativos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();

    if (!data.length) {
      tabela.innerHTML = `<tr><td colspan="3">Nenhum ativo</td></tr>`;
      return;
    }

    tabela.innerHTML = data
      .slice(0, 5)
      .map(
        (c) => `
        <tr>
          <td>${c.nome}</td>
          <td>${c.cpf}</td>
          <td>${c.ultimaLeitura
            ? new Date(c.ultimaLeitura).toLocaleString("pt-BR")
            : "—"}</td>
        </tr>
      `
      )
      .join("");

  } catch {
    tabela.innerHTML = `<tr><td colspan="3">Erro ao carregar</td></tr>`;
  }
}



/* ------- STATUS DO SISTEMA ------- */
async function atualizarSistema() {
  const lista = document.getElementById("statusSistema");

  try {
    const res = await fetch(`${API}/sistema/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error();
    const data = await res.json();

    lista.innerHTML = `
      <li>API: <span class="status-indicador ${data.api ? "ok" : "error"}">${data.api ? "Online" : "Offline"}</span></li>
      <li>Banco de Dados: <span class="status-indicador ${data.db ? "ok" : "error"}">${data.db ? "Conectado" : "Erro"}</span></li>
      <li>Dispositivo: <span class="status-indicador ${data.device ? "ok" : "error"}">${data.device ? "Ativo" : "Inativo"}</span></li>
    `;

  } catch {
    lista.innerHTML = `
      <li>API: <span class="status-indicador error">Erro</span></li>
      <li>Banco de Dados: <span class="status-indicador error">Erro</span></li>
      <li>Dispositivo: <span class="status-indicador error">Erro</span></li>
    `;
  }
}


/* ============================
   BLOCO E — INICIALIZAÇÃO
   ============================ */

document.addEventListener("DOMContentLoaded", () => {

  /* Primeira carga */
  atualizarStatus();
  atualizarLeituras();
  atualizarColaboradores();
  atualizarSistema();

  /* Intervals organizados */
  const intervals = {
    status: setInterval(atualizarStatus, 10000),
    leituras: setInterval(atualizarLeituras, 15000),
    colaboradores: setInterval(atualizarColaboradores, 20000),
    sistema: setInterval(atualizarSistema, 30000),
  };

});


/* ============================
   BLOCO F — VALIDAÇÃO DE SESSÃO
   ============================ */

/* Função global de logout — usada em qualquer lugar */
function executarLogout() {
  localStorage.removeItem("token");
  window.location.replace("index.html");
}

/* Verifica expiração do token continuamente */
function verificarExpiracao() {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    // Se expirar → desloga
    if (payload.exp && payload.exp < Date.now() / 1000) {
      executarLogout();
    }
  } catch {
    // Token inválido
    executarLogout();
  }
}

/* Verificação a cada 1 minuto (ideal) */
setInterval(verificarExpiracao, 60000);


/* ============================
   BLOCO G — MENU MOBILE (LINKS)
   ============================ */

/* Fecha o menu ao clicar em qualquer link no mobile */
document.querySelectorAll(".sidebar nav ul li a").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("active");
    }
  });
});
