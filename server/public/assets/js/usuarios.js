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

document.addEventListener("DOMContentLoaded", () => {
  const API = "https://tccsmartpoint.onrender.com/api";

  const form = document.getElementById("formUsuarios");
  const btnLimpar = document.getElementById("btnLimpar");
  const btnNovo = document.getElementById("btnNovo");
  const cardForm = document.getElementById("cardForm");

  const inputNome = document.getElementById("nome");
  const inputCPF = document.getElementById("cpf");
  const inputEmail = document.getElementById("email");
  const inputAdmissao = document.getElementById("admissao");
  const inputFuncao = document.getElementById("funcao");
  const inputDepartamento = document.getElementById("departamento");
  const inputJornada = document.getElementById("jornada");
  const inputEscala = document.getElementById("escala");
  const inputTag = document.getElementById("tag");
  const inputStatus = document.getElementById("status");
  const inputBancoHoras = document.getElementById("bancoHoras");
  const inputBuscar = document.getElementById("buscar");

  const tbody = document.querySelector("#tblUsuarios tbody");

  let listaColaboradores = [];
  let mapaTags = {};

  btnNovo.addEventListener("click", () => {
    cardForm.scrollIntoView({ behavior: "smooth", block: "start" });
    inputNome.focus();
  });

  btnLimpar.addEventListener("click", () => {
    form.reset();
    inputStatus.value = "true";
    inputBancoHoras.value = "false";
  });

  function aplicarMascaraCPF(valor) {
    const v = valor.replace(/\D/g, "").slice(0, 11);
    const p1 = v.slice(0, 3);
    const p2 = v.slice(3, 6);
    const p3 = v.slice(6, 9);
    const p4 = v.slice(9, 11);
    let out = p1;
    if (p2) out += "." + p2;
    if (p3) out += "." + p3;
    if (p4) out += "-" + p4;
    return out;
  }

  inputCPF.addEventListener("input", (e) => {
    e.target.value = aplicarMascaraCPF(e.target.value);
  });

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

  function renderTabela(filtro = "") {
    tbody.innerHTML = "";

    const termo = filtro.trim().toLowerCase();

    const dados = listaColaboradores.filter(c => {
      if (!termo) return true;
      const nome = (c.nome || "").toLowerCase();
      const cpf = (c.cpf || "").toLowerCase();
      return nome.includes(termo) || cpf.includes(termo);
    });

    if (dados.length === 0) {
      tbody.innerHTML = "<tr><td colspan='8'>Nenhum colaborador encontrado.</td></tr>";
      return;
    }

    dados.forEach(c => {
      const tr = document.createElement("tr");

      const statusAtivo = c.ativo !== false;

      const tag = mapaTags[c.id] || "-";

      tr.innerHTML = `
        <td>
          <div class="action-buttons">
            <button class="action-edit" data-id="${c.id}" title="Editar">✎</button>
            <button class="action-lock" data-id="${c.id}" title="Ativar/Inativar">🔒</button>
            <button class="action-delete" data-id="${c.id}" title="Excluir">✖</button>
          </div>
        </td>
        <td>${c.nome || "-"}</td>
        <td>${c.cpf || "-"}</td>
        <td>${c.departamento || "-"}</td>
        <td>${c.funcao || "-"}</td>
        <td>${tag}</td>
        <td>
          <span class="badge ${statusAtivo ? "badge-success" : "badge-muted"}">
            ${statusAtivo ? "Ativo" : "Inativo"}
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = inputNome.value.trim();
    const cpf = inputCPF.value.replace(/\D/g, "");
    const email = inputEmail.value.trim() || null;
    const admissao = inputAdmissao.value || null;
    const funcao = inputFuncao.value.trim() || null;
    const departamento = inputDepartamento.value.trim() || null;
    const jornada = inputJornada.value || null;
    const escala = inputEscala.value || null;
    const tagUid = inputTag.value.trim().toUpperCase();
    const ativo = inputStatus.value === "true";
    const bancoHorasAtivo = inputBancoHoras.value === "true";

    if (!nome || !cpf || !tagUid) {
      alert("Preencha pelo menos Nome, CPF e Tag RFID.");
      return;
    }

    try {
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
          banco_horas_ativo: bancoHorasAtivo
        })
      });

      const colab = await colabRes.json();

      if (!colab || !colab.id) {
        alert("Erro ao cadastrar colaborador.");
        return;
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

      alert("Colaborador cadastrado com sucesso.");
      form.reset();
      inputStatus.value = "true";
      inputBancoHoras.value = "false";

      await carregarColaboradoresETags();

    } catch (err) {
      alert("Erro ao cadastrar colaborador.");
    }
  });

  carregarColaboradoresETags();
});
