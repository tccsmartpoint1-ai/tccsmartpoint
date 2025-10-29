document.addEventListener("DOMContentLoaded", () => {
  // Token e API base
  const token = localStorage.getItem("token");
  const API_DEFAULT = "http://localhost:3000/api";
  const apiInput = document.getElementById("apiBase");
  const apiEmUso = document.getElementById("apiBaseEmUso");
  const statusLinha = document.getElementById("statusLinha");
  const apiStatus = document.getElementById("apiStatus");

  const getAPI = () => localStorage.getItem("apiBaseUrl") || API_DEFAULT;
  const setAPI = (v) => localStorage.setItem("apiBaseUrl", v);

  // Parâmetros operacionais (localStorage)
  const intervaloInput = document.getElementById("intervaloAtualizacao");
  const tempoMinInput = document.getElementById("tempoMinimoLeitura");
  const modoSelect = document.getElementById("modoOperacao");

  // Dispositivos
  const btnRecarregarDisp = document.getElementById("btnRecarregarDispositivos");
  const corpoDisp = document.querySelector("#tblDispositivos tbody");

  // Segurança / manutenção
  const formSenha = document.getElementById("formSenha");
  const btnExportarCSV = document.getElementById("btnExportarCSV");
  const btnResetar = document.getElementById("btnResetar");
  const btnLogout = document.getElementById("btnLogout");

  // Utilitários
  function setStatus(msg, tipo = "info", load = false) {
    statusLinha.querySelector("span").textContent = msg;
    statusLinha.className = `status-msg ${tipo}`;
    statusLinha.querySelector(".loader").style.display = load ? "inline-block" : "none";
  }
  function setApiPill() {
    apiEmUso.textContent = getAPI();
  }
  async function pingAPI() {
    setStatus("Verificando status da API…", "info", true);
    apiStatus.textContent = "Verificando…";
    apiStatus.className = "pill";

    try {
      const res = await fetch(`${getAPI()}/leituras?limit=1`, {
        headers: { "Authorization": `Bearer ${token || ""}` }
      });
      if (res.status === 401 || res.status === 403) {
        // Mantém a indicação de conectividade (API respondeu), mas há restrição
        apiStatus.textContent = "Online (restrito)";
        apiStatus.className = "pill pill-on";
        setStatus("API respondeu com autenticação requerida.", "success");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      apiStatus.textContent = "Online";
      apiStatus.className = "pill pill-on";
      setStatus("API online.", "success");
    } catch (e) {
      apiStatus.textContent = "Offline";
      apiStatus.className = "pill pill-off";
      setStatus("Não foi possível conectar na API.", "error");
    }
  }

  // Carregar valores salvos
  function carregarPreferencias() {
    apiInput.value = getAPI();
    setApiPill();

    const intervalo = localStorage.getItem("intervaloAtualizacao") || "";
    const tempoMin = localStorage.getItem("tempoMinimoLeitura") || "";
    const modo = localStorage.getItem("modoOperacao") || "tempo_real";
    intervaloInput.value = intervalo;
    tempoMinInput.value = tempoMin;
    modoSelect.value = modo;
  }

  // Salvar API
  document.getElementById("formApi").addEventListener("submit", (e) => {
    e.preventDefault();
    const url = apiInput.value.trim();
    if (!url) {
      setStatus("Informe uma URL válida para a API.", "error");
      return;
    }
    setAPI(url);
    setApiPill();
    setStatus("URL da API salva.", "success");
  });
  document.getElementById("btnTestarApi").addEventListener("click", pingAPI);

  // Dispositivos: carregar lista
  async function carregarDispositivos() {
    corpoDisp.innerHTML = `<tr><td colspan="5">Carregando...</td></tr>`;
    try {
      const res = await fetch(`${getAPI()}/dispositivos`, {
        headers: { "Authorization": `Bearer ${token || ""}`, "Accept": "application/json" }
      });
      if (res.status === 401 || res.status === 403) {
        corpoDisp.innerHTML = `<tr><td colspan="5">Acesso restrito. Faça login com permissões.</td></tr>`;
        return;
      }
      if (!res.ok) throw new Error();
      const dados = await res.json();
      if (!Array.isArray(dados) || !dados.length) {
        corpoDisp.innerHTML = `<tr><td colspan="5">Nenhum dispositivo encontrado.</td></tr>`;
        return;
      }
      corpoDisp.innerHTML = "";
      dados.forEach(d => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${d.id ?? "-"}</td>
          <td>${d.nome ?? "-"}</td>
          <td>${d.ip ?? "-"}</td>
          <td>${d.ativo ? "Ativo" : "Inativo"}</td>
          <td>
            <button data-id="${d.id}" data-ativo="${d.ativo ? "1" : "0"}" class="btnToggle">
              ${d.ativo ? "Desativar" : "Ativar"}
            </button>
          </td>
        `;
        corpoDisp.appendChild(tr);
      });
    } catch {
      corpoDisp.innerHTML = `<tr><td colspan="5">Erro ao carregar dispositivos.</td></tr>`;
    }
  }
  btnRecarregarDisp.addEventListener("click", carregarDispositivos);

  // Dispositivos: toggle ativo
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btnToggle");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const ativoAtual = btn.getAttribute("data-ativo") === "1";
    try {
      btn.disabled = true;
      const res = await fetch(`${getAPI()}/dispositivos/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || ""}`
        },
        body: JSON.stringify({ ativo: !ativoAtual })
      });
      if (!res.ok) throw new Error();
      await carregarDispositivos();
      setStatus("Dispositivo atualizado.", "success");
    } catch {
      setStatus("Erro ao atualizar dispositivo.", "error");
    } finally {
      btn.disabled = false;
    }
  });

  // Parâmetros Operacionais
  document.getElementById("formParams").addEventListener("submit", (e) => {
    e.preventDefault();
    const intervalo = String(intervaloInput.value || "").trim();
    const tempoMin = String(tempoMinInput.value || "").trim();
    const modo = modoSelect.value;

    if (intervalo && Number(intervalo) < 0) return setStatus("Intervalo inválido.", "error");
    if (tempoMin && Number(tempoMin) < 0) return setStatus("Tempo mínimo inválido.", "error");

    localStorage.setItem("intervaloAtualizacao", intervalo);
    localStorage.setItem("tempoMinimoLeitura", tempoMin);
    localStorage.setItem("modoOperacao", modo);
    setStatus("Parâmetros salvos.", "success");
  });

  // Alterar senha
  formSenha.addEventListener("submit", async (e) => {
    e.preventDefault();
    const senhaAtual = document.getElementById("senhaAtual").value;
    const nova = document.getElementById("novaSenha").value;
    const confirma = document.getElementById("confirmaSenha").value;
    if (!senhaAtual || !nova || !confirma) return setStatus("Preencha todos os campos de senha.", "error");
    if (nova !== confirma) return setStatus("A confirmação da senha não confere.", "error");

    try {
      const res = await fetch(`${getAPI()}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || ""}`
        },
        body: JSON.stringify({ senhaAtual, novaSenha: nova })
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        window.location.replace("../pages/login.html");
        return;
      }
      if (!res.ok) throw new Error();
      setStatus("Senha alterada com sucesso.", "success");
      formSenha.reset();
    } catch {
      setStatus("Erro ao alterar senha.", "error");
    }
  });

  // Exportar CSV (leituras)
  btnExportarCSV.addEventListener("click", async () => {
    try {
      setStatus("Exportando leituras…", "info", true);
      const res = await fetch(`${getAPI()}/leituras`, {
        headers: { "Authorization": `Bearer ${token || ""}` }
      });
      if (!res.ok) throw new Error();
      const dados = await res.json();
      if (!Array.isArray(dados) || !dados.length) {
        setStatus("Sem leituras para exportar.", "error");
        return;
      }
      // Monta CSV básico
      const cols = ["id", "colaborador_id", "dispositivo_id", "tag_uid", "hora", "ip", "autorizado"];
      let csv = cols.join(",") + "\n";
      dados.forEach(l => {
        csv += [
          l.id ?? "",
          l.colaborador_id ?? "",
          l.dispositivo_id ?? "",
          l.tag_uid ?? "",
          l.hora ?? "",
          l.ip ?? "",
          l.autorizado ? "1" : "0"
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",") + "\n";
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "leituras_export.csv";
      a.click();
      setStatus("Exportação concluída.", "success");
    } catch {
      setStatus("Erro ao exportar leituras.", "error");
    }
  });

  // Reset desativado (apenas alerta)
  btnResetar.addEventListener("click", () => {
    alert("Reset do sistema está desativado nesta etapa. Nenhuma ação foi executada.");
  });

  // Logout
  btnLogout.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.replace("../pages/login.html");
  });

  // Inicialização
  carregarPreferencias();
  pingAPI();
  carregarDispositivos();
});
