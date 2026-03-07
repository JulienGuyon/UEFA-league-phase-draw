import { ChampionsLeagueSimulator } from "./components/champions-league-simulator";
import { MobileDrawSimulator } from "./components/mobile-draw-simulator";
import { useIsMobile } from "./hooks/use-is-mobile";
import { Button } from "./components/ui/button";
import {
  Github,
  ExternalLink,
  Award,
  BarChart4,
  Calendar,
  Newspaper,
  Shield,
  Dices,
  Trophy,
  Zap,
  Sparkles,
  Lightbulb,
  BarChart3,
  Compass,
  BookOpenText,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const keywords = [
  "Fairness in Sports",
  "Draw Procedure",
  "Sports Scheduling",
  "Graph Theory",
  "Chromatic Index",
  "Integer Programming",
  "Monte Carlo Simulations",
  "UEFA Champions League",
];

const authors = [
  "Adle Ben Salem",
  "Thomas Buchholtzer",
  "Julien Guyon",
  "Mathieu Tanré",
];

const navItems = [
  { href: "#introduction", label: "Overview" },
  { href: "#simulator", label: "Simulator" },
  { href: "#counter-example", label: "Research" },
  { href: "#approach", label: "Methodology" },
  { href: "#numerical-analysis", label: "Analysis" },
];

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group hover-lift rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6 transition-all">
      <div className="mb-3 md:mb-4 hidden md:inline-flex items-center justify-center rounded-lg bg-[var(--uefa-blue)]/8 p-2 md:p-2.5 transition-colors group-hover:bg-[var(--uefa-blue)]/12">
        <Icon className="h-4 w-4 md:h-5 md:w-5 text-[var(--uefa-blue)]" />
      </div>
      <h3 className="mb-1.5 md:mb-2 text-sm md:text-base font-semibold text-[hsl(var(--foreground))]">
        {title}
      </h3>
      <p className="text-xs md:text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
        {description}
      </p>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8 md:mb-10 text-center">
      <div className="mt-3 flex items-center justify-center gap-2 md:gap-3">
        <Icon className="h-5 w-5 md:h-7 md:w-7 text-[var(--uefa-gold)]" />
        <h2 className="font-display text-2xl md:text-3xl lg:text-4xl tracking-tight text-[hsl(var(--foreground))]">
          {title}
        </h2>
      </div>
      <p className="mx-auto mt-3 md:mt-4 max-w-2xl text-sm md:text-base text-[hsl(var(--muted-foreground))]">
        {description}
      </p>
    </div>
  );
}

