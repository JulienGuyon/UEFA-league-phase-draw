import time
from ortools.sat.python import cp_model
import random
import numpy as np
import concurrent.futures


class Team:
    def __init__(self, club, nationality, elo, uefa):
        self.club = club
        self.nationality = nationality
        self.elo = elo
        self.uefa = uefa


class TeamsContainer:
    def __init__(self, potA, potB, potC, potD):
        self.potA = potA
        self.potB = potB
        self.potC = potC
        self.potD = potD
        # Build the index dictionary
        self.index = {}
        for pot in (self.potA, self.potB, self.potC, self.potD):
            for team in pot:
                self.index[team.club] = team


class Constraint:
    def __init__(self, played_home=None, played_ext=None, nationalities=None):
        self.played_home = played_home if played_home is not None else set()
        self.played_ext = played_ext if played_ext is not None else set()
        self.nationalities = nationalities if nationalities is not None else {}


def create_teams_container(potA, potB, potC, potD):
    return TeamsContainer(potA, potB, potC, potD)


def create_club_index(teams):
    club_index = {}
    for i, pot in enumerate((teams.potA, teams.potB, teams.potC, teams.potD)):
        for j, team in enumerate(pot):
            club_index[team.club] = (i * 9) + j + 1
    return club_index


def get_li_nationalities(teams):
    nationalities = set()
    for pot in (teams.potA, teams.potB, teams.potC, teams.potD):
        for team in pot:
            nationalities.add(team.nationality)
    return nationalities


def get_club_index_from_team_name(team_name, club_index):
    return club_index[team_name]


def get_team_from_club_index(team_index, teams):
    pot_index = (team_index - 1) // 9  # Determine the pot (0 to 3)
    team_index_in_pot = (team_index - 1) % 9  # Determine the index in the pot (0 to 8)

    # Get the correct pot based on pot_index
    if pot_index == 0:
        return teams.potA[team_index_in_pot]
    elif pot_index == 1:
        return teams.potB[team_index_in_pot]
    elif pot_index == 2:
        return teams.potC[team_index_in_pot]
    elif pot_index == 3:
        return teams.potD[team_index_in_pot]
    else:
        raise ValueError("Index out of bounds")


def get_team_nationality(index, teams):
    team = get_team_from_club_index(index, teams)
    return team.nationality


def get_team_from_name(team_name, teams):
    return teams.index[team_name]


def get_pot_from_team(team, teams):
    if team in teams.potA:
        return teams.potA
    elif team in teams.potB:
        return teams.potB
    elif team in teams.potC:
        return teams.potC
    elif team in teams.potD:
        return teams.potD
    else:
        raise ValueError("Team does not belong to any pot")


def initialize_constraints(all_nationalities, teams):
    constraints = {}
    for pot in (teams.potA, teams.potB, teams.potC, teams.potD):
        for team in pot:
            # Initialize all nationalities to 0 for each team
            team_nationalities = {nat: 0 for nat in all_nationalities}
            # Set the team's own nationality to 2
            team_nationalities[team.nationality] = 2

            # Create a Constraint instance for each team
            constraints[team.club] = Constraint(
                set(),  # played_home initialized as an empty Set
                set(),  # played_ext initialized as an empty Set
                team_nationalities,  # nationalities dictionary
            )
    return constraints


def update_constraints(home, away, constraints):
    if (
        away.club in constraints[home.club].played_home
        or home.club in constraints[away.club].played_ext
    ):
        print(f"Warning: Match already played. Home: {home.club}, Away: {away.club}")
    elif (
        away.club in constraints[home.club].played_home
        and home.club not in constraints[away.club].played_ext
    ):
        print(
            f"Error: Match played at home but not away. Home: {home.club}, Away: {away.club}"
        )
    elif (
        away.club not in constraints[home.club].played_home
        and home.club in constraints[away.club].played_ext
    ):
        print(
            f"Error: Match played away but not at home. Home: {home.club}, Away: {away.club}"
        )
    else:
        constraints[home.club].nationalities[away.nationality] += 1
        constraints[away.club].nationalities[home.nationality] += 1
        constraints[home.club].played_home.add(away.club)
        constraints[away.club].played_ext.add(home.club)


