import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import packageJson from '../../../package.json'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test simple query to check DB connection
    const { error } = await supabase.from('users').select('id').limit(1)
    
    const isDbConnected = !error

    return NextResponse.json({
      status: 'ok',
      version: packageJson.version,
      timestamp: new Date().toISOString(),
      supabase: isDbConnected ? 'connected' : 'error'
    }, { status: isDbConnected ? 200 : 503 })
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      version: packageJson.version,
      timestamp: new Date().toISOString(),
      supabase: 'disconnected'
    }, { status: 500 })
  }
}
