const API_BASE = "http://localhost:3000/api";

// State management
const state = {
    folders: [],
    notes: [],
    currentFolderId: null,
    selectedItems: new Set(),
};

// DOM Elements
const sidebarList = document.querySelector(".list");
const mainGrid = document.querySelector(".grid");
const sectionTitle = document.querySelector(".section-title");

// Initialize the app
async function init() {
    await loadFolders();
    await loadNotes();
    renderSidebar();
    renderMainContent();
    setupEventListeners();
}

// API Calls
async function loadFolders() {
    try {
        const response = await fetch(`${API_BASE}/folders`);
        if (response.ok) {
            state.folders = await response.json();
        }
    } catch (error) {
        console.error("Error loading folders:", error);
        state.folders = [];
    }
}

async function loadNotes() {
    try {
        const response = await fetch(`${API_BASE}/notes`);
        if (response.ok) {
            state.notes = await response.json();
        }
    } catch (error) {
        console.error("Error loading notes:", error);
        state.notes = [];
    }
}

async function createFolder(name, parentFolderId = null) {
    try {
        const response = await fetch(`${API_BASE}/folders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, folderId: parentFolderId }),
        });
        if (response.ok) {
            await loadFolders();
            renderSidebar();
            renderMainContent();
            return await response.json();
        }
    } catch (error) {
        console.error("Error creating folder:", error);
    }
}

async function createNote(name, content, folderId = null) {
    try {
        const response = await fetch(`${API_BASE}/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, content, folderId }),
        });
        if (response.ok) {
            await loadNotes();
            renderMainContent();
            return await response.json();
        }
    } catch (error) {
        console.error("Error creating note:", error);
    }
}

async function deleteFolder(folderId) {
    try {
        const response = await fetch(`${API_BASE}/folders/${folderId}`, {
            method: "DELETE",
        });
        if (response.ok) {
            await loadFolders();
            renderSidebar();
            renderMainContent();
        }
    } catch (error) {
        console.error("Error deleting folder:", error);
    }
}

async function deleteNote(noteId) {
    try {
        const response = await fetch(`${API_BASE}/notes/${noteId}`, {
            method: "DELETE",
        });
        if (response.ok) {
            await loadNotes();
            renderMainContent();
        }
    } catch (error) {
        console.error("Error deleting note:", error);
    }
}

// Render Functions
function renderSidebar() {
    const rootFolders = state.folders.filter((f) => !f.folderId);

    if (rootFolders.length === 0) {
        sidebarList.innerHTML = '<li class="row empty">No folders yet</li>';
        return;
    }

    sidebarList.innerHTML = rootFolders.map((folder) => `
        <li class="row" data-folder-id="${folder.id}">
            <input type="checkbox" 
                   id="folder-${folder.id}" 
                   ${state.selectedItems.has(folder.id) ? "checked" : ""}
                   onchange="toggleSelection('${folder.id}')"
            />
            <span onclick="openFolder('${folder.id}')">${escapeHtml(folder.name)}</span>
        </li>
    `).join("");
}

function renderMainContent() {
    const currentFolders = state.folders.filter(
        (f) => f.folderId === state.currentFolderId,
    );
    const currentNotes = state.notes.filter(
        (n) => n.folderId === state.currentFolderId,
    );

    // Update section title
    if (state.currentFolderId) {
        const currentFolder = state.folders.find((f) => f.id === state.currentFolderId);
        sectionTitle.textContent = currentFolder ? currentFolder.name : "Home";
    } else {
        sectionTitle.textContent = "Home";
    }

    // Render folders and notes
    const foldersHTML = currentFolders.map((folder) => createFolderCard(folder))
        .join("");
    const notesHTML = currentNotes.map((note) => createNoteCard(note)).join("");

    if (currentFolders.length === 0 && currentNotes.length === 0) {
        mainGrid.innerHTML = `
            <div class="empty-state">
                <p>📁 This folder is empty</p>
                <button onclick="showCreateNoteDialog()">Create a note</button>
            </div>
        `;
    } else {
        mainGrid.innerHTML = foldersHTML + notesHTML;
    }
}