def solve_problem(
    selected_team, constraints, new_match, teams, club_index, all_nationalities
):
    model = cp_model.CpModel()

    T = 8  # Number of matchdays
    N = 36  # Number of teams

    # Create binary variables for matches
    match_vars = {}
    for i in range(1, N + 1):
        for j in range(1, N + 1):
            for t in range(1, T + 1):
                match_vars[(i, j, t)] = model.NewBoolVar(f"match_{i}_{j}_{t}")

    # A team cannot play against itself
    for i in range(1, N + 1):
        for t in range(1, T + 1):
            model.Add(match_vars[(i, i, t)] == 0)

    # Each pair of teams plays at most once
    for i in range(1, N + 1):
        for j in range(1, N + 1):
            if i != j:
                matches = []
                for t in range(1, T + 1):
                    matches.append(match_vars[(i, j, t)])
                    matches.append(match_vars[(j, i, t)])
                model.Add(sum(matches) <= 1)

    # Specific constraints for each pot
    for pot_start in range(1, 28 + 1, 9):
        for i in range(1, N + 1):
            # Each team plays home against one team from each pot
            home_matches = []
            for j in range(pot_start, pot_start + 9):
                for t in range(1, T + 1):
                    home_matches.append(match_vars[(i, j, t)])
            model.Add(sum(home_matches) == 1)

            # Each team plays away against one team from each pot
            away_matches = []
            for j in range(pot_start, pot_start + 9):
                for t in range(1, T + 1):
                    away_matches.append(match_vars[(j, i, t)])
            model.Add(sum(away_matches) == 1)

    # Constraint for the initially selected admissible match
    home_idx = get_club_index_from_team_name(new_match[0].club, club_index)
    away_idx = get_club_index_from_team_name(new_match[1].club, club_index)
    selected_team_idx = get_club_index_from_team_name(selected_team.club, club_index)

    model.Add(
        sum(match_vars[(selected_team_idx, home_idx, t)] for t in range(1, T + 1)) == 1
    )
    model.Add(
        sum(match_vars[(away_idx, selected_team_idx, t)] for t in range(1, T + 1)) == 1
    )

    # Applying constraints based on previously played matches
    for club, club_constraints in constraints.items():
        club_idx = get_club_index_from_team_name(club, club_index)

        # Home matches
        for home_club in club_constraints.played_home:
            home_idx = get_club_index_from_team_name(home_club, club_index)
            model.Add(
                sum(match_vars[(club_idx, home_idx, t)] for t in range(1, T + 1)) == 1
            )

        # Away matches
        for away_club in club_constraints.played_ext:
            away_idx = get_club_index_from_team_name(away_club, club_index)
            model.Add(
                sum(match_vars[(away_idx, club_idx, t)] for t in range(1, T + 1)) == 1
            )

    # Nationality constraints
    # Match cannot happen if the teams are from the same nationality
    for i, pot_i in enumerate((teams.potA, teams.potB, teams.potC, teams.potD)):
        for j, team_j in enumerate(pot_i):
            team_idx = (i * 9) + j + 1
            for k, pot_k in enumerate((teams.potA, teams.potB, teams.potC, teams.potD)):
                for l, team_l in enumerate(pot_k):
                    opponent_idx = (k * 9) + l + 1
                    if (
                        team_j.nationality == team_l.nationality
                        and team_idx != opponent_idx
                    ):
                        for t in range(1, T + 1):
                            model.Add(match_vars[(team_idx, opponent_idx, t)] == 0)

    # Limit the number of matches against the same nationality to 2
    for nationality in all_nationalities:
        for i in range(1, N + 1):
            nationality_matches = []
            for j in range(1, N + 1):
                if get_team_nationality(j, teams) == nationality:
                    for t in range(1, T + 1):
                        nationality_matches.append(match_vars[(i, j, t)])
                        nationality_matches.append(match_vars[(j, i, t)])
            model.Add(sum(nationality_matches) <= 2)

    # Solve the problem
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10  # Set a time limit

    status = solver.Solve(model)

    # Check if the model is feasible
    if status == cp_model.INFEASIBLE:
        return False
    elif status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        return True
    elif status == cp_model.MODEL_INVALID:
        print("Model is invalid")
        return False
    elif status == cp_model.UNKNOWN:
        print("Unknown status or timed out")
        return False
    else:
        print(f"Unexpected solver status: {status}")
        return False


