// ===============================
//      PROTEÇÃO DE ACESSO
// ===============================
const token = localStorage.getItem("token");
if (!token) window.location.replace("index.html");

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

// ===============================
//        MODAL
// ===============================
const modalOverlay = document.getElementById("modalOverlay");
const modal = document.getElementById("modalColaborador");
const btnNovo = document.getElementById("btnNovo");
const btnClose = document.getElementById("modalClose");
const btnCancel = document.getElementById("modalCancel");
const form = document.getElementById("formUsuariosModal");

function abrirModal() {
  modalOverlay.style.display = "flex";
}
function fecharModal() {
  modalOverlay.style.display = "none";
  delete form.dataset.editId;
  form.reset();
}

btnNovo.addEventListener("click", abrirModal);
btnClose.addEventListener("click", fecharModal);
btnCancel.addEventListener("click", fecharModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) fecharModal();
});

// ===============================
//         API + FORMULÁRIO
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const API = "https://tccsmartpoint.onrender.com/api";

  const tabelaBody = document.querySelector("#tblUsuarios tbody");
  const inputBuscar = document.getElementById("buscar");

  // Campos do modal
  const fNome = document.getElementById("m_nome");
  const fCPF = document.getElementById("m_cpf");
  const fEmail = document.getElementById("m_email");
  const fTag = document.getElementById("m_tag");
  const fStatus = document.getElementById("m_status");

  let listaColaboradores = [];
  let mapaTags = {};

  // ===============================
  //     MÁSCARA CPF
  // ===============================
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

  // ===============================
  // CARREGAR COLABORADORES + TAGS
  // ===============================
  async function carregarDados() {
    try {
      const [resColab, resTags] = await Promise.all([
        fetch(`${API}/colaboradores`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/tags`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      listaColaboradores = await resColab.json();
      const tags = await resTags.json();

      mapaTags = {};
      tags.forEach(t => {
        if (t.colaborador_id) mapaTags[t.colaborador_id] = t.uid;
      });

      renderTabela();
    } catch (err) {
      tabelaBody.innerHTML = "<tr><td colspan='8'>Erro ao carregar colaboradores.</td></tr>";
    }
  }

  // ===============================
  //     RENDER TABELA
  // ===============================
  function renderTabela(filtro = "") {
    tabelaBody.innerHTML = "";
    const termo = filtro.trim().toLowerCase();

    const dados = listaColaboradores.filter(c => {
      if (!termo) return true;
      return (c.nome || "").toLowerCase().includes(termo) ||
             (c.cpf || "").toLowerCase().includes(termo);
    });

    if (dados.length === 0) {
      tabelaBody.innerHTML = "<tr><td colspan='8'>Nenhum colaborador encontrado.</td></tr>";
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
        <td>${c.nome}</td>
        <td>${c.cpf}</td>
        <td>-</td>
        <td>-</td>
        <td>${tag}</td>
        <td>
          <span class="badge ${c.ativo ? "badge-success" : "badge-muted"}">
            ${c.ativo ? "Ativo" : "Inativo"}
          </span>
        </td>
        <td>${c.criado_em ? c.criado_em.split("T")[0] : "-"}</td>
      `;

      tabelaBody.appendChild(tr);
    });
  }

  inputBuscar.addEventListener("input", (e) => {
    renderTabela(e.target.value);
  });

  // ===============================
  //      AÇÕES DA TABELA
  // ===============================
  tabelaBody.addEventListener("click", async (e) => {
    const btn = e.target;
    const id = btn.dataset.id;
    if (!id) return;

    // EXCLUIR
    if (btn.classList.contains("action-delete")) {
      if (!confirm("Deseja excluir este colaborador?")) return;

      await fetch(`${API}/colaboradores/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      carregarDados();
      return;
    }

    // ATIVAR / INATIVAR
    if (btn.classList.contains("action-lock")) {
      await fetch(`${API}/colaboradores/${id}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });

      carregarDados();
      return;
    }

    // EDITAR
    if (btn.classList.contains("action-edit")) {
      const colab = listaColaboradores.find(c => c.id == id);
      if (!colab) return;

      fNome.value = colab.nome;
      fCPF.value = mascaraCPF(colab.cpf);
      fEmail.value = colab.email || "";
      fStatus.value = colab.ativo ? "true" : "false";
      fTag.value = mapaTags[colab.id] || "";

      form.dataset.editId = id;

      abrirModal();
    }
  });

  // ===============================
  //    SALVAR (NOVO + EDITAR)
  // ===============================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      nome: fNome.value.trim(),
      cpf: fCPF.value.replace(/\D/g, ""),
      email: fEmail.value.trim(),
      ativo: fStatus.value === "true"
    };

    const tagUid = fTag.value.trim().toUpperCase();
    const editId = form.dataset.editId;

    if (!payload.nome || !payload.cpf || !tagUid) {
      alert("Preencha Nome, CPF e Tag RFID.");
      return;
    }

    let colab;

    // EDITAR
    if (editId) {
      const res = await fetch(`${API}/colaboradores/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      colab = await res.json();

      // atualizar TAG existente
      await fetch(`${API}/tags/updateByColab/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uid: tagUid })
      });
    }

    // CADASTRAR NOVO
    else {
      const res = await fetch(`${API}/colaboradores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      colab = await res.json();

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
    }

    form.reset();
    delete form.dataset.editId;
    fecharModal();
    carregarDados();
  });

  carregarDados();
});
