"""
This script performs the draw for the method Build Schedule First.
Added typing and performance optimizations.
"""
############################################ IMPORTS ############################################
# Check which optimization solvers are available
using JuMP
if isdefined(Main, :Gurobi) || Base.find_package("Gurobi") !== nothing
    using Gurobi
end
using SCIP, MathOptInterface, Statistics, Random, Logging
# using Base.Threads
# using  .GC

####################################### DRAW PARAMETERS #######################################
const SOLVER::String = "SCIP" # Alternative: "Gurobi", "SCIP"
const LEAGUE::String = "CHAMPIONS_LEAGUE" # Alternative: "EUROPA_LEAGUE", "CHAMPIONS_LEAGUE"
const NB_DRAWS::Int = 10
const IS_RANDOM::Bool = true
####################################### GLOBAL VARIABLES #######################################

const nb_pots::Int = 4 # number of pots
const nb_teams_per_pot::Int = 9 # number of teams per pot
const nb_teams::Int = 36  # number of teams (= nb_pots*nb_teams_per_pot)



#──────────────────────── INFRA THREAD-SAFE ─────────────────
const MAX_RETRIES = 3
const env_by_tid = Dict{Int,Any}()
const mdl_by_tid = Dict{Int,JuMP.Model}()

new_env() = SOLVER == "Gurobi" ? Gurobi.Env("OutputFlag" => 0, "LogToConsole" => 0) :
            SOLVER == "SCIP" ? SCIP.Optimizer() :
            error("Unknown solver")

function thread_env()
    get!(env_by_tid, threadid()) do
        new_env()
    end
end

"Renvoie le modèle unique du thread, en le réinitialisant."
function thread_model()
    get!(mdl_by_tid, threadid()) do
        if SOLVER == "Gurobi"
            direct_model(Gurobi.Optimizer(thread_env()))
        else                    # SCIP
            Model(() -> thread_env())
        end
    end |> (m -> (MOI.empty!(backend(m)); m))   # reset puis renvoi
end

function solve_with_retry!(model)
    for k in 1:MAX_RETRIES
        optimize!(model)
        st = termination_status(model)
        st == MOI.OPTIMAL && return true
        st ∉ (MOI.OTHER_ERROR, MOI.TIME_LIMIT) && return false
        @warn "solver status $st (tentative $k) – retry"
    end
    error("Solver failed after $MAX_RETRIES retries (status $(termination_status(model)))")
end

"""
Matrix of shape 36x8 representing the 8 opponents of each team in the draw
opponents[i] : list of placeholders connected to placeholder i
"""
const opponents::Vector{Vector{Int}} =
    [[18, 9, 19, 36, 11, 2, 32, 26],
        [31, 21, 3, 16, 27, 1, 14, 33],
        [10, 32, 2, 13, 26, 22, 36, 4],
        [5, 14, 29, 35, 10, 23, 25, 3],
        [4, 11, 22, 6, 30, 34, 13, 19],
        [16, 27, 33, 5, 21, 29, 7, 12],
        [20, 8, 15, 24, 28, 17, 6, 30],
        [23, 7, 12, 25, 9, 31, 35, 18],
        [34, 1, 17, 20, 8, 15, 24, 28],
        [3, 35, 21, 18, 4, 32, 22, 11],
        [12, 5, 27, 23, 1, 33, 31, 10],
        [11, 36, 8, 26, 19, 13, 30, 6],
        [19, 28, 14, 3, 35, 12, 5, 21],
        [24, 4, 13, 30, 34, 20, 2, 15],
        [33, 25, 7, 29, 16, 9, 23, 14],
        [6, 17, 32, 2, 15, 24, 26, 34],
        [29, 16, 9, 31, 25, 7, 18, 27],
        [1, 22, 20, 10, 36, 28, 17, 8],
        [13, 20, 1, 28, 12, 27, 33, 5],
        [7, 19, 18, 9, 31, 14, 21, 35],
        [32, 2, 10, 22, 6, 30, 20, 13],
        [35, 18, 5, 21, 23, 3, 10, 29],
        [8, 34, 36, 11, 22, 4, 15, 24],
        [14, 31, 25, 7, 29, 16, 9, 23],
        [30, 15, 24, 8, 17, 26, 4, 36],
        [27, 33, 28, 12, 3, 25, 16, 1],
        [26, 6, 11, 32, 2, 19, 34, 17],
        [36, 13, 26, 19, 7, 18, 29, 9],
        [17, 30, 4, 15, 24, 6, 28, 22],
        [25, 29, 31, 14, 5, 21, 12, 7],
        [2, 24, 30, 17, 20, 8, 11, 32],
        [21, 3, 16, 27, 33, 10, 1, 31],
        [15, 26, 6, 34, 32, 11, 19, 2],
        [9, 23, 35, 33, 14, 5, 27, 16],
        [22, 10, 34, 4, 13, 36, 8, 20],
        [28, 12, 23, 1, 18, 35, 3, 25]]

