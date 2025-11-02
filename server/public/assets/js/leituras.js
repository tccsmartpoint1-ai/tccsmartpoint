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
  // Configuração da API e token
  const API = "http://localhost:3000/api";
  const token = localStorage.getItem("token");
  if (!token) window.location.replace("../pages/login.html");

  // Elementos da UI
  const tabelaBody = document.getElementById("tabelaBody");
  const statusLeituras = document.getElementById("statusLeituras");
  const formFiltro = document.getElementById("filtroLeituras");
  const btnAtualizar = document.getElementById("btnAtualizar");
  const btnExportar = document.getElementById("btnExportar");
  const btnExportarPDF = document.getElementById("btnExportarPDF");
  const btnAnterior = document.getElementById("btnAnterior");
  const btnProxima = document.getElementById("btnProxima");
  const infoPagina = document.getElementById("infoPagina");

  // Estado e paginação
  const LIMITE = 50;
  let paginaAtual = 1;
  let totalPaginas = 1;
  let leituras = [];
  let timerPolling = null;

  // Mapas temporários (até o backend enviar join)
  const colaboradores = {
    1: { nome: "João Silva", cpf: "111.111.111-11" },
    2: { nome: "Maria Oliveira", cpf: "222.222.222-22" },
    3: { nome: "Carlos Souza", cpf: "333.333.333-33" }
  };
  const dispositivos = { 1: "Entrada Principal" };

  // Modal
  const modal = document.getElementById("modalDetalhes");
  const fecharModal = document.getElementById("fecharModal");

  // Helpers
  function atualizarStatus(msg, tipo = "info", loader = false) {
    statusLeituras.querySelector("span").textContent = msg;
    statusLeituras.className = `status-msg ${tipo}`;
    statusLeituras.querySelector(".loader").style.display = loader ? "inline-block" : "none";
  }

  function formatarData(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "-" : d.toLocaleString("pt-BR");
  }

  async function carregarLeituras(filtros = {}) {
    try {
      atualizarStatus("Carregando leituras...", "info", true);

      const params = new URLSearchParams(filtros);
      const res = await fetch(`${API}/leituras?limit=20&sort=desc`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        return window.location.replace("../pages/login.html");
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${txt || "Erro"}`);
      }

      const dados = await res.json();
      leituras = Array.isArray(dados) ? dados : [];

      totalPaginas = Math.max(1, Math.ceil(leituras.length / LIMITE));
      paginaAtual = 1;

      renderizarPagina();
      atualizarStatus(`Última atualização: ${new Date().toLocaleTimeString()}`, "success");
    } catch (e) {
      console.error(e);
      tabelaBody.innerHTML = "<tr><td colspan='5'>Erro ao carregar dados.</td></tr>";
      atualizarStatus("Erro ao carregar leituras.", "error");
    }
  }

  // ====== FUNÇÃO MODIFICADA ======
  function renderizarPagina() {
    tabelaBody.innerHTML = "";

    const inicio = (paginaAtual - 1) * LIMITE;
    const fim = inicio + LIMITE;
    const pagina = leituras.slice(inicio, fim);

    if (!pagina.length) {
      tabelaBody.innerHTML = "<tr><td colspan='5'>Nenhum registro encontrado.</td></tr>";
    } else {
      pagina.forEach((l) => {
        const c = colaboradores[l.colaborador_id] || { nome: "-", cpf: "-" };
        const d = dispositivos[l.dispositivo_id] || "-";
        const tr = document.createElement("tr");

        // 🔴 aplica cor vermelha se não autorizado
        if (!l.autorizado) tr.classList.add("nao-autorizado");

        tr.innerHTML = `
          <td>${c.cpf}</td>
          <td>${c.nome}</td>
          <td>${l.tag_uid || "-"}</td>
          <td>${d}</td>
          <td>${formatarData(l.hora)}</td>
          <td>${l.autorizado ? "✅ Sim" : "❌ Não"}</td>
          <td>${l.mensagem || (l.autorizado ? "" : "Cartão não reconhecido")}</td>
        `;
        tr.addEventListener("click", () => abrirModal(l));
        tabelaBody.appendChild(tr);
      });
    }

    infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    btnAnterior.disabled = paginaAtual <= 1;
    btnProxima.disabled = paginaAtual >= totalPaginas;
  }

  function abrirModal(l) {
    const c = colaboradores[l.colaborador_id] || { nome: "-", cpf: "-" };
    document.getElementById("detCpf").textContent = c.cpf;
    document.getElementById("detNome").textContent = c.nome;
    document.getElementById("detTag").textContent = l.tag_uid || "-";
    document.getElementById("detDisp").textContent = dispositivos[l.dispositivo_id] || "-";
    document.getElementById("detHora").textContent = formatarData(l.hora);
    document.getElementById("detIp").textContent = l.ip || "-";
    document.getElementById("detAutorizado").textContent = l.autorizado ? "Sim" : "Não";
    modal.style.display = "block";
  }

  // Fechamento do modal
  fecharModal.onclick = () => (modal.style.display = "none");
  window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

  // Filtro
  formFiltro.addEventListener("submit", (e) => {
    e.preventDefault();
    carregarLeituras({
      colaborador: document.getElementById("colaborador").value.trim(),
      dispositivo: document.getElementById("dispositivo").value.trim(),
      inicio: document.getElementById("dataInicio").value,
      fim: document.getElementById("dataFim").value
    });
  });

  // Atualizar
  btnAtualizar.addEventListener("click", () => {
    formFiltro.reset();
    carregarLeituras();
  });

  // Exportar CSV
  btnExportar.addEventListener("click", () => {
    const linhas = Array.from(document.querySelectorAll("#tabelaLeituras tr"));
    const csv = linhas
      .map(tr => Array.from(tr.querySelectorAll("th,td")).map(td => `"${td.innerText}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "leituras.csv";
    a.click();
  });

  // Exportar PDF
  btnExportarPDF.addEventListener("click", () => {
    if (!leituras.length) return alert("Nenhuma leitura disponível.");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setTextColor(33, 150, 243);
    doc.text("Relatório de Leituras - Smart Point", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28);

    const colunas = ["CPF", "Colaborador", "Tag", "Dispositivo", "Data/Hora"];
    const linhas = leituras.map(l => {
      const c = colaboradores[l.colaborador_id] || { nome: "-", cpf: "-" };
      return [c.cpf, c.nome, l.tag_uid || "-", dispositivos[l.dispositivo_id] || "-", formatarData(l.hora)];
    });

    doc.autoTable({
      startY: 35,
      head: [colunas],
      body: linhas,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 150, 243] }
    });

    doc.save("leituras_smartpoint.pdf");
  });

  // Navegação da paginação
  btnAnterior.addEventListener("click", () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      renderizarPagina();
    }
  });
  btnProxima.addEventListener("click", () => {
    if (paginaAtual < totalPaginas) {
      paginaAtual++;
      renderizarPagina();
    }
  });

  // Inicialização e polling
  carregarLeituras();
  timerPolling = setInterval(() => carregarLeituras(), 5000);
});
