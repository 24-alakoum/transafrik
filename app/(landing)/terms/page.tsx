import Link from 'next/link'
import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-base py-20 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="flex items-center gap-2 mb-12">
          <FileText className="w-8 h-8 text-accent" />
          <span className="text-2xl font-syne font-bold text-text-primary tracking-tight">TransAfrik</span>
        </Link>
        
        <div>
          <h1 className="text-4xl font-syne font-bold text-text-primary mb-4">Conditions Générales d'Utilisation</h1>
          <p className="text-text-secondary">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div className="prose prose-invert prose-blue max-w-none text-text-secondary">
          <h2 className="text-text-primary font-syne mt-8 mb-4">1. Objet</h2>
          <p>
            Les présentes Conditions Générales d'Utilisation (CGU) encadrent l'accès et l'utilisation de l'application SaaS TransAfrik, destinée à la gestion des opérations logistiques et de transport.
          </p>

          <h2 className="text-text-primary font-syne mt-8 mb-4">2. Accès au service</h2>
          <p>
            Le service est accessible par abonnement. L'utilisateur s'engage à fournir des informations exactes lors de son inscription et à maintenir la confidentialité de ses identifiants d'accès. L'utilisation du compte est strictement limitée à l'entreprise souscriptrice.
          </p>

          <h2 className="text-text-primary font-syne mt-8 mb-4">3. Engagements de l'utilisateur</h2>
          <p>
            L'utilisateur s'interdit toute action susceptible de nuire au bon fonctionnement de la plateforme (tentatives de piratage, charge excessive, etc.). L'insertion de données illégales ou corrompues est strictement prohibée.
          </p>

          <h2 className="text-text-primary font-syne mt-8 mb-4">4. Disponibilité du service</h2>
          <p>
            Nous nous efforçons de maintenir un accès au service 24h/24 et 7j/7, avec une disponibilité garantie de 99.9%. Toutefois, TransAfrik ne saurait être tenu responsable des interruptions liées à des opérations de maintenance programmées ou à des cas de force majeure.
          </p>

          <h2 className="text-text-primary font-syne mt-8 mb-4">5. Résiliation</h2>
          <p>
            L'utilisateur peut résilier son abonnement à tout moment depuis les paramètres de facturation. La résiliation prendra effet à la fin de la période de facturation en cours. Les données seront conservées pendant 30 jours après résiliation avant suppression définitive, sauf demande d'export préalable.
          </p>
        </div>
      </div>
    </div>
  )
}