# Type definition for team data
struct TeamData
    club::String
    nationality::String
    elo::Int
    uefa::Float64
end

if LEAGUE == "CHAMPIONS_LEAGUE"
    # Champions League
    const teams::Vector{TeamData} = [
        TeamData("Real", "Spain", 1985, 136),                    #1
        TeamData("ManCity", "England", 2057, 148),               #2
        TeamData("Bayern", "Germany", 1904, 144),                #3
        TeamData("PSG", "France", 1893, 116),                    #4
        TeamData("Liverpool", "England", 1908, 114),             #5
        TeamData("Inter", "Italy", 1960, 101),                   #6
        TeamData("Dortmund", "Germany", 1874, 97),               #7
        TeamData("Leipzig", "Germany", 1849, 97),                #8
        TeamData("Barcelona", "Spain", 1894, 91),                #9
        TeamData("Leverkusen", "Germany", 1929, 90),             #10
        TeamData("Atlético", "Spain", 1830, 89),                 #11
        TeamData("Atalanta", "Italy", 1879, 81),                 #12
        TeamData("Juventus", "Italy", 1839, 80),                 #13
        TeamData("Benfica", "Portugal", 1824, 79),               #14
        TeamData("Arsenal", "England", 1957, 72),                #15
        TeamData("Brugge", "Belgium", 1703, 64),                 #16
        TeamData("Shakhtar", "Ukraine", 1573, 63),               #17
        TeamData("Milan", "Italy", 1821, 59),                    #18
        TeamData("Feyenoord", "Netherlands", 1747, 57),          #19
        TeamData("Sporting", "Portugal", 1824, 54.5),            #20
        TeamData("Eindhoven", "Netherlands", 1794, 54),          #21
        TeamData("Dinamo", "Croatia", 1584, 50),                 #22
        TeamData("Salzburg", "Austria", 1693, 50),               #23
        TeamData("Lille", "France", 1785, 47),                   #24
        TeamData("Crvena", "Serbia", 1734, 40),                  #25
        TeamData("YB", "Switzerland", 1566, 34.5),               #26
        TeamData("Celtic", "Scotland", 1646, 32),                #27
        TeamData("Bratislava", "Slovakia", 1703, 30.5),          #28
        TeamData("Monaco", "France", 1780, 24),                  #29
        TeamData("Sparta", "Czech Republic", 1716, 22.5),        #30
        TeamData("Aston Villa", "England", 1772, 20.86),         #31
        TeamData("Bologna", "Italy", 1777, 18.056),              #32
        TeamData("Girona", "Spain", 1791, 17.897),               #33
        TeamData("Stuttgart", "Germany", 1795, 17.324),          #34
        TeamData("Sturm Graz", "Austria", 1610, 14.500),         #35
        TeamData("Brest", "France", 1685, 13.366),               #36 
    ]

    # Champions League
    # team_nationalities[i] : nationality of team i
    const team_nationalities::Vector{Int} =
        [1, 2, 3, 4, 2, 5, 3, 3, 1, 3, 1, 5, 5, 6, 2, 7, 8, 5, 9, 6, 9, 10, 11, 4, 12, 13, 14, 15, 4, 16, 2, 5, 1, 3, 11, 4]

    # nationalities[i] : list of teams of nationality i 
    const nationalities::Vector{Vector{Int}} =
        [[1, 9, 11, 33], # Spain
            [2, 5, 15, 31], # England
            [3, 7, 8, 10, 34], #  Germany
            [4, 24, 29, 36], # France
            [6, 12, 13, 18, 32], # Italy
            [14, 20], # Portugal
            [16], # Belgium
            [17], # Ukraine
            [19, 21], # Netherlands
            [22], # Croatia
            [23, 35], # Austria
            [25], # Serbia
            [26], # Switzerland
            [27], # Scotland 
            [28], # Slovakia
            [30], # Czech Republic
        ]

