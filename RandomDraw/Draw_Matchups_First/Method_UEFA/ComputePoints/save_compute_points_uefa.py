import math

#Definition of the Club and Match classes
class Club:
    def __init__(self, name, elo):
        self.name = name
        self.elo = elo

    def __str__(self):
        return self.name
    
    def __repr__(self):
        return self.name


class Match:
    def __init__(self, club_home, club_away):
        self.club_home = club_home
        self.club_away = club_away

    def __str__(self):
        return f"{self.club_home} - {self.club_away}"
    
    def __repr__(self):
        return f"{self.club_home} - {self.club_away}"
    

########################################## REPORT DES RESULTATS DU TIRAGE ##########################################
    

all_teams = [
    "Real Madrid", "Manchester City", "Bayern Munich", "Paris Saint-Germain", "Monaco", "Lille", "Brest", "Liverpool",
    "Inter Milan", "Borussia Dortmund", "RB Leipzig", "Barcelona", "Bayer Leverkusen", "Atlético Madrid",
    "Atalanta", "Juventus", "Benfica", "Arsenal", "Club Brugge", "Shakhtar Donetsk",
    "AC Milan", "Feyenoord", "Sporting CP", "PSV Eindhoven", "Red Bull Salzburg", "Crvena Zvezda",
    "Young Boys", "Celtic", "Slovan Bratislava", "Sparta Praha", "Aston Villa", "Bologna",
    "Girona", "Stuttgart", "Sturm Graz", "Dinamo"
]

#Report des scores elo
Real = Club("Real Madrid", 1985)
ManCity = Club("Manchester City", 2057)
Bayern = Club("Bayern Munich", 1904)
PSG = Club("Paris Saint-Germain", 1893)
Liverpool = Club("Liverpool", 1908)
Inter = Club("Inter Milan", 1960)
Dortmund = Club("Borussia Dortmund", 1874)
Leipzig = Club("RB Leipzig", 1849)
Barcelona = Club("Barcelona", 1894)
Leverkusen = Club("Bayer Leverkusen", 1929)
Atlético = Club("Atlético Madrid", 1830)
Atalanta = Club("Atalanta", 1879)
Juventus = Club("Juventus", 1839)
Benfica = Club("Benfica", 1824)
Arsenal = Club("Arsenal", 1957)
Brugge = Club("Club Brugge", 1703)
Shakhtar = Club("Shakhtar Donetsk", 1573)
Milan = Club("AC Milan", 1821)
Feyenoord = Club("Feyenoord", 1747)
Sporting = Club("Sporting CP", 1824)
Eindhoven = Club("PSV Eindhoven", 1794)
Dinamo = Club("Dinamo Zagreb", 1584)
Salzburg = Club("Red Bull Salzburg", 1693)
Lille = Club("Lille", 1785)
Crvena = Club("Crvena Zvezda", 1734)
YB = Club("Young Boys", 1566)
Celtic = Club("Celtic", 1646)
Bratislava = Club("Slovan Bratislava", 1703)
Monaco = Club("Monaco", 1780)
Sparta = Club("Sparta Praha", 1716)
AstonVilla = Club("Aston Villa", 1772)
Bologna = Club("Bologna", 1777)
Girona = Club("Girona", 1791)
Stuttgart = Club("Stuttgart", 1795)
SturmGraz = Club("Sturm Graz", 1610)
Brest = Club("Brest", 1685)


Real_matches = [
    Match(Real, Dortmund),
    Match(Liverpool, Real), 
    Match(Real, Milan),  
    Match(Atalanta, Real),  
    Match(Real, Salzburg), 
    Match(Lille, Real),
    Match(Real, Stuttgart), 
    Match(Brest, Real) 
]

ManCity_matches = [
    Match(ManCity, Inter),
    Match(PSG, ManCity), 
    Match(ManCity, Brugge),  
    Match(Juventus, ManCity), 
    Match(ManCity, Feyenoord),  
    Match(Sporting, ManCity), 
    Match(ManCity, Sparta),  
    Match(Bratislava, ManCity)  
]

Bayern_matches = [
    Match(Bayern, PSG),
    Match(Barcelona, Bayern),
    Match(Bayern, Benfica),
    Match(Shakhtar, Bayern),
    Match(Bayern, Dinamo),
    Match(Feyenoord, Bayern),
    Match(Bayern, Bratislava),
    Match(AstonVilla, Bayern)
]

