# Label Lore deterministic grading methodology

**Status:** Implemented  
**Methodology version:** `label-lore-npm2004-adapted-v1`  
**Purpose:** Explainable classroom/project comparison of packaged foods, not medical advice, an official food rating, or a regulatory compliance decision.

## Nutrient point reference

The nutrient point thresholds are adapted from the UK Food Standards Agency's 2004/05 nutrient profiling model (NPM) technical guidance. That model gives 0–10 adverse points per 100 g for energy, saturated fat, total sugars, and sodium; and up to 5 positive points for AOAC fibre and protein. These thresholds are a published nutrient profiling reference, not FSSAI limits. Label Lore does not claim its A–E output is an FSSAI rating.

For each adverse nutrient, the points equal the number of thresholds strictly exceeded:

| Nutrient (per 100 g) | Thresholds exceeded for each additional point |
|---|---|
| Energy (kJ) | 335, 670, 1,005, 1,340, 1,675, 2,010, 2,345, 2,680, 3,015, 3,350 |
| Saturated fat (g) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 |
| Total sugars (g) | 4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45 |
| Sodium (mg) | 90, 180, 270, 360, 450, 540, 630, 720, 810, 900 |

The model uses **total sugars** because the available OFF nutrition fields do not reliably establish free sugars. If sodium is absent but salt is present, Label Lore converts salt to a sodium equivalent at 400 mg sodium per gram salt, consistent with WHO's stated equivalence of 5 g salt to 2 g sodium. Sodium is preferred when both are present, and the values are never added together.

Positive points, when the corresponding numeric value exists, use the NPM thresholds:

| Nutrient (per 100 g) | Thresholds exceeded for each additional point |
|---|---|
| Fibre (g) | 0.9, 1.9, 2.8, 3.7, 4.7 |
| Protein (g) | 1.6, 3.2, 4.8, 6.4, 8.0 |

OFF does not provide a verified fibre test method in the current product model. A declared fibre value can therefore contribute the NPM-derived positive points, but its method remains an uncertainty shown in completeness details. Protein points follow the NPM rule: when adverse points total 11 or more, protein points are omitted because the model requires a five-point fruit/vegetable/nut contribution, which Label Lore cannot calculate from ingredient names alone. Label Lore does not estimate that percentage.

## Basis and required data

The reference thresholds are per 100 g. A score requires an explicitly recorded `100g` nutrition basis plus energy, saturated fat, total sugars, and either sodium or salt. Missing required values are not treated as zero. Negative, non-finite, or otherwise invalid required values make the result `INSUFFICIENT_DATA`.

Values recorded per 100 ml are **not** compared directly with per-100-g thresholds. Without product density, no valid conversion is available, so a 100 ml-only product receives `INSUFFICIENT_DATA`. The result identifies the basis mismatch. Missing optional fibre or protein simply means no positive points are awarded; missing trans fat does not affect this model because it is not one of its factors.

## Label Lore score and grade mapping

The NPM-derived nutrient profile is:

`net points = adverse nutrient points − eligible fibre and protein points`

Label Lore's presentation score is its own linear conversion:

`score = round(clamp(100 − 2.5 × net points, 0, 100))`

The A–E bands are also Label Lore choices, not official thresholds:

| Grade | Score |
|---|---:|
| A | 80–100 |
| B | 60–79 |
| C | 40–59 |
| D | 20–39 |
| E | 0–19 |

This rescaling makes a longer nutrient-profile scale easier to present in the existing product context. It does not turn the output into a clinical assessment or an official classification.

## Ingredients and additives

Ingredient names and additive references are reported as evidence only; they do not change the score in this version. The database's INS 319 and INS 621 references provide an identity/name/function but no authoritative source, verification status, or hazard classification. An INS number alone is not evidence of harm. Unknown additive codes are listed as unrecognized and receive no penalty. Ingredient names are not used to estimate fruit/vegetable/nut percentages.

## References

- UK Department of Health and Social Care, [Nutrient profiling model 2004 to 2005: technical guidance](https://assets.publishing.service.gov.uk/media/695e87982a4a53b73d513855/NutrientProfilingModel_2004_2005_TechnicalGuidance.pdf), tables for A/C points and overall-score rules.
- WHO, [Sodium reduction](https://www.who.int/news-room/fact-sheets/detail/sodium-reduction), including the stated equivalence of 2,000 mg sodium to 5 g salt.
- FSSAI, [Food Safety and Standards (Labelling and Display) Regulations, 2020 and amendments](https://www.fssai.gov.in/food-law/regulations/amendments/labelling-display). These are regulatory labelling requirements; they do not approve the Label Lore A–E mapping described here.
