document.getElementById("loginForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const role = document.getElementById("role").value;

  if (role === "lider") {
    alert(`Bem-vindo(a) líder ${name}! Você tem acesso administrativo.`);
    window.location.href = "lider.html";
  } else {
    alert(`Bem-vindo(a) ${name}!`);
    window.location.href = "membro.html";
  }
});
