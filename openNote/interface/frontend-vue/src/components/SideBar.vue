<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { checkJobStatus, downloadData, exportData, importData } from '../api/backup'
import { getAllTags, type TagViewObject } from '../api/tag'
import router from '../router'
import { useRoute } from 'vue-router'

const emit = defineEmits(['importCompleted'])
const props = defineProps({
  reloadKey: {
    type: Number,
    required: false
  }
})

const tags = ref<TagViewObject[]>()
const selectedTags = ref<string[]>([])
const toastMessage = ref('')
const toastVisible = ref(false)

const route = useRoute()

watch(
  () => props.reloadKey,
  async () => {
    tags.value = (await getAllTags()).sort((t1, t2) => t1.name.localeCompare(t2.name))
  }
)

watch(
  () => selectedTags.value,
  async () => {
    router.push(`/notes?tags=${selectedTags.value.join(',')}`)
  }
)

onMounted(async () => {
  tags.value = (await getAllTags()).sort((t1, t2) => t1.name.localeCompare(t2.name))
  const idsInQuery = route.query.tags as string
  if (idsInQuery) {
    const ids = idsInQuery.split(',')
    selectedTags.value.push(...ids)
  }
})

const showToast = (message: string) => {
  toastMessage.value = message
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 5000)
}

const handleExport = async () => {
  const res = await exportData()
  if (res.success) {
    showToast('Export initialized, please wait...')
  }

  const pollInterval = 500
  let status = 'PENDING'
  const intervalId = setInterval(async () => {
    status = (await checkJobStatus(res.jobId)).status

    if (status === 'COMPLETED') {
      clearInterval(intervalId)
      const userdata = await downloadData(res.jobId)
      console.log(userdata.userId)

      const userdataJson = JSON.stringify(userdata, null, 2)

      const blob = new Blob([userdataJson], { type: 'application/json' })

      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'userdata.json'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      showToast('Export completed successfully!')
    } else {
      console.log(`job status: ${status}`)
    }
  }, pollInterval)
}

const handleImport = async () => {
  const inputElement = document.createElement('input')
  inputElement.type = 'file'
  inputElement.accept = '.json'
  inputElement.click()
  inputElement.addEventListener('change', async (event) => {
    const target = event.target as HTMLInputElement
    const file = target.files ? target.files[0] : null

    if (!file) {
      console.error('No file selected')
      return
    }

    const reader = new FileReader()

    reader.onload = async () => {
      try {
        if (typeof reader.result === 'string') {
          const userData = JSON.parse(reader.result)
          if (userData.version && userData.timestamp && userData.userId && userData.data) {
            const res = await importData(userData)
            if (res.success) {
              showToast('Import initialized, please wait...')
            }

            const pollInterval = 100
            let status = 'PENDING'
            const intervalId = setInterval(async () => {
              status = (await checkJobStatus(res.jobId)).status

              if (status === 'COMPLETED') {
                clearInterval(intervalId)
                showToast('Import completed successfully!')
                emit('importCompleted')
              } else {
                console.log(`job status: ${status}`)
              }
            }, pollInterval)
          } else {
            console.error('Invalid user data structure')
          }
        } else {
          console.error('File content is not a valid JSON string')
        }
      } catch (error) {
        console.error('Error reading or parsing the file:', error)
      }
    }
    reader.readAsText(file)
  })
  tags.value = (await getAllTags()).sort((t1, t2) => t1.name.localeCompare(t2.name))
}

const beforeEnter = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.opacity = '0'
  htmlEl.style.transform = 'translateY(20px)'
}

const enter = (el: Element, done: () => void) => {
  const htmlEl = el as HTMLElement
  htmlEl.offsetHeight
  htmlEl.style.transition = 'all 0.5s ease'
  htmlEl.style.opacity = '1'
  htmlEl.style.transform = 'translateY(0)'
  done()
}

const leave = (el: Element, done: () => void) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = 'all 0.5s ease'
  htmlEl.style.opacity = '0'
  htmlEl.style.transform = 'translateY(20px)'
  done()
}
</script>

<template>
  <aside class="w-56 bg-white shadow-[4px_0_6px_-4px_rgba(0,0,0,0.15)] px-6 py-6 flex flex-col justify-between">
    <div class="flex flex-col">
      <h2 class="text-[1.5rem] font-semibold mb-4">Tags</h2>
      <ul class="space-y-2 text-[1.2rem]">
        <li v-for="tag in tags" :key="tag.name" class="text-gray-700">
          <label class="flex items-center space-x-2 cursor-pointer select-none">
            <input type="checkbox" :value="tag.id" v-model="selectedTags" />
            <span>{{ tag.name }}</span>
          </label>
        </li>
      </ul>
    </div>

    <div class="flex flex-col gap-4 items-center">
      <button
        class="transition font-medium rounded-2xl bg-gray-200 hover:bg-gray-300 hover:cursor-pointer py-2 px-5 w-fit text-[1rem]"
        @click="handleExport"
      >
        Export
      </button>
      <button
        class="transition font-medium rounded-2xl bg-gray-200 hover:bg-gray-300 hover:cursor-pointer py-2 px-5 w-fit text-[1rem]"
        @click="handleImport"
      >
        Import
      </button>
    </div>
  </aside>

  <transition name="toast" @before-enter="beforeEnter" @enter="enter" @leave="leave">
    <div
      v-if="toastVisible"
      @click="toastVisible = false"
      class="hover:cursor-pointer fixed bottom-4 right-4 bg-white text-gray-800 text-[1.4rem] shadow-2xl py-4 px-6 rounded-md"
      style="z-index: 1000"
    >
      {{ toastMessage }}
    </div>
  </transition>
</template>
