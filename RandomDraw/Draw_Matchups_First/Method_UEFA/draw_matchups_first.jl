############################################ IMPORTS ############################################
if isdefined(Main, :Gurobi) || Base.find_package("Gurobi") !== nothing
	using Gurobi
end
using JuMP, SCIP, ConstraintSolver, MathOptInterface, CSV, DataFrames, Random, Base.Threads, Logging
####################################### CONFIG VARIABLES #######################################
const SOLVER = "CONSTRAINT_SOLVER" # Alternative: "Gurobi", "CONSTRAINT_SOLVER"
const LEAGUE = "CHAMPIONS_LEAGUE" # Alternative: "EUROPA_LEAGUE"
const NB_DRAWS = 1
const DEBUG = false
####################################### GLOBAL VARIABLES #######################################
# using Gurobi
# We set up once the SOLVER environment only once 
if SOLVER == "Gurobi"
	const env = Gurobi.Env(
		Dict{String, Any}(
			"OutputFlag" => 0,    # Suppress console output
			"LogToConsole" => 0,   # No logging to console
		),
	)
elseif SOLVER == "SCIP"
	# Syntax found here: https://jump.dev/JuMP.jl/stable/manual/models/#Solvers-which-expect-environments
	const env = SCIP.Optimizer

elseif SOLVER == "CONSTRAINT_SOLVER"
	const CS = ConstraintSolver
	const env = CS.Optimizer

else
	error("Invalid SOLVER. Please chose between 'Gurobi', 'SCIP' or 'CONSTRAINT_SOLVER'")
end

#Show the configuration of the draws
@info ("Nombre de threads utilisés : ", Threads.nthreads())
@info "Starting Draw with $NB_DRAWS draws, for $LEAGUE, using $SOLVER solver"
if DEBUG == false
	Logging.disable_logging(Logging.Info) # Disable debug and info
end

"""
Represents a football team with its attributes:
- `club`: The name of the club.
- `nationality`: The nationality of the club.
- `elo`: The Elo rating of the team at the time of the official draw.
- `uefa`: The UEFA coefficient of the team at the time of the official draw.
"""
struct Team
	club::String
	nationality::String
	elo::Int
	uefa::Float64
end

"""
Represents a container for team pots:
- `potA`, `potB`, `potC`, `potD`: Each pot is a tuple of 9 teams.
- `index`: A dictionary mapping team names to their corresponding `Team` object 
		   for easy access.
"""
struct TeamsContainer
	potA::NTuple{9, Team}
	potB::NTuple{9, Team}
	potC::NTuple{9, Team}
	potD::NTuple{9, Team}
	index::Dict{String, Team}
end

"""
Represents constraints for a specific team:
- `played_home`: A set of team names this team has already played at home.
- `played_ext`: A set of team names this team has already played away.
- `nationalities`: A dictionary tracking the number of times the team has played against 
				   teams of a specific nationality. According to UEFA rules, a team cannot
				   play more than twice against teams of the same nationality. During 
				   initialization, the value is set to 2 for the team's own nationality.
"""
struct Constraint
	played_home::Set{String}
	played_ext::Set{String}
	nationalities::Dict{String, Int}
end


# to create an instance of TeamsContainer
function create_teams_container(
	potA::NTuple{9, Team},
	potB::NTuple{9, Team},
	potC::NTuple{9, Team},
	potD::NTuple{9, Team},
)::TeamsContainer
	# Build the index dictionary
	index = Dict(team.club => team for pot in (potA, potB, potC, potD) for team in pot)
	# Create and return the TeamsContainer instance
	return TeamsContainer(potA, potB, potC, potD, index)
end

