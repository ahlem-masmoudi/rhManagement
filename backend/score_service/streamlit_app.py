from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import streamlit as st

# Allow running as `streamlit run streamlit_app.py` from score_service/
sys.path.insert(0, str(Path(__file__).parent / "app"))

from scoring_impl import (
    DEFAULT_SKILLS_FILE,
    benchmark_models,
    final_score,
    generate_explanation,
    make_dataframe,
    parse_job,
    parse_resume,
    save_uploaded_file,
    score_label,
)

EMBEDDING_MODEL_OPTIONS = [
    "all-MiniLM-L6-v2",
    "all-MiniLM-L12-v2",
    "all-mpnet-base-v2",
    "multi-qa-mpnet-base-dot-v1",
    "BAAI/bge-base-en-v1.5",
    "BAAI/bge-large-en-v1.5",
    "intfloat/e5-base-v2",
    "intfloat/e5-large-v2",
    "intfloat/multilingual-e5-large",
    "paraphrase-multilingual-mpnet-base-v2",
]

DEFAULT_BENCHMARK_MODELS = [
    "all-MiniLM-L6-v2",
    "all-mpnet-base-v2",
    "intfloat/multilingual-e5-large",
]

DEFAULT_PRIMARY_MODEL = "intfloat/multilingual-e5-large"


@st.cache_resource(show_spinner=False)
def get_model_cached(model_name: str):
    try:
        from sentence_transformers import SentenceTransformer
        return SentenceTransformer(model_name)
    except Exception:
        return None


