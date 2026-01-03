const board = document.getElementById("board");
const boardWrapper = document.getElementById("boardWrapper");
const connectionLayer = document.getElementById("connectionLayer");
const noteModal = document.getElementById("noteModal");
const noteForm = document.getElementById("noteForm");
const modalTitle = document.getElementById("noteModalTitle");
const hint = document.getElementById("hint");
const detailView = document.getElementById("detailView");
const detailTitle = document.getElementById("detailTitle");
const detailContent = document.getElementById("detailContent");
const detailImage = document.getElementById("detailImage");
const detailTags = document.getElementById("detailTags");
const detailExtras = document.getElementById("detailExtras");

const editToggle = document.getElementById("editToggle");
const connectToggle = document.getElementById("connectToggle");
const addNote = document.getElementById("addNote");
const backToBoard = document.getElementById("backToBoard");
const closeModal = document.getElementById("closeModal");
const cancelModal = document.getElementById("cancelModal");

let notes = [];
let connections = [];
let currentPosition = { x: 60, y: 60 };
let editingId = null;
let editMode = false;
let connectMode = false;
let anchorNoteId = null;
let idCounter = 0;

function pulseNote(noteId) {
  const el = document.querySelector(`[data-id="${noteId}"]`);
  if (!el) return;
  el.classList.add("pulse");
  setTimeout(() => el.classList.remove("pulse"), 600);
}

function openModal(position, note) {
  noteModal.classList.add("open");
  currentPosition = position;
  editingId = note?.id ?? null;
  modalTitle.textContent = editingId ? "Notiz bearbeiten" : "Neue Notiz";

  noteForm.title.value = note?.title ?? "";
  noteForm.content.value = note?.content ?? "";
  noteForm.imageUrl.value = note?.imageUrl ?? "";
  noteForm.tags.value = note?.tags?.join(", ") ?? "";
  noteForm.extras.value = note?.extras ?? "";
  noteForm.color.value = note?.color ?? "#f8d86b";
}

function closeModalWindow() {
  noteModal.classList.remove("open");
  editingId = null;
}

function createNoteElement(note) {
  const card = document.createElement("article");
  card.className = "note";
  card.style.left = `${note.x}px`;
  card.style.top = `${note.y}px`;
  card.style.background = note.color;
  card.dataset.id = note.id;

  const title = document.createElement("h3");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.textContent = note.content || "(kein Text)";

  card.appendChild(title);
  card.appendChild(body);

  if (note.imageUrl) {
    const img = document.createElement("img");
    img.src = note.imageUrl;
    img.alt = "Notizbild";
    img.className = "thumbnail";
    card.appendChild(img);
  }

  if (note.tags.length) {
    const tags = document.createElement("div");
    tags.className = "tags";
    note.tags.forEach((tag) => {
      const pill = document.createElement("span");
      pill.className = "tag";
      pill.textContent = tag;
      tags.appendChild(pill);
    });
    card.appendChild(tags);
  }

  card.addEventListener("click", (event) => {
    event.stopPropagation();
    if (connectMode) {
      handleConnection(note.id);
      return;
    }

    if (editMode) {
      openModal({ x: note.x, y: note.y }, note);
      return;
    }

    openDetail(note);
  });

  return card;
}

function render() {
  board.innerHTML = "";
  notes.forEach((note) => {
    const card = createNoteElement(note);
    board.appendChild(card);
  });
  drawConnections();
}

function drawConnections() {
  connectionLayer.innerHTML = "";
  connections.forEach(({ from, to }) => {
    const fromNote = notes.find((n) => n.id === from);
    const toNote = notes.find((n) => n.id === to);
    if (!fromNote || !toNote) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", fromNote.x + 110);
    line.setAttribute("y1", fromNote.y + 70);
    line.setAttribute("x2", toNote.x + 110);
    line.setAttribute("y2", toNote.y + 70);
    line.setAttribute("stroke", "#ff3b30");
    line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke-linecap", "round");
    connectionLayer.appendChild(line);
  });
}

