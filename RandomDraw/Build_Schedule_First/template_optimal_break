using JuMP, Gurobi, Cbc

# Création du modèle avec le solveur Cbc
model = Model(Gurobi.Optimizer)

# Nombre d'équipes et de journées
N = 36
T = 8

# Définition des variables
@variable(model, x[1:N, 1:N, 1:T], Bin)

@variable(model, break_var[1:4, 2:6], Bin)


# Variables supplémentaires pour les matchs de chaque pot
@variable(model, two_matches_potA[1:T], Bin)
@variable(model, two_matches_potB[1:T], Bin)
@variable(model, two_matches_potC[1:T], Bin)
@variable(model, two_matches_potD[1:T], Bin)


# Contrainte : une équipe ne peut pas jouer contre elle-même
@constraint(model, no_self_play[i in 1:N, t in 1:T], x[i, i, t] == 0)

# Contrainte : une équipe joue au plus 1 fois contre chaque autre équipe
@constraint(model, max_one_game[i in 1:N, j in 1:N; i != j], sum(x[i, j, t] + x[j, i, t] for t in 1:T) <= 1)

# Contrainte : chaque équipe joue exactement un match par journée
@constraint(model, one_game_per_day[t in 1:T, i in 1:N], sum(x[i, j, t] + x[j, i, t] for j in 1:N) == 1)

# Contraintes spécifiques pour chaque pot
for i in 1:N
    for pot_start in 1:9:28
        @constraint(model, sum(x[i, j, t] for t in 1:T, j in pot_start:pot_start+8) == 1)
        @constraint(model, sum(x[j, i, t] for t in 1:T, j in pot_start:pot_start+8) == 1)
    end
end

# Contrainte pour l'alternance stricte au début et à la fin
@constraint(model, strict_alternate_start[i in 1:N], sum(x[i, j, 1] + x[i, j, 2] for j in 1:N) == 1)
@constraint(model, strict_alternate_end[i in 1:N], sum(x[i, j, 7] + x[i, j, 8] for j in 1:N) == 1)

# Contrainte pour l'alternance parfaite home/away sauf pour A1, B1, C1 et D1 
for i in 1:N
    for t in 1:7
        @constraint(model, sum(x[i, j, t] + x[i, j, t+1] for j in 1:N) == 1)
        @constraint(model, sum(x[j, i, t] + x[j, i, t+1] for j in 1:N) == 1)
    end
end

# Contrainte pour limiter les breaks à 1 maximum pour les équipes A1, B1, C1 et D1
for i in 1:4
    for t in 2:6
        @constraint(model, sum(x[(i-1)*9+1, j, t] + x[(i-1)*9+1, j, t+1] for j in 1:N) <= 1 + break_var[i, t])
        @constraint(model, sum(x[j, (i-1)*9+1, t] + x[j, (i-1)*9+1, t+1] for j in 1:N) <= 1 + break_var[i, t])
    end
    @constraint(model, sum(break_var[i, t] for t in 2:6) <= 1)
end


# Contraintes pour s'assurer qu'il y a exactement 1 jour avec 2 matchs pour chaque pot
@constraint(model, sum(two_matches_potA[t] for t in 1:T) == 1)
@constraint(model, sum(two_matches_potB[t] for t in 1:T) == 1)
@constraint(model, sum(two_matches_potC[t] for t in 1:T) == 1)
@constraint(model, sum(two_matches_potD[t] for t in 1:T) == 1)

# Contraintes pour s'assurer que chaque jour a soit 1 soit 2 matchs pour chaque pot
for t in 1:T
    @constraint(model, sum(x[i, j, t] for i in 1:9, j in 1:9) == 1 + two_matches_potA[t])
    @constraint(model, sum(x[i, j, t] for i in 10:18, j in 10:18) == 1 + two_matches_potB[t])
    @constraint(model, sum(x[i, j, t] for i in 19:27, j in 19:27) == 1 + two_matches_potC[t])
    @constraint(model, sum(x[i, j, t] for i in 28:36, j in 28:36) == 1 + two_matches_potD[t])
end


# Fonction pour ajouter une contrainte de matchs maximum entre deux pots par journée
function add_max_inter_pot_constraint(potA_start, potA_end, potB_start, potB_end, min_matches, max_matches)
    for t in 1:T
        @constraint(model, min_matches <= sum(x[i, j, t] for i in potA_start:potA_end, j in potB_start:potB_end) + 
                            sum(x[i, j, t] for i in potB_start:potB_end, j in potA_start:potA_end) <= max_matches)
    end
end


