Nicolas JANIKOWSKI
Steven CHOUK
Karl OELSCHLAGER

# Architecture Decision Record (ADR)

# Pour qui ?
Pour les employés qui veulent réserver une place de parking dans le parking de l'entreprise.

# Contexte
L'user aimerait pouvoir obtenir une place de parking réservée pour une période déterminée sans avoir à s'y rendre et sans risque de ne pas avoir de place disponible.

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

# System de design

  Microservice:

    + scalable
    + efficient
    + séparation des responsabilités
    - complexe
    - debugging complexe 

  Monolithique:

    + facile de développement
    + single point debug
    - faible scalabilité
    - single point of failure
    
# System choice
  Monolithique => influence sur le facile a faire. Pas de probleme de scalabilité pour une application qui semble restrainte a un use case d'entreprise unique. 

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

Côté API il est aussi possible d'utiliser une architecture evennementielle plutot que 100% API. Un Kafka ou un RabbitMQ peuvent etre mit en liaisons avec les systemes et on pourrait utiliser leur puissance pour certains systeme de queue de message/ mail.
Cette piste est mit de côté pour son problème de compléxité ajouté, de systeme boite grise ou l'on doit ce faire a l'ouil utiliser plutot que travailler avec. 

Pour remmédier a cela l'API devra prendre en compte buffer de message envoyé et de message ayant raté a l'envoie (pour les renvoyer plus tard). 

Une petite application interne, de réservation de place dans l'entreprise, ne mérite pas une architecture grande et complexe, nécessitant l'affectation d'un développeur ou d'une équipe pour maintenant ce projet de façon constante. 

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