elseif LEAGUE == "EUROPA_LEAGUE"
    # Europa League teams
    const teams::Vector{TeamData} = [
        TeamData("Roma", "Italy", 1812, 101),                       #1
        TeamData("Man Utd", "England", 1779, 92),                   #2
        TeamData("Porto", "Portugal", 1778, 77),                    #3
        TeamData("Ajax", "Netherlands", 1619, 67),                  #4
        TeamData("Rangers", "Scotland", 1618, 63),                  #5
        TeamData("Frankfurt", "Germany", 1697, 60),                 #6
        TeamData("Lazio", "Italy", 1785, 54),                       #7
        TeamData("Tottenham", "England", 1791, 54),                 #8
        TeamData("Slavia Praha", "Czech Republic", 1702, 53),       #9
        TeamData("Real Sociedad", "Spain", 1767, 51),               #10
        TeamData("AZ Alkmaar", "Netherlands", 1591, 50),            #11
        TeamData("Braga", "Portugal", 1636, 49),                    #12
        TeamData("Olympiacos", "Greece", 1673, 48),                 #13
        TeamData("Lyon", "France", 1713, 44),                       #14
        TeamData("PAOK", "Greece", 1639, 37),                       #15
        TeamData("Fenerbahçe", "Turkey", 1714, 36),                 #16
        TeamData("M. Tel-Aviv", "Israel", 1614, 35.5),              #17
        TeamData("Ferencvaros", "Hungary", 1479, 35),               #18
        TeamData("Qarabag", "Azerbaijan", 1597, 33),                #19
        TeamData("Galatasaray", "Turkey", 1721, 31.5),              #20
        TeamData("Viktoria Plzen", "Czech Republic", 1572, 28),     #21
        TeamData("Bodo/Glimt", "Norway", 1598, 28),                 #22
        TeamData("Union SG", "Belgium", 1701, 27),                  #23
        TeamData("Dynamo Kyiv", "Ukraine", 1517, 26.5),             #24
        TeamData("Ludogorets", "Bulgaria", 1512, 26),               #25
        TeamData("Midtjylland", "Denmark", 1624, 25.5),             #26
        TeamData("Malmo", "Sweden", 1493, 18.5),                    #27
        TeamData("Athletic Club", "Spain", 1764, 17.897),           #28
        TeamData("Hoffenheim", "Germany", 1683, 17.324),            #29
        TeamData("Nice", "France", 1703, 17),                       #30
        TeamData("Anderlecht", "Belgium", 1640, 14.5),              #31
        TeamData("Twente", "Netherlands", 1627, 12.650),            #32
        TeamData("Besiktas", "Turkey", 1484, 12),                   #33
        TeamData("FCSB", "Romania", 1434, 10.5),                    #34
        TeamData("RFS", "Latvia", 1225, 8),                         #35
        TeamData("Elfsborg", "Sweden", 1403, 4.3),                  #36
    ]
    const team_nationalities = # team_nationalities[i] : nationality of team i
        [1, 2, 3, 4, 5, 6, 1, 2, 14, 7, 4, 3, 8, 9, 8, 10, 11, 12, 13, 10, 14, 15, 16, 17, 18, 19, 20, 7, 6, 9, 16, 4, 10, 21, 22, 20]

    const nationalities::Vector{Vector{Int}} = # nationalities[i] : list of teams of nationality i
        [[1, 7],# Italy
            [2, 8], # England
            [3, 12], # Portugal
            [4, 11, 32], # Netherlands
            [5], # Scotland
            [6, 29], # Germany
            [10, 28], # Spain
            [13, 15], # Greece
            [14, 30], # France
            [16, 20, 33], # Turkey
            [17], # Israel
            [18], # Hungary
            [19], # Azerbaijan
            [9, 21], # Czech Republic
            [22], # Norway
            [23, 31], # Belgium
            [24], # Ukraine
            [25], # Bulgaria
            [26], # Denmark
            [27, 36], # Sweden
            [34], # Romania
            [35], # Latvia
        ]


