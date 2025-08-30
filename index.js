document.addEventListener("DOMContentLoaded", () => {
// Elementos da interface

  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const durationTokenSelect = document.getElementById("durationToken");
  const loginBtn = document.getElementById("loginBtn");
  const btnText = document.getElementById("btnText");
  const btnLoading = document.getElementById("btnLoading");
  const responseMessage = document.getElementById("responseMessage");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const forgotPasswordLink = document.getElementById("forgotPassword");

  // Alternar visibilidade da senha
  togglePasswordBtn.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      togglePasswordBtn.textContent = "🔒";
    } else {
      passwordInput.type = "password";
      togglePasswordBtn.textContent = "👁️";
    }
  });

  // Envio do formulário de login
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Validar campos
    if (!emailInput.value || !passwordInput.value) {
      showResponse("Por favor, preencha todos os campos.", "error");
      return;
    }

    // Validar formato de email
    if (!isValidEmail(emailInput.value)) {
      showResponse("Por favor, insira um e-mail válido.", "error");
      return;
    }

    // Mostrar estado de carregamento
    setLoadingState(true);

    try {
      const response = await fetch(
        "https://us-central1-bermax-global-1977b.cloudfunctions.net/bermaxGlobal/api/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emailUser: emailInput.value,
            passwordUser: passwordInput.value,
            durationToken: durationTokenSelect.value,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showResponse(
          `Login realizado com sucesso!`,
          "success"
        );

        // Armazenar token (em uma aplicação real, isso seria feito com mais segurança)
        localStorage.setItem("userData", JSON.stringify(data.userData));
        window.location.href = 'sistema.html'; // Em uma aplicação real
        
      } else {
        showResponse(
          data.message || "Erro ao fazer login. Verifique suas credenciais.",
          "error"
        );
      }
    } catch (error) {
      showResponse(
        "Erro de conexão. Verifique sua internet e tente novamente.",
        "error"
      );
    } finally {
      setLoadingState(false);
    }
  });

  // Link "Esqueci minha senha"
  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    if (!emailInput) {
      return alert("Deve preencher o input email!");
    }

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: `{"subUsersEmails":"${emailInput}","durationToken":"15m"}`,
    };

    fetch(
      "https://us-central1-bermax-global-1977b.cloudfunctions.net/bermaxGlobal/api/users/send-link-reset-password",
      options
    )
      .then((response) => response.json())
      .then((response) => console.log(response))
      .catch((err) => console.error(err));
  });

  // Função para validar email
  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Função para mostrar mensagens de resposta
  function showResponse(message, type) {
    responseMessage.textContent = message;
    responseMessage.className = `response-container ${type}`;
  }

  // Função para controlar estado de carregamento
  function setLoadingState(isLoading) {
    if (isLoading) {
      loginBtn.disabled = true;
      btnText.style.display = "none";
      btnLoading.style.display = "inline-block";
      return;
    }
    loginBtn.disabled = false;
    btnText.style.display = "inline-block";
    btnLoading.style.display = "none";
  }

  // Preencher automaticamente com dados de exemplo (apenas para demonstração)
  setTimeout(() => {
    if (emailInput.value && passwordInput.value) {
      showResponse(
        "Dados preenchidos. Clique em Entrar para continuar.",
        "success"
      );
    }
  }, 1000);
  
  

});
