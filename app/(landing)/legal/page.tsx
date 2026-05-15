import Link from 'next/link'
import { Scale } from 'lucide-react'

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-bg-base py-20 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="flex items-center gap-2 mb-12">
          <Scale className="w-8 h-8 text-accent" />
          <span className="text-2xl font-syne font-bold text-text-primary tracking-tight">TransAfrik</span>
        </Link>
        
        <div>
          <h1 className="text-4xl font-syne font-bold text-text-primary mb-4">Mentions Légales</h1>
          <p className="text-text-secondary">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div className="prose prose-invert prose-blue max-w-none text-text-secondary">
          <h2 className="text-text-primary font-syne mt-8 mb-4">Éditeur du site</h2>
          <p>
            Le site <strong>TransAfrik</strong> est édité par la société TransAfrik Logistics SA, Société Anonyme au capital de 10 000 000 FCFA.<br/>
            Siège social : Bamako, Mali.<br/>
            Numéro d'immatriculation (RCCM) : MA.BKO.2026.B.0000<br/>
            NIF : 000000000X<br/>
            Email : contact@transafrik.app
          </p>

          <h2 className="text-text-primary font-syne mt-8 mb-4">Directeur de la publication</h2>
          <p>
            Mahamadou (CEO & Fondateur)
          </p>

          <h2 className="text-text-primary font-syne mt-8 mb-4">Hébergement</h2>
          <p>
            L'application est hébergée par <strong>Vercel Inc.</strong><br/>
            340 S Lemon Ave #4133<br/>
            Walnut, CA 91789<br/>
            États-Unis
          </p>
          <p>
            La base de données est hébergée sur <strong>Supabase</strong> (Serveurs AWS / Région Europe).
          </p>

          <h2 className="text-text-primary font-syne mt-8 mb-4">Propriété Intellectuelle</h2>
          <p>
            L'ensemble des éléments constituant la plateforme TransAfrik (design, code, architecture, textes) sont la propriété exclusive de TransAfrik Logistics SA. Toute reproduction totale ou partielle sans autorisation est strictement interdite.
          </p>
        </div>
      </div>
    </div>
  )
}
