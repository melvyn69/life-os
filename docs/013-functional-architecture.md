013 — Functional Architecture

Architecture fonctionnelle de la v0.1

⸻

1. Objectif

La v0.1 de Life OS doit rester simple.

Elle ne doit pas chercher à tout automatiser, tout comprendre ou tout connecter.

Elle doit seulement permettre un cycle complet :

capture → observation → analyse → entité → mémoire → briefing

L’architecture fonctionnelle sert à répondre à une question :

Quels modules devons-nous construire pour rendre ce cycle possible sans créer une usine à gaz ?

⸻

2. Principe central

La v0.1 repose sur une architecture en modules simples.

Chaque module a un rôle clair.
Chaque module produit une sortie utile.
Aucun module ne doit dépendre d’une intelligence parfaite.

Le système doit fonctionner même si l’IA se trompe parfois.

La règle est simple :

l’IA propose, l’utilisateur valide, la mémoire progresse.

⸻

3. Les modules fonctionnels de la v0.1

La v0.1 contient 7 modules principaux :

1. Capture
2. Inbox
3. Observation
4. Analyse IA
5. Entités
6. Mémoire
7. Briefing

Ces modules ne sont pas des écrans uniquement.

Ce sont des responsabilités produit.

⸻

4. Module Capture

Rôle

Permettre à l’utilisateur d’ajouter rapidement un fragment de vie.

La capture doit être immédiate, mobile-first, sans friction.

Entrées

* texte libre ;
* note rapide ;
* idée ;
* souvenir ;
* information sur une personne ;
* information sur un projet ;
* événement ;
* décision ;
* ressenti ;
* fait important.

Sorties

* un élément brut envoyé dans l’inbox ;
* une date de capture ;
* un statut initial : “à analyser”.

Responsabilité utilisateur

L’utilisateur dépose une information sans devoir la structurer.

Il ne remplit pas un formulaire complexe.

Responsabilité IA

Aucune intelligence profonde à ce stade.

L’IA ne doit pas bloquer la capture.

Limites v0.1

Pas besoin de voix.
Pas besoin de photo.
Pas besoin d’import automatique.
Pas besoin de connexion à d’autres apps.

La capture texte suffit.

⸻

5. Module Inbox

Rôle

Centraliser tous les fragments capturés avant traitement.

L’inbox est la zone tampon entre la vie réelle et la mémoire structurée.

Entrées

* captures utilisateur ;
* éléments non traités ;
* éléments analysés mais non validés ;
* éléments à corriger.

Sorties

* liste d’items à analyser ;
* item prêt pour analyse IA ;
* item validé ;
* item ignoré ;
* item supprimé.

Responsabilité utilisateur

L’utilisateur peut :

* lire ;
* valider ;
* corriger ;
* ignorer ;
* supprimer.

Responsabilité IA

L’IA peut proposer une interprétation, mais ne doit pas modifier la mémoire sans validation claire en v0.1.

Limites v0.1

L’inbox ne doit pas devenir un gestionnaire de tâches.

Elle ne doit pas contenir de workflows complexes.

Elle sert uniquement à transformer des fragments en mémoire utile.

⸻

6. Module Observation

Rôle

Transformer un fragment brut en observation compréhensible.

Une observation est une perception simple du système.

Elle ne prétend pas encore être une vérité.

Entrées

* contenu brut ;
* contexte minimal ;
* date ;
* éventuellement entités déjà connues.

Sorties

* résumé de l’observation ;
* type probable ;
* niveau de confiance ;
* éléments détectés ;
* ambiguïtés ;
* suggestion de prochaine action.

Exemple

Fragment brut :

“J’ai parlé avec Thomas, il veut peut-être rejoindre le projet Life OS plus tard.”

Observation :

“Thomas est potentiellement intéressé par le projet Life OS.”

Type :

Relation / Projet

Confiance :

Moyenne

Action proposée :

Créer ou enrichir l’entité Thomas.

Responsabilité utilisateur

L’utilisateur n’a pas besoin de créer l’observation lui-même.

