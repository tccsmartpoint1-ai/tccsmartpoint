// =======================================
// CONFIGURAÇÃO GLOBAL DA API
// =======================================

// Carrega a API salva ou usa padrão
let API_BASE = localStorage.getItem("API_BASE") || "https://tccsmartpoint.onrender.com/api";

// Expõe para o resto do sistema
window.API = API_BASE;

// Host sem /api
const API_HOST = API_BASE.replace(/\/api\/?$/, "");


// =======================================
// STATUS DO SISTEMA
// =======================================
async function verificarStatusAPI() {
  const statusLinha   = document.getElementById("statusLinha");
  const apiBaseEmUso  = document.getElementById("apiBaseEmUso");
  const apiStatus     = document.getElementById("apiStatus");

  try {
    const res = await fetch(`${API_HOST}/api/status`);
    if (!res.ok) throw new Error();

    statusLinha.querySelector("span").textContent = "API Base em uso";
    apiBaseEmUso.textContent = API_BASE;

    apiStatus.textContent = "Online";
    apiStatus.classList.remove("pill-off");
    apiStatus.classList.add("pill-on");

  } catch {
    statusLinha.querySelector("span").textContent = "API indisponível";

    apiStatus.textContent = "Offline";
    apiStatus.classList.remove("pill-on");
    apiStatus.classList.add("pill-off");
  }
}

verificarStatusAPI();
setInterval(verificarStatusAPI, 30000);


// =======================================
// CONFIGURAÇÕES DA API
// =======================================

const campoApi = document.getElementById("apiBase");
campoApi.value = API_BASE;

document.getElementById("formApi").onsubmit = (e) => {
  e.preventDefault();

  const novaURL = campoApi.value.trim();
  if (!novaURL) {
    alert("Digite uma URL válida.");
    return;
  }

  localStorage.setItem("API_BASE", novaURL);
  API_BASE = novaURL;
  window.API = novaURL;

  alert("URL da API salva com sucesso!");
  location.reload();
};

document.getElementById("btnTestarApi").onclick = async () => {
  const url = campoApi.value.trim();
  if (!url) {
    alert("Digite uma URL antes de testar.");
    return;
  }

  const host = url.replace(/\/api\/?$/, "");

  try {
    const res = await fetch(`${host}/api/status`);
    if (!res.ok) throw new Error();

    alert("Conectado com sucesso!");
  } catch {
    alert("Falha ao conectar. Verifique a URL.");
  }
};


// =======================================
// DISPOSITIVOS — LISTAGEM
// =======================================

const btnRecarregarDispositivos = document.getElementById("btnRecarregarDispositivos");
const tabelaDispositivos = document.querySelector("#tblDispositivos tbody");

async function carregarDispositivos() {

  const token = localStorage.getItem("token"); // TOKEN

  tabelaDispositivos.innerHTML = `
    <tr>
      <td colspan="4" style="text-align:center;">Carregando...</td>
    </tr>
  `;

  try {
    const res = await fetch(`${API}/dispositivos`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error();

    const dispositivos = await res.json();

    if (!Array.isArray(dispositivos) || dispositivos.length === 0) {
      tabelaDispositivos.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center;">Nenhum dispositivo encontrado.</td>
        </tr>
      `;
      return;
    }

    tabelaDispositivos.innerHTML = "";

    dispositivos.forEach((d) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${d.id}</td>
        <td>${d.nome || "-"}</td>
        <td>${d.identificador || "-"}</td>
        <td>${d.descricao || "-"}</td>
      `;

      tabelaDispositivos.appendChild(tr);
    });

  } catch (err) {
    tabelaDispositivos.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; color:red;">Erro ao carregar dispositivos</td>
      </tr>
    `;
  }
}

btnRecarregarDispositivos.onclick = carregarDispositivos;
carregarDispositivos();


// =======================================
// MODAL — ADICIONAR DISPOSITIVO
// =======================================

const modalAddDispositivo = document.getElementById("modalAddDispositivo");
const btnNovoDispositivo = document.getElementById("btnNovoDispositivo");
const btnFecharModalDisp = document.getElementById("btnFecharModalDisp");

const formAddDispositivo = document.getElementById("formAddDispositivo");
const inpDispNome = document.getElementById("dispNome");
const inpDispIdentificador = document.getElementById("dispIdentificador");
const inpDispDescricao = document.getElementById("dispDescricao");

btnNovoDispositivo.onclick = () => {
  modalAddDispositivo.classList.remove("hidden");
};

btnFecharModalDisp.onclick = () => {
  modalAddDispositivo.classList.add("hidden");
  formAddDispositivo.reset();
};

formAddDispositivo.onsubmit = async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token"); // TOKEN

  const payload = {
    nome: inpDispNome.value.trim(),
    identificador: inpDispIdentificador.value.trim(),
    descricao: inpDispDescricao.value.trim()
  };

  if (!payload.nome || !payload.identificador) {
    alert("Nome e identificador são obrigatórios.");
    return;
  }

  try {
    const res = await fetch(`${API}/dispositivos`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // TOKEN
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const erro = await res.json();
      alert("Erro: " + (erro.error || "Falha ao criar dispositivo."));
      return;
    }

    alert("Dispositivo criado com sucesso!");

    modalAddDispositivo.classList.add("hidden");
    formAddDispositivo.reset();

    carregarDispositivos();

  } catch (err) {
    alert("Erro ao conectar com a API.");
  }
};
