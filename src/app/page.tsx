import Link from "next/link";
import Image from "next/image";

export default function WelcomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 dina-background">
      <div className="flex flex-col items-center justify-center text-center">
        {/* Logo Container */}
        <div className="dina-logo-container mb-9">
          <Image
            src="/konak-wheel.svg"
            alt="DINA-AI Logo"
            width={70}
            height={70}
            priority
          />
        </div>

        {/* Heading */}

        <div className="flex flex-col gap-1 justify-center flex-wrap mb-17">
          <p className="dina-heading">DINA-AI</p>
          <p className="dina-catchphrase">
            The ayurvedic assistant that you deserve.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 justify-center flex-wrap">
          <Link
            href="/login"
            className="dina-button"
          >
            Login
          </Link>
          <Link
            href="/dashboard"
            className="dina-button"
          >
            Continue as Guest
          </Link>
        </div>
      </div>
    </main>
  );
}