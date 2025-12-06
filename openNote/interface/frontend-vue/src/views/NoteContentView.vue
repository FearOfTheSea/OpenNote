<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getSessionStatus } from '../api/auth'
import { ApiError } from '../api/http'
import router from '../router'
import { getNoteById, getNotePath, updateNote, deleteNote, type GetNoteByIdResponse } from '../api/note'
import SideBar from '../components/SideBar.vue'
import NavBar from '../components/NavBar.vue'
import { getAllFolders, type GetFolderByIdResponse } from '../api/folder'

const sidebarReloadKey = ref(0)
const route = useRoute()
const noteId = route.params.id as string
const folderId = ref('')
const noteInfo = ref<GetNoteByIdResponse>()
const notePath = ref('')
const isEditing = ref(false)
const editedContent = ref('')
const newNoteName = ref('')
const isRenaming = ref(false)
const isMoving = ref(false)
const destFolderId = ref('')
const validFolders = ref<GetFolderByIdResponse[]>()

onMounted(async () => {
  try {
    const me = await getSessionStatus()
    if (!me.logged_in) {
      router.push('/signin')
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      router.push('/signin')
    }
  }
  loadPage()
})

const loadPage = async () => {
  notePath.value = await getNotePath(noteId)
  noteInfo.value = await getNoteById({ id: noteId })
  folderId.value = noteInfo.value.parentFolderId
  editedContent.value = noteInfo.value?.content || ''
  newNoteName.value = noteInfo.value?.name || ''

  validFolders.value = (await getAllFolders()).folders.filter((f) => f.id !== folderId.value)
}

const toggleEditMode = () => {
  isEditing.value = !isEditing.value
  if (!isEditing.value) {
    editedContent.value = noteInfo.value?.content || ''
  }
}

const saveNote = async () => {
  await updateNote({
    id: noteId,
    newContent: editedContent.value
  })
  isEditing.value = false
  loadPage()
  sidebarReloadKey.value += 1
}

const cancelEdit = () => {
  isEditing.value = false
  editedContent.value = noteInfo.value?.content || ''
}

const openRenameModal = () => {
  newNoteName.value = noteInfo.value?.name || ''
  isRenaming.value = true
}

const renameNote = async () => {
  if (newNoteName.value && newNoteName.value !== noteInfo.value?.name) {
    await updateNote({
      id: noteId,
      newName: newNoteName.value
    })
    loadPage()
  }
  isRenaming.value = false
}

const deleteNoteHandler = async () => {
  try {
    await deleteNote({ id: noteId })
    sidebarReloadKey.value += 1
    router.push(`/folder/${folderId.value}`)
  } catch (e) {
    console.error('Error deleting note:', e)
  }
}

