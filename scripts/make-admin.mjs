// Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/make-admin.mjs
// Optional ADMIN_EMAIL and ADMIN_FULL_NAME override the defaults.
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const SERVICE_ROLE = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? 'admin@belapop.com').trim()
const ADMIN_FULL_NAME = (process.env.ADMIN_FULL_NAME ?? 'Curadoria BelaPop').trim()

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
})

const PER_PAGE = 200

async function findUserByEmail(email) {
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    })

    if (error) {
      throw error
    }

    const users = data.users ?? []
    const match = users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
    if (match) {
      return match
    }

    if (users.length < PER_PAGE) {
      break
    }

    page += 1
  }

  return null
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

async function run() {
  const user = await findUserByEmail(ADMIN_EMAIL)
  if (!user) {
    fail(`User not found in auth: ${ADMIN_EMAIL}`)
  }

  const { error, data: profile } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        role: 'admin',
        full_name: ADMIN_FULL_NAME,
      },
      { onConflict: 'id' }
    )
    .select()

  if (error) {
    throw error
  }

  console.log('Admin configured successfully')
  console.log('Email:', ADMIN_EMAIL)
  console.log('UID:', user.id)
  console.log('Profile:', profile)
}

run().catch((error) => {
  console.error('Failed:', error?.message ?? 'Unknown error')
  if (error && typeof error === 'object' && 'details' in error && error.details) {
    console.error('Details:', error.details)
  }
  process.exit(1)
})