function ImageFigure({
  src,
  alt,
  caption,
  className = "",
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}) {
  return (
    <figure className={`group ${className}`}>
      <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm transition-shadow hover:shadow-md">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto block"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 md:mt-3 text-center text-[10px] md:text-xs text-[hsl(var(--muted-foreground))]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function MobileNav({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute top-0 right-0 w-64 h-full bg-[hsl(var(--card))] shadow-xl p-6 flex flex-col gap-1">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
            Navigation
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[hsl(var(--muted))]"
          >
            <X className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={onClose}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-white/10">
        <div className="mx-auto flex h-12 md:h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <a
            href="#"
            className="flex items-center gap-2 font-semibold text-[var(--uefa-blue)] text-sm"
          >
            <span className="hidden sm:inline">UCL Draw Research</span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-md hover:bg-[hsl(var(--muted))]"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5 text-[hsl(var(--foreground))]" />
          </button>
        </div>
      </nav>

      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <main className="mx-auto max-w-6xl px-4 md:px-6 pt-12 md:pt-14">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl bg-[var(--uefa-blue)] px-5 py-10 mt-4 md:px-16 md:py-24 md:mt-8">
          <div className="absolute inset-0 bg-grid opacity-[0.04]" />
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <h1 className="font-display text-2xl leading-tight text-white sm:text-4xl md:text-6xl md:leading-tight">
              Drawing League Phase Matchups in the{" "}
              <span className="gradient-text">
                New UEFA Champions League Format
              </span>
            </h1>

            <p className="mx-auto mt-4 md:mt-6 max-w-xl text-sm md:text-lg text-white/60">
              A mathematical approach to ensure fairness, feasibility, and
              competitive balance
            </p>

            {/* Keywords — show fewer on mobile */}
            <div className="mt-5 md:mt-8 flex flex-wrap justify-center gap-1.5 md:gap-2">
              {keywords.slice(0, isMobile ? 4 : keywords.length).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 md:px-3 md:py-1 text-[10px] md:text-xs text-white/70 backdrop-blur-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>

            {/* Authors — horizontal scroll on mobile */}
            <div className="mt-5 md:mt-8 flex flex-wrap justify-center gap-2 md:gap-3">
              {authors.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-white/15 px-2.5 py-0.5 md:px-3.5 md:py-1 text-xs md:text-sm font-medium text-white/80"
                >
                  {name}
                </span>
              ))}
            </div>

            {/* CTA buttons — stack on mobile */}
            <div className="mt-6 md:mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-2 md:gap-3">
              <Button
                asChild
                className="rounded-full bg-white text-[var(--uefa-blue)] hover:bg-white/90 font-medium px-5 h-9 md:h-10 text-xs md:text-sm"
              >
                <a
                  href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5413142"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Newspaper className="mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                  Read the Article
                </a>
              </Button>
              <div className="flex gap-2 justify-center">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white font-medium px-4 md:px-5 h-9 md:h-10 text-xs md:text-sm flex-1 sm:flex-initial"
                >
                  <a
                    href="https://github.com/JulienGuyon/UEFA-league-phase-draw"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                    Code
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white font-medium px-4 md:px-5 h-9 md:h-10 text-xs md:text-sm flex-1 sm:flex-initial"
                >
                  <a href="#simulator">
                    <Dices className="mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" />
                    Simulator
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Format Overview */}
        <section id="introduction" className="scroll-mt-16 md:scroll-mt-20 py-12 md:py-20">
          <SectionHeader
            icon={Trophy}
            title="New Format Overview"
            description="Starting in 2024, the UEFA Champions League introduces a revolutionary format with 36 teams in a single league table."
          />

          <div className="mb-6 md:mb-8 flex justify-center">
            <Button
              asChild
              variant="outline"
              className="rounded-full text-xs font-medium"
            >
              <a
                href="https://www.uefa.com/uefachampionsleague/news/0268-12157d69ce2d-9f011c70f6fa-1000--new-format-for-champions-league-post-2024-everything-you-ne/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Official UEFA Rules
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
            <FeatureCard
              icon={Calendar}
              title="8 Match Days"
              description="Each team plays exactly eight matches against eight different opponents."
            />
            <FeatureCard
              icon={BarChart4}
              title="4 Seeding Pots"
              description="Teams are divided into four pots of nine, based on UEFA coefficient."
            />
            <FeatureCard
              icon={Award}
              title="Balanced Competition"
              description="Each team faces two teams from each pot — one home, one away."
            />
            <FeatureCard
              icon={Shield}
              title="Country Protection"
              description="Teams cannot face opponents from the same country."
            />
            <FeatureCard
              icon={Zap}
              title="Scheduling Integrity"
              description="All matches must fit within pre-defined match days."
            />
            <FeatureCard
              icon={Sparkles}
              title="Match Consistency"
              description="Equal mix of home and away matches ensures parity."
            />
          </div>
        </section>

        {/* Simulator */}
        <section id="simulator" className="scroll-mt-16 md:scroll-mt-20 py-12 md:py-20">
          <div className="section-card p-4 md:p-8 lg:p-12">
            <SectionHeader
              icon={Dices}
              title="Draw Simulator"
              description="We modelized UEFA constraints using Integer Linear Programming in Julia. Try our interactive simulator."
            />

            {/* Draw procedure image — hidden on mobile */}
            <div className="hidden md:flex mb-10 justify-center">
              <ImageFigure
                src={`${import.meta.env.BASE_URL}images/draw-procedure.png`}
                alt="Template schedule showing the assignment of teams to match days"
                caption="Draw Algorithm Procedure"
                className="max-w-2xl"
              />
            </div>

            {/* Conditional simulator */}
            {isMobile ? <MobileDrawSimulator /> : <ChampionsLeagueSimulator />}
          </div>
        </section>

        {/* Counter Example */}
        <section id="counter-example" className="scroll-mt-16 md:scroll-mt-20 py-12 md:py-20">
          <div className="section-card p-4 md:p-8 lg:p-12">
            <SectionHeader
              icon={Lightbulb}
              title="Scheduling Challenges"
              description="Discovering the mathematical complexities in the new format"
            />

            <div className="mx-auto max-w-3xl">
              <div className="mb-6 md:mb-8 rounded-xl bg-[hsl(var(--muted))]/50 p-4 md:p-6">
                <p className="text-xs md:text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  We study feasibility properties of the new format. Among them
                  we show that the scheduling issue cannot be ignored when drawing
                  the matchups. Below is a noncompact draw outcome which satisfies
                  all the pot and association constraints, i.e the matches cannot
                  be scheduled within the eight match days.
                </p>
              </div>

              <ImageFigure
                src={`${import.meta.env.BASE_URL}images/Contre-exemple-graph-legended.png`}
                alt="Counter-example graph showing Leipzig as a cut-vertex"
                caption="A noncompact draw outcome — impossible to schedule within eight match days"
              />
            </div>
          </div>
        </section>

        {/* Approach */}
        <section id="approach" className="scroll-mt-16 md:scroll-mt-20 py-12 md:py-20">
          <div className="section-card p-4 md:p-8 lg:p-12">
            <SectionHeader
              icon={Compass}
              title="Build Schedule First"
              description="A systematic method to ensure fair and feasible tournament scheduling"
            />

            <div className="mx-auto max-w-3xl">
              <div className="mb-6 md:mb-8 rounded-xl bg-[hsl(var(--muted))]/50 p-4 md:p-6">
                <p className="text-xs md:text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  In this approach, an 8-match-day schedule template is created to
                  meet all pot constraints. The template uses placeholders. Teams
                  are then assigned to these placeholders, ensuring that all
                  association constraints are satisfied.
                </p>
              </div>

              <ImageFigure
                src={`${import.meta.env.BASE_URL}images/template-schedule.png`}
                alt="Template schedule showing the assignment of teams to match days"
                caption="Template Design — schedule template satisfying pot constraints"
              />
            </div>
          </div>
        </section>

        {/* Numerical Analysis */}
        <section id="numerical-analysis" className="scroll-mt-16 md:scroll-mt-20 py-12 md:py-20">
          <div className="section-card p-4 md:p-8 lg:p-12">
            <SectionHeader
              icon={BarChart3}
              title="Numerical Analysis"
              description="Quantifying fairness across different draw methodologies"
            />

            <div className="mx-auto max-w-3xl">
              <div className="mb-6 md:mb-8 rounded-xl bg-[hsl(var(--muted))]/50 p-4 md:p-6">
                <p className="text-xs md:text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  We simulate a large number of draws (40,000) according to
                  several draw methods and then analyze the empirical distribution
                  of the average "strength" of each team's opponents.
                </p>
              </div>

              <div className="space-y-4 md:space-y-6">
                <ImageFigure
                  src={`${import.meta.env.BASE_URL}images/luck-index.png`}
                  alt="Graph showing luck index distribution across different draw methods"
                  caption="Luck index distribution across draw methods"
                />
                <ImageFigure
                  src={`${import.meta.env.BASE_URL}images/dmf_ucl_uefa_scatterplot-1.png`}
                  alt="Scatterplot of UCL UEFA draw method fairness"
                  caption="Scatterplot comparing draw method fairness"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Research Paper */}
        <section className="scroll-mt-16 md:scroll-mt-20 py-12 md:py-20">
          <div className="section-card p-4 md:p-8 lg:p-12">
            <SectionHeader
              icon={BookOpenText}
              title="Research Paper"
              description="Explore the mathematical foundations of our work."
            />

            <div className="mx-auto max-w-3xl">
              <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30 p-4 md:p-6 lg:p-8">
                <h3 className="mb-3 md:mb-4 text-base md:text-lg font-semibold text-[hsl(var(--foreground))]">
                  Abstract
                </h3>
                <div className="space-y-3 md:space-y-4 text-xs md:text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  <p>
                    The league phase of the new UEFA Champions League gathers 36
                    soccer teams ranked in a single table. Each team faces only
                    eight opponents drawn randomly, subject to seeding pot and
                    association constraints. We investigate four methods for drawing
                    the league phase matchups:
                  </p>

                  <div className="space-y-2 md:space-y-3 pl-1">
                    <div className="flex gap-2 md:gap-3">
                      <span className="mt-0.5 flex h-4 w-4 md:h-5 md:w-5 shrink-0 items-center justify-center rounded-full bg-[var(--uefa-blue)]/10 text-[9px] md:text-[10px] font-bold text-[var(--uefa-blue)]">
                        1
                      </span>
                      <p>
                        We analyze UEFA's official draw procedure where matchups
                        are drawn before scheduling. Using chromatic index
                        arguments from graph theory, we demonstrate that scheduling
                        cannot be ignored when drawing matchups.
                      </p>
                    </div>
                    <div className="flex gap-2 md:gap-3">
                      <span className="mt-0.5 flex h-4 w-4 md:h-5 md:w-5 shrink-0 items-center justify-center rounded-full bg-[var(--uefa-blue)]/10 text-[9px] md:text-[10px] font-bold text-[var(--uefa-blue)]">
                        2
                      </span>
                      <p>
                        We explore an alternative method that first builds a
                        schedule template satisfying pot constraints before
                        randomly populating it with teams.
                      </p>
                    </div>
                  </div>

                  {/* Collapse extra paragraphs on mobile */}
                  <div className="hidden md:block space-y-4">
                    <p>
                      For both methods, we also examine randomized variations where
                      we shuffle the order of pots from which teams are drawn or the
                      order used to populate the schedule template.
                    </p>

                    <p>
                      Using integer programming to express draw constraints, we run
                      Monte Carlo simulations comparing these four methods for the
                      2024–25 UEFA Champions League and Europa League. We assess
                      fairness by analyzing the distributions of opponents' average
                      strength and measure each procedure's impact on matchup
                      probabilities.
                    </p>

                    <p>
                      We introduce a luck index that objectively ranks teams from
                      luckiest to unluckiest during the actual draw. Additionally, we
                      provide examples of noncompact draw outcomes and derive the
                      minimum number of scheduling breaks for general setups with
                      multiple seeding pots.
                    </p>
                  </div>
                </div>

                <div className="mt-6 md:mt-8 flex flex-col items-start gap-3 md:gap-4 border-t border-[hsl(var(--border))] pt-4 md:pt-6 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    className="rounded-full bg-[var(--uefa-blue)] text-white hover:bg-[var(--uefa-blue-light)] font-medium h-9 md:h-10 px-5 md:px-6 text-xs md:text-sm w-full sm:w-auto"
                  >
                    <a
                      href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5413142"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read Full Article
                      <ArrowUpRight className="ml-2 h-3.5 w-3.5 md:h-4 md:w-4" />
                    </a>
                  </Button>
                  <span className="text-[10px] md:text-xs text-[hsl(var(--muted-foreground))]">
                    Julia code at{" "}
                    <a
                      href="https://github.com/JulienGuyon/UEFA-league-phase-draw"
                      className="underline underline-offset-2 hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      github.com/JulienGuyon/UEFA-league-phase-draw
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 md:mt-12 border-t border-[hsl(var(--border))]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:gap-6 px-4 md:px-6 py-6 md:py-10 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs text-[hsl(var(--muted-foreground))]">
              &copy; 2026
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
