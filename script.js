/* ========= PERSISTÊNCIA ========= */
const STORE_KEY = "igrejaAppData_v2";
function loadStore(){
  const raw = localStorage.getItem(STORE_KEY);
  if(!raw){
    const seed = {
      eventos: [
        { id: 1, titulo: "Culto de Jovens", data: "2025-09-05", pregador: "Pr. João" },
        { id: 2, titulo: "Ensaio do Louvor", data: "2025-09-08", pregador: "Min. Maria" }
      ],
      membros: [
        { id: 1, nome: "Raiany", tipo: "membro" },
        { id: 2, nome: "Ana", tipo: "membro" },
        { id: 3, nome: "Paulo", tipo: "lider" }
      ],
      escalas: [
        { id: 1, membroId: 2, tarefa: "Louvor" },
      ],
      nextIds: { evento: 3, membro: 4, escala: 2 }
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}
function saveStore(){ localStorage.setItem(STORE_KEY, JSON.stringify(store)); }
let store = loadStore();

/* ========= ESTADO DE SESSÃO ========= */
let currentUser = { nome: "", role: "membro" };

/* ========= UI HELPERS ========= */
const qs = sel => document.querySelector(sel);
function toast(msg){
  const el = qs("#toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(()=> el.classList.remove("show"), 2200);
}
function confirmModal({title, msg, onConfirm}){
  qs("#modal-title").textContent = title || "Confirmar";
  qs("#modal-msg").textContent = msg || "Tem certeza?";
  const modal = qs("#modal");
  modal.style.display = "grid";
  const cleanup = ()=>{
    modal.style.display = "none";
    confirmBtn.removeEventListener("click", ok);
    cancelBtn.removeEventListener("click", cancel);
  };
  const confirmBtn = qs("#modal-confirm");
  const cancelBtn = qs("#modal-cancel");
  function ok(){ cleanup(); onConfirm && onConfirm(); }
  function cancel(){ cleanup(); }
  confirmBtn.addEventListener("click", ok);
  cancelBtn.addEventListener("click", cancel);
}

/* ========= LOGIN / LOGOUT ========= */
qs("#loginBtn").addEventListener("click", ()=>{
  const nome = qs("#username").value.trim();
  const role = qs("#user-role").value;
  if(!nome){ toast("Informe seu nome 🙂"); return; }
  currentUser = { nome, role };
  qs("#login-screen").style.display = "none";
  qs("#dashboard").style.display = "block";
  qs("#nav").style.display = "flex";
  qs("#userPill").textContent = `${nome} • ${role}`;
  // mostrar tab extra se for líder
  const adminBtn = qs("#tab-membros-btn");
  adminBtn.style.display = (role==="lider") ? "inline-flex" : "none";
  // selecionar tab padrão
  selectTab(role==="lider" ? "tab-eventos" : "tab-minhaescala");
  renderTudo();
  toast(`Bem-vinda(o), ${nome}!`);
});

qs("#logoutBtn").addEventListener("click", ()=>{
  currentUser = { nome:"", role:"membro" };
  qs("#dashboard").style.display = "none";
  qs("#nav").style.display = "none";
  qs("#login-screen").style.display = "block";
});

/* ========= TABS ========= */
[...document.querySelectorAll(".tab-btn")].forEach(btn=>{
  btn.addEventListener("click", ()=> selectTab(btn.dataset.tab));
});
function selectTab(id){
  [...document.querySelectorAll(".tab")].forEach(t=> t.style.display="none");
  [...document.querySelectorAll(".tab-btn")].forEach(b=> b.classList.remove("active"));
  qs("#"+id).style.display = "block";
  const activeBtn = [...document.querySelectorAll(".tab-btn")].find(b=> b.dataset.tab===id);
  activeBtn && activeBtn.classList.add("active");
}

/* ========= EVENTOS ========= */
const buscaEvento = qs("#busca-evento");
buscaEvento.addEventListener("input", renderEventos);

qs("#salvarEventoBtn").addEventListener("click", ()=>{
  const id = qs("#evento-id").value;
  const titulo = qs("#evento-titulo").value.trim();
  const data = qs("#evento-data").value;
  const pregador = qs("#evento-pregador").value.trim();
  if(!titulo || !data || !pregador){ toast("Preencha título, data e pregador."); return; }

  if(id){ // editar
    const e = store.eventos.find(x=> x.id === Number(id));
    e.titulo = titulo; e.data = data; e.pregador = pregador;
    toast("Evento atualizado ✨");
  }else{ // novo
    store.eventos.push({ id: store.nextIds.evento++, titulo, data, pregador });
    toast("Evento criado ✅");
  }
  saveStore();
  limparFormEvento();
  renderEventos();
});
qs("#cancelarEdicaoBtn").addEventListener("click", limparFormEvento);

function limparFormEvento(){
  qs("#evento-id").value = "";
  qs("#evento-titulo").value = "";
  qs("#evento-data").value = "";
  qs("#evento-pregador").value = "";
}

function renderEventos(){
  const list = qs("#event-list");
  list.innerHTML = "";

  const filtro = buscaEvento.value.toLowerCase();
  const eventos = store.eventos
    .slice()
    .sort((a,b)=> a.data.localeCompare(b.data))
    .filter(e=> e.titulo.toLowerCase().includes(filtro) || e.pregador.toLowerCase().includes(filtro));

  eventos.forEach(e=>{
    const item = document.createElement("div");
    item.className = "card-item";

    const main = document.createElement("div");
    main.className = "item-main";
    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = e.titulo;
    const sub = document.createElement("div");
    sub.className = "item-sub";
    sub.textContent = `Data: ${e.data} • Pregador: ${e.pregador}`;
    main.appendChild(title); main.appendChild(sub);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    if(currentUser.role === "lider"){
      const edit = btnGhost("Editar", ()=>{
        qs("#admin-eventos").scrollIntoView({behavior:"smooth", block:"center"});
        qs("#evento-id").value = e.id;
        qs("#evento-titulo").value = e.titulo;
        qs("#evento-data").value = e.data;
        qs("#evento-pregador").value = e.pregador;
      });
      const del = btnDanger("Excluir", ()=>{
        confirmModal({
          title: "Excluir evento",
          msg: `Tem certeza que deseja excluir "${e.titulo}"?`,
          onConfirm: ()=>{
            store.eventos = store.eventos.filter(x=> x.id !== e.id);
            saveStore();
            renderEventos();
            toast("Evento excluído 🗑️");
          }
        });
      });
      actions.append(edit, del);
    }

    item.append(main, actions);
    list.appendChild(item);
  });

  // mostrar/ocultar painel de eventos do líder
  qs("#admin-eventos").style.display = (currentUser.role==="lider") ? "block" : "none";
}

/* ========= MEMBROS ========= */
qs("#addMembroBtn").addEventListener("click", ()=>{
  const nome = qs("#membro-nome").value.trim();
  const tipo = qs("#membro-tipo").value;
  if(!nome){ toast("Informe o nome do membro."); return; }
  store.membros.push({ id: store.nextIds.membro++, nome, tipo });
  saveStore();
  qs("#membro-nome").value = "";
  renderMembros();
  toast("Membro adicionado ✅");
});

function renderMembros(){
  const list = qs("#membro-list");
  list.innerHTML = "";
  const selectEscala = qs("#escala-membro");
  selectEscala.innerHTML = "";

  store.membros
    .slice()
    .sort((a,b)=> a.nome.localeCompare(b.nome))
    .forEach(m=>{
      // item da lista
      const item = document.createElement("div");
      item.className = "card-item";

      const main = document.createElement("div");
      main.className = "item-main";
      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = m.nome + (m.tipo==="lider" ? " • Líder" : "");
      const sub = document.createElement("div");
      sub.className = "item-sub";
      sub.textContent = `Papel: ${m.tipo}`;
      main.appendChild(title); main.appendChild(sub);

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const del = btnDanger("Excluir", ()=>{
        confirmModal({
          title: "Excluir membro",
          msg: `Remover ${m.nome}? As escalas associadas também serão removidas.`,
          onConfirm: ()=>{
            store.membros = store.membros.filter(x=> x.id !== m.id);
            store.escalas = store.escalas.filter(x=> x.membroId !== m.id);
            saveStore();
            renderMembros();
            renderEscalas();
            renderMinhaEscala();
            toast("Membro excluído 🗑️");
          }
        });
      });
      actions.append(del);

      item.append(main, actions);
      list.appendChild(item);

      // select para escalas
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.nome + (m.tipo==="lider" ? " (Líder)" : "");
      selectEscala.appendChild(opt);
    });

  // mostrar/ocultar aba Membros & Escalas
  const showAdmin = currentUser.role === "lider";
  qs("#tab-membros").style.display = showAdmin ? "block" : "none";
  qs("#tab-membros-btn").style.display = showAdmin ? "inline-flex" : "none";
}

/* ========= ESCALAS ========= */
qs("#addEscalaBtn").addEventListener("click", ()=>{
  const membroId = Number(qs("#escala-membro").value);
  const tarefa = qs("#escala-tarefa").value.trim();
  if(!membroId || !tarefa){ toast("Selecione um membro e informe a tarefa."); return; }
  store.escalas.push({ id: store.nextIds.escala++, membroId, tarefa });
  saveStore();
  qs("#escala-tarefa").value = "";
  renderEscalas();
  renderMinhaEscala();
  toast("Escala adicionada ✅");
});

function renderEscalas(){
  const list = qs("#escala-list");
  if(!list) return;
  list.innerHTML = "";

  store.escalas.forEach(e=>{
    const m = store.membros.find(x=> x.id === e.membroId);
    if(!m) return;
    const item = document.createElement("div");
    item.className = "card-item";

    const main = document.createElement("div");
    main.className = "item-main";
    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = `${m.nome}`;
    const sub = document.createElement("div");
    sub.className = "item-sub";
    sub.textContent = `Tarefa: ${e.tarefa}`;
    main.appendChild(title); main.appendChild(sub);

    const actions = document.createElement("div");
    actions.className = "item-actions";
    const del = btnGhost("Remover", ()=>{
      confirmModal({
        title: "Remover escala",
        msg: `Remover a tarefa de ${m.nome}?`,
        onConfirm: ()=>{
          store.escalas = store.escalas.filter(x=> x.id !== e.id);
          saveStore();
          renderEscalas();
          renderMinhaEscala();
          toast("Escala removida 🗑️");
        }
      });
    });
    actions.append(del);

    item.append(main, actions);
    list.appendChild(item);
  });
}

/* ========= MINHA ESCALA ========= */
function renderMinhaEscala(){
  const title = qs("#minhaescala-header");
  const list = qs("#minha-escala-list");
  if(!list) return;
  title.textContent = currentUser.nome ? `Usuário: ${currentUser.nome} (${currentUser.role})` : "";

  list.innerHTML = "";
  const mm = store.membros.find(m=> m.nome.toLowerCase() === currentUser.nome.toLowerCase());
  const id = mm ? mm.id : null;
  const myEscalas = id ? store.escalas.filter(e=> e.membroId === id) : [];

  if(!id){
    const info = document.createElement("div");
    info.className = "muted";
    info.textContent = "Seu nome não está cadastrado como membro. Um(a) líder pode te adicionar.";
    list.appendChild(info);
    return;
  }

  if(myEscalas.length === 0){
    const info = document.createElement("div");
    info.className = "muted";
    info.textContent = "Você ainda não possui escala atribuída.";
    list.appendChild(info);
    return;
  }

  myEscalas.forEach(e=>{
    const item = document.createElement("div");
    item.className = "card-item";
    const main = document.createElement("div");
    main.className = "item-main";
    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = e.tarefa;
    const sub = document.createElement("div");
    sub.className = "item-sub";
    sub.textContent = "Você foi escalada(o) 👏";
    main.append(title, sub);
    item.append(main);
    list.appendChild(item);
  });
}

/* ========= BOTÕES HELPERS ========= */
function btnGhost(label, onClick){ const b = document.createElement("button"); b.className="ghost"; b.textContent=label; b.onclick=onClick; return b; }
function btnDanger(label, onClick){ const b = document.createElement("button"); b.className="danger"; b.textContent=label; b.onclick=onClick; return b; }

/* ========= RENDER GERAL ========= */
function renderTudo(){
  renderEventos();
  renderMembros();
  renderEscalas();
  renderMinhaEscala();
}

