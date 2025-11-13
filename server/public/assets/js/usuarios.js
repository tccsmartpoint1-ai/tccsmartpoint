// =========================================
//              PROTEÇÃO DE ACESSO
// =========================================
const token = localStorage.getItem("token");
if (!token) window.location.replace("index.html");

// Bloqueio de histórico
window.history.pushState(null, null, window.location.href);
window.onpopstate = () => window.history.pushState(null, null, window.location.href);

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.replace("index.html");
});

// =========================================
//              SIDEBAR
// =========================================
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

// =========================================
//              MODAL
// =========================================
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");
const modalCancel = document.getElementById("modalCancel");
const btnNovo = document.getElementById("btnNovo");

function abrirModal() {
  modalOverlay.style.display = "flex";
}

function fecharModal() {
  modalOverlay.style.display = "none";
}

btnNovo.addEventListener("click", abrirModal);
modalClose.addEventListener("click", fecharModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) fecharModal();
});

// =========================================
//           CAMPOS DO FORMULÁRIO
// =========================================

const form = document.getElementById("formUsuariosModal");

const fNome         = document.getElementById("m_nome");
const fCPF          = document.getElementById("m_cpf");
const fEmail        = document.getElementById("m_email");
const fAdmissao     = document.getElementById("m_admissao");
const fFuncao       = document.getElementById("m_funcao");
const fDepartamento = document.getElementById("m_departamento");
const fJornada      = document.getElementById("m_jornada");
const fEscala       = document.getElementById("m_escala");
const fTag          = document.getElementById("m_tag");
const fStatus       = document.getElementById("m_status");
const fBancoHoras   = document.getElementById("m_bancoHoras");

const inputBuscar   = document.getElementById("buscar");
const tabelaBody    = document.querySelector("#tblUsuarios tbody");

// =========================================
//              MÁSCARA CPF
// =========================================
fCPF.addEventListener("input", (e) => {
  let v = e.target.value.replace(/\D/g, "").slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  e.target.value = v;
});

// =========================================
//              API + LISTAGEM
// =========================================
const API = "https://tccsmartpoint.onrender.com/api";

let listaColaboradores = [];
let mapaTags = {};

async function carregarDados() {
  try {
    const [resColab, resTags] = await Promise.all([
      fetch(`${API}/colaboradores`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/tags`, { headers: { Authorization: `Bearer ${token}` } })
    ]);

    const colabs = await resColab.json();
    const tags = await resTags.json();

    listaColaboradores = Array.isArray(colabs) ? colabs : [];

    mapaTags = {};
    if (Array.isArray(tags)) {
      tags.forEach(t => {
        if (t.colaborador_id) mapaTags[t.colaborador_id] = t.uid;
      });
    }

    renderTabela();
  } catch (err) {
    tabelaBody.innerHTML = "<tr><td colspan='8'>Erro ao carregar dados.</td></tr>";
  }
}

function renderTabela(filtro = "") {
  tabelaBody.innerHTML = "";

  const termo = filtro.toLowerCase();

  const dados = listaColaboradores.filter(c =>
    c.nome?.toLowerCase().includes(termo) ||
    c.cpf?.toLowerCase().includes(termo)
  );

  if (dados.length === 0) {
    tabelaBody.innerHTML = "<tr><td colspan='8'>Nenhum colaborador encontrado.</td></tr>";
    return;
  }

  dados.forEach(c => {
    const tag = mapaTags[c.id] || "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="action-buttons">
          <button class="action-edit" data-id="${c.id}">✎</button>
          <button class="action-lock" data-id="${c.id}">🔒</button>
          <button class="action-delete" data-id="${c.id}">✖</button>
        </div>
      </td>
      <td>${c.nome}</td>
      <td>${c.cpf}</td>
      <td>${c.departamento || "-"}</td>
      <td>${c.funcao || "-"}</td>
      <td>${tag}</td>
      <td><span class="badge ${c.ativo ? "badge-success" : "badge-muted"}">${c.ativo ? "Ativo" : "Inativo"}</span></td>
      <td>${c.data_admissao || "-"}</td>
    `;
    tabelaBody.appendChild(tr);
  });
}

inputBuscar.addEventListener("input", (e) => {
  renderTabela(e.target.value);
});

// =========================================
//          CADASTRAR COLABORADOR
// =========================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = fNome.value.trim();
  const cpf = fCPF.value.replace(/\D/g, "");
  const tag = fTag.value.trim().toUpperCase();

  if (!nome || !cpf || !tag) {
    alert("Preencha Nome, CPF e Tag RFID.");
    return;
  }

  try {
    // Criar colaborador
    const res = await fetch(`${API}/colaboradores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        nome,
        cpf,
        email: fEmail.value.trim(),
        data_admissao: fAdmissao.value,
        funcao: fFuncao.value,
        departamento: fDepartamento.value,
        jornada: fJornada.value,
        escala: fEscala.value,
        ativo: fStatus.value === "true",
        banco_horas_ativo: fBancoHoras.value === "true"
      })
    });

    const colab = await res.json();

    if (!colab.id) {
      alert("Erro ao cadastrar colaborador.");
      return;
    }

    // Registrar TAG
    await fetch(`${API}/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        uid: tag,
        colaborador_id: colab.id,
        ativo: true
      })
    });

    alert("Colaborador cadastrado com sucesso.");
    form.reset();
    fecharModal();
    carregarDados();

  } catch (err) {
    alert("Erro ao cadastrar colaborador.");
  }
});

// =========================================
//     INICIAR CARREGAMENTO AO ABRIR
// =========================================
carregarDados();
