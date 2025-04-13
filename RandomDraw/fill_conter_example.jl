"""
This script is used to attribute teams to the vertices of the counter-example graph according to the constraints of the problem.
"""
using JuMP, Gurobi

edges_colored = [
    [1, 4, 5], [1, 10, 9], [1, 19, 6], [1, 28, 3],
    [2, 1, 1], [2, 11, 3], [2, 20, 7], [2, 29, 6],
    [3, 2, 5], [3, 12, 1], [3, 21, 8], [3, 30, 3],
    [4, 3, 4], [4, 13, 9], [4, 22, 6], [4, 32, 7],
    [5, 9, 3], [5, 14, 7], [5, 23, 2], [5, 33, 5],
    [6, 5, 9], [6, 15, 2], [6, 24, 6], [6, 31, 5],
    [7, 6, 4], [7, 16, 3], [7, 26, 1], [7, 35, 6],
    [8, 7, 5], [8, 17, 1], [8, 27, 9], [8, 36, 8],
    [9, 8, 6], [9, 18, 8], [9, 25, 7], [9, 34, 1],
    [10, 3, 6], [10, 11, 1], [10, 19, 8], [10, 29, 2],
    [11, 1, 7], [11, 12, 6], [11, 20, 8], [11, 30, 9],
    [12, 2, 4], [12, 10, 7], [12, 21, 5], [12, 28, 8],
    [13, 6, 7], [13, 14, 6], [13, 23, 4], [13, 32, 2],
    [14, 4, 1], [14, 15, 8], [14, 24, 2], [14, 33, 4],
    [15, 5, 4], [15, 13, 3], [15, 22, 7], [15, 31, 9],
    [16, 9, 4], [16, 17, 7], [16, 26, 9], [16, 35, 5],
    [17, 7, 9], [17, 18, 3], [17, 27, 8], [17, 36, 5],
    [18, 8, 4], [18, 16, 1], [18, 25, 9], [18, 34, 5],
    [19, 3, 9], [19, 12, 3], [19, 20, 5], [19, 28, 4],
    [20, 1, 2], [20, 10, 4], [20, 21, 6], [20, 29, 9],
    [21, 2, 9], [21, 11, 2], [21, 19, 1], [21, 30, 4],
    [22, 6, 1], [22, 13, 5], [22, 24, 4], [22, 32, 3],
    [23, 4, 8], [23, 14, 3], [23, 22, 9], [23, 33, 1],
    [24, 5, 8], [24, 15, 1], [24, 23, 7], [24, 31, 3],
    [25, 7, 2], [25, 16, 6], [25, 27, 1], [25, 35, 8],
    [26, 8, 7], [26, 17, 2], [26, 25, 5], [26, 36, 6],
    [27, 9, 5], [27, 18, 6], [27, 26, 4], [27, 34, 7],
    [28, 3, 2], [28, 10, 5], [28, 21, 7], [28, 29, 1],
    [29, 1, 8], [29, 11, 4], [29, 19, 7], [29, 30, 5],
    [30, 2, 8], [30, 12, 2], [30, 20, 1], [30, 28, 6],
    [31, 4, 2], [31, 13, 1], [31, 22, 8], [31, 33, 7],
    [32, 5, 6], [32, 14, 9], [32, 23, 5], [32, 31, 4],
    [33, 6, 3], [33, 15, 6], [33, 24, 9], [33, 32, 8],
    [34, 7, 8], [34, 16, 2], [34, 25, 3], [34, 35, 9],
    [35, 8, 2], [35, 17, 4], [35, 26, 3], [35, 36, 1],
    [36, 9, 9], [36, 18, 7], [36, 27, 2], [36, 34, 4]
]


edges = [[a, b] for (a, b, c) in edges_colored]

@assert length(edges) == 144


