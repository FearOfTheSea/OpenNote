<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getSessionStatus } from '../api/auth'
import {
  createFolder,
  deleteFolder,
  getAllFolders,
  getFolderById,
  getFolderContents,
  getFolderPath,
  updateFolder,
  type GetFolderByIdResponse
} from '../api/folder'
import { ApiError } from '../api/http'
import { createNote, type GetNoteByIdResponse } from '../api/note'
import SideBar from '../components/SideBar.vue'
import router from '../router'
import NavBar from '../components/NavBar.vue'

const sidebarReloadKey = ref(0)
const route = useRoute()
const folderId = ref(route.params.id as string)
const parentId = ref('')
const foldersResponse = ref<GetFolderByIdResponse[]>()
const notesResponse = ref<GetNoteByIdResponse[]>()
const path = ref('')

const isRenaming = ref(false)
const isCreatingFolder = ref(false)
const isCreatingNote = ref(false)
const isMovingFolder = ref(false)
const newFolderName = ref('')
const newNoteName = ref('')
const newName = ref('')
const validFolders = ref<GetFolderByIdResponse[]>()
const destFolderId = ref('')

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
  try {
    await loadFolderContents(folderId.value)
  } catch (e) {
    router.push(`/home`)
  }
})

watch(
  () => route.params.id,
  async (newFolderId) => {
    folderId.value = newFolderId as string
    await loadFolderContents(folderId.value)
  }
)

const loadFolderContents = async (folderId: string) => {
  const folderContents = await getFolderContents({ folderId: folderId })
  foldersResponse.value = folderContents.folders.sort((f1, f2) => f1.name.localeCompare(f2.name))
  notesResponse.value = folderContents.notes.sort((n1, n2) => n1.name.localeCompare(n2.name))
  path.value = await getFolderPath(folderId)
  parentId.value = (await getFolderById({ id: folderId })).parentFolderId || ''
  newFolderName.value = ''
  await loadValidFolders()
}

const openFolder = (id: string) => {
  router.push(`/folder/${id}`)
}

const openNote = (id: string) => {
  router.push(`/note/${id}`)
}

const createNewFolder = async () => {
  isCreatingFolder.value = false
  await createFolder({ name: newFolderName.value, parentFolderId: folderId.value })
  await loadFolderContents(folderId.value)
}

const createNewNote = async () => {
  isCreatingNote.value = false
  await createNote({ name: newNoteName.value, parentFolderId: folderId.value })
  await loadFolderContents(folderId.value)
}

const deleteCurrentFolder = async () => {
  try {
    await deleteFolder({ id: folderId.value })
    sidebarReloadKey.value += 1
  } catch (e) {
  } finally {
    if (parentId) {
      router.push(`/folder/${parentId.value}`)
    } else {
      router.push(`/home`)
    }
  }
}

const renameFolder = async () => {
  isRenaming.value = false
  const tempName = newName.value
  newName.value = ''
  await updateFolder({ id: folderId.value, newName: tempName })
  await loadFolderContents(folderId.value)
}

