import { Link } from "react-router-dom";
import styles from "./Legal.module.css";

const OWNERS = {
  names: "Christine et Laurent YVON",
  address: "23 Rue Bernadotte, Pau, France",
  phone: "+33 6 62 10 23 58",
  email: "aubergeh4@gmail.com",
  director: "Christine YVON",
  siret: null as string | null,
};

const HOST = {
  name: "Scaleway SAS",
  address: "8 rue de la Ville l'Évêque, 75008 Paris, France",
  phone: "+33 1 84 13 00 00",
};

const LAST_UPDATED = "17 novembre 2026";

const mail = <a href={`mailto:${OWNERS.email}`}>{OWNERS.email}</a>;

export default function Legal() {
  return (
    <main className={styles.page}>
      <article className={styles.content}>
        <h1>Mentions légales et confidentialité</h1>
        <p className={styles.updated}>Dernière mise à jour : {LAST_UPDATED}</p>

        <h2>Éditeur du site</h2>
        <p>
          Le site Auberge Henri IV est édité par {OWNERS.names}, propriétaires
          de l'immeuble, en qualité de particuliers.
          <br />
          Adresse : {OWNERS.address}
          <br />
          Téléphone : {OWNERS.phone}
          <br />
          E-mail : {mail}
          {OWNERS.siret && (
            <>
              <br />
              SIRET : {OWNERS.siret}
            </>
          )}
          <br />
          Directeur·rice de la publication : {OWNERS.director}
        </p>

        <h2>Hébergement</h2>
        <p>
          {HOST.name}
          <br />
          {HOST.address}
          <br />
          {HOST.phone}
        </p>

        <h2>Données personnelles</h2>
        <p>
          Les responsables du traitement des données collectées sur ce site sont{" "}
          {OWNERS.names}, joignables à {mail}.
        </p>

        <h3>Données collectées</h3>
        <ul>
          <li>
            À la création d'un compte : nom, prénom, adresse e-mail et mot de
            passe (conservé uniquement sous forme chiffrée). Ces informations
            sont obligatoires : sans elles, le compte ne peut pas être créé.
          </li>
          <li>
            En cas de connexion avec Google : nom, prénom et adresse e-mail
            transmis par Google. Aucune autre donnée de votre compte Google
            n'est consultée.
          </li>
          <li>
            Données techniques (adresse IP, journaux de connexion) nécessaires à
            la sécurité du site.
          </li>
        </ul>

        <h3>Finalités et base légale</h3>
        <p>
          Ces données servent uniquement à créer et gérer votre compte, à vous
          connecter, à gérer vos accès aux appartements et espaces
          professionnels, à vous envoyer les e-mails liés à votre compte
          (vérification de l'adresse, réinitialisation du mot de passe,
          notification d'un nouvel accès) et à sécuriser le site. Ce traitement
          est nécessaire à la fourniture du service que vous demandez en créant
          un compte (article 6.1.b du RGPD) et, pour la sécurité, à notre
          intérêt légitime (article 6.1.f).
        </p>
        <p>
          Les données reçues de Google servent uniquement à vous identifier sur
          ce site. Elles ne sont ni vendues, ni partagées, ni utilisées à des
          fins publicitaires.
        </p>

        <h3>Destinataires</h3>
        <p>
          Vos données ne sont accessibles qu'aux propriétaires et aux
          prestataires techniques strictement nécessaires : l'hébergeur du site,
          Cloudflare (sécurité et diffusion du site), Resend (envoi des e-mails)
          et Google (uniquement si vous choisissez la connexion avec Google : le
          site ne contacte Google qu'au moment où vous cliquez sur ce bouton).
          Certains de ces prestataires peuvent traiter des données hors de
          l'Union européenne, dans le cadre des garanties prévues par le RGPD
          (clauses contractuelles types ou décision d'adéquation).
        </p>

        <h3>Durée de conservation</h3>
        <p>
          Les données de votre compte sont conservées jusqu'à sa suppression.
          Vous pouvez supprimer votre compte à tout moment depuis votre{" "}
          <Link to="/profil">profil</Link> ; vos données sont alors effacées.
          Les journaux techniques sont conservés pour une durée limitée, puis
          effacés automatiquement.
        </p>

        <h3>Cookies</h3>
        <p>
          Le site utilise uniquement des cookies strictement nécessaires à votre
          connexion. Aucun cookie publicitaire ni de mesure d'audience n'est
          utilisé ; aucun consentement n'est donc requis.
        </p>

        <h3>Vos droits</h3>
        <p>
          Vous disposez d'un droit d'accès, de rectification, d'effacement, de
          limitation, de portabilité et d'opposition sur vos données. Pour les
          exercer, écrivez à {mail}. Vous pouvez également adresser une
          réclamation à la CNIL (
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">
            www.cnil.fr
          </a>
          ).
        </p>
      </article>
    </main>
  );
}
