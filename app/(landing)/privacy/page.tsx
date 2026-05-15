import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-bg-base py-20 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="flex items-center gap-2 mb-12">
          <Shield className="w-8 h-8 text-accent" />
          <span className="text-2xl font-syne font-bold text-text-primary tracking-tight">TransAfrik</span>
        </Link>
        
        <div>
          <h1 className="text-4xl font-syne font-bold text-text-primary mb-4">Politique de Confidentialité</h1>
          <p className="text-text-secondary">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div className="prose prose-invert prose-blue max-w-none text-text-secondary">
          <h2 className="text-text-primary font-syne mt-8 mb-4">1. Données collectées</h2>
          <p>
            Dans le cadre de l'utilisation de la plateforme TransAfrik, nous collectons les données strictement nécessaires au fonctionnement de nos services : informations de création de compte (nom, email, nom de l'entreprise), données de facturation (si applicable), et logs de connexion à des fins de sécurité.
          </p>

          <h2 className="text-text-primary font-syne mt-8 mb-4">2. Finalité du traitement</h2>
          <p>
            Vos données sont traitées pour vous fournir l'accès au SaaS de gestion logistique, pour la facturation, le support client, et l'amélioration continue de nos services via des statistiques anonymisées.
          </p>

          <h2 className="text-text-primary font-syne mt-8 mb-4">3. Chiffrement et Sécurité</h2>
          <p>
            La sécurité est au cœur de TransAfrik. Toutes les données PII (Informations Personnelles Identifiables) telles que les numéros de permis de conduire ou de carte d'identité de vos chauffeurs sont chiffrées en base de données avec la norme AES-256-GCM. Nos communications sont entièrement chiffrées (TLS 1.3).
          </p>

          <h2 className="text-text-primary font-syne mt-8 mb-4">4. Vos droits (RGPD)</h2>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>Droit d'accès et de portabilité (export JSON disponible dans vos paramètres)</li>
            <li>Droit de rectification</li>
            <li>Droit à l'effacement (droit à l'oubli) de votre compte et de toutes vos données</li>
            <li>Droit d'opposition et de limitation du traitement</li>
          </ul>

          <h2 className="text-text-primary font-syne mt-8 mb-4">5. Sous-traitants</h2>
          <p>
            Nous utilisons des prestataires de confiance pour opérer le service (Supabase pour la base de données, Resend pour les emails, Upstash pour la sécurité). Tous sont en conformité avec les standards de sécurité internationaux.
          </p>
        </div>
      </div>
    </div>
  )
}
