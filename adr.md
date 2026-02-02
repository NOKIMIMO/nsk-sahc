# Architecture Decision Record (ADR)

# Pour qui ?
Pour les employés qui veulent réserver une place de parking dans le parking de l'entreprise.

# Contexte
L'employé aimerait pouvoir obtenir une place de parking réservée pour une période déterminée sans avoir à s'y rendre et sans risque de ne pas avoir de place disponible.

# Options 
  Applications Web spécifique au réseaux employé avec identification matricule?

    + rapide d'accés
    + pas de téléchargement
  --------
    - PB company network => Peux etre ouvert mais probleme de sécurité a réfléchir
    - page web accés mobile pas apréciable

  Application Android/iOS avec SSO/connexion automatique pour l'identification ?

    + accès mobile plus simple et reservation plus rapide
    + notifications push
    + accessible n'importe où
  -------
    - Obligations de téléchargement
    - développement plus intensif 

# Stack choisie
  App Android/IOS choisie

# Stack technique 

Android : 
  - Flutter
  - Android natif

BackEnd : 

   API : 

    - Kotlin / Quarkus / Spring Boot
    - NodeJs 

   DB:

    - Nosql
    - SQL PostgreSql
    - SQL Cloud


# Stack technique Options

  Android :

     flutter :
      + deployable sur plusieurs env
      + material intégré
      - nécessité de connaissances
---
     Android natif:
      + pas de barriere d'entrée
      - moche
      - pas intuitif
      - trés long a développé
      - Pas envie

  API:

     Kotlin :
      - Quarkus :
        -- compléxité
        -- application lourde
        -- scalabilité plus complexe
        -- moins de connaissance forte
      - Spring Boot :
        -- compléxité
        -- application lourde
        -- scalabilité plus complexe
        -- moins de connaissance forte
---
     Typescript NodesJs :
      + connaissance technique et expérience dans l'équipe.
      + facilité de bootstrap
      + lourde librairie
      - difficulté de scale a haut volume

  DB :

     NoSQL :
      - pas de connaissance technique dans l'équipe
---
     SQL Postgress :
      + Jack of all trades
      + connaissance dans l'équipe
---
     SQL cloud :
      + Comme du SQL sans gestion admin de DB
      + Puissance de calcul scalable
      - Payant