PSG_matches = [
    Match(PSG, ManCity),  
    Match(Bayern, PSG),  
    Match(PSG, Atlético),  
    Match(Arsenal, PSG),  
    Match(PSG, Eindhoven),  
    Match(Salzburg, PSG),  
    Match(PSG, Girona),  
    Match(Stuttgart, PSG)
]

Monaco_matches = [
    Match(Monaco,Barcelona),
    Match(Inter, Monaco),
    Match(Monaco, Benfica),
    Match(Arsenal, Monaco),
    Match(Monaco, Crvena),
    Match(Dinamo, Monaco),
    Match(Monaco, AstonVilla),
    Match(Bologna, Monaco)
]

Lille_matches = [
    Match(Lille, Real),
    Match(Liverpool, Lille),
    Match(Lille, Juventus),
    Match(Atlético, Lille),
    Match(Lille, Feyenoord),
    Match(Sporting, Lille), 
    Match(Lille, SturmGraz),  
    Match(Bologna, Lille),  
]

Brest_matches = [
    Match(Brest, Real), 
    Match(Barcelona, Brest),  
    Match(Brest, Leverkusen), 
    Match(Shakhtar, Brest),  
    Match(Brest, Eindhoven), 
    Match(Salzburg, Brest),  
    Match(Brest, SturmGraz), 
    Match(Sparta, Brest)  
]

Liverpool_matches = [
    Match(Liverpool, Real),  
    Match(Leipzig, Liverpool), 
    Match(Liverpool, Leverkusen),  
    Match(Milan, Liverpool), 
    Match(Liverpool, Lille),  
    Match(Eindhoven, Liverpool), 
    Match(Liverpool, Bologna),  
    Match(Girona, Liverpool), 
]

Inter_matches = [
    Match(Inter, Leipzig),
    Match(ManCity, Inter),
    Match(Inter, Arsenal),
    Match(Leverkusen, Inter),
    Match(Inter, Crvena),
    Match(YB, Inter),
    Match(Inter, Monaco),
    Match(Sparta, Inter)
]

Dortmund_matches = [
    Match(Dortmund, Barcelona),
    Match(Real, Dortmund),
    Match(Dortmund, Shakhtar),
    Match(Brugge, Dortmund),
    Match(Dortmund, Celtic),
    Match(Dinamo, Dortmund),
    Match(Dortmund, SturmGraz),
    Match(Bologna, Dortmund)
]

Leipzig_matches = [
    Match(Leipzig, Liverpool),
    Match(Inter, Leipzig), 
    Match(Leipzig, Juventus),
    Match(Atlético, Leipzig), 
    Match(Leipzig, Sporting),
    Match(Celtic, Leipzig), 
    Match(Leipzig, AstonVilla),
    Match(SturmGraz, Leipzig), 
]

Barcelona_matches = [
    Match(Barcelona, Bayern),
    Match(Dortmund, Barcelona), 
    Match(Barcelona, Atalanta),
    Match(Benfica, Barcelona), 
    Match(Barcelona, YB),
    Match(Crvena, Barcelona), 
    Match(Barcelona, Brest),
    Match(Monaco, Barcelona), 
]

Leverkusen_matches = [
    Match(Leverkusen, Inter), 
    Match(Liverpool, Leverkusen),  # Away
    Match(Leverkusen, Milan),  # Home
    Match(Atlético, Leverkusen),  # Away
    Match(Leverkusen, Salzburg),  # Home
    Match(Feyenoord, Leverkusen),  # Away
    Match(Leverkusen, Sparta),  # Home
    Match(Brest, Leverkusen),  # Away
]

Atletico_matches = [
    Match(Atlético, Leipzig),  # Home
    Match(PSG, Atlético),  # Away
    Match(Atlético, Leverkusen),  # Home
    Match(Benfica, Atlético),  # Away
    Match(Atlético, Lille),  # Home
    Match(Salzburg, Atlético),  # Away
    Match(Atlético, Bratislava),  # Home
    Match(Sparta, Atlético),  # Away
]

Atalanta_matches = [
    Match(Atalanta, Real),  # Home
    Match(Barcelona, Atalanta),  # Away
    Match(Atalanta, Arsenal),  # Home
    Match(Shakhtar, Atalanta),  # Away
    Match(Atalanta, Celtic),  # Home
    Match(YB, Atalanta),  # Away
    Match(Atalanta, SturmGraz),  # Home
    Match(Stuttgart, Atalanta),  # Away
]