function createFolderCard(folder) {
    const subFolderCount = state.folders.filter((f) => f.folderId === folder.id).length;
    const noteCount = state.notes.filter((n) => n.folderId === folder.id).length;

    return `
        <article class="folder-card" onclick="openFolder('${folder.id}')">
            <div class="card-icon">📁</div>
            <div class="folder-title">${escapeHtml(folder.name)}</div>
            <div class="folder-meta">
                ${subFolderCount} folders, ${noteCount} notes
            </div>
            <div class="card-actions" onclick="event.stopPropagation()">
                <button onclick="editFolder('${folder.id}')">✏️</button>
                <button onclick="confirmDelete('folder', '${folder.id}')">🗑️</button>
            </div>
        </article>
    `;
}

function createNoteCard(note) {
    const preview = note.content.substring(0, 100);
    const date = new Date(note.createdAt).toLocaleDateString();

    return `
        <article class="note-card" onclick="openNote('${note.id}')">
            <div class="card-icon">📝</div>
            <div class="note-title">${escapeHtml(note.name)}</div>
            <div class="note-preview">${escapeHtml(preview)}${note.content.length > 100 ? "..." : ""}</div>
            <div class="note-meta">${date}</div>
            <div class="card-actions" onclick="event.stopPropagation()">
                <button onclick="editNote('${note.id}')">✏️</button>
                <button onclick="confirmDelete('note', '${note.id}')">🗑️</button>
            </div>
        </article>
    `;
}

// Navigation
function openFolder(folderId) {
    state.currentFolderId = folderId;
    renderMainContent();
}

function goBack() {
    const currentFolder = state.folders.find((f) => f.id === state.currentFolderId);
    state.currentFolderId = currentFolder ? currentFolder.folderId : null;
    renderMainContent();
}

function goHome() {
    state.currentFolderId = null;
    renderMainContent();
}

function openNote(noteId) {
    // Navigate to note detail page or open modal
    window.location.href = `/notes/${noteId}`;
}

// Selection
function toggleSelection(itemId) {
    if (state.selectedItems.has(itemId)) {
        state.selectedItems.delete(itemId);
    } else {
        state.selectedItems.add(itemId);
    }
}

// CRUD Operations UI
async function showCreateFolderDialog() {
    const name = await modal.prompt("Enter folder name:", "", "Create Folder");
    if (name) {
        createFolder(name, state.currentFolderId);
    }
}


async function showCreateNoteDialog() {
    const result = await modal.form({
        title: 'Create New Note',
        fields: [
            {
                name: 'name',
                label: 'Note Name',
                type: 'text',
                required: true,
                placeholder: 'Enter note name...'
            },
            {
                name: 'content',
                label: 'Content',
                type: 'textarea',
                rows: 4,
                placeholder: 'Enter note content (optional)...'
            }
        ],
        submitText: 'Create'
    });

    if (result) {
        createNote(result.name, result.content || '', state.currentFolderId);
    }
}

async function editFolder(folderId) {
    const folder = state.folders.find((f) => f.id === folderId);
    if (!folder) return;

    const newName = await modal.prompt("Enter new folder name:", folder.name, "Rename Folder");
    if (newName) {
        updateFolder(folderId, newName);
    }
}

function editNote(noteId) {
    // Navigate to note editor
    window.location.href = `/note/${noteId}/edit`;
}

