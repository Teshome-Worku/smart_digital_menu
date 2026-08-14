import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-surface-50 via-primary-50 to-surface-100">
      {/* Decorative background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl animate-[fade-in_0.6s_ease-out]">
        {/* Logo / Brand */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-500 shadow-glow mb-8">
          <span className="text-3xl">🍽️</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-surface-900 tracking-tight mb-4">
          Smart Digital
          <span className="text-primary-500"> Menu</span>
        </h1>

        <p className="text-lg text-surface-500 mb-10 max-w-md mx-auto leading-relaxed">
          A mobile-first QR restaurant ordering and management platform.
          Built for modern restaurants.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 active:bg-primary-700 shadow-soft hover:shadow-card transition-all duration-200"
          >
            Restaurant Login
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white text-surface-700 font-semibold text-sm border border-surface-200 hover:bg-surface-50 hover:border-surface-300 shadow-soft transition-all duration-200"
          >
            Create Account
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {[
            { icon: '📱', title: 'QR Ordering', desc: 'Scan, browse, order from the table' },
            { icon: '📊', title: 'Dashboard', desc: 'Manage menu, orders, and analytics' },
            { icon: '🧠', title: 'Smart Features', desc: 'Recommendations and smart search' },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-soft border border-surface-100 hover:shadow-card transition-shadow"
            >
              <span className="text-2xl mb-2 block">{f.icon}</span>
              <h3 className="font-semibold text-surface-800 text-sm">{f.title}</h3>
              <p className="text-xs text-surface-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