Il doit seulement pouvoir la corriger si elle est fausse.

Responsabilité IA

L’IA identifie ce qui semble important, mais garde l’incertitude visible.

Limites v0.1

Une observation ne doit pas créer automatiquement une vérité durable.

Elle reste une proposition.

⸻

7. Module Analyse IA

Rôle

Interpréter une observation et proposer ce qu’il faut en faire.

L’analyse IA est le moteur de transformation.

Elle répond à quatre questions :

1. De quoi parle cette information ?
2. Est-ce important ?
3. À quoi est-elle reliée ?
4. Que doit-on créer ou enrichir ?

Entrées

* observation ;
* entités existantes ;
* mémoire existante ;
* contexte du projet ou de la personne ;
* niveau de confiance.

Sorties

* résumé utile ;
* entités détectées ;
* relations possibles ;
* mémoire proposée ;
* action recommandée ;
* niveau de confiance ;
* besoin éventuel de validation humaine.

Responsabilité IA

L’IA propose :

* une classification ;
* une ou plusieurs entités liées ;
* un enrichissement de mémoire ;
* une formulation claire ;
* une priorité.

Responsabilité utilisateur

L’utilisateur valide, corrige ou refuse.

Limites v0.1

L’IA ne doit pas :

* prendre des décisions seule ;
* fusionner des entités sans validation ;
* conclure sur des sujets sensibles ;
* créer trop de relations faibles ;
* sur-interpréter un fragment isolé.

⸻

8. Module Entités

Rôle

Représenter les éléments importants de la vie de l’utilisateur.

Une entité peut être :

* une personne ;
* un projet ;
* une entreprise ;
* une passion ;
* un lieu ;
* une habitude ;
* un objectif ;
* un événement ;
* une idée.

Entrées

* proposition IA ;
* validation utilisateur ;
* observation confirmée ;
* mémoire existante.

Sorties

* nouvelle entité ;
* entité enrichie ;
* relation entre entités ;
* historique d’évolution.

Responsabilité utilisateur

L’utilisateur peut :

* créer ;
* renommer ;
* corriger ;
* fusionner ;
* supprimer ;
* masquer.

Responsabilité IA

L’IA peut suggérer :

* “Créer une entité” ;
* “Relier à une entité existante” ;
* “Enrichir cette entité” ;
* “Cette information semble temporaire”.

Limites v0.1

Les entités doivent rester simples.

Pas besoin de graph visuel complexe.
Pas besoin de types infinis.
Pas besoin de fiche ultra détaillée.

Une fiche entité v0.1 doit contenir :

* nom ;
* type ;
* résumé ;
* informations clés ;
* observations liées ;
* niveau de confiance.

⸻

9. Module Mémoire

Rôle

Transformer les éléments validés en mémoire durable.

La mémoire n’est pas une archive brute.

C’est une synthèse utile, corrigible et progressive.

Entrées

* observations validées ;
* entités ;
* relations ;
* corrections utilisateur ;
* confirmations répétées.

Sorties

* faits utiles ;
* préférences ;
* souvenirs ;
* projets suivis ;
* relations importantes ;
* éléments à rappeler dans le briefing.

Responsabilité IA

L’IA reformule la mémoire pour la rendre utile.

Elle doit distinguer :

* fait confirmé ;
* hypothèse ;
* préférence ;
* souvenir ;
* signal faible ;
* information temporaire.

Responsabilité utilisateur

L’utilisateur garde le contrôle.

Il peut valider, modifier ou supprimer une mémoire.

Limites v0.1

La mémoire doit rester lisible.

Pas de mémoire invisible.
Pas d’automatisation profonde.
Pas de conclusion psychologique lourde.

⸻

10. Module Briefing

Rôle

Restituer à l’utilisateur ce qui est utile maintenant.

Le briefing est la preuve de valeur de Life OS.

Il montre que les fragments capturés deviennent de l’intelligence personnelle.

Entrées

* mémoire récente ;
* entités importantes ;
* observations validées ;
* éléments non traités ;
* priorités simples.

