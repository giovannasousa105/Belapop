/* eslint-disable @next/next/no-img-element */

import {
  footerGroups,
  paymentLogos,
  socialLinks
} from "@/components/home/luxury-home/data";
import {
  headlineClassName,
  SectionContainer,
  TextLink
} from "@/components/home/luxury-home/shared";

export function LuxuryFooter() {
  return (
    <footer className="w-full bg-black px-8 py-20 text-white">
      <SectionContainer maxWidthClassName="max-w-7xl">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <div className={`${headlineClassName} text-lg font-bold`}>BelaPop</div>
            <p className="text-[10px] uppercase leading-relaxed tracking-widest text-gray-400">
              Elevando os padroes de autocuidado atraves da ciencia e do luxo. Sua beleza e nossa
              maior curadoria.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              {socialLinks.map((link) => (
                <TextLink
                  key={link.label}
                  href={link.href}
                  className="text-[10px] uppercase tracking-widest text-gray-400 transition-colors hover:text-white"
                >
                  {link.label}
                </TextLink>
              ))}
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title} className="space-y-6">
              <h5 className="text-[10px] font-bold uppercase tracking-[0.2em]">{group.title}</h5>
              <ul className="space-y-4">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <TextLink
                      href={link.href}
                      className="text-[10px] uppercase tracking-widest text-gray-400 transition-colors hover:text-white hover:underline"
                    >
                      {link.label}
                    </TextLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-8 border-t border-white/5 pt-12 md:flex-row">
          <div className="flex flex-wrap items-center gap-6 opacity-40 transition-opacity duration-500 hover:opacity-100">
            {paymentLogos.map((logo) => (
              <img
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                className={`${logo.className} grayscale brightness-200`}
              />
            ))}
            <div className="flex items-center gap-1 text-white">
              <span className="text-[10px] font-bold tracking-tighter">Pix</span>
            </div>
          </div>

          <p className="text-[10px] uppercase tracking-widest text-gray-400">
            (c) 2024 BelaPop. TODOS OS DIREITOS RESERVADOS.
          </p>
        </div>
      </SectionContainer>
    </footer>
  );
}
