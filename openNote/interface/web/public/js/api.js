// Centralized API service
const API = {
    BASE_URL: 'http://localhost:3000/api',

    // Notes
    async getNotes(folderId = null) {
        const url = folderId
            ? `${this.BASE_URL}/notes?folderId=${folderId}`
            : `${this.BASE_URL}/notes`;
        const res = await fetch(url);
        return res.ok ? await res.json() : [];
    },

    async getNote(id) {
        const res = await fetch(`${this.BASE_URL}/notes/${id}`);
        if (!res.ok) throw new Error('Note not found');
        return await res.json();
    },

    async createNote(data) {
        const res = await fetch(`${this.BASE_URL}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.ok ? await res.json() : null;
    },

    async updateNote(id, data) {
        const res = await fetch(`${this.BASE_URL}/notes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.ok ? await res.json() : null;
    },

    async deleteNote(id) {
        const res = await fetch(`${this.BASE_URL}/notes/${id}`, {
            method: 'DELETE'
        });
        return res.ok;
    },

    // Folders
    async getFolders() {
        const res = await fetch(`${this.BASE_URL}/folders`);
        return res.ok ? await res.json() : [];
    },

    async getFolderContents(folderId) {
        const res = await fetch(`${this.BASE_URL}/folders/${folderId}/contents`);
        return res.ok ? await res.json() : { folders: [], notes: [] };
    },

    // Tags
    async getTags() {
        const res = await fetch(`${this.BASE_URL}/tags`);
        return res.ok ? await res.json() : [];
    },

    async getNotesByTags(tagIds) {
        const tags = tagIds.join(',');
        const res = await fetch(`${this.BASE_URL}/notes?tags=${tags}`);
        return res.ok ? await res.json() : [];
    },

    // Search
    async searchNotes(query, folderId = null) {
        const url = folderId
            ? `${this.BASE_URL}/notes/search?q=${encodeURIComponent(query)}&folderId=${folderId}`
            : `${this.BASE_URL}/notes/search?q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        return res.ok ? await res.json() : { notes: [] };
    }
};