else
    error("Invalid league. Please choose between 'CHAMPIONS_LEAGUE' and 'EUROPA_LEAGUE'.")
end



################################### CODE FOR SIMULATIONS ###################################
"""
Check if given a current state of the draw, a new team - placeholder assignment can lead to a solution of the draw.
Returns true if new_team in new_placeholder can lead to a solution given already_filled, false otherwise

Parameters
----------
already_filled: Vector{Int} - array of 36 integers (0 if not filled, team index otherwise)
	already_filled[i] = j means that team j is already assigned to placeholder i. 
	If already_filled[i] = 0, then placeholder i is not yet assigned to a team.
"""
function is_solvable(
    nationalities::Vector{Vector{Int}},
    opponents::Vector{Vector{Int}},
    team_nationalities::Vector{Int},
    nb_pots::Int,
    nb_teams_per_pot::Int,
    new_team::Int,
    new_placeholder::Int,
    already_filled::Vector{Int},
)::Bool
    if SOLVER == "Gurobi"
        model = direct_model(Gurobi.Optimizer(env))
    elseif SOLVER == "SCIP"
        model = Model(SCIP.Optimizer)
        # set_attribute(model, "display/verblevel", 0)
    elseif SOLVER == "ConstraintSolver"
        model = Model(env)
        # set_attribute(model, "display/verblevel", 0)
    else
        error("Invalid SOLVER")
    end

    nb_teams = nb_pots * nb_teams_per_pot
    # y[i,j] = 1 if team i is in placeholder j, 0 otherwise
    @variable(model, y[1:nb_teams, 1:nb_teams], Bin)

    # Exactly one team is associated to each placeholder
    for placeholder in 1:nb_teams
        @constraint(model, sum(y[team, placeholder] for team in 1:nb_teams) == 1)
    end

    # Exactly one placeholder is associated to each team
    for team in 1:nb_teams
        @constraint(model, sum(y[team, placeholder] for placeholder in 1:nb_teams) == 1)
    end

    # Every team must be associated with a placeholder from its pot
    # (e.g., team indexed from 1 to nb_teams_per_pot must be associated to a placeholder numbered between 1 and nb_teams_per_pot)
    for pot_index in 1:nb_pots
        for team_pot_index in 1:nb_teams_per_pot
            @constraint(model, sum(y[(pot_index-1)*nb_teams_per_pot+team_pot_index, (pot_index-1)*nb_teams_per_pot+placeholder_pot_index] for placeholder_pot_index in 1:nb_teams_per_pot) == 1)
            for other_pot_index in 1:nb_pots
                if other_pot_index != pot_index
                    # it cannot be associated with a corresponding placeholder
                    # (e.g., teams 1 to 9 cannot be placed in a placeholder numbered between 10 and 18)
                    @constraint(model, sum(y[(pot_index-1)*nb_teams_per_pot+team_pot_index, (other_pot_index-1)*nb_teams_per_pot+placeholder_other_pot_index] for placeholder_other_pot_index in 1:nb_teams_per_pot) == 0)
                end
            end
        end
    end

    # Likewise, each team must be associated with a placeholder from its pot
    for pot_index in 1:nb_pots
        for placeholder_pot_index in 1:nb_teams_per_pot
            @constraint(model, sum(y[(pot_index-1)*nb_teams_per_pot+team_pot_index, (pot_index-1)*nb_teams_per_pot+placeholder_pot_index] for team_pot_index in 1:nb_teams_per_pot) == 1)
            for other_pot_index in 1:nb_pots
                if other_pot_index != pot_index
                    @constraint(model, sum(y[(other_pot_index-1)*nb_teams_per_pot+team_pot_index, (pot_index-1)*nb_teams_per_pot+placeholder_pot_index] for team_pot_index in 1:nb_teams_per_pot) == 0)
                end
            end
        end
    end

    # Ensure the two teams of the same nationality does not play against each other
    for team_index in 1:nb_teams
        team_nationality = team_nationalities[team_index]
        for compatriot_team_index in nationalities[team_nationality]
            if compatriot_team_index != team_index
                for placeholder_index in 1:nb_teams
                    for neighbor in opponents[placeholder_index]
                        # cannot be adjacent if the team is indeed in this placeholder
                        @constraint(model, y[team_index, placeholder_index] + y[compatriot_team_index, neighbor] <= 1)
                    end
                end
            end
        end
    end

    # Every placeholder shall have at most 2 opponents from the same nationality
    for placeholder_index in 1:nb_teams
        for nationality_group in nationalities
            @constraint(model, sum(y[team_index, opponent_placeholder_index] for team_index in nationality_group for opponent_placeholder_index in opponents[placeholder_index]) <= 2)
        end
    end

    # Write the constraints for the already filled placeholders
    for placeholder_index in 1:nb_teams
        if already_filled[placeholder_index] > 0
            @constraint(model, y[already_filled[placeholder_index], placeholder_index] == 1)
        end
    end

    # Add the new constraint for the new team in the new placeholder
    @constraint(model, y[new_team, new_placeholder] == 1)
    optimize!(model)
    termination_status_result = termination_status(model)
    # Free memory
    # see https://github.com/jump-dev/CPLEX.jl/issues/185#issuecomment-424399487
    model = nothing
    # GC.gc()
    return termination_status_result == MOI.OPTIMAL
