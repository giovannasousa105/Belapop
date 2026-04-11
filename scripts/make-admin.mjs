// Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/make-admin.mjs
// Optional ADMIN_EMAIL, ADMIN_FULL_NAME, ADMIN_ROLES (csv) and ACTIVE_ROLE override defaults.
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
const ADMIN_ROLES = (process.env.ADMIN_ROLES ?? 'admin').split(',').map((role) => role.trim().toLowerCase()).filter(Boolean)
const ACTIVE_ROLE = (process.env.ACTIVE_ROLE ?? 'admin').trim().toLowerCase()
const VALID_ROLES = new Set(['customer', 'seller', 'admin'])

function isMissingMembershipTable(error) {
  const code = (error?.code ?? '').toString()
  const message = (error?.message ?? '').toString().toLowerCase()
  return code === '42P01' || code === 'PGRST205' || message.includes('user_role_memberships')
}

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

  const roles = Array.from(new Set(ADMIN_ROLES.filter((role) => VALID_ROLES.has(role))))
  if (!roles.length) {
    fail('ADMIN_ROLES does not contain valid roles.')
  }
  if (!VALID_ROLES.has(ACTIVE_ROLE)) {
    fail('ACTIVE_ROLE must be one of: customer,seller,admin')
  }
  if (!roles.includes(ACTIVE_ROLE)) {
    roles.push(ACTIVE_ROLE)
  }

  const { error, data: profile } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name: ADMIN_FULL_NAME,
      },
      { onConflict: 'id' }
    )
    .select()

  if (error) {
    throw error
  }

  const membershipUpsert = await supabase
    .from('user_role_memberships')
    .upsert(
      roles.map((role) => ({
        user_id: user.id,
        role,
        source: 'script-make-admin'
      })),
      { onConflict: 'user_id,role' }
    )
  if (membershipUpsert.error && !isMissingMembershipTable(membershipUpsert.error)) {
    throw membershipUpsert.error
  }

  if (roles.includes('admin')) {
    const metadataUpdate = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        role: 'admin'
      }
    })
    if (metadataUpdate.error) {
      throw metadataUpdate.error
    }
  }

  const activeRoleUpsert = await supabase
    .from('user_roles')
    .upsert(
      {
        user_id: user.id,
        role: ACTIVE_ROLE
      },
      { onConflict: 'user_id' }
    )
  if (activeRoleUpsert.error) {
    throw activeRoleUpsert.error
  }

  console.log('Roles configured successfully')
  console.log('Email:', ADMIN_EMAIL)
  console.log('UID:', user.id)
  console.log('Roles:', roles.join(', '))
  console.log('Active role:', ACTIVE_ROLE)
  console.log('Profile:', profile)
}

run().catch((error) => {
  console.error('Failed:', error?.message ?? 'Unknown error')
  if (error && typeof error === 'object' && 'details' in error && error.details) {
    console.error('Details:', error.details)
  }
  process.exit(1)
})
