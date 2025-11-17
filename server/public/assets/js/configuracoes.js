// ---------------------------------
// STATUS DO SISTEMA
// ---------------------------------

// se API tiver "/api" no final, remove para chamar /status
const API_HOST =
  typeof API === "string"
    ? API.replace(/\/api\/?$/, "")
    : "https://tccsmartpoint.onrender.com";

async function verificarStatusAPI() {
  const statusLinha   = document.getElementById("statusLinha");
  const apiBaseEmUso  = document.getElementById("apiBaseEmUso");
  const apiStatus     = document.getElementById("apiStatus");

  try {
    const res = await fetch(`${API_HOST}/status`);

    if (!res.ok) throw new Error("Falha");

    statusLinha.querySelector("span").textContent = "API Base em uso";
    apiBaseEmUso.textContent = API; // mostra a base /api usada no sistema

    apiStatus.textContent = "Online";
    apiStatus.classList.remove("pill-off");
    apiStatus.classList.add("pill-on");
  } catch (err) {
    statusLinha.querySelector("span").textContent = "API indisponível";

    apiStatus.textContent = "Offline";
    apiStatus.classList.remove("pill-on");
    apiStatus.classList.add("pill-off");
  }
}

// Executar ao carregar a página
verificarStatusAPI();

// Atualizar a cada 30s
setInterval(verificarStatusAPI, 30000);
