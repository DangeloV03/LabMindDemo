# LabMind AI: The Researcher's Digital Partner

LabMind Integrates advanced AI natively into your experimental workflow, automating the tedious data crunching so you can focus on the physics.

## Core Capabilities (Tier-1 Tools)

### 1. Smart Data Ingestion (`ingest_dataset`)
**The Problem:** Raw data comes in messy formats (CSV, JSON, Arrays) with unknown units and inconsistent sampling.
**LabMind's Solution:**
-   **Auto-Schema Inference:** Instantly detects if data is time-series, spectroscopy, or multi-trial.
-   **Unit Recognition:** Infers physical units (Volts, Hz, dBm) from context.
-   **Consistency Checks:** Flags missing data points or uneven sampling rates before you waste time analyzing bad data.

### 2. Automated Model Discovery (`suggest_and_fit_models`)
**The Problem:** Manually guessing if your data follows an exponential decay or a power law is slow and prone to bias.
**LabMind's Solution:**
-   **Mathematically Rigorous Fitting:** Runs actual regression algorithms (Linear, Exponential, Power Law, Polynomial).
-   **Goodness-of-Fit:** Returns $R^2$ scores and parameters immediately.
-   **Physical Context:** Claude evaluates *why* a model fits (e.g., "The Power Law fit suggests scale-free dynamics").

### 3. Noise Attribution & Diagnostics (`analyze_noise_sources`)
**The Problem:** "My data looks noisy" is vague. Is it thermal drift? 60Hz hum? Readout error?
**LabMind's Solution:**
-   **Signal-to-Noise Ratio (SNR):** Quantifies data quality.
-   **Drift Detection:** Identifies linear trends indicative of thermal/mechanical instability.
-   **Source Attribution:** Distinguishes between White Noise (random) and Pink/Red Noise (drift/history-dependent) to suggest physical fixes (e.g., "Tighten cables" vs "Wait for temperature stabilization").

### 4. Domain-Aware Visualization (`build_domain_visualizations`)
**The Problem:** Generic plots don't show the physics.
**LabMind's Solution:**
-   **Context-Specific Configs:** Auto-selects Log-Log plots for power laws, IQ plots for quantum signals, or Bode plots for frequency response.

---

## Advanced Agentic Features

### Polyglot Scripting (`generate_and_run_script`)
Need to run a specific simulation? LabMind can **write and execute code** in your language of choice:
-   **Python:** For general data science (Scipy/NumPy).
-   **Julia:** For high-performance differential equations.
-   **R:** For statistical rigour.
*(Note: Requires runtime installation on the server for execution, otherwise returns raw code).*

### Agentic Discovery (`function_finding`)
Describe your data's shape or behavior, and the AI will search its knowledge base to recommend the appropriate mathematical kernels or physical laws that govern it.

---

## Getting Started
Navigate to the **Analyze** tab, paste your raw data, and select a specialized tool to see LabMind in action.