const teams = [
    Dict("club" => "Real", "nationality" => "Spain", "elo" => 1985, "uefa" => 136),                    #1
    Dict("club" => "ManCity", "nationality" => "England", "elo" => 2057, "uefa" => 148),               #2
    Dict("club" => "Bayern", "nationality" => "Germany", "elo" => 1904, "uefa" => 144),                #3
    Dict("club" => "PSG", "nationality" => "France", "elo" => 1893, "uefa" => 116),                    #4
    Dict("club" => "Liverpool", "nationality" => "England", "elo" => 1908, "uefa" => 114),             #5
    Dict("club" => "Inter", "nationality" => "Italy", "elo" => 1960, "uefa" => 101),                   #6
    Dict("club" => "Dortmund", "nationality" => "Germany", "elo" => 1874, "uefa" => 97),               #7
    Dict("club" => "Leipzig", "nationality" => "Germany", "elo" => 1849, "uefa" => 97),                #8
    Dict("club" => "Barcelona", "nationality" => "Spain", "elo" => 1894, "uefa" => 91),                #9
    Dict("club" => "Leverkusen", "nationality" => "Germany", "elo" => 1929, "uefa" => 90),             #10
    Dict("club" => "Atlético", "nationality" => "Spain", "elo" => 1830, "uefa" => 89),                 #11
    Dict("club" => "Atalanta", "nationality" => "Italy", "elo" => 1879, "uefa" => 81),                 #12
    Dict("club" => "Juventus", "nationality" => "Italy", "elo" => 1839, "uefa" => 80),                 #13
    Dict("club" => "Benfica", "nationality" => "Portugal", "elo" => 1824, "uefa" => 79),               #14
    Dict("club" => "Arsenal", "nationality" => "England", "elo" => 1957, "uefa" => 72),                #15
    Dict("club" => "Brugge", "nationality" => "Belgium", "elo" => 1703, "uefa" => 64),                 #16
    Dict("club" => "Shakhtar", "nationality" => "Ukraine", "elo" => 1573, "uefa" => 63),               #17
    Dict("club" => "Milan", "nationality" => "Italy", "elo" => 1821, "uefa" => 59),                    #18
    Dict("club" => "Feyenoord", "nationality" => "Netherlands", "elo" => 1747, "uefa" => 57),          #19
    Dict("club" => "Sporting", "nationality" => "Portugal", "elo" => 1824, "uefa" => 54.5),            #20
    Dict("club" => "Eindhoven", "nationality" => "Netherlands", "elo" => 1794, "uefa" => 54),          #21
    Dict("club" => "Dinamo", "nationality" => "Croatia", "elo" => 1584, "uefa" => 50),                 #22
    Dict("club" => "Salzburg", "nationality" => "Austria", "elo" => 1693, "uefa" => 50),               #23
    Dict("club" => "Lille", "nationality" => "France", "elo" => 1785, "uefa" => 47),                   #24
    Dict("club" => "Crvena", "nationality" => "Serbia", "elo" => 1734, "uefa" => 40),                  #25
    Dict("club" => "YB", "nationality" => "Switzerland", "elo" => 1566, "uefa" => 34.5),               #26
    Dict("club" => "Celtic", "nationality" => "Scotland", "elo" => 1646, "uefa" => 32),                #27
    Dict("club" => "Bratislava", "nationality" => "Slovakia", "elo" => 1703, "uefa" => 30.5),          #28
    Dict("club" => "Monaco", "nationality" => "France", "elo" => 1780, "uefa" => 24),                  #29
    Dict("club" => "Sparta", "nationality" => "Czech Republic", "elo" => 1716, "uefa" => 22.5),        #30
    Dict("club" => "Aston Villa", "nationality" => "England", "elo" => 1772, "uefa" => 20.86),         #31
    Dict("club" => "Bologna", "nationality" => "Italy", "elo" => 1777, "uefa" => 18.056),              #32
    Dict("club" => "Girona", "nationality" => "Spain", "elo" => 1791, "uefa" => 17.897),               #33
    Dict("club" => "Stuttgart", "nationality" => "Germany", "elo" => 1795, "uefa" => 17.324),          #34
    Dict("club" => "Sturm Graz", "nationality" => "Austria", "elo" => 1610, "uefa" => 14.500),         #35
    Dict("club" => "Brest", "nationality" => "France", "elo" => 1685, "uefa" => 13.366)                #36 
]

function find_remplissage_graph()
    model = Model(Gurobi.Optimizer)

    # Paramètres
    N = 36
    group_size = 9
    groupes = [1:9, 10:18, 19:27, 28:36]
    nationality_groups =
        ((1, 9, 11, 33), # Spain
            (2, 5, 15, 31), # England
            (3, 7, 8, 10, 34), #  Germany
            (4, 24, 29, 36), # France
            (6, 12, 13, 18, 32), # Italy
            (14, 20), # Portugal
            (16), # Belgium
            (17), # Ukraine
            (19, 21), # Netherlands
            (22), # Croatia
            (23, 35), # Austria
            (25), # Serbia
            (26), # Switzerland
            (27), # Scotland 
            (28), # Slovakia
            (30) # Czech Republic
        )
    nb_color = 9

    function get_nationality(team, nationality_groups)
        for nat_group in nationality_groups
            if team in nat_group
                return nat_group
            end
        end
    end

    println(get_nationality(1, nationality_groups) == get_nationality(33, nationality_groups))

    # Variables
    @variable(model, y[1:N, 1:N], Bin) # vaut 1 si l'équipe i est associée au sommet j

    # Une équipe est associée à un unique sommet et réciproquement
    for i in 1:N
        @constraint(model, sum(y[i, j] for j in 1:N) == 1)
    end

    for j in 1:N
        @constraint(model, sum(y[i, j] for i in 1:N) == 1)
    end

    # Contrainte de groupe : les équipes sont dans leur groupe
    for group in groupes
        for i in group
            @constraint(model, sum(y[i, j] for j in group) == 1)
        end
    end

    # Contrainte de nationalité
    for j in 1:N
        for nationality_group in nationality_groups
            @constraint(model, sum(y[k, l] for k in nationality_group for l in 1:N if [l, j] in edges || [j, l] in edges) <= 2)
        end
    end

    # Ajout d'une contrainte supplémentaire
    for j in 1:N
        for voisin in 1:N
            if [j, voisin] in edges || (voisin, j) in edges
                for i in 1:N
                    for i2 in 1:N
                        if get_nationality(i, nationality_groups) == get_nationality(i2, nationality_groups)
                            @constraint(model, y[i, j] + y[i2, voisin] <= 1)
                        end
                    end
                end
            end
        end
    end

    # Résolution du modèle
    optimize!(model)
    if termination_status(model) == MOI.OPTIMAL
        println("Une solution existe.")
        solution = []
        for i in 1:N
            for j in 1:N
                if value(y[i, j]) > 0.5
                    push!(solution, "L'équipe $(teams[i]["club"]) au sommet: $j")
                end
            end
        end
        println("Remplissage trouvé :")
        println(length(solution))
        println(solution)
    else
        println("Aucune solution trouvée.")
    end
end

find_remplissage_graph()


