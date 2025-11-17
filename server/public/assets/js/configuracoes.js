const API_HOST = "https://tccsmartpoint.onrender.com";
const API = `${API_HOST}/api`;

// ---------------------------------
// STATUS DO SISTEMA
// ---------------------------------

async function verificarStatusAPI() {
  const statusLinha   = document.getElementById("statusLinha");
  const apiBaseEmUso  = document.getElementById("apiBaseEmUso");
  const apiStatus     = document.getElementById("apiStatus");

  try {
    const res = await fetch(`${API}/status`); // <- AQUI CORRIGIDO

    if (!res.ok) throw new Error();

    statusLinha.querySelector("span").textContent = "API Base em uso";
    apiBaseEmUso.textContent = API;

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

verificarStatusAPI();
setInterval(verificarStatusAPI, 30000);