const moveNote = async () => {
  isMoving.value = false
  await updateNote({ id: noteId, newParentFolderId: destFolderId.value })
  loadPage()
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <NavBar />

    <!-- Main content -->
    <div class="flex flex-1">
      <SideBar :reloadKey="sidebarReloadKey" @importCompleted="loadPage"/>

      <!-- Content area -->
      <main class="flex-1 p-8">
        <div class="mb-6 text-gray-800 font-medium text-2xl">{{ notePath }}</div>

        <div class="flex justify-between mb-6">
          <div class="flex justify-center items-center">
            <RouterLink :to="`/folder/${folderId}`" class="h-full">
              <button
                @click="isRenaming = false"
                class="py-2 px-4 h-full bg-gray-500 text-white text-[1.2rem] rounded-md hover:bg-gray-600 hover:cursor-pointer"
              >
                ← Back
              </button>
            </RouterLink>
          </div>

          <div class="flex bg-gray-200 rounded-xl">
            <!-- Rename and Delete buttons (view mode) -->
            <div v-if="!isEditing" class="flex">
              <button
                class="w-14 h-14 p-2 cursor-pointer rounded-xl hover:bg-gray-300 transition"
                @click="toggleEditMode"
                title="Edit"
              >
                <img src="/edit.png" alt="" />
              </button>
              <button
                class="w-14 h-14 p-2 cursor-pointer rounded-xl hover:bg-gray-300 transition"
                @click="openRenameModal"
                title="Rename"
              >
                <img src="/rename.png" alt="" />
              </button>
              <button
                class="w-14 h-14 p-2 cursor-pointer rounded-xl hover:bg-gray-300 transition"
                @click="isMoving = true"
                title="Rename"
              >
                <img src="/cut_folder.png" alt="" />
              </button>
              <button
                class="w-14 h-14 p-2 cursor-pointer rounded-xl hover:bg-gray-300 transition"
                @click="deleteNoteHandler"
                title="Delete note"
              >
                <img src="/trash.png" alt="" />
              </button>
            </div>

            <!-- Edit and Cancel buttons (edit mode) -->
            <div v-if="isEditing" class="flex bg-gray-200 rounded-xl">
              <button
                class="w-14 h-14 p-2 cursor-pointer rounded-xl hover:bg-gray-300 transition"
                @click="saveNote"
                title="Save"
              >
                <img src="/save.png" alt="" />
              </button>
              <button
                class="w-14 h-14 p-2 cursor-pointer rounded-xl hover:bg-gray-300 transition"
                @click="cancelEdit"
                title="Cancel"
              >
                <img src="/cancel.png" alt="" />
              </button>
            </div>
          </div>
        </div>

        <!-- Note content section -->
        <div v-if="!isEditing" class="bg-white p-6 rounded-xl shadow-md h-[80%]">
          <pre class="whitespace-pre-wrap">{{ noteInfo?.content }}</pre>
          <!-- Display the content in view mode -->
        </div>
        <div v-if="isEditing" class="bg-white p-6 rounded-xl shadow-md h-[80%]">
          <textarea
            v-model="editedContent"
            class="w-full h-full border border-gray-300 rounded-md p-4 resize-none"
            placeholder="Edit your note content here..."
          ></textarea>
          <!-- Textarea for editing -->
        </div>
      </main>
    </div>

    <!-- Rename Modal -->
    <div v-if="isRenaming" class="fixed inset-0 flex justify-center items-center bg-transparent">
      <div class="bg-white p-6 rounded-2xl shadow-2xl">
        <div class="flex justify-center"><h3 class="text-xl font-semibold mb-4">Rename Note</h3></div>
        <input
          v-model="newNoteName"
          type="text"
          class="w-full p-2 border border-gray-300 rounded-md mb-4"
          placeholder="Enter new note name"
        />
        <div class="flex gap-4 justify-center">
          <button
            @click="renameNote"
            class="py-2 px-4 bg-[#06925EE6] text-white rounded-md hover:bg-[#06925E] hover:cursor-pointer transition"
          >
            Confirm
          </button>
          <button
            @click="isRenaming = false"
            class="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500 hover:cursor-pointer transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <div v-if="isMoving" class="fixed inset-0 flex justify-center items-center bg-transparent">
      <div class="bg-white p-6 rounded-2xl shadow-2xl">
        <div class="flex justify-center">
          <h3 class="text-xl font-semibold mb-4">Move this note to...</h3>
        </div>
        <select id="destination-folder" v-model="destFolderId" class="w-full p-2 border border-gray-300 rounded-md">
          <option value="" disabled selected>Select a folder</option>
          <option v-for="folder in validFolders" :key="folder.id" :value="folder.id">{{ folder.name }}</option>
        </select>
        <div class="flex gap-4 justify-center mt-3">
          <button
            @click="moveNote"
            class="py-2 px-4 bg-[#06925EE6] text-white rounded-md hover:bg-[#06925E] hover:cursor-pointer transition"
          >
            Confirm
          </button>
          <button
            @click="isMoving = false"
            class="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500 hover:cursor-pointer transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
