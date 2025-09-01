document.addEventListener("DOMContentLoaded", () => {
  // Filtros
  const startDateFilter = document.getElementById("startDate");
  const lotteryFilter = document.getElementById("lotteryFilter");
  const periodFilter = document.getElementById("periodFilter");
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const registerBtn = document.getElementById("registerWinners");
  const fetchTicketsBtn = document.getElementById("fetchTickets");
  const resetFiltersBtn = document.getElementById("resetFilters");
  const registerResult = document.getElementById("registerResult");
  const ticketsBody = document.getElementById("ticketsBody");
  const totalSalesElement = document.getElementById("totalSales");
  const totalPendingElement = document.getElementById("totalPending");
  const totalPaidElement = document.getElementById("totalPaid");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfoElement = document.getElementById("pageInfo");
  const emailFilterContainer = document.getElementById("emailFilter");
  const emailSearch = document.getElementById("emailSearch");
  const textareaValues = document.getElementById("allValues");


  // Token de autorização
  const user = localStorage.getItem("userData");
  const userInfo = JSON.parse(user) || {};
  const authToken = `Bearer ${userInfo.token || ""}`;

  setTimeout(() => {
    console.log(authToken);
    if (authToken === "Bearer ") {
      document.getElementsByClassName(".container").display = "none";
      window.location.href = "index.html";
    }
  }, 1000);

  // Variáveis para paginação e dados
  let currentPage = 1;
  const itemsPerPage = 10;
  let totalPages = 1;
  let allTickets = [];
  let filteredTickets = [];
  let allEmails = [];
  let selectedEmails = [];

  // Configurar data atual como padrão
  document.getElementById("dateSelected").valueAsDate = new Date();
  startDateFilter.valueAsDate = new Date();

  // Sistema de abas
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.getAttribute("data-tab");

      // Ativar aba clicada
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Mostrar conteúdo correspondente
      tabContents.forEach((content) => {
        content.classList.remove("active");
        if (content.id === `${tabId}-tab`) {
          content.classList.add("active");
        }
      });
    });
  });

  // Registrar números vencedores
  registerBtn.addEventListener("click", async () => {
    const dateSelected = document.getElementById("dateSelected").value;
    const lotterySelected = document.getElementById("lotterySelected").value;
    const periodTime = document.getElementById("periodTime").value;
    const lo1 = document.getElementById("lo1").value;
    const lo2 = document.getElementById("lo2").value;
    const lo3 = document.getElementById("lo3").value;

    // Validação básica
    if (!dateSelected || !lo1 || !lo2 || !lo3) {
      registerResult.textContent = "Por favor, preencha todos os campos.";
      return;
    }

    const winnersData = {
      dateSelected,
      winners: { lo1, lo2, lo3 },
      lotterySelected,
      periodTime,
    };

    registerResult.textContent = "Enviando dados...";

    try {
      const response = await fetch(
        "https://us-central1-bermax-global-1977b.cloudfunctions.net/bermaxGlobal/api/winners/register-winners-numbers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken,
          },
          body: JSON.stringify(winnersData),
        }
      );

      const data = await response.json();
      registerResult.textContent = JSON.stringify(data, null, 2);

      // Limpar campos após sucesso
      if (data.success) {
        document.getElementById("lo1").value = "";
        document.getElementById("lo2").value = "";
        document.getElementById("lo3").value = "";
      }else {
        if (data.message === "Token inválido."){
          window.location.href = "index.html";
        }
      }
    } catch (error) {
      registerResult.textContent = `Erro: ${error.message}`;
    }
  });

  // Buscar tickets
  fetchTicketsBtn.addEventListener("click", async () => {
    const startDate = startDateFilter.value;

    if (!startDate) {
      alert("Por favor, selecione uma data inicial.");
      return;
    }

    ticketsBody.innerHTML =
      '<tr><td colspan="7" class="loading">Carregando tickets...</td></tr>';

    try {
      const response = await fetch(
        `https://us-central1-bermax-global-1977b.cloudfunctions.net/bermaxGlobal/api/tickets/managed-tickets?startDate=${startDate}`,
        {
          method: "GET",
          headers: {
            Authorization: authToken,
          },
        }
      );

      const data = await response.json();

      if (data?.success) {
        allTickets = data.ticketsOfUserSelected || [];

        // Extrair emails únicos
        extractUniqueEmails();

        applyFilters();
      } else {
        if (data.message === "Token inválido."){
          window.location.href = "index.html";
        }else {
          ticketsBody.innerHTML =
          '<tr><td colspan="7" class="loading">Erro ao carregar tickets: ' +
          (data.message || "Resposta inválida da API") +
          "</td></tr>";
        }
      }
    } catch (error) {
      ticketsBody.innerHTML =
        '<tr><td colspan="7" class="loading">Erro: ' +
        error.message +
        "</td></tr>";
    }
  });

  const valuesOfUser = {};
  function completeTextArea(values) {
    Object.keys(values).forEach((key) => {
      valuesOfUser[key] = values[key] + (valuesOfUser[key] || 0);
    });
  }

  // Extrair emails únicos dos tickets
  function extractUniqueEmails() {
    const emailSet = new Set();
    allTickets.forEach((ticket) => {
      completeTextArea(ticket?.values || {});
      if (ticket.emailUser) {
        emailSet.add(ticket.emailUser);
      }
    });

    allEmails = Array.from(emailSet).sort();
    renderEmailFilter();
  }

  // Renderizar filtro de emails
  function renderEmailFilter() {
    textareaValues.value = JSON.stringify(valuesOfUser, null, 2);
    const searchTerm = emailSearch.value.toLowerCase();
    const filteredEmails = allEmails.filter((email) =>
      email.toLowerCase().includes(searchTerm)
    );

    let html = "";

    if (filteredEmails.length === 0) {
      html = '<div class="loading">Nenhum email encontrado</div>';
    } else {
      filteredEmails.forEach((email) => {
        const isChecked = selectedEmails.includes(email);
        html += `
          <div class="email-checkbox">
            <label>
              <input type="checkbox" value="${email}" ${
          isChecked ? "checked" : ""
        }
                onchange="toggleEmailFilter('${email}', this.checked)">
              ${email}
            </label>
          </div>
        `;
      });
    }

    emailFilterContainer.innerHTML = html;
  }

  // Alternar filtro de email
  window.toggleEmailFilter = function (email, isChecked) {
    if (isChecked) {
      if (!selectedEmails.includes(email)) {
        selectedEmails.push(email);
      }
    } else {
      selectedEmails = selectedEmails.filter((e) => e !== email);
    }

    applyFilters();
  };

  // Aplicar filtros
  function applyFilters() {
    const lotteryValue = lotteryFilter.value;
    const periodValue = periodFilter.value;

    filteredTickets = allTickets.filter((ticket) => {
      // Filtro de loteria
      if (lotteryValue && ticket.lotterySelected !== lotteryValue) {
        return false;
      }

      // Filtro de período
      if (periodValue && ticket.periodTime !== periodValue) {
        return false;
      }

      // Filtro de email
      if (
        selectedEmails.length > 0 &&
        !selectedEmails.includes(ticket.emailUser)
      ) {
        return false;
      }

      return true;
    });

    updateSummary();
    renderTable();
  }

  // Atualizar resumo
  function updateSummary() {
    let totalSales = 0;
    let totalPending = 0;
    let totalPaid = 0;

    filteredTickets.forEach((ticket) => {
      totalSales += parseFloat(ticket.totalTicket) || 0;

      if (ticket.status === "paid") {
        totalPaid += parseFloat(ticket.toPay) || 0;
      } else {
        totalPending += parseFloat(ticket.toPay) || 0;
      }
    });

    totalSalesElement.textContent = `R$ ${totalSales.toFixed(2)}`;
    totalPendingElement.textContent = `R$ ${totalPending.toFixed(2)}`;
    totalPaidElement.textContent = `R$ ${totalPaid.toFixed(2)}`;
  }

  // Renderizar tabela
  function renderTable() {
    // Calcular paginação
    totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    currentPage = Math.min(currentPage, totalPages);

    if (totalPages === 0) {
      currentPage = 0;
      ticketsBody.innerHTML =
        '<tr><td colspan="7" class="loading">Nenhum ticket encontrado com os filtros selecionados</td></tr>';
      updatePagination();
      return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(
      startIndex + itemsPerPage,
      filteredTickets.length
    );
    const pageTickets = filteredTickets.slice(startIndex, endIndex);

    let html = "";

    pageTickets.forEach((ticket) => {
      const statusClass = ticket.toPay > 0 ? "paid" : "pending";
      const statusText =
        ticket.status === "pending"
          ? "Processando"
          : ticket.status === "canceled"
          ? "Cancelado"
          : ticket.toPay > 0
          ? "Ganhou"
          : "Perdeu";

      html += `
        <tr>
          <td>${ticket.idTicket || "N/A"}</td>
          <td>${
            formatDate(ticket.createdAt) === "Invalid Date"
              ? ticket.createdAt
              : formatDate(ticket.createdAt)
          }</td>
          <td>${ticket.emailUser || "N/A"}</td>
          <td>R$ ${parseFloat(ticket.totalTicket || 0).toFixed(2)}</td>
          <td>R$ ${parseFloat(ticket.toPay || 0).toFixed(2)}</td>
          <td><span class="table-status ${statusClass}">${statusText}</span></td>
          <td>${formatLottery(ticket.lotterySelected)}</td>
        </tr>
      `;
    });

    ticketsBody.innerHTML = html;
    updatePagination();
  }

  // Atualizar controles de paginação
  function updatePagination() {
    pageInfoElement.textContent = `Página ${currentPage} de ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
  }

  // Formatadores
  function formatDate(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  }

  function formatLottery(lottery) {
    const lotteryMap = {
      georgia: "Georgia",
      florida: "Florida",
      newyork: "New York",
    };

    return lotteryMap[lottery] || lottery || "N/A";
  }

  // Event Listeners
  resetFiltersBtn.addEventListener("click", () => {
    lotteryFilter.value = "";
    periodFilter.value = "";
    selectedEmails = [];
    emailSearch.value = "";
    renderEmailFilter();
    applyFilters();
  });

  lotteryFilter.addEventListener("change", applyFilters);
  periodFilter.addEventListener("change", applyFilters);

  emailSearch.addEventListener("input", () => {
    renderEmailFilter();
  });

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  // Estado para guardar a ordem atual
  let currentSort = { key: null, order: "asc" };

  // Ordenação da tabela
  document.querySelectorAll("th[data-sort]").forEach((header) => {
    header.addEventListener("click", () => {
      const sortBy = header.getAttribute("data-sort");

      // Se clicar de novo no mesmo header, alterna entre asc/desc
      if (currentSort.key === sortBy) {
        currentSort.order = currentSort.order === "asc" ? "desc" : "asc";
      } else {
        currentSort = { key: sortBy, order: "asc" };
      }

      sortTable(sortBy, currentSort.order);
    });
  });

  // Função de ordenação
  function sortTable(sortBy, order = "asc") {
    filteredTickets.sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];

      // Converter para número se for campo numérico
      if (typeof valueA === "string" && !isNaN(valueA)) {
        valueA = Number(valueA);
        valueB = Number(valueB);
      }

      // Converter para Date se for campo de data
      if (sortBy === "createdAt") {
        valueA = valueA ? (valueA) : new Date(0);
        valueB = valueB ? (valueB) : new Date(0);
      }

      if (valueA < valueB) return order === "asc" ? -1 : 1;
      if (valueA > valueB) return order === "asc" ? 1 : -1;
      return 0;
    });

    renderTable();
  }
});
