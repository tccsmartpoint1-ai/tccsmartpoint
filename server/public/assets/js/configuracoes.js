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
// CONFIGURAÇÕES DA API (CARD)
// =======================================

// Preenche o input com a base atual
const campoApi = document.getElementById("apiBase");
campoApi.value = API_BASE;

// ----- SALVAR NOVA URL -----
document.getElementById("formApi").onsubmit = (e) => {
  e.preventDefault();

  const novaURL = campoApi.value.trim();
  if (!novaURL) {
    alert("Digite uma URL válida.");
    return;
  }

  // Salva nova base
  localStorage.setItem("API_BASE", novaURL);
  API_BASE = novaURL;
  window.API = novaURL;

  alert("URL da API salva com sucesso!");

  location.reload();
};


// ----- TESTAR CONEXÃO -----
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