Juventus_matches = [
    Match(Juventus, ManCity),  # Home
    Match(Leipzig, Juventus),  # Away
    Match(Juventus, Benfica),  # Home
    Match(Brugge, Juventus),  # Away
    Match(Juventus, Eindhoven),  # Home
    Match(Lille, Juventus),  # Away
    Match(Juventus, Stuttgart),  # Home
    Match(AstonVilla, Juventus),  # Away
]

Benfica_matches = [
    Match(Benfica, Barcelona),  # Home
    Match(Bayern, Benfica),  # Away
    Match(Benfica, Atlético),  # Home
    Match(Juventus, Benfica),  # Away
    Match(Benfica, Feyenoord),  # Home
    Match(Crvena, Benfica),  # Away
    Match(Benfica, Bologna),  # Home
    Match(Monaco, Benfica),  # Away
]

Arsenal_matches = [
    Match(Arsenal, PSG),  # Home
    Match(Inter, Arsenal),  # Away
    Match(Arsenal, Shakhtar),  # Home
    Match(Atalanta, Arsenal),  # Away
    Match(Arsenal, Dinamo),  # Home
    Match(Sporting, Arsenal),  # Away
    Match(Arsenal, Monaco),  # Home
    Match(Girona, Arsenal),  # Away
]

Brugge_matches = [
    Match(Brugge, Dortmund),  # Home
    Match(ManCity, Brugge),  # Away
    Match(Brugge, Juventus),  # Home
    Match(Milan, Brugge),  # Away
    Match(Brugge, Sporting),  # Home
    Match(Celtic, Brugge),  # Away
    Match(Brugge, AstonVilla),  # Home
    Match(SturmGraz, Brugge),  # Away
]

Shakhtar_matches = [
    Match(Shakhtar, Bayern),  # Home
    Match(Dortmund, Shakhtar),  # Away
    Match(Shakhtar, Atalanta),  # Home
    Match(Arsenal, Shakhtar),  # Away
    Match(Shakhtar, YB),  # Home
    Match(Eindhoven, Shakhtar),  # Away
    Match(Shakhtar, Brest),  # Home
    Match(Bologna, Shakhtar),  # Away
]

Milan_matches = [
    Match(Milan, Liverpool),  # Home
    Match(Real, Milan),  # Away
    Match(Milan, Brugge),  # Home
    Match(Leverkusen, Milan),  # Away
    Match(Milan, Crvena),  # Home
    Match(Dinamo, Milan),  # Away
    Match(Milan, Girona),  # Home
    Match(Bratislava, Milan),  # Away
]

Feyenoord_matches = [
    Match(Feyenoord, Bayern),  # Home
    Match(ManCity, Feyenoord),  # Away
    Match(Feyenoord, Leverkusen),  # Home
    Match(Benfica, Feyenoord),  # Away
    Match(Feyenoord, Salzburg),  # Home
    Match(Lille, Feyenoord),  # Away
    Match(Feyenoord, Sparta),  # Home
    Match(Girona, Feyenoord),  # Away
]

Sporting_matches = [
    Match(Sporting, ManCity),  # Home
    Match(Leipzig, Sporting),  # Away
    Match(Sporting, Arsenal),  # Home
    Match(Brugge, Sporting),  # Away
    Match(Sporting, Lille),  # Home
    Match(Eindhoven, Sporting),  # Away
    Match(Sporting, Bologna),  # Home
    Match(SturmGraz, Sporting),  # Away
]

Eindhoven_matches = [
    Match(Eindhoven, Liverpool),  # Home
    Match(PSG, Eindhoven),  # Away
    Match(Eindhoven, Shakhtar),  # Home
    Match(Juventus, Eindhoven),  # Away
    Match(Eindhoven, Sporting),  # Home
    Match(Crvena, Eindhoven),  # Away
    Match(Eindhoven, Girona),  # Home
    Match(Brest, Eindhoven),  # Away
]

Salzburg_matches = [
    Match(Salzburg, PSG),  # Home
    Match(Real, Salzburg),  # Away
    Match(Salzburg, Atlético),  # Home
    Match(Leverkusen, Salzburg),  # Away
    Match(Salzburg, Dinamo),  # Home
    Match(Feyenoord, Salzburg),  # Away
    Match(Salzburg, Brest),  # Home
    Match(Sparta, Salzburg),  # Away
]

