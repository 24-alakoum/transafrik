import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DRIVER_STATUSES } from '@/lib/constants'
import { Plus, Phone, Mail } from 'lucide-react'
import { decrypt } from '@/lib/encryption'

export default async function ChauffeursPage() {
  const supabase = await createClient()
  const { data: drivers } = await supabase.from('drivers').select('*, trucks(plate)').order('created_at', { ascending: false })

  // Décryptage côté serveur pour affichage
  const decryptedDrivers = await Promise.all((drivers || []).map(async (driver) => {
    return {
      ...driver,
      license_number: driver.license_number ? await decrypt(driver.license_number).catch(() => 'Erreur') : null,
      national_id: driver.national_id ? await decrypt(driver.national_id).catch(() => 'Erreur') : null,
    }
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Chauffeurs</h1>
          <p className="text-text-secondary mt-1">Gérez votre équipe de conducteurs.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Ajouter un chauffeur
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {decryptedDrivers.map((driver) => {
          const statusInfo = DRIVER_STATUSES[driver.status as keyof typeof DRIVER_STATUSES]
          return (
            <div key={driver.id} className="bg-bg-card rounded-2xl border border-border-base shadow-sm p-5 hover:border-border-active transition-colors">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-lg">
                  {driver.full_name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-syne font-bold text-text-primary">{driver.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={statusInfo.color as any} className="text-[10px] px-1.5 py-0.5">{statusInfo.label}</Badge>
                    {driver.trucks && (
                      <span className="text-xs text-text-secondary font-medium px-2 py-0.5 bg-bg-raised rounded">
                        {driver.trucks.plate}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center gap-3 text-sm text-text-secondary">
                  <Phone className="w-4 h-4" />
                  <span>{driver.phone}</span>
                </div>
                {driver.email && (
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <Mail className="w-4 h-4" />
                    <span>{driver.email}</span>
                  </div>
                )}
                <div className="pt-3 mt-3 border-t border-border-base flex justify-between text-sm">
                  <span className="text-text-secondary">Permis</span>
                  <span className="font-mono text-text-primary">{driver.license_number ? '••••' + driver.license_number.slice(-4) : '-'}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
