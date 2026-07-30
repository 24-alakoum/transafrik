import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { decrypt } from '@/lib/encryption'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DRIVER_STATUSES } from '@/lib/constants'
import { ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, CreditCard, ShieldAlert, Truck, User } from 'lucide-react'
import Link from 'next/link'

export default async function ChauffeurDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: driver, error } = (await supabase
    .from('drivers')
    .select('*, trucks(*)')
    .eq('id', resolvedParams.id)
    .single()) as any

  if (error || !driver) {
    notFound()
  }

  // Décryptage côté serveur
  const decryptedDriver = {
    ...driver,
    license_number: driver.license_number ? await decrypt(driver.license_number).catch(() => 'Erreur') : null,
    national_id: driver.national_id ? await decrypt(driver.national_id).catch(() => 'Erreur') : null,
  }

  const statusInfo = DRIVER_STATUSES[driver.status as keyof typeof DRIVER_STATUSES] || { label: driver.status || 'Inconnu', color: 'default' }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/chauffeurs">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">{decryptedDriver.full_name}</h1>
            <p className="text-text-secondary mt-1">Détails du chauffeur</p>
          </div>
        </div>
        <Link href={`/dashboard/chauffeurs/${driver.id}/editer`}>
          <Button variant="outline" className="border-border-base hover:border-border-active">
            <Edit className="w-4 h-4 mr-2" /> Modifier le profil
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne Gauche - Statut & Info de base */}
        <div className="md:col-span-1 bg-bg-card rounded-2xl border border-border-base p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-3xl mb-4">
            {decryptedDriver.full_name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-syne font-bold text-text-primary">{decryptedDriver.full_name}</h2>
          <div className="mt-3">
            <Badge variant={statusInfo.color as any} className="px-3 py-1 text-xs">
              {statusInfo.label}
            </Badge>
          </div>

          <div className="w-full border-t border-border-base mt-6 pt-6 space-y-4 text-left">
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <Phone className="w-4 h-4 text-text-muted shrink-0" />
              <span>{decryptedDriver.phone}</span>
            </div>
            {decryptedDriver.email && (
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <Mail className="w-4 h-4 text-text-muted shrink-0" />
                <span className="truncate">{decryptedDriver.email}</span>
              </div>
            )}
            {(decryptedDriver.address || decryptedDriver.city) && (
              <div className="flex items-center gap-3 text-sm text-text-secondary">
                <MapPin className="w-4 h-4 text-text-muted shrink-0" />
                <span>
                  {[decryptedDriver.address, decryptedDriver.city, decryptedDriver.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Colonne Droite - Informations administratives */}
        <div className="md:col-span-2 space-y-6">
          {/* Section Identité & Permis */}
          <div className="bg-bg-card rounded-2xl border border-border-base p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-syne font-bold text-text-primary flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent" />
              Documents officiels
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Numéro de Permis</span>
                <span className="font-mono text-base text-text-primary mt-1 block">
                  {decryptedDriver.license_number || 'Non renseigné'}
                </span>
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Expiration du Permis</span>
                <span className="text-base text-text-primary mt-1 block">
                  {decryptedDriver.license_expiry ? new Date(decryptedDriver.license_expiry).toLocaleDateString('fr-FR') : 'Non renseignée'}
                </span>
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Pièce d'identité</span>
                <span className="font-mono text-base text-text-primary mt-1 block">
                  {decryptedDriver.national_id || 'Non renseigné'}
                </span>
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Date de naissance</span>
                <span className="text-base text-text-primary mt-1 block">
                  {decryptedDriver.birth_date ? new Date(decryptedDriver.birth_date).toLocaleDateString('fr-FR') : 'Non renseignée'}
                </span>
              </div>
            </div>
          </div>

          {/* Section Véhicule & Contrat */}
          <div className="bg-bg-card rounded-2xl border border-border-base p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-syne font-bold text-text-primary flex items-center gap-2">
              <Truck className="w-5 h-5 text-accent" />
              Véhicule & Contrat
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Véhicule assigné</span>
                {decryptedDriver.trucks ? (
                  <Link href={`/dashboard/camions/${decryptedDriver.trucks.id}`} className="inline-flex items-center gap-2 text-accent hover:underline mt-1">
                    <Truck className="w-4 h-4" />
                    <span>{decryptedDriver.trucks.plate} - {decryptedDriver.trucks.brand}</span>
                  </Link>
                ) : (
                  <span className="text-base text-text-muted mt-1 block">Aucun véhicule assigné</span>
                )}
              </div>
              <div>
                <span className="text-xs text-text-secondary uppercase tracking-wider block">Salaire Mensuel</span>
                <span className="text-base font-semibold text-text-primary mt-1 block">
                  {decryptedDriver.monthly_salary ? `${decryptedDriver.monthly_salary.toLocaleString('fr-FR')} FCFA` : 'Non renseigné'}
                </span>
              </div>
            </div>
          </div>

          {/* Section Sécurité & Contact d'Urgence */}
          {decryptedDriver.emergency_contact && (
            <div className="bg-bg-card rounded-2xl border border-border-base p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-syne font-bold text-danger flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-danger" />
                Contact d'urgence
              </h3>
              <div className="bg-danger/5 border border-danger/10 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center font-bold">
                  SOS
                </div>
                <div>
                  <p className="text-text-primary font-medium">{decryptedDriver.emergency_contact}</p>
                  <p className="text-xs text-text-secondary">Contacter immédiatement en cas d'accident ou d'incident majeur.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