if LEAGUE == "EUROPA_LEAGUE"
	const potA = (
		Team("Roma", "Italy", 1812, 101),
		Team("Man Utd", "England", 1779, 92),
		Team("Porto", "Portugal", 1778, 77),
		Team("Ajax", "Netherlands", 1619, 67),
		Team("Rangers", "Scotland", 1618, 63),
		Team("Frankfurt", "Germany", 1697, 60),
		Team("Lazio", "Italy", 1785, 54),
		Team("Tottenham", "England", 1791, 54),
		Team("Slavia Praha", "Czech Republic", 1702, 53),
	)

	const potB = (
		Team("Real Sociedad", "Spain", 1767, 51),
		Team("Olympiacos", "Greece", 1639, 50),
		Team("AZ Alkmaar", "Netherlands", 1591, 50),
		Team("Braga", "Portugal", 1636, 49),
		Team("Lyon", "France", 1713, 44),
		Team("PAOK", "Greece", 1639, 37),
		Team("Fenerbahçe", "Turkey", 1714, 36),
		Team("M. Tel-Aviv", "Israel", 1614, 35.5),
		Team("Ferencvaros", "Hungary", 1479, 35),
	)

	const potC = (
		Team("Qarabag", "Azerbaijan", 1597, 33),
		Team("Galatasaray", "Turkey", 1721, 31.5),
		Team("Viktoria Plzen", "Czech Republic", 1572, 28),
		Team("Bodo/Glimt", "Norway", 1598, 28),
		Team("Union SG", "Belgium", 1701, 27),
		Team("Dynamo Kyiv", "Ukraine", 1517, 26.5),
		Team("Ludogorets", "Bulgaria", 1512, 26),
		Team("Midtjylland", "Denmark", 1624, 25.5),
		Team("Malmo", "Sweden", 1493, 18.5),
	)

	const potD = (
		Team("Athletic Club", "Spain", 1764, 17.897),
		Team("Hoffenheim", "Germany", 1683, 17.324),
		Team("Nice", "France", 1703, 17),
		Team("Anderlecht", "Belgium", 1640, 14.5),
		Team("Twente", "Netherlands", 1627, 12.650),
		Team("Besiktas", "Turkey", 1484, 12),
		Team("FCSB", "Romania", 1434, 10.5),
		Team("RFS", "Latvia", 1225, 8),
		Team("Elfsborg", "Sweden", 1403, 4.3),
	)
