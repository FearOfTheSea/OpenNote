const API_BASE = "http://localhost:3000/api";

// Application state
const state = {
    currentFolderId: null,
    folders: [],
    notes: [],
    tags: [],
    navigationStack: []
};

// Initialize the application
async function init() {
    await loadFolders();
    await loadTags();
    await loadContent();
    setupEventListeners();
}

// API calls
async function loadFolders() {
    try {
        const response = await fetch(`${API_BASE}/folders?user_id=user`);
        if (response.ok) {
            const data = await response.json();
            state.folders = data.folders || data || [];
            renderFolderList();
        }
    } catch (error) {
        console.error("Error loading folders:", error);
        showError("Failed to load folders");
    }
}

async function loadTags() {
    try {
        const response = await fetch(`${API_BASE}/tags?user_id=user`);
        if (response.ok) {
            const data = await response.json();
            state.tags = Array.isArray(data) ? data : (data.tags || []);
        }
    } catch (error) {
        console.error("Error loading tags:", error);
    }
}

async function loadContent(folderId = null) {
    try {
        let url;
        if (folderId) {
            url = `${API_BASE}/folders/${folderId}/contents?user_id=user`;
        } else {
            // Load root folders and all notes
            const [foldersRes, notesRes] = await Promise.all([
                fetch(`${API_BASE}/folders?user_id=user`),
                fetch(`${API_BASE}/notes?user_id=user`)
            ]);

            if (foldersRes.ok && notesRes.ok) {
                const foldersData = await foldersRes.json();
                const notesData = await notesRes.json();

                const allFolders = foldersData.folders || foldersData || [];
                const allNotes = Array.isArray(notesData) ? notesData : (notesData.notes || []);

                // Filter root folders (no parent)
                state.folders = allFolders.filter(f => !f.parentFolderId);
                state.notes = allNotes;

                renderContent();
                return;
            }
        }

        if (folderId) {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                state.folders = data.folders || [];
                state.notes = data.notes || [];
            }
        }

        renderContent();
    } catch (error) {
        console.error("Error loading content:", error);
        showError("Failed to load content");
    }
}

// Rendering functions
function renderFolderList() {
    const list = document.querySelector("aside .list");

    if (state.folders.length === 0) {
        list.innerHTML = '<li class="row empty">No folders</li>';
        return;
    }

    list.innerHTML = state.folders.map(folder => `
        <li class="row" onclick="navigateToFolder('${folder.id}')">
            <span>📁 ${escapeHtml(folder.name)}</span>
        </li>
    `).join("");
}

function renderContent() {
    const grid = document.querySelector(".grid");
    const title = document.querySelector(".section-title");

    // Update title
    if (state.currentFolderId) {
        const currentFolder = state.folders.find(f => f.id === state.currentFolderId);
        title.textContent = currentFolder ? currentFolder.name : "Folder";
    } else {
        title.textContent = "Home";
    }

    // Render folders and notes
    const items = [];

    // Add folder cards
    state.folders.forEach(folder => {
        items.push(`
            <div class="folder-card" onclick="navigateToFolder('${folder.id}')">
                <div class="card-icon">📁</div>
                <div class="folder-title">${escapeHtml(folder.name)}</div>
                <div class="folder-meta">Folder</div>
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button onclick="editFolder('${folder.id}')">✏️</button>
                    <button onclick="deleteFolder('${folder.id}')">🗑️</button>
                </div>
            </div>
        `);
    });

    // Add note cards
    state.notes.forEach(note => {
        const preview = note.content.substring(0, 100) + (note.content.length > 100 ? "..." : "");
        items.push(`
            <div class="note-card" onclick="openNote('${note.id}')">
                <div class="card-icon">📝</div>
                <div class="note-title">${escapeHtml(note.name)}</div>
                <div class="note-preview">${escapeHtml(preview)}</div>
                <div class="note-meta">Note</div>
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button onclick="openNote('${note.id}')">✏️</button>
                    <button onclick="deleteNote('${note.id}')">🗑️</button>
                </div>
            </div>
        `);
    });

    if (items.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>No items here yet</p>
                <button onclick="showCreateNoteDialog()">Create your first note</button>
            </div>
        `;
    } else {
        grid.innerHTML = items.join("");
    }
}

// Navigation functions
function navigateToFolder(folderId) {
    state.navigationStack.push(state.currentFolderId);
    state.currentFolderId = folderId;
    loadContent(folderId);
}

function goBack() {
    if (state.navigationStack.length > 0) {
        state.currentFolderId = state.navigationStack.pop();
        if (state.currentFolderId) {
            loadContent(state.currentFolderId);
        } else {
            loadContent();
        }
    }
}

function goHome() {
    state.navigationStack = [];
    state.currentFolderId = null;
    loadContent();
}

// CRUD operations
async function showCreateNoteDialog() {
    // Get folders for selection
    const folderOptions = state.folders.map(f => ({
        value: f.id,
        label: f.name
    }));

    if (folderOptions.length === 0) {
        await modal.alert("Please create a folder first", "No Folders");
        return;
    }

    const result = await modal.form({
        title: "Create New Note",
        fields: [
            {
                name: "name",
                label: "Note Name",
                type: "text",
                required: true,
                placeholder: "My note"
            },
            {
                name: "parent_folder_id",
                label: "Folder",
                type: "select",
                required: true,
                options: folderOptions,
                value: state.currentFolderId || folderOptions[0].value
            }
        ],
        submitText: "Create"
    });

    if (result) {
        try {
            const response = await fetch(`${API_BASE}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: result.name,
                    content: "",
                    parent_folder_id: result.parent_folder_id
                })
            });

            if (response.ok) {
                const data = await response.json();
                const noteId = data.note?.id || data.id;
                window.location.href = `/note/${noteId}`;
            } else {
                const error = await response.json();
                await modal.alert(error.error || "Failed to create note", "Error");
            }
        } catch (error) {
            console.error("Error creating note:", error);
            await modal.alert("Failed to create note", "Error");
        }
    }
}

