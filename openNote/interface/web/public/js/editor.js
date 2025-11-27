const API_BASE = "http://localhost:3000/api";

// State
const editorState = {
  noteId: null,
  note: null,
  folders: [],
  tags: [],
  isDirty: false,
  autoSaveTimer: null,
};

// DOM Elements
const backBtn = document.getElementById("back-btn");
const titleInput = document.getElementById("note-title");
const contentTextarea = document.getElementById("note-content");
const folderSelect = document.getElementById("folder-select");
const tagList = document.getElementById("tag-list");
const addTagBtn = document.getElementById("add-tag-btn");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");
const createdDate = document.getElementById("created-date");
const modifiedDate = document.getElementById("modified-date");

// Initialize
async function init() {
  // Get note ID from URL
  const path = globalThis.location.pathname;
  const match = path.match(/\/note\/([^\/]+)/);
  editorState.noteId = match ? match[1] : null;

  // Load data
  await loadFolders();
  await loadAllTags();

  if (editorState.noteId && editorState.noteId !== "new") {
    await loadNote(editorState.noteId);
  } else {
    // New note
    setupNewNote();
  }

  setupEventListeners();
}

// API Calls
async function loadNote(id) {
  try {
    const response = await fetch(`${API_BASE}/notes/${id}`);
    if (response.ok) {
      const data = await response.json();
      editorState.note = data.note || data;
      renderNote();
    } else {
      alert("Note not found");
      globalThis.location.href = "/";
    }
  } catch (error) {
    console.error("Error loading note:", error);
    await modal.alert("Error loading note", "Error");
  }
}

async function loadFolders() {
  try {
    const response = await fetch(`${API_BASE}/folders`);
    if (response.ok) {
      const data = await response.json();
      editorState.folders = data.folders || data;
      renderFolderSelect();
    }
  } catch (error) {
    console.error("Error loading folders:", error);
  }
}

async function loadAllTags() {
  try {
    const response = await fetch(`${API_BASE}/tags`);
    if (response.ok) {
      const data = await response.json();
      editorState.tags = data.tags || data;
    }
  } catch (error) {
    console.error("Error loading tags:", error);
  }
}

async function saveNote() {
  const noteData = {
    name: titleInput.value.trim(),
    content: contentTextarea.value,
    folderId: folderSelect.value,
    tagsId: editorState.note?.tagsId || [],
  };

  if (!noteData.name) {
    await modal.alert("Please enter a note title", "Validation Error");
    return;
  }

  if (!noteData.folderId) {
    await modal.alert("Please select a folder", "Validation Error");
    return;
  }

  try {
    showSaveStatus("saving");

    let response;
    if (editorState.noteId && editorState.noteId !== "new") {
      // Update existing note
      response = await fetch(`${API_BASE}/notes/${editorState.noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });
    } else {
      // Create new note
      response = await fetch(`${API_BASE}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteData),
      });
    }

    if (response.ok) {
      const data = await response.json();
      editorState.note = data.note || data;
      editorState.noteId = editorState.note.id;
      editorState.isDirty = false;

      // Update URL if it was a new note
      if (globalThis.location.pathname.includes("/new")) {
        globalThis.history.replaceState({}, "", `/note/${editorState.noteId}`);
      }

      showSaveStatus("saved");
      renderNote();
    } else {
      showSaveStatus("error");
      alert("Error saving note");
    }
  } catch (error) {
    console.error("Error saving note:", error);
    showSaveStatus("error");
    alert("Error saving note");
  }
}

async function deleteNote() {
  if (!editorState.noteId || editorState.noteId === "new") {
    globalThis.location.href = "/";
    return;
  }

  const confirmed = await modal.confirm(
    "Are you sure you want to delete this note? This action cannot be undone.",
    "Delete Note",
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/notes/${editorState.noteId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      globalThis.location.href = "/";
    } else {
      alert("Error deleting note");
    }
  } catch (error) {
    console.error("Error deleting note:", error);
    alert("Error deleting note");
  }
}

// Rendering
function renderNote() {
  if (!editorState.note) return;

  titleInput.value = editorState.note.name;
  contentTextarea.value = editorState.note.content;
  folderSelect.value = editorState.note.folderId;

  renderTags();
  renderMetadata();
}

function renderFolderSelect() {
  folderSelect.innerHTML = '<option value="">Select folder...</option>';

  editorState.folders.forEach((folder) => {
    const option = document.createElement("option");
    option.value = folder.id;
    option.textContent = folder.name;
    folderSelect.appendChild(option);
  });
}

