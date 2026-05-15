import Link from 'next/link'
import { ArrowRight, Truck, BarChart3, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatFCFA } from '@/lib/utils'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-accent/30">
      {/* Navigation (simplified for landing) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg-base/80 backdrop-blur-md border-b border-border-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-8 h-8 text-accent" />
            <span className="text-2xl font-syne font-bold tracking-tight">TransAfrik</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Tarifs</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button>Commencer <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 lg:pt-32">
        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center py-20 lg:py-32">
          {/* Subtle Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10" />
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-syne font-bold tracking-tight mb-6">
            Gérez votre flotte de transport <br className="hidden md:block" />
            <span className="text-accent">comme un professionnel</span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            TransAfrik est le SaaS tout-en-un conçu pour les entrepreneurs africains du transport. Centralisez vos voyages, suivez vos camions, et automatisez vos bons de livraison.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 h-auto">
                Démarrer l'essai gratuit
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 h-auto">
                Découvrir la plateforme
              </Button>
            </Link>
          </div>

          {/* Stats Preview */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-border-base pt-10">
            <div className="text-center">
              <h3 className="text-3xl font-syne font-bold text-text-primary">+500</h3>
              <p className="text-sm text-text-secondary mt-1">Entreprises clientes</p>
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-syne font-bold text-text-primary">+20k</h3>
              <p className="text-sm text-text-secondary mt-1">Voyages gérés</p>
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-syne font-bold text-text-primary">100%</h3>
              <p className="text-sm text-text-secondary mt-1">Sécurisé & Chiffré</p>
            </div>
            <div className="text-center">
              <h3 className="text-3xl font-syne font-bold text-text-primary">24/7</h3>
              <p className="text-sm text-text-secondary mt-1">Support dédié</p>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 bg-bg-surface border-y border-border-base">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-syne font-bold mb-4">Tout ce dont vous avez besoin</h2>
              <p className="text-text-secondary">Une suite d'outils performants pour remplacer vos fichiers Excel et optimiser votre rentabilité.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: Truck, title: "Gestion de Flotte", desc: "Suivez l'état de vos camions, gérez les chauffeurs et anticipez les dates de visites techniques et assurances." },
                { icon: BarChart3, title: "Tableau de Bord", desc: "Ayez une vision claire de votre rentabilité mensuelle en FCFA, de vos dépenses de carburant et de maintenance." },
                { icon: FileText, title: "Bons de Livraison", desc: "Générez instantanément des bons de livraison PDF professionnels et envoyez-les directement à vos clients." },
              ].map((f, i) => (
                <div key={i} className="bg-bg-card p-8 rounded-2xl border border-border-base shadow-sm hover:border-accent transition-colors group">
                  <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <f.icon className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-xl font-syne font-bold mb-3">{f.title}</h3>
                  <p className="text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-syne font-bold mb-4">Tarification Transparente</h2>
            <p className="text-text-secondary">Payez en fonction de la taille de votre flotte. Aucun frais caché.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Starter", price: 15000, desc: "Pour les petits transporteurs", features: ["Jusqu'à 5 camions", "Voyages illimités", "Génération de Bons PDF", "Support email"], recommended: false },
              { name: "Pro", price: 35000, desc: "Pour les entreprises en croissance", features: ["Jusqu'à 20 camions", "Tout de Starter", "Multi-utilisateurs (3)", "Rapports d'analyse"], recommended: true },
              { name: "Entreprise", price: 75000, desc: "Pour les flottes massives", features: ["Camions illimités", "Tout de Pro", "API & Webhooks", "Support WhatsApp 24/7"], recommended: false }
            ].map((plan, i) => (
              <div key={i} className={`bg-bg-card p-8 rounded-2xl border ${plan.recommended ? 'border-accent shadow-[0_0_40px_-15px_rgba(67,97,238,0.5)] relative' : 'border-border-base'} flex flex-col`}>
                {plan.recommended && (
                  <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Populaire
                  </div>
                )}
                <h3 className="text-2xl font-syne font-bold mb-2">{plan.name}</h3>
                <p className="text-text-secondary text-sm mb-6">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-syne font-bold text-text-primary">{formatFCFA(plan.price)}</span>
                  <span className="text-text-secondary">/mois</span>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-text-secondary">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={plan.recommended ? "primary" : "outline"} fullWidth size="lg">
                  Choisir ce plan
                </Button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-bg-surface border-t border-border-base py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-6 h-6 text-accent" />
              <span className="text-xl font-syne font-bold tracking-tight">TransAfrik</span>
            </div>
            <p className="text-text-secondary text-sm max-w-sm leading-relaxed">
              La plateforme SaaS de référence pour la gestion des entreprises de transport et logistique en Afrique francophone.
            </p>
          </div>
          <div>
            <h4 className="font-syne font-bold mb-4">Produit</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><a href="#features" className="hover:text-accent transition-colors">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-accent transition-colors">Tarifs</a></li>
              <li><Link href="/login" className="hover:text-accent transition-colors">Connexion</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-syne font-bold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li><Link href="/privacy" className="hover:text-accent transition-colors">Confidentialité</Link></li>
              <li><Link href="/terms" className="hover:text-accent transition-colors">CGU</Link></li>
              <li><Link href="/legal" className="hover:text-accent transition-colors">Mentions Légales</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-border-base text-center text-sm text-text-muted">
          &copy; {new Date().getFullYear()} TransAfrik Logistics SA. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}
