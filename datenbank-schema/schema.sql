-- mexXsoft X2: aus der Advantage-Demo-Datenbank extrahiertes Schema
-- Zieldialekt: PostgreSQL (Typzuordnung siehe SCHEMA.md)

CREATE TABLE "adresse" (
    "id_adresse" varchar(32),
    "id_parent" varchar(32),
    "id_adr_kategorie" varchar(32),
    "id_adr_benutzer" varchar(32),
    "id_verantwortlicher" varchar(32),
    "typ" smallint,
    "tel_assistent" varchar(33),
    "tel_geschaeftlich" varchar(33),
    "tel_geschaeftlich2" varchar(33),
    "tel_faxgeschaeftlich" varchar(33),
    "tel_rueckmeldung" varchar(33),
    "tel_auto" varchar(33),
    "tel_firma1" varchar(33),
    "tel_privat" varchar(33),
    "tel_privat2" varchar(33),
    "tel_faxprivat" varchar(33),
    "tel_isdn" varchar(33),
    "tel_mobiltelefon" varchar(33),
    "tel_weitere" varchar(33),
    "tel_weiteresfax" varchar(33),
    "tel_pager" varchar(33),
    "tel_haupttelefon" varchar(33),
    "tel_funkruf" varchar(33),
    "tel_telex" varchar(33),
    "tel_texttelefon" varchar(33),
    "tel_telefonindex1" smallint,
    "tel_telefonindex2" smallint,
    "tel_telefonindex3" smallint,
    "tel_telefonindex4" smallint,
    "tel_emailindex" smallint,
    "tel_internet" varchar(100),
    "tel_email1" varchar(120),
    "tel_email2" varchar(120),
    "tel_email3" varchar(120),
    "an_postanschrift" text,
    "an_strasse_geschaeftlich" text,
    "an_strasse_postfach" text,
    "an_strasse_privat" text,
    "an_strasse_weitere" text,
    "an_plz_geschaeftlich" varchar(50),
    "an_plz_postfach" varchar(50),
    "an_plz_privat" varchar(50),
    "an_plz_weitere" varchar(50),
    "an_ort_geschaeftlich" varchar(50),
    "an_ort_postfach" varchar(50),
    "an_ort_privat" varchar(50),
    "an_ort_weitere" varchar(50),
    "an_region_geschaeftlich" varchar(50),
    "an_region_postfach" varchar(50),
    "an_region_privat" varchar(50),
    "an_region_weitere" varchar(50),
    "an_land_geschaeftlich" varchar(50),
    "an_land_postfach" varchar(50),
    "an_land_privat" varchar(50),
    "an_land_weitere" varchar(50),
    "an_strasse_postanschrift" text,
    "an_plz_postanschrift" varchar(50),
    "an_ort_postanschrift" varchar(50),
    "an_region_postanschrift" varchar(50),
    "an_land_postanschrift" varchar(50),
    "latitude" double precision,
    "longitude" double precision,
    "an_anschrift_index" smallint,
    "ad_anzeigename" varchar(100),
    "ad_anrede" varchar(50),
    "ad_titel" varchar(50),
    "ad_nachname" varchar(50),
    "ad_vorname" varchar(50),
    "ad_name" varchar(100),
    "ad_firma" varchar(50),
    "ad_zusatz1" varchar(50),
    "ad_zusatz2" varchar(50),
    "ad_briefanrede" varchar(100),
    "bemerkung" bytea,
    "kategorie" text,
    "kategorie1" text,
    "angebot_kopf" bytea,
    "angebot_fuss" bytea,
    "auftrag_kopf" bytea,
    "auftrag_fuss" bytea,
    "rechnung_kopf" bytea,
    "rechnung_fuss" bytea,
    "steuer_nummer" varchar(20),
    "steuer_ident" varchar(20),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "mandant" integer,
    "readonly" boolean,
    "geloescht_user" varchar(20),
    "geloescht_am" timestamp,
    "papierkorb" boolean,
    "flag_kunde" boolean,
    "flag_lieferant" boolean,
    "flag_mitarbeiter" boolean,
    "flag_privat_alt" boolean,
    "flag_privat" boolean,
    "flag_firma" boolean,
    "pc_flag" smallint,
    "flags" integer
);

