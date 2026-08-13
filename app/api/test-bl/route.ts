import { createBLAction } from '@/app/dashboard/connaissements/actions'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const formData = {
      reference: 'TEST-BL-' + Date.now(),
      vessel_name: 'TEST VESSEL',
      port_of_discharge: 'TEST PORT',
      is_external: true, // "BL Tiers"
      containers: [
        {
          container_number: 'TEST1234567',
          type: "20'DC",
          status: 'en_cours',
          weight_kg: '24000',
          cargo_description: 'Test cargo'
        }
      ]
    }

    const res = await createBLAction(formData)
    return NextResponse.json(res)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
