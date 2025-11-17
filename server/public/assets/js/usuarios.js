// ===============================
// PROTEÇÃO DE ACESSO
// ===============================
const token = localStorage.getItem("token");
if (!token) window.location.replace("index.html");

window.history.pushState(null, null, window.location.href);
window.onpopstate = () => window.history.pushState(null, null, window.location.href);

// ===============================
// FUNÇÃO PARA COMPRIMIR IMAGEM
// ===============================
async function comprimirImagem(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      let { width, height } = img;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };

    reader.readAsDataURL(file);
  });
}

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

  const fFoto = document.getElementById("f_foto");
  const previewFoto = document.getElementById("previewFoto");

  if (fFoto) {
    fFoto.onchange = () => {
      const file = fFoto.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      previewFoto.src = url;
    };
  }

  function abrirModal() {
    modalOverlay.style.display = "flex";
    previewFoto.src = "../assets/img/fotos/default.png";
    if (fFoto) fFoto.value = "";
  }

  function fecharModal() {
    modalOverlay.style.display = "none";
    form.reset();
    delete form.dataset.editId;
    previewFoto.src = "../assets/img/fotos/default.png";
    if (fFoto) fFoto.value = "";
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

  fCPF.oninput = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 11);
    e.target.value = v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

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
  // CARREGAR DADOS
  // ---------------------------------
  let listaColaboradores = [];
  let mapaTags = {};

  async function carregarDados() {
    const [resColab, resTags] = await Promise.all([
      fetch(`${API}/colaboradores`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/tags`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    listaColaboradores = await resColab.json();
    const tags = await resTags.json();

    mapaTags = {};
    tags.forEach((t) => {
      if (t.colaborador_id) mapaTags[t.colaborador_id] = t.uid;
    });

    document.getElementById("countColab").textContent = listaColaboradores.length;

    renderTabela();
  }

  function removerAcentos(txt) {
  return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ---------------------------------
// RENDER TABELA
// ---------------------------------
function renderTabela(filtro = "") {

  console.clear();
  console.log("LISTA COMPLETA:", listaColaboradores);
  console.log("FILTRO DIGITADO:", filtro);

  tabelaBody.innerHTML = "";

  // REMOVE ACENTOS
  const termo = removerAcentos(filtro.trim().toLowerCase());
  const termoNumeros = termo.replace(/\D/g, "");

  const dadosFiltrados = listaColaboradores.filter((c) => {

    console.log("NOME TESTADO:", c.nome);

    const nome = removerAcentos(String(c.nome || "").toLowerCase());
    const cpf = (c.cpf || "").toString();
    const cpfSemMascara = cpf.replace(/\D/g, "");

    return (
      nome.includes(termo) ||
      cpfSemMascara.includes(termoNumeros)
    );
  });

  if (dadosFiltrados.length === 0) {
    tabelaBody.innerHTML =
      "<tr><td colspan='9'>Nenhum colaborador encontrado.</td></tr>";
    return;
  }

  dadosFiltrados.forEach((c) => {
    const tr = document.createElement("tr");

    const fotoUrl =
      c.foto_url && c.foto_url.startsWith("http")
        ? c.foto_url
        : "../assets/img/fotos/default.png";

    tr.innerHTML = `
      <td><img src="${fotoUrl}" class="tabela-foto"></td>

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


  // PESQUISA DE COLABORADORES
if (inputBuscar) {
  inputBuscar.addEventListener("input", () => {
    const termos = inputBuscar.value.trim().toLowerCase();
    renderTabela(termos);
  });
}

  // ---------------------------------
  // AÇÕES
  // ---------------------------------
  tabelaBody.onclick = async (e) => {
    const btn = e.target;
    const id = btn.dataset.id;
    if (!id) return;

    if (btn.classList.contains("action-delete")) {
      if (!confirm("Excluir colaborador?")) return;
      await fetch(`${API}/colaboradores/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      return carregarDados();
    }

    if (btn.classList.contains("action-lock")) {
      await fetch(`${API}/colaboradores/${id}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      return carregarDados();
    }

    if (btn.classList.contains("action-edit")) {
      const c = listaColaboradores.find((x) => x.id == id);

      fNome.value = c.nome;
      fCPF.value = c.cpf;
      fEmail.value = c.email;
      fAdmissao.value = c.data_admissao ? c.data_admissao.slice(0, 10) : "";
      fFuncao.value = c.funcao;
      fDepartamento.value = c.departamento;

      if (["5x2","6x1","12x36","24x72","turno fixo","revezamento","plantão"].includes(c.jornada)) {
        fJornada.value = c.jornada;
        boxJornadaCustom.classList.add("hidden");
      } else {
        fJornada.value = "personalizada";
        boxJornadaCustom.classList.remove("hidden");
        fJornadaCustom.value = c.jornada;
      }

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

      previewFoto.src = c.foto_url || "../assets/img/fotos/default.png";

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

    const tagUid = fTag.value.trim().toUpperCase();
    const editId = form.dataset.editId;

    if (!fNome.value || !fCPF.value.replace(/\D/g, "") || !tagUid) {
      alert("Preencha Nome, CPF e Tag RFID.");
      return;
    }

    let colab;

    // EDITAR
    if (editId) {
      await fetch(`${API}/colaboradores/${editId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: fNome.value,
          cpf: fCPF.value.replace(/\D/g, ""),
          email: fEmail.value,
          data_admissao: fAdmissao.value,
          funcao: fFuncao.value,
          departamento: fDepartamento.value,
          jornada: jornadaFinal,
          escala: escalaFinal,
          ativo: fStatus.value,
          banco_horas_ativo: fBancoHoras.value
        })
      });

      if (fFoto.files.length > 0) {
        const fotoOriginal = fFoto.files[0];
        const fotoComprimida = await comprimirImagem(fotoOriginal);

        const fdFoto = new FormData();
        fdFoto.append("foto", fotoComprimida);

        await fetch(`${API}/colaboradores/${editId}/foto`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fdFoto
        });
      }

      await fetch(`${API}/colaboradores/${editId}/tag`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uid: tagUid })
      });

    } else {
      // CRIAR
      const res = await fetch(`${API}/colaboradores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: fNome.value,
          cpf: fCPF.value.replace(/\D/g, ""),
          email: fEmail.value,
          data_admissao: fAdmissao.value,
          funcao: fFuncao.value,
          departamento: fDepartamento.value,
          jornada: jornadaFinal,
          escala: escalaFinal,
          ativo: fStatus.value,
          banco_horas_ativo: fBancoHoras.value
        })
      });

      colab = await res.json();

      if (fFoto.files.length > 0) {
        const fotoOriginal = fFoto.files[0];
        const fotoComprimida = await comprimirImagem(fotoOriginal);

        const fdFoto = new FormData();
        fdFoto.append("foto", fotoComprimida);

        await fetch(`${API}/colaboradores/${colab.id}/foto`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fdFoto
        });
      }

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