def get_team_already_played_home(selected_team, opponent_group, constraints):
    set_home_selected_team_name = constraints[selected_team.club].played_home
    for home_club_name in set_home_selected_team_name:
        for home_team in opponent_group:
            if home_team.club == home_club_name:
                return home_team
    return None


def get_team_already_played_away(selected_team, opponent_group, constraints):
    set_away_selected_team_name = constraints[selected_team.club].played_ext
    for away_club_name in set_away_selected_team_name:
        for away_team in opponent_group:
            if away_team.club == away_club_name:
                return away_team
    return None


def true_admissible_matches(
    selected_team, opponent_group, constraints, teams, club_index, all_nationalities
):
    true_matches = []

    # Check if we already have selected opponents for the selected team in the considered pot
    home_team = get_team_already_played_home(selected_team, opponent_group, constraints)
    away_team = get_team_already_played_away(selected_team, opponent_group, constraints)

    selected_team_pot = get_pot_from_team(selected_team, teams)

    # If we already have selected the match, just return the couple (home, away)
    if home_team is not None and away_team is not None:
        if home_team.club == away_team.club:
            raise ValueError(
                f"Home Opponent and Away Opponent for {selected_team.club} in pot {opponent_group} are the same teams"
            )

        print(
            f"Returned home-away opponent already selected ({home_team.club}, {away_team.club})"
        )

        away_opponent_of_home = get_team_already_played_away(
            home_team, selected_team_pot, constraints
        )
        if (
            away_opponent_of_home is None
            or away_opponent_of_home.club != selected_team.club
        ):
            raise ValueError(
                f"Constraint inconsistency: {selected_team.club} has played home against {home_team.club} but {home_team.club} has not played away against {selected_team.club}"
            )

        if not solve_problem(
            selected_team,
            constraints,
            (home_team, away_team),
            teams,
            club_index,
            all_nationalities,
        ):
            raise ValueError("Can't find a solution with the already selected match")

        return [(home_team, away_team)]

    # If we don't know any of the opponents, check for each home,away pair if it can be a valid match
    if home_team is None and away_team is None:
        for home in opponent_group:
            for away in opponent_group:
                # Skip if they are the same team
                if home.club == away.club:
                    continue

                # Skip if one of the opponents has the same nationality as the selected team
                if (
                    home.nationality == selected_team.nationality
                    or away.nationality == selected_team.nationality
                ):
                    continue

                # Skip if one of the teams has already played against two team of same nationality
                if (
                    constraints[selected_team.club].nationalities.get(
                        home.nationality, 0
                    )
                    > 2
                    or constraints[selected_team.club].nationalities.get(
                        away.nationality, 0
                    )
                    > 2
                    or constraints[home.club].nationalities.get(
                        selected_team.nationality, 0
                    )
                    > 2
                    or constraints[away.club].nationalities.get(
                        selected_team.nationality, 0
                    )
                    > 2
                ):
                    continue

                # Skip if one of the opponents has already played against the pot of the selected team its home/away match
                if (
                    get_team_already_played_away(home, selected_team_pot, constraints)
                    is not None
                    or get_team_already_played_home(
                        away, selected_team_pot, constraints
                    )
                    is not None
                ):
                    continue

                match = (home, away)
                # Check if we can find a solution with this couple
                if solve_problem(
                    selected_team,
                    constraints,
                    match,
                    teams,
                    club_index,
                    all_nationalities,
                ):
                    true_matches.append(match)

    # Since away_team is already known, we only need to find a home_team
    elif home_team is None and away_team is not None:
        for home in opponent_group:
            if (
                home != away_team
                and home.nationality != selected_team.nationality
                and away_team.nationality != selected_team.nationality
                and constraints[selected_team.club].nationalities.get(
                    home.nationality, 0
                )
                <= 2
                and constraints[home.club].nationalities.get(
                    selected_team.nationality, 0
                )
                <= 2
                and get_team_already_played_away(home, selected_team_pot, constraints)
                is None
            ):
                match = (home, away_team)
                if solve_problem(
                    selected_team,
                    constraints,
                    match,
                    teams,
                    club_index,
                    all_nationalities,
                ):
                    true_matches.append(match)

    # Since home_team is already known, we only need to find an away_team
    elif home_team is not None and away_team is None:
        for away in opponent_group:
            if (
                home_team.club != away.club
                and home_team.nationality != selected_team.nationality
                and away.nationality != selected_team.nationality
                and constraints[selected_team.club].nationalities.get(
                    away.nationality, 0
                )
                <= 2
                and constraints[away.club].nationalities.get(
                    selected_team.nationality, 0
                )
                <= 2
                and get_team_already_played_home(away, selected_team_pot, constraints)
                is None
            ):
                match = (home_team, away)
                if solve_problem(
                    selected_team,
                    constraints,
                    match,
                    teams,
                    club_index,
                    all_nationalities,
                ):
                    true_matches.append(match)

    return true_matches


