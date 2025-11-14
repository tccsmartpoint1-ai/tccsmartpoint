// ===============================
//      PROTEÇÃO DE ACESSO
// ===============================
const token = localStorage.getItem("token");
if (!token) window.location.replace("index.html");

window.history.pushState(null, null, window.location.href);
window.onpopstate = () => window.history.pushState(null, null, window.location.href);

// ===============================
//  TUDO APÓS O DOM CARREGAR
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const API = "https://tccsmartpoint.onrender.com/api";

  // ---------------------------------
  // TOPO / SIDEBAR / LOGOUT
  // ---------------------------------
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.replace("index.html");
    });
  }

  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.getElementById("toggleSidebar");
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      localStorage.setItem(
        "sidebarState",
        sidebar.classList.contains("collapsed") ? "collapsed" : "expanded"
      );
    });

    const savedState = localStorage.getItem("sidebarState");
    if (savedState === "collapsed") sidebar.classList.add("collapsed");
  }

  // ---------------------------------
  // MODAL
  // ---------------------------------
  const modalOverlay = document.getElementById("modalOverlay");
  const btnNovo = document.getElementById("btnNovo");
  const btnClose = document.getElementById("modalClose");
  const btnCancel = document.getElementById("modalCancel");
  const form = document.getElementById("formModal");

  function abrirModal() {
    if (modalOverlay) modalOverlay.style.display = "flex";
  }

  function fecharModal() {
    if (modalOverlay) modalOverlay.style.display = "none";
    if (form) {
      form.dataset.editId = "";
      form.reset();
    }
  }

  if (btnNovo) btnNovo.addEventListener("click", abrirModal);
  if (btnClose) btnClose.addEventListener("click", fecharModal);
  if (btnCancel) btnCancel.addEventListener("click", fecharModal);

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) fecharModal();
    });
  }

  // ---------------------------------
  // CAMPOS DO FORM / TABELA
  // ---------------------------------
  const tabelaBody = document.querySelector("#tblUsuarios tbody");
  const inputBuscar = document.getElementById("buscar");

  const fNome          = document.getElementById("f_nome");
  const fCPF           = document.getElementById("f_cpf");
  const fEmail         = document.getElementById("f_email");
  const fAdmissao      = document.getElementById("f_admissao");
  const fFuncao        = document.getElementById("f_funcao");
  const fDepartamento  = document.getElementById("f_departamento");
  const fJornada       = document.getElementById("f_jornada");
  const fEscala        = document.getElementById("f_escala");
  const fTag           = document.getElementById("f_tag");
  const fStatus        = document.getElementById("f_status");
  const fBancoHoras    = document.getElementById("f_bancoHoras");

  let listaColaboradores = [];
  let mapaTags = {};

  function mascaraCPF(v) {
    v = v.replace(/\D/g, "").slice(0, 11);
    let out = "";
    if (v.length > 0) out = v.slice(0, 3);
    if (v.length > 3) out += "." + v.slice(3, 6);
    if (v.length > 6) out += "." + v.slice(6, 9);
    if (v.length > 9) out += "-" + v.slice(9, 11);
    return out;
  }

  if (fCPF) {
    fCPF.addEventListener("input", (e) => {
      e.target.value = mascaraCPF(e.target.value);
    });
  }

  // ---------------------------------
  // CARREGAR COLABORADORES + TAGS
  // ---------------------------------
  async function carregarDados() {
    if (!tabelaBody) return;

    try {
      const [resColab, resTags] = await Promise.all([
        fetch(`${API}/colaboradores`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/tags`,          { headers: { Authorization: `Bearer ${token}` } })
      ]);

      listaColaboradores = await resColab.json();
      const tags = await resTags.json();

      mapaTags = {};
      if (Array.isArray(tags)) {
        tags.forEach(t => {
          if (t.colaborador_id) mapaTags[t.colaborador_id] = t.uid;
        });
      }

      renderTabela();
    } catch {
      tabelaBody.innerHTML = "<tr><td colspan='8'>Erro ao carregar colaboradores.</td></tr>";
    }
  }

  // ---------------------------------
  // RENDER TABELA
  // ---------------------------------
  function renderTabela(filtro = "") {
    if (!tabelaBody) return;

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

      tabelaBody.appendChild(tr);
    });
  }

  if (inputBuscar) {
    inputBuscar.addEventListener("input", (e) => {
      renderTabela(e.target.value);
    });
  }

  // ---------------------------------
  // AÇÕES DA TABELA
  // ---------------------------------
  if (tabelaBody) {
    tabelaBody.addEventListener("click", async (e) => {
      const btn = e.target;
      const id = btn.dataset.id;
      if (!id) return;

      // excluir
      if (btn.classList.contains("action-delete")) {
        if (!confirm("Deseja excluir este colaborador?")) return;

        await fetch(`${API}/colaboradores/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        carregarDados();
        return;
      }

      // ativar / inativar
      if (btn.classList.contains("action-lock")) {
        await fetch(`${API}/colaboradores/${id}/toggle`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` }
        });

        carregarDados();
        return;
      }

      // editar
      if (btn.classList.contains("action-edit")) {
        const colab = listaColaboradores.find(c => c.id == id);
        if (!colab) return;

        if (fNome)         fNome.value         = colab.nome || "";
        if (fCPF)          fCPF.value          = mascaraCPF(colab.cpf || "");
        if (fEmail)        fEmail.value        = colab.email || "";
        if (fAdmissao)     fAdmissao.value     = colab.data_admissao || "";
        if (fFuncao)       fFuncao.value       = colab.funcao || "";
        if (fDepartamento) fDepartamento.value = colab.departamento || "";
        if (fJornada)      fJornada.value      = colab.jornada || "";
        if (fEscala)       fEscala.value       = colab.escala || "";
        if (fStatus)       fStatus.value       = colab.ativo ? "true" : "false";
        if (fBancoHoras)   fBancoHoras.value   = colab.banco_horas_ativo ? "true" : "false";
        if (fTag)          fTag.value          = mapaTags[colab.id] || "";

        if (form) form.dataset.editId = id;

        abrirModal();
      }
    });
  }

  // ---------------------------------
  // SUBMIT DO FORM (CRIAR / EDITAR)
  // ---------------------------------
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        nome:          fNome ? fNome.value.trim() : "",
        cpf:           fCPF  ? fCPF.value.replace(/\D/g, "") : "",
        email:         fEmail ? fEmail.value.trim() : "",
        data_admissao: fAdmissao ? fAdmissao.value : null,
        funcao:        fFuncao ? fFuncao.value : "",
        departamento:  fDepartamento ? fDepartamento.value : "",
        jornada:       fJornada ? fJornada.value : "",
        escala:        fEscala ? fEscala.value : "",
        ativo:         fStatus ? fStatus.value === "true" : true,
        banco_horas_ativo: fBancoHoras ? fBancoHoras.value === "true" : false
      };

      const tagUid = fTag ? fTag.value.trim().toUpperCase() : "";
      const editId = form.dataset.editId;

      if (!payload.nome || !payload.cpf || !tagUid) {
        alert("Preencha Nome, CPF e Tag RFID.");
        return;
      }

      let colab;

      // editar
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

        await fetch(`${API}/colaboradores/${editId}/tag`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ uid: tagUid })
        });
      }
      // novo
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
  }

  // carrega dados ao abrir página
  carregarDados();
});
