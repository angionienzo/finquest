import { useState, useEffect, useCallback } from "react";

// ─── STORAGE (localStorage — fonctionne partout) ──────────────────────────────
const SK = "fq_v4";
const defaultSave = () => ({
  lang: "fr",
  levelProgress: { 0:0,1:0,2:0,3:0,4:0 },
  totalScore: 0,
  dailyStreak: 0,
  dailyDone: "",
});

function loadSave() {
  try {
    const raw = localStorage.getItem(SK);
    return raw ? { ...defaultSave(), ...JSON.parse(raw) } : defaultSave();
  } catch { return defaultSave(); }
}

function writeSave(d) {
  try { localStorage.setItem(SK, JSON.stringify(d)); } catch {}
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
  fr: {
    title:"FinanceQuest", tagline:"Maîtrise la finance, deal by deal.",
    play:"Jouer",
    next:"Suivant →", correct:"Bonne réponse !", wrong:"Mauvaise réponse",
    explanation:"Explication",
    missionOk:"Mission complétée ✓",
    backMenu:"← Menu", retry:"Rejouer", nextMission:"Mission suivante →",
    trueL:"VRAI", falseL:"FAUX", submit:"Valider", yourAns:"Ta réponse...",
    switchLang:"EN", streak:"Série", score:"Score",
    tabGame:"Jeu", tabProfile:"Profil",
    profileTitle:"Profil",
    levelNames:["Analyste Junior","Analyste Confirmé","Associate","VP / Director","Managing Director"],
    locked:"🔒 Complète le niveau précédent",
  },
  en: {
    title:"FinanceQuest", tagline:"Master finance, deal by deal.",
    play:"Play",
    next:"Next →", correct:"Correct!", wrong:"Wrong answer",
    explanation:"Explanation",
    missionOk:"Mission complete ✓",
    backMenu:"← Menu", retry:"Play again", nextMission:"Next mission →",
    trueL:"TRUE", falseL:"FALSE", submit:"Submit", yourAns:"Your answer...",
    switchLang:"FR", streak:"Streak", score:"Score",
    tabGame:"Play", tabProfile:"Profile",
    profileTitle:"Profile",
    levelNames:["Junior Analyst","Confirmed Analyst","Associate","VP / Director","Managing Director"],
    locked:"🔒 Complete the previous level",
  },
};

const LV = [
  { id:0, icon:"📊", color:"#3b82f6" },
  { id:1, icon:"📈", color:"#10b981" },
  { id:2, icon:"🏗️", color:"#f59e0b" },
  { id:3, icon:"🤝", color:"#ef4444" },
  { id:4, icon:"🏆", color:"#8b5cf6" },
];

