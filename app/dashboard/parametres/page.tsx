import { createClient } from '@/lib/supabase/server'
import { Shield, Bell, FileText, Lock, Building2 } from 'lucide-react'
import Link from 'next/link'

export default async function ParametresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const tabs = [
    { name: 'Entreprise', icon: Building2, href: '#entreprise', description: 'Informations, logo, et mentions' },
    { name: 'Facturation', icon: FileText, href: '/dashboard/parametres/facturation', description: 'Gérez votre abonnement Stripe' },
    { name: 'Sécurité & 2FA', icon: Lock, href: '#securite', description: 'Mot de passe, TOTP, Sessions actives' },
    { name: 'Notifications', icon: Bell, href: '#notifications', description: 'Préférences d\'emails et alertes' },
    { name: 'Données (RGPD)', icon: Shield, href: '/dashboard/rgpd', description: 'Confidentialité, Exports, Suppressions' },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-syne font-bold text-text-primary">Paramètres</h1>
        <p className="text-text-secondary mt-1">Configurez votre compte et votre entreprise.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tabs.map((tab) => (
          <Link href={tab.href} key={tab.name}>
            <div className="bg-bg-card rounded-xl border border-border-base shadow-sm p-5 hover:border-accent hover:bg-bg-raised transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-bg-surface flex items-center justify-center text-text-secondary group-hover:text-accent transition-colors border border-border-base">
                  <tab.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-syne font-semibold text-lg text-text-primary">{tab.name}</h3>
                  <p className="text-sm text-text-secondary">{tab.description}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Formulaire simplifié Entreprise pour l'exemple */}
      <div id="entreprise" className="bg-bg-card rounded-2xl border border-border-base p-6 mt-8">
        <h2 className="text-lg font-syne font-semibold text-text-primary mb-6">Profil de l'entreprise</h2>
        <div className="space-y-4 max-w-lg">
          <div className="form-control">
            <label className="label"><span className="label-text text-text-secondary">Logo (Upload vers bucket 'logos')</span></label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-bg-raised border border-border-base flex items-center justify-center">
                 <Building2 className="text-text-muted w-6 h-6" />
              </div>
              <button className="btn btn-outline btn-sm">Changer le logo</button>
            </div>
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text text-text-secondary">Nom de l'entreprise</span></label>
            <input type="text" className="input input-bordered bg-bg-surface border-border-base w-full" defaultValue="TransAfrik SA" />
          </div>
          <button className="btn btn-primary mt-2">Sauvegarder</button>
        </div>
      </div>
    </div>
  )
}