async function updateFolder(folderId, name) {
    try {
        const response = await fetch(`${API_BASE}/folder/${folderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
        });
        if (response.ok) {
            await loadFolders();
            renderSidebar();
            renderMainContent();
        }
    } catch (error) {
        console.error("Error updating folder:", error);
    }
}

async function confirmDelete(type, id) {
    const message = `Are you sure you want to delete this ${type}?`;
    const confirmed = await modal.confirm(message, 'Delete Confirmation');

    if (confirmed) {
        if (type === "folder") {
            deleteFolder(id);
        } else {
            deleteNote(id);
        }
    }
}

// Search functionality
async function handleSearch() {
    const query = await modal.prompt("Search for notes and folders:", "", "Search");
    if (query) {
        searchContent(query);
    }
}

async function searchContent(query) {
    try {
        const [notesRes, foldersRes] = await Promise.all([
            fetch(`${API_BASE}/notes/search?q=${encodeURIComponent(query)}`),
            fetch(`${API_BASE}/folders/search?q=${encodeURIComponent(query)}`),
        ]);

        if (notesRes.ok && foldersRes.ok) {
            const notes = await notesRes.json();
            const folders = await foldersRes.json();
            renderSearchResults(folders, notes, query);
        }
    } catch (error) {
        console.error("Error searching:", error);
    }
}

function renderSearchResults(folders, notes, query) {
    sectionTitle.textContent = `Search results for "${query}"`;

    const foldersHTML = folders.map((folder) => createFolderCard(folder)).join(
        "",
    );
    const notesHTML = notes.map((note) => createNoteCard(note)).join("");

    if (folders.length === 0 && notes.length === 0) {
        mainGrid.innerHTML = '<div class="empty-state"><p>No results found</p></div>';
    } else {
        mainGrid.innerHTML = foldersHTML + notesHTML;
    }
}

// Event Listeners
function setupEventListeners() {
    document.getElementById("new-folder")?.addEventListener("click", (e) => {
        e.preventDefault();
        showCreateFolderDialog();
    });

    document.getElementById("search")?.addEventListener("click", (e) => {
        e.preventDefault();
        handleSearch();
    });

    document.getElementById("help")?.addEventListener("click", (e) => {
        e.preventDefault();
        alert(
            "OpenNote Help\n\n- Click folders to navigate\n- Use checkboxes to select items\n- Click actions to edit or delete",
        );
    });

    document.getElementById("log-out")?.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to log out?")) {
            window.location.href = "/logout";
        }
    });
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

// Expose functions globally for inline event handlers
window.openFolder = openFolder;
window.openNote = openNote;
window.toggleSelection = toggleSelection;
window.editFolder = editFolder;
window.editNote = editNote;
window.confirmDelete = confirmDelete;
window.showCreateNoteDialog = showCreateNoteDialog;
window.goBack = goBack;
window.goHome = goHome;

// Add these improvements to the existing homepage.js

// Improved error handling
async function loadFolders() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/folders`);
        if (response.ok) {
            const data = await response.json();
            state.folders = data.folders || data; // Handle both response formats
        } else {
            showError('Failed to load folders');
        }
    } catch (error) {
        console.error("Error loading folders:", error);
        showError('Network error loading folders');
        state.folders = [];
    } finally {
        hideLoading();
    }
}

// Loading indicator
function showLoading() {
    mainGrid.innerHTML = '<div class="loading">Loading...</div>';
}

function hideLoading() {
    // Loading removed when content renders
}

// Error display
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    mainGrid.prepend(errorDiv);

    setTimeout(() => errorDiv.remove(), 5000);
}

// Breadcrumb navigation
function renderBreadcrumb() {
    const breadcrumb = [];
    let current = state.currentFolderId;

    while (current) {
        const folder = state.folders.find(f => f.id === current);
        if (folder) {
            breadcrumb.unshift(folder);
            current = folder.parentFolderId;
        } else {
            break;
        }
    }

    return breadcrumb;
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N: New note
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        showCreateNoteDialog();
    }

    // Ctrl/Cmd + Shift + N: New folder
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        showCreateFolderDialog();
    }

    // Ctrl/Cmd + F: Search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        handleSearch();
    }

    // Escape: Go back
    if (e.key === 'Escape' && state.currentFolderId) {
        goBack();
    }
});