def uefa_draw(teams, club_index, all_nationalities, nb_draw=1):
    elo_opponents = np.zeros((36, nb_draw), dtype=float)
    uefa_opponents = np.zeros((36, nb_draw), dtype=float)
    matches = np.zeros((36, 8, nb_draw), dtype=int)

    def run_single_draw(s):
        constraints = initialize_constraints(all_nationalities, teams)
        for pot_index in range(1, 5):
            # Access the selected pot from A to D
            if pot_index == 1:
                pot = teams.potA
            elif pot_index == 2:
                pot = teams.potB
            elif pot_index == 3:
                pot = teams.potC
            elif pot_index == 4:
                pot = teams.potD

            indices = list(range(1, 10))
            random.shuffle(indices)
            for i in indices:
                selected_team = pot[i - 1]

                for idx_opponent_pot in range(1, 5):
                    if idx_opponent_pot == 1:
                        opponent_pot = teams.potA
                    elif idx_opponent_pot == 2:
                        opponent_pot = teams.potB
                    elif idx_opponent_pot == 3:
                        opponent_pot = teams.potC
                    elif idx_opponent_pot == 4:
                        opponent_pot = teams.potD

                    admissible_matches = true_admissible_matches(
                        selected_team,
                        opponent_pot,
                        constraints,
                        teams,
                        club_index,
                        all_nationalities,
                    )
                    if not admissible_matches:
                        print(
                            f"No admissible matches found for {selected_team.club} in pot {idx_opponent_pot}"
                        )
                        return None

                    home, away = random.choice(admissible_matches)

                    selected_team_idx = get_club_index_from_team_name(
                        selected_team.club, club_index
                    )
                    home_idx = get_club_index_from_team_name(home.club, club_index)
                    away_idx = get_club_index_from_team_name(away.club, club_index)

                    matches[selected_team_idx - 1, 2 * idx_opponent_pot - 2, s] = (
                        home_idx
                    )
                    matches[selected_team_idx - 1, 2 * idx_opponent_pot - 1, s] = (
                        away_idx
                    )

                    elo_opponents[selected_team_idx - 1, s] += away.elo + home.elo
                    uefa_opponents[selected_team_idx - 1, s] += away.uefa + home.uefa

                    update_constraints(selected_team, home, constraints)
                    update_constraints(away, selected_team, constraints)

        return True

    # Run draws in parallel with a thread pool
    with concurrent.futures.ThreadPoolExecutor(max_workers=min(nb_draw, 8)) as executor:
        futures = [executor.submit(run_single_draw, s) for s in range(nb_draw)]
        successful_draws = 0

        for s, future in enumerate(concurrent.futures.as_completed(futures)):
            if future.result():
                successful_draws += 1

    print(f"Successfully completed {successful_draws} out of {nb_draw} draws")

    # Save results to files
    with open("draws_draw_matchups_first_elo_bis_py.txt", "a") as file:
        for i in range(nb_draw):
            row = " ".join(map(str, elo_opponents[:, i]))
            file.write(row + "\n")

    with open("draws_draw_matchups_first_uefa_bis_py.txt", "a") as file:
        for i in range(nb_draw):
            row = " ".join(map(str, uefa_opponents[:, i]))
            file.write(row + "\n")

    with open("matches_draw_matchups_first_bis_py.txt", "a") as file:
        for i in range(nb_draw):
            for team in range(36):
                home_matches = [
                    f"({team + 1}, {int(matches[team, k, i])})" for k in range(0, 8, 2)
                ]
                home_row = " ".join(home_matches)
                file.write(home_row + " ")
                away_matches = [
                    f"({int(matches[team, k, i])}, {team + 1})" for k in range(1, 8, 2)
                ]
                away_row = " ".join(away_matches)
                file.write(away_row + " ")
            file.write("\n")

    return 0


