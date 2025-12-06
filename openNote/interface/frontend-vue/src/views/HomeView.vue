<script setup lang="ts">
import SideBar from '../components/SideBar.vue'
import { ref, onMounted } from 'vue'
import router from '../router'
import { getSessionStatus } from '../api/auth'
import { ApiError } from '../api/http'
import { createFolder, getAllFolders, type GetFolderByIdResponse } from '../api/folder'
import NavBar from '../components/NavBar.vue'

const allFoldersResponse = ref<GetFolderByIdResponse[]>()

const creatingFolder = ref(false)
const newFolderName = ref('')

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
  await reload()
})

const reload = async () => {
  allFoldersResponse.value = (await getAllFolders()).folders
    .filter((f) => !f.parentFolderId)
    .sort((f1, f2) => f1.name.localeCompare(f2.name))
}

const openFolder = (id: string) => {
  router.push(`/folder/${id}`)
}

const newFolder = async () => {
  creatingFolder.value = false
  await createFolder({ name: newFolderName.value })
  await reload()
}

</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <NavBar />

    <div class="flex flex-1">
      <SideBar @importCompleted="reload"/>

      <main class="flex-1 p-8">
        <div class="flex justify-between items-center mb-3">
          <div class="text-gray-800 font-medium text-2xl flex items-center justify-center">/root</div>
          <div class="flex justify-end gap-4">
            <button
              class="w-45 h-14 p-2 cursor-pointer rounded-xl hover:bg-gray-300 transition flex justify-center items-center gap-2"
              @click="creatingFolder = true"
            >
              <img src="/new_folder.png" alt="" class="w-14 h-14" />
              <div class="text-gray-800 font-medium flex items-center justify-center">New Folder</div>
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-6">
          <button
            v-for="folder in allFoldersResponse"
            :key="folder.id"
            class="bg-[#99D7E6] rounded-xl shadow-md h-30 w-full max-w-40 flex flex-col items-center justify-center border border-gray-200 hover:shadow-lg transition transform hover:-translate-y-0.5 hover:cursor-pointer"
            @click="openFolder(folder.id)"
          >
            <span class="text-gray-800 font-medium text-lg">{{ folder.name }}</span>
            <span class="mt-2 text-sm text-gray-500">Folder</span>
          </button>
        </div>
      </main>
    </div>

    <div v-if="creatingFolder" class="fixed inset-0 flex justify-center items-center bg-transparent">
      <div class="bg-white p-6 rounded-2xl shadow-2xl">
        <h3 class="text-xl font-semibold mb-4">Create a new folder</h3>
        <input
          v-model="newFolderName"
          type="text"
          class="w-full p-2 border border-gray-300 rounded-md mb-4"
          placeholder="Enter folder name"
        />
        <div class="flex gap-4 justify-center">
          <button
            @click="newFolder"
            class="py-2 px-4 bg-[#06925EE6] text-white rounded-md hover:bg-[#06925E] hover:cursor-pointer transition"
          >
            Confirm
          </button>
          <button
            @click="creatingFolder = false"
            class="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-500 hover:cursor-pointer transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
