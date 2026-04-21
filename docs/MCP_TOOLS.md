# MCP Tool Catalog

Every tool is a function call. Each tool has a JSON Schema input, a deterministic output schema, a content-addressed cache, and a contract test.

## Literature & knowledge

### `pubmed_search`
- input: `{query: str, years: [int, int], max_results: int}`
- output: `[{pmid, title, abstract, year, doi, mesh_terms}]`

### `biorxiv_scan`
- input: `{keywords: [str], days_back: int}`
- output: `[{biorxiv_id, title, abstract, posted, doi}]`

### `semantic_scholar_graph`
- input: `{paper_id: str, depth: int}`
- output: `{citations: [...], references: [...]}`

### `uniprot_lookup`
- input: `{uniprot_id: str}`
- output: `{sequence, function, domains, PTMs, related_pdbs}`

### `pdb_fetch`
- input: `{pdb_id: str}`
- output: `{pdb_text, resolution, method, chains, ligands}`

### `alphafold_db_fetch`
- input: `{uniprot_id: str}`
- output: `{pdb_text, plddt_per_residue}`

### `clinvar_mutations`
- input: `{gene_symbol: str}`
- output: `[{position, ref, alt, clinical_significance, disease}]`

## Structure & design

### `rfdiffusion`
- input: `{target_pdb: str, hotspots: [str], length_range: [int, int], symmetry: str|null, num_designs: int}`
- output: `[{backbone_pdb, seed}]`

### `proteinmpnn`
- input: `{backbone_pdb: str, num_sequences: int, fixed_positions: [int], temperature: float}`
- output: `[{sequence, score}]`

### `boltz2`
- input: `{target_pdb: str, candidate_sequence: str}`
- output: `{complex_pdb, delta_g_kcal_mol, iptm, ptm, ipae}`

### `chai1`
- input: `{sequences: [str], ligands: [smiles]}`
- output: `{complex_pdb, confidence_per_component}`

### `autodock_vina`
- input: `{receptor_pdb: str, ligand_smiles: str, box: {x,y,z,size}}`
- output: `{pose_pdb, score_kcal_mol}`

### `openmm_md`
- input: `{structure_pdb: str, nanoseconds: float, forcefield: str}`
- output: `{trajectory_xtc_ref, rmsd_series, rmsf_per_residue}`

## Chemistry

### `chemcrow_call`
- input: `{query: str}`
- output: `{answer, tool_trace}`  *(delegates to upstream ChemCrow service)*

### `rdkit_analyze`
- input: `{smiles: str}`
- output: `{qed, logp, tpsa, mw, sa_score, lipinski_violations}`

### `admet_predict`
- input: `{smiles: str}`
- output: `{herg_prob, bbb, hia, cyp_inhibition: {cyp1a2, cyp3a4, ...}}`

## Genomics

### `evo2_generate`
- input: `{prompt_dna: str, target_length: int, temperature: float}`
- output: `{generated_dna, per_base_logprobs}`

### `evo2_score`
- input: `{dna: str}`
- output: `{mean_logprob, pathogenicity_score}`

## Materials (optional extension)

### `mattergen`
- input: `{target_properties: {...}}`
- output: `[{crystal_cif, predicted_properties}]`

### `dft_simulate`
- input: `{crystal_cif: str, property: str}`
- output: `{value, uncertainty}`

## Safety

### `biosecurity_screen` *(mandatory before synthesis)*
- input: `{sequence_or_smiles: str, synthesis_target: "dna"|"protein"|"small_molecule"}`
- output: `{decision: "pass"|"flagged", risk_reasons: [str], audit_id: str}`

A `flagged` output blocks downstream wet-lab submission. Every call is logged with an immutable audit id.

## Caching

Inputs are hashed with BLAKE3. Identical inputs never trigger a recomputation. The cache lives under `data/cache/<hash>.json` and is safe to commit to a release artefact for reproducibility but should not be committed to source control.

## Determinism

Every tool accepts an optional `seed` argument and propagates it into any stochastic step. The cache key includes the seed. A round that specifies a seed can be replayed bit-for-bit.
