<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ApiError } from '../api/http'
import { getAllNotes, type GetNoteByIdResponse } from '../api/note'
import router from '../router'
import { getSessionStatus } from '../api/auth'
import NavBar from '../components/NavBar.vue'
import SideBar from '../components/SideBar.vue'
import { getAllTags } from '../api/tag'

const route = useRoute()
const searchQuery = ref('')
const tagIds = ref<string[]>()
const notesResponse = ref<GetNoteByIdResponse[]>([])
const path = ref('')

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

watch(
  () => route.query.tags,
  async () => {
    await initPage()
  }
)

const initPage = async () => {
  searchQuery.value = route.query.tags as string
  if (!searchQuery.value) {
    router.push('/home')
  }
  if (searchQuery.value) {
    loadFilteredNotes()
  }
  searchQuery.value = searchQuery.value
  tagIds.value = searchQuery.value.split(',')
}

watch(
  () => route.query.q,
  async () => {
    await initPage()
  }
)

const loadFilteredNotes = async () => {
  try {
    notesResponse.value = (await getAllNotes({ tagIds: searchQuery.value })).notes
    const allTags = await getAllTags()
    const tagNames: string[] = []
    if (tagIds.value) {
      for (const id of tagIds.value) {
        const name = allTags.find((t) => t.id === id)?.name as string
        tagNames.push(name)
      }
    }

    path.value = `Showing ${notesResponse.value.length} notes with tags: ${tagNames.sort((t1, t2) => t1.localeCompare(t2)).join(', ')}`
  } catch (e) {
    console.error('Error fetching search results:', e)
  }
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
      <SideBar @importCompleted="initPage" />

      <!-- Content area -->
      <main class="flex-1 p-8">
        <div class="flex justify-between">
          <div class="mb-6 text-gray-800 font-medium text-2xl">{{ path }}</div>
        </div>

        <div class="flex flex-wrap gap-6">
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