CREATE TABLE "adresse_gruppe" (
    "id_adresse_gruppe" varchar(32),
    "id_parent" varchar(32),
    "id_adr_benutzer" varchar(32),
    "bezeichnung" varchar(50),
    "pc_flag" integer,
    "image_index" integer,
    "dialog_typ" smallint,
    "not_lizenz" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "adresse_tree" (
    "id_adresse_tree" varchar(32),
    "id_adresse" varchar(32),
    "id_adresse_gruppe" varchar(32)
);

CREATE TABLE "adr_ausweis" (
    "id_adr_ausweis" varchar(32),
    "id_adresse" varchar(32),
    "geb_datum" timestamp,
    "geb_name" varchar(50),
    "geb_ort" varchar(50),
    "sv_nummer" varchar(40),
    "ausweis_nr1" varchar(50),
    "ausweis_am1" timestamp,
    "ausweis_in1" varchar(50),
    "ausweis_gueltig1" timestamp,
    "ausweis_art1" varchar(50),
    "ausweis_nr2" varchar(50),
    "ausweis_am2" timestamp,
    "ausweis_in2" varchar(50),
    "ausweis_gueltig2" timestamp,
    "ausweis_art2" varchar(50),
    "bemerkung" bytea,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "adr_ausweis_bilder" (
    "id_adr_ausweis_bilder" varchar(32),
    "id_adr_ausweis" varchar(32),
    "pfad" varchar(254),
    "name" varchar(50),
    "typ" smallint,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "adr_bank" (
    "id_adr_bank" varchar(32),
    "id_adresse" varchar(32),
    "hauptkonto" boolean,
    "beschreibung" varchar(50),
    "blz" varchar(8),
    "bic" varchar(11),
    "bank" varchar(50),
    "konto" varchar(20),
    "iban" varchar(35),
    "zahlungsart" varchar(20),
    "einzug" boolean,
    "einzug_dt" timestamp,
    "einzug_durch" varchar(20),
    "flag_lieferant" boolean,
    "flag_kunde" boolean,
    "flag_mitarbeiter" boolean,
    "flag_firma" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

-- Tabelle "adr_benutzer" ist verschlüsselt (30 Felder) — Struktur nicht lesbar

CREATE TABLE "adr_benutzer_rechte" (
    "id_adr_benutzer_rechte" varchar(32),
    "id_adr_benutzer" varchar(32),
    "id_rechte_gruppe" varchar(32),
    "id_adresse_benutzer" varchar(10),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "adr_kategorie" (
    "id_bezeichnung" varchar(33)
);

CREATE TABLE "adr_kategorie_1" (
    "id_adr_kategorie_1" varchar(32),
    "id_adresse" varchar(32),
    "id_kategorie_name" varchar(32),
    "wert" text,
    "sortieren" integer,
    "create_dt" timestamp,
    "createuser" varchar(20),
    "modify_dt" timestamp,
    "modifyuser" varchar(20)
);

CREATE TABLE "adr_kategorie_zuordnung" (
    "id_bezeichnung" varchar(33),
    "id_adresse" varchar(10),
    "visible" boolean,
    "id_kategorie_bezeichnuing" varchar(33)
);

CREATE TABLE "adr_kunde" (
    "id_adr_kunde" varchar(32),
    "id_adresse" varchar(32),
    "id_zako" varchar(32),
    "typ" smallint,
    "paragraph13b" boolean,
    "debitorennummer" varchar(20),
    "ust_idnr" varchar(50),
    "leitweg_id" varchar(50),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "adr_lieferant" (
    "id_adr_lieferant" varchar(32),
    "id_adresse" varchar(32),
    "nummer" varchar(20),
    "kundennummer" varchar(20),
    "bdb_mitgliedsnummer" integer,
    "umsatzsteuer_id" varchar(20),
    "blz" varchar(8),
    "bank" varchar(50),
    "konto" varchar(10),
    "zahlungsart" varchar(20),
    "einzug" boolean,
    "einzug_dt" timestamp,
    "einzug_durch" varchar(20),
    "zahlungsziel" integer,
    "skonto1_tage" integer,
    "skonto1_prozent" double precision,
    "skonto2_tage" integer,
    "skonto2_prozent" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "adr_location" (
    "id_adr_location" varchar(32),
    "id_adresse" varchar(32),
    "latitude" double precision,
    "longitude" double precision,
    "datum" timestamp,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "adr_mitarbeiter" (
    "id_adr_mitarbeiter" varchar(32),
    "id_adr_mitarbeiter_gruppe" varchar(32),
    "id_adresse" varchar(32),
    "id_abteilung" varchar(32),
    "id_lohngruppe" varchar(32),
    "kalkmitarbeiter" boolean,
    "bezeichnung" varchar(50),
    "personalnummer" varchar(20),
    "status" varchar(10),
    "matchcode" varchar(20),
    "schulabschluss" varchar(50),
    "steuerklasse" integer,
    "taetigkeit" varchar(50),
    "krankenkasse" varchar(50),
    "eintritt_dt" timestamp,
    "austritt_dt" timestamp,
    "befristet" boolean,
    "befristet_dt" timestamp,
    "lohngruppe" varchar(10),
    "gehalt" double precision,
    "az_stunden" double precision,
    "az_stunden_mo" double precision,
    "az_stunden_di" double precision,
    "az_stunden_mi" double precision,
    "az_stunden_do" double precision,
    "az_stunden_fr" double precision,
    "az_stunden_sa" double precision,
    "az_stunden_so" double precision,
    "lohntarif_prozent" double precision,
    "lohnnebenkosten_proz" double precision,
    "lohnbewertung" varchar(30),
    "stundenlohn" double precision,
    "stundensatz_taglohn" double precision,
    "stunden_mittellohn" double precision,
    "minuten_mittellohn" double precision,
    "urlaub_gesamt_tag" double precision,
    "urlaub_zusatz_tag" double precision,
    "urlaub_genommen_tag" double precision,
    "urlaub_vorjahr_gesamt_tag" double precision,
    "saldo_vj_stunden" double precision,
    "geburtstag_dt" timestamp,
    "bemerkung" text,
    "mittellohn_durchschnitt" double precision,
    "mittellohn_minimum" double precision,
    "mittellohn_maximum" double precision,
    "taglohn_durchschnitt" double precision,
    "taglohn_minimum" double precision,
    "taglohn_maximum" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "papierkorb" boolean
);

CREATE TABLE "adr_mitarbeiter_kosten" (
    "id_adr_mitarbeiter_kosten" varchar(32),
    "id_adresse" varchar(32),
    "datum" date,
    "art" varchar(20),
    "beschreibung" bytea,
    "kosten" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "adr_mobil" (
    "id_adr_mobil" varchar(32),
    "id_adresse" varchar(32),
    "mobil_key" varchar(9),
    "mobil_name" varchar(128),
    "mobil_pw" varchar(128),
    "mobil_deviceid" varchar(60),
    "mobil_status" integer,
    "messages" bytea,
    "flag_1" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "server_ip" varchar(50),
    "intervall" integer
);

CREATE TABLE "adr_mobildata" (
    "id_adr_mobildata" varchar(32),
    "mobil_key" varchar(9),
    "tablename" varchar(50),
    "id" varchar(32),
    "flags" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "adr_outlook" (
    "id_adr_outlook" varchar(32),
    "id_adr_benutzer" varchar(32),
    "id_adresse" varchar(32),
    "id_outlook" varchar(150),
    "modify_dt" timestamp
);

CREATE TABLE "adr_pool" (
    "id_adr_pool" varchar(32),
    "id_parent" varchar(32),
    "flag" varchar(1),
    "id_adresse" varchar(32),
    "id_asp" varchar(32),
    "id_projekte" varchar(32),
    "druck_flag" boolean,
    "ansprechpartner" varchar(50),
    "email" varchar(80),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "gedruckt" boolean
);

CREATE TABLE "arbeitsbereich" (
    "id_arbeitsbereich" varchar(32),
    "id_arbeitsbereich_select" integer,
    "bezeichnung" varchar(50),
    "nummer" varchar(10),
    "bemerkung" bytea,
    "mittellohn_minute" double precision,
    "lohnzusatzkosten_prozent" double precision,
    "lohnnebenkosten_prozent" double precision,
    "lohn_minute" double precision,
    "zu_material_z" double precision,
    "schwierigkeitsgrad_lohn" double precision,
    "s_grad_l_aktiv" boolean,
    "schwierigkeitsgrad_geraet" double precision,
    "s_grad_g_aktiv" boolean,
    "zu_lohngeraet_z" double precision,
    "zu_lohnsonstiges_z" double precision,
    "zu_geraet_z" double precision,
    "zu_fremd_z" double precision,
    "zu_pflanze_z" double precision,
    "zu_entsorgung_z" double precision,
    "zu_sonstiges_z" double precision,
    "zu_lohn_agk" double precision,
    "zu_geraet_agk" double precision,
    "zu_material_agk" double precision,
    "zu_pflanze_agk" double precision,
    "zu_fremd_agk" double precision,
    "zu_sonstiges_agk" double precision,
    "zu_lohn_gew" double precision,
    "zu_geraet_gew" double precision,
    "zu_material_gew" double precision,
    "zu_pflanze_gew" double precision,
    "zu_fremd_gew" double precision,
    "zu_sonstiges_gew" double precision,
    "zu_lohn_wab" double precision,
    "zu_geraet_wab" double precision,
    "zu_material_wab" double precision,
    "zu_pflanze_wab" double precision,
    "zu_fremd_wab" double precision,
    "zu_sonstiges_wab" double precision,
    "zu_lohn_wal" double precision,
    "zu_geraet_wal" double precision,
    "zu_material_wal" double precision,
    "zu_pflanze_wal" double precision,
    "zu_fremd_wal" double precision,
    "zu_sonstiges_wal" double precision,
    "zu_lohn_wug" double precision,
    "zu_geraet_wug" double precision,
    "zu_ggewinn_z" double precision,
    "zu_bwgewinn_z" double precision,
    "zu_lwgewinn_z" double precision,
    "zu_material_wug" double precision,
    "zu_pflanze_wug" double precision,
    "zu_fremd_wug" double precision,
    "zu_sonstiges_wug" double precision,
    "zu_gemeinkosten_z" double precision,
    "zu_gewinn_z" double precision,
    "letzte_aenderung_z" timestamp,
    "zu_material_d" double precision,
    "zu_lohn_d" double precision,
    "zu_geraet_d" double precision,
    "zu_fremd_d" double precision,
    "zu_pflanze_d" double precision,
    "zu_entsorgung_d" double precision,
    "zu_sonstiges_d" double precision,
    "zu_gkgeraete_d" double precision,
    "zu_restgk_d" double precision,
    "zu_fixkosten_d" double precision,
    "letzte_aenderung_d" timestamp,
    "mandant" integer,
    "papierkorb" boolean,
    "readonly" boolean,
    "geloescht_am" timestamp,
    "geloescht_user" varchar(20),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

-- Tabelle "archiv" ist verschlüsselt (11 Felder) — Struktur nicht lesbar

CREATE TABLE "az_konto" (
    "id_az_konto" varchar(32),
    "id_adresse" varchar(32),
    "id_adr_mitarbeiter" varchar(32),
    "id_lohnart" varchar(32),
    "id_projekte" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "bezeichnung" varchar(50),
    "beginn" timestamp,
    "ende" timestamp,
    "anzahl_tage" double precision,
    "ganztaegig" integer,
    "options" integer,
    "taskindex" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "signature" bytea,
    "flags" integer
);

CREATE TABLE "baunebenkosten" (
    "id_baunebenkosten" varchar(32),
    "bezeichnung" varchar(50),
    "brutto" boolean,
    "readonly" boolean
);

CREATE TABLE "baustein" (
    "id_baustein" varchar(32),
    "id_parent" varchar(32),
    "item_index" integer,
    "bezeichnung" varchar(50),
    "sortieren" integer
);

CREATE TABLE "baustein_blob" (
    "id_baustein_blob" varchar(32),
    "id_baustein" varchar(32),
    "dateityp" integer,
    "daten" bytea
);

CREATE TABLE "baustellenkonto" (
    "id_baustellenkonto" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_projekt_adresse" varchar(32),
    "id_rechnungs_typ" boolean,
    "id_adr_bank" varchar(32),
    "belegnummer" varchar(50),
    "belegdatum" timestamp,
    "rechnungsbetrag" double precision,
    "eingangsdatum" varchar(50),
    "papierkorb" boolean,
    "geloescht_user" varchar(20),
    "geloescht_am" timestamp,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "bild_mobil" (
    "id_bild_mobil" varchar(32),
    "id_projekte" varchar(32),
    "bezeichnung" varchar(100),
    "data" bytea,
    "preview" bytea,
    "create_dt" timestamp
);

CREATE TABLE "brief" (
    "id_brief" varchar(32),
    "id_adr_benutzer" varchar(32),
    "id_projekte" varchar(32),
    "serienbrief" boolean,
    "gruppe" varchar(50),
    "typ" varchar(50),
    "bezeichnung" varchar(50),
    "brief" bytea,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "papierkorb" boolean,
    "readonly" boolean,
    "geloescht_am" timestamp,
    "geloescht_user" varchar(20),
    "betreff" text,
    "kopftext" text,
    "fusstext" text,
    "nummer" varchar(50),
    "datum" date,
    "flags" integer
);

CREATE TABLE "brief_gruppe" (
    "id_brief_gruppe" varchar(32),
    "id_parent" varchar(32),
    "id_adr_benutzer" varchar(32),
    "bezeichnung" varchar(50),
    "pc_flag" integer,
    "image_index" integer,
    "dialog_typ" smallint,
    "not_lizenz" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "brief_tree" (
    "id_brief_tree" varchar(32),
    "id_brief" varchar(32),
    "id_brief_gruppe" varchar(32)
);

CREATE TABLE "dokument" (
    "id_dokument" varchar(32),
    "id_dokument_typ" varchar(32),
    "id_dokument_art" varchar(32),
    "id_dokument_kategorie" varchar(50),
    "id_adr_benutzer" varchar(32),
    "id_adresse" varchar(32),
    "id_projekte" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_brief" varchar(32),
    "id_kalender" varchar(32),
    "id_geraet" varchar(32),
    "id_eingangsrechnung" varchar(32),
    "id_kb_eintrag" varchar(32),
    "id_email" varchar(32),
    "id_adresse_vorlage" varchar(32),
    "ansprechpartner" varchar(50),
    "verzeichnis_relativ" varchar(255),
    "id_asp" varchar(32),
    "datum_vorlage" timestamp,
    "beschreibung" bytea,
    "bezeichnung" varchar(100),
    "dateiname" varchar(250),
    "datei_datum" timestamp,
    "original_dateiname" varchar(250),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "geloescht_user" varchar(20),
    "geloescht_am" timestamp,
    "papierkorb" boolean,
    "flags" integer
);

CREATE TABLE "dokument_art" (
    "id_dokument_art" varchar(32),
    "kennung" varchar(10),
    "bezeichnung" varchar(50)
);

CREATE TABLE "dokument_gruppe" (
    "id_dokument_gruppe" varchar(32),
    "id_parent" varchar(32),
    "id_adr_benutzer" varchar(32),
    "bezeichnung" varchar(50),
    "pc_flag" integer,
    "image_index" integer,
    "dialog_typ" smallint,
    "not_lizenz" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "dokument_kalender" (
    "id_dokument_kalender" varchar(32),
    "id_dokument" varchar(32),
    "id_kalender" varchar(32),
    "id_kalender_resource" varchar(32)
);

-- Tabelle "dokument_text" ist verschlüsselt (3 Felder) — Struktur nicht lesbar

CREATE TABLE "dokument_tree" (
    "id_dokument_tree" varchar(32),
    "id_dokument" varchar(32),
    "id_dokument_gruppe" varchar(32)
);

CREATE TABLE "dokument_typ" (
    "id_dokument_typ" varchar(32),
    "bezeichnung" varchar(50),
    "index_typ" smallint
);

CREATE TABLE "druck_brief" (
    "id_druck_brief" varchar(32),
    "id_brief" varchar(32),
    "id_adresse" varchar(32),
    "id_asp" varchar(32),
    "id_formular" varchar(32),
    "id_language_intern" varchar(32),
    "adressliste" text,
    "betreff" bytea,
    "kopftext" bytea,
    "formular_bezeichnung" varchar(32),
    "fusstext" bytea,
    "nummer" varchar(50),
    "belegdatum" date,
    "benutzer_bedienerzeichen" varchar(50),
    "benutzer_ihrzeichen" varchar(50),
    "benutzer_sachbearbeiter" varchar(50),
    "benutzer_durchwahl" varchar(50),
    "benutzer_email" varchar(50),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "drucker_0" varchar(254),
    "schacht1_0" varchar(50),
    "schacht2_0" varchar(50),
    "kopie_0" integer,
    "drucker_1" varchar(254),
    "schacht1_1" varchar(50),
    "schacht2_1" varchar(50),
    "kopie_1" integer,
    "drucker_2" varchar(254),
    "schacht1_2" varchar(50),
    "schacht2_2" varchar(50),
    "kopie_2" integer,
    "drucker_3" varchar(254),
    "schacht1_3" varchar(50),
    "schacht2_3" varchar(50),
    "kopie_3" integer,
    "einstellungen" varchar(50),
    "ansprechpartner" varchar(50)
);

CREATE TABLE "druck_info" (
    "id_druck_info" varchar(32),
    "id_formular" varchar(32),
    "id_adresse1" varchar(32),
    "id_adresse2" varchar(32),
    "id_asp" varchar(32),
    "id_zuordnung" varchar(32),
    "id_language_intern" varchar(32),
    "formular_bezeichnung" varchar(50),
    "adressliste" text,
    "filter_" varchar(50),
    "einstellung" varchar(50),
    "ansprechpartner" varchar(50),
    "betreff" bytea,
    "kopftext" bytea,
    "fusstext" bytea,
    "belegnummer" varchar(50),
    "belegdatum" date,
    "benutzer_bedienerzeichen" varchar(50),
    "benutzer_ihrzeichen" varchar(50),
    "benutzer_sachbearbeiter" varchar(50),
    "benutzer_durchwahl" varchar(50),
    "benutzer_email" varchar(50),
    "drucker_0" varchar(254),
    "schacht1_0" varchar(50),
    "schacht2_0" varchar(50),
    "kopie_0" integer,
    "drucker_1" varchar(254),
    "schacht1_1" varchar(50),
    "schacht2_1" varchar(50),
    "kopie_1" integer,
    "drucker_2" varchar(254),
    "schacht1_2" varchar(50),
    "schacht2_2" varchar(50),
    "kopie_2" integer,
    "drucker_3" varchar(254),
    "schacht1_3" varchar(50),
    "schacht2_3" varchar(50),
    "kopie_3" integer
);

CREATE TABLE "druck_lv" (
    "id_druck_lv" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_formular" varchar(32),
    "id_lv_status" varchar(32),
    "id_projekte_adresse" varchar(32),
    "id_formular_typ" varchar(32),
    "formularbezeichnung" varchar(50),
    "belegdatum" date,
    "mandant" integer,
    "nummer" varchar(50),
    "nrabschlag" varchar(50),
    "gewaehrleistung" bytea,
    "von" date,
    "bis" date,
    "kopftext" bytea,
    "fusstext" bytea,
    "drucker_0" varchar(254),
    "schacht1_0" varchar(50),
    "schacht2_0" varchar(50),
    "kopie_0" integer,
    "drucker_1" varchar(254),
    "schacht1_1" varchar(50),
    "schacht2_1" varchar(50),
    "kopie_1" integer,
    "drucker_2" varchar(254),
    "schacht1_2" varchar(50),
    "schacht2_2" varchar(50),
    "kopie_2" integer,
    "drucker_3" varchar(254),
    "schacht1_3" varchar(50),
    "schacht2_3" varchar(50),
    "kopie_3" integer,
    "einstellungen" varchar(50),
    "mengeaus" varchar(50),
    "betrag_netto_psch" double precision,
    "einbehalt_prozent" double precision,
    "einbehalt_typ" integer,
    "einbehalt_betrag" double precision,
    "einbehalt_is_brutto" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "druck_massen" (
    "id_druck_massen" varchar(10),
    "id_projekte_lvlist" varchar(10),
    "id_formular_typ" varchar(10),
    "id_formular" varchar(10),
    "formularbezeichnung" varchar(50),
    "nummer" varchar(50),
    "betreff" bytea,
    "kopftext" bytea,
    "fusstext" bytea,
    "belegdatum" timestamp,
    "druckenadresse1" varchar(50),
    "druckenadresse2" varchar(50),
    "mandant" integer,
    "benutzer_bedienerzeichen" varchar(50),
    "benutzer_sachbearbeiter" varchar(50),
    "benutzer_durchwahl" varchar(20),
    "benutzer_ihrzeichen" varchar(50),
    "drucker_0" varchar(254),
    "schacht1_0" varchar(50),
    "schacht2_0" varchar(50),
    "kopie_0" integer,
    "drucker_1" varchar(254),
    "schacht1_1" varchar(50),
    "schacht2_1" varchar(50),
    "kopie_1" integer,
    "drucker_2" varchar(254),
    "schacht1_2" varchar(50),
    "schacht2_2" varchar(50),
    "kopie_2" integer,
    "drucker_3" varchar(254),
    "schacht1_3" varchar(50),
    "schacht2_3" varchar(50),
    "kopie_3" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "einstellungen" varchar(50),
    "nrabschlag" varchar(50),
    "mengeaus" varchar(50),
    "zahlungskonditionen" varchar(50)
);

CREATE TABLE "druck_projekte_lvlist" (
    "id_druck_projekte_lvlist" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_debitor" varchar(32),
    "id_language_intern" varchar(32),
    "id_formular_typ" varchar(10),
    "id_formular" varchar(10),
    "formularbezeichnung" varchar(50),
    "id_asp" varchar(32),
    "betreff" bytea,
    "druckenadresse1" varchar(50),
    "ansprechpartner" varchar(50),
    "druckenadresse2" varchar(50),
    "mandant" integer,
    "benutzer_bedienerzeichen" varchar(50),
    "benutzer_sachbearbeiter" varchar(50),
    "benutzer_durchwahl" varchar(20),
    "benutzer_ihrzeichen" varchar(50),
    "benutzer_email" varchar(50),
    "einstellungen" varchar(50),
    "zahlungskonditionen" varchar(50),
    "nachkommastellen_menge" integer,
    "nachkommastellen_preis" integer,
    "waehrung_symbol" varchar(10),
    "waehrung_faktor" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "druck_protokoll" (
    "id_druck_protokoll" varchar(32),
    "id_adresse" varchar(32),
    "dokument_typ" varchar(20),
    "id_dokument" varchar(32),
    "kopie" bytea,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "nummer" varchar(20),
    "mandant" integer,
    "typ" integer
);

CREATE TABLE "druck_style" (
    "id_druck_style" varchar(32),
    "id_formular" varchar(32),
    "is_standard" boolean,
    "bezeichnung" varchar(50),
    "styles" bytea,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "eingangsrechnung_re" (
    "id_eingangsrechnung_re" varchar(32),
    "id_adresse" varchar(32),
    "id_projekte" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_fibu_buchungschluessel" integer,
    "geprueft" boolean,
    "rechnungstyp" integer,
    "fibu_konto_nummer" varchar(20),
    "ke" varchar(1),
    "konto_soll" varchar(1),
    "fibu_gegenkonto_nummer" varchar(20),
    "fibu_kostenstelle_nummer" varchar(20),
    "nummer" varchar(20),
    "nummer_intern" varchar(20),
    "kurzbez" varchar(20),
    "bezeichnung" varchar(100),
    "eingangsdatum" date,
    "faelligkeitsdatum" date,
    "rechnungsdatum" date,
    "skonto1_datum" date,
    "skonto1_prozent" double precision,
    "skonto2_datum" date,
    "skonto2_prozent" double precision,
    "mwst1_prozent" double precision,
    "mwst2_prozent" double precision,
    "betrag1_netto" double precision,
    "betrag2_netto" double precision,
    "betrag1_brutto" double precision,
    "betrag2_brutto" double precision,
    "zahlbetrag_brutto" double precision,
    "abzug_prozent" double precision,
    "abzug" double precision,
    "abzug_bemerkung" text,
    "betrag_ohne_skonto" double precision,
    "freigabedatum" date,
    "id_adresse_freigabe" varchar(32),
    "paragraph_13b" boolean,
    "id_adr_bank" varchar(32),
    "bank" varchar(50),
    "blz" varchar(8),
    "bic" varchar(11),
    "konto" varchar(20),
    "iban" varchar(35),
    "bemerkung" bytea,
    "datev_dt" timestamp,
    "papierkorb" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "skonto1" double precision,
    "skonto2" double precision,
    "flags" integer
);

CREATE TABLE "eingangsrechnung_za" (
    "id_eingangsrechnung_za" varchar(32),
    "id_eingangsrechnung_re" varchar(32),
    "id_adr_bank" varchar(32),
    "id_adr_bank_liefer" varchar(32),
    "datum" timestamp,
    "nummer" varchar(20),
    "betrag" double precision,
    "skonto" double precision,
    "blz" varchar(8),
    "bic" varchar(11),
    "konto" varchar(50),
    "iban" varchar(35),
    "typ" integer,
    "bemerkung" bytea,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "flags" integer
);

CREATE TABLE "einheit_base" (
    "id_einheit" varchar(32),
    "id_adresse" varchar(32),
    "einheit" varchar(10),
    "nachkomma" integer,
    "beschreibung" varchar(30),
    "id_sprach_resource_e" varchar(20),
    "id_sprach_resource_b" varchar(20),
    "typ" integer,
    "faktor" double precision,
    "einheit_xrech" varchar(10),
    "id_einheit_base" varchar(10)
);

CREATE TABLE "email" (
    "id_email" varchar(32),
    "id_email_status" varchar(32),
    "sender_url" text,
    "sender_name" text,
    "empfaenger_url" text,
    "empfaenger_bcc" text,
    "empfaenger_cc" text,
    "empfaenger_name" text,
    "betreff" varchar(100),
    "anhang_liste" text,
    "text_format" smallint,
    "inhalt" bytea,
    "zeit" timestamp,
    "prioritaet" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(50),
    "modify_dt" timestamp,
    "geloescht_user" varchar(20),
    "geloescht_am" timestamp,
    "papierkorb" boolean
);

CREATE TABLE "email_gruppe" (
    "id_email_gruppe" varchar(32),
    "id_parent" varchar(32),
    "id_adr_benutzer" varchar(32),
    "bezeichnung" varchar(50),
    "pc_flag" integer,
    "image_index" integer,
    "dialog_typ" smallint,
    "not_lizenz" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "email_status" (
    "id_email_status" varchar(32),
    "bezeichnung" varchar(20)
);

CREATE TABLE "email_tree" (
    "id_email_tree" varchar(32),
    "id_email" varchar(32),
    "id_email_gruppe" varchar(32)
);

CREATE TABLE "feiertage" (
    "id_feiertage" varchar(32),
    "id_land" varchar(32),
    "datum" varchar(50),
    "bezeichnung" varchar(50),
    "id_language" varchar(32),
    "readonly" boolean,
    "sortieren" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "fibu_buchungschluessel" (
    "id_fibu_buchungschluessel" integer,
    "bezeichnung" varchar(100),
    "mwst" double precision,
    "art" smallint
);

CREATE TABLE "fibu_konto" (
    "id_fibu_konto" varchar(32),
    "nummer" varchar(20),
    "bezeichnung" varchar(50),
    "mwst" double precision,
    "art" integer,
    "soll" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "fibu_kostenstelle" (
    "id_fibu_kostenstelle" varchar(32),
    "nummer" varchar(20),
    "bezeichnung" varchar(50)
);

CREATE TABLE "formular" (
    "id_formular" varchar(32),
    "id_parent" varchar(32),
    "id_formular_typ" varchar(32),
    "id_copy_from" varchar(32),
    "is_standard" boolean,
    "stamm_formular" boolean,
    "bezeichnung" varchar(50),
    "variante" varchar(50),
    "formular_text" bytea,
    "autochange" boolean,
    "drucker_1" varchar(254),
    "schacht1_1" varchar(50),
    "schacht2_1" varchar(50),
    "drucker_2" varchar(254),
    "schacht1_2" varchar(50),
    "schacht2_2" varchar(50),
    "drucker_3" varchar(254),
    "schacht2_3" varchar(50),
    "schacht1_3" varchar(50),
    "readonly" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "drucker_0" varchar(254),
    "schacht1_0" varchar(50),
    "schacht2_0" varchar(50),
    "kopie_0" integer,
    "kopie_1" integer,
    "kopie_2" integer,
    "kopie_3" integer
);

CREATE TABLE "formular_standard" (
    "id_formular" varchar(32),
    "id_formular_typ" varchar(32),
    "is_standard" boolean,
    "stamm_formular" boolean,
    "bezeichnung" varchar(50),
    "variante" varchar(50),
    "formular_text" bytea,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "formular_typ" (
    "id_formular_typ" varchar(32),
    "id_frame" integer,
    "id_base" varchar(32),
    "id_sprach_resource" varchar(20),
    "id_parent" varchar(32),
    "id_template" varchar(32),
    "image_index" integer,
    "user_formular" integer,
    "create_copy" boolean
);

CREATE TABLE "geraet" (
    "id_geraet" varchar(32),
    "id_geraet_gruppe" varchar(32),
    "id_adr_mitarbeiter" varchar(32),
    "kalkgeraet" boolean,
    "nummer" varchar(50),
    "matchcode" varchar(20),
    "bezeichnung" varchar(50),
    "fabrikat" varchar(50),
    "typ" varchar(50),
    "kennzeichen" varchar(12),
    "hubraum" double precision,
    "leistung" double precision,
    "kraftstoff" varchar(50),
    "fuehrerschein" varchar(50),
    "tuev" date,
    "inspektion" double precision,
    "inspektion_intervalle" double precision,
    "preis_stunde_kalk" double precision,
    "preis_stunde" double precision,
    "preis_minute" double precision,
    "preis_taglohn" double precision,
    "preis_tagessatz" double precision,
    "preis_stunde_kalk_mit" double precision,
    "preis_stunde_mit" double precision,
    "preis_minute_mit" double precision,
    "preis_taglohn_mit" double precision,
    "preis_tagessatz_mit" double precision,
    "bemerkung" bytea,
    "mandant" integer,
    "papierkorb" boolean,
    "readonly" boolean,
    "geloescht_am" timestamp,
    "geloescht_user" varchar(20),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "kaufpreis" double precision,
    "kaufdatum" date,
    "betriebsstunden" double precision,
    "nutzungsdauer" double precision,
    "abschreibung_jahr" double precision,
    "abschreibung_proz" double precision,
    "abschreibung" double precision,
    "zins_proz" double precision,
    "zins" double precision,
    "steuer" double precision,
    "versicherung_proz" double precision,
    "versicherung" double precision,
    "feste_kosten_std" double precision,
    "feste_kosten" double precision,
    "verbrauch" double precision,
    "kraftstoffpreis" double precision,
    "kraftstoffe" double precision,
    "schmierstoffe_proz" double precision,
    "schmierstoffe" double precision,
    "wartung_rep_proz" double precision,
    "wartung_rep" double precision,
    "variable_kosten_std" double precision,
    "variable_kosten" double precision,
    "kalk_std" double precision,
    "kalk_minute" double precision
);

CREATE TABLE "geraet_kosten" (
    "id_geraet_kosten" varchar(32),
    "id_geraet" varchar(32),
    "id_adresse" varchar(32),
    "datum" date,
    "art" varchar(20),
    "beschreibung" bytea,
    "kosten" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "geschaeftsbereich" (
    "id_geschaeftsbereich" varchar(32),
    "bezeichnung" varchar(100),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "read_only" boolean
);

CREATE TABLE "id_counter" (
    "id" serial,
    "tbname" varchar(50),
    "prefix" varchar(2),
    "lastid" integer,
    "rowver" bigint
);

CREATE TABLE "inf_iso_land" (
    "id" serial,
    "iso3" varchar(3),
    "iso2" varchar(2),
    "name" varchar(180),
    "id_inf_iso_land" varchar(10)
);

CREATE TABLE "inf_plz_ort" (
    "plz" varchar(5),
    "name" varchar(40),
    "kreis" varchar(35),
    "bundesland" varchar(25),
    "land" varchar(2)
);

CREATE TABLE "kalender" (
    "id_kalender" varchar(32),
    "id_projekte" varchar(32),
    "id_kalender_resource" varchar(32),
    "parentid" varchar(10),
    "beginn" timestamp,
    "ende" timestamp,
    "actualstart" timestamp,
    "actualfinish" timestamp,
    "caption" varchar(255),
    "location" varchar(255),
    "bemerkung" bytea,
    "recurrenceinfo" bytea,
    "labelcolor" integer,
    "reminderdate" double precision,
    "reminder" integer,
    "recurrenceindex" integer,
    "options" integer,
    "type" integer,
    "state" integer,
    "kategorie" text,
    "kategorie1" text,
    "mandant" integer,
    "papierkorb" boolean,
    "readonly" boolean,
    "geloescht_am" timestamp,
    "geloescht_user" varchar(20),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "kalender_outlook" (
    "id_kalender_outlook" varchar(32),
    "id_adr_benutzer" varchar(32),
    "id_kalender" varchar(32),
    "id_outlook" varchar(150),
    "modify_dt" timestamp
);

CREATE TABLE "kalender_resource" (
    "id_kalender_resource" varchar(32),
    "id_parent" varchar(32),
    "flag" varchar(1),
    "aktiv" boolean,
    "resource_name" varchar(50),
    "resource_color" integer
);

CREATE TABLE "kategorie" (
    "id_kategorie" varchar(32),
    "name" varchar(30),
    "bezeichnung" varchar(33),
    "id_kategorie_name" varchar(32),
    "color" integer,
    "font_color" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "flag" varchar(2)
);

CREATE TABLE "kategorie_name" (
    "id_kategorie_name" varchar(32),
    "bezeichnung" varchar(50),
    "flag" integer,
    "color" integer,
    "font_color" integer,
    "readonly" boolean,
    "create_dt" timestamp,
    "createuser" varchar(20),
    "modify_dt" timestamp,
    "modifyuser" varchar(50)
);

CREATE TABLE "kb_detail" (
    "id_kb_detail" varchar(32),
    "id_kb_eintrag" varchar(32),
    "nummer" varchar(20),
    "belegdatum" date,
    "belegnummer" varchar(20),
    "fibu_konto_nummer" varchar(20),
    "buchungstext" varchar(50),
    "einnahme" double precision,
    "ausgabe" double precision,
    "mwstproz" double precision,
    "mwstbetrag" double precision,
    "saldo" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "kb_eintrag" (
    "id_kb_eintrag" varchar(32),
    "bezeichnung" varchar(50),
    "dvon" date,
    "dbis" date,
    "bemerkung" bytea,
    "festgeschrieben" boolean,
    "festgeschrieben_am" date,
    "vobelegnummer" varchar(20),
    "vosaldo" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "kommunikation" (
    "id_kommunikation" varchar(32),
    "id_adresse" varchar(32),
    "id_asp" varchar(32),
    "nummer" varchar(50),
    "bezeichnung" varchar(100),
    "bemerkung" bytea,
    "betreff" varchar(100),
    "dauer" double precision,
    "beschreibung" bytea,
    "datum" timestamp,
    "anhang_liste" text,
    "id_kommunikation_prio" varchar(32),
    "id_kommunikation_status" varchar(50),
    "id_kommunikation_art" varchar(32),
    "zuweisen_an" varchar(50),
    "erinnerung" timestamp,
    "id_projekte" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "flags" integer,
    "papierkorb" boolean,
    "geloescht_am" timestamp,
    "geloescht_user" varchar(20),
    "protokoll_an" varchar(50),
    "id_kalender" varchar(32),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "kommunikation_art" (
    "id_kommunikation_art" varchar(32),
    "bezeichnung" varchar(50),
    "used" boolean,
    "readonly" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

-- Tabelle "kommunikation_kalender" ist verschlüsselt (4 Felder) — Struktur nicht lesbar

CREATE TABLE "kommunikation_prio" (
    "id_kommunikation_prio" varchar(32),
    "bezeichnung" varchar(50),
    "used" boolean,
    "readonly" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "kommunikation_status" (
    "id_kommunikation_status" varchar(32),
    "bezeichnung" varchar(50),
    "standard" boolean,
    "color" integer,
    "use" boolean,
    "readonly" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "kostengruppe" (
    "id_kostengruppe" varchar(32),
    "ebene" integer,
    "kostengruppe" integer,
    "bezeichnung" varchar(100),
    "ausgabe" integer
);

CREATE TABLE "lagerstatus" (
    "id_lagerstatus" varchar(32),
    "id_sprach_resource" varchar(20)
);

CREATE TABLE "land" (
    "id_land" varchar(32),
    "staat" varchar(50),
    "land" varchar(50),
    "id_language" varchar(32)
);

CREATE TABLE "language" (
    "id_language" varchar(32),
    "id_language_intern" varchar(32),
    "id_intern" integer,
    "aktiv" boolean,
    "sprache" varchar(40),
    "sprache_kurz" varchar(8),
    "waehrung_alt" varchar(10),
    "waehrung_kurz" varchar(3),
    "waehrung_liste" bytea,
    "waehrung_neu" varchar(10),
    "umrechnungsfaktor" double precision,
    "kd_laenge" integer,
    "stand" timestamp,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "lieferung" (
    "id_lieferung" varchar(32),
    "id_adresse" varchar(32),
    "id_eingangsrechnung_re" varchar(32),
    "id_projekte" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "datum" timestamp,
    "nummer" varchar(20),
    "rechnung_nr" varchar(20),
    "datum_eingang" timestamp,
    "rechnung_nummer" varchar(20),
    "rechnung_datum" date,
    "kurzbez" varchar(20),
    "bezeichnung" varchar(100),
    "zahlungsbetrag" double precision,
    "bezahlt" boolean,
    "betrag_netto" double precision,
    "betrag_brutto" double precision,
    "betrag_netto_offen" double precision,
    "betrag_brutto_offen" double precision,
    "zuschlag" double precision,
    "mwst" double precision,
    "zahlungsziel" timestamp,
    "druck_flag" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "lieferung_detail" (
    "id_lieferung_detail" varchar(32),
    "id_lieferung" varchar(32),
    "id_lv" varchar(32),
    "kurzbez" varchar(20),
    "bezeichnung" varchar(100),
    "id_einheit" varchar(32),
    "menge" double precision,
    "einzelpreis" double precision,
    "ke" varchar(10),
    "id_katalog" varchar(32),
    "id_qualitaet" varchar(32),
    "artikelnummer" varchar(50),
    "rabatt" double precision,
    "skontierung" boolean,
    "ust" double precision,
    "sortieren" integer,
    "create_user" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "logged_table" (
    "logged_user" varchar(20),
    "logged_dt" timestamp,
    "log_table" varchar(20),
    "id_log_table" varchar(32),
    "id_logged_table" varchar(10)
);

CREATE TABLE "lohnart" (
    "id_lohnart" varchar(32),
    "id_lohn_schluessel" varchar(32),
    "id_lohn_schluessel_brz" varchar(32),
    "bezeichnung" varchar(50),
    "nummer" varchar(10),
    "farbe" integer,
    "az" boolean,
    "readonly" boolean
);

CREATE TABLE "lohngruppe" (
    "id_lohngruppe" varchar(32),
    "nummer" varchar(20),
    "bezeichnung" varchar(50),
    "tariflohn" double precision,
    "betriebslohn" double precision,
    "lohnzuwachs" double precision,
    "beschreibung" text,
    "datum" date,
    "genutzt" boolean,
    "readonly" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "lohn_schluessel" (
    "id_lohn_schluessel" varchar(32),
    "ke" varchar(2),
    "bezeichnung" varchar(50),
    "flag_verwenden" boolean,
    "readonly" boolean
);

-- Tabelle "lohn_schluessel_brz" ist verschlüsselt (5 Felder) — Struktur nicht lesbar

-- Tabelle "lv_bestellung_artikel" ist verschlüsselt (13 Felder) — Struktur nicht lesbar

-- Tabelle "lv_bestellung_lieferant" ist verschlüsselt (14 Felder) — Struktur nicht lesbar

CREATE TABLE "lv_bieter" (
    "id_lv_bieter" varchar(32),
    "id_lv" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_projekte_lvlist_bieter" varchar(32),
    "id_einheit" varchar(32),
    "id_adresse" varchar(10),
    "menge" double precision,
    "menge_massen" double precision,
    "g_preis_kalk" double precision,
    "menge_schaetzen" double precision,
    "listenpreis" double precision,
    "rabatt" double precision,
    "id_mwst" varchar(10),
    "id_katalog" varchar(10),
    "id_lieferant" varchar(10),
    "id_qualitaet" varchar(10),
    "ca" boolean,
    "preis_lohn" double precision,
    "preis_zeit_minute" double precision,
    "preis_lohn_minute" double precision,
    "preis_geraet" double precision,
    "preis_material" double precision,
    "preis_pflanze" double precision,
    "preis_sonstiges" double precision,
    "preis_fremd" double precision,
    "preis_kalk" double precision,
    "preis_entsorgung" double precision,
    "preis_prozent" double precision,
    "preis" double precision,
    "g_preis" double precision,
    "preis_flag" smallint,
    "schwierigkeitsgrad_lohn" double precision,
    "schwierigkeitsgrad_geraet" double precision,
    "faktor" double precision,
    "zeitraum_von" timestamp,
    "zeitraum_bis" timestamp,
    "mietdauer" integer,
    "fahrzeug" varchar(50),
    "uebergabeort" varchar(50),
    "uebergabe_am" timestamp,
    "rueckgabe_am" timestamp,
    "reiseziel" varchar(50),
    "uhr_zeitraum_von" timestamp,
    "uhr_zeitraum_bis" timestamp,
    "geloescht_am" timestamp,
    "geloescht_user" varchar(20),
    "readonly" boolean,
    "create_dt" timestamp,
    "createuser" varchar(20),
    "modify_dt" timestamp,
    "modifyuser" varchar(20),
    "flags" integer
);

CREATE TABLE "lv_cad" (
    "id_lv_cad" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "bezeichnung" varchar(50),
    "dateiname" varchar(255),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "lv_cad_position" (
    "id_lv_cad" varchar(32),
    "id_lv" varchar(32),
    "id_lv_cad_position" varchar(10)
);

CREATE TABLE "lv_einbehalt" (
    "id_lv_einbehalt" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "bezeichnung" varchar(100),
    "typ" integer,
    "aktiv" boolean,
    "brutto" boolean,
    "betrag" double precision,
    "prozent" double precision,
    "letzter_betrag" double precision,
    "mwst" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "lv_gutschrift" (
    "id_lv" varchar(32),
    "id_zv_gutschrift" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "druck_flag" boolean,
    "menge" double precision,
    "id_lv_gutschrift" varchar(32),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "lv_kalk" (
    "id_lv_kalk" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_parent" varchar(32),
    "id_lv" varchar(32),
    "id_einheit" varchar(32),
    "id_katalog" varchar(32),
    "id_lieferant" varchar(32),
    "id_qualitaet" varchar(32),
    "ke" varchar(1),
    "fremdleistung" boolean,
    "bezeichnung" text,
    "zeitansatz" varchar(50),
    "faktor" double precision,
    "menge" double precision,
    "preis_rabatt" double precision,
    "preis_kalk" double precision,
    "preis" double precision,
    "preis_zuschlag" double precision,
    "g_preis" double precision,
    "readonly" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "sortieren" integer,
    "flags" integer,
    "matchcode" varchar(20),
    "co2" double precision,
    "g_co2" double precision
);

CREATE TABLE "lv_kalk_gruppe" (
    "id_lv_kalk_gruppe" varchar(10),
    "id_lv" varchar(50),
    "bezeichnung" varchar(50),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "sortieren" integer
);

CREATE TABLE "lv_kennung" (
    "id_lv_kennung" varchar(32),
    "hke" varchar(5),
    "ke" varchar(10),
    "kurzbez" varchar(2),
    "bezeichnung" varchar(50),
    "color" integer,
    "hoehe" integer,
    "txt_font" varchar(50),
    "txt_color" integer,
    "txt_size" integer,
    "txt_fett" boolean,
    "txt_kursiv" boolean,
    "txt_unterstrichen" boolean,
    "sortieren" smallint
);

CREATE TABLE "lv_kennung_kalk" (
    "ke" varchar(1),
    "id_sprach_resource_ke" varchar(50),
    "id_sprach_resource_kennung" varchar(50),
    "color" integer,
    "hoehe" integer,
    "sortieren" smallint
);

CREATE TABLE "lv_matprop" (
    "id_lv_matprop" varchar(32),
    "id_lv" varchar(32),
    "id_lv_kalk" varchar(32),
    "property_id" integer,
    "property_caption" varchar(50),
    "value_id" integer,
    "value_caption" varchar(50)
);

CREATE TABLE "lv_pflanzliste" (
    "id_lv_pflanzliste" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_lv" varchar(32),
    "id_qualitaet_preis" varchar(50),
    "ke" varchar(10),
    "langtext" bytea,
    "botanischername" varchar(50),
    "deutschername" varchar(50),
    "qualitaet" varchar(50),
    "menge" double precision,
    "menge_massen" double precision,
    "ca" boolean,
    "preis_pflanze" double precision,
    "preis_kalk" double precision,
    "preis" double precision,
    "preis_prozent" double precision,
    "festpreis" boolean,
    "g_preis" double precision,
    "readonly" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "sortieren" integer,
    "id_qualitaet" varchar(32),
    "id_lieferant" varchar(32),
    "id_katalog" varchar(32),
    "id_einheit" varchar(32),
    "flags" integer,
    "matchcode" varchar(20),
    "co2" double precision,
    "g_co2" double precision
);

CREATE TABLE "lv_pflege" (
    "id_lv_pflege" varchar(32),
    "id_lv" varchar(32),
    "id_pflege" varchar(32),
    "id_adresse" varchar(32),
    "ke" varchar(2),
    "aktiv" boolean,
    "bezeichnung" varchar(50),
    "text" text,
    "beginn" timestamp,
    "ende" timestamp,
    "massen" double precision,
    "start" timestamp,
    "finish" timestamp,
    "labelcolor" integer,
    "reminderdate" double precision,
    "reminder" integer,
    "options" integer,
    "datum_bearbeitung" timestamp,
    "mandant" integer,
    "readonly" boolean,
    "geloescht_am" timestamp,
    "geloescht_user" varchar(20),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "papierkorb" boolean,
    "flags" integer
);

CREATE TABLE "lv_pos" (
    "id_lv_pos" varchar(32),
    "id_parent" varchar(32),
    "hke" varchar(5),
    "id_projekte_lvlist" varchar(32),
    "id_kostengruppe" varchar(32),
    "oz" varchar(20),
    "id_pos_referenz" varchar(32),
    "ke" varchar(10),
    "zz_gruppe_nr" integer,
    "zz_lfd_nr" integer,
    "menge" double precision,
    "menge_massen" double precision,
    "mwst" double precision,
    "id_einheit" varchar(32),
    "ca" boolean,
    "id_katalog" varchar(32),
    "id_lieferant" varchar(32),
    "id_qualitaet" varchar(32),
    "preis" double precision,
    "faktor" double precision,
    "geloescht_am" timestamp,
    "geloescht_user" varchar(20),
    "mandant" integer,
    "g_preis" double precision,
    "sortieren" integer,
    "druck_flag" boolean,
    "break_flag" boolean,
    "massen_flag" boolean,
    "papierkorb" boolean,
    "readonly" boolean,
    "create_dt" timestamp,
    "createuser" varchar(20),
    "modify_dt" timestamp,
    "modifyuser" varchar(20),
    "bereich_refresh" boolean,
    "kurztext_text" varchar(100),
    "langtext_text" varchar(100),
    "kurzbez_text" varchar(100),
    "status" smallint,
    "flags" integer,
    "druck_flags" integer,
    "z_referenz" text,
    "kalktyp" integer,
    "bezug_kz" varchar(5),
    "bezug" varchar(20),
    "matchcode" varchar(20),
    "co2" double precision,
    "g_co2" double precision
);

CREATE TABLE "lv_preisanfrage_artikel" (
    "id_lv_preisanfrage_artikel" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_einheit" varchar(32),
    "bezeichnung" text,
    "nummer" varchar(50),
    "menge" double precision,
    "preis_lv" double precision,
    "preis_pa" double precision,
    "ke_k" varchar(1),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "lv_preisanfrage_lieferant" (
    "id_lv_preisanfrage_lieferant" varchar(32),
    "id_lv_preisanfrage_artikel" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_adresse" varchar(50),
    "anfrage_dt" timestamp,
    "antwort_dt" timestamp,
    "preis" double precision,
    "stammlieferant" boolean,
    "bemerkung" text,
    "druck_flag" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "lv_preisanfrage_position" (
    "id_lv_preisanfrage_position" varchar(10),
    "id_lv_preisanfrage_artikel" varchar(10),
    "id_projekte_lvlist" varchar(10),
    "id_lv" varchar(10),
    "menge" double precision,
    "id_einheit" varchar(10),
    "id_parent" varchar(10),
    "typ" varchar(50),
    "ke" varchar(1),
    "bezeichnung" text
);

CREATE TABLE "lv_preise" (
    "id_lv_preise" varchar(32),
    "id_lv_pos" varchar(32),
    "preis_lohn" double precision,
    "preis_zeit_minute" double precision,
    "preis_lohn_minute" double precision,
    "schwierigkeitsgrad_lohn" double precision,
    "id_lohn_zeiteinheit" varchar(32),
    "kalk_lohn_flag" boolean,
    "preis_geraet" double precision,
    "schwierigkeitsgrad_geraet" double precision,
    "id_geraet_zeiteinheit" varchar(32),
    "kalk_geraet_flag" boolean,
    "preis_material" double precision,
    "kalk_material_flag" boolean,
    "preis_pflanze" double precision,
    "kalk_pflanze_flag" boolean,
    "preis_sonstiges" double precision,
    "kalk_sonstiges_flag" boolean,
    "preis_fremd" double precision,
    "kalk_fremd_flag" boolean,
    "preis_kalk" double precision,
    "kalk_kalk_flag" boolean,
    "preis_entsorgung" double precision,
    "kalk_entsorgung_flag" boolean,
    "zuschlag_prozent" double precision,
    "preis" double precision,
    "preis_flag" smallint,
    "festpreis" boolean,
    "create_dt" timestamp,
    "createuser" varchar(20),
    "modify_dt" timestamp,
    "modifyuser" varchar(20)
);

CREATE TABLE "lv_status" (
    "id_lv_status" varchar(32),
    "id_sprach_resource" varchar(20),
    "typ" varchar(10)
);

CREATE TABLE "lv_taglohn" (
    "id_lv_taglohn" varchar(32),
    "id_lv" varchar(32),
    "id_einheit" varchar(32),
    "id_katalog" varchar(32),
    "id_lieferant" varchar(32),
    "id_qualitaet" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "ke" varchar(1),
    "bezeichnung" text,
    "menge_massen" double precision,
    "preis_lohn" double precision,
    "preis_geraet" double precision,
    "preis_material" double precision,
    "preis_pflanze" double precision,
    "preis_kalk" double precision,
    "preis_prozent" double precision,
    "menge" double precision,
    "preis" double precision,
    "g_preis" double precision,
    "readonly" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "sortieren" integer,
    "flags" integer,
    "matchcode" varchar(20),
    "co2" double precision,
    "g_co2" double precision
);

CREATE TABLE "lv_text" (
    "id_lv" varchar(32),
    "kurztext" bytea,
    "langtext" bytea,
    "stlb" bytea,
    "kurzbez" bytea
);

CREATE TABLE "mahnung" (
    "id_mahnung" varchar(32),
    "mahnstufe" smallint,
    "standard" boolean,
    "bezeichnung" varchar(20),
    "gebuehr" double precision,
    "zinsen" double precision,
    "text" text
);

CREATE TABLE "massen_baustein" (
    "id_massen_baustein" varchar(32),
    "id_massen_baustein_gruppe" varchar(32),
    "id_massen_formeln" varchar(32),
    "symbol" smallint,
    "faktor" double precision,
    "kennzeichen" varchar(50),
    "ergebnis" double precision,
    "bezeichnung" varchar(50),
    "sortieren" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "massen_baustein_formel" (
    "id_massen_baustein_formel" varchar(32),
    "id_massen_main" varchar(32),
    "formel" varchar(254),
    "beschreibung" varchar(25),
    "blatt" double precision,
    "wert1" double precision,
    "wert2" double precision,
    "wert3" double precision,
    "wert4" double precision,
    "wert5" double precision,
    "rz1" varchar(1),
    "rz2" varchar(1),
    "rz3" varchar(1),
    "rz4" varchar(1),
    "rz5" varchar(1),
    "rechenansatz1" varchar(200),
    "rechenansatz2" varchar(200),
    "rechenansatz3" varchar(200),
    "rechenansatz4" varchar(200),
    "rechenansatz5" varchar(200),
    "sortieren" integer,
    "gedruckt" timestamp,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "massen_baustein_gruppe" (
    "id_massen_baustein_gruppe" varchar(32),
    "id_lv" varchar(32),
    "gruppe" varchar(20)
);

CREATE TABLE "massen_formel" (
    "id_massen_formel" varchar(32),
    "id_massen_main" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_lv" varchar(32),
    "id_rb_bezug" varchar(32),
    "rb_bezug_name" varchar(50),
    "formel" varchar(254),
    "beschreibung" varchar(25),
    "blatt" double precision,
    "blattadresse" varchar(6),
    "wert1" double precision,
    "wert2" double precision,
    "wert3" double precision,
    "wert4" double precision,
    "wert5" double precision,
    "rz1" varchar(1),
    "rz2" varchar(1),
    "rz3" varchar(1),
    "rz4" varchar(1),
    "rz5" varchar(1),
    "rechenansatz1" varchar(200),
    "rechenansatz2" varchar(200),
    "rechenansatz3" varchar(200),
    "rechenansatz4" varchar(200),
    "rechenansatz5" varchar(200),
    "sortieren" integer,
    "gedruckt" timestamp,
    "exp_da11_dt" timestamp,
    "intern" boolean,
    "v_index" varchar(1),
    "info" varchar(200),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "massen_gruppe" (
    "id_massen_gruppe" varchar(32),
    "gruppe" varchar(20),
    "id_projekte_lvlist" varchar(32),
    "id_zv_rechnung" varchar(32),
    "readonly" boolean,
    "new_version" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "massen_main" (
    "id_massen_main" varchar(32),
    "id_massen_gruppe" varchar(32),
    "id_lv" varchar(32),
    "id_massen_formeln" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_lv_cad" varchar(32),
    "id_rb_lokalitaet" varchar(32),
    "has_variable" boolean,
    "symbol" smallint,
    "faktor" double precision,
    "kennzeichen" varchar(50),
    "ergebnis" double precision,
    "bezeichnung" varchar(50),
    "sortieren" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "flags" integer
);

CREATE TABLE "mat_eigenschaft" (
    "id_mat_eigenschaft" varchar(32),
    "id_mat_qualitaet" varchar(32),
    "id_mat_eigenschaft_art" varchar(32),
    "eigenschaftwert" varchar(50),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "mat_eigenschaftstyp" (
    "id_mat_eigenschaftstyp" varchar(32),
    "bezeichnung" varchar(50),
    "format" varchar(20)
);

CREATE TABLE "mat_eigenschaft_art" (
    "id_mat_eigenschaft_art" varchar(32),
    "id_gruppe" varchar(32),
    "id_mat_eigenschaftstyp" varchar(32),
    "eigenschaft" varchar(50),
    "eigenschafttyp" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "mat_hauptgruppe" (
    "id_mat_hauptgruppe" varchar(32),
    "id_adresse" varchar(32),
    "id_language" varchar(32),
    "nummer" varchar(10),
    "hersteller_name" varchar(50),
    "hersteller_bezeichnung" varchar(50),
    "bezeichnung" varchar(50),
    "zuschlag" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "mat_katalog" (
    "id_mat_katalog" varchar(32),
    "id_adresse" varchar(32),
    "id_language" varchar(32),
    "nummer" varchar(10),
    "bezeichnung" varchar(50),
    "lieferant_anzeigename" varchar(100),
    "kosten1_variable" varchar(50),
    "kosten2_variable" varchar(50),
    "kosten3_variable" varchar(50),
    "kosten4_variable" varchar(50),
    "kosten5_variable" varchar(50),
    "kosten6_variable" varchar(50),
    "manrabatt" double precision,
    "zuschlag" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "mat_rabatt" (
    "id_mat_rabatt" varchar(32),
    "id_adresse" varchar(32),
    "gruppe" varchar(80),
    "bezeichnung" varchar(254),
    "wert" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "mat_text" (
    "id_mat_text" varchar(10),
    "id_mat" varchar(10),
    "id_language" varchar(10),
    "bezeichnung1" varchar(50),
    "bezeichnung2" varchar(50),
    "langtext" text,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "mat_untergruppe" (
    "id_mat_untergruppe" varchar(32),
    "id_adresse" varchar(32),
    "id_language" varchar(32),
    "nummer" varchar(10),
    "bezeichnung" varchar(50),
    "lieferant_anzeigename" varchar(100),
    "kosten1_variable" varchar(50),
    "kosten2_variable" varchar(50),
    "kosten3_variable" varchar(50),
    "kosten4_variable" varchar(50),
    "kosten5_variable" varchar(50),
    "kosten6_variable" varchar(50),
    "manrabatt" double precision,
    "zuschlag" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "mat_zuschlag" (
    "id_mat_zuschlag" varchar(32),
    "id_adresse" varchar(32),
    "bezeichnung" varchar(50),
    "wert" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "mwst" (
    "id_mwst" varchar(32),
    "aktiv" boolean,
    "kurzbezeichnung" varchar(10),
    "wert" double precision,
    "bezeichnung" varchar(20),
    "konto" integer,
    "readonly" boolean
);

CREATE TABLE "nachkalkulation_gruppe" (
    "id_nachkalkulation_gruppe" varchar(32),
    "id_parent" varchar(32),
    "id_adr_benutzer" varchar(32),
    "bezeichnung" varchar(50),
    "pc_flag" integer,
    "image_index" integer,
    "dialog_typ" smallint,
    "not_lizenz" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "nachkalkulation_tree" (
    "id_nachkalkulation_tree" varchar(32),
    "id_nachkalkulation" varchar(32),
    "id_nachkalkulation_gruppe" varchar(32)
);

CREATE TABLE "nummernkreis" (
    "id_nummernkreis" varchar(32),
    "id_sprach_resource" varchar(20),
    "nummer" varchar(20),
    "nummer_aufbau" varchar(20),
    "g_bereich" varchar(20),
    "mandant" integer,
    "sortieren" integer
);

CREATE TABLE "options" (
    "id_options" varchar(32),
    "id_adr_benutzer" varchar(32),
    "bezeichnung" varchar(100),
    "option_memo" bytea,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "outlook_del" (
    "id_outlook_del" serial,
    "id_adr_benutzer" varchar(32),
    "id_outlook" varchar(150)
);

CREATE TABLE "pflanze_bks" (
    "id_bks" varchar(32),
    "bks_kennung" varchar(3),
    "bdbl_nummer" varchar(9)
);

CREATE TABLE "pflanze_eigenschaften" (
    "id_pflanze_eigenschaften" varchar(32),
    "id_language" varchar(32),
    "id_pflanze" varchar(32),
    "blattbluetenduft" varchar(4),
    "fruchtschmuck" varchar(4),
    "giftigepflanze" varchar(4),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "geloescht_user" varchar(20),
    "geloescht_am" varchar(50),
    "papierkorb" boolean,
    "blattschmuck" varchar(50)
);

CREATE TABLE "pflanze_eigenschaft_name" (
    "id_pflanze_eigenschaft_name" varchar(32),
    "tabelle_name" varchar(50),
    "feld_name" varchar(50),
    "display_name" varchar(50)
);

CREATE TABLE "pflanze_eigenschaft_qualitaet" (
    "id_pflanze_eigenschaft_qualitaet" varchar(32),
    "id_pflanze_qualitaet_preis" varchar(32),
    "id_pflanze_eigenschaft_art" varchar(32),
    "eigenschaftwert" varchar(50),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "pflanze_gruppe" (
    "id_pflanze_gruppe" varchar(32),
    "artikelgruppe" varchar(50),
    "bezeichnung" varchar(60)
);

CREATE TABLE "pflanze_katalog" (
    "id_pflanze_katalog" varchar(32),
    "id_katalog" varchar(50),
    "pflanze_nr" varchar(50),
    "botanischername" varchar(50),
    "regionalername" varchar(50)
);

CREATE TABLE "pflanze_qualitaet_stufe" (
    "id_pflanze_qualitaet_stufe" varchar(32),
    "id_language" varchar(32),
    "qualitaetsstufe" varchar(4),
    "bezeichnung" varchar(40),
    "kurzbezeichnung" varchar(20),
    "papierkorb" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "pflanze_rabatt" (
    "id_mat_rabatt" varchar(32),
    "id_pflanze_rabatt" varchar(32),
    "id_adresse" varchar(32),
    "gruppe" varchar(80),
    "bezeichnung" varchar(254),
    "wert" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

-- Tabelle "pflege" ist verschlüsselt (25 Felder) — Struktur nicht lesbar

-- Tabelle "pflege_gruppe" ist verschlüsselt (12 Felder) — Struktur nicht lesbar

-- Tabelle "pflege_tree" ist verschlüsselt (3 Felder) — Struktur nicht lesbar

CREATE TABLE "plan_" (
    "id_plan" varchar(32),
    "id_plan_eintrag" varchar(32),
    "beginn" timestamp,
    "ende" timestamp,
    "options" integer,
    "iconindex" integer
);

CREATE TABLE "plan_eintrag" (
    "id_plan_eintrag" varchar(32),
    "id_parent" varchar(32),
    "name" varchar(255),
    "ke" varchar(2),
    "id_gruppe" varchar(32),
    "id_tabelle" varchar(32),
    "farbe" integer,
    "sortieren" integer
);

CREATE TABLE "plan_gruppe" (
    "id_plan_gruppe" varchar(32),
    "name" varchar(50),
    "farbe" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "geloescht_user" varchar(20),
    "geloescht_am" timestamp,
    "papierkorb" boolean
);

CREATE TABLE "plan_gruppe_detail" (
    "id_plan_gruppe_detail" varchar(32),
    "id_plan_gruppe" varchar(32),
    "id_kalender_resource" varchar(32),
    "aktiv" boolean
);

CREATE TABLE "plan_projekte" (
    "id_adr_benutzer" varchar(32),
    "projekte" text,
    "id_plan_projekte" varchar(10)
);

CREATE TABLE "projekte" (
    "id_projekte" varchar(32),
    "id_projekte_status" varchar(32),
    "id_geschaeftsbereich" varchar(32),
    "id_projekte_gruppe" varchar(10),
    "id_adr_projektleiter" varchar(32),
    "nummer" varchar(50),
    "kurzbez" varchar(20),
    "bemerkung" bytea,
    "betreff" bytea,
    "bezeichnung" varchar(100),
    "anfangsdatum" timestamp,
    "faelligkeitsdatum" timestamp,
    "prioritaet" varchar(10),
    "abgeschlossen" double precision,
    "lv_summe_angebot" double precision,
    "lv_summe_auftrag" double precision,
    "ordnername" varchar(85),
    "id_auftraggeber" varchar(32),
    "lv_summe_rechnung" double precision,
    "bestellreferenz" varchar(50),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "kunden_name" varchar(100),
    "geloescht_am" timestamp,
    "geloescht_user" varchar(20),
    "papierkorb" boolean,
    "mandant" integer,
    "readonly" boolean,
    "protokoll" bytea,
    "flags" integer
);

CREATE TABLE "projekte_adressart" (
    "id_projekte_adressart" varchar(32),
    "id_sprach_resource" varchar(20),
    "readonly" boolean
);

CREATE TABLE "projekte_adresse" (
    "id_projekte_adresse" varchar(32),
    "id_projekte" varchar(32),
    "id_adresse" varchar(32),
    "id_asp" varchar(32),
    "id_projekte_adressart" varchar(32),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "projekte_adressen" (
    "id_projekt_adresse" double precision,
    "id_weitere_anschrift" varchar(20),
    "anschrift_index" integer,
    "anzeigename" varchar(100),
    "anrede" varchar(50),
    "titel" varchar(50),
    "name" varchar(50),
    "firma" varchar(50),
    "zusatz1" varchar(50),
    "zusatz2" varchar(50),
    "strasse" varchar(50),
    "plz" varchar(50),
    "ort" varchar(50),
    "region" varchar(50),
    "land" varchar(50),
    "memo" text,
    "position" varchar(50),
    "papierkorb" boolean,
    "geloescht_am" timestamp,
    "geloescht_user" varchar(20)
);

CREATE TABLE "projekte_anschrift" (
    "id_projekte_anschrift" double precision
);

CREATE TABLE "projekte_bieter" (
    "id_projekte_bieter" varchar(10),
    "id_projekte" varchar(10),
    "id_adresse" varchar(10),
    "id_projekte_lvlist" varchar(10),
    "lv_ausgang" timestamp,
    "id_ausgang_art" varchar(10),
    "lv_eingang" timestamp,
    "id_eingang_art" varchar(10),
    "ausgang_bemerkung" text,
    "eingang_bemerkung" text,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "papierkorb" boolean,
    "geloescht_user" varchar(20),
    "geloescht_am" timestamp
);

CREATE TABLE "projekte_gruppe" (
    "id_projekte_gruppe" varchar(32),
    "id_parent" varchar(32),
    "id_adr_benutzer" varchar(32),
    "bezeichnung" varchar(50),
    "pc_flag" integer,
    "image_index" integer,
    "dialog_typ" smallint,
    "not_lizenz" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "projekte_lvlist" (
    "id_projekte_lvlist" varchar(32),
    "id_lv_status" varchar(32),
    "id_projekte" varchar(32),
    "id_projekt_arbeitsbereich" varchar(32),
    "id_massen_gruppe" varchar(32),
    "id_fibu_kostenstelle" varchar(32),
    "id_adr_verantwortl" varchar(32),
    "id_adresse" varchar(32),
    "datum" timestamp,
    "arbeitsbereich" varchar(50),
    "fibu_kostenstelle_nummer" varchar(20),
    "fibu_konto_nummer" varchar(20),
    "konto_soll" varchar(1),
    "fibu_gegenkonto_nummer" varchar(20),
    "bestell_nummer" varchar(50),
    "id_fibu_buchungschluessel" integer,
    "mwst" double precision,
    "zako" varchar(50),
    "autonummerierung" boolean,
    "autoberechnen" boolean,
    "nummer" varchar(50),
    "kurzbez" varchar(20),
    "bezeichnung" varchar(100),
    "ordnungszahl" varchar(20),
    "rundung_preis" integer,
    "rundung_menge" integer,
    "candragdrop" boolean,
    "gridmode" boolean,
    "lv_summe" double precision,
    "lv_massen_summe" double precision,
    "lv_summe_angebot" double precision,
    "lv_summe_auftrag" double precision,
    "lv_summe_rechnung" double precision,
    "gpreis_ausmasse" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "mandant" integer,
    "papierkorb" boolean,
    "readonly" boolean,
    "geloescht_user" varchar(20),
    "geloescht_am" timestamp,
    "protokoll" bytea,
    "rb_autoberechnen" boolean,
    "schrittweite_ba" integer,
    "lockedpartial" boolean,
    "schrittweite_los" integer,
    "schrittweite_titel" integer,
    "refresh" boolean,
    "schrittweite_pos" integer,
    "start_ba" integer,
    "start_los" integer,
    "start_titel" integer,
    "start_pos" integer,
    "mit_null" boolean,
    "struktur" varchar(255),
    "reb2009" boolean,
    "flags" integer
);

CREATE TABLE "projekte_lvlist_bieter" (
    "id_projekte_lvlist_bieter" varchar(32),
    "id_adresse" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "lv_ausgang" timestamp,
    "id_ausgang_art" varchar(32),
    "lv_eingang" timestamp,
    "id_eingang_art" varchar(32),
    "ausgang_bemerkung" text,
    "eingang_bemerkung" text,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "papierkorb" boolean
);

CREATE TABLE "projekte_lvlist_kalk" (
    "id_projekte_lvlist_kalk" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_adresse" varchar(32),
    "bearbeiter" varchar(50),
    "datum" date,
    "startzeit" timestamp,
    "entfernung" double precision,
    "einsatztakt" double precision,
    "arbeitsstunden" double precision,
    "ausloesung" varchar(50),
    "plohn_anreise_ak" double precision,
    "plohn_anreise_tag" double precision,
    "plohn_anreise_stunde" double precision,
    "plohn_zwischen_ak" double precision,
    "plohn_zwischen_tag" double precision,
    "plohn_zwischen_stunde" double precision,
    "plohn_abreise_ak" double precision,
    "plohn_abreise_tag" double precision,
    "plohn_abreise_stunde" double precision,
    "up_fahrer_ak" double precision,
    "up_fahrer_tag" double precision,
    "up_fahrer_stunde" double precision,
    "up_mitfahrer_ak" double precision,
    "up_mitfahrer_tag" double precision,
    "up_mitfahrer_stunde" double precision,
    "up_sonst_ak" double precision,
    "up_sonst_tag" double precision,
    "up_sonst_stunde" double precision,
    "lnk_al_tage" double precision,
    "lnk_al_ak" double precision,
    "lnk_al_preis" double precision,
    "lnk_ue_tage" double precision,
    "lnk_ue_ak" double precision,
    "lnk_ue_preis" double precision,
    "lohnzusatzkosten_prozent" double precision,
    "verrechnungslohn" double precision,
    "verrechnungslohn_gerundet" double precision,
    "bemerkung" text
);

CREATE TABLE "projekte_lvlist_kosten" (
    "id_projekte_lvlist_kosten" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_katalog" varchar(50),
    "anzahl" integer,
    "dauer" double precision,
    "preis" double precision,
    "tariflohn" double precision,
    "betriebslohn" double precision,
    "lohnzuwachs" double precision,
    "typ" smallint
);

CREATE TABLE "projekte_status" (
    "id_projekte_status" varchar(32),
    "id_sprach_resource" varchar(20)
);

CREATE TABLE "projekte_tree" (
    "id_projekte_tree" varchar(32),
    "id_projekte" varchar(32),
    "id_projekte_gruppe" varchar(32)
);

CREATE TABLE "projekt_arbeitsbereich" (
    "id_projekt_arbeitsbereich" varchar(32),
    "id_arbeitsbereich_select" integer,
    "id_projekte_lvlist" varchar(32),
    "bezeichnung" varchar(50),
    "nummer" varchar(10),
    "bemerkung" bytea,
    "mittellohn_minute" double precision,
    "lohnzusatzkosten_prozent" double precision,
    "lohnnebenkosten_prozent" double precision,
    "lohn_minute" double precision,
    "schwierigkeitsgrad_lohn" double precision,
    "s_grad_l_aktiv" boolean,
    "schwierigkeitsgrad_geraet" double precision,
    "s_grad_g_aktiv" boolean,
    "zu_material_z" double precision,
    "zu_lohngeraet_z" double precision,
    "zu_lohnsonstiges_z" double precision,
    "zu_geraet_z" double precision,
    "zu_fremd_z" double precision,
    "zu_pflanze_z" double precision,
    "zu_entsorgung_z" double precision,
    "zu_lohn_agk" double precision,
    "zu_geraet_agk" double precision,
    "zu_material_agk" double precision,
    "zu_pflanze_agk" double precision,
    "zu_fremd_agk" double precision,
    "zu_sonstiges_agk" double precision,
    "zu_lohn_gew" double precision,
    "zu_geraet_gew" double precision,
    "zu_material_gew" double precision,
    "zu_pflanze_gew" double precision,
    "zu_fremd_gew" double precision,
    "zu_sonstiges_gew" double precision,
    "zu_lohn_wab" double precision,
    "zu_geraet_wab" double precision,
    "zu_material_wab" double precision,
    "zu_pflanze_wab" double precision,
    "zu_fremd_wab" double precision,
    "zu_sonstiges_wab" double precision,
    "zu_lohn_wal" double precision,
    "zu_geraet_wal" double precision,
    "zu_material_wal" double precision,
    "zu_pflanze_wal" double precision,
    "zu_fremd_wal" double precision,
    "zu_sonstiges_wal" double precision,
    "zu_lohn_wug" double precision,
    "zu_geraet_wug" double precision,
    "zu_material_wug" double precision,
    "zu_ggewinn_z" double precision,
    "zu_bwgewinn_z" double precision,
    "zu_lwgewinn_z" double precision,
    "zu_pflanze_wug" double precision,
    "zu_fremd_wug" double precision,
    "zu_sonstiges_wug" double precision,
    "zu_sonstiges_z" double precision,
    "zu_gemeinkosten_z" double precision,
    "zu_gewinn_z" double precision,
    "letzte_aenderung_z" timestamp,
    "zu_material_d" double precision,
    "zu_lohn_d" double precision,
    "zu_geraet_d" double precision,
    "zu_fremd_d" double precision,
    "zu_pflanze_d" double precision,
    "zu_entsorgung_d" double precision,
    "zu_sonstiges_d" double precision,
    "zu_gkgeraete_d" double precision,
    "zu_restgk_d" double precision,
    "zu_fixkosten_d" double precision,
    "letzte_aenderung_d" timestamp,
    "mandant" integer,
    "papierkorb" boolean,
    "readonly" boolean,
    "geloescht_am" timestamp,
    "geloescht_user" varchar(20),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "projekt_zako" (
    "id_projekt_zako" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "valuta_tage" integer,
    "zahlungsziel_tage" integer,
    "skonto1_proz" double precision,
    "skonto1_tage" integer,
    "skonto2_proz" double precision,
    "skonto2_tage" integer,
    "zako_text" varchar(200),
    "angebot_text" varchar(200),
    "skonto1_text" varchar(200),
    "skonto2_text" varchar(200),
    "ziel_text" varchar(200),
    "flag_wertzuwachs" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "rapport" (
    "id_rapport" varchar(32),
    "id_adresse" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_projekte" varchar(32),
    "datum" timestamp,
    "nummer" varchar(50),
    "name" varchar(50),
    "beschreibung" text,
    "geprueft" boolean,
    "signatur" bytea,
    "signatur_firma" bytea,
    "readonly" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "rapport_detail" (
    "id_rapport_detail" varchar(32),
    "id_rapport" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_lv" varchar(32),
    "id_katalog" varchar(32),
    "id_einheit" varchar(32),
    "id_qualitaet" varchar(32),
    "id_adresse" varchar(32),
    "id_lieferung" varchar(32),
    "menge" double precision,
    "preis" double precision,
    "ke" varchar(10),
    "bezeichnung" text,
    "lieferschein_nr" varchar(50),
    "bemerkung" bytea,
    "id_lv_taglohn" text,
    "sortieren" integer,
    "zeit_von" timestamp,
    "zeit_bis" timestamp,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "rb_eigenschaft" (
    "id_rb_eigenschaft" varchar(32),
    "id_rb_eigenschaft_gruppe" varchar(32),
    "id_rb_lokalitaet" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "wert" varchar(50),
    "formel" varchar(100),
    "readonly" boolean,
    "create_dt" timestamp,
    "createuser" varchar(20),
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "rb_eigenschaft_gruppe" (
    "id_rb_eigenschaft_gruppe" varchar(32),
    "id_einheit" varchar(32),
    "nummer" varchar(20),
    "bezeichnung" varchar(50),
    "flag_verwenden" boolean,
    "readonly" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "rb_level" (
    "id_rb_level" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "ebene" integer,
    "bezeichnung" varchar(50),
    "ist_raum" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "readonly" boolean
);

CREATE TABLE "rb_lokalitaet" (
    "id_rb_lokalitaet" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_parent" varchar(32),
    "ebene" integer,
    "nummer" varchar(20),
    "bezeichnung" varchar(50),
    "bemerkung" bytea,
    "sortieren" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "geloescht_user" varchar(20),
    "geloescht_am" timestamp,
    "papierkorb" boolean,
    "readonly" boolean
);

CREATE TABLE "rb_position" (
    "id_rb_position" varchar(32),
    "id_rb_lokalitaet" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_lv" varchar(32),
    "menge" double precision,
    "menge_massen" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "readonly" boolean,
    "flags" integer
);

CREATE TABLE "rechnungstyp" (
    "id_rechnungs_typ" varchar(32),
    "text" varchar(50)
);

CREATE TABLE "rechte_gruppe" (
    "id_rechte_gruppe" varchar(32),
    "nummer" varchar(50),
    "bezeichnung" varchar(100),
    "bemerkung" bytea,
    "rechte" bytea,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "geloescht_am" timestamp,
    "geloescht_user" varchar(20),
    "mandant" integer,
    "papierkorb" boolean,
    "readonly" boolean
);

CREATE TABLE "sprach_resource" (
    "id" integer,
    "id_sprach_resource" varchar(20),
    "id_language" varchar(32),
    "bezeichnung" varchar(50)
);

CREATE TABLE "sql_scripte" (
    "id_sql_scripte" varchar(32),
    "bezeichnung" varchar(50),
    "beschreibung" text,
    "sql_text" text,
    "parameters" text,
    "grid_storage" bytea,
    "report_text" text,
    "create_dt" timestamp,
    "createuser" varchar(20),
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "suche" (
    "id_suche" varchar(32),
    "tabelle" varchar(50),
    "schnellsuche" boolean,
    "suche_memo" bytea,
    "id_adr_benutzer" varchar(32),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "papierkorb" boolean
);

CREATE TABLE "suche_lookup" (
    "id_suche_lookup" varchar(32),
    "tabelle" varchar(50),
    "feldname" varchar(50),
    "feldlookup" text,
    "id_adr_benutzer" varchar(50),
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "papierkorb" boolean
);

CREATE TABLE "tablename" (
    "id_projekte_bieter" varchar(10),
    "id_projekte_adresse" varchar(10),
    "id_projekte_lvlist" varchar(10),
    "lv_ausgang" timestamp,
    "id_ausgang_art" varchar(10),
    "lv_eingang" timestamp,
    "id_eingang_art" varchar(10),
    "ausgang_bemerkung" text,
    "eingang_bemerkung" text,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "papierkorb" boolean,
    "geloescht_user" varchar(20),
    "geloescht_am" timestamp
);

CREATE TABLE "tagesbericht" (
    "id_tagesbericht" varchar(32),
    "id_adresse" varchar(32),
    "id_adresse_rapport" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_projekte" varchar(32),
    "datum" timestamp,
    "nummer" varchar(50),
    "name" varchar(50),
    "geprueft" boolean,
    "signatur" bytea,
    "signatur_firma" bytea,
    "beschreibung" text,
    "beschreibung_rapport" text,
    "flag_auswertung" boolean,
    "readonly" boolean,
    "eintrag_alt_tb" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "tagesbericht_detail" (
    "id_tagesbericht_detail" varchar(32),
    "id_tagesbericht" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_lv" varchar(32),
    "id_katalog" varchar(32),
    "id_einheit" varchar(32),
    "id_qualitaet" varchar(32),
    "id_adresse" varchar(32),
    "id_lieferung" varchar(32),
    "menge" double precision,
    "nummer" varchar(50),
    "preis" double precision,
    "ke" varchar(10),
    "bezeichnung" text,
    "lieferschein_nr" varchar(50),
    "bemerkung" bytea,
    "id_lohnart" varchar(32),
    "id_lv_taglohn" text,
    "sortieren" integer,
    "rapporteintrag" boolean,
    "eintrag_alt" boolean,
    "zeit_von" timestamp,
    "zeit_bis" timestamp,
    "pause" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "textbaustein" (
    "id_textbaustein" varchar(10),
    "gruppe" varchar(20),
    "bezeichnung" varchar(50),
    "matchcode" varchar(10),
    "brief" bytea,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "papierkorb" boolean,
    "geloescht_am" timestamp,
    "geloescht_user" varchar(20)
);

CREATE TABLE "tree" (
    "id_tree" varchar(32),
    "id_parent" varchar(32),
    "id_sprach_resource" varchar(20),
    "typ" integer,
    "image_index" integer,
    "pc_flag" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "versandart" (
    "id_versandart" varchar(32),
    "text" varchar(50)
);

CREATE TABLE "wiedervorlage" (
    "id_wiedervorlage" varchar(32),
    "datum" timestamp,
    "dtyp" integer,
    "tabelle" varchar(128),
    "id_tabelle" varchar(32),
    "id_kalender" varchar(32),
    "ke" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "wk_gruppe" (
    "id_wk_gruppe" varchar(32),
    "id_parent" varchar(32),
    "id_adr_benutzer" varchar(32),
    "bezeichnung" varchar(50),
    "pc_flag" integer,
    "image_index" integer,
    "dialog_typ" smallint,
    "not_lizenz" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "wk_material" (
    "id_wk_material" varchar(32),
    "nummer" varchar(50),
    "matchcode" varchar(20),
    "kurzbez" varchar(20),
    "bezeichnung" varchar(100),
    "bemerkung" bytea,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "geloescht_user" varchar(20),
    "geloescht_am" timestamp,
    "papierkorb" boolean
);

CREATE TABLE "wk_material_qualitaet" (
    "id_wk_material_qualitaet" varchar(32),
    "id_wk_material" varchar(32),
    "bezeichnung1" varchar(50),
    "bezeichnung2" varchar(50),
    "id_mat_qualitaet" varchar(32),
    "menge" double precision,
    "preis" double precision,
    "text" text,
    "stueck" integer,
    "anzahl" double precision,
    "qualitaet" varchar(50),
    "id_einheit" varchar(32),
    "sortieren" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "wk_pflanze" (
    "id_wk_pflanze" varchar(32),
    "nummer" varchar(50),
    "matchcode" varchar(20),
    "kurzbez" varchar(20),
    "bezeichnung" varchar(100),
    "bemerkung" bytea,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "geloescht_user" varchar(20),
    "geloescht_am" timestamp,
    "papierkorb" boolean
);

CREATE TABLE "wk_pflanze_qualitaet" (
    "id_wk_pflanze_qualitaet" varchar(32),
    "id_wk_pflanze" varchar(32),
    "id_pflanze_qualitaet_preis" varchar(32),
    "botanischername" varchar(70),
    "deutschername" varchar(70),
    "qualitaet" varchar(100),
    "qualitaet_stufe" varchar(40),
    "groesse_von" integer,
    "groesse_bis" integer,
    "text" text,
    "stueck" integer,
    "menge" double precision,
    "anzahl" double precision,
    "preis" double precision,
    "sortieren" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "wk_tree" (
    "id_wk_tree" varchar(32),
    "id_parent" varchar(32),
    "id_wk_gruppe" varchar(32)
);

CREATE TABLE "zako" (
    "id_zako" varchar(32),
    "valuta_tage" integer,
    "zahlungsziel_tage" integer,
    "skonto1_proz" double precision,
    "skonto1_tage" integer,
    "skonto2_proz" double precision,
    "skonto2_tage" integer,
    "zako_text" varchar(200),
    "angebot_text" varchar(200),
    "skonto1_text" varchar(200),
    "skonto2_text" varchar(200),
    "ziel_text" varchar(200),
    "readonly" boolean,
    "flag_wertzuwachs" boolean,
    "sortieren" integer,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "zv_auftrag" (
    "id_zv_auftrag" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_adresse" varchar(32),
    "lv_bezeichnung" varchar(100),
    "ad_anzeigename" varchar(50),
    "nummer" varchar(20),
    "mandant" varchar(50),
    "ausgang" timestamp,
    "betrag_netto" double precision,
    "betrag_brutto" double precision,
    "papierkorb" boolean,
    "create_dt" timestamp,
    "createuser" varchar(20),
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "zv_eingang" (
    "id_zv_eingang" varchar(32),
    "id_zv_rechnung" varchar(32),
    "id_projekt_zako" varchar(32),
    "id_adr_bank" varchar(32),
    "id_zv_gutschrift" varchar(32),
    "typ" varchar(1),
    "auszug_nummer" varchar(10),
    "eingang" timestamp,
    "betrag" double precision,
    "abzug" double precision,
    "grund" varchar(50),
    "kuerzung" boolean,
    "skonto" double precision,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp,
    "zahlung" double precision
);

CREATE TABLE "zv_gewaehrleistung" (
    "id_zv_gewaehrleistung" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_zv_rechnung" varchar(32),
    "id_adresse" varchar(32),
    "id_adr_bank" varchar(32),
    "aktiv" boolean,
    "typ" smallint,
    "bezeichnung" varchar(100),
    "datum_beginn" date,
    "datum_buergschaft" date,
    "datum_ablauf" date,
    "nummer" varchar(33),
    "betrag_rechnung" double precision,
    "betrag_sicherheit" double precision,
    "prozent_sicherheit" double precision,
    "bemerkung" text,
    "betrag_eingang" double precision,
    "datum_eingang" date,
    "betrag_abzug" double precision,
    "grund_abzug" text,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

CREATE TABLE "zv_gruppe" (
    "id_zv_gruppe" varchar(32),
    "id_parent" varchar(32),
    "id_adr_benutzer" varchar(32),
    "bezeichnung" varchar(50),
    "pc_flag" integer,
    "image_index" integer,
    "dialog_typ" smallint,
    "not_lizenz" boolean,
    "createuser" varchar(20),
    "create_dt" timestamp,
    "modifyuser" varchar(20),
    "modify_dt" timestamp
);

-- Tabelle "zv_gutschrift" ist verschlüsselt (43 Felder) — Struktur nicht lesbar

CREATE TABLE "zv_mahnung" (
    "id_zv_mahnung" varchar(32),
    "id_zv_rechnung" varchar(32),
    "id_mahnung" varchar(32),
    "datum_ausgang" timestamp,
    "datum_faellig" timestamp,
    "realisiert" timestamp,
    "bezeichnung" varchar(50),
    "gebuehr" double precision,
    "mahnstufe" smallint,
    "zinsbetrag" double precision,
    "text" bytea,
    "createuser" varchar(20),
    "create_dt" timestamp
);

CREATE TABLE "zv_rechnung" (
    "id_zv_rechnung" varchar(32),
    "id_projekte_lvlist" varchar(32),
    "id_projekte_adresse" varchar(32),
    "id_dokument" varchar(32),
    "id_lv_status" varchar(32),
    "lv_bezeichnung" varchar(100),
    "id_mahnung" varchar(32),
    "id_zv_mahnung" varchar(32),
    "id_debitor" varchar(32),
    "ad_anzeigename" varchar(100),
    "nummer" varchar(20),
    "id_flag" varchar(32),
    "id_anschrift" varchar(32),
    "mandant" integer,
    "nrabschlag" integer,
    "re_ausgang" timestamp,
    "mwst" double precision,
    "betrag_netto" double precision,
    "betrag_brutto" double precision,
    "zahlbetrag_netto" double precision,
    "zahlbetrag_brutto" double precision,
    "valuta_tage" integer,
    "zahlungsziel_tage" integer,
    "faellig_dt" timestamp,
    "skonto1_proz" double precision,
    "skonto1_tage" integer,
    "skonto1_dt" timestamp,
    "skonto2_proz" double precision,
    "skonto2_tage" integer,
    "skonto2_dt" timestamp,
    "einbehalt_prozent" double precision,
    "einbehalt_betrag" double precision,
    "mahnstufe" smallint,
    "gewaehrleistung_betrag" double precision,
    "gewaehrleistung_brutto" boolean,
    "datum_mahnung1" timestamp,
    "datum_mahnung2" timestamp,
    "einbehalt_is_brutto" boolean,
    "datum_mahnung3" timestamp,
    "storno" boolean,
    "create_dt" timestamp,
    "createuser" varchar(20),
    "readonly" boolean,
    "papierkorb" boolean,
    "modify_dt" timestamp,
    "modifyuser" varchar(50),
    "flag_wertzuwachs" boolean,
    "debitorennummer" varchar(20),
    "formularbezeichnung" varchar(50),
    "id_fibu_buchungschluessel" integer,
    "fibu_konto_nummer" varchar(20),
    "konto_soll" varchar(1),
    "fibu_gegenkonto_nummer" varchar(20),
    "datev_dt" timestamp,
    "fibu_kostenstelle_nummer" varchar(20),
    "bestell_nummer" varchar(50),
    "si_einbehalt_betrag" double precision,
    "bnk_netto" double precision,
    "bnk_brutto" double precision,
    "del_protokoll" text,
    "geloescht_user" varchar(20),
    "geloescht_am" timestamp,
    "flags" integer,
    "bemerkung" bytea,
    "lastschrift_dt" timestamp
);

CREATE TABLE "zv_tree" (
    "id_zv_tree" varchar(32),
    "id_zv_rechnung" varchar(32),
    "id_zv_gruppe" varchar(32)
);

