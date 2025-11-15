// ===============================
// PROTEÇÃO DE ACESSO
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
  if (logoutBtn) logoutBtn.onclick = () => {
    localStorage.removeItem("token");
    window.location.replace("index.html");
  };

  const sidebar = document.querySelector(".sidebar");
  const toggleBtn = document.getElementById("toggleSidebar");

  if (toggleBtn) {
    toggleBtn.onclick = () => {
      sidebar.classList.toggle("collapsed");
      localStorage.setItem(
        "sidebarState",
        sidebar.classList.contains("collapsed") ? "collapsed" : "expanded"
      );
    };
  }
  if (localStorage.getItem("sidebarState") === "collapsed") {
    sidebar.classList.add("collapsed");
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
    modalOverlay.style.display = "flex";
  }

  function fecharModal() {
    modalOverlay.style.display = "none";
    form.reset();
    delete form.dataset.editId;

    boxJornadaCustom.classList.add("hidden");
    fJornadaCustom.value = "";

    boxEscalaCustom.classList.add("hidden");
    fEscalaCustom.value = "";
  }

  if (btnNovo) btnNovo.onclick = abrirModal;
  if (btnClose) btnClose.onclick = fecharModal;
  if (btnCancel) btnCancel.onclick = fecharModal;

  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) fecharModal();
  };

  // ---------------------------------
  // CAMPOS
  // ---------------------------------
  const tabelaBody = document.querySelector("#tblUsuarios tbody");
  const inputBuscar = document.getElementById("buscar");

  const fNome = document.getElementById("f_nome");
  const fCPF = document.getElementById("f_cpf");
  const fEmail = document.getElementById("f_email");
  const fAdmissao = document.getElementById("f_admissao");
  const fFuncao = document.getElementById("f_funcao");
  const fDepartamento = document.getElementById("f_departamento");

  const fJornada = document.getElementById("f_jornada");
  const fJornadaCustom = document.getElementById("f_jornada_custom");
  const boxJornadaCustom = document.getElementById("box_jornada_custom");

  const fEscala = document.getElementById("f_escala");
  const fEscalaCustom = document.getElementById("f_escala_custom");
  const boxEscalaCustom = document.getElementById("box_escala_custom");

  const fTag = document.getElementById("f_tag");
  const fStatus = document.getElementById("f_status");
  const fBancoHoras = document.getElementById("f_bancoHoras");

  // CPF MASK
  fCPF.oninput = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 11);
    e.target.value = v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  // CAMPOS PERSONALIZADOS
  fJornada.onchange = () => {
    if (fJornada.value === "personalizada") {
      boxJornadaCustom.classList.remove("hidden");
    } else {
      boxJornadaCustom.classList.add("hidden");
      fJornadaCustom.value = "";
    }
  };

  fEscala.onchange = () => {
    if (fEscala.value === "personalizada") {
      boxEscalaCustom.classList.remove("hidden");
    } else {
      boxEscalaCustom.classList.add("hidden");
      fEscalaCustom.value = "";
    }
  };

  // ---------------------------------
  // CARREGAR
  // ---------------------------------
  let listaColaboradores = [];
  let mapaTags = {};

  async function carregarDados() {
    const [resColab, resTags] = await Promise.all([
      fetch(`${API}/colaboradores`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/tags`, { headers: { Authorization: `Bearer ${token}` } })
    ]);

    listaColaboradores = await resColab.json();
    const tags = await resTags.json();

    mapaTags = {};
    tags.forEach((t) => {
      if (t.colaborador_id) mapaTags[t.colaborador_id] = t.uid;
    });

    renderTabela();
  }

  // ---------------------------------
  // RENDER TABELA
  // ---------------------------------
  function renderTabela(filtro = "") {
    tabelaBody.innerHTML = "";

    const termo = filtro.toLowerCase();
    const dadosFiltrados = listaColaboradores.filter((c) =>
      c.nome.toLowerCase().includes(termo)
    );

    if (dadosFiltrados.length === 0) {
      tabelaBody.innerHTML =
        "<tr><td colspan='8'>Nenhum colaborador encontrado.</td></tr>";
      return;
    }

    dadosFiltrados.forEach((c) => {
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
        <td>${mapaTags[c.id] || "-"}</td>
        <td><span class="badge ${c.ativo ? "badge-success" : "badge-muted"}">
            ${c.ativo ? "Ativo" : "Inativo"}
        </span></td>
        <td>${c.data_admissao || "-"}</td>
      `;

      tabelaBody.appendChild(tr);
    });
  }

  inputBuscar.oninput = (e) => renderTabela(e.target.value);

  // ---------------------------------
  // AÇÕES (EDIT / DELETE / TOGGLE)
  // ---------------------------------
  tabelaBody.onclick = async (e) => {
    const btn = e.target;
    const id = btn.dataset.id;
    if (!id) return;

    // DELETE
    if (btn.classList.contains("action-delete")) {
      if (!confirm("Excluir colaborador?")) return;
      await fetch(`${API}/colaboradores/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      return carregarDados();
    }

    // TOGGLE
    if (btn.classList.contains("action-lock")) {
      await fetch(`${API}/colaboradores/${id}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      return carregarDados();
    }

    // EDIT
    if (btn.classList.contains("action-edit")) {
      const c = listaColaboradores.find((x) => x.id == id);

      fNome.value = c.nome;
      fCPF.value = c.cpf;
      fEmail.value = c.email;
      fAdmissao.value = c.data_admissao;
      fFuncao.value = c.funcao;
      fDepartamento.value = c.departamento;

      // Jornada
      if (["5x2","6x1","12x36","24x72","turno fixo","revezamento","plantão"].includes(c.jornada)) {
        fJornada.value = c.jornada;
        boxJornadaCustom.classList.add("hidden");
      } else {
        fJornada.value = "personalizada";
        boxJornadaCustom.classList.remove("hidden");
        fJornadaCustom.value = c.jornada;
      }

      // Escala
      if (["normal","manhã","tarde","noturno","turnos alternados","plantão"].includes(c.escala)) {
        fEscala.value = c.escala;
        boxEscalaCustom.classList.add("hidden");
      } else {
        fEscala.value = "personalizada";
        boxEscalaCustom.classList.remove("hidden");
        fEscalaCustom.value = c.escala;
      }

      fStatus.value = c.ativo ? "true" : "false";
      fBancoHoras.value = c.banco_horas_ativo ? "true" : "false";
      fTag.value = mapaTags[c.id] || "";

      form.dataset.editId = id;
      abrirModal();
    }
  };

  // ---------------------------------
  // SUBMIT (CRIAR / EDITAR)
  // ---------------------------------
  form.onsubmit = async (e) => {
    e.preventDefault();

    const jornadaFinal =
      fJornada.value === "personalizada"
        ? fJornadaCustom.value.trim()
        : fJornada.value;

    const escalaFinal =
      fEscala.value === "personalizada"
        ? fEscalaCustom.value.trim()
        : fEscala.value;

    const payload = {
      nome: fNome.value,
      cpf: fCPF.value.replace(/\D/g, ""),
      email: fEmail.value,
      data_admissao: fAdmissao.value,
      funcao: fFuncao.value,
      departamento: fDepartamento.value,
      jornada: jornadaFinal,
      escala: escalaFinal,
      ativo: fStatus.value === "true",
      banco_horas_ativo: fBancoHoras.value === "true",
    };

    const tagUid = fTag.value.trim().toUpperCase();
    const editId = form.dataset.editId;

    if (!payload.nome || !payload.cpf || !tagUid) {
      alert("Preencha Nome, CPF e Tag RFID.");
      return;
    }

    let colab;

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

    } else {
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

    fecharModal();
    carregarDados();
  };

  carregarDados();
});
