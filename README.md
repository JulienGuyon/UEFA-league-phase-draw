# Champions League Draw Scheduler - README

## Project Overview

This project implements two distinct methodologies for scheduling matches in the UEFA Champions League, with a focus on optimizing the draw of matches for 36 teams, divided into four pots. The scheduling must adhere to several constraints, including nationality-based restrictions and ensuring an even distribution of matches across eight match days. The project was developed as part of the IMI Project by Adle Ben Salem, Thomas Buchholtzer, and Mathieu Tanré, under the supervision of Julien Guyon and Frédéric Meunier.

## Project Structure

The repository contains the implementation of both scheduling approaches:

- **Method 1: Schedule-First Approach**
  - A pre-defined 8-day schedule is created with placeholders for teams. Teams are then assigned to these placeholders while adhering to the constraints, including playing against different pots and maintaining home-away alternation.
  - This method involves solving a linear programming problem using the Gurobi solver to optimize the schedule.

- **Method 2: Matches-First Approach**
  - Matches are drawn sequentially for each team, ensuring that the drawn matches adhere to the constraints before scheduling the match days.
  - The Gurobi solver is used to optimize the match selection, ensuring feasibility and respecting the competition's constraints.
  - This method offers greater flexibility for real-world scheduling scenarios, such as stadium availability or weather conditions.

## Key Features

1. **Constraints Management**:
   - Each team plays exactly 8 matches: 2 against teams from each pot.
   - No team can play against teams from the same country more than twice.
   - Matches are evenly distributed across the eight match days.
   - Teams experience a balance of home and away games, with minimal "breaks" (consecutive home or away games).
   
2. **Optimization with Gurobi**:
   - The project leverages the Gurobi solver to manage complex scheduling constraints and optimize the draw process.
   - The schedule-first method focuses on balancing the calendar, while the matches-first method allows for more flexible real-world adjustments.

3. **Graph Theory Application**:
   - Graph theory is used to verify the feasibility of match scheduling, ensuring that the draw avoids creating deadlocks and that matches can be scheduled within eight days.

## Files and Directories

- TO DO

## Usage



## Future Work

## Authors

- Adle Ben Salem
- Thomas Buchholtzer
- Mathieu Tanré

Supervised by:
- Julien Guyon
- Frédéric Meunier

---

This project demonstrates advanced scheduling techniques using linear programming and graph theory to handle complex, real-world constraints for one of the most prestigious football tournaments in Europe.
