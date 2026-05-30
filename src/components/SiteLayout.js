import Link from 'next/link';
import { Globe, Github } from 'lucide-react';

export default function SiteLayout({
  language,
  setLanguage,
  title,
  subtitle,
  meta,
  children,
  activeNav = 'calculator',
}) {
  const isEn = language === 'en';

  return (
    <div className="brutal-page">
      <div className="brutal-shell">
        <header className="mb-8 md:mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <nav className="flex flex-wrap items-center gap-3" aria-label="Main">
              <Link
                href="/"
                className={`brutal-btn ${activeNav === 'calculator' ? 'brutal-btn-primary' : ''}`}
              >
                {isEn ? 'Calculator' : 'Reiknivél'}
              </Link>
              <Link
                href="/rates/"
                className={`brutal-btn ${activeNav === 'rates' ? 'brutal-btn-primary' : ''}`}
              >
                {isEn ? 'Rates' : 'Vaxtir'}
              </Link>
            </nav>

            <button
              type="button"
              onClick={() => setLanguage(isEn ? 'is' : 'en')}
              className="brutal-btn"
              aria-label={isEn ? 'Switch to Icelandic' : 'Switch to English'}
            >
              <Globe className="w-4 h-4" aria-hidden="true" />
              <span>{isEn ? 'Íslenska' : 'English'}</span>
            </button>
          </div>

          <div className="brutal-card p-6 md:p-8">
            <p className="brutal-tag mb-4">
              {isEn ? 'Iceland · Húsaleigulög 36/1994' : 'Ísland · Húsaleigulög 36/1994'}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight uppercase max-w-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-5 max-w-3xl text-base md:text-lg text-[var(--color-text-muted)] leading-relaxed">
                {subtitle}
              </p>
            )}
            {meta && <div className="mt-4">{meta}</div>}
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-12 pt-6 border-t-[3px] border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
          <p>
            {isEn ? 'Created and hosted by ' : 'Reiknivélin er þróuð og hýst af '}
            <a href="https://gamithra.com" target="_blank" rel="noopener noreferrer" className="brutal-link">
              {isEn ? 'Gamithra' : 'Gamithru'}
            </a>
            .
          </p>
          <p className="mt-2">
            {isEn
              ? 'For informational purposes only — consult a lawyer for specific cases.'
              : 'Eingöngu til upplýsinga — leitaðu aðstoðar hjá lögfræðingi fyrir sértæk mál.'}
          </p>
          <a
            href="https://github.com/Gamithra/tryggingar"
            target="_blank"
            rel="noopener noreferrer"
            className="brutal-link inline-flex items-center gap-1.5 mt-3"
          >
            <Github className="w-4 h-4" aria-hidden="true" />
            GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}
