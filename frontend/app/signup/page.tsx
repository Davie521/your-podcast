import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-cream">
      <main className="mx-auto w-full max-w-[393px] px-6">
        {/* Logo */}
        <div className="flex items-center justify-center pt-20">
          <h1 className="font-serif font-bold text-2xl text-[#111] tracking-[-1.2px] uppercase">
            Podcast
          </h1>
        </div>

        {/* Heading */}
        <div className="mt-12 flex flex-col gap-4">
          <h2 className="font-serif text-[36px] leading-10 text-[#111] text-center">
            Create your account
          </h2>
          <p className="font-sans text-base text-[rgba(17,17,17,0.8)] text-center w-[248px] mx-auto leading-[26px]">
            Start your storytelling journey today.
          </p>
        </div>

        {/* Form */}
        <div className="mt-10 flex flex-col gap-6">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="px-1 font-sans font-medium text-[14px] text-[#111]">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Jane Doe"
              className="w-full h-12 px-4 border border-[#e0e0d8] rounded-[10px] font-sans text-base text-[#111] placeholder:text-[rgba(17,17,17,0.5)] outline-none focus:border-[#111] transition-colors bg-transparent"
            />
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label className="px-1 font-sans font-medium text-[14px] text-[#111]">
              Email Address
            </label>
            <input
              type="email"
              placeholder="yourname@email.com"
              className="w-full h-12 px-4 border border-[#e0e0d8] rounded-[10px] font-sans text-base text-[#111] placeholder:text-[rgba(17,17,17,0.5)] outline-none focus:border-[#111] transition-colors bg-transparent"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="px-1 font-sans font-medium text-[14px] text-[#111]">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full h-12 px-4 border border-[#e0e0d8] rounded-[10px] font-sans text-base text-[#111] placeholder:text-[rgba(17,17,17,0.5)] outline-none focus:border-[#111] transition-colors bg-transparent"
            />
          </div>

          {/* Create Account */}
          <button
            type="button"
            className="w-full h-14 bg-[#1a1a1a] rounded-[10px] font-sans font-medium text-[18px] text-white"
          >
            Create Account
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center h-16">
            <div className="absolute inset-x-0 top-1/2 border-t border-[#e0e0d8]" />
            <span className="relative bg-cream px-4 font-sans text-[10px] text-[#666] tracking-[1px] uppercase">
              OR SIGN UP WITH
            </span>
          </div>

          {/* Sign up with Google */}
          <button
            type="button"
            className="w-full h-14 border border-[#e0e0d8] rounded-[10px] flex items-center justify-between px-[25px]"
          >
            <span className="font-serif text-[18px] text-[#111]">Sign up with Google</span>
            <span className="font-sans font-bold text-[20px] text-[#111]">G</span>
          </button>

          {/* Sign in link + legal */}
          <div className="pt-8 flex flex-col gap-4 items-center pb-10">
            <p className="font-serif text-base text-[#111] text-center">
              {'Already have an account? '}
              <Link href="/signin" className="font-serif font-bold underline">
                Sign in
              </Link>
            </p>
            <div className="flex gap-2 items-center">
              <Link href="/privacy" className="font-sans text-[10px] text-[#666]">
                Privacy Policy
              </Link>
              <span className="font-sans text-[10px] text-[#666]">|</span>
              <Link href="/terms" className="font-sans text-[10px] text-[#666]">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
