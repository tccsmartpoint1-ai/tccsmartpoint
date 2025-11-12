const loginForm = document.getElementById("loginForm");
const cpfEl = document.getElementById("cpf");
const passwordEl = document.getElementById("password");
const togglePwd = document.getElementById("togglePwd");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");
const cpfError = document.getElementById("cpfError");
const passwordError = document.getElementById("passwordError");
const rememberEl = document.getElementById("remember");
const yearEl = document.getElementById("year");

yearEl.textContent = new Date().getFullYear();

/* ===== Máscara de CPF ===== */
cpfEl.addEventListener("input", (e) => {
  let value = e.target.value.replace(/\D/g, "").slice(0, 11);
  e.target.value = value
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  validate();
});

/* ===== Validação ===== */
function validate() {
  let valid = true;
  cpfError.textContent = "";
  passwordError.textContent = "";

  const rawCpf = cpfEl.value.replace(/\D/g, "");
  const senha = passwordEl.value.trim();

  if (rawCpf.length !== 11) {
    cpfError.textContent = "Informe um CPF válido (11 dígitos).";
    valid = false;
  }

  if (senha.length < 6) {
    passwordError.textContent = "A senha deve ter no mínimo 6 caracteres.";
    valid = false;
  } else {
    passwordError.textContent = "";
  }

  submitBtn.disabled = !valid;
  return valid;
}

passwordEl.addEventListener("input", validate);

/* ===== Mostrar/ocultar senha ===== */
const eyeOpen = `
<svg class="icon-eye" viewBox="0 0 24 24"><path d="M12 5c-7.6 0-11 7-11 7s3.4 7 11 7 11-7 11-7-3.4-7-11-7zm0 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5z"/><circle cx="12" cy="12" r="3"/></svg>`;
const eyeClosed = `
<svg class="icon-eye" viewBox="0 0 24 24"><path d="M2 2l20 20-1.5 1.5-3.1-3.1C15.9 21 13.9 21.5 12 21.5c-7.6 0-11-7-11-7s1.2-2.5 3.5-4.5L.5 3.5 2 2z"/></svg>`;

togglePwd.innerHTML = eyeClosed;
togglePwd.addEventListener("click", () => {
  const showing = passwordEl.type === "text";
  passwordEl.type = showing ? "password" : "text";
  togglePwd.innerHTML = showing ? eyeClosed : eyeOpen;
  passwordEl.focus();
});

/* ===== Submit ===== */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const rawCpf = cpfEl.value.replace(/\D/g, "");
  const senha = passwordEl.value.trim();

  if (rememberEl.checked) {
    localStorage.setItem("sp_cpf", rawCpf);
  } else {
    localStorage.removeItem("sp_cpf");
  }

  formMessage.textContent = "Verificando...";
  formMessage.style.color = "var(--blue-700)";
  submitBtn.disabled = true;

  try {
    const response = await fetch("https://tccsmartpoint.onrender.com/api/auth/login", {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf: rawCpf, senha }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      formMessage.textContent = data.error || "CPF ou senha incorretos.";
      formMessage.style.color = "var(--red-600)";
      submitBtn.disabled = false;
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("admin", JSON.stringify(data.admin));

    formMessage.textContent = "Login realizado com sucesso!";
    formMessage.style.color = "var(--green-600)";

    setTimeout(() => {
      window.location.href = "/dashboard.html";
    }, 1000);
  } catch (err) {
    console.error("Erro ao conectar:", err);
    formMessage.textContent = "Erro de conexão com o servidor.";
    formMessage.style.color = "var(--red-600)";
    submitBtn.disabled = false;
  }
});
