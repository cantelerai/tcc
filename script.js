// salva o usuário e papel no localStorage e redireciona
const USER_KEY = "igrejaAppUser_v1";

document.getElementById("loginForm").addEventListener("submit", function(e){
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const role = document.getElementById("role").value;
  if(!name){ alert("Digite seu nome."); return; }
  localStorage.setItem(USER_KEY, JSON.stringify({ name, role }));
  // redireciona conforme papel
  if(role === "lider") location.href = "lider.html";
  else location.href = "membro.html";
});
