import { ChampionsLeagueSimulator } from "@/components/champions-league-simulator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Star,
  Zap,
  Sparkles,
  Lightbulb,
  BarChart3,
  Flame,
  Compass,
  BookOpenText,
  Code,
} from "lucide-react";

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

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section with gradient background */}
        <section className="relative z-10 text-center mb-16 rounded-3xl overflow-hidden bg-gradient-to-r from-[#0e1e5b] to-[#0a3da8] p-8 shadow-xl">
          <div className="absolute inset-0 bg-[url('/images/champions-league-pattern.png')] opacity-10 mix-blend-overlay"></div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 mt-4 text-white drop-shadow-md">
            Drawing League Phase Matchups in the <br />
            <span className="text-[#cfa749]">
              New UEFA Champions League Format
            </span>
          </h1>

          <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
            A mathematical approach to ensure fairness, feasibility, and
            competitive balance
          </p>

          {/* Keywords Display */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-3xl mx-auto">
            {keywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs md:text-sm bg-white/15 text-white backdrop-blur-sm border border-white/20 hover:bg-white/25 transition-colors"
              >
                {keyword}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <Badge
              variant="outline"
              className="text-white border-white/30 px-3 py-1"
            >
              Adle Ben Salem
            </Badge>
            <Badge
              variant="outline"
              className="text-white border-white/30 px-3 py-1"
            >
              Thomas Buchholtzer
            </Badge>
            <Badge
              variant="outline"
              className="text-white border-white/30 px-3 py-1"
            >
              Julien Guyon
            </Badge>
            <Badge
              variant="outline"
              className="text-white border-white/30 px-3 py-1"
            >
              Mathieu Tanré
            </Badge>
          </div>

          <div className="flex flex-wrap gap-6 justify-center mb-6">
            <a
              href="https://github.com/Jeerhz"
              className="group"
              aria-label="GitHub"
            >
              <Button
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
              >
                <Github className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                See the code
              </Button>
            </a>
            <a href="https://arxiv.com/" className="group" aria-label="Arxiv">
              <Button
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
              >
                <Newspaper className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Read the article
              </Button>
            </a>
            <a href="#simulator" className="group" aria-label="Simulator">
              <Button className="bg-[#cfa749] hover:bg-[#e0b850] text-[#0e1e5b] border-0">
                <Dices className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Try the Simulator
              </Button>
            </a>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#0e1e5b]/50 to-transparent"></div>
        </section>

        {/* New Format Overview */}
        <section id="introduction" className="py-12 mb-12">
          <Card className="shadow-xl border-0 overflow-hidden bg-white dark:bg-slate-900">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0e1e5b]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <CardHeader className="text-center relative z-10">
              <div className="flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-[#cfa749] mr-3" />
                <CardTitle className="text-2xl md:text-3xl font-bold text-[#0e1e5b] dark:text-white">
                  New Format Overview
                </CardTitle>
              </div>
              <CardDescription className="text-lg max-w-3xl mx-auto">
                Starting in 2024, the UEFA Champions League introduces a
                revolutionary format with 36 teams in a single league table.
              </CardDescription>
              <div className="mt-6">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-[#0e1e5b]/20 hover:bg-[#0e1e5b]/5 hover:text-[#0e1e5b] dark:border-white/20 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <a
                    href="https://www.uefa.com/uefachampionsleague/news/0268-12157d69ce2d-9f011c70f6fa-1000--new-format-for-champions-league-post-2024-everything-you-ne/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Official UEFA Rules
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group">
                  <div className="h-1 w-full bg-[#0e1e5b] dark:bg-[#cfa749]"></div>
                  <CardContent className="p-6 pt-8">
                    <div className="rounded-full bg-[#0e1e5b]/10 dark:bg-[#cfa749]/10 p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
                      <Calendar className="h-6 w-6 text-[#0e1e5b] dark:text-[#cfa749]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[#0e1e5b] dark:text-white">
                      8 Match Days
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Each team plays exactly eight matches against eight
                      different opponents, scheduled across eight match days.
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group">
                  <div className="h-1 w-full bg-[#0e1e5b] dark:bg-[#cfa749]"></div>
                  <CardContent className="p-6 pt-8">
                    <div className="rounded-full bg-[#0e1e5b]/10 dark:bg-[#cfa749]/10 p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
                      <BarChart4 className="h-6 w-6 text-[#0e1e5b] dark:text-[#cfa749]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[#0e1e5b] dark:text-white">
                      4 Seeding Pots
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Teams are divided into four pots of nine teams each, based
                      on their UEFA coefficient ranking.
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group">
                  <div className="h-1 w-full bg-[#0e1e5b] dark:bg-[#cfa749]"></div>
                  <CardContent className="p-6 pt-8">
                    <div className="rounded-full bg-[#0e1e5b]/10 dark:bg-[#cfa749]/10 p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
                      <Award className="h-6 w-6 text-[#0e1e5b] dark:text-[#cfa749]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[#0e1e5b] dark:text-white">
                      Balanced Competition
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Each team faces exactly two teams from each pot - one home
                      match and one away match.
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group">
                  <div className="h-1 w-full bg-[#0e1e5b] dark:bg-[#cfa749]"></div>
                  <CardContent className="p-6 pt-8">
                    <div className="rounded-full bg-[#0e1e5b]/10 dark:bg-[#cfa749]/10 p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
                      <Shield className="h-6 w-6 text-[#0e1e5b] dark:text-[#cfa749]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[#0e1e5b] dark:text-white">
                      Country Protection
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Teams cannot face opponents from the same country during
                      the league phase.
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group">
                  <div className="h-1 w-full bg-[#0e1e5b] dark:bg-[#cfa749]"></div>
                  <CardContent className="p-6 pt-8">
                    <div className="rounded-full bg-[#0e1e5b]/10 dark:bg-[#cfa749]/10 p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
                      <Zap className="h-6 w-6 text-[#0e1e5b] dark:text-[#cfa749]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[#0e1e5b] dark:text-white">
                      Scheduling Integrity
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      All matches must be scheduled within the pre-defined match
                      days with specific constraints.
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all group">
                  <div className="h-1 w-full bg-[#0e1e5b] dark:bg-[#cfa749]"></div>
                  <CardContent className="p-6 pt-8">
                    <div className="rounded-full bg-[#0e1e5b]/10 dark:bg-[#cfa749]/10 p-3 w-fit mb-4 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-6 w-6 text-[#0e1e5b] dark:text-[#cfa749]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[#0e1e5b] dark:text-white">
                      Match Consistency
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Each team plays an equal mix of home and away matches to
                      ensure parity across all participants.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Simulator Section */}
        <section id="simulator" className="py-12 mb-12 scroll-mt-16">
          <Card className="shadow-xl border-0 overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <div className="absolute top-0 left-0 w-64 h-64 bg-[#cfa749]/5 rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
            <CardHeader className="text-center relative z-10">
              <Badge className="mx-auto mb-4 bg-[#0e1e5b]/10 text-[#0e1e5b] hover:bg-[#0e1e5b]/20 dark:bg-[#cfa749]/10 dark:text-[#cfa749] dark:hover:bg-[#cfa749]/20">
                Interactive Tool
              </Badge>
              <div className="flex items-center justify-center mb-4">
                <Dices className="h-8 w-8 text-[#cfa749] dark:text-[#cfa749] mr-3" />
                <CardTitle className="text-2xl md:text-3xl font-bold text-[#0e1e5b] dark:text-white">
                  Draw Simulator
                </CardTitle>
              </div>
              <CardDescription className="text-lg max-w-3xl mx-auto">
                We modelized UEFA constraints using Integer Linear Programming
                in Julia. Try our interactive simulator to understand how the
                new Champions League draw works.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 p-6">
              <CardContent className="relative z-10 p-6 flex justify-center items-center">
                <div className="flex justify-center mb-6">
                  <div className="relative group">
                    <img
                      src="/images/draw-procedure.png"
                      alt="Template schedule showing the assignment of teams to match days"
                      className="rounded-lg shadow-md w-full max-w-2xl h-auto border-4 border-white dark:border-slate-700 transition-all duration-300 group-hover:shadow-xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e1e5b]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-end justify-center">
                      <Badge className="mb-4 bg-white/80 text-[#0e1e5b] hover:bg-white dark:bg-black/80 dark:text-white dark:hover:bg-black/90 backdrop-blur-sm">
                        <Code className="h-3.5 w-3.5 mr-1" /> Draw Algorithm
                        Procedure
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
              <ChampionsLeagueSimulator />
            </CardContent>
          </Card>
        </section>

        {/* Counter Example */}
        <section id="counter-example" className="py-12 mb-12 scroll-mt-16">
          <Card className="shadow-xl border-0 overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="text-center">
              <Badge className="mx-auto mb-4 bg-[#0e1e5b]/10 text-[#0e1e5b] hover:bg-[#0e1e5b]/20 dark:bg-[#cfa749]/10 dark:text-[#cfa749] dark:hover:bg-[#cfa749]/20">
                Research Findings
              </Badge>
              <div className="flex items-center justify-center mb-4">
                <Lightbulb className="h-8 w-8 text-[#cfa749] mr-3" />
                <CardTitle className="text-2xl md:text-3xl font-bold text-[#0e1e5b] dark:text-white">
                  New Format Scheduling Challenges
                </CardTitle>
              </div>
              <CardDescription className="text-lg max-w-3xl mx-auto">
                Discovering the mathematical complexities in the new format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="justify-center mb-8">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
                  <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                    We study feasibility properties of the new format. Among
                    them we show that the scheduling issue cannot be ignored
                    when drawing the matchups. Below is a noncompact draw
                    outcome which satisfies all the pot and association
                    constraints, i.e the matches cannot be scheduled within the
                    eight match days.
                  </p>
                  <div className="flex justify-center mb-6">
                    <div className="relative group">
                      <img
                        src="/images/Contre-exemple-graph-legended.png"
                        alt="Counter-example graph showing Leipzig as a cut-vertex"
                        className="rounded-lg shadow-md w-full max-w-2xl h-auto border-4 border-white dark:border-slate-700 transition-all duration-300 group-hover:shadow-xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1e5b]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-end justify-center">
                        <Badge className="mb-4 bg-white/80 text-[#0e1e5b] hover:bg-white dark:bg-black/80 dark:text-white dark:hover:bg-black/90 backdrop-blur-sm">
                          <Flame className="h-3.5 w-3.5 mr-1" /> Key Finding
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Approach Section */}
        <section id="approach" className="py-12 mb-12 scroll-mt-16">
          <Card className="shadow-xl border-0 overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="text-center">
              <Badge className="mx-auto mb-4 bg-[#0e1e5b]/10 text-[#0e1e5b] hover:bg-[#0e1e5b]/20 dark:bg-[#cfa749]/10 dark:text-[#cfa749] dark:hover:bg-[#cfa749]/20">
                Methodology
              </Badge>
              <div className="flex items-center justify-center mb-4">
                <Compass className="h-8 w-8 text-[#cfa749] mr-3" />
                <CardTitle className="text-2xl md:text-3xl font-bold text-[#0e1e5b] dark:text-white">
                  Build Schedule First
                </CardTitle>
              </div>
              <CardDescription className="text-lg max-w-3xl mx-auto">
                A systematic method to ensure fair and feasible tournament
                scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="justify-center">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-8">
                  <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
                    In this approach, an 8-match-day schedule template is
                    created to meet all pot constraints. The template uses
                    placeholders. Teams are then assigned to these placeholders,
                    ensuring that all association constraints are satisfied. We
                    try to optimize sport fairness and maximize viewer interest
                    when building the template.
                  </p>
                  <div className="flex justify-center">
                    <div className="relative group">
                      <img
                        src="/images/template-schedule.png"
                        alt="Template schedule showing the assignment of teams to match days"
                        className="rounded-lg shadow-md w-full max-w-2xl h-auto border-4 border-white dark:border-slate-700 transition-all duration-300 group-hover:shadow-xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1e5b]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-end justify-center">
                        <Badge className="mb-4 bg-white/80 text-[#0e1e5b] hover:bg-white dark:bg-black/80 dark:text-white dark:hover:bg-black/90 backdrop-blur-sm">
                          <Zap className="h-3.5 w-3.5 mr-1" /> Template Design
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Numerical Values */}
        <section id="numerical-analysis" className="py-12 mb-12 scroll-mt-16">
          <Card className="shadow-xl border-0 overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="text-center">
              <Badge className="mx-auto mb-4 bg-[#0e1e5b]/10 text-[#0e1e5b] hover:bg-[#0e1e5b]/20 dark:bg-[#cfa749]/10 dark:text-[#cfa749] dark:hover:bg-[#cfa749]/20">
                Data Analysis
              </Badge>
              <div className="flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-[#cfa749] mr-3" />
                <CardTitle className="text-2xl md:text-3xl font-bold text-[#0e1e5b] dark:text-white">
                  Numerical Analysis
                </CardTitle>
              </div>
              <CardDescription className="text-lg max-w-3xl mx-auto">
                Quantifying fairness across different draw methodologies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="justify-center mb-8">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-8">
                  <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
                    We simulate a large number of draws (40,000) according to
                    several draw methods and then analyze the empirical
                    distribution of the average "strength" of each team's
                    opponents. This helps us quantify the fairness of different
                    approaches.
                  </p>
                  <div className="flex justify-center">
                    <div className="relative group">
                      <img
                        src="/images/luck-index.png"
                        alt="Graph showing luck index distribution across different draw methods"
                        className="rounded-lg shadow-md w-full max-w-2xl h-auto border-4 border-white dark:border-slate-700 transition-all duration-300 group-hover:shadow-xl"
                      />
                      <img
                        src="/images/dmf_ucl_uefa_scatterplot-1.png"
                        alt="Graph showing luck index distribution across different draw methods"
                        className="rounded-lg shadow-md w-full max-w-2xl h-auto border-4 border-white dark:border-slate-700 transition-all duration-300 group-hover:shadow-xl"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e1e5b]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-end justify-center">
                        <Badge className="mb-4 bg-white/80 text-[#0e1e5b] hover:bg-white dark:bg-black/80 dark:text-white dark:hover:bg-black/90 backdrop-blur-sm">
                          <Star className="h-3.5 w-3.5 mr-1" /> Statistical
                          Results
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="approach" className="py-12 mb-12 scroll-mt-16">
          <div className="shadow-xl overflow-hidden rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <div className="text-center pt-8 px-6">
              <div className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium mb-4 bg-blue-100 text-blue-900 dark:bg-amber-100/10 dark:text-amber-400">
                Discover More
              </div>
              <div className="flex items-center justify-center mb-4">
                <BookOpenText className="h-8 w-8 text-amber-500 mr-3" />
                <h2 className="text-2xl md:text-3xl font-bold text-blue-950 dark:text-white">
                  Research Paper
                </h2>
              </div>
              <p className="text-lg max-w-3xl mx-auto text-slate-600 dark:text-slate-300">
                Explore the mathematical foundations of our work, including
                format properties, graph theory results, and detailed fairness
                analyses.
              </p>
            </div>
            <div className="p-6 md:p-8">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 md:p-8 border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-4 text-blue-900 dark:text-amber-400">
                  Abstract
                </h3>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                    The league phase of the new UEFA Champions League gathers 36
                    soccer teams ranked in a single table. Each team faces only
                    eight opponents drawn randomly, subject to seeding pot and
                    association constraints. We investigate four methods for
                    drawing the league phase matchups:
                  </p>

                  <ol className="space-y-4 mb-6">
                    <li className="flex gap-3 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-blue-900 dark:text-amber-400">
                        First,
                      </span>
                      <div>
                        We analyze UEFA's official draw procedure where matchups
                        are drawn before scheduling. Using chromatic index
                        arguments from graph theory, we demonstrate that
                        scheduling cannot be ignored when drawing matchups, as
                        some valid draws become noncompact (impossible to
                        schedule within eight match days).
                      </div>
                    </li>

                    <li className="flex gap-3 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-blue-900 dark:text-amber-400">
                        Second,
                      </span>
                      <div>
                        We explore an alternative method that first builds a
                        schedule template satisfying pot constraints before
                        randomly populating it with teams. We prove the minimum
                        number of breaks equals 4 and explicitly construct a
                        template that minimizes breaks while optimizing fairness
                        and TV exposure.
                      </div>
                    </li>
                  </ol>

                  <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                    For both methods, we also examine randomized variations
                    where we shuffle the order of pots from which teams are
                    drawn or the order used to populate the schedule template.
                  </p>

                  <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                    Using integer programming to express draw constraints, we
                    run Monte Carlo simulations comparing these four methods for
                    the 2024–25 UEFA Champions League and Europa League. We
                    assess fairness by analyzing the distributions of opponents'
                    average strength and measure each procedure's impact on
                    matchup probabilities.
                  </p>

                  <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                    We introduce a luck index that objectively ranks teams from
                    luckiest to unluckiest during the actual draw. Additionally,
                    we provide examples of noncompact draw outcomes and derive
                    the minimum number of scheduling breaks for general setups
                    with multiple seeding pots.
                  </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                  <a
                    href="https://arxiv.com"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-blue-900 text-white hover:bg-blue-800 h-10 py-2 px-4 w-full sm:w-auto"
                  >
                    Read Full Article
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </div>

                <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  Julia code available at:{" "}
                  <a
                    href="https://julienguyon.github.io/UEFA-draws"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    julienguyon.github.io/UEFA-draws
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-slate-200 dark:border-slate-800 mt-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-6 md:mb-0">
                <div className="flex items-center justify-center md:justify-start">
                  <Trophy className="h-6 w-6 text-[#cfa749] mr-2" />
                  <span className="text-lg font-bold text-[#0e1e5b] dark:text-white">
                    Champions League Research
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  © 2024 All rights reserved
                </p>
              </div>

              <div className="grid grid-cols-2 md:flex md:space-x-6 gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#0e1e5b] hover:text-[#0e1e5b] hover:bg-[#0e1e5b]/10 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                  asChild
                >
                  <a href="#introduction">
                    <Calendar className="h-4 w-4 mr-2" />
                    Overview
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#0e1e5b] hover:text-[#0e1e5b] hover:bg-[#0e1e5b]/10 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                  asChild
                >
                  <a href="#simulator">
                    <Dices className="h-4 w-4 mr-2" />
                    Simulator
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#0e1e5b] hover:text-[#0e1e5b] hover:bg-[#0e1e5b]/10 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                  asChild
                >
                  <a href="#counter-example">
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Research
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#0e1e5b] hover:text-[#0e1e5b] hover:bg-[#0e1e5b]/10 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
                  asChild
                >
                  <a href="#numerical-analysis">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analysis
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