def main() -> None:
    st.set_page_config(
        page_title="CV Scoring — Plateforme RH INET",
        page_icon="📄",
        layout="wide",
    )

    st.title("📄 CV Scoring — Plateforme RH INET")
    st.caption(
        "Système de scoring hybride : règles métier + similarité sémantique ML "
        "| Contexte : gestion des candidatures de stage"
    )

    with st.sidebar:
        st.header("⚙️ Paramètres")
        model_name = st.selectbox(
            "Modèle d'embeddings",
            EMBEDDING_MODEL_OPTIONS,
            index=EMBEDDING_MODEL_OPTIONS.index(DEFAULT_PRIMARY_MODEL),
            help="Utilisé si sentence-transformers est installé. Sinon fallback lexical.",
        )

        st.subheader("🧪 Benchmark modèles")
        enable_benchmark = st.checkbox(
            "Comparer plusieurs modèles",
            value=False,
            help="Exécute le scoring du même CV avec plusieurs encodeurs pour comparer les résultats.",
        )
        selected_benchmark_models = st.multiselect(
            "Modèles à comparer",
            EMBEDDING_MODEL_OPTIONS,
            default=DEFAULT_BENCHMARK_MODELS,
            disabled=not enable_benchmark,
        )

        st.subheader("Pondération des critères")
        weights_pct = {
            "skills":       st.slider("Compétences",           0, 100, 25, 5),
            "experience":   st.slider("Expérience",            0, 100, 20, 5),
            "education":    st.slider("Diplôme",               0, 100, 10, 5),
            "semantic":     st.slider("Similarité sémantique", 0, 100, 20, 5),
            "title":        st.slider("Alignement du poste",   0, 100,  5, 5),
            "bonus":        st.slider("Signaux bonus",         0, 100,  5, 5),
            "completeness": st.slider("Structure du CV",       0, 100, 15, 5),
        }
        total_pct = sum(weights_pct.values())
        st.write(f"Total : **{total_pct}%**")
        if total_pct == 0:
            st.error("Au moins un critère doit avoir un poids supérieur à 0.")
        elif total_pct != 100:
            st.info("Les poids sont normalisés automatiquement à 100% lors du calcul.")

        st.subheader("🔍 Debug")
        show_raw       = st.checkbox("Afficher le payload brut parsé", value=False)
        show_summaries = st.checkbox("Afficher les résumés générés",   value=True)

        if st.button("🔄 Réinitialiser les caches Streamlit"):
            try:
                st.cache_data.clear()
            except Exception:
                pass
            try:
                st.cache_resource.clear()
            except Exception:
                pass
            st.rerun()

    normalized_weights = {
        k: (v / total_pct if total_pct else 0.0)
        for k, v in weights_pct.items()
    }

    sample_jd = """Stage PFE — Développeur Web Full Stack
Nous recherchons un stagiaire pour rejoindre notre équipe de développement.
Compétences requises :
- Angular ou React
- Node.js / Express
- MongoDB ou SQL Server
- Git
- 0 à 1 an d'expérience (stage accepté)
Compétences souhaitées :
- Docker
- Python
- Tailwind CSS
Licence nationale ou Master en informatique de gestion, génie logiciel ou domaine similaire."""

    with st.form("cv_scoring_form"):
        cv_file = st.file_uploader(
            "📎 Importer un CV (PDF ou DOCX)",
            type=["pdf", "docx"],
            accept_multiple_files=False,
        )
        job_description = st.text_area(
            "📋 Coller la description du poste",
            value=sample_jd,
            height=220,
        )
        submitted = st.form_submit_button("🔍 Analyser le CV")

    if not submitted:
        st.info("Importez un CV et cliquez sur **Analyser le CV**.")
        st.stop()

    if not cv_file:
        st.error("Veuillez importer un fichier CV.")
        st.stop()

    if not job_description.strip():
        st.error("Veuillez coller une description de poste.")
        st.stop()

    temp_path = save_uploaded_file(cv_file)
    try:
        with st.spinner("Analyse du CV en cours..."):
            parsed_resume, raw_resume_text, parser_error = parse_resume(
                str(temp_path), str(DEFAULT_SKILLS_FILE)
            )
            parsed_job = parse_job(job_description)
            result = final_score(
                parsed=parsed_resume,
                raw_resume_text=raw_resume_text,
                raw_jd_text=job_description,
                job=parsed_job,
                model_name=model_name,
                weights=normalized_weights,
            )
            explanation = generate_explanation(result)
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass

    score = result["final_score"]
    label = score_label(score)

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Score final", f"{score}/100")
    c2.metric("Décision indicative", label)
    c3.metric(
        "Compétences requises matchées",
        f"{len(result['matches']['matched_required_skills'])}"
        f"/{len(result['job']['required_skills']) or 0}",
    )
    c4.metric(
        "Expérience",
        f"{result['candidate']['candidate_experience_years']:.1f} ans",
    )

    if parsed_resume.get("_parser_missing"):
        st.info(
            "Le parser structuré (pyresparser) n'est pas installé — le fallback texte brut est utilisé. "
            "Pour activer le parser structuré, installez : `pip install pyresparser python-docx` "
            "puis `python -m spacy download en_core_web_sm`."
        )
    elif parser_error:
        st.warning(
            f"Le parser a rencontré une erreur (fallback utilisé) : `{parser_error}`"
        )

    st.subheader("💡 Pourquoi ce score ?")
    st.write(explanation)

    col_left, col_right = st.columns([1.1, 0.9])

    with col_left:
        st.subheader("📊 Détail du score")
        df = make_dataframe(result)
        st.bar_chart(df.set_index("component"))
        st.dataframe(df, use_container_width=True, hide_index=True)

        st.subheader("🎯 Correspondance des compétences")
        skill_cols = st.columns(2)
        with skill_cols[0]:
            st.markdown("**✅ Compétences requises matchées**")
            st.write(result["matches"]["matched_required_skills"] or ["Aucune"])
            st.markdown("**❌ Compétences requises manquantes**")
            st.write(result["matches"]["missing_required_skills"] or ["Aucune"])
        with skill_cols[1]:
            st.markdown("**✅ Compétences souhaitées matchées**")
            st.write(result["matches"]["matched_preferred_skills"] or ["Aucune"])
            st.markdown("**❌ Compétences souhaitées manquantes**")
            st.write(result["matches"]["missing_preferred_skills"] or ["Aucune"])

    with col_right:
        st.subheader("👤 Profil candidat")
        st.json(result["candidate"])

        st.subheader("📋 Fiche poste")
        st.json(result["job"])

        if show_summaries:
            st.subheader("📝 Résumés générés")
            st.markdown("**Résumé CV**")
            st.write(result["summaries"]["cv_summary"])
            st.markdown("**Résumé offre**")
            st.write(result["summaries"]["job_summary"])

    if show_raw:
        st.subheader("🔧 Payload brut parsé")
        st.json(parsed_resume)

    with st.expander("🔬 Diagnostic extraction (debug)"):
        st.markdown("**Sections détectées dans le CV :**")
        for sec_label_key, detected in result["sections"].items():
            icon = "✅" if detected else "❌"
            st.write(f"{icon} {sec_label_key.replace('has_', '').replace('_section', '').capitalize()}")

        st.markdown(f"**Score structure du CV :** {result['breakdown']['completeness_score']:.0f}/100")

        st.markdown("**Compétences extraites du CV :**")
        st.write(result["candidate"]["candidate_skills"])

        st.markdown("**Expérience détectée :**")
        st.write(f"{result['candidate']['candidate_experience_years']} ans")

        st.markdown("**Aperçu texte brut extrait (début) :**")
        st.code(raw_resume_text[:600])
        st.markdown("**Aperçu texte brut extrait (fin) :**")
        st.code(raw_resume_text[-600:])

    if enable_benchmark:
        st.subheader("🧪 Benchmark multi-modèles")
        if not selected_benchmark_models:
            st.info("Sélectionnez au moins un modèle dans la barre latérale.")
        else:
            with st.spinner("Comparaison des modèles en cours..."):
                benchmark_df, lexical_models = benchmark_models(
                    parsed_resume=parsed_resume,
                    raw_resume_text=raw_resume_text,
                    raw_jd_text=job_description,
                    parsed_job=parsed_job,
                    weights=normalized_weights,
                    model_names=selected_benchmark_models,
                )

            best_row = benchmark_df.iloc[0]
            st.success(
                f"Meilleur modèle (sur ce CV): {best_row['model']} | "
                f"score final {best_row['final_score']}/100"
            )
            st.dataframe(benchmark_df, use_container_width=True, hide_index=True)
            st.bar_chart(benchmark_df.set_index("model")[["final_score", "semantic_score"]])

            if lexical_models:
                st.warning(
                    "Certains modèles ont utilisé le fallback lexical (sentence-transformers absent "
                    "ou modèle non chargeable): " + ", ".join(sorted(set(lexical_models)))
                )

            st.download_button(
                "Télécharger benchmark (CSV)",
                data=benchmark_df.to_csv(index=False),
                file_name="benchmark_models.csv",
                mime="text/csv",
            )

    st.subheader("📥 Exporter le résultat")
    st.download_button(
        "Télécharger le résultat JSON",
        data=json.dumps(result, indent=2, ensure_ascii=False),
        file_name="scoring_result.json",
        mime="application/json",
    )

    with st.expander("ℹ️ Comment fonctionne ce système ?"):
        st.markdown(
            """
            1. Le CV est importé et analysé par un **parser structuré** (pyresparser).
            2. Un **fallback texte brut** (PyMuPDF / docx2txt) enrichit les données manquantes.
            3. La description du poste est analysée pour extraire : titre, compétences requises/souhaitées, expérience, diplôme.
            4. Un **score hybride** est calculé à partir de :
               - Règles métier (compétences, diplôme, expérience, structure du CV)
               - **Similarité sémantique ML** (sentence-transformers ou fallback lexical)
            5. Le résultat est **explicable** : compétences matchées/manquantes, fit expérience, fit diplôme.
            6. Le score est **indicatif** : la décision finale reste entre les mains du responsable RH.
            """
        )


if __name__ == "__main__":
    main()