function handleConnection(noteId) {
  if (!anchorNoteId) {
    anchorNoteId = noteId;
    pulseNote(noteId);
    hint.textContent = "Wähle eine zweite Notiz, um eine Verbindung zu ziehen.";
    return;
  }

  if (anchorNoteId === noteId) {
    anchorNoteId = null;
    hint.textContent = "Verbindung abgebrochen. Wähle zwei Notizen.";
    return;
  }

  connections.push({ from: anchorNoteId, to: noteId });
  anchorNoteId = null;
  hint.textContent = "Connection gesetzt!";
  render();
}

function openDetail(note) {
  detailTitle.textContent = note.title;
  detailContent.textContent = note.content;
  detailTags.textContent = note.tags.length ? `Tags: ${note.tags.join(", ")}` : "Keine Tags";
  detailExtras.textContent = note.extras ? `Weitere Infos: ${note.extras}` : "";

  if (note.imageUrl) {
    detailImage.src = note.imageUrl;
    detailImage.style.display = "block";
  } else {
    detailImage.style.display = "none";
  }

  detailView.classList.remove("hidden");
}

function closeDetail() {
  detailView.classList.add("hidden");
}

function getPosition(event) {
  const rect = board.getBoundingClientRect();
  return {
    x: event.clientX - rect.left - 110,
    y: event.clientY - rect.top - 70,
  };
}

function resetForm() {
  noteForm.reset();
  noteForm.color.value = "#f8d86b";
}

board.addEventListener("click", (event) => {
  if (connectMode || editMode) return;
  const pos = getPosition(event);
  openModal(pos);
});

addNote.addEventListener("click", () => {
  const rect = board.getBoundingClientRect();
  openModal({ x: rect.width / 2 - 110, y: rect.height / 2 - 70 });
});

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(noteForm);

  const note = {
    id: editingId ?? ++idCounter,
    title: data.get("title"),
    content: data.get("content"),
    imageUrl: data.get("imageUrl"),
    tags: data.get("tags")
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean) ?? [],
    extras: data.get("extras"),
    color: data.get("color") ?? "#f8d86b",
    x: currentPosition.x,
    y: currentPosition.y,
  };

  if (editingId) {
    notes = notes.map((n) => (n.id === editingId ? { ...note } : n));
  } else {
    notes.push(note);
  }

  render();
  resetForm();
  closeModalWindow();
});

closeModal.addEventListener("click", closeModalWindow);
cancelModal.addEventListener("click", closeModalWindow);

backToBoard.addEventListener("click", closeDetail);
detailView.addEventListener("click", (event) => {
  if (event.target === detailView) closeDetail();
});

editToggle.addEventListener("click", () => {
  editMode = !editMode;
  document.body.classList.toggle("edit-mode", editMode);
  editToggle.textContent = editMode ? "Bearbeiten beenden" : "Notizen bearbeiten";
  hint.textContent = editMode
    ? "Klicke eine Notiz, um sie zu bearbeiten."
    : "Klick ins Brett setzt eine neue Notiz.";
});

connectToggle.addEventListener("click", () => {
  connectMode = !connectMode;
  anchorNoteId = null;
  document.body.classList.toggle("connection-mode", connectMode);
  connectToggle.textContent = connectMode ? "Connection beenden" : "Connection ziehen";
  hint.textContent = connectMode
    ? "Wähle zwei Notizen, um sie mit einem Faden zu verbinden."
    : "Klick ins Brett setzt eine neue Notiz.";
});

noteModal.addEventListener("click", (event) => {
  if (event.target === noteModal) closeModalWindow();
});

// Initial sample note
notes.push({
  id: ++idCounter,
  title: "Willkommen!",
  content: "Klicke irgendwo auf das Brett, um deine erste Notiz abzulegen.",
  imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
  tags: ["onboarding", "ideen"],
  extras: "Ziehe Connections zwischen Ideen.",
  color: "#f8d86b",
  x: 80,
  y: 80,
});

render();