end

"""
Returns the list of possible teams for placeholder given `already_filled`.
That excludes the teams that are not from the same pot as the placeholder, as well as the teams that are already assigned to a placeholder.
For the remaining teams, it checks with solver if the problem is solvable with the new team in the new placeholder.
"""
function admissible_teams(
    nationalities::Vector{Vector{Int}},
    opponents::Vector{Vector{Int}},
    team_nationalities::Vector{Int},
    nb_pots::Int,
    nb_teams_per_pot::Int,
    selected_placeholder::Int,
    already_filled::Vector{Int},
)::Vector{Int}
    possible_teams = Int[]
    placeholder_pot = div(selected_placeholder - 1, nb_teams_per_pot) + 1
    pot_start = (placeholder_pot - 1) * nb_teams_per_pot + 1
    pot_end = placeholder_pot * nb_teams_per_pot

    for team in pot_start:pot_end
        if !(team in already_filled)
            if is_solvable(nationalities, opponents, team_nationalities, nb_pots, nb_teams_per_pot, team, selected_placeholder, already_filled)
                push!(possible_teams, team)
            end
        end
    end
    return possible_teams
end

"""
Performs the draw for the method Build Schedule First.
We select iteratively a placeholder and get the list of possible teams for this placeholder in the sense that it can lead to a solution.
We then select randomly a team from this list and assign it to the placeholder.
"""
function draw(
    nationalities::Vector{Vector{Int}},
    opponents::Vector{Vector{Int}},
    team_nationalities::Vector{Int},
    nb_pots::Int,
    nb_teams_per_pot::Int,
    nb_teams::Int,
    is_random::Bool=true,
)::Vector{Int}
    @assert nb_teams == nb_pots * nb_teams_per_pot
    already_filled = zeros(Int, nb_teams)

    if is_random
        placeholder_order = shuffle!(collect(1:nb_teams))
    else
        placeholder_order = collect(1:nb_teams)
    end

    @info "placeholder_order" placeholder_order


    for placeholder in placeholder_order
        possible_teams = admissible_teams(nationalities, opponents, team_nationalities, nb_pots, nb_teams_per_pot, placeholder, already_filled)
        # Write possible teams in logs file
        open("draw_logs.txt", "a") do file
            write(file, "Placeholder $placeholder: Possible teams: $(possible_teams)\n")
        end
        if isempty(possible_teams)
            @warn "No possible teams for placeholder $placeholder"
            @warn "already_filled" already_filled
            open("draw_logs.txt", "a") do file
                write(file, "################# No possible teams for placeholder $placeholder\n ####################")
                write(file, "already_filled: $already_filled\n")
            end
            error("No possible teams for placeholder $placeholder")
        end
        team = rand(possible_teams)
        already_filled[placeholder] = team
    end
    return already_filled