async function showCreateFolderDialog() {
    const result = await modal.prompt("Enter folder name:", "", "Create Folder");

    if (result) {
        try {
            const response = await fetch(`${API_BASE}/folders`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: result,
                    user_id: "user",
                    parent_folder_id: state.currentFolderId
                })
            });

            if (response.ok) {
                await loadFolders();
                await loadContent(state.currentFolderId);
            } else {
                const error = await response.json();
                await modal.alert(error.error || "Failed to create folder", "Error");
            }
        } catch (error) {
            console.error("Error creating folder:", error);
            await modal.alert("Failed to create folder", "Error");
        }
    }
}

async function editFolder(folderId) {
    const folder = state.folders.find(f => f.id === folderId);
    if (!folder) return;

    const newName = await modal.prompt("Enter new folder name:", folder.name, "Rename Folder");

    if (newName && newName !== folder.name) {
        try {
            const response = await fetch(`${API_BASE}/folders/${folderId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName })
            });

            if (response.ok) {
                await loadFolders();
                await loadContent(state.currentFolderId);
            } else {
                const error = await response.json();
                await modal.alert(error.error || "Failed to rename folder", "Error");
            }
        } catch (error) {
            console.error("Error renaming folder:", error);
            await modal.alert("Failed to rename folder", "Error");
        }
    }
}

async function deleteFolder(folderId) {
    const confirmed = await modal.confirm(
        "Are you sure you want to delete this folder? All contents will be deleted.",
        "Delete Folder"
    );

    if (confirmed) {
        try {
            const response = await fetch(`${API_BASE}/folders/${folderId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                await loadFolders();
                await loadContent(state.currentFolderId);
            } else {
                const error = await response.json();
                await modal.alert(error.error || "Failed to delete folder", "Error");
            }
        } catch (error) {
            console.error("Error deleting folder:", error);
            await modal.alert("Failed to delete folder", "Error");
        }
    }
}

async function deleteNote(noteId) {
    const confirmed = await modal.confirm(
        "Are you sure you want to delete this note?",
        "Delete Note"
    );

    if (confirmed) {
        try {
            const response = await fetch(`${API_BASE}/notes/${noteId}`, {
                method: "DELETE"
            });

            if (response.ok) {
                await loadContent(state.currentFolderId);
            } else {
                await modal.alert("Failed to delete note", "Error");
            }
        } catch (error) {
            console.error("Error deleting note:", error);
            await modal.alert("Failed to delete note", "Error");
        }
    }
}

function openNote(noteId) {
    window.location.href = `/note/${noteId}`;
}

// Event listeners
function setupEventListeners() {
    document.getElementById("new-folder")?.addEventListener("click", (e) => {
        e.preventDefault();
        showCreateFolderDialog();
    });

    document.getElementById("new-note")?.addEventListener("click", (e) => {
        e.preventDefault();
        showCreateNoteDialog();
    });

    document.getElementById("search")?.addEventListener("click", async (e) => {
        e.preventDefault();
        const query = await modal.prompt("Search notes:", "", "Search");
        if (query) {
            try {
                const response = await fetch(`${API_BASE}/notes/search?q=${encodeURIComponent(query)}&user_id=user`);
                if (response.ok) {
                    const data = await response.json();
                    state.notes = data.notes || [];
                    state.folders = [];
                    renderContent();
                }
            } catch (error) {
                console.error("Error searching:", error);
            }
        }
    });
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    const grid = document.querySelector(".grid");
    grid.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
}

// Make functions globally available
window.navigateToFolder = navigateToFolder;
window.goBack = goBack;
window.goHome = goHome;
window.showCreateNoteDialog = showCreateNoteDialog;
window.editFolder = editFolder;
window.deleteFolder = deleteFolder;
window.deleteNote = deleteNote;
window.openNote = openNote;

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}