// ─── QUESTION BANK (50 questions par niveau, FR + EN) ─────────────────────────
const BANK = {
  fr: [
    [
      {type:"qcm",q:"Qu'est-ce que l'EBITDA ?",opts:["Bénéfice avant intérêts, impôts, dépréciation et amortissement","Bénéfice net après impôts","Chiffre d'affaires moins charges fixes","Flux de trésorerie disponible"],ans:0,exp:"EBITDA = Earnings Before Interest, Taxes, Depreciation & Amortization."},
      {type:"vf",q:"Le bilan comptable doit toujours vérifier : Actif = Passif + Capitaux propres.",ans:true,exp:"C'est le principe fondamental de la comptabilité en partie double."},
      {type:"calc",q:"CA = 200M€, charges d'exploitation = 140M€. Résultat d'exploitation (M€) ?",ans:60,tol:0.5,exp:"Rex = 200 - 140 = 60M€."},
      {type:"qcm",q:"Quel état financier montre la situation patrimoniale à un instant T ?",opts:["Compte de résultat","Bilan comptable","Tableau de flux de trésorerie","Annexe"],ans:1,exp:"Le bilan est une photo à un instant T de l'actif et du passif."},
      {type:"vf",q:"Un résultat net positif garantit toujours une trésorerie disponible.",ans:false,exp:"Rentabilité ≠ liquidité. Un BFR élevé peut absorber tout le bénéfice."},
      {type:"qcm",q:"Lequel de ces éléments figure à l'actif du bilan ?",opts:["Emprunt bancaire","Capital social","Stocks","Dividendes à payer"],ans:2,exp:"Les stocks sont des actifs circulants. Emprunts et capital sont au passif."},
      {type:"calc",q:"Résultat net 50M€, impôts 20M€, intérêts 15M€, amortissements 30M€, dépréciations 10M€. EBITDA (M€) ?",ans:125,tol:0.5,exp:"EBITDA = 50+20+15+30+10 = 125M€."},
      {type:"vf",q:"Le tableau de flux se divise en exploitation, investissement et financement.",ans:true,exp:"Ces 3 sections montrent l'origine et l'utilisation de la trésorerie."},
      {type:"qcm",q:"Que mesure le BFR ?",opts:["La trésorerie en caisse","Le besoin de financement du cycle d'exploitation","Le montant total des dettes","L'actif net comptable"],ans:1,exp:"BFR = Stocks + Créances clients - Dettes fournisseurs."},
      {type:"calc",q:"Stocks 30M€, créances clients 50M€, dettes fournisseurs 40M€. BFR (M€) ?",ans:40,tol:0.5,exp:"BFR = 30 + 50 - 40 = 40M€."},
      {type:"qcm",q:"Qu'est-ce que la marge EBITDA ?",opts:["EBITDA / Résultat net","EBITDA / Chiffre d'affaires","Résultat net / CA","EBIT / CA"],ans:1,exp:"Marge EBITDA = EBITDA / CA. Elle mesure la rentabilité opérationnelle."},
      {type:"vf",q:"Les amortissements sont des décaissements réels.",ans:false,exp:"Les amortissements sont des charges non décaissées : ils n'impliquent pas de sortie de trésorerie."},
      {type:"calc",q:"CA = 500M€, marge EBITDA = 20%. EBITDA (M€) ?",ans:100,tol:0.5,exp:"EBITDA = 500 × 20% = 100M€."},
      {type:"qcm",q:"Qu'est-ce que le fonds de roulement (FR) ?",opts:["Actif court terme - Passif court terme","Actif long terme - Passif long terme","Capitaux permanents - Actif immobilisé","Trésorerie + BFR"],ans:2,exp:"FR = Capitaux permanents - Actif immobilisé."},
      {type:"vf",q:"Un ratio de liquidité générale > 1 signifie que l'actif courant couvre le passif courant.",ans:true,exp:"Ratio = Actif courant / Passif courant. > 1 = l'entreprise peut couvrir ses dettes CT."},
      {type:"qcm",q:"Lequel n'est PAS un flux d'exploitation ?",opts:["Encaissement clients","Paiement fournisseurs","Achat d'une machine","Paiement des salaires"],ans:2,exp:"L'achat d'une machine est un flux d'investissement, pas d'exploitation."},
      {type:"calc",q:"Actif courant 120M€, passif courant 80M€. Fonds de roulement net (M€) ?",ans:40,tol:0.5,exp:"FRN = 120 - 80 = 40M€."},
      {type:"vf",q:"Le chiffre d'affaires est égal au résultat net.",ans:false,exp:"Le CA est le total des ventes. Le RN est ce qui reste après toutes les charges."},
      {type:"qcm",q:"Qu'est-ce que l'EBIT ?",opts:["EBITDA - amortissements et dépréciations","Résultat net + impôts","EBITDA + intérêts","Résultat avant impôts seulement"],ans:0,exp:"EBIT = Résultat avant intérêts et impôts = EBITDA - D&A."},
      {type:"calc",q:"EBITDA = 80M€, amortissements = 15M€. EBIT (M€) ?",ans:65,tol:0.5,exp:"EBIT = 80 - 15 = 65M€."},
      {type:"qcm",q:"Qu'est-ce que le résultat courant avant impôts ?",opts:["EBIT - charges financières nettes","EBITDA - impôts","CA - charges fixes","Résultat net + amortissements"],ans:0,exp:"RCAI = EBIT - Charges financières nettes (intérêts)."},
      {type:"vf",q:"Les capitaux propres sont une ressource pour l'entreprise.",ans:true,exp:"Les capitaux propres figurent au passif : c'est une ressource apportée par les actionnaires."},
      {type:"calc",q:"EBIT = 50M€, charges financières = 10M€, impôts = 15M€. Résultat net (M€) ?",ans:25,tol:0.5,exp:"RN = 50 - 10 - 15 = 25M€."},
      {type:"qcm",q:"Qu'est-ce que la trésorerie nette ?",opts:["Trésorerie active - Trésorerie passive","CA - Charges","FR - BFR","Actif - Passif"],ans:2,exp:"Trésorerie nette = Fonds de roulement - BFR."},
      {type:"vf",q:"Une entreprise peut être rentable et insolvable simultanément.",ans:true,exp:"Si le BFR est très élevé ou les dettes CT > trésorerie, l'entreprise peut être en difficulté."},
      {type:"calc",q:"FR = 60M€, BFR = 40M€. Trésorerie nette (M€) ?",ans:20,tol:0.5,exp:"Trésorerie = FR - BFR = 60 - 40 = 20M€."},
      {type:"qcm",q:"Dans un tableau de flux, les remboursements d'emprunt apparaissent en :",opts:["Flux d'exploitation","Flux d'investissement","Flux de financement","Résultat financier"],ans:2,exp:"Les remboursements de dette sont des flux de financement."},
      {type:"vf",q:"Les provisions sont des charges décaissées.",ans:false,exp:"Les provisions sont des charges calculées non décaissées."},
      {type:"calc",q:"Dettes financières brutes = 200M€, trésorerie = 30M€. Dette nette (M€) ?",ans:170,tol:0.5,exp:"Dette nette = 200 - 30 = 170M€."},
      {type:"qcm",q:"Lequel est un ratio de rentabilité ?",opts:["Ratio de liquidité","ROE (Return on Equity)","Délai de rotation des stocks","Ratio d'endettement"],ans:1,exp:"Le ROE = Résultat net / Capitaux propres est un ratio de rentabilité financière."},
      {type:"vf",q:"Le goodwill apparaît à l'actif du bilan.",ans:true,exp:"Le goodwill est un actif incorporel inscrit à l'actif lors d'une acquisition."},
      {type:"calc",q:"Résultat net = 40M€, capitaux propres = 200M€. ROE (%) ?",ans:20,tol:0.5,exp:"ROE = 40/200 = 20%."},
      {type:"qcm",q:"Qu'est-ce que le DSO ?",opts:["Délai de paiement fournisseurs","Délai de rotation des stocks","Délai de recouvrement clients","Durée d'amortissement"],ans:2,exp:"DSO = Créances clients / CA × 365."},
      {type:"vf",q:"Un BFR négatif est toujours mauvais pour l'entreprise.",ans:false,exp:"Un BFR négatif (ex: grande distribution) est un avantage : les clients paient avant les fournisseurs."},
      {type:"calc",q:"Créances clients = 40M€, CA = 200M€. DSO (jours) ?",ans:73,tol:1,exp:"DSO = 40/200 × 365 = 73 jours."},
      {type:"qcm",q:"Que représente le DPO ?",opts:["Délai de paiement aux fournisseurs","Délai de recouvrement clients","Délai de rotation stocks","Délai de remboursement dette"],ans:0,exp:"DPO = Dettes fournisseurs / Achats × 365."},
      {type:"vf",q:"La capacité d'autofinancement (CAF) est toujours égale au résultat net.",ans:false,exp:"CAF = Résultat net + Charges non décaissées (amortissements, provisions)."},
      {type:"calc",q:"RN = 30M€, amortissements = 20M€, provisions = 5M€. CAF (M€) ?",ans:55,tol:0.5,exp:"CAF = 30 + 20 + 5 = 55M€."},
      {type:"qcm",q:"Qu'est-ce que le seuil de rentabilité ?",opts:["CA pour lequel le résultat est nul","CA minimum légal","Charges fixes totales","Marge sur coûts variables"],ans:0,exp:"Seuil de rentabilité = Charges fixes / Taux de marge sur coûts variables."},
      {type:"vf",q:"Les dividendes versés apparaissent dans le flux d'exploitation.",ans:false,exp:"Les dividendes versés sont des flux de financement."},
      {type:"calc",q:"Charges fixes = 60M€, taux de marge sur CV = 40%. Seuil de rentabilité (M€ de CA) ?",ans:150,tol:0.5,exp:"SR = 60 / 40% = 150M€."},
      {type:"qcm",q:"Qu'est-ce que le levier opérationnel ?",opts:["Sensibilité du résultat aux variations des ventes","Ratio dette/fonds propres","EBITDA/Charges fixes","Marge brute/CA"],ans:0,exp:"Le levier opérationnel mesure comment une variation du CA impacte le résultat opérationnel."},
      {type:"vf",q:"L'actif immobilisé est amorti au fil du temps.",ans:true,exp:"Les immobilisations corporelles et incorporelles sont amorties sur leur durée de vie utile."},
      {type:"calc",q:"CA = 300M€, charges variables = 180M€, charges fixes = 60M€. Résultat opérationnel (M€) ?",ans:60,tol:0.5,exp:"Rex = 300 - 180 - 60 = 60M€."},
      {type:"vf",q:"Le résultat exceptionnel fait partie du résultat courant.",ans:false,exp:"Le résultat exceptionnel est distinct du résultat courant (activité ordinaire)."},
      {type:"calc",q:"Marge brute = 120M€, charges fixes = 80M€. Résultat opérationnel (M€) ?",ans:40,tol:0.5,exp:"Rex = 120 - 80 = 40M€."},
      {type:"qcm",q:"Qu'est-ce que le ratio dette nette / EBITDA ?",opts:["Un ratio de levier financier","Un ratio de liquidité","Un ratio de rentabilité","Un ratio de couverture des intérêts"],ans:0,exp:"Dette nette/EBITDA mesure combien d'années d'EBITDA sont nécessaires pour rembourser la dette."},
      {type:"vf",q:"Le résultat net est toujours supérieur à l'EBITDA.",ans:false,exp:"L'EBITDA est avant impôts, intérêts et amortissements, donc généralement plus élevé que le RN."},
      {type:"calc",q:"Stocks = 50M€, achats = 300M€. Délai de rotation des stocks (jours) ?",ans:61,tol:1,exp:"DRS = 50/300 × 365 ≈ 61 jours."},
      {type:"qcm",q:"Que signifie 'hors bilan' ?",opts:["Un engagement non inscrit au bilan","Un actif déprécié","Une dette remboursée","Un produit exceptionnel"],ans:0,exp:"Les éléments hors bilan sont des engagements qui n'apparaissent pas dans l'actif/passif."},
      {type:"calc",q:"EBIT = 60M€, intérêts = 10M€. Taux de couverture des intérêts (x) ?",ans:6,tol:0.1,exp:"ICR = EBIT / Intérêts = 60/10 = 6x."},
    ],
    [
      {type:"qcm",q:"Quel multiple est le plus utilisé en M&A pour valoriser une entreprise ?",opts:["P/E","EV/EBITDA","P/B","EV/CA"],ans:1,exp:"EV/EBITDA est neutre vis-à-vis de la structure de capital et des amortissements."},
      {type:"calc",q:"Multiple EV/EBITDA = 8x, EBITDA = 40M€. EV estimée (M€) ?",ans:320,tol:0.5,exp:"EV = 8 × 40 = 320M€."},
      {type:"vf",q:"L'Enterprise Value inclut la trésorerie de l'entreprise.",ans:false,exp:"EV = Equity Value + Dette nette. La trésorerie est soustraite."},
      {type:"qcm",q:"Comment passe-t-on de l'EV à l'Equity Value ?",opts:["EV + Dette nette","EV - Dette nette","EV × multiple","EV / WACC"],ans:1,exp:"Equity Value = EV - Dette nette."},
      {type:"calc",q:"EV = 500M€, dette nette = 80M€. Equity Value (M€) ?",ans:420,tol:0.5,exp:"Equity Value = 500 - 80 = 420M€."},
      {type:"vf",q:"Dans un DCF, les flux sont actualisés au WACC.",ans:true,exp:"Le WACC reflète le coût moyen pondéré des fonds propres et de la dette."},
      {type:"qcm",q:"Que représente la valeur terminale dans un DCF ?",opts:["Valeur de trésorerie à l'an 0","VA de tous les flux après la période explicite","Montant de la dette","Prix d'achat négocié"],ans:1,exp:"La valeur terminale représente souvent 60-80% de la valeur totale du DCF."},
      {type:"calc",q:"FCF année 1 = 20M€, WACC = 10%. VA de ce flux (M€, 2dp) ?",ans:18.18,tol:0.02,exp:"VA = 20 / 1.10 = 18.18M€."},
      {type:"vf",q:"Un P/E élevé signifie toujours que l'action est surévaluée.",ans:false,exp:"Un P/E élevé peut refléter de fortes perspectives de croissance."},
      {type:"qcm",q:"Que sont les 'trading comps' ?",opts:["Transactions M&A récentes","Sociétés cotées comparables","Classement des banques","Modèles propriétaires"],ans:1,exp:"Les trading comps utilisent les multiples boursiers de sociétés comparables cotées."},
      {type:"vf",q:"La valeur terminale Gordon-Shapiro = FCF × (1+g) / (WACC - g).",ans:true,exp:"Formule de Gordon-Shapiro : croissance perpétuelle à taux constant g."},
      {type:"calc",q:"FCF normatif = 50M€, g = 2%, WACC = 10%. Valeur terminale (M€) ?",ans:637.5,tol:2,exp:"VT = 50 × 1.02 / (0.10 - 0.02) = 51 / 0.08 = 637.5M€."},
      {type:"qcm",q:"Qu'est-ce que le WACC ?",opts:["Coût moyen pondéré du capital","Taux sans risque","Prime de risque marché","Coût de la dette seul"],ans:0,exp:"WACC = Coût des FP × (FP/V) + Coût de la dette × (1-t) × (D/V)."},
      {type:"vf",q:"Les transaction comps donnent généralement des multiples plus élevés que les trading comps.",ans:true,exp:"Les transactions incluent une prime de contrôle (20-40%), absente des multiples boursiers."},
      {type:"calc",q:"Taux sans risque = 3%, prime de risque = 6%, beta = 1.2. Coût des FP CAPM (%) ?",ans:10.2,tol:0.1,exp:"Ke = 3% + 1.2 × 6% = 10.2%."},
      {type:"qcm",q:"Qu'est-ce que le Beta dans le CAPM ?",opts:["Mesure du risque systématique","Taux de croissance","Coût de la dette","Prime de risque"],ans:0,exp:"Le Beta mesure la sensibilité du rendement d'une action par rapport au marché."},
      {type:"vf",q:"Un beta > 1 signifie que l'action est moins volatile que le marché.",ans:false,exp:"Beta > 1 = plus volatile. Beta < 1 = moins volatile."},
      {type:"calc",q:"EV = 400M€, EBIT = 50M€. Multiple EV/EBIT ?",ans:8,tol:0.1,exp:"EV/EBIT = 400/50 = 8x."},
      {type:"qcm",q:"Pourquoi le DCF est sensible au taux d'actualisation ?",opts:["Car la dette varie","Car une faible variation du WACC change fortement la valeur","Car les flux sont certains","Car le beta est fixe"],ans:1,exp:"Une variation de 1% du WACC peut réduire la valeur de 15-25%."},
      {type:"vf",q:"Le DCF est une méthode intrinsèque de valorisation.",ans:true,exp:"Le DCF valorise l'entreprise sur la base de ses propres flux futurs."},
      {type:"calc",q:"FCF1=20M€, FCF2=22M€, FCF3=24M€, WACC=10%. VA des 3 FCF (M€, arrondi) ?",ans:54,tol:2,exp:"VA ≈ 18.18 + 18.18 + 18.03 ≈ 54.4M€."},
      {type:"qcm",q:"Qu'est-ce qu'une analyse de sensibilité DCF ?",opts:["Variation du WACC et du taux g pour voir l'impact sur la valeur","Comparaison avec les comps","Analyse du bilan","Test de liquidité"],ans:0,exp:"La sensibilité DCF teste différents couples WACC/g pour montrer la fourchette de valorisation."},
      {type:"vf",q:"EV/CA est plus pertinent qu'EV/EBITDA pour une entreprise rentable.",ans:false,exp:"EV/EBITDA tient compte de la profitabilité. EV/CA est utile pour les sociétés en perte."},
      {type:"calc",q:"Equity Value = 300M€, nombre d'actions = 10M. Prix par action (€) ?",ans:30,tol:0.1,exp:"Prix = 300M / 10M = 30€ par action."},
      {type:"qcm",q:"Qu'est-ce que le SOTP ?",opts:["Valoriser chaque division séparément puis additionner","Additionner les résultats nets","Multiplier l'EBITDA par le nombre de divisions","Valoriser par l'actif net"],ans:0,exp:"La SOTP valorise chaque branche avec la méthode la plus adaptée, puis additionne."},
      {type:"vf",q:"La prime de contrôle est généralement de 0 à 10%.",ans:false,exp:"La prime de contrôle est typiquement de 20 à 40% au-dessus du cours de bourse."},
      {type:"calc",q:"Cours de bourse = 50€, prime de contrôle = 30%. Prix d'OPA (€) ?",ans:65,tol:0.5,exp:"Prix OPA = 50 × (1 + 30%) = 65€."},
      {type:"qcm",q:"Qu'est-ce que la 'fairness opinion' ?",opts:["Attestation d'équité sur le prix","Rapport de due diligence","Avis juridique","Notation de crédit"],ans:0,exp:"La fairness opinion atteste qu'un prix est financièrement équitable pour les actionnaires."},
      {type:"vf",q:"L'EV d'une entreprise sans dette est égale à son Equity Value.",ans:true,exp:"Si dette nette = 0, alors EV = Equity Value."},
      {type:"calc",q:"EV/EBITDA marché = 9x, EBITDA cible = 30M€, dette nette = 50M€. Equity Value (M€) ?",ans:220,tol:1,exp:"EV = 270M€. Equity Value = 270 - 50 = 220M€."},
      {type:"qcm",q:"Qu'est-ce que le ratio PEG ?",opts:["P/E divisé par le taux de croissance","P/E × EBITDA","EV/EBITDA normalisé","Prix sur actif net"],ans:0,exp:"PEG = P/E / Taux de croissance. PEG < 1 suggère une action bon marché."},
      {type:"vf",q:"L'actif net comptable est toujours inférieur à l'EV.",ans:false,exp:"L'ANC peut être supérieur à l'EV pour des sociétés en difficulté ou très capitalistiques."},
      {type:"calc",q:"EV = 800M€, CA = 200M€. Multiple EV/CA ?",ans:4,tol:0.05,exp:"EV/CA = 800/200 = 4x."},
      {type:"qcm",q:"Qu'est-ce que la dilution dans le contexte des options ?",opts:["Augmentation du nombre d'actions","Réduction du capital","Perte de valeur de la dette","Baisse du CA"],ans:0,exp:"La dilution est l'augmentation du nombre d'actions qui réduit le bénéfice par action."},
      {type:"vf",q:"La valeur terminale d'un DCF représente en général plus de 50% de la valeur totale.",ans:true,exp:"La valeur terminale représente souvent 60-80% de la valeur totale."},
      {type:"calc",q:"VA des FCF explicites = 100M€, VA valeur terminale = 400M€. EV totale (M€) ?",ans:500,tol:1,exp:"EV = 100 + 400 = 500M€."},
      {type:"qcm",q:"Qu'est-ce qu'un 'football field chart' en banque ?",opts:["Tableau comparant les valorisations par différentes méthodes","Graphique de performance","Tableau de bord RH","Analyse concurrentielle"],ans:0,exp:"Le football field chart présente les fourchettes de valorisation selon chaque méthode."},
      {type:"vf",q:"Le DCF est plus objectif que les multiples de marché.",ans:false,exp:"Les deux dépendent d'hypothèses subjectives. Le DCF est sensible au WACC et au taux g."},
      {type:"calc",q:"EBITDA = 60M€, capex = 15M€, ΔBFR = 5M€, impôts = 12M€. FCF (M€) ?",ans:28,tol:0.5,exp:"FCF = 60 - 15 - 5 - 12 = 28M€."},
      {type:"qcm",q:"Pourquoi utilise-t-on l'EBITDA normalisé en valorisation ?",opts:["Pour inclure les éléments exceptionnels","Pour refléter la performance récurrente","Pour augmenter la valeur","Pour simplifier le calcul"],ans:1,exp:"L'EBITDA normalisé exclut les éléments non récurrents."},
      {type:"vf",q:"Une société avec un P/E de 30x est forcément chère.",ans:false,exp:"Le P/E doit être comparé à la croissance. PEG = 1 est souvent considéré comme fair value."},
      {type:"calc",q:"Résultat net = 20M€, P/E secteur = 15x. Capitalisation boursière implicite (M€) ?",ans:300,tol:1,exp:"Capitalisation = RN × P/E = 20 × 15 = 300M€."},
      {type:"qcm",q:"Qu'est-ce que le DLOM ?",opts:["Décote pour illiquidité des titres non cotés","Prime de contrôle","Décote minorité","Ajustement de trésorerie"],ans:0,exp:"Le DLOM (Discount for Lack of Marketability) est une décote appliquée aux titres non cotés (10-30%)."},
      {type:"vf",q:"Les multiples de transaction incluent une prime de liquidité.",ans:false,exp:"Ils incluent une prime de contrôle, pas de liquidité."},
      {type:"calc",q:"WACC = 9%, g = 3%. Multiple EV/EBITDA implicite si EBITDA/FCF ratio = 70% ?",ans:11.7,tol:0.5,exp:"EV/EBITDA ≈ 0.7/(9%-3%) = 0.7/6% ≈ 11.7x."},
      {type:"qcm",q:"Qu'est-ce que la 'prime de contrôle' en M&A ?",opts:["Survalorisation payée pour obtenir le contrôle","Commission de la banque","Dividende pré-closing","Honoraires de due diligence"],ans:0,exp:"La prime de contrôle (20-40%) est payée au-dessus du cours de bourse."},
      {type:"calc",q:"Cours = 80€, prime = 25%. Prix d'offre (€) ?",ans:100,tol:0.5,exp:"Prix = 80 × 1.25 = 100€."},
    ],
    [
      {type:"qcm",q:"Dans un LBO, qu'est-ce que l'effet de levier ?",opts:["Utiliser la dette pour amplifier le rendement des FP","Négocier le prix à la baisse","Réduire les coûts","Augmenter le capital"],ans:0,exp:"L'effet de levier amplifie le rendement si rentabilité actif > coût de la dette."},
      {type:"vf",q:"Le FCF est toujours supérieur au résultat net.",ans:false,exp:"FCF = EBITDA - Impôts - Capex - ΔBFR. Les investissements peuvent le réduire."},
      {type:"calc",q:"EBITDA = 100M€, impôts = 25M€, Capex = 20M€, ΔBFR = +5M€. FCF (M€) ?",ans:50,tol:0.5,exp:"FCF = 100 - 25 - 20 - 5 = 50M€."},
      {type:"qcm",q:"Qu'est-ce que le TRI (IRR) dans un LBO ?",opts:["Taux d'intérêt de la dette","Taux de rendement annualisé du fonds PE","Taux de croissance du CA","Taux d'imposition"],ans:1,exp:"Le TRI mesure la performance annualisée du fonds sur la durée de détention."},
      {type:"vf",q:"Dans un LBO, la dette est remboursée via les FCF de la société acquise.",ans:true,exp:"C'est le principe du LBO : la cible porte et rembourse la dette grâce à ses cash flows."},
      {type:"calc",q:"Prix d'acquisition = 400M€, financement dette = 60%. Fonds propres apportés (M€) ?",ans:160,tol:0.5,exp:"FP = 400 × 40% = 160M€."},
      {type:"qcm",q:"Qu'est-ce qu'un covenant financier ?",opts:["Commission bancaire","Clause contractuelle (ex: dette/EBITDA < 4x)","Taux variable","Garantie hypothécaire"],ans:1,exp:"Les covenants sont des engagements financiers à respecter sous peine de défaut."},
      {type:"vf",q:"L'analyse de sensibilité LBO teste l'impact du prix d'entrée et du multiple de sortie.",ans:true,exp:"On fait varier les hypothèses clés pour mesurer l'impact sur le TRI."},
      {type:"calc",q:"PE achète à 5x EBITDA (EBITDA=50M€), revend à 6x (EBITDA=70M€). Plus-value brute (M€) ?",ans:170,tol:0.5,exp:"Achat=250M€, Vente=420M€, Plus-value=170M€."},
      {type:"qcm",q:"Qu'est-ce que le MOIC dans un LBO ?",opts:["Multiple Of Invested Capital","Taux d'intérêt moyen","Coût de la dette","Multiple EV/EBITDA"],ans:0,exp:"MOIC = Valeur de sortie / Capital investi."},
      {type:"vf",q:"Dans un Project Finance, les prêteurs ont recours sur la maison mère.",ans:false,exp:"Le Project Finance est sans recours : seuls les cash flows du projet servent à rembourser."},
      {type:"calc",q:"Capital investi = 100M€, valeur de sortie = 250M€. MOIC ?",ans:2.5,tol:0.05,exp:"MOIC = 250/100 = 2.5x."},
      {type:"qcm",q:"Qu'est-ce que la dette mezzanine ?",opts:["Dette senior prioritaire","Dette subordonnée entre senior et equity","Capital propre dilutif","Obligation convertible cotée"],ans:1,exp:"La dette mezzanine est subordonnée à la dette senior, avec un rendement plus élevé."},
      {type:"vf",q:"Un TRI de 20% sur 5 ans signifie qu'on double l'investissement.",ans:false,exp:"A 20% sur 5 ans, MOIC ≈ 2.49x."},
      {type:"calc",q:"Investissement = 100M€, TRI = 25%, durée = 5 ans. Valeur finale approx (M€) ?",ans:305,tol:5,exp:"100 × (1.25)^5 = 100 × 3.052 ≈ 305M€."},
      {type:"qcm",q:"Qu'est-ce que le 'waterfall' dans un LBO ?",opts:["Ordre de distribution des produits de cession","Tableau de remboursement","Structure d'actionnariat","Calendrier de covenants"],ans:0,exp:"Le waterfall définit l'ordre de priorité : dette senior > mezz > equity."},
      {type:"vf",q:"Le capex de maintenance est nécessaire pour maintenir la capacité de production.",ans:true,exp:"Le capex se divise en maintenance (entretien) et croissance (expansion)."},
      {type:"calc",q:"EBITDA = 80M€, dette nette = 320M€. Ratio dette/EBITDA ?",ans:4,tol:0.05,exp:"Levier = 320/80 = 4x."},
      {type:"qcm",q:"Qu'est-ce que la 'debt capacity' dans un LBO ?",opts:["Montant max de dette supportable par les FCF","Coût de la dette","Taux d'intérêt maximal","Nombre de covenants"],ans:0,exp:"La debt capacity est le montant maximum de dette supportable compte tenu des FCF."},
      {type:"vf",q:"La dette PIK est remboursée en cash chaque année.",ans:false,exp:"La PIK s'accumule et est remboursée à la sortie, capitalisant les intérêts."},
      {type:"calc",q:"Dette senior = 200M€ à 5%, mezz = 80M€ à 10%. Charge financière annuelle (M€) ?",ans:18,tol:0.5,exp:"200×5% + 80×10% = 10 + 8 = 18M€."},
      {type:"qcm",q:"Que signifie 'asset-light' pour un LBO ?",opts:["Peu de capex nécessaire, FCF élevés","Actif net faible","Beaucoup d'immobilisations","Faible EBITDA"],ans:0,exp:"Un business asset-light génère des FCF élevés car il nécessite peu d'investissements."},
      {type:"vf",q:"Un levier de 6x EBITDA est considéré comme conservateur.",ans:false,exp:"6x est un levier élevé. Conservateur = 3-4x EBITDA."},
      {type:"calc",q:"EV = 300M€, dette senior = 150M€, mezz = 60M€. Equity (M€) ?",ans:90,tol:0.5,exp:"Equity = 300 - 150 - 60 = 90M€."},
      {type:"qcm",q:"Qu'est-ce que le 'dividend recapitalisation' ?",opts:["Dividende financé par de la dette","Rachat d'actions","Augmentation de capital","Refinancement"],ans:0,exp:"Le dividend recap permet au fonds PE de récupérer du cash en réendettant la société."},
      {type:"vf",q:"Un prix d'entrée plus élevé augmente toujours le TRI.",ans:false,exp:"Un prix d'entrée élevé réduit le TRI car le multiple de sortie doit être encore plus élevé."},
      {type:"calc",q:"Equity investi = 120M€, sortie = 360M€, durée = 4 ans. TRI approx (%) ?",ans:32,tol:2,exp:"MOIC=3x. TRI ≈ 3^(1/4)-1 = 31.6%."},
      {type:"qcm",q:"Qu'est-ce qu'un 'add-on' dans une stratégie LBO ?",opts:["Acquisition complémentaire pour la plateforme","Augmentation de la dette","Refinancement","Réduction de capex"],ans:0,exp:"Un add-on est une acquisition complémentaire faite par la plateforme."},
      {type:"vf",q:"Le Project Finance utilise une SPV (Special Purpose Vehicle).",ans:true,exp:"La SPV est une entité ad hoc qui porte le projet et isole le risque."},
      {type:"calc",q:"FCF = 30M€, intérêts = 15M€, amortissement dette = 10M€. DSCR ?",ans:1.2,tol:0.05,exp:"DSCR = 30/(15+10) = 1.2x."},
      {type:"qcm",q:"Qu'est-ce que le DSCR en project finance ?",opts:["FCF / Service de la dette","Ratio de levier","Taux effectif","Multiple EV/EBITDA"],ans:0,exp:"DSCR = FCF / Service de la dette. Un DSCR > 1.2x est requis."},
      {type:"vf",q:"Une forte croissance EBITDA fait toujours d'une société un bon candidat LBO.",ans:false,exp:"Un bon LBO nécessite aussi des FCF stables, faible capex et dette supportable."},
      {type:"calc",q:"EBITDA an 1 = 50M€, croissance 8%/an, durée 5 ans. EBITDA an 5 (M€) ?",ans:73,tol:2,exp:"EBITDA5 = 50 × (1.08)^5 ≈ 73.5M€."},
      {type:"qcm",q:"Qu'est-ce qu'un secondary LBO ?",opts:["Cession d'une portfolio company à un autre fonds PE","IPO","Vente à un industriel","Recapitalisation"],ans:0,exp:"Un secondary LBO est la vente d'une portfolio company d'un fonds à un autre."},
      {type:"vf",q:"Le TRI tient compte du temps : même MOIC sur 3 ans vaut plus que sur 7 ans.",ans:true,exp:"Le TRI annualise le rendement. Plus la durée est courte pour le même MOIC, plus le TRI est élevé."},
      {type:"calc",q:"100M€ investis à t=0, sortie à t=3 avec 200M€. TRI approx (%) ?",ans:26,tol:1,exp:"(1+r)^3 = 2 → r = 2^(1/3)-1 = 26%."},
      {type:"qcm",q:"Qu'est-ce que la portage dans un LBO management ?",opts:["Action détenue par le management à moindre coût","Dette subordonnée","Garantie bancaire","Clause de non-concurrence"],ans:0,exp:"La portage permet au management d'investir à faible coût et bénéficier de l'effet de levier."},
      {type:"vf",q:"La capacité de remboursement dépend des FCF, pas de l'EBITDA.",ans:true,exp:"C'est le FCF (après capex, impôts, variation BFR) qui sert à rembourser la dette."},
      {type:"calc",q:"Covenant : dette/EBITDA ≤ 4.5x. EBITDA = 40M€. Dette max autorisée (M€) ?",ans:180,tol:0.5,exp:"Dette max = 4.5 × 40 = 180M€."},
      {type:"qcm",q:"Qu'est-ce qu'une equity kicker dans la dette mezzanine ?",opts:["Warrant donnant droit à des actions","Garantie bancaire","Option de remboursement anticipé","Covenant de performance"],ans:0,exp:"L'equity kicker est un warrant permettant au prêteur mezz d'acquérir une participation."},
      {type:"vf",q:"Un leverage élevé augmente le risque mais aussi le rendement potentiel.",ans:true,exp:"L'effet de levier amplifie à la fois les gains et les pertes."},
      {type:"calc",q:"Taux d'intérêt = 6%, dette = 200M€, taux IS = 25%. Bouclier fiscal annuel (M€) ?",ans:3,tol:0.1,exp:"Bouclier fiscal = 200×6%×25% = 3M€."},
      {type:"qcm",q:"Qu'est-ce que le 'hold period' dans un LBO ?",opts:["Durée de détention de l'investissement","Période de lockup post-IPO","Durée du covenant","Délai de due diligence"],ans:0,exp:"Le hold period est la durée de détention, généralement 4-7 ans pour un fonds PE."},
      {type:"vf",q:"En project finance, le LLCR doit être > 1.",ans:true,exp:"LLCR = VA des FCF sur la vie du prêt / encours de dette. > 1 = remboursement possible."},
      {type:"calc",q:"Fonds investi 100M€, MOIC = 3.5x après 6 ans. TRI approx (%) ?",ans:23,tol:2,exp:"TRI = 3.5^(1/6)-1 = 23.2%."},
    ],
    [
      {type:"qcm",q:"Quelle est la première étape d'un processus M&A côté vendeur ?",opts:["Signing du SPA","Envoi du teaser","Due diligence","Négociation du prix"],ans:1,exp:"Un processus sell-side commence par l'envoi d'un teaser anonyme."},
      {type:"vf",q:"L'accrétion/dilution mesure l'impact d'une acquisition sur le BPA.",ans:true,exp:"Si le BPA post-acq augmente, la transaction est accretive."},
      {type:"calc",q:"Post-acq : RN groupe = 25M€, 11M actions. BPA actuel = 2€. Nouveau BPA (€, 2dp) ?",ans:2.27,tol:0.01,exp:"BPA = 25/11 = 2.27€ → accretive."},
      {type:"qcm",q:"Qu'est-ce qu'une LOI en M&A ?",opts:["Contrat définitif","Lettre non-contraignante d'intention d'acquérir","Rapport de due diligence","Accord de confidentialité"],ans:1,exp:"La LOI est non-contraignante et précise les grandes conditions envisagées."},
      {type:"vf",q:"Les synergies de coûts sont plus prévisibles que les synergies de revenus.",ans:true,exp:"Les synergies de coûts sont identifiables en DD. Les synergies de revenus dépendent du marché."},
      {type:"calc",q:"Synergies annuelles = 15M€, multiple de capitalisation = 8x. VA des synergies (M€) ?",ans:120,tol:0.5,exp:"Valeur synergies = 15 × 8 = 120M€."},
      {type:"qcm",q:"Qu'est-ce que la due diligence financière (FDD) ?",opts:["Négociation du prix","Audit des états financiers de la cible","Rédaction du SPA","Présentation aux banques"],ans:1,exp:"La FDD analyse la qualité des résultats, la normalisation de l'EBITDA et la dette nette."},
      {type:"vf",q:"Le SPA est signé avant la LOI.",ans:false,exp:"L'ordre est : NDA → Teaser → IM → LOI → Due diligence → SPA → Closing."},
      {type:"calc",q:"EBITDA cible = 50M€, multiple = 8x. EV = 400M€. Prix payé = 420M€. Goodwill (M€) ?",ans:20,tol:0.5,exp:"Goodwill = Prix payé - EV = 420 - 400 = 20M€."},
      {type:"qcm",q:"Que signifie 'Locked Box' ?",opts:["Clause d'indemnisation post-closing","Mécanisme de prix fixe sur un bilan de référence","Accord de non-concurrence","Earn-out conditionnel"],ans:1,exp:"Le Locked Box fixe le prix à partir d'un bilan historique."},
      {type:"vf",q:"Un earn-out lie une partie du prix à la performance future.",ans:true,exp:"L'earn-out est un complément de prix conditionné à l'atteinte d'objectifs post-closing."},
      {type:"calc",q:"Synergies coûts = 20M€/an, coûts intégration = 30M€ one-off. Payback (ans) ?",ans:1.5,tol:0.1,exp:"Payback = 30/20 = 1.5 ans."},
      {type:"qcm",q:"Qu'est-ce qu'un vendor due diligence (VDD) ?",opts:["Due diligence commandée par le vendeur","DD faite par l'acheteur","Audit post-closing","Revue juridique"],ans:0,exp:"Le VDD est commandé par le vendeur pour accélérer le processus et rassurer les acheteurs."},
      {type:"vf",q:"La GAP protège l'acheteur contre des risques post-closing.",ans:true,exp:"La Garantie Actif Passif couvre les passifs cachés découverts post-closing."},
      {type:"calc",q:"EBITDA normalisé = 40M€ vs 35M€ reporté. Multiple = 8x. Différence de prix (M€) ?",ans:40,tol:0.5,exp:"Différence = (40-35) × 8 = 40M€."},
      {type:"qcm",q:"Qu'est-ce qu'un 'information memorandum' (IM) ?",opts:["Teaser anonyme","Document détaillé sur la cible envoyé après NDA","Contrat de vente","Rapport de due diligence"],ans:1,exp:"L'IM est un document confidentiel présentant la société en détail après signature du NDA."},
      {type:"vf",q:"Le NDA est signé après l'IM.",ans:false,exp:"Le NDA est signé en premier (avant de recevoir l'IM)."},
      {type:"qcm",q:"Qu'est-ce qu'un break-up fee en M&A ?",opts:["Pénalité si une partie se retire","Commission de la banque","Frais de due diligence","Earn-out annulé"],ans:0,exp:"Le break-up fee est une indemnité payée si une partie abandonne la transaction."},
      {type:"vf",q:"Un dual-track prépare simultanément une cession M&A et une IPO.",ans:true,exp:"Le dual-track maximise le prix en gardant toutes les options ouvertes."},
      {type:"calc",q:"Prix offre = 50€, cours pré-annonce = 38€. Prime de contrôle (%) ?",ans:31.6,tol:1,exp:"Prime = (50-38)/38 = 31.6%."},
      {type:"qcm",q:"Qu'est-ce que le closing en M&A ?",opts:["Signature du SPA","Transfert effectif de propriété et paiement","Première offre","Due diligence"],ans:1,exp:"Le closing est le moment où la propriété est transférée et le prix payé."},
      {type:"vf",q:"Le carve-out consiste à céder une division d'un groupe.",ans:true,exp:"Un carve-out extrait une entité d'un groupe pour la vendre ou l'introduire en bourse."},
      {type:"calc",q:"Prime = 35% sur cours = 100€. Prix d'offre (€) ?",ans:135,tol:0.5,exp:"Prix = 100 × 1.35 = 135€."},
      {type:"qcm",q:"Qu'est-ce qu'un MBO (Management Buyout) ?",opts:["Rachat de l'entreprise par son management","Achat par un fonds PE externe","IPO","Fusion avec un concurrent"],ans:0,exp:"Un MBO est un rachat réalisé par l'équipe dirigeante, souvent avec le soutien d'un fonds PE."},
      {type:"vf",q:"La 'qualité des résultats' vérifie que l'EBITDA est récurrent et normalisé.",ans:true,exp:"La quality of earnings vérifie que l'EBITDA présenté est récurrent et cash-convertible."},
      {type:"calc",q:"RN acheteur = 100M€, 50M actions. Acq : 10M nouvelles actions, RN cible = 15M€. BPA post (€) ?",ans:1.92,tol:0.02,exp:"BPA post = 115/60 = 1.917€."},
      {type:"qcm",q:"Qu'est-ce qu'un staple financing ?",opts:["Financement proposé par la banque du vendeur aux acheteurs","Dette mezzanine","Refinancement post-closing","Ligne de crédit"],ans:0,exp:"Le staple financing est agrafé au dossier de vente, offrant une solution clé en main."},
      {type:"vf",q:"La due diligence fiscale cherche les risques de redressement.",ans:true,exp:"Elle identifie les expositions fiscales (TVA, IS, prix de transfert) non provisionnées."},
      {type:"calc",q:"Prix = 300M€ dont 50M€ earn-out sur 2 ans (50/50). An1 objectif atteint, An2 non. Earn-out reçu (M€) ?",ans:25,tol:0.5,exp:"An1=25M€ (atteint), An2=0€. Total=25M€."},
      {type:"qcm",q:"Qu'est-ce qu'un spin-off ?",opts:["Distribution aux actionnaires d'une filiale cotée séparément","Cession à un tiers","Fusion-absorption","LBO par le management"],ans:0,exp:"Un spin-off distribue les actions d'une filiale aux actionnaires de la maison mère."},
      {type:"vf",q:"Le teaser M&A mentionne le nom de la société à vendre.",ans:false,exp:"Le teaser est anonyme pour préserver la confidentialité."},
      {type:"calc",q:"Actionnaire A : 60%, B : 25%, C : 15%. Cession 100% à 300M€. Montant reçu par B (M€) ?",ans:75,tol:0.5,exp:"B reçoit 25% × 300 = 75M€."},
      {type:"qcm",q:"Qu'est-ce qu'un data room en M&A ?",opts:["Plateforme où les documents DD sont partagés aux acheteurs","Bureau de négociation","Salle de réunion du comité","Base de données Bloomberg"],ans:0,exp:"Le data room centralise les documents de due diligence."},
      {type:"vf",q:"Les synergies sont généralement intégrées dans le prix payé par l'acheteur.",ans:true,exp:"Le vendeur négocie pour capturer une partie des synergies via la prime payée."},
      {type:"calc",q:"Acheteur P/E = 20x, cible P/E = 15x, paiement en actions. Accretive (1=oui) ?",ans:1,tol:0,exp:"Oui. Si P/E acheteur > P/E cible, paiement en actions est accretive."},
      {type:"qcm",q:"Qu'est-ce qu'un reverse due diligence ?",opts:["Due diligence de la cible sur l'acheteur","Audit post-closing","Revue juridique interne","VDD côté cible"],ans:0,exp:"Dans un deal en actions, la cible analyse l'acheteur pour évaluer la valeur des titres reçus."},
      {type:"vf",q:"Un completion accounts ajuste le prix à la date de closing.",ans:true,exp:"Les completion accounts recalculent le prix selon la trésorerie, la dette et le BFR à la date de closing."},
      {type:"calc",q:"EV = 500M€, dette nette = 100M€, dilution options = 10M€. Equity Value ajustée (M€) ?",ans:390,tol:1,exp:"Equity Value = 500 - 100 - 10 = 390M€."},
    ],
    [
      {type:"qcm",q:"Qu'est-ce que le SOTP (Sum of the Parts) ?",opts:["Valoriser chaque division séparément puis sommer","Additionner les résultats nets","Valoriser par l'actif net","Multiplier l'EBITDA total par un multiple"],ans:0,exp:"La SOTP valorise chaque BU avec la méthode adaptée, puis additionne."},
      {type:"vf",q:"La GAP protège l'acheteur contre des passifs cachés non identifiés en DD.",ans:true,exp:"La Garantie Actif Passif est une garantie contractuelle du vendeur."},
      {type:"calc",q:"Division A EV = 200M€, Division B EV = 150M€, holding costs capitalisés = 30M€. SOTP EV (M€) ?",ans:320,tol:1,exp:"SOTP = 200 + 150 - 30 = 320M€."},
      {type:"qcm",q:"Qu'est-ce que le PPA (Purchase Price Allocation) ?",opts:["Répartition du prix entre actifs identifiables et goodwill","Partage du prix entre co-acheteurs","Allocation budgétaire post-closing","Répartition equity/dette"],ans:0,exp:"Le PPA alloue le prix aux actifs et passifs identifiés, le solde étant le goodwill."},
      {type:"vf",q:"Le goodwill est amorti obligatoirement en IFRS.",ans:false,exp:"En IFRS, le goodwill n'est pas amorti mais soumis à un impairment test annuel."},
      {type:"calc",q:"Prix payé = 300M€, actif net réévalué = 220M€. Goodwill (M€) ?",ans:80,tol:0.5,exp:"Goodwill = 300 - 220 = 80M€."},
      {type:"qcm",q:"Qu'est-ce qu'un management package dans un LBO ?",opts:["Salaire garanti","Dispositif d'intéressement liant le management à la perf","Frais de gestion du fonds","Plan de licenciement"],ans:1,exp:"Le management package aligne les intérêts des dirigeants avec ceux du fonds."},
      {type:"vf",q:"Dans un carve-out, la société mère conserve toujours une participation.",ans:false,exp:"Dans une cession totale, la société mère peut céder 100% de la division."},
      {type:"calc",q:"Goodwill à l'actif = 100M€. Valeur recouvrable UGT = 80M€. Dépréciation (M€) ?",ans:20,tol:0.5,exp:"Dépréciation = 100 - 80 = 20M€."},
      {type:"qcm",q:"Que représente le conglomerate discount ?",opts:["Décote appliquée à un groupe diversifié vs ses parties","Prime de contrôle","Décote de liquidité","Coût du capital groupe"],ans:0,exp:"Le conglomerate discount reflète qu'un groupe diversifié vaut moins que la somme de ses parties."},
      {type:"vf",q:"Les earn-outs peuvent créer des conflits d'intérêts post-closing.",ans:true,exp:"L'acheteur peut avoir intérêt à ralentir la croissance pour ne pas payer l'earn-out."},
      {type:"calc",q:"TRI cible = 25%, investissement = 100M€, hold = 5 ans. Valeur de sortie requise (M€) ?",ans:305,tol:5,exp:"100 × (1.25)^5 ≈ 305M€."},
      {type:"qcm",q:"Qu'est-ce qu'un public to private (P2P) ?",opts:["Retrait de cote via OPA","Introduction en bourse","Fusion de deux cotés","Augmentation de capital"],ans:0,exp:"Un P2P retire une société de la bourse via une OPA, souvent financée par un LBO."},
      {type:"vf",q:"Les actions de préférence ont priorité sur les ordinaires en liquidation.",ans:true,exp:"Les preferred shares ont priorité de remboursement avant les ordinary shares."},
      {type:"calc",q:"PE fund : TRI = 20% sur 6 ans. MOIC approx ?",ans:2.99,tol:0.1,exp:"MOIC = (1.20)^6 ≈ 2.99x."},
      {type:"qcm",q:"Qu'est-ce que le locked box vs completion accounts ?",opts:["Locked box : prix fixe ; completion accounts : ajustement post-closing","Ce sont des synonymes","Locked box pour PE, CA pour industrie","Locked box exclut les dettes"],ans:0,exp:"Locked box fixe le prix à une date de référence. Completion accounts ajuste à la date de closing."},
      {type:"vf",q:"Un LBO sur une société cotée nécessite une prime de contrôle.",ans:true,exp:"Pour un P2P LBO, l'acheteur doit offrir une prime sur le cours."},
      {type:"calc",q:"Prix de retrait OPA = 50€, cours pré-annonce = 38€. Prime (%) ?",ans:31.6,tol:1,exp:"Prime = (50-38)/38 = 31.6%."},
      {type:"qcm",q:"Qu'est-ce que le SPA ?",opts:["Contrat définitif de cession","Lettre d'intention","Accord de confidentialité","Document de due diligence"],ans:0,exp:"Le SPA (Sale and Purchase Agreement) est le contrat juridique final."},
      {type:"vf",q:"Le W&I insurance permet à l'acheteur de se couvrir sans poursuivre directement le vendeur.",ans:true,exp:"La W&I insurance couvre les reps & warranties sans litige direct entre parties."},
      {type:"calc",q:"Actionnaire A : 60%, B : 25%, C : 15%. Cession 100% à 300M€. Montant reçu par B (M€) ?",ans:75,tol:0.5,exp:"B reçoit 25% × 300 = 75M€."},
      {type:"qcm",q:"Qu'est-ce que le tag along ?",opts:["Droit de suivre le majoritaire dans une cession","Clause de sortie forcée","Droit de préemption","Clause de non-dilution"],ans:0,exp:"Le tag along permet aux minoritaires de vendre aux mêmes conditions que le majoritaire."},
      {type:"vf",q:"Le drag along permet à la majorité de forcer la minorité à céder.",ans:true,exp:"Le drag along oblige les minoritaires à suivre une cession décidée par la majorité."},
      {type:"calc",q:"Valeur société = 500M€, minoritaire = 20%, décote minorité = 25%. Valeur titres (M€) ?",ans:75,tol:1,exp:"Valeur = 500 × 20% × (1-25%) = 75M€."},
      {type:"qcm",q:"Qu'est-ce qu'un ratchet dans un management package ?",opts:["Mécanisme augmentant la participation selon la perf","Clause de remboursement","Covenant de levier","Option de sortie"],ans:0,exp:"Le ratchet augmente la part du management selon l'atteinte d'objectifs de TRI."},
      {type:"vf",q:"Les minoritaires peuvent bloquer une fusion si une majorité qualifiée est requise.",ans:true,exp:"Certaines décisions requièrent 66% ou 75%, donnant un droit de veto aux minoritaires."},
      {type:"calc",q:"Sweet equity management : 5% pour 2M€. EV sortie = 600M€, dette nette = 200M€. Valeur equity management (M€) ?",ans:20,tol:0.5,exp:"Equity totale = 400M€. Management = 5% × 400 = 20M€."},
      {type:"qcm",q:"Qu'est-ce que le clawback dans un fonds PE ?",opts:["Mécanisme de récupération d'un carry trop perçu","Clause de drag along","Covenant de performance","Option de sortie anticipée"],ans:0,exp:"Le clawback oblige les gestionnaires à rembourser un carry reçu si le fonds ne dépasse pas le hurdle."},
      {type:"vf",q:"Un IPO prend généralement moins de 3 mois.",ans:false,exp:"Un IPO prend généralement 6 à 12 mois entre la décision et la première cotation."},
      {type:"calc",q:"Fonds PE : 300M€ investi, carry 20% au-dessus du hurdle 8%. TRI=25%, durée=5 ans. Sortie=915M€, Hurdle=440M€. Carry (M€) ?",ans:95,tol:2,exp:"Above hurdle = 915-440 = 475M€. Carry = 20%×475 = 95M€."},
      {type:"qcm",q:"Qu'est-ce qu'un secondary fund en PE ?",opts:["Fonds achetant des participations existantes","Fonds de 2ème génération","Fonds de dette","Fonds de co-investissement"],ans:0,exp:"Un secondary fund achète des parts de fonds PE à des investisseurs cherchant à sortir."},
      {type:"vf",q:"Le hurdle rate en PE est généralement fixé à 15%.",ans:false,exp:"Le hurdle rate est généralement de 8% par an."},
      {type:"calc",q:"M&A : prime payée = 40M€, synergies = 8M€/an. Payback (ans) ?",ans:5,tol:0.1,exp:"Payback = 40/8 = 5 ans."},
      {type:"qcm",q:"Qu'est-ce que le GP vs LP dans un fonds PE ?",opts:["GP gère le fonds (PE firm), LP apporte le capital","GP apporte l'argent, LP gère","Synonymes","GP=investisseur, LP=entrepreneur"],ans:0,exp:"Le GP est la société de PE. Les LP sont les investisseurs institutionnels."},
      {type:"vf",q:"Les management fees en PE sont généralement de 1 à 2% des commitments.",ans:true,exp:"Les management fees couvrent les frais de fonctionnement, typiquement 1.5-2%/an."},
      {type:"calc",q:"Fund size = 1B€, management fee = 1.8%/an, durée = 10 ans. Total management fees (M€) ?",ans:180,tol:1,exp:"Fees = 1000 × 1.8% × 10 = 180M€."},
      {type:"qcm",q:"Qu'est-ce que la reverse break fee ?",opts:["Payée par l'ACHETEUR si le deal échoue","Payée par le vendeur","Commission bancaire","Coût de due diligence"],ans:0,exp:"La reverse break fee est payée par l'ACHETEUR s'il ne finalise pas la transaction."},
      {type:"vf",q:"Un pre-emptive right donne priorité aux actionnaires existants pour acheter de nouvelles actions.",ans:true,exp:"Le droit de préemption permet aux actionnaires existants d'acheter les nouvelles émissions en priorité."},
      {type:"calc",q:"Fonds PE : 5 participations de 20M€ chacune. 2 à 3x MOIC, 2 à 2x, 1 à 0.5x. MOIC global ?",ans:2.1,tol:0.05,exp:"Valeurs : 2×60+2×40+1×10 = 210M€ / 100M€ = 2.1x."},
      {type:"qcm",q:"Qu'est-ce que la NAV d'un fonds PE ?",opts:["Valeur totale des participations aux prix de marché","Total des engagements","Capital appelé","Frais de gestion cumulés"],ans:0,exp:"La NAV est la valeur de marché totale du portefeuille, base de calcul du carried interest."},
      {type:"vf",q:"Le carried interest est typiquement de 20% des profits au-dessus du hurdle.",ans:true,exp:"Le carry = 20% des profits nets au-dessus du hurdle rate (souvent 8%)."},
      {type:"calc",q:"Division valorisée 10x EBITDA (25M€). Holding costs = 5M€/an capitalisés à 8x. EV ajustée (M€) ?",ans:210,tol:1,exp:"EV division = 250M€ - holding costs 40M€ = 210M€."},
    ],
  ],
  en: [],
};

// Copy FR structure for EN (same questions translated — simplified for now, same logic)
// In production you'd have full EN translations
BANK.en = BANK.fr;

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [save, setSave] = useState(null);
  const [tab, setTab] = useState("game");
  const [screen, setScreen] = useState("loading");
  const [gs, setGs] = useState(null);

  useEffect(() => {
    const s = loadSave();
    setSave(s);
    setScreen("home");
  }, []);

  const persist = useCallback((ns) => { setSave(ns); writeSave(ns); }, []);
  const t = save ? T[save.lang] : T.fr;
  const toggleLang = () => persist({ ...save, lang: save.lang === "fr" ? "en" : "fr" });

  const startMission = (lvId, mIdx) => {
    const bank = BANK[save.lang][lvId];
    const qs = shuffle(bank).slice(0, 10);
    setGs({ lvId, mIdx, qs, qi: 0, score: 0, fb: null, sel: null, inp: "", correct: 0 });
    setScreen("game");
  };

  const doAnswer = (ok) => {
    if (gs.fb) return;
    setGs({ ...gs, fb: ok ? "ok" : "err", score: ok ? gs.score + 100 : gs.score, correct: ok ? gs.correct + 1 : gs.correct });
  };

  const doNext = () => {
    if (gs.qi + 1 < gs.qs.length) {
      setGs({ ...gs, qi: gs.qi + 1, fb: null, sel: null, inp: "" });
      return;
    }
    const done = (gs.mIdx + 1) * 10;
    const np = { ...save.levelProgress, [gs.lvId]: Math.max(save.levelProgress[gs.lvId] || 0, done) };
    persist({ ...save, levelProgress: np, totalScore: save.totalScore + gs.score });
    setScreen("mok");
  };

  if (!save || screen === "loading") return <div style={S.root}><div style={{ color: "#5b8fd4", fontFamily: "monospace" }}>Loading...</div></div>;

  return (
    <div style={S.root}>
      <style>{css}</style>
      <div style={S.grid} />
      <button className="hov" onClick={toggleLang} style={S.langBtn}>{t.switchLang}</button>
      <div style={S.appWrap}>
        <div style={S.pageWrap}>
          {tab === "game" && screen === "home" && <Home save={save} t={t} onPlay={() => setScreen("map")} />}
          {tab === "game" && screen === "map" && <Map save={save} t={t} onBack={() => setScreen("home")} onMission={startMission} />}
          {screen === "game" && gs && <Game t={t} lang={save.lang} gs={gs} setGs={setGs} onAnswer={doAnswer} onNext={doNext} onBack={() => setScreen("map")} />}
          {screen === "mok" && gs && (
            <EndScreen t={t} correct={gs.correct} score={gs.score} totalScore={save.totalScore + gs.score}
              lvColor={LV[gs.lvId].color}
              onBack={() => setScreen("map")}
              onRetry={() => startMission(gs.lvId, gs.mIdx)}
              onNext={gs.mIdx < 4 ? () => startMission(gs.lvId, gs.mIdx + 1) : null}
            />
          )}
          {tab === "profile" && screen !== "game" && <ProfileScreen save={save} t={t} />}
        </div>
        {screen !== "game" && (
          <nav style={S.bottomNav}>
            {[{ id: "game", icon: "🎮", label: t.tabGame }, { id: "profile", icon: "👤", label: t.tabProfile }].map(tb => (
              <button key={tb.id} className="hov" style={{ ...S.navBtn, color: tab === tb.id ? "#3b82f6" : "#3a5a7a", borderTop: `2px solid ${tab === tb.id ? "#3b82f6" : "transparent"}` }}
                onClick={() => { setTab(tb.id); if (tb.id === "game" && screen !== "map") setScreen("home"); }}>
                <span style={{ fontSize: 22 }}>{tb.icon}</span>
                <span style={{ fontSize: 9 }}>{tb.label}</span>
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

function Home({ save, t, onPlay }) {
  const completed = Object.values(save.levelProgress).filter(v => v >= 50).length;
  return (
    <div style={S.col}>
      <div style={S.logoWrap}>
        <div style={S.glyph}>₿</div>
        <h1 style={S.logoTxt}>{t.title}</h1>
        <p style={S.logoSub}>{t.tagline}</p>
      </div>
      <div style={S.statsRow}>
        {[{ v: save.totalScore.toLocaleString(), l: t.score, c: "#3b82f6" }, { v: `${completed}/5`, l: "Niveaux", c: "#10b981" }, { v: save.dailyStreak, l: t.streak, c: "#f59e0b" }].map((s, i) => (
          <div key={i} style={S.statBox}><span style={{ ...S.statV, color: s.c }}>{s.v}</span><span style={S.statL}>{s.l}</span></div>
        ))}
      </div>
      <button className="hov" style={S.bigBtn} onClick={onPlay}>{t.play} →</button>
    </div>
  );
}

function Map({ save, t, onBack, onMission }) {
  const names = t.levelNames;
  return (
    <div style={S.mapWrap}>
      <button className="hov" style={S.backBtn} onClick={onBack}>{t.backMenu}</button>
      <h2 style={S.mapH}>{t.play}</h2>
      <div style={S.lvList}>
        {LV.map((lv, li) => {
          const done = save.levelProgress[li] || 0;
          const pct = Math.min((done / 50) * 100, 100);
          const locked = li > 0 && (save.levelProgress[li - 1] || 0) < 50;
          return (
            <div key={li} style={{ ...S.lvCard, borderColor: locked ? "#141f2e" : lv.color + "55", opacity: locked ? 0.5 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ ...S.lvIcon, background: lv.color + "18", color: lv.color }}>{lv.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={S.lvNum}>LV.0{li + 1}</div>
                  <div style={S.lvTitle}>{names[li]}</div>
                  {locked && <div style={S.lvLocked}>{t.locked}</div>}
                </div>
                {pct >= 100 && <span style={{ color: "#10b981" }}>✓</span>}
              </div>
              {!locked && (
                <>
                  <div style={S.progRow}>
                    <div style={S.pb}><div style={{ ...S.pf, width: `${pct}%`, background: lv.color }} /></div>
                    <span style={S.pLab}>{done}/50</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {Array.from({ length: 5 }).map((_, mi) => {
                      const ms = mi * 10, mDone = done >= ms + 10, mCur = done >= ms && done < ms + 10, mLock = done < ms;
                      return (
                        <button key={mi} className="hov" disabled={mLock} onClick={() => onMission(li, mi)}
                          style={{ ...S.mBtn, background: mDone ? lv.color : mCur ? lv.color + "28" : "transparent", borderColor: mLock ? "#141f2e" : lv.color, color: mDone ? "#05090f" : mLock ? "#1e3040" : lv.color, opacity: mLock ? 0.3 : 1 }}>
                          {mDone ? "✓" : `M${mi + 1}`}
                        </button>
                      );
                    })}
                    <button className="hov" onClick={() => onMission(li, Math.floor(done / 10))}
                      style={{ ...S.mBtn, marginLeft: "auto", borderColor: lv.color, color: lv.color, fontSize: 10 }}>
                      ▶ {t.play}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Game({ t, lang, gs, setGs, onAnswer, onNext, onBack }) {
  const q = gs.qs[gs.qi];
  const lv = LV[gs.lvId || 0];
  const ac = lv.color;
  const typeLabel = q.type === "qcm" ? "QCM" : q.type === "vf" ? (lang === "fr" ? "VRAI / FAUX" : "TRUE / FALSE") : (lang === "fr" ? "CALCUL" : "CALCULATE");

  const doQCM = (i) => { if (gs.fb) return; setGs({ ...gs, sel: i }); onAnswer(i === q.ans); };
  const doVF = (v) => { if (gs.fb) return; setGs({ ...gs, sel: v }); onAnswer(v === q.ans); };
  const doCalc = () => {
    if (gs.fb) return;
    const num = parseFloat((gs.inp || "").replace(",", "."));
    if (isNaN(num)) return;
    onAnswer(Math.abs(num - q.ans) <= (q.tol !== undefined ? q.tol : 0.5));
  };

  return (
    <div style={S.gameWrap}>
      <div style={S.topBar}>
        <button className="hov" style={S.backBtn} onClick={onBack}>{t.backMenu}</button>
        <span style={{ fontSize: 10, color: "#10b981" }}>✓ {gs.correct || 0}/10</span>
        <div style={S.scoreTag}>{gs.score} pts</div>
      </div>
      <div style={{ height: 3, background: "#0a1520", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", background: ac, width: `${(gs.qi / gs.qs.length) * 100}%`, transition: "width .4s ease" }} />
      </div>
      <div style={{ fontSize: 9, color: "#1e3040", textAlign: "right" }}>{gs.qi + 1}/{gs.qs.length}</div>
      <div style={{ ...S.card, borderColor: gs.fb === "ok" ? "#10b981" : gs.fb === "err" ? "#ef4444" : "#152030", animation: gs.fb === "err" ? "shk 0.4s ease" : "pop .2s ease" }}>
        <div style={{ ...S.tag, borderColor: ac + "66", color: ac }}>{typeLabel}</div>
        <p style={S.qTxt}>{q.q}</p>
        {q.type === "qcm" && (
          <div style={S.opts}>
            {q.opts.map((o, i) => {
              let bg = "transparent", bc = "#152030", col = "#c8d8e8";
              if (gs.fb) { if (i === q.ans) { bg = "#10b98114"; bc = "#10b981"; col = "#10b981"; } else if (i === gs.sel && gs.sel !== q.ans) { bg = "#ef444414"; bc = "#ef4444"; col = "#ef4444"; } } else if (gs.sel === i) { bg = "#162840"; bc = ac; }
              return <button key={i} className="opt" onClick={() => doQCM(i)} style={{ ...S.optB, background: bg, borderColor: bc, color: col }}>
                <span style={{ ...S.optL, borderColor: bc, color: col }}>{String.fromCharCode(65 + i)}</span>{o}
              </button>;
            })}
          </div>
        )}
        {q.type === "vf" && (
          <div style={{ display: "flex", gap: 9 }}>
            {[true, false].map(v => {
              let bg = "transparent", bc = "#152030", col = "#c8d8e8";
              if (gs.fb) { if (v === q.ans) { bg = "#10b98114"; bc = "#10b981"; col = "#10b981"; } else if (v === gs.sel && gs.sel !== q.ans) { bg = "#ef444414"; bc = "#ef4444"; col = "#ef4444"; } } else if (gs.sel === v) { bg = "#162840"; bc = ac; }
              return <button key={String(v)} className="opt" onClick={() => doVF(v)} style={{ flex: 1, background: bg, border: `1px solid ${bc}`, borderRadius: 8, padding: "16px", color: col, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, letterSpacing: ".1em", transition: "all .15s" }}>
                {v ? t.trueL : t.falseL}
              </button>;
            })}
          </div>
        )}
        {q.type === "calc" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" value={gs.inp} onChange={e => setGs({ ...gs, inp: e.target.value })}
                placeholder={t.yourAns} style={{ ...S.calcIn, borderColor: gs.fb === "ok" ? "#10b981" : gs.fb === "err" ? "#ef4444" : "#152030" }}
                disabled={!!gs.fb} onKeyDown={e => e.key === "Enter" && !gs.fb && doCalc()} />
              <button className="hov" style={{ ...S.calcBtn, background: ac }} onClick={doCalc} disabled={!!gs.fb}>{t.submit}</button>
            </div>
            {gs.fb && <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", color: gs.fb === "ok" ? "#10b981" : "#ef4444" }}>= {q.ans}</div>}
          </div>
        )}
        {gs.fb && (
          <div style={{ borderTop: "1px solid #101e2e", paddingTop: 13, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: gs.fb === "ok" ? "#10b981" : "#ef4444" }}>
              {gs.fb === "ok" ? `✓ ${t.correct}` : `✗ ${t.wrong}`}
            </div>
            <p style={{ margin: 0, fontSize: 11, color: "#6a8098", lineHeight: 1.7 }}>
              <strong style={{ color: "#7a90a8" }}>{t.explanation} : </strong>{q.exp}
            </p>
            <button className="hov" style={{ alignSelf: "flex-end", background: "transparent", border: `1px solid ${ac}`, borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", fontSize: 11, color: ac }} onClick={onNext}>{t.next}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function EndScreen({ t, correct, score, totalScore, lvColor, onBack, onRetry, onNext }) {
  return (
    <div style={S.col}>
      <div style={{ fontSize: 56 }}>{correct === 10 ? "🏆" : correct >= 7 ? "✓" : "📚"}</div>
      <h2 style={S.endH}>{t.missionOk}</h2>
      <p style={{ margin: 0, fontSize: 13, color: "#5b8fd4" }}>{correct}/10 correctes · {score} pts</p>
      <div style={S.statBox}><span style={{ ...S.statV, color: "#3b82f6" }}>{totalScore.toLocaleString()}</span><span style={S.statL}>Total</span></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
        {onNext && <button className="hov" style={{ ...S.bigBtn, background: lvColor }} onClick={onNext}>{t.nextMission}</button>}
        <button className="hov" style={{ ...S.bigBtn, background: "transparent", border: `1px solid ${lvColor}`, color: lvColor }} onClick={onRetry}>{t.retry}</button>
        <button className="hov" style={{ ...S.bigBtn, background: "transparent", color: "#3a5a7a", border: "1px solid #141f2e" }} onClick={onBack}>{t.backMenu}</button>
      </div>
    </div>
  );
}

function ProfileScreen({ save, t }) {
  const names = t.levelNames;
  const completed = Object.values(save.levelProgress).filter(v => v >= 50).length;
  const totalQ = Object.values(save.levelProgress).reduce((a, b) => a + b, 0);
  return (
    <div style={S.mapWrap}>
      <h2 style={S.mapH}>{t.profileTitle}</h2>
      <div style={{ background: "#07101a", border: "1px solid #101e2e", borderRadius: 12, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#0e1e30", border: "2px solid #3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
          {LV[Math.min(completed, 4)].icon}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e8f0ff" }}>{names[Math.min(completed, 4)]}</div>
          <div style={{ fontSize: 10, color: "#3a5a7a", marginTop: 3 }}>{completed}/5 niveaux</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[{ v: save.totalScore.toLocaleString(), l: t.score, c: "#3b82f6" }, { v: totalQ, l: "Questions", c: "#10b981" }, { v: save.dailyStreak, l: t.streak, c: "#f59e0b" }].map((s, i) => (
          <div key={i} style={S.statBox}><span style={{ ...S.statV, fontSize: 18, color: s.c }}>{s.v}</span><span style={S.statL}>{s.l}</span></div>
        ))}
      </div>
      <div style={{ background: "#07101a", border: "1px solid #101e2e", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {LV.map((lv, i) => {
          const done = save.levelProgress[i] || 0;
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "#e8f0ff" }}>{lv.icon} {names[i]}</span>
                <span style={{ fontSize: 9, color: "#3a5a7a" }}>{done}/50</span>
              </div>
              <div style={{ ...S.pb, height: 4 }}><div style={{ ...S.pf, width: `${Math.min((done / 50) * 100, 100)}%`, background: lv.color }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box}
  input[type=number]{-moz-appearance:textfield}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
  @keyframes shk{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
  @keyframes pop{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
  .hov:hover{filter:brightness(1.15);cursor:pointer}
  .opt:hover{background:rgba(255,255,255,0.04)!important}
`;
const S = {
  root:{minHeight:"100vh",background:"#04090f",fontFamily:"'DM Mono','Courier New',monospace",color:"#c8d8e8",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflowX:"hidden"},
  grid:{position:"fixed",inset:0,backgroundImage:"linear-gradient(rgba(20,50,90,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(20,50,90,.07) 1px,transparent 1px)",backgroundSize:"34px 34px",pointerEvents:"none",zIndex:0},
  langBtn:{position:"fixed",top:14,right:14,background:"transparent",border:"1px solid #152030",color:"#4a6a8a",padding:"5px 12px",borderRadius:4,cursor:"pointer",fontFamily:"inherit",fontSize:11,letterSpacing:".12em",zIndex:200},
  appWrap:{width:"100%",maxWidth:520,minHeight:"100vh",display:"flex",flexDirection:"column",zIndex:1},
  pageWrap:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px 12px 88px"},
  bottomNav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:520,background:"#060d18",borderTop:"1px solid #101e2e",display:"flex",zIndex:100},
  navBtn:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 0 14px",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",transition:"color .15s"},
  col:{display:"flex",flexDirection:"column",alignItems:"center",gap:18,width:"100%",maxWidth:440,textAlign:"center"},
  logoWrap:{display:"flex",flexDirection:"column",alignItems:"center",gap:8},
  glyph:{fontSize:44,filter:"drop-shadow(0 0 24px #3b82f6)"},
  logoTxt:{margin:0,fontSize:36,fontFamily:"'Playfair Display',Georgia,serif",fontWeight:900,color:"#e8f0ff",letterSpacing:"-.02em",lineHeight:1},
  logoSub:{margin:0,fontSize:11,color:"#3a5a7a",letterSpacing:".08em"},
  statsRow:{display:"flex",gap:10,width:"100%"},
  statBox:{flex:1,background:"#07101a",border:"1px solid #101e2e",borderRadius:8,padding:"12px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:4},
  statV:{fontSize:20,fontWeight:700,color:"#e8f0ff",fontVariantNumeric:"tabular-nums"},
  statL:{fontSize:9,color:"#3a5a7a",letterSpacing:".1em"},
  bigBtn:{width:"100%",background:"#3b82f6",border:"none",color:"#04090f",padding:"14px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700,letterSpacing:".06em"},
  mapWrap:{width:"100%",maxWidth:520,display:"flex",flexDirection:"column",gap:12},
  backBtn:{background:"transparent",border:"none",color:"#3a5a7a",cursor:"pointer",fontFamily:"inherit",fontSize:11,padding:"4px 0",alignSelf:"flex-start",letterSpacing:".04em"},
  mapH:{margin:0,fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,color:"#e8f0ff",fontWeight:700},
  lvList:{display:"flex",flexDirection:"column",gap:10},
  lvCard:{background:"#070e1a",border:"1px solid",borderRadius:12,padding:"14px 16px",display:"flex",flexDirection:"column",gap:10},
  lvIcon:{width:42,height:42,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0},
  lvNum:{fontSize:9,color:"#3a5a7a",letterSpacing:".12em",marginBottom:2},
  lvTitle:{fontSize:13,fontWeight:600,color:"#e8f0ff"},
  lvLocked:{fontSize:9,color:"#ef4444",letterSpacing:".06em",marginTop:2},
  progRow:{display:"flex",alignItems:"center",gap:8},
  pb:{flex:1,height:3,background:"#0a1520",borderRadius:2,overflow:"hidden"},
  pf:{height:"100%",borderRadius:2,transition:"width .5s ease"},
  pLab:{fontSize:9,color:"#3a5a7a",fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap"},
  mBtn:{border:"1px solid",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:600,letterSpacing:".08em",transition:"all .15s"},
  gameWrap:{width:"100%",maxWidth:520,display:"flex",flexDirection:"column",gap:10},
  topBar:{display:"flex",alignItems:"center",justifyContent:"space-between"},
  scoreTag:{fontSize:11,color:"#5b8fd4",fontVariantNumeric:"tabular-nums"},
  card:{background:"#060d18",border:"1px solid",borderRadius:14,padding:"20px",display:"flex",flexDirection:"column",gap:15,transition:"border-color .3s"},
  tag:{fontSize:8,letterSpacing:".18em",border:"1px solid",padding:"2px 9px",borderRadius:20,alignSelf:"flex-start"},
  qTxt:{margin:0,fontSize:14,lineHeight:1.75,color:"#dde8f5",fontFamily:"'Playfair Display',Georgia,serif",fontStyle:"italic"},
  opts:{display:"flex",flexDirection:"column",gap:7},
  optB:{background:"transparent",border:"1px solid",borderRadius:7,padding:"10px 13px",color:"#c8d8e8",cursor:"pointer",fontFamily:"inherit",fontSize:12,textAlign:"left",display:"flex",alignItems:"center",gap:9,transition:"all .15s",lineHeight:1.4},
  optL:{width:21,height:21,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid",borderRadius:4,fontSize:9,flexShrink:0},
  calcIn:{flex:1,background:"#0a1520",border:"1px solid #152030",borderRadius:7,padding:"11px 13px",color:"#e8f0ff",fontFamily:"inherit",fontSize:15,outline:"none",transition:"border-color .2s",width:"100%"},
  calcBtn:{border:"none",borderRadius:7,padding:"11px 16px",color:"#04090f",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700},
  endH:{margin:0,fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,color:"#e8f0ff",fontWeight:700},
};
