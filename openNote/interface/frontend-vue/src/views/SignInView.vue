<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { signIn, getSessionStatus } from '../api/auth'
import router from '../router'
import { ApiError } from '../api/http'

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const me = await getSessionStatus()
    if (me.logged_in) {
      router.push('/home')
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      router.push('/signin')
    }
  }
})

const onSubmit = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await signIn({
      email: email.value,
      password: password.value
    })
    router.push('/home')
  } catch (err) {
    console.error('Sign in error:', err)
    errorMessage.value = 'Sign in failed, please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="w-full max-w-md bg-white rounded-xl shadow-md px-8 py-10">
      <div class="flex justify-center mb-4">
        <img src="/favicon.png" alt="Website logo" class="h-16 w-16" />
      </div>
      <h1 class="text-2xl font-semibold text-gray-800 mb-6 text-center">Sign in to your account</h1>

      <form class="space-y-5" @submit.prevent="onSubmit">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"> Email </label>
          <input
            v-model="email"
            type="email"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4059ADE6] focus:border-[#4059ADE6] transition"
            placeholder="user@example.com"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"> Password </label>
          <input
            v-model="password"
            type="password"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4059ADE6] focus:border-[#4059ADE6] transition"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          class="w-full py-2.5 mt-2 rounded-lg bg-[#4059ADE6] text-white font-medium hover:bg-[#4059AD] transition hover:cursor-pointer disabled:opacity-60"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>

        <p v-if="errorMessage" class="mt-3 text-sm text-red-600 text-center">
          {{ errorMessage }}
        </p>
      </form>

      <div class="flex justify-center">
        <RouterLink to="/signup" class="mt-5 mb-0 pb-0 w-fit">
          <p class="text-center w-fit text-gray-500 hover:text-[#4059AD] transition mb-0 pb-0">
            Don't have an account? Sign up
          </p>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