Crvena_matches = [
    Match(Crvena, Barcelona),  # Home
    Match(Inter, Crvena),  # Away
    Match(Crvena, Benfica),  # Home
    Match(Milan, Crvena),  # Away
    Match(Crvena, Eindhoven),  # Home
    Match(YB, Crvena),  # Away
    Match(Crvena, Stuttgart),  # Home
    Match(Monaco, Crvena),  # Away
]

YB_matches = [
    Match(YB, Inter),  # Home
    Match(Barcelona, YB),  # Away
    Match(YB, Atalanta),  # Home
    Match(Shakhtar, YB),  # Away
    Match(YB, Crvena),  # Home
    Match(Celtic, YB),  # Away
    Match(YB, AstonVilla),  # Home
    Match(Stuttgart, YB),  # Away
]

Celtic_matches = [
    Match(Celtic, Leipzig),  # Home
    Match(Dortmund, Celtic),  # Away
    Match(Celtic, Brugge),  # Home
    Match(Atalanta, Celtic),  # Away
    Match(Celtic, YB),  # Home
    Match(Dinamo, Celtic),  # Away
    Match(Celtic, Bratislava),  # Home
    Match(AstonVilla, Celtic),  # Away
]

Bratislava_matches = [
    Match(Bratislava, ManCity),  # Home
    Match(Bayern, Bratislava),  # Away
    Match(Bratislava, Milan),  # Home
    Match(Atlético, Bratislava),  # Away
    Match(Bratislava, Dinamo),  # Home
    Match(Celtic, Bratislava),  # Away
    Match(Bratislava, Stuttgart),  # Home
    Match(Girona, Bratislava),  # Away
]

Sparta_matches = [
    Match(Sparta, Inter),  # Home
    Match(ManCity, Sparta),  # Away
    Match(Sparta, Atlético),  # Home
    Match(Leverkusen, Sparta),  # Away
    Match(Sparta, Salzburg),  # Home
    Match(Feyenoord, Sparta),  # Away
    Match(Sparta, Brest),  # Home
    Match(Stuttgart, Sparta),  # Away
]

Astonvilla_matches = [
    Match(AstonVilla, Bayern),  # Home
    Match(Leipzig, AstonVilla),  # Away
    Match(AstonVilla, Juventus),  # Home
    Match(Brugge, AstonVilla),  # Away
    Match(AstonVilla, Celtic),  # Home
    Match(YB, AstonVilla),  # Away
    Match(AstonVilla, Bologna),  # Home
    Match(Monaco, AstonVilla),  # Away
]

# Création des objets Match en alternant domicile et extérieur
Bologna_matches = [
    Match(Bologna, Dortmund),  # Home
    Match(Liverpool, Bologna),  # Away
    Match(Bologna, Shakhtar),  # Home
    Match(Benfica, Bologna),  # Away
    Match(Bologna, Lille),  # Home
    Match(Sporting, Bologna),  # Away
    Match(Bologna, Monaco),  # Home
    Match(AstonVilla, Bologna),  # Away
]

Girona_matches = [
    Match(Girona, Liverpool),  # Home
    Match(PSG, Girona),  # Away
    Match(Girona, Arsenal),  # Home
    Match(Milan, Girona),  # Away
    Match(Girona, Feyenoord),  # Home
    Match(Eindhoven, Girona),  # Away
    Match(Girona, Bratislava),  # Home
    Match(SturmGraz, Girona),  # Away
]

Stuttgart_matches = [
    Match(Stuttgart, PSG),  # Home
    Match(Real, Stuttgart),  # Away
    Match(Stuttgart, Atalanta),  # Home
    Match(Juventus, Stuttgart),  # Away
    Match(Stuttgart, YB),  # Home
    Match(Crvena, Stuttgart),  # Away
    Match(Stuttgart, Sparta),  # Home
    Match(Bratislava, Stuttgart),  # Away
]

Sturmgraz_matches = [
    Match(SturmGraz, Leipzig),  # Home
    Match(Dortmund, SturmGraz),  # Away
    Match(SturmGraz, Brugge),  # Home
    Match(Atalanta, SturmGraz),  # Away
    Match(SturmGraz, Sporting),  # Home
    Match(Lille, SturmGraz),  # Away
    Match(SturmGraz, Girona),  # Home
    Match(Brest, SturmGraz),  # Away
]

Dinamo_matches = [
    Match(Dinamo, Dortmund),  # Home
    Match(Bayern, Dinamo),  # Away
    Match(Dinamo, Milan),  # Home
    Match(Arsenal, Dinamo),  # Away
    Match(Dinamo, Celtic),  # Home
    Match(Salzburg, Dinamo),  # Away
    Match(Dinamo, Monaco),  # Home
    Match(Bratislava, Dinamo),  # Away
]

