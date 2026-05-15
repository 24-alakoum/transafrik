export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 bg-bg-card rounded-2xl overflow-hidden shadow-2xl border border-border-base">
        {/* Left column - form */}
        <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative z-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-sm mb-8 lg:hidden">
            <span className="font-syne font-bold text-white">T</span>
          </div>
          {children}
        </div>

        {/* Right column - image/branding */}
        <div className="hidden lg:flex flex-col justify-between bg-bg-surface p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent z-0" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
                <span className="font-syne font-bold text-white text-lg">T</span>
              </div>
              <span className="font-syne font-bold text-2xl text-text-primary">TransAfrik</span>
            </div>
            
            <h2 className="text-4xl font-syne font-bold text-white mb-6 text-balance leading-tight">
              Gérez votre flotte et vos expéditions en toute sérénité.
            </h2>
            <p className="text-text-secondary text-lg text-balance">
              Le premier SaaS de gestion logistique pensé et conçu pour les entrepreneurs en Afrique.
            </p>
          </div>

          <div className="relative z-10">
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-white font-medium">Sécurité bancaire</p>
                  <p className="text-text-secondary text-sm">Vos données sont chiffrées de bout en bout</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
