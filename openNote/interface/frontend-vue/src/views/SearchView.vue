<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ApiError } from '../api/http'
import { searchFolders, type GetFolderByIdResponse } from '../api/folder'
import { searchNotes, type GetNoteByIdResponse } from '../api/note'
import router from '../router'
import { getSessionStatus } from '../api/auth'
import NavBar from '../components/NavBar.vue'
import SideBar from '../components/SideBar.vue'

const route = useRoute()
const searchQuery = ref('')
const foldersResponse = ref<GetFolderByIdResponse[]>([])
const notesResponse = ref<GetNoteByIdResponse[]>([])
const path = ref('')
const keyword = ref('')

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
  initPage()
})

const initPage = async () => {
  keyword.value = route.query.q as string
  if (!keyword.value) {
    router.push('/home')
  }
  if (keyword.value) {
    loadSearchResults(keyword.value)
  }
  searchQuery.value = keyword.value
}

watch(
  () => route.query.q,
  async () => {
    await initPage()
  }
)

const loadSearchResults = async (query: string) => {
  try {
    foldersResponse.value = (await searchFolders({ keyword: keyword.value })).folders
    notesResponse.value = (await searchNotes({ keyword: keyword.value })).notes
    path.value = `Showing ${foldersResponse.value.length + notesResponse.value.length} search results for "${query}"`
  } catch (e) {
    console.error('Error fetching search results:', e)
  }
}

const openFolder = (id: string) => {
  router.push(`/folder/${id}`)
}

const openNote = (id: string) => {
  router.push(`/note/${id}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <NavBar />

    <!-- Main content -->
    <div class="flex flex-1">
      <SideBar @importCompleted="initPage"/>

      <!-- Content area -->
      <main class="flex-1 p-8">
        <div class="flex justify-between">
          <div class="mb-6 text-gray-800 font-medium text-2xl">{{ path }}</div>
        </div>

        <div class="flex flex-wrap gap-6">
          <!-- Display folders if any search results -->
          <div v-if="foldersResponse.length" class="w-full">
            <h3 class="text-lg font-medium mb-4">Folders</h3>
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
            </div>
          </div>

          <!-- Display notes if any search results -->
          <div v-if="notesResponse.length" class="w-full">
            <h3 class="text-lg font-medium mb-4">Notes</h3>
            <div class="flex flex-wrap gap-6">
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
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