elseif LEAGUE == "CHAMPIONS_LEAGUE"
	# Champions League Teams
	const potA = (
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

	const potB = (
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

	const potC = (
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

	const potD = (
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
else
	error(`Invalid league. Received: $LEAGUE`)
end

# Add a test to check if we did not miss a team
@assert (length(potA) === 9 && length(potB) === 9 && length(potC) === 9 && length(potD) === 9)


const teams = create_teams_container(potA, potB, potC, potD)

#################### TYPE DE TEAMS  #################################################################

"""
The below function create a dictionary to get the rank of a team from its name
"""
function create_club_index(teams::TeamsContainer)::Dict{String, Int}
	club_index = Dict{String, Int}()
	for (i, pot) in enumerate((teams.potA, teams.potB, teams.potC, teams.potD))
		for (j, team) in enumerate(pot)
			club_index[team.club] = (i - 1) * 9 + j
		end
	end
	return club_index
end

const club_index = create_club_index(teams)

"""
Get a set with all unique nationalities present in the league
"""
function get_li_nationalities(teams::TeamsContainer)::Set{String}
	nationalities = Set{String}()
	for pot in (teams.potA, teams.potB, teams.potC, teams.potD)
		for team in pot
			push!(nationalities, team.nationality)
		end
	end
	return nationalities
end

const all_nationalities = get_li_nationalities(teams)

function get_club_index_from_team_name(team_name::String)::Int
	return club_index[team_name]
end

function get_team_from_club_index(team_index::Int)::Team
	pot_index = div(team_index - 1, 9) + 1  # Détermine le pot (1 à 4)
	team_index = (team_index - 1) % 9 + 1   # Détermine l'index dans le pot (1 à 9)

	# Récupérer le bon pot en fonction de pot_index
	if pot_index == 1
		return teams.potA[team_index]
	elseif pot_index == 2
		return teams.potB[team_index]
	elseif pot_index == 3
		return teams.potC[team_index]
	elseif pot_index == 4
		return teams.potD[team_index]
	else
		error("Index out of bounds")
	end
end



"""
Having a club_index, we return the nationality of the corresponding team
"""
function get_team_nationality(index::Int)::String
	team = get_team_from_club_index(index)
	return team.nationality
end

function get_team_from_name(team_name::String)::Team
	return teams.index[team_name]
end

function get_pot_from_team(team::Team)::NTuple{9, Team}
	if team in teams.potA
		return teams.potA
	elseif team in teams.potB
		return teams.potB
	elseif team in teams.potC
		return teams.potC
	elseif team in teams.potD
		return teams.potD
	else
		error("Team does not belong to any pot")
	end
end





function initialize_constraints(all_nationalities::Set{String})::Dict{String, Constraint}
	constraints = Dict{String, Constraint}()
	for pot in (teams.potA, teams.potB, teams.potC, teams.potD)
		for team in pot
			# Initialize all nationalities to 0 for each team
			team_nationalities = Dict(nat => 0 for nat in all_nationalities)
			# Set the team's own nationality to 2
			team_nationalities[team.nationality] = 2

			# Create a Constraint instance for each team
			constraints[team.club] = Constraint(
				Set{String}(),         # played_home initialized as an empty Set
				Set{String}(),         # played_ext initialized as an empty Set
				team_nationalities,     # nationalities dictionnary
			)
		end
	end
	return constraints
end
"""
Update the constraints based on the new match:
  -home is the team playing at home
  -away is the team playing away
We first check that the match in argument is not already in the constraints before updating
																			the constraints.
"""
function update_constraints(home::Team, away::Team, constraints::Dict{String, Constraint})
	if (away.club in constraints[home.club].played_home) || (home.club in constraints[away.club].played_ext)
		@warn "Match already played. Home: $(home.club), Away: $(away.club)"
	elseif ((away.club in constraints[home.club].played_home) && (home.club ∉ constraints[away.club].played_ext))
		@error "Match played at home but not away. Home: $(home.club), Away: $(away.club)"
	elseif ((away.club ∉ constraints[home.club].played_home) && (home.club in constraints[away.club].played_ext))
		@error "Match played away but not at home. Home: $(home.club), Away: $(away.club)"
	else
		constraints[home.club].nationalities[away.nationality] += 1
		constraints[away.club].nationalities[home.nationality] += 1
		push!(constraints[home.club].played_home, away.club)
		push!(constraints[away.club].played_ext, home.club)
	end
end

function silence_output(f::Function)
	original_stdout = stdout
	original_stderr = stderr
	redirect_stdout(devnull)
	redirect_stderr(devnull)
	try
		return f()
	finally
		redirect_stdout(original_stdout)
		redirect_stderr(original_stderr)
	end
end

####################################### OPTIMIZED SOLVER FUNCTION #######################################
"""
This function solves the linear programming problem regarding a couple of 
	possible opponents for a selected team and and the current state of the constraints.

- new_match = (home, away) is the couple of possible opponents for the selected team.
	The selected team will play at home against home and away against away.

- the constraint variable match_vars[i, j, t] is a binary variable that is equal to 1 if 
	team i plays at home against team j at time t. The objective function is trivial since
	we're not maximizing or minimizing a specific goal. 
"""
function solve_problem(selected_team::Team, constraints::Dict{String, Constraint}, new_match::NTuple{2, Team})::Bool
	if SOLVER == "Gurobi"
		model = direct_model(Gurobi.Optimizer(env))
	elseif SOLVER == "SCIP" || SOLVER == "CONSTRAINT_SOLVER"
		model = Model(env)
		set_attribute(model, "display/verblevel", 0)

	else
		error("Invalid SOLVER")
	end

	T = 8 # Number of matchdays

	@variable(model, match_vars[1:36, 1:36, 1:8], Bin)
	# Objective function is trivial since we're not maximizing or minimizing a specific goal
	@objective(model, Max, 0)

	# General constraints
	@constraint(model, [i = 1:36], sum(match_vars[i, i, t] for t in 1:T) == 0) # A team cannot play against itself
	@constraint(model, [i = 1:36, j = 1:36; i != j], sum(match_vars[i, j, t] + match_vars[j, i, t] for t in 1:T) <= 1)  # Each pair of teams plays at most once


	# Specific constraints for each pot
	for pot_start in 1:9:28
		@constraint(model, [i = 1:36], sum(match_vars[i, j, t] for t in 1:T, j in pot_start:pot_start+8) == 1)
		@constraint(model, [i = 1:36], sum(match_vars[j, i, t] for t in 1:T, j in pot_start:pot_start+8) == 1)
	end


	# Constraint for the initially selected admissible match
	home_idx, away_idx = get_club_index_from_team_name(new_match[1].club), get_club_index_from_team_name(new_match[2].club)
	selected_team_idx = get_club_index_from_team_name(selected_team.club)
	@constraint(model, sum(match_vars[selected_team_idx, home_idx, t] for t in 1:T) == 1)
	@constraint(model, sum(match_vars[away_idx, selected_team_idx, t] for t in 1:T) == 1)

	# Applying constraints based on previously played matches and nationality constraints
	for (club, club_constraints) in constraints
		club_idx = get_club_index_from_team_name(club)
		for home_club in club_constraints.played_home
			home_idx = get_club_index_from_team_name(home_club)
			@constraint(model, sum(match_vars[club_idx, home_idx, t] for t in 1:T) == 1)
		end
		for away_club in club_constraints.played_ext
			away_idx = get_club_index_from_team_name(away_club)
			@constraint(model, sum(match_vars[away_idx, club_idx, t] for t in 1:T) == 1)
		end
	end

	# Nationality constraints
	# Match cannot happen if the teams are from the same nationality
	for (i, pot_i) in enumerate((teams.potA, teams.potB, teams.potC, teams.potD))
		for (j, team_j) in enumerate(pot_i)
			team_idx = (i - 1) * 9 + j
			for (k, pot_k) in enumerate((teams.potA, teams.potB, teams.potC, teams.potD))
				for (l, team_l) in enumerate(pot_k)
					opponent_idx = ((k - 1) * 9 + l)
					if team_j.nationality == team_l.nationality && team_idx != opponent_idx
						@constraint(model, sum(match_vars[team_idx, opponent_idx, t] for t in 1:T) == 0)
					end
				end
			end
		end
	end

	# Limit the number of matches against the same nationality to 2
	for nationality in all_nationalities
		for i in 1:36
			@constraint(model, sum(
				match_vars[i, j, t] + match_vars[j, i, t]
				for t in 1:T
				for j in 1:36
				if get_team_nationality(j) == nationality
			) <= 2)
		end
	end

	# Solve the problem
	optimize!(model)

	status = termination_status(model)

	# Check the status of the model to see if it is feasible
	if status == MOI.INFEASIBLE
		return false
	elseif status == MOI.OPTIMAL || status == MOI.FEASIBLE_POINT
		return true
	elseif status == MOI.NUMERICAL_ERROR || status == MOI.OTHER_ERROR
		error("Numerical issue detected. The result may be unreliable.")
	else
		error("Unexpected SOLVER status: $status")
	end
end


# Alternative implementation using ConstraintSolver.jl
# """
# Determines whether a feasible schedule exists for the Champions League new format using ConstraintSolver.jl.
# This function uses best practices:
#   - Local precomputation of team, pot, and nationality data.
#   - Grouped constraints for daily scheduling, pot match-ups, pairing consistency, and nationality limits.
#   - Reified constraints to force a prescribed home and away match for the selected team.
#   - Solver tuning via attributes (e.g. TimeLimit, Verbosity).
# Returns true if a feasible schedule is found.
# """
# function solve_problem(selected_team::Team, constraints::Dict{String, Constraint}, new_match::NTuple{2, Team})::Bool
# 	# Precompute local data (36 teams).
# 	local_teams = vcat(collect(potA), collect(potB), collect(potC), collect(potD))
# 	nteams = length(local_teams)  # should be 36
# 	T = 8
# 	days = 1:T

# 	# Build team-to-index mapping.
# 	team_to_idx = Dict{String, Int}()
# 	for (i, t) in enumerate(local_teams)
# 		team_to_idx[t.club] = i
# 	end

# 	# Build pot mapping.
# 	pot_of = Dict{Int, Symbol}()
# 	for (t, _) in zip(potA, 1:length(potA))
# 		pot_of[team_to_idx[t.club]] = :A
# 	end
# 	for (t, _) in zip(potB, 1:length(potB))
# 		pot_of[team_to_idx[t.club]] = :B
# 	end
# 	for (t, _) in zip(potC, 1:length(potC))
# 		pot_of[team_to_idx[t.club]] = :C
# 	end
# 	for (t, _) in zip(potD, 1:length(potD))
# 		pot_of[team_to_idx[t.club]] = :D
# 	end

# 	# Precompute indices of teams in each pot.
# 	pot_indices = Dict{Symbol, Vector{Int}}()
# 	for label in [:A, :B, :C, :D]
# 		pot_indices[label] = [i for i in 1:nteams if pot_of[i] == label]
# 	end

# 	# Precompute nationalities and build mapping.
# 	nationalities = sort(collect(Set(t.nationality for t in local_teams)))
# 	nat_index = Dict{String, Int}()
# 	for (idx, nat) in enumerate(nationalities)
# 		nat_index[nat] = idx
# 	end
# 	N = length(nationalities)

# 	# --- Create CP model with solver tuning ---
# 	model = Model(env)

# 	# --- Decision Variables ---
# 	# x[i,j,d] == 1 if team i hosts team j on day d.
# 	@variable(model, x[1:nteams, 1:nteams, days], Bin)

# 	# --- Group I: Basic Scheduling Constraints ---
# 	# Prevent self-matches.
# 	for i in 1:nteams, d in days
# 		@constraint(model, x[i, i, d] == 0)
# 	end

# 	# Table constraints for match direction.
# 	# Use a 3×2 matrix for allowed pairs.
# 	allowed_pairs = [0 0; 1 0; 0 1]
# 	for d in days, i in 1:nteams, j in (i+1):nteams
# 		@constraint(model, [x[i, j, d], x[j, i, d]] in CS.TableSet(allowed_pairs))
# 	end

# 	# Daily scheduling: each team plays exactly one match per day.
# 	for d in days, i in 1:nteams
# 		@constraint(model, sum(x[i, j, d] for j in 1:nteams) + sum(x[j, i, d] for j in 1:nteams) == 1)
# 	end

# 	# Pot constraints: For each team and each pot, enforce one home and one away match.
# 	for i in 1:nteams
# 		for pot_label in [:A, :B, :C, :D]
# 			opps = (pot_of[i] == pot_label) ? [j for j in pot_indices[pot_label] if j != i] : pot_indices[pot_label]
# 			@constraint(model, sum(x[i, j, d] for j in opps, d in days) == 1)
# 			@constraint(model, sum(x[j, i, d] for j in opps, d in days) == 1)
# 		end
# 	end

# 	# Pairing consistency: any two teams meet at most once.
# 	for i in 1:nteams, j in (i+1):nteams
# 		@constraint(model, sum(x[i, j, d] + x[j, i, d] for d in days) <= 1)
# 	end

# 	# --- Group Extra: Incorporate Already Played Matches from constraints parameter ---
# 	# For each team, if it has already played at home or away against another, force that match.
# 	for (club, club_constraints) in constraints
# 		club_idx = team_to_idx[club]
# 		for home_club in club_constraints.played_home
# 			home_idx = team_to_idx[home_club]
# 			@constraint(model, sum(x[club_idx, home_idx, d] for d in days) == 1)
# 		end
# 		for away_club in club_constraints.played_ext
# 			away_idx = team_to_idx[away_club]
# 			@constraint(model, sum(x[away_idx, club_idx, d] for d in days) == 1)
# 		end
# 	end

# 	# --- Group II: Nationality Constraints ---
# 	@variable(model, count[1:nteams, 1:N], Int, lower_bound = 0, upper_bound = 8)
# 	for i in 1:nteams
# 		for nat in nationalities
# 			idx = nat_index[nat]
# 			allowed_teams = [j for j in 1:nteams if local_teams[j].nationality == nat]
# 			@constraint(model, count[i, idx] == sum(x[i, j, d] + x[j, i, d] for j in allowed_teams, d in days))
# 			if local_teams[i].nationality == nat
# 				@constraint(model, count[i, idx] == 0)
# 			else
# 				# Instead of a vector of one-element tuples, we create a 3×1 matrix.
# 				@constraint(model, [count[i, idx]] in CS.TableSet(reshape([0, 1, 2], 3, 1)))
# 			end
# 		end
# 	end

# 	# --- Group III: Forced Matches using Reified Constraints ---
# 	# Force the selected team to play one prescribed home match against new_match[1]
# 	# and one prescribed away match against new_match[2].
# 	i_sel = team_to_idx[selected_team.club]
# 	j_home = team_to_idx[new_match[1].club]
# 	j_away = team_to_idx[new_match[2].club]

# 	b_home = [@variable(model, binary = true) for d in days]
# 	for d in days
# 		@constraint(model, b_home[d] := {x[i_sel, j_home, d] == 1})
# 	end
# 	@constraint(model, sum(b_home) == 1)

# 	b_away = [@variable(model, binary = true) for d in days]
# 	for d in days
# 		@constraint(model, b_away[d] := {x[j_away, i_sel, d] == 1})
# 	end
# 	@constraint(model, sum(b_away) == 1)

# 	# --- Objective: Feasibility (Dummy Objective) ---
# 	@objective(model, Min, 0)

# 	optimize!(model)
# 	status = termination_status(model)
# 	return status == MOI.OPTIMAL || status == MOI.FEASIBLE_POINT
# end


"""
This function returns the team from the opponent group that the selected team has already played at home.
We can have either 0 or 1 team.
"""
function get_team_already_played_home(selected_team::Team, opponent_group::NTuple{9, Team}, constraints::Dict{String, Constraint})::Union{Team, Nothing}
	set_home_selected_team_name = constraints[selected_team.club].played_home
	for home_club_name in set_home_selected_team_name
		home_team = get_team_from_name(home_club_name)
		if home_team in opponent_group
			return home_team
		end
	end
	return nothing
end


function get_team_already_played_away(selected_team::Team, opponent_group::NTuple{9, Team}, constraints::Dict{String, Constraint})::Union{Team, Nothing}
	set_away_selected_team_name = constraints[selected_team.club].played_ext
	for away_club_name in set_away_selected_team_name
		away_team = get_team_from_name(away_club_name)
		if away_team in opponent_group
			return away_team
		end
	end
	return nothing
end


"""
This function returns for a given team, an opponent group and the state of the draw, all the admissible couple of home, away opponents.
	In the sense that choosing this couple will not lead to a dead-end
"""
function true_admissible_matches(selected_team::Team, opponent_group::NTuple{9, Team}, constraints::Dict{String, Constraint})::Vector{Tuple{Team, Team}}
	true_matches = Vector{Tuple{Team, Team}}()
	#We check in the constraints if we already have selected the opponents of the selected team in the considered pot
	home_team = get_team_already_played_home(selected_team, opponent_group, constraints)
	away_team = get_team_already_played_away(selected_team, opponent_group, constraints)

	selected_team_pot = get_pot_from_team(selected_team)

	#If we already have selected the match, we just return the couple (home, away)
	if home_team !== nothing && away_team !== nothing
		if (home_team.club == away_team.club)
			error("Home Opponent and Away Opponnent for $(selected_team.club) in pot $(opponent_group) are the same teams")
		end
		@info "Returned home-away opponent already selected $((home_team.club, away_team.club))"
		if (get_team_already_played_away(home_team, selected_team_pot, constraints).club != selected_team.club)
			error(
				"Constraint inconsistency: $(selected_team.club) has played home against $(home_team.club) but $(home_team.club) has played not played away against $(selected_team.club) \n Constraints for Selected Team are $(constraints[selected_team.club]) \n Constraints for HomeTeam are $(constraints[home_team.club]) \n Result of  get_team_already_played_away(home_team, selected_team_pot, constraints) = $(get_team_already_played_away(home_team, selected_team_pot, constraints).club)",
			)
		end
		if solve_problem(selected_team, constraints, (home_team, away_team)) === false
			error("Can't find a solution with the already selected match")
		end
		return Vector{Tuple{Team, Team}}([(home_team, away_team)])
	end

	#If we know any of the opponents, we check for each home,away pair if this can be a valid match
	if home_team === nothing && away_team === nothing
		for home in opponent_group
			for away in opponent_group
				#Reject the couple if they are the same team
				#Reject the couple if one of the two opponent it has the same nationality as the selected team
				if home.club != away.club && home.nationality != selected_team.nationality && away.nationality != selected_team.nationality &&
				   #Reject the couple if one of the teams has already played against two team of same nationality
				   constraints[selected_team.club].nationalities[home.nationality] <= 2 &&
				   constraints[selected_team.club].nationalities[away.nationality] <= 2 &&
				   constraints[home.club].nationalities[selected_team.nationality] <= 2 &&
				   constraints[away.club].nationalities[selected_team.nationality] <= 2 &&
				   #Reject the couple if one of the opponent has already played against the pot of the selected team its home/away match
				   get_team_already_played_away(home, selected_team_pot, constraints) === nothing &&
				   get_team_already_played_home(away, selected_team_pot, constraints) === nothing
					match = (home, away)
					#Finally if the couple is valid, we check if we can find a solution with this couple
					if solve_problem(selected_team, constraints, match)
						push!(true_matches, match)
					end
				end
			end
		end
	end

	# Since away_team is already known, we only need to find a home_team
	if home_team === nothing && away_team !== nothing
		for home in opponent_group
			if home != away_team &&
			   home.nationality != selected_team.nationality &&
			   away_team.nationality != selected_team.nationality &&
			   constraints[selected_team.club].nationalities[home.nationality] <= 2 &&
			   constraints[home.club].nationalities[selected_team.nationality] <= 2 &&
			   get_team_already_played_away(home, selected_team_pot, constraints) === nothing
				match = (home, away_team)
				if solve_problem(selected_team, constraints, match)
					push!(true_matches, match)
				end
			end
		end
	end

	# Since home_team is already known, we only need to find an away_team
	if home_team !== nothing && away_team === nothing
		for away in opponent_group
			if home_team.club != away.club &&
			   home_team.nationality != selected_team.nationality &&
			   away.nationality != selected_team.nationality &&
			   constraints[selected_team.club].nationalities[away.nationality] <= 2 &&
			   constraints[away.club].nationalities[selected_team.nationality] <= 2 &&
			   get_team_already_played_home(away, selected_team_pot, constraints) === nothing
				match = (home_team, away)
				if solve_problem(selected_team, constraints, match)
					push!(true_matches, match)
				end
			end
		end
	end
	return true_matches
end


"""
Performs a sequential draw with the UEFA method.
For each selected team and opponent pot, the function display the possible home,away opponents
We then wait for the user to press `space` and `enter` before processing the next step.*

The draw results are saved in the file `result_sequential_uefa_draw.txt`.
"""
function uefa_draw_sequential()
	constraints = initialize_constraints(all_nationalities)
	println("Début du tirage au sort")
	start_time = time()
	matches_list = []

	open("result_sequential_uefa_draw.txt", "w") do file
		for pot_index in 1:4
			println("Mélange des indices pour le pot $pot_index")
			# Access the selected pot from A to D
			pot = if pot_index == 1
				teams.potA
			elseif pot_index == 2
				teams.potB
			elseif pot_index == 3
				teams.potC
			elseif pot_index == 4
				teams.potD
			else
				error("Index de pot invalide")
			end

			indices = shuffle(collect(1:9))  # We select with random order the teams of a selected pot
			for i in indices
				selected_team = pot[i]
				li_opponents = [(selected_team.club, "")]

				println(file, "Tirage pour l'équipe : ", selected_team.club)

				for idx_opponent_pot in 1:4
					opponent_pot = if idx_opponent_pot == 1
						teams.potA
					elseif idx_opponent_pot == 2
						teams.potB
					elseif idx_opponent_pot == 3
						teams.potC
					elseif idx_opponent_pot == 4
						teams.potD
					else
						error("Index de pot invalide")
					end

					matches_possible = true_admissible_matches(selected_team, opponent_pot, constraints)

					equipes_possibles = [(match[1].club, match[2].club) for match in matches_possible]
					selected_match = matches_possible[rand(1:end)]
					home, away = selected_match

					println(file, "Adversaires possibles du pot $idx_opponent_pot : ", equipes_possibles)

					println("")
					println("Equipe sélectionnée: $(selected_team.club)")
					println("Pot sélectionné: $(idx_opponent_pot)")
					println("")
					println("Liste des couples possibles")
					println(equipes_possibles)
					println("")
					println("Match sélectionné dans le pot $(idx_opponent_pot) : $(home.club) vs $(away.club)")
					println("Appuyez sur la barre d'espace suivi d'Entrée pour continuer...")

					while true
						input = readline()
						if input == " "
							break
						else
							println("Vous n'avez pas appuyé sur la barre d'espace suivi d'Entrée, réessayez.")
						end
					end

					update_constraints(selected_team, home, constraints)
					update_constraints(away, selected_team, constraints)
					push!(li_opponents, (home.club, away.club))
				end

				println(file, li_opponents)
				println(file, "\n---\n")  # Ajoute une ligne de séparation après chaque équipe
				push!(matches_list, li_opponents)
			end
			println(file, "\n\n")  # Ajoute un espace supplémentaire après chaque pot pour une meilleure visibilité
		end
	end

	println("Résultats du tirage au sort enregistrés dans le fichier 'result_sequential_uefa_draw.txt'")
	total_time = time() - start_time
	println("Temps total d'exécution de tirage_au_sort : $(round(total_time, digits=2)) secondes")
end


"""
This function performs one or multiple uefa draw.
Each draw is runned in its own thread at the limit of availability
The result of the draw is stored in matches_draw_matchups_first_bis.txt

We compute for each draw and each team the sum of opponents's elo score and the sum of opponents's uefa score.
The results are respectively stored in draws_draw_matchups_first_elo_bis.txt and draws_draw_matchups_first_uefa_bis

-Parameters
	nb_draw:int is the number of draw performed
"""
function uefa_draw(nb_draw::Int = 1)
	elo_opponents = zeros(Float64, 36, nb_draw)
	uefa_opponents = zeros(Float64, 36, nb_draw)
	matches = zeros(Int, 36, 8, nb_draw)
	@threads for s in 1:nb_draw
		constraints = initialize_constraints(all_nationalities)
		for pot_index in 1:4
			# Access the selected pot from A to D
			pot = if pot_index == 1
				teams.potA
			elseif pot_index == 2
				teams.potB
			elseif pot_index == 3
				teams.potC
			elseif pot_index == 4
				teams.potD
			end

			indices = shuffle!(collect(1:9))
			for i in indices
				selected_team = pot[i]

				for idx_opponent_pot in 1:4
					opponent_pot = if idx_opponent_pot == 1
						teams.potA
					elseif idx_opponent_pot == 2
						teams.potB
					elseif idx_opponent_pot == 3
						teams.potC
					elseif idx_opponent_pot == 4
						teams.potD
					end

					home, away = true_admissible_matches(selected_team, opponent_pot, constraints)[rand(1:end)]

					matches[get_club_index_from_team_name(selected_team.club), 2*idx_opponent_pot-1, s] = get_club_index_from_team_name(home.club)
					matches[get_club_index_from_team_name(selected_team.club), 2*idx_opponent_pot, s] = get_club_index_from_team_name(away.club)

					elo_opponents[get_club_index_from_team_name(selected_team.club), s] += away.elo + home.elo
					uefa_opponents[get_club_index_from_team_name(selected_team.club), s] += away.uefa + home.uefa

					update_constraints(selected_team, home, constraints)
					update_constraints(away, selected_team, constraints)
				end
			end
		end
	end

	open("draws_draw_matchups_first_elo_bis.txt", "a") do file
		for i in 1:nb_draw
			row = join(elo_opponents[:, i], " ")
			write(file, row * "\n")
		end
	end

	open("draws_draw_matchups_first_uefa_bis.txt", "a") do file
		for i in 1:nb_draw
			row = join(uefa_opponents[:, i], " ")
			write(file, row * "\n")
		end
	end

	open("matches_draw_matchups_first_bis.txt", "a") do file
		for i in 1:nb_draw
			for team in 1:36
				home_matches = [(team, matches[team, k, i]) for k in 1:2:8]
				home_row = join(home_matches, " ")
				write(file, home_row * " ")
				away_matches = [(matches[team, k, i], team) for k in 2:2:8]
				away_row = join(away_matches, " ")
				write(file, away_row * " ")
			end
			write(file, "\n")
		end
	end

	return 0
end



"""
This function performs a custom uefa draw.
The order of the selected pot from which we draw a selected team is random as well as the order of opponent 
	pot from which we select the opponent of a selected team
Each draw is runned in its own thread at the limit of availability
The result of the draw is stored in matches_draw_matchups_first_bis.txt

We compute for each draw and each team the sum of opponents's elo score and the sum of opponents's uefa score.
The results are respectively stored in draws_draw_matchups_first_elo_bis.txt and draws_draw_matchups_first_uefa_bis

-Parameters
	nb_draw:int is the number of draw performed
"""
function uefa_draw_randomized(nb_draw::Int)
	elo_opponents = zeros(Float64, 36, nb_draw)
	uefa_opponents = zeros(Float64, 36, nb_draw)
	matches = zeros(Int, 36, 8, nb_draw)
	@threads for s in 1:nb_draw
		constraints = initialize_constraints(all_nationalities)
		shuffled_order = shuffle(collect(1:36))
		open("order_selection.txt", "a") do file
			write(file, shuffled_order)
		end
		@info "Shuffled order: $shuffled_order"
		for index_team in shuffled_order
			@info "Selected team index: $index_team"
			selected_team = get_team_from_club_index(index_team)
			@info "Selected team: $(selected_team.club)"
			opponent_pots_shuffled_indexes = shuffle(collect(1:4))  # Mélange des indices
			@info "Shuffled opponent pots indexes: $opponent_pots_shuffled_indexes"
			for idx_opponent_pot in opponent_pots_shuffled_indexes
				opponent_pot = if idx_opponent_pot == 1
					teams.potA
				elseif idx_opponent_pot == 2
					teams.potB
				elseif idx_opponent_pot == 3
					teams.potC
				elseif idx_opponent_pot == 4
					teams.potD
				end

				home = nothing
				away = nothing
				try
					@info "Opponent pot: $idx_opponent_pot"
					home, away = true_admissible_matches(selected_team, opponent_pot, constraints)[rand(1:end)]
					@info "Selected home team: $(home.club)"
					@info "Selected away team: $(away.club)"
				catch e
					@error "Error while trying to find a match for $(selected_team.club) against pot $idx_opponent_pot"
					@error "The constraints for that team are $(constraints[selected_team.club])"
					throw(e)
				end

				matches[get_club_index_from_team_name(selected_team.club), 2*idx_opponent_pot-1, s] = get_club_index_from_team_name(home.club)
				matches[get_club_index_from_team_name(selected_team.club), 2*idx_opponent_pot, s] = get_club_index_from_team_name(away.club)

				elo_opponents[get_club_index_from_team_name(selected_team.club), s] += away.elo + home.elo
				uefa_opponents[get_club_index_from_team_name(selected_team.club), s] += away.uefa + home.uefa

				update_constraints(selected_team, home, constraints)
				update_constraints(away, selected_team, constraints)
			end
		end
	end

	open("draws_draw_matchups_first_elo_bis.txt", "a") do file
		for i in 1:nb_draw
			row = join(elo_opponents[:, i], " ")
			write(file, row * "\n")
		end
	end

	open("draws_draw_matchups_first_uefa_bis.txt", "a") do file
		for i in 1:nb_draw
			row = join(uefa_opponents[:, i], " ")
			write(file, row * "\n")
		end
	end

	open("matches_draw_matchups_first_bis.txt", "a") do file
		for i in 1:nb_draw
			for team in 1:36
				home_matches = [(team, matches[team, k, i]) for k in 1:2:8]
				home_row = join(home_matches, " ")
				write(file, home_row * " ")
				away_matches = [(matches[team, k, i], team) for k in 2:2:8]
				away_row = join(away_matches, " ")
				write(file, away_row * " ")
			end
			write(file, "\n")
		end
	end

	return 0
end


###################################### COMMANDS ###################################### 
@time begin
	uefa_draw_randomized(NB_DRAWS)
	@info "$(n_simul) draws have been successfully performed"
end