end

"""
Performs successive draws for the method Build Schedule First.
The results are written in txt files.
Syntax for parrallel use of JuMP solvers found here:
    https://jump.dev/JuMP.jl/stable/tutorials/algorithms/parallelism/#:~:text=JuMP%20models%20are%20not%20thread,or%20silently%20produce%20incorrect%20results
"""
function tirage_au_sort(
    nb_draw::Int,
    teams::Vector{TeamData},
    nationalities::Vector{Vector{Int}},
    opponents::Vector{Vector{Int}},
    team_nationalities::Vector{Int},
    nb_pots::Int,
    nb_teams_per_pot::Int,
    nb_teams::Int,
    is_random::Bool=true,
)::Int
    @assert nb_teams == nb_pots * nb_teams_per_pot

    # Aggregated data of all draws
    # Pre-allocate arrays for better performance
    elo_opponents = zeros(Float64, nb_teams, nb_draw)
    uefa_opponents = zeros(Float64, nb_teams, nb_draw)
    matches = zeros(Int, nb_teams, 8, nb_draw)

    # Create file to store logs
    open("draw_logs.txt", "w") do file
        write(file, "Logs\n")
    end

    # @threads for i in 1:nb_draw
    for i in 1:nb_draw
        open("draw_logs.txt", "a") do file
            write(file, "Draw $i\n")
        end

        draw_i = draw(nationalities, opponents, team_nationalities, nb_pots, nb_teams_per_pot, nb_teams, is_random)

        Threads.lock(my_lock) do
            for placeholder in 1:nb_teams
                team = draw_i[placeholder]
                opponent_indexes = opponents[placeholder]
                opponent_teams = [draw_i[opp] for opp in opponent_indexes]
                matches[team, :, i] = opponent_teams
                elo_opponents[team, i] = sum(teams[opp_team].elo for opp_team in opponent_teams)
                uefa_opponents[team, i] = sum(teams[opp_team].uefa for opp_team in opponent_teams)
            end

            open("bsf_rd_ucl_elo.txt", "a") do file
                for i in 1:nb_draw
                    row = join(elo_opponents[:, i], " ")
                    write(file, row * "\n")
                end
            end

            open("bsf_rd_ucl_uefa.txt", "a") do file
                for i in 1:nb_draw
                    row = join(uefa_opponents[:, i], " ")
                    write(file, row * "\n")
                end
            end

            open("bsf_rd_ucl_matches.txt", "a") do file
                for i in 1:nb_draw
                    for team in 1:36
                        matchups = [(team, matches[team, k, i]) for k in 1:8]
                        row = join(matchups, " ")
                        write(file, row * " ")
                    end
                    write(file, "\n")
                end
            end
        end
    end
    return 0
end

###################################### COMMANDS ###################################### 
# println("Nombre de threads utilisés : ", Threads.nthreads())

@time begin
    tirage_au_sort(NB_DRAWS, teams, nationalities, opponents, team_nationalities, nb_pots, nb_teams_per_pot, nb_teams, IS_RANDOM)
end
