// assets/js/usuarios.js

// Proteção de acesso
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

// Sidebar
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
//          CONFIGURAÇÃO MODAL
// =========================================
const modalOverlay = document.getElementById("modalOverlay");
const modal = document.getElementById("modalColaborador");
const btnNovo = document.getElementById("btnNovo");
const btnFechar = document.getElementById("modalClose");

// abrir
btnNovo.addEventListener("click", () => {
  modalOverlay.style.display = "flex";
});

// fechar
btnFechar.addEventListener("click", () => {
  modalOverlay.style.display = "none";
});

// fechar clicando no fundo
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) modalOverlay.style.display = "none";
});

// =========================================
//              API + FORMULÁRIO
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const API = "https://tccsmartpoint.onrender.com/api";

  const form = document.getElementById("formModal");
  const inputBuscar = document.getElementById("buscar");
  const tbody = document.querySelector("#tblUsuarios tbody");

  // Campos do modal
  const fNome = document.getElementById("f_nome");
  const fCPF = document.getElementById("f_cpf");
  const fEmail = document.getElementById("f_email");
  const fAdmissao = document.getElementById("f_admissao");
  const fFuncao = document.getElementById("f_funcao");
  const fDepartamento = document.getElementById("f_departamento");
  const fJornada = document.getElementById("f_jornada");
  const fEscala = document.getElementById("f_escala");
  const fTag = document.getElementById("f_tag");
  const fStatus = document.getElementById("f_status");
  const fBancoHoras = document.getElementById("f_bancoHoras");

  let listaColaboradores = [];
  let mapaTags = {};

  // Máscara CPF
  function mascaraCPF(v) {
    v = v.replace(/\D/g, "").slice(0, 11);
    let out = "";
    if (v.length > 0) out = v.slice(0, 3);
    if (v.length > 3) out += "." + v.slice(3, 6);
    if (v.length > 6) out += "." + v.slice(6, 9);
    if (v.length > 9) out += "-" + v.slice(9, 11);
    return out;
  }

  fCPF.addEventListener("input", (e) => {
    e.target.value = mascaraCPF(e.target.value);
  });

  // Carregar colaboradores + Tags
  async function carregarColaboradoresETags() {
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
          if (t.colaborador_id && !mapaTags[t.colaborador_id]) {
            mapaTags[t.colaborador_id] = t.uid;
          }
        });
      }

      renderTabela();
    } catch (err) {
      tbody.innerHTML = "<tr><td colspan='8'>Erro ao carregar colaboradores.</td></tr>";
    }
  }

  // Render tabela
  function renderTabela(filtro = "") {
    tbody.innerHTML = "";
    const termo = filtro.trim().toLowerCase();

    const dados = listaColaboradores.filter(c => {
      if (!termo) return true;
      return (c.nome || "").toLowerCase().includes(termo) ||
             (c.cpf || "").toLowerCase().includes(termo);
    });

    if (dados.length === 0) {
      tbody.innerHTML = "<tr><td colspan='8'>Nenhum colaborador encontrado.</td></tr>";
      return;
    }

    dados.forEach(c => {
      const tr = document.createElement("tr");
      const tag = mapaTags[c.id] || "-";

      tr.innerHTML = `
        <td>
          <div class="action-buttons">
            <button class="action-edit" data-id="${c.id}">✎</button>
            <button class="action-lock" data-id="${c.id}">🔒</button>
            <button class="action-delete" data-id="${c.id}">✖</button>
          </div>
        </td>
        <td>${c.nome || "-"}</td>
        <td>${c.cpf || "-"}</td>
        <td>${c.departamento || "-"}</td>
        <td>${c.funcao || "-"}</td>
        <td>${tag}</td>
        <td>
          <span class="badge ${c.ativo ? "badge-success" : "badge-muted"}">
            ${c.ativo ? "Ativo" : "Inativo"}
          </span>
        </td>
        <td>${c.data_admissao || "-"}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  inputBuscar.addEventListener("input", (e) => {
    renderTabela(e.target.value);
  });

  // Envio do formulário (modal)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = fNome.value.trim();
    const cpf = fCPF.value.replace(/\D/g, "");
    const email = fEmail.value.trim();
    const admissao = fAdmissao.value;
    const funcao = fFuncao.value;
    const departamento = fDepartamento.value;
    const jornada = fJornada.value;
    const escala = fEscala.value;
    const tagUid = fTag.value.trim().toUpperCase();
    const ativo = fStatus.value === "true";
    const bancoHoras = fBancoHoras.value === "true";

    if (!nome || !cpf || !tagUid) {
      alert("Preencha Nome, CPF e Tag RFID.");
      return;
    }

    try {
      // Criar colaborador
      const colabRes = await fetch(`${API}/colaboradores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nome,
          cpf,
          email,
          ativo,
          data_admissao: admissao,
          funcao,
          departamento,
          jornada,
          escala,
          banco_horas_ativo: bancoHoras
        })
      });

      const colab = await colabRes.json();

      if (!colab.id) {
        alert("Erro ao cadastrar colaborador.");
        return;
      }

      // Criar TAG
      await fetch(`${API}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: tagUid,
          colaborador_id: colab.id,
          ativo: true
        })
      });

      alert("Colaborador cadastrado com sucesso.");
      form.reset();

      modalOverlay.style.display = "none";

      carregarColaboradoresETags();

    } catch (err) {
      alert("Erro ao cadastrar colaborador.");
    }
  });

  carregarColaboradoresETags();
});