# Appliquer la contrainte pour chaque paire de pots avec un maximum de 3 matchs par journée
add_max_inter_pot_constraint(1, 9, 10, 18, 2, 3) # Pots A et B
add_max_inter_pot_constraint(1, 9, 19, 27, 2, 3) # Pots A et C
add_max_inter_pot_constraint(1, 9, 28, 36, 1, 3) # Pots A et D
add_max_inter_pot_constraint(10, 18, 19, 27, 2, 3) # Pots B et C
add_max_inter_pot_constraint(10, 18, 28, 36, 1, 3) # Pots B et D
add_max_inter_pot_constraint(19, 27, 28, 36, 1, 3) # Pots C et D



# Ajouter des contraintes pour encourager un ordre séquentiel de matchs au sein de chaque pot
function encourage_sequential_matches(model, pot_start, pot_end)
    # Pour chaque équipe dans le pot
    for i in pot_start:pot_end
        next_team = i+1 <= pot_end ? i+1 : pot_start
        prev_team = i-1 >= pot_start ? i-1 : pot_end
        # Encourage l'équipe i à jouer contre l'équipe suivante et précédente dans le pot
        for t in 1:T
            @constraint(model, sum(x[i, next_team, t] for t in 1:T) == 1) # Jouer contre l'équipe suivante une fois
            @constraint(model, sum(x[prev_team, i, t] for t in 1:T) == 1) # Jouer contre l'équipe précédente une fois
        end
    end
end

# Encourager un ordre séquentiel de matchs pour chaque pot
encourage_sequential_matches(model, 1, 9)   # Pot A
encourage_sequential_matches(model, 10, 18) # Pot B
encourage_sequential_matches(model, 19, 27) # Pot C
encourage_sequential_matches(model, 28, 36) # Pot D


# Fonction pour ajouter la contrainte d'éviter les matchs consécutifs entre différents pots
function add_no_consecutive_inter_pot_matches_constraint_3(pot_start, pot_end)
    for i in 1:N
        for t in 1:(T-2)
            @constraint(model, sum(x[i, j, t] + x[i, j, t+1] + x[i, j, t+2] + x[j, i, t] + x[j, i, t+1] + x[j, i, t+2] for j in pot_start:pot_end) <= 1)
        end
    end
end

function add_no_consecutive_inter_pot_matches_constraint_2(pot_start, pot_end)
    for i in 1:N
        for t in 1:(T-1)
            @constraint(model, sum(x[i, j, t] + x[i, j, t+1] + x[j, i, t] + x[j, i, t+1] for j in pot_start:pot_end) <= 1)
        end
    end
end

# Appliquer la contrainte pour tous les pots
add_no_consecutive_inter_pot_matches_constraint_3(1, 9)   # avec Pot A
add_no_consecutive_inter_pot_matches_constraint_3(10, 18) # avec Pot B


for i in 1:N
    # Assurer que l'équipe i joue contre une équipe du pot spécifié pendant les 4 premières journées
    @constraint(model, sum(x[i, j, t] + x[j, i, t] for j in 28:36, t in 7:8) <= 1)
    @constraint(model, sum(x[i, j, t] + x[j, i, t] for j in 28:36, t in 1:2) <= 1)
    @constraint(model, sum(x[i, j, t] + x[j, i, t] for j in 19:27, t in 7:8) <= 1)
    @constraint(model, sum(x[i, j, t] + x[j, i, t] for j in 19:27, t in 1:2) <= 1)
end

#add_no_consecutive_inter_pot_matches_constraint_2(28, 36) # avec Pot D

#=
add_no_consecutive_inter_pot_matches_constraint(19, 27) # avec Pot C
add_no_consecutive_inter_pot_matches_constraint(28, 36) # avec Pot D
=#

#=
function add_no_consecutive_inter_pot_matches_constraint(potA_start, potA_end, potB_start, potB_end)
    for i in potA_start:potA_end
        for t in 1:(T-1)
            @constraint(model, sum(x[i, j, t] + x[i, j, t+1] + x[j, i, t] + x[j, i, t+1] for j in potB_start:potB_end) <= 1)
        end
    end
end

# Appliquer la contrainte pour toutes les combinaisons de pots, y compris les matchs au sein du même pot
add_no_consecutive_inter_pot_matches_constraint(1, 9, 1, 9)     # Pot A avec Pot A
add_no_consecutive_inter_pot_matches_constraint(10, 18, 10, 18) # Pot B avec Pot B
add_no_consecutive_inter_pot_matches_constraint(19, 27, 19, 27) # Pot C avec Pot C
add_no_consecutive_inter_pot_matches_constraint(28, 36, 28, 36) # Pot D avec Pot D
add_no_consecutive_inter_pot_matches_constraint(1, 9, 10, 18)   # Pot A avec Pot B
add_no_consecutive_inter_pot_matches_constraint(1, 9, 19, 27)   # Pot A avec Pot C
add_no_consecutive_inter_pot_matches_constraint(1, 9, 28, 36)   # Pot A avec Pot D
add_no_consecutive_inter_pot_matches_constraint(10, 18, 19, 27) # Pot B avec Pot C
add_no_consecutive_inter_pot_matches_constraint(10, 18, 28, 36) # Pot B avec Pot D
add_no_consecutive_inter_pot_matches_constraint(19, 27, 28, 36) # Pot C avec Pot D
=#