Sorties

* résumé du jour ;
* éléments importants ;
* rappels utiles ;
* questions à valider ;
* suggestions légères.

Responsabilité IA

L’IA prépare une synthèse courte, claire et utile.

Elle ne doit pas noyer l’utilisateur.

Responsabilité utilisateur

L’utilisateur lit, valide, ignore ou corrige.

Limites v0.1

Le briefing ne doit pas devenir un tableau de bord complexe.

Il doit rester humain, court et actionnable.

⸻

11. Flux fonctionnel complet

Le flux v0.1 est le suivant :

1. L’utilisateur capture une information.
2. L’information arrive dans l’inbox.
3. Le système crée une observation.
4. L’IA analyse l’observation.
5. L’IA propose une action.
6. L’utilisateur valide ou corrige.
7. Le système crée ou enrichit une entité.
8. La mémoire est mise à jour.
9. Le briefing restitue l’information utile.

Le produit fonctionne si ce cycle peut être répété simplement plusieurs fois par jour.

⸻

12. Règles de validation

En v0.1, certaines actions nécessitent validation utilisateur.

Validation obligatoire :

* création d’une nouvelle entité importante ;
* fusion de deux entités ;
* ajout d’une mémoire durable ;
* interprétation sensible ;
* suppression d’une mémoire ;
* changement majeur dans le résumé d’une entité.

Validation non obligatoire :

* création d’une observation temporaire ;
* résumé d’un fragment ;
* suggestion d’action ;
* classement provisoire ;
* affichage dans l’inbox.

La règle fondatrice :

plus une action est durable, plus elle doit être validée.

⸻

13. Ce qui reste manuel en v0.1

La v0.1 doit rester volontairement manuelle sur les points sensibles.

L’utilisateur doit encore :

* capturer lui-même les informations ;
* valider les propositions IA ;
* corriger les erreurs ;
* décider ce qui mérite d’être mémorisé ;
* supprimer ce qu’il ne veut pas garder ;
* confirmer les entités importantes.

Ce choix n’est pas une faiblesse.

C’est une condition de confiance.

⸻

14. Ce qui pourra être automatisé plus tard

Plus tard, le système pourra automatiser progressivement :

* la capture vocale ;
* l’import de documents ;
* l’analyse de photos ;
* la détection automatique d’entités ;
* les relations entre entités ;
* les briefings personnalisés ;
* les rappels contextuels ;
* les signaux récurrents ;
* les intégrations calendrier, email, santé ou fichiers ;
* les suggestions proactives.

Mais chaque automatisation devra respecter une règle :

l’automatisation ne doit jamais réduire le contrôle utilisateur.

⸻

15. Limites globales de la v0.1

La v0.1 ne doit pas construire :

* un CRM personnel complet ;
* un Notion intelligent ;
* un moteur de tâches ;
* un réseau social privé ;
* une app de journaling classique ;
* un coach de vie intrusif ;
* un système d’automatisation totale.

Elle doit construire une seule chose :

une boucle de mémoire personnelle fiable.

⸻

16. Critère de réussite

L’architecture fonctionnelle est réussie si un utilisateur peut dire :

“J’ai posé une information rapidement.
Life OS l’a comprise sans me fatiguer.
Il m’a proposé où la ranger.
J’ai gardé le contrôle.
Et plus tard, il me l’a restituée utilement.”

Si cette phrase devient vraie, la v0.1 fonctionne.

⸻

17. Conclusion

La v0.1 de Life OS doit être simple, mais profonde.

Simple dans ses modules.
Simple dans ses écrans.
Simple dans ses décisions.

Mais profonde dans son intention :

transformer des fragments de vie en mémoire utile.

L’architecture fonctionnelle ne doit pas chercher à tout prévoir.

Elle doit permettre au produit de respirer, d’apprendre et d’évoluer.

Life OS ne commence pas par une intelligence totale.

Il commence par une boucle fiable :

capturer, comprendre, valider, mémoriser, restituer.