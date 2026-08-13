const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('Testing connection...')
  
  // Login as a user if needed, but we don't have password.
  // Actually, we can use the service_role key to bypass RLS, or anon key and try to read.
  const { data: companies, error: compErr } = await supabase.from('companies').select('*').limit(1)
  console.log('Companies fetch:', companies, compErr)

  // Try to describe the containers table columns
  // We can't do this easily with anon key, but we can query an invalid column to see the error
  const { error: invalidColErr } = await supabase.from('containers').select('id, bl_id, company_id, container_number, type, seal_number, cargo_description, weight_kg, status, pickup_date, return_date').limit(1)
  console.log('Containers fetch error if any column missing:', invalidColErr)
}

run()
