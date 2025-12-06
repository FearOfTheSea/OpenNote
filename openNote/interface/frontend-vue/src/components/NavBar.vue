<script setup lang="ts">
import { ref } from 'vue'
import { signOut } from '../api/auth'
import router from '../router'

const searchQuery = ref('')

const goHome = () => {
  router.push('/home')
}

const handleLogout = async () => {
  try {
    await signOut()
    document.cookie = 'connect.sid=; Max-Age=0; path=/;'
    router.push('/signin')
  } catch (e) {
    console.error('Logout failed:', e)
  }
}

const handleSearch = async () => {
  if (searchQuery.value) {
    router.push(`/search?q=${searchQuery.value}`)
  }
}
</script>

<template>
  <header
    class="relative z-10 flex items-center justify-start px-6 py-4 bg-white shadow-[0_4px_6px_-4px_rgba(0,0,0,0.15)]"
  >
    <button class="h-16 w-16 min-h-16 min-w-16 flex items-center justify-center cursor-pointer" @click="goHome">
      <img src="/favicon.png" alt="App Icon" class="h-12 w-12" />
    </button>

    <div class="min-w-35 max-w-35"></div>

    <div class="flex justify-between w-full gap-20">
      <div class="min-w-100 max-w-100 bg-gray-100 rounded-full px-4 py-2 flex items-center border border-gray-300">
        <span class="mr-2">
          <svg class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18.5a7.5 7.5 0 006.15-3.85z"
            />
          </svg>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search..."
          class="flex-1 bg-transparent outline-none text-[1rem] min-w-100 max-w-100"
          @keydown.enter="handleSearch"
        />
      </div>

      <button
        class="h-12 w-28 min-h-12 min-w-28 rounded-full border border-gray-300 flex items-center justify-center bg-[#06925EE6] text-white font-medium hover:bg-[#06925E] hover:cursor-pointer transition"
        @click="handleLogout"
      >
        Logout
      </button>
    </div>
  </header>
</template>