li_li_matches = [Real_matches, ManCity_matches, Bayern_matches, PSG_matches, Monaco_matches, Lille_matches, Brest_matches, Liverpool_matches, Inter_matches, Dortmund_matches, Leipzig_matches, Barcelona_matches, Leverkusen_matches, Atletico_matches, Atalanta_matches, Juventus_matches, Benfica_matches, Arsenal_matches, Brugge_matches, Shakhtar_matches, Milan_matches, Feyenoord_matches, Sporting_matches, Eindhoven_matches, Salzburg_matches, Crvena_matches, YB_matches, Celtic_matches, Bratislava_matches, Sparta_matches, Astonvilla_matches, Bologna_matches, Girona_matches, Stuttgart_matches, Sturmgraz_matches, Dinamo_matches]


# List of probability functions according to elo ratings
def sigma(r, kappa):
    return 1 / ((10 ** ((-r) / 400)) + 1 + kappa)

def proba_win(elohome, eloaway, kappa, hfa):
    '''Compute the probability of winning for the home team'''
    r = elohome - eloaway + hfa
    return sigma(r, kappa)

def proba_lose(elohome, eloaway, kappa, hfa):
    '''Compute the probability of losing for the home team'''
    r = elohome - eloaway + hfa
    return sigma(-r, kappa)

def proba_draw(elohome, eloaway, kappa, hfa):
    '''Compute the probability of a draw'''
    return (1 - proba_win(elohome, eloaway, kappa, hfa) - proba_lose(elohome, eloaway, kappa, hfa))

def compute_team_points(team, li_matches, kappa=1, hfa=0):
    '''Compute the average points of a team'''
    total_points = 0
    for match in li_matches:
        if match.club_home.name == team:
            total_points += 3 * proba_win(match.club_home.elo, match.club_away.elo, kappa, hfa) + 1 * proba_draw(match.club_home.elo, match.club_away.elo, kappa, hfa)
        else:
            total_points += 3 * proba_lose(match.club_home.elo, match.club_away.elo, kappa, hfa) + 1 * proba_draw(match.club_home.elo, match.club_away.elo, kappa, hfa)
    return total_points


import matplotlib.pyplot as plt
def plot_bar_chart(kappa, hfa):
    # Compute the points of each team
    team_names = []
    team_points = []
    for k in range(36):
        team_name = all_teams[k]
        li_matches = li_li_matches[k]
        points = compute_team_points(team_name, li_matches ,kappa, hfa)
        team_names.append(team_name)
        team_points.append(points)

    # Plot the bar graph
    plt.figure(figsize=(10, 6))
    plt.bar(team_names, team_points)
    plt.xlabel('Team Name')
    plt.ylabel('Points')
    plt.title('Points of Each Team')
    plt.xticks(rotation=90)
    plt.show()
    return None


import pandas as pd
def save_team_ranking(kappa=1, hfa=0):
    # Compute the points of each team
    team_data = []
    for k in range(36):
        team_name = all_teams[k]
        li_matches = li_li_matches[k]
        points = compute_team_points(team_name, li_matches, kappa, hfa)
        team_data.append((team_name, points))

    # Sort the teams in descending order of points
    team_data.sort(key=lambda x: x[1], reverse=True)

    # Separate the team names and points into separate lists
    team_names = [data[0] for data in team_data]
    team_points = [data[1] for data in team_data]

    # Create a DataFrame with the team names and points
    df = pd.DataFrame({'Team Name': team_names, 'Points': team_points})

    # Save the DataFrame to an Excel file
    df.to_excel('team_ranking.xlsx', index=False)
    return None


def ecart_moyen():
    ecart_moyen = 0
    for k in range(36):
        li_matches = li_li_matches[k]
        team_name = all_teams[k]
        for match in li_matches:
            ecart_moyen += abs(match.club_home.elo - match.club_away.elo)

    ecart_moyen = ecart_moyen/(36*8)
    print(ecart_moyen)
    return ecart_moyen


###### TESTS ######
assert proba_win(2000, 1900, 0, 0) > 0.5
assert proba_win(1900, 2000, 0, 0) < 0.5

print(proba_draw(2000, 1900, 0, 70))

# print(proba_draw(1130, 1000, 0.5, 70))
# ecart_moyen()
plot_bar_chart(kappa=0.5, hfa=70)
save_team_ranking(0.2, 70)