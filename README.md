# ⚽ UEFA Champions League Draw Simulation

<p align="center">
  <img src="https://socialify.git.ci/JulienGuyon/UEFA-league-phase-draw/image?name=1&owner=1&stargazers=1&theme=Light" alt="project-image">
</p>

## 📖 Project Overview

This repository contains advanced tools to simulate the UEFA Champions League League Phase Draw using two distinct methods:

- **Schedule-First Approach**: Create an optimized 8-matchday schedule with placeholders, then assign teams ensuring all constraints are satisfied.
- **Matches-First Approach**: Sequentially draw matchups for each team, ensuring compliance with constraints before scheduling match days.

Implemented in **Julia** with **JuMP** and the **Integer Linear Programming solver**.

<p align="center">
  <img src="https://img.shields.io/badge/Website-React_TypeScript_Vite-blue.svg" alt="Website Badge">
  <img src="https://img.shields.io/badge/Simulation-Julia_MILP_JuMP-green.svg" alt="Simulation Badge">
</p>

## 🌟 Key Features

- **Simulate Champions League Draws** with realistic constraints.
- **Calculate Average Opponent Strength** and build a Luck Index
- **Determine Matchup Probabilities** between any two teams.
- **Compare Scheduling Methods** to evaluate different strength distribution
- **Build a Counter-example** i.e a draw that satisfies all constraints but cannot be scheduled oin the eigth allocated days.

## ⚙️ Scheduling Methods

### 📅 Schedule-First Method

- Pre-build an 8-day schedule template with team placeholders.
- Assign teams to placeholders respecting pot, home-away alternation, and country constraints.
- Optimized via MILP with Gurobi, ensuring minimal home/away breaks, even distribution of important match, equal repartition of team's strenght over the match days.

### 🔄 Matches-First Method

- Sequentially draw matchups ensuring feasibility before assigning match days.
- Suitable for scenarios needing high flexibility, such as stadium availability or weather considerations.

## 🔍 Constraint Management

- Each team plays exactly 8 matches (one home and one away against teams from each pot).
- Maximum of two matches against teams from the same association.
- Two teams from the same association cannot meet.
- Matches should be scheduled across eight match days.

## 📂 Project Structure

```bash
├── RandomDraw/
│   ├── conter-example_with_teams_oriented.html   // html page to display conter-example graph
│   ├── fill_conter_example.jl                    // code to attribute teams to placeholders
│   ├── Manifest.toml
│   ├── Project.toml
│   ├── Build_Schedule_First/
│   │   ├── draw_build_schedule_first.jl                //perform a draw to fill the 'optimal' template
│   │   └── template_optimal_break.jl                   // build an optimal template
│   │
│   └── Draw_Matchups_First/
│       └── draw_matchups_first.jl
│
├── RandomDrawSite/
│   ├── // src code for the presentation website
│
├── docs/                                        // built website in production
├── .gitignore
├── LICENSE.md
└── README.md


```

## 🚀 Installation Steps

1. First install Julia [here](https://julialang.org/downloads/)

2. Clone this repository:

```bash
git clone https://github.com/JulienGuyon/UEFA-league-phase-draw.git
cd UEFA-league-phase-draw
```

2. Install dependencies that are in the Project.toml

```bash
cd RandomDraw
julia --project=. -e 'using Pkg; Pkg.instantiate()'
```

3. Install solvers libraries according to your use case:

- We recommand you to use[Gurobi](https://www.gurobi.com/academia/academic-program-and-licenses/?gad_source=1&gbraid=0AAAAA-OoJU5SOyC2JNFoxuC1C0zIYs26i&gclid=Cj0KCQjwnui_BhDlARIsAEo9GutfSKCbMJqlXuaF-Z8kxed7jLt7P8BJa5jAaDCsOLAdRwWVI7UFtaIaAq_0EALw_wcB). You will need a license to use this solver.
- Otherwise you can use [SCIP](https://github.com/scipopt/SCIP.jl) solver that is open-sourced.

## 🌐 Web Application

The web application built with **React**, **TypeScript**, and **Vite** allows interactive exploration of simulation results and visual analytics.

1. We use `npm` as a package manager. Please install it [here](https://docs.npmjs.com/cli/v8/commands/npm-install)

2. Run locally:

```bash
cd RandomDrawSite
npm install
npm run dev
```

3. The application runs [here](http://localhost:5173) in localhost port 5173.

## 📖 Article

Find the results of our simulations and way more results about uefa league phase graph properties by looking at our paper !

## 🤝 Contribution Guidelines

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/new-feature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Open a Pull Request.

## 👥 Authors

- **Adle Ben Salem**
- **Thomas Buchholtzer**
- **Julien Guyon**
- **Mathieu Tanré**

## 📜 License

This project is licensed under the **Apache License 2.0**.