# Example usage:
def run_example():
    potA = (
        Team("Real", "Spain", 1985, 136),
        Team("ManCity", "England", 2057, 148),
        Team("Bayern", "Germany", 1904, 144),
        Team("PSG", "France", 1893, 116),
        Team("Liverpool", "England", 1908, 114),
        Team("Inter", "Italy", 1960, 101),
        Team("Dortmund", "Germany", 1874, 97),
        Team("Leipzig", "Germany", 1849, 97),
        Team("Barcelona", "Spain", 1894, 91),
    )

    potB = (
        Team("Leverkusen", "Germany", 1929, 90),
        Team("Atlético", "Spain", 1830, 89),
        Team("Atalanta", "Italy", 1879, 81),
        Team("Juventus", "Italy", 1839, 80),
        Team("Benfica", "Portugal", 1824, 79),
        Team("Arsenal", "England", 1957, 72),
        Team("Brugge", "Belgium", 1703, 64),
        Team("Shakhtar", "Ukraine", 1573, 63),
        Team("Milan", "Italy", 1821, 59),
    )

    potC = (
        Team("Feyenoord", "Netherlands", 1747, 57),
        Team("Sporting", "Portugal", 1824, 54.5),
        Team("Eindhoven", "Netherlands", 1794, 54),
        Team("Dinamo", "Croatia", 1584, 50),
        Team("Salzburg", "Austria", 1693, 50),
        Team("Lille", "France", 1785, 47),
        Team("Crvena", "Serbia", 1734, 40),
        Team("YB", "Switzerland", 1566, 34.5),
        Team("Celtic", "Scotland", 1646, 32),
    )

    potD = (
        Team("Bratislava", "Slovakia", 1703, 30.5),
        Team("Monaco", "France", 1780, 24),
        Team("Sparta", "Czech Republic", 1716, 22.5),
        Team("Aston Villa", "England", 1772, 20.86),
        Team("Bologna", "Italy", 1777, 18.056),
        Team("Girona", "Spain", 1791, 17.897),
        Team("Stuttgart", "Germany", 1795, 17.324),
        Team("Sturm Graz", "Austria", 1610, 14.500),
        Team("Brest", "France", 1685, 13.366),
    )

    # Create teams container
    teams = create_teams_container(potA, potB, potC, potD)

    # Create club index
    club_index = create_club_index(teams)

    # Get all nationalities
    all_nationalities = get_li_nationalities(teams)

    # Run the UEFA draw
    uefa_draw(teams, club_index, all_nationalities, nb_draw=1)


if __name__ == "__main__":
    begin = time.time()
    run_example()
    end = time.time()
    print(f"Execution time: {end - begin} seconds")
