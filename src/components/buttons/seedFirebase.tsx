import { seedFirestore } from '@/services/seedFirestore'

export default function SeedFirebaseButton() {
  return (
    <button
      onClick={seedFirestore}
      className="w-full max-w-44 py-2 px-4 text-white font-medium text-sm group flex flex-row items-center justify-center gap-2 bg-primary-200 hover:bg-primary-300 rounded-full"
    >
      Seed Firestore
    </button>
  )
}