function renderTags() {
  if (!editorState.note?.tagsId || editorState.note.tagsId.length === 0) {
    tagList.innerHTML = '<div style="color: var(--muted); font-size: 14px;">No tags</div>';
    return;
  }

  tagList.innerHTML = editorState.note.tagsId.map((tagId) => {
    const tag = editorState.tags.find((t) => t.id === tagId);
    const tagName = tag ? tag.name : tagId;

    return `
            <div class="tag-item">
                <span>${escapeHtml(tagName)}</span>
                <button onclick="removeTag('${tagId}')" title="Remove tag">×</button>
            </div>
        `;
  }).join("");
}

function renderMetadata() {
  if (editorState.note?.createdAt) {
    createdDate.textContent = new Date(editorState.note.createdAt).toLocaleString();
  }

  if (editorState.note?.updatedAt) {
    modifiedDate.textContent = new Date(editorState.note.updatedAt).toLocaleString();
  }
}

function setupNewNote() {
  editorState.note = {
    name: "",
    content: "",
    folderId: "",
    tagsId: [],
  };

  titleInput.value = "";
  contentTextarea.value = "";
  renderTags();
}

// Tag Management
async function addTag() {
  const tagName = await modal.prompt("Enter tag name:", "", "Add Tag");
  if (!tagName) return;

  // Find or create tag
  let tag = editorState.tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());

  if (!tag) {
    // Create new tag
    try {
      const response = await fetch(`${API_BASE}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tagName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        tag = { id: data.id, name: tagName.trim() };
        editorState.tags.push(tag);
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      return;
    }
  }

  // Add tag to note
  if (!editorState.note.tagsId) {
    editorState.note.tagsId = [];
  }

  if (!editorState.note.tagsId.includes(tag.id)) {
    editorState.note.tagsId.push(tag.id);
    renderTags();
    editorState.isDirty = true;
  }
}

function removeTag(tagId) {
  if (!editorState.note?.tagsId) return;

  editorState.note.tagsId = editorState.note.tagsId.filter((id) => id !== tagId);
  renderTags();
  editorState.isDirty = true;
}

// Event Listeners
function setupEventListeners() {
  backBtn.addEventListener(
    "click",
    async () => {
      if (editorState.isDirty) {
        const confirmed = await modal.confirm(
          "You have unsaved changes. Leave anyway?",
          "Unsaved Changes",
        );
        if (confirmed) {
          globalThis.location.href = "/";
        }
      } else {
        globalThis.location.href = "/";
      }

      saveBtn.addEventListener("click", saveNote);
      deleteBtn.addEventListener("click", deleteNote);
      addTagBtn.addEventListener("click", addTag);

      // Track changes
      titleInput.addEventListener("input", () => {
        editorState.isDirty = true;
        scheduleAutoSave();
      });

      contentTextarea.addEventListener("input", () => {
        editorState.isDirty = true;
        scheduleAutoSave();
      });

      folderSelect.addEventListener("change", () => {
        editorState.isDirty = true;
      });

      // Keyboard shortcuts
      document.addEventListener("keydown", (e) => {
        // Ctrl/Cmd + S: Save
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          saveNote();
        }
      });

      // Warn before leaving with unsaved changes
      globalThis.addEventListener("beforeunload", (e) => {
        if (editorState.isDirty) {
          e.preventDefault();
          e.returnValue = "";
        }
      });
    },
    // Auto-save
    function scheduleAutoSave() {
      clearTimeout(editorState.autoSaveTimer);
      editorState.autoSaveTimer = setTimeout(() => {
        if (editorState.isDirty) {
          saveNote();
        }
      }, 2000); // Auto-save after 2 seconds of inactivity
    },
    function showSaveStatus(status) {
      let statusEl = document.querySelector(".save-status");

      if (!statusEl) {
        statusEl = document.createElement("div");
        statusEl.className = "save-status";
        document.querySelector(".header-actions").prepend(statusEl);
      }

      statusEl.className = `save-status ${status}`;

      switch (status) {
        case "saving":
          statusEl.textContent = "Saving...";
          break;
        case "saved":
          statusEl.textContent = "Saved ✓";
          setTimeout(() => statusEl.textContent = "", 2000);
          break;
        case "error":
          statusEl.textContent = "Save failed ✗";
          break;
      }
    },
    // Utility
    function escapeHtml(text) {
      const div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    },
    // Expose functions for inline handlers
    globalThis.removeTag = removeTag,
  );

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}
