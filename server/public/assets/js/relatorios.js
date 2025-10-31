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
  const API = "http://localhost:3000/api";

  const form = document.getElementById("formRelatorios");
  const statusRel = document.getElementById("statusRel");
  const btnAtualizar = document.getElementById("btnAtualizar");
  const btnCsv = document.getElementById("btnCsv");
  const btnPdf = document.getElementById("btnPdf");

  const tblResumo = document.querySelector("#tblResumo tbody");
  const tblColab = document.querySelector("#tblColab tbody");
  const tblDisp = document.querySelector("#tblDisp tbody");
  const tblAuth = document.querySelector("#tblAuth tbody");

  const colaboradores = {
    1: { nome: "João Silva", cpf: "111.111.111-11" },
    2: { nome: "Maria Oliveira", cpf: "222.222.222-22" },
    3: { nome: "Carlos Souza", cpf: "333.333.333-33" }
  };
  const dispositivos = { 1: "Entrada Principal" };

  function setStatus(msg, tipo = "info", load = false) {
    statusRel.querySelector("span").textContent = msg;
    statusRel.className = `status-msg ${tipo}`;
    statusRel.querySelector(".loader").style.display = load ? "inline-block" : "none";
  }

  function fmtData(d) {
    if (!d) return "-";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString("pt-BR");
  }

  async function buscarLeituras(filtros = {}) {
    const query = new URLSearchParams(filtros).toString();
    const res = await fetch(`${API}/leituras?${query}`);
    if (!res.ok) throw new Error("Erro ao buscar leituras");
    return res.json();
  }

  function montarRelatorio(dados, filtros) {
    const total = dados.length;
    const autorizadas = dados.filter(l => !!l.autorizado).length;
    const negadas = total - autorizadas;

    // Resumo
    tblResumo.innerHTML = `
      <tr>
        <td>${total}</td>
        <td>${autorizadas}</td>
        <td>${negadas}</td>
        <td>${fmtData(filtros.inicio)} a ${fmtData(filtros.fim)}</td>
      </tr>
    `;

    // Agrupar por colaborador
    const colabMap = {};
    dados.forEach(l => {
      const id = l.colaborador_id || 0;
      if (!colabMap[id]) colabMap[id] = { total: 0, ok: 0, no: 0 };
      colabMap[id].total++;
      l.autorizado ? colabMap[id].ok++ : colabMap[id].no++;
    });

    tblColab.innerHTML = Object.entries(colabMap)
      .map(([id, v]) => {
        const c = colaboradores[id] || { nome: "-", cpf: "-" };
        return `<tr>
          <td>${c.nome}</td>
          <td>${c.cpf}</td>
          <td>${v.total}</td>
          <td>${v.ok}</td>
          <td>${v.no}</td>
        </tr>`;
      })
      .join("") || `<tr><td colspan="5">Sem dados</td></tr>`;

    // Agrupar por dispositivo
    const dispMap = {};
    dados.forEach(l => {
      const id = l.dispositivo_id || 0;
      dispMap[id] = (dispMap[id] || 0) + 1;
    });

    tblDisp.innerHTML = Object.entries(dispMap)
      .map(([id, qtd]) => `<tr><td>${dispositivos[id] || "-"}</td><td>${qtd}</td></tr>`)
      .join("") || `<tr><td colspan="2">Sem dados</td></tr>`;

    // Autorizadas x Negadas
    tblAuth.innerHTML = `
      <tr><td>Autorizadas</td><td>${autorizadas}</td></tr>
      <tr><td>Negadas</td><td>${negadas}</td></tr>
    `;

    setStatus("Relatório gerado com sucesso.", "success");
  }

  // Exportação CSV
  function exportarCSV() {
    let csv = "";
    document.querySelectorAll("table").forEach(tabela => {
      const linhas = Array.from(tabela.querySelectorAll("tr"))
        .map(tr => Array.from(tr.querySelectorAll("th,td"))
          .map(td => `"${td.innerText}"`).join(","))
        .join("\n");
      csv += "\n" + linhas + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "relatorio.csv";
    a.click();
  }

  // Exportação PDF
  function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("Relatório Consolidado - Smart Point", 14, 20);
    doc.autoTable({ html: "#tblResumo", startY: 30 });
    doc.autoTable({ html: "#tblColab", startY: doc.lastAutoTable.finalY + 10 });
    doc.autoTable({ html: "#tblDisp", startY: doc.lastAutoTable.finalY + 10 });
    doc.autoTable({ html: "#tblAuth", startY: doc.lastAutoTable.finalY + 10 });
    doc.save("relatorio.pdf");
  }

  // Eventos
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const filtros = {
      colaborador: document.getElementById("relColaborador").value,
      dispositivo: document.getElementById("relDispositivo").value,
      inicio: document.getElementById("relInicio").value,
      fim: document.getElementById("relFim").value
    };
    try {
      setStatus("Gerando relatório...", "info", true);
      const dados = await buscarLeituras(filtros);
      montarRelatorio(dados, filtros);
    } catch (err) {
      setStatus("Erro ao gerar relatório.", "error");
      console.error(err);
    }
  });

  btnAtualizar.addEventListener("click", () => {
    form.reset();
    tblResumo.innerHTML = "";
    tblColab.innerHTML = "";
    tblDisp.innerHTML = "";
    tblAuth.innerHTML = "";
    setStatus("Pronto para gerar.");
  });

  btnCsv.addEventListener("click", exportarCSV);
  btnPdf.addEventListener("click", exportarPDF);

  setStatus("Pronto para gerar.");
});
// ======== EDIÇÃO DE FOLHA DE PONTO ======== //
window.addEventListener("load", () => {
  const tabela = document.querySelector("#tblFolha");
  if (!tabela) return;

  tabela.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const linha = btn.closest("tr");
    const celulas = linha.querySelectorAll("td:not(:last-child)");

    // Modo editar
    if (btn.classList.contains("btn-edit")) {
      linha.classList.add("editavel");
      celulas.forEach(td => td.setAttribute("contenteditable", "true"));
      linha.querySelector(".btn-edit").style.display = "none";
      linha.querySelector(".btn-save").style.display = "inline-block";
    }

    // Modo salvar
    if (btn.classList.contains("btn-save")) {
      linha.classList.remove("editavel");
      celulas.forEach(td => td.removeAttribute("contenteditable"));
      linha.querySelector(".btn-edit").style.display = "inline-block";
      linha.querySelector(".btn-save").style.display = "none";

      // Destaque visual
      linha.style.transition = "background 0.5s";
      linha.style.background = "#e8f5e9";
      setTimeout(() => (linha.style.background = ""), 1500);
    }
  });
});