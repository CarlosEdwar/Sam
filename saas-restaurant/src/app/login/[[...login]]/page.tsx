'use client';

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 p-4 sm:p-6">
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
      <div className="relative z-10 w-full max-w-md space-y-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="group">
            <div className="rounded-2xl bg-white shadow-xl shadow-blue-500/10 transition-all duration-300 group-hover:scale-105">
              <Image
                src="/Person.png"
                alt="Logo Sam - Sistema de Impressão"
                width={56}
                height={56}
                priority
                className="h-auto w-auto"
              />
            </div>
          </div>
        </div>

        {/* SignIn Card - Forçando fundo branco com style inline e !important via CSS */}
        <section 
          className="overflow-hidden rounded-2xl shadow-xl shadow-slate-900/20"
          style={{ backgroundColor: '#ffffff', colorScheme: 'light' }}
        >
          <div className="clerk-force-light">
            <SignIn
              path="/login"
              routing="path"
              appearance={{
                variables: {
                  colorBackground: '#ffffff',
                  colorText: '#0f172a',
                  colorPrimary: '#2563eb',
                  colorInputBackground: '#f8fafc',
                  colorInputText: '#0f172a',
                  colorTextSecondary: '#64748b',
                  colorNeutral: '#64748b',
                  colorDanger: '#dc2626',
                  colorSuccess: '#059669',
                  colorAlphaShaded: 'rgba(0,0,0,0.06)',
                  borderRadius: '0.5rem',
                  fontFamily: 'inherit',
                },
                elements: {
                  rootBox: "w-full",
                  card: "w-full border-none p-6 sm:p-8 shadow-none !bg-white",
                  headerTitle: "text-xl font-bold tracking-tight !text-slate-900",
                  headerSubtitle: "text-sm !text-slate-500",
                  formButtonPrimary:
                    "rounded-lg py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:translate-y-0 !bg-blue-600 hover:!bg-blue-700",
                  formFieldInput:
                    "rounded-lg border border-slate-200 text-sm transition-all outline-none !bg-slate-50 !text-slate-900 focus:!border-blue-500 focus:!bg-white focus:ring-2 focus:ring-blue-500/20",
                  footerActionLink: "font-medium !text-blue-600 hover:!text-blue-700 transition-colors",
                  identityPreviewText: "font-semibold !text-slate-900",
                  identityPreviewEditButton: "font-medium !text-blue-600 hover:!text-blue-700 transition-colors",
                  socialButtonsBlockButton:
                    "rounded-lg border border-slate-200 transition-all hover:!bg-slate-100 !bg-slate-50",
                  socialButtonsBlockButtonText: "!text-slate-700 font-medium",
                  dividerLine: "!bg-slate-200",
                  dividerText: "!text-slate-400 text-xs font-medium",
                  formFieldLabel: "text-sm font-medium !text-slate-700",
                  formFieldErrorText: "text-sm !text-red-600",
                  alert: "rounded-lg !bg-red-50 !border-red-200",
                  alertText: "text-sm !text-red-700",
                  formFieldSuccessText: "text-sm !text-emerald-600",
                  otpCodeFieldInput: "rounded-lg border border-slate-200 !bg-white !text-slate-900",
                  formFieldWarningText: "text-sm !text-amber-600",
                  identityPreviewEditButtonIcon: "!text-blue-600",
                  socialButtonsProviderIcon: "w-5 h-5",
                  socialButtonsBlockButtonArrow: "!text-slate-400",
                  formResendCodeLink: "!text-blue-600 font-medium hover:!text-blue-700",
                  profileSectionTitle: "text-lg font-bold !text-slate-900",
                  profileSectionContent: "text-sm !text-slate-600",
                  badge: "!bg-blue-50 !text-blue-700 !border-blue-200",
                  formFieldLabelRow: "!text-slate-700",
                  formFieldInputShowPasswordButton: "!text-slate-400 hover:!text-slate-600",
                  formFieldInputGroup: "!border-slate-200",
                  formFieldInputGroupInput: "!bg-slate-50",
                  headerBackButton: "!text-slate-600 hover:!text-slate-900",
                  headerBackIcon: "!text-slate-600",
                  main: "!bg-white",
                  footer: "!bg-white",
                  footerPages: "!bg-white",
                  footerPagesLink: "!text-slate-500 hover:!text-slate-700",
                  page: "!bg-white",
                  providerIcon: "!bg-white",
                  socialButtons: "!bg-white",
                  socialButtonsIconButton: "!bg-slate-50 !border-slate-200 hover:!bg-slate-100",
                  socialButtonsIconButtonText: "!text-slate-700",
                  spinner: "!border-blue-600",
                  logoBox: "!bg-white",
                  logoImage: "!bg-white",
                },
                layout: {
                  socialButtonsPlacement: "top",
                  showOptionalFields: false,
                },
              }}
            />
          </div>
        </section>

        {/* Footer */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-center text-xs text-slate-500">
            Sistema de Gestão de Etiquetas e Estoque • v0.0.1
          </p>
          <Link
            href="#"
            className="text-xs text-slate-400 hover:text-slate-300 transition-colors underline-offset-4 hover:underline"
          >
            Precisa de ajuda? Fale com o suporte.
          </Link>
        </div>
      </div>
    </main>
  );
}