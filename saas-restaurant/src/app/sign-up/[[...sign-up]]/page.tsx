import { SignUp } from "@clerk/nextjs";
import Image from 'next/image';

export default function SignUpPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 sm:p-6">
      {/* Background Decorative Elements */}
      <div
        className="absolute -top-[10%] -left-[10%] h-[35%] w-[35%] rounded-full bg-blue-600/10 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-[10%] -right-[10%] h-[35%] w-[35%] rounded-full bg-blue-400/5 blur-[100px]"
        aria-hidden="true"
      />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="group">
            <div className="rounded-2xl bg-white shadow-xl shadow-blue-500/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-500/20">
              <Image
                src="/Person.png"
                alt="Logo Sam - Criar Conta"
                width={56}
                height={56}
                priority
                className="h-auto w-auto"
              />
            </div>
          </div>
        </div>

        {/* SignUp Card */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-900/20">
          <SignUp
            path="/signup"
            routing="path"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "w-full border-none bg-transparent p-6 sm:p-8 shadow-none",
                headerTitle: "text-xl font-bold tracking-tight text-slate-900",
                headerSubtitle: "text-sm text-slate-500",
                formButtonPrimary:
                  "rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md active:translate-y-0",
                formFieldInput:
                  "rounded-lg border-slate-200 bg-slate-50 text-sm transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none",
                footerActionLink: "font-medium text-blue-600 transition-colors hover:text-blue-700",
                identityPreviewText: "font-semibold text-slate-900",
                identityPreviewEditButton: "font-medium text-blue-600 transition-colors hover:text-blue-700",
                socialButtonsBlockButton:
                  "rounded-lg border-slate-200 bg-slate-50 transition-all hover:bg-slate-100 hover:border-slate-300",
                dividerLine: "bg-slate-200",
                dividerText: "text-slate-400 text-xs",
                formFieldLabel: "text-sm font-medium text-slate-700",
                formFieldErrorText: "text-sm text-red-600",
                alert: "rounded-lg",
                alertText: "text-sm text-slate-700",
                formFieldSuccessText: "text-sm text-emerald-600",
                otpCodeFieldInput: "rounded-lg",
              },
              layout: {
                socialButtonsPlacement: "top",
                showOptionalFields: false,
              },
            }}
          />
        </section>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          Já tem uma conta?{' '}
          <a href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            Entrar
          </a>
        </p>
      </div>
    </main>
  );
}