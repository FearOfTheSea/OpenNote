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
    const path = window.location.pathname;
    const match = path.match(/\/note\/([^\/]+)/);
    editorState.noteId = match ? match[1] : null;

    await loadFolders();
    await loadAllTags();

    if (editorState.noteId && editorState.noteId !== "new") {
        await loadNote(editorState.noteId);
    } else {
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
            await modal.alert("Note not found", "Error");
            window.location.href = "/";
        }
    } catch (error) {
        console.error("Error loading note:", error);
        await modal.alert("Error loading note", "Error");
    }
}

async function loadFolders() {
    try {
        const response = await fetch(`${API_BASE}/folders?user_id=user`);
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
        const response = await fetch(`${API_BASE}/tags?user_id=user`);
        if (response.ok) {
            const data = await response.json();
            editorState.tags = Array.isArray(data) ? data : (data.tags || []);
        }
    } catch (error) {
        console.error("Error loading tags:", error);
    }
}

async function saveNote() {
    const noteData = {
        name: titleInput.value.trim(),
        content: contentTextarea.value,
        parent_folder_id: folderSelect.value,
    };

    if (!noteData.name) {
        await modal.alert("Please enter a note title", "Validation Error");
        return;
    }

    if (!noteData.parent_folder_id) {
        await modal.alert("Please select a folder", "Validation Error");
        return;
    }

    try {
        showSaveStatus("saving");

        let response;
        if (editorState.noteId && editorState.noteId !== "new") {
            response = await fetch(`${API_BASE}/notes/${editorState.noteId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(noteData),
            });
        } else {
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

            if (window.location.pathname.includes("/new")) {
                window.history.replaceState({}, "", `/note/${editorState.noteId}`);
            }

            showSaveStatus("saved");
            renderNote();
        } else {
            const error = await response.json();
            showSaveStatus("error");
            await modal.alert(error.error || "Error saving note", "Error");
        }
    } catch (error) {
        console.error("Error saving note:", error);
        showSaveStatus("error");
        await modal.alert("Error saving note", "Error");
    }
}

async function deleteNote() {
    if (!editorState.noteId || editorState.noteId === "new") {
        window.location.href = "/";
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
            window.location.href = "/";
        } else {
            await modal.alert("Error deleting note", "Error");
        }
    } catch (error) {
        console.error("Error deleting note:", error);
        await modal.alert("Error deleting note", "Error");
    }
}

// Rendering
function renderNote() {
    if (!editorState.note) return;

    titleInput.value = editorState.note.name;
    contentTextarea.value = editorState.note.content;
    folderSelect.value = editorState.note.parentFolderId;

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
    if (!editorState.note?.tagIds || editorState.note.tagIds.length === 0) {
        tagList.innerHTML = '<div style="color: var(--muted); font-size: 14px;">No tags</div>';
        return;
    }

    tagList.innerHTML = editorState.note.tagIds.map((tagId) => {
        const tag = editorState.tags.find((t) => t.id === tagId);
        const tagName = tag ? tag.name : tagId;

        return `
            <div class="tag-item">
                <span>#${escapeHtml(tagName)}</span>
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
        parentFolderId: "",
        tagIds: [],
    };

    titleInput.value = "";
    contentTextarea.value = "";
    renderTags();
}

function removeTag(tagId) {
    if (!editorState.note?.tagIds) return;

    editorState.note.tagIds = editorState.note.tagIds.filter((id) => id !== tagId);
    renderTags();
    editorState.isDirty = true;
}

// Event Listeners
function setupEventListeners() {
    backBtn.addEventListener("click", async () => {
        if (editorState.isDirty) {
            const confirmed = await modal.confirm(
                "You have unsaved changes. Leave anyway?",
                "Unsaved Changes",
            );
            if (confirmed) {
                window.location.href = "/";
            }
        } else {
            window.location.href = "/";
        }
    });

    saveBtn.addEventListener("click", saveNote);
    deleteBtn.addEventListener("click", deleteNote);

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

    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            saveNote();
        }
    });

    window.addEventListener("beforeunload", (e) => {
        if (editorState.isDirty) {
            e.preventDefault();
            e.returnValue = "";
        }
    });
}

function scheduleAutoSave() {
    clearTimeout(editorState.autoSaveTimer);
    editorState.autoSaveTimer = setTimeout(() => {
        if (editorState.isDirty) {
            saveNote();
        }
    }, 2000);
}

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
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

window.removeTag = removeTag;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}