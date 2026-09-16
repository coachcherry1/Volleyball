# Answer key — IR Spectroscopy: The Diagnostic Region

Generated from `src/js/molecules.js` by `node tools/answer-key.js`. Do not hand-edit:
change the band table and regenerate, so the key and the activity stay in step.

**Scored bands** are the drop targets a student must label. The *drawn* value is the
centre this package uses; the *accepted window* is the wavenumber range a label may be
dropped in, chosen to match the range in a standard correlation table. Each spectrum is
drawn with a small seeded jitter about the drawn value, so the peak a student sees moves
by a few wavenumbers between attempts and always stays inside the accepted window.

Supporting bands are drawn so the spectrum reads like a real one but are never targets.

## Contents

- **Alkane** — Hexane
- **Alkene** — 1-Hexene
- **Terminal alkyne** — 1-Hexyne
- **Aromatic hydrocarbon** — Toluene
- **Alcohol** — 1-Butanol
- **Carboxylic acid** — Butanoic acid
- **Ester** — Ethyl acetate
- **Ketone** — 2-Butanone
- **Aldehyde** — Butanal
- **Aromatic aldehyde** — Benzaldehyde
- **Aryl ketone** — Acetophenone
- **Primary amide** — Propanamide
- **Secondary amide** — N-Methylacetamide
- **Primary amine** — 1-Butanamine
- **Secondary amine** — N-Methylbutan-1-amine
- **Nitrile** — Butanenitrile
- **Nitro compound** — Nitrobenzene
- **Acid chloride** — Acetyl chloride
- **Anhydride** — Acetic anhydride
- **Phenol** — Phenol
- **Ether** — Diethyl ether
- **Aromatic carboxylic acid** — Benzoic acid

## Hexane

`hexane` · Alkane · C₆H₁₄ · appears in Level 2

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| C–H (sp³ alkyl) | 2960 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 2930, 2872, 1462, 1378 cm⁻¹.

## 1-Hexene

`hexene` · Alkene · C₆H₁₂ · appears in Level 2 and Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| C–H (sp² vinyl/aryl) | 3080 | 3010–3130 | 3000–3100 | Just ABOVE 3000 — the hydrogen is on an sp² carbon (alkene or ring). |
| C=C (alkene) | 1642 | 1600–1690 | 1620–1680 | One weak-to-medium band near 1640 — an isolated alkene. |
| C–H (sp³ alkyl) | 2960 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 2930, 2872, 1462, 1378, 993, 910 cm⁻¹.

## 1-Hexyne

`hexyne` · Terminal alkyne · C₆H₁₀ · appears in Level 2 and Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| ≡C–H (terminal alkyne) | 3310 | 3230–3400 | 3290–3320 | A narrow, strong spike near 3300 — sp C–H. Sharper than any O–H. |
| C≡C (alkyne) | 2120 | 2040–2200 | 2100–2260 | Weak and near 2120 — an alkyne. Nitriles sit higher and are stronger. |
| C–H (sp³ alkyl) | 2960 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 2930, 2872, 1462, 1378, 630 cm⁻¹.

## Toluene

`toluene` · Aromatic hydrocarbon · C₇H₈ · appears in Level 2 and Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| C–H (sp² vinyl/aryl) | 3028 | 3008–3120 | 3000–3100 | Just ABOVE 3000 — the hydrogen is on an sp² carbon (alkene or ring). |
| C–H (sp³ alkyl) | 2925 | 2845–3004 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |
| C=C (aromatic ring) | 1605 | 1560–1640 | 1450–1620 | A PAIR of bands near 1600 and 1500 — that is ring breathing, not an isolated alkene. |

Supporting bands (drawn, not scored): 1496, 1460, 729, 695 cm⁻¹.

## 1-Butanol

`butanol` · Alcohol · C₄H₁₀O · appears in Level 2 and Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| O–H (alcohol) | 3340 | 3180–3620 | 3200–3600 | Broad and rounded, but it ends before 3100 — an alcohol O–H, not an acid. |
| C–O (single bond) | 1055 | 990–1310 | 1000–1300 | Strong band in the 1000–1300 window — a C–O single bond (alcohol, ether, ester or acid). |
| C–H (sp³ alkyl) | 2960 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 2930, 2872, 1462, 1380, 1378 cm⁻¹.

## Butanoic acid

`butanoicacid` · Carboxylic acid · C₄H₈O₂ · appears in Level 2 and Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| O–H (carboxylic acid) | 3000 | 2480–3320 | 2500–3300 | Enormously broad — it swallows the C–H peaks and runs down past 2600. Only a carboxylic acid does that. |
| C=O (carboxylic acid) | 1712 | 1676–1730 | 1680–1725 | A carbonyl underneath a gigantic 2500–3300 O–H — carboxylic acid. |
| C–O (single bond) | 1290 | 1180–1330 | 1000–1300 | Strong band in the 1000–1300 window — a C–O single bond (alcohol, ether, ester or acid). |

Supporting bands (drawn, not scored): 2960, 2935, 1415, 935 cm⁻¹.

## Ethyl acetate

`ethylacetate` · Ester · C₄H₈O₂ · appears in Level 2 and Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| C=O (ester) | 1742 | 1700–1790 | 1730–1760 | Near 1740 AND a strong C–O near 1200–1250 — ester, not ketone. |
| C–O (single bond) | 1240 | 1150–1300 | 1000–1300 | Strong band in the 1000–1300 window — a C–O single bond (alcohol, ether, ester or acid). |
| C–H (sp³ alkyl) | 2985 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 2940, 1372, 1045 cm⁻¹.

## 2-Butanone

`butanone` · Ketone · C₄H₈O · appears in Level 2 and Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| C=O (ketone) | 1715 | 1680–1755 | 1670–1725 | Near 1715 with no O–H, no C–O, and no aldehyde C–H — a plain ketone. |
| C–H (sp³ alkyl) | 2980 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 2940, 1415, 1360, 1170 cm⁻¹.

## Butanal

`butanal` · Aldehyde · C₄H₈O · appears in Level 2 and Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| C=O (aldehyde) | 1727 | 1690–1760 | 1700–1740 | Check near 2720 — if the aldehyde C–H doublet is there, this carbonyl is an aldehyde. |
| C–H (aldehyde) | 2820 | 2680–2842 | 2690–2850 | The two weak peaks near 2820 and 2720 are the aldehyde C–H Fermi doublet — they prove –CHO. |
| C–H (sp³ alkyl) | 2965 | 2848–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 2935, 2718, 1460, 1125 cm⁻¹.

## Benzaldehyde

`benzaldehyde` · Aromatic aldehyde · C₇H₆O · appears in Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| C=O (aldehyde) | 1702 | 1670–1745 | 1700–1740 | Check near 2720 — if the aldehyde C–H doublet is there, this carbonyl is an aldehyde. |
| C–H (aldehyde) | 2820 | 2680–2845 | 2690–2850 | The two weak peaks near 2820 and 2720 are the aldehyde C–H Fermi doublet — they prove –CHO. |
| C–H (sp² vinyl/aryl) | 3065 | 3008–3120 | 3000–3100 | Just ABOVE 3000 — the hydrogen is on an sp² carbon (alkene or ring). |
| C=C (aromatic ring) | 1598 | 1548–1640 | 1450–1620 | A PAIR of bands near 1600 and 1500 — that is ring breathing, not an isolated alkene. |

Supporting bands (drawn, not scored): 2738, 1585, 1455, 1205, 745, 688 cm⁻¹.

## Acetophenone

`acetophenone` · Aryl ketone · C₈H₈O · appears in Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| C=O (ketone) | 1685 | 1655–1730 | 1670–1725 | Near 1715 with no O–H, no C–O, and no aldehyde C–H — a plain ketone. |
| C–H (sp² vinyl/aryl) | 3062 | 3008–3120 | 3000–3100 | Just ABOVE 3000 — the hydrogen is on an sp² carbon (alkene or ring). |
| C–H (sp³ alkyl) | 2925 | 2845–3006 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |
| C=C (aromatic ring) | 1598 | 1545–1648 | 1450–1620 | A PAIR of bands near 1600 and 1500 — that is ring breathing, not an isolated alkene. |

Supporting bands (drawn, not scored): 1580, 1450, 1265, 760, 690 cm⁻¹.

## Propanamide

`propanamide` · Primary amide · C₃H₇NO · appears in Level 2 and Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| N–H (amide) | 3352 | 3240–3480 | 3150–3400 | N–H stretch sitting above a carbonyl near 1650 — that pairing is an amide. |
| C=O (amide) | 1655 | 1626–1700 | 1630–1690 | Unusually LOW for a carbonyl (~1655) because N donates into it — amide. |
| C–H (sp³ alkyl) | 2940 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 3180, 1620, 1425 cm⁻¹.

## N-Methylacetamide

`nmethylacetamide` · Secondary amide · C₃H₇NO · appears in Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| N–H (amide) | 3300 | 3180–3470 | 3150–3400 | N–H stretch sitting above a carbonyl near 1650 — that pairing is an amide. |
| C=O (amide) | 1655 | 1600–1700 | 1630–1690 | Unusually LOW for a carbonyl (~1655) because N donates into it — amide. |
| C–H (sp³ alkyl) | 2940 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 1560, 1410 cm⁻¹.

## 1-Butanamine

`butylamine` · Primary amine · C₄H₁₁N · appears in Level 2 and Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| N–H (1° amine) | 3368 | 3245–3500 | 3300–3400 | Two sharp-ish spikes means TWO N–H bonds — a primary amine. |
| C–H (sp³ alkyl) | 2958 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 3290, 2930, 2860, 1612, 1070, 810 cm⁻¹.

## N-Methylbutan-1-amine

`nmethylbutylamine` · Secondary amine · C₅H₁₃N · appears in Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| N–H (2° amine) | 3295 | 3200–3460 | 3280–3350 | A single weak N–H spike means one N–H bond — a secondary amine. |
| C–H (sp³ alkyl) | 2958 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 2930, 2860, 2790, 1465, 1130 cm⁻¹.

## Butanenitrile

`butyronitrile` · Nitrile · C₄H₇N · appears in Level 2 and Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| C≡N (nitrile) | 2246 | 2180–2300 | 2210–2260 | Sharp and medium-strength near 2250 — nitrile. A C≡C would be much weaker. |
| C–H (sp³ alkyl) | 2965 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 2935, 1460, 1425 cm⁻¹.

## Nitrobenzene

`nitrobenzene` · Nitro compound · C₆H₅NO₂ · appears in Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| N–O (nitro) | 1522 | 1470–1570 | 1340–1560 | Two very strong bands near 1520 and 1350 — the asymmetric and symmetric NO₂ stretches. |
| C–H (sp² vinyl/aryl) | 3078 | 3010–3130 | 3000–3100 | Just ABOVE 3000 — the hydrogen is on an sp² carbon (alkene or ring). |
| C=C (aromatic ring) | 1608 | 1580–1670 | 1450–1620 | A PAIR of bands near 1600 and 1500 — that is ring breathing, not an isolated alkene. |

Supporting bands (drawn, not scored): 1480, 1348, 852, 705 cm⁻¹.

## Acetyl chloride

`acetylchloride` · Acid chloride · C₂H₃ClO · appears in Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| C=O (acid chloride) | 1802 | 1762–1860 | 1770–1820 | Above 1770 — the chlorine pulls electron density in and stiffens the C=O. Acid chloride. |
| C–H (sp³ alkyl) | 2940 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 1355, 1105, 605 cm⁻¹.

## Acetic anhydride

`aceticanhydride` · Anhydride · C₄H₆O₃ · appears in Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| C=O (anhydride) | 1825 | 1770–1880 | 1740–1830 | TWO carbonyl peaks about 60 cm⁻¹ apart — only an anhydride does that. |
| C–O (single bond) | 1125 | 1040–1300 | 1000–1300 | Strong band in the 1000–1300 window — a C–O single bond (alcohol, ether, ester or acid). |
| C–H (sp³ alkyl) | 2940 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 1752, 1370, 1000 cm⁻¹.

## Phenol

`phenol` · Phenol · C₆H₆O · appears in Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| O–H (alcohol) | 3350 | 3190–3640 | 3200–3600 | Broad and rounded, but it ends before 3100 — an alcohol O–H, not an acid. |
| C–H (sp² vinyl/aryl) | 3040 | 3006–3140 | 3000–3100 | Just ABOVE 3000 — the hydrogen is on an sp² carbon (alkene or ring). |
| C=C (aromatic ring) | 1596 | 1545–1640 | 1450–1620 | A PAIR of bands near 1600 and 1500 — that is ring breathing, not an isolated alkene. |
| C–O (single bond) | 1225 | 1130–1320 | 1000–1300 | Strong band in the 1000–1300 window — a C–O single bond (alcohol, ether, ester or acid). |

Supporting bands (drawn, not scored): 1498, 1360, 810, 750 cm⁻¹.

## Diethyl ether

`diethylether` · Ether · C₄H₁₀O · appears in Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| C–O (single bond) | 1122 | 1030–1300 | 1000–1300 | Strong band in the 1000–1300 window — a C–O single bond (alcohol, ether, ester or acid). |
| C–H (sp³ alkyl) | 2975 | 2845–3005 | 2850–3000 | Just below 3000 — saturated C–H. Almost every organic spectrum has this. |

Supporting bands (drawn, not scored): 2930, 2870, 1450, 1380 cm⁻¹.

## Benzoic acid

`benzoicacid` · Aromatic carboxylic acid · C₇H₆O₂ · appears in Level 3

| Scored band | Drawn (cm⁻¹) | Accepted window | Literature range | Discriminator |
| --- | ---: | :---: | :---: | --- |
| O–H (carboxylic acid) | 3010 | 2470–3310 | 2500–3300 | Enormously broad — it swallows the C–H peaks and runs down past 2600. Only a carboxylic acid does that. |
| C=O (carboxylic acid) | 1685 | 1650–1725 | 1680–1725 | A carbonyl underneath a gigantic 2500–3300 O–H — carboxylic acid. |
| C=C (aromatic ring) | 1602 | 1560–1645 | 1450–1620 | A PAIR of bands near 1600 and 1500 — that is ring breathing, not an isolated alkene. |
| C–O (single bond) | 1290 | 1180–1340 | 1000–1300 | Strong band in the 1000–1300 window — a C–O single bond (alcohol, ether, ester or acid). |

Supporting bands (drawn, not scored): 3070, 1452, 930, 710 cm⁻¹.

## Level 2 vs Level 3

Level 2 asks for the **family** of each scored band, so any carbonyl is just “C=O”.
Level 3 asks for the **specific group**, so the student has to separate ester from
ketone from acid from amide using the discriminator column above.

| Family | Specific groups it covers |
| --- | --- |
| O–H | O–H (alcohol), O–H (carboxylic acid) |
| N–H | N–H (1° amine), N–H (2° amine), N–H (amide) |
| C–H | C–H (sp³ alkyl), C–H (sp² vinyl/aryl), ≡C–H (terminal alkyne), C–H (aldehyde) |
| C≡N or C≡C | C≡N (nitrile), C≡C (alkyne) |
| C=O | C=O (anhydride), C=O (acid chloride), C=O (ester), C=O (aldehyde), C=O (ketone), C=O (carboxylic acid), C=O (amide) |
| C=C | C=C (alkene), C=C (aromatic ring) |
| C–O | C–O (single bond) |
| N–O | N–O (nitro) |