const getDescendants = async (folderId: string): Promise<Set<string>> => {
  const descendants = new Set<string>()
  const getChildren = async (id: string) => {
    const { folders } = await getFolderContents({ folderId: id })
    for (const folder of folders) {
      descendants.add(folder.id)
      await getChildren(folder.id)
    }
  }
  await getChildren(folderId)
  return descendants
}
const loadValidFolders = async () => {
  const allFolders = await getAllFolders()
  const descendants = await getDescendants(folderId.value)
  validFolders.value = allFolders.folders.filter((folder) => {
    return folder.id !== folderId.value && folder.id !== parentId.value && !descendants.has(folder.id)
  })
}
const moveFolder = async () => {
  isMovingFolder.value = false
  console.log(`Moving folder ${folderId.value} to ${destFolderId.value}`)
  await updateFolder({ id: folderId.value, newParentFolderId: destFolderId.value })
  await loadFolderContents(folderId.value)
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <NavBar />

    <div class="flex flex-1">
      <SideBar :reloadKey="sidebarReloadKey" @importCompleted="loadFolderContents"/>

      <main class="flex-1 p-8">
        <div class="flex justify-between">
          <div class="mb-6 text-gray-800 font-medium text-2xl">{{ path }}</div>
        </div>

        <div class="flex justify-between mb-6">
          <div class="flex justify-center items-center">
            <RouterLink :to="parentId ? `/folder/${parentId}` : `/home`" class="h-full">
              <button
                class="h-full py-2 px-4 bg-gray-500 text-white text-[1.2rem] rounded-md hover:bg-gray-600 hover:cursor-pointer"
              >
                ← Back
              </button>
            </RouterLink>
          </div>
          <div class="flex justify-center items-center bg-gray-200 rounded-xl">
            <button
              class="w-14 h-14 p-2 cursor-pointer rounded-xl hover:bg-gray-300 transition"
              @click="isRenaming = true"
              title="Rename"
            >
              <img src="/rename.png" alt="" />
            </button>
            <button
              class="w-14 h-14 p-2 cursor-pointer rounded-xl hover:bg-gray-300 transition"
              @click="isMovingFolder = true"
              title="Move"
            >
              <img src="/cut_folder.png" alt="" />
            </button>
            <button
              class="w-14 h-14 p-2 cursor-pointer rounded-xl hover:bg-gray-300 transition"
              @click="isCreatingFolder = true"
              title="New folder"
            >
              <img src="/new_folder.png" alt="" />
            </button>
            <button
              class="w-14 h-14 p-2 cursor-pointer rounded-xl hover:bg-gray-300 transition"
              @click="isCreatingNote = true"
              title="New note"
            >
              <img src="/new_file.png" alt="" />
            </button>
            <button
              class="w-14 h-14 p-2 cursor-pointer rounded-xl hover:bg-gray-300 transition"
              @click="deleteCurrentFolder"
              title="Delete this folder"
            >
              <img src="/trash.png" alt="" />
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-6">
          <button
            v-for="folder in foldersResponse"
            :key="folder.id"
            class="bg-[#99D7E6] rounded-xl shadow-md h-30 w-full max-w-40 flex flex-col items-center justify-center border border-gray-200 hover:shadow-lg transition transform hover:-translate-y-0.5 hover:cursor-pointer"
            @click="openFolder(folder.id)"
          >
            <span class="text-gray-800 font-medium text-lg">{{ folder.name }}</span>
            <span class="mt-2 text-sm text-gray-500">Folder</span>
          </button>

          <button
            v-for="note in notesResponse"
            :key="note.id"
            class="bg-[#FFCE9B] rounded-xl shadow-md h-30 w-full max-w-40 flex flex-col items-center justify-center border border-gray-200 hover:shadow-lg transition transform hover:-translate-y-0.5 hover:cursor-pointer"
            @click="openNote(note.id)"
          >
            <span class="text-gray-800 font-medium text-lg">{{ note.name }}</span>
            <span class="mt-2 text-sm text-gray-500">Note</span>
          </button>
        </div>
      </main>
    </div>

    <div v-if="isCreatingFolder" class="fixed inset-0 flex justify-center items-center bg-transparent">
      <div class="bg-white p-6 rounded-2xl shadow-2xl">
        <div class="flex justify-center">
          <h3 class="text-xl font-semibold mb-4">Create a new folder</h3>
        </div>
        <input
          v-model="newFolderName"
          type="text"
          class="w-full p-2 border border-gray-300 rounded-md mb-4"
          placeholder="Enter folder name"
        />
        <div class="flex gap-4 justify-center">
          <button
            @click="createNewFolder"
            class="py-2 px-4 bg-[#06925EE6] text-white rounded-md hover:bg-[#06925E] hover:cursor-pointer transition"
          >
            Confirm
          </button>
          <button
            @click="isCreatingFolder = false"
            class="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500 hover:cursor-pointer transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <div v-if="isRenaming" class="fixed inset-0 flex justify-center items-center bg-transparent">
      <div class="bg-white p-6 rounded-2xl shadow-2xl">
        <div class="flex justify-center">
          <h3 class="text-xl font-semibold mb-4">Rename this folder</h3>
        </div>
        <input
          v-model="newName"
          type="text"
          class="w-full p-2 border border-gray-300 rounded-md mb-4"
          placeholder="Enter folder name"
        />
        <div class="flex gap-4 justify-center">
          <button
            @click="renameFolder"
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

    <div v-if="isCreatingNote" class="fixed inset-0 flex justify-center items-center bg-transparent">
      <div class="bg-white p-6 rounded-2xl shadow-2xl">
        <div class="flex justify-center">
          <h3 class="text-xl font-semibold mb-4">Create a new note</h3>
        </div>
        <input
          v-model="newNoteName"
          type="text"
          class="w-full p-2 border border-gray-300 rounded-md mb-4"
          placeholder="Enter folder name"
        />
        <div class="flex gap-4 justify-center">
          <button
            @click="createNewNote"
            class="py-2 px-4 bg-[#06925EE6] text-white rounded-md hover:bg-[#06925E] hover:cursor-pointer transition"
          >
            Confirm
          </button>
          <button
            @click="isCreatingNote = false"
            class="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500 hover:cursor-pointer transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <div v-if="isMovingFolder" class="fixed inset-0 flex justify-center items-center bg-transparent">
      <div class="bg-white p-6 rounded-2xl shadow-2xl">
        <div class="flex justify-center">
          <h3 class="text-xl font-semibold mb-4">Move this folder</h3>
        </div>
        <select id="destination-folder" v-model="destFolderId" class="w-full p-2 border border-gray-300 rounded-md">
          <option value="" disabled selected>Select a folder</option>
          <option v-if="parentId" value="">/Root</option>
          <option v-for="folder in validFolders" :key="folder.id" :value="folder.id">{{ folder.name }}</option>
        </select>
        <div class="flex gap-4 justify-center mt-3">
          <button
            @click="moveFolder"
            class="py-2 px-4 bg-[#06925EE6] text-white rounded-md hover:bg-[#06925E] hover:cursor-pointer transition"
          >
            Confirm
          </button>
          <button
            @click="isMovingFolder = false"
            class="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500 hover:cursor-pointer transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
