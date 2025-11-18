// ===============================
// PROTEÇÃO DE ACESSO
// ===============================
const token = localStorage.getItem("token");
if (!token) window.location.replace("index.html");

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

document.addEventListener("DOMContentLoaded", () => {
  const savedState = localStorage.getItem("sidebarState");
  if (savedState === "collapsed") sidebar.classList.add("collapsed");
});

// ===============================
// TUDO RELACIONADO A RELATÓRIOS
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const API = "https://tccsmartpoint.onrender.com/api";

  const form = document.getElementById("formRelatorios");
  const btnAtualizar = document.getElementById("btnAtualizar");
  const btnCsv = document.getElementById("btnCsv");
  const btnPdf = document.getElementById("btnPdf");

  const tblBody = document.getElementById("tblBody");

  const rNome = document.getElementById("resNome");
  const rCpf = document.getElementById("resCpf");
  const rCargo = document.getElementById("resCargo");
  const rSetor = document.getElementById("resSetor");
  const rPeriodo = document.getElementById("resPeriodo");

  function limparFolha() {
    tblBody.innerHTML = "";
    rNome.textContent = "";
    rCpf.textContent = "";
    rCargo.textContent = "";
    rSetor.textContent = "";
    rPeriodo.textContent = "";
  }

  function fmtHora(valor) {
    return valor ? valor : "-";
  }

  function fmtDataBR(data) {
    if (!data) return "-";
    const d = new Date(data);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
  }

  async function buscarFolha(filtros = {}) {
    const query = new URLSearchParams(filtros).toString();
    const res = await fetch(`${API}/folha?${query}`);
    if (!res.ok) throw new Error("Erro ao buscar folha");
    return res.json();
  }

  function montarFolha(dados, filtros) {
    if (!dados || !dados.colaborador) {
      limparFolha();
      return;
    }

    rNome.textContent = dados.colaborador.nome || "-";
    rCpf.textContent = dados.colaborador.cpf || "-";
    rCargo.textContent = dados.colaborador.cargo || "-";
    rSetor.textContent = dados.colaborador.setor || "-";
    rPeriodo.textContent =
      `${fmtDataBR(filtros.inicio)} até ${fmtDataBR(filtros.fim)}`;

    tblBody.innerHTML = dados.dias
      .map(d => `
      <tr>
        <td>${fmtDataBR(d.data)}</td>
        <td>${fmtHora(d.entrada)}</td>
        <td>${fmtHora(d.saidaAlmoco)}</td>
        <td>${fmtHora(d.retorno)}</td>
        <td>${fmtHora(d.saidaFinal)}</td>
        <td>${fmtHora(d.totalHoras)}</td>
        <td>${fmtHora(d.extras)}</td>
        <td>${fmtHora(d.faltas)}</td>
        <td>${fmtHora(d.atrasos)}</td>
        <td>${fmtHora(d.bancoHoras)}</td>
        <td>${d.obs || "-"}</td>
        <td class="no-print">
          <button class="btn-edit">&#9998;</button>
          <button class="btn-save" style="display:none;">💾</button>
        </td>
      </tr>
      `)
      .join("");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    limparFolha();

    const filtros = {
      colaborador: document.getElementById("relColaborador").value,
      dispositivo: document.getElementById("relDispositivo").value,
      inicio: document.getElementById("relInicio").value,
      fim: document.getElementById("relFim").value
    };

    try {
      const resultado = await buscarFolha(filtros);
      montarFolha(resultado, filtros);
    } catch (err) {
      console.error(err);
      limparFolha();
    }
  });

  btnAtualizar.addEventListener("click", () => {
    form.reset();
    limparFolha();
  });

  // ===============================
  // EXPORTAR CSV
  // ===============================
  btnCsv.addEventListener("click", () => {
    const linhas = [];
    document.querySelectorAll("#tblFolha tr").forEach(tr => {
      const colunas = Array.from(tr.children)
        .filter(td => !td.classList.contains("no-print"))
        .map(td => `"${td.innerText}"`);
      linhas.push(colunas.join(","));
    });

    const blob = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "folha_ponto.csv";
    a.click();
  });

  // ===============================
  // EXPORTAR PDF
  // ===============================
  btnPdf.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "pt", "a4");

    doc.setFontSize(14);
    doc.text("Folha de Ponto - Smart Point", 40, 40);

    doc.setFontSize(11);
    doc.text(`Nome: ${rNome.textContent}`, 40, 65);
    doc.text(`CPF: ${rCpf.textContent}`, 40, 80);
    doc.text(`Cargo: ${rCargo.textContent}`, 40, 95);
    doc.text(`Setor: ${rSetor.textContent}`, 40, 110);
    doc.text(`Período: ${rPeriodo.textContent}`, 40, 125);

    doc.autoTable({
      html: "#tblFolha",
      startY: 150,
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40 },
        2: { cellWidth: 60 },
        3: { cellWidth: 40 },
        4: { cellWidth: 50 },
        5: { cellWidth: 40 }
      },
      didParseCell: function (data) {
        if (data.cell.raw.classList?.contains("no-print")) {
          data.cell.styles.fillColor = false;
          data.cell.text = "";
        }
      }
    });

    doc.save("folha_ponto.pdf");
  });
});

// ===============================
// EDIÇÃO DE LINHAS
// ===============================
window.addEventListener("load", () => {
  const tabela = document.querySelector("#tblFolha");
  if (!tabela) return;

  tabela.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const linha = btn.closest("tr");
    const celulas = linha.querySelectorAll("td:not(.no-print):not(:last-child)");

    if (btn.classList.contains("btn-edit")) {
      linha.classList.add("editavel");
      celulas.forEach(td => td.setAttribute("contenteditable", "true"));
      linha.querySelector(".btn-edit").style.display = "none";
      linha.querySelector(".btn-save").style.display = "inline-block";
    }

    if (btn.classList.contains("btn-save")) {
      linha.classList.remove("editavel");
      celulas.forEach(td => td.removeAttribute("contenteditable"));
      linha.querySelector(".btn-edit").style.display = "inline-block";
      linha.querySelector(".btn-save").style.display = "none";

      linha.style.transition = "background 0.4s";
      linha.style.background = "#e8f5e9";
      setTimeout(() => (linha.style.background = ""), 1200);
    }
  });
});