#=
add_no_consecutive_inter_pot_matches_constraint(10, 18, 1, 9)   # Pot B avec Pot A
add_no_consecutive_inter_pot_matches_constraint(19, 27, 1, 9)   # Pot C avec Pot A
add_no_consecutive_inter_pot_matches_constraint(28, 36, 1, 9)   # Pot D avec Pot A
add_no_consecutive_inter_pot_matches_constraint(19, 27, 10, 18) # Pot C avec Pot B
add_no_consecutive_inter_pot_matches_constraint(28, 36, 10, 18) # Pot D avec Pot B
add_no_consecutive_inter_pot_matches_constraint(28, 36, 19, 27) # Pot D avec Pot C
=#




# ------------------------------------------------SOLVEUR------------------------------------------------------------------------------






# Lancement de l'optimisation pour trouver une solution réalisable
optimize!(model)

# Vérifier si une solution a été trouvée
if termination_status(model) == MOI.OPTIMAL || termination_status(model) == MOI.FEASIBLE
    println("Une solution a été trouvée.")

    breaks = 0
    breaks = sum(value(break_var[i, t]) for i in 1:4 for t in 2:6 if value(break_var[i, t]) > 0.5)
    println("Nombre de breaks : $(breaks)")    

    # Créer une structure pour stocker le calendrier des matchs
    match_schedule = Dict()

    # Parcourir toutes les combinaisons d'équipes et de journées
    for t in 1:T
        for i in 1:N
            for j in 1:N
                if value(x[i, j, t]) > 0.5 # Si l'équipe i joue contre l'équipe j à la journée t
                    if !haskey(match_schedule, t)
                        match_schedule[t] = []
                    end
                    push!(match_schedule[t], (i, j))
                end
            end
        end
    end

    # Afficher le calendrier des matchs
    for t in 1:T
        println("Journée $t:")
        for match in match_schedule[t]
            println("Équipe $(match[1]) vs Équipe $(match[2])")
        end
    end
end

using CSV, DataFrames

# Fonction pour convertir le numéro d'équipe en nom
function team_name(team_number)
    if team_number <= 9
        return "A" * string(team_number)
    elseif team_number <= 18
        return "B" * string(team_number - 9)
    elseif team_number <= 27
        return "C" * string(team_number - 18)
    else
        return "D" * string(team_number - 27)
    end
end

# Créer un DataFrame pour stocker les matchs
df_matches = DataFrame(Day = Int[], Team1 = String[], Team2 = String[])

for t in 1:T
    for match in match_schedule[t]
        push!(df_matches, (t, team_name(match[1]), team_name(match[2])))
    end
end

# Sauvegarder le DataFrame dans un fichier CSV
CSV.write("match_schedule_break.csv", df_matches)

using DataFrames
using CSV

# Supposons que vous avez une fonction qui retourne le nom de l'équipe basé sur un identifiant
# Par exemple : team_name(1) retourne "A1", team_name(10) retourne "B1", etc.

# Initialisation des DataFrames pour chaque équipe
team_schedules = Dict{String, DataFrame}()

for team_id in 1:N
    team_schedules[team_name(team_id)] = DataFrame(Day = Int[], Opponent = String[], HomeAway = String[])
end

# Remplir les DataFrames avec les matchs pour chaque équipe
for t in 1:T
    for i in 1:N
        for j in 1:N
            if value(x[i, j, t]) > 0.5  # ou juste 'value(x[i, j, t]) == 1' si les résultats sont définitifs
                # i joue à domicile contre j
                push!(team_schedules[team_name(i)], (Day = t, Opponent = team_name(j), HomeAway = "Home"))
                # j joue à l'extérieur contre i
                push!(team_schedules[team_name(j)], (Day = t, Opponent = team_name(i), HomeAway = "Away"))
            end
        end
    end
end


# Si vous préférez un seul fichier CSV pour toutes les équipes, vous pouvez faire comme suit:
all_teams_schedule = vcat(team_schedules...)
CSV.write("all_teams_schedule.csv", all_teams_schedule)
