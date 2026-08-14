export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-primary-50/50 to-surface-100 px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-primary-300/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-[scale-in_0.3s_ease-out]">
        {children}
      </div>
    </div>
  );
}
