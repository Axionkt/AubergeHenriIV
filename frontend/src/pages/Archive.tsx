import ArchiveHero from "../components/archive/ArchiveHero";
import ArchiveTimeline from "../components/archive/ArchiveTimeline";
import ArchiveEntry from "../components/archive/ArchiveEntry";
import ArchiveFigure from "../components/archive/ArchiveFigure";
import BackToTop from "../components/BackToTop";
import styles from "./Archive.module.css";

import img02 from "../components/archive/assets/image2.png";
import img03 from "../components/archive/assets/image3.png";
import img04 from "../components/archive/assets/image4.png";
import img05 from "../components/archive/assets/image5.png";
import img06 from "../components/archive/assets/image6.png";
import img07 from "../components/archive/assets/image7.png";
import img08 from "../components/archive/assets/image8.png";
import img09 from "../components/archive/assets/image9.png";
import img10 from "../components/archive/assets/image10.png";
import img11 from "../components/archive/assets/image11.png";
import img12 from "../components/archive/assets/image12.png";
import img13 from "../components/archive/assets/image13.png";
import img14 from "../components/archive/assets/image14.png";
import img15 from "../components/archive/assets/image15.png";
import img16 from "../components/archive/assets/image16.png";
import img17 from "../components/archive/assets/image17.png";
import img18 from "../components/archive/assets/image18.png";
import img19 from "../components/archive/assets/image19.png";
import img20 from "../components/archive/assets/image20.png";
import img21 from "../components/archive/assets/image21.png";
import img22 from "../components/archive/assets/image22.png";
import img23 from "../components/archive/assets/image23.png";
import img24 from "../components/archive/assets/image24.png";
import img25 from "../components/archive/assets/image25.png";
import img26 from "../components/archive/assets/image26.png";
import img27 from "../components/archive/assets/image27.png";
import img28 from "../components/archive/assets/image28.png";
import img29 from "../components/archive/assets/image29.png";
import img30 from "../components/archive/assets/image30.png";
import img31 from "../components/archive/assets/image31.png";
import img32 from "../components/archive/assets/image32.png";
import img33 from "../components/archive/assets/image33.png";
import img34 from "../components/archive/assets/image34.png";
import img35 from "../components/archive/assets/image35.png";
import img36 from "../components/archive/assets/image36.png";
import img37 from "../components/archive/assets/image37.png";
import img38 from "../components/archive/assets/image38.png";
import img39 from "../components/archive/assets/image39.png";
import img40 from "../components/archive/assets/image40.png";
import img41 from "../components/archive/assets/image41.png";
import img42 from "../components/archive/assets/image42.png";
import img43 from "../components/archive/assets/image43.png";
import img44 from "../components/archive/assets/image44.png";
import img45 from "../components/archive/assets/image45.png";
import img46 from "../components/archive/assets/image46.png";
import img47 from "../components/archive/assets/image47.png";
import img48 from "../components/archive/assets/image48.png";
import img49 from "../components/archive/assets/image49.png";
import img50 from "../components/archive/assets/image50.png";
import img51 from "../components/archive/assets/image51.png";
import img52 from "../components/archive/assets/image52.png";
import img53 from "../components/archive/assets/image53.png";
import img54 from "../components/archive/assets/image54.png";
import img55 from "../components/archive/assets/image55.png";
import img56 from "../components/archive/assets/image56.png";
import img57 from "../components/archive/assets/image57.png";

export default function Archive() {
  return (
    <div className={styles.page}>
      <ArchiveHero
        eyebrow="Mémoire d'un bâtiment au cœur de l'histoire paloise · 64000 Pau"
        title="Le 23 rue Bernadotte, dit Auberge Henri IV"
        facts={[
          { label: "Premier corps bâti", value: "1550" },
          { label: "Second corps bâti", value: "1714" },
        ]}
      />

      <div className={styles.intro}>
        <div className={styles.introImage}>
          <ArchiveFigure src={img02} alt="Photographie du 23 rue Bernadotte" />
        </div>
        <p>
          Les aléas topographiques jouent un rôle déterminant dans le choix
          d'implantation du premier foyer de population, érigeant les impératifs
          de défense au premier plan.
        </p>
        <p>
          Ainsi, l'implantation du château de Pau au cœur de l'éperon naturel
          formé par la confluence du Gave (au sud) et du Hédas (au nord)
          constitue le point d'ancrage du développement urbain de Pau, sur un
          site défensif privilégié pour une telle forteresse.
        </p>
      </div>

      <ArchiveTimeline>
        <ArchiveEntry
          year="1120"
          date="1120"
          era="Origines"
          title="Construction sur un tertre d'un ensemble fortifié"
        >
          <p>
            Construction sur un tertre d'un ensemble fortifié par des palissades
            (première mention du château de Pau).
          </p>
          <p>
            Pau est un castelnau (château neuf), appellation donnée à un village
            qui est né et s'est développé à l'abri d'une forteresse. Construit
            avant le début du XIIème siècle par les vicomtes de Béarn, sur un
            site et une position bien choisie, ce castelnau a reçu le nom de Pau
            (« pieu » en béarnais) car il est constitué par un ensemble
            palissadé.
          </p>
          <ArchiveFigure
            src={img03}
            alt="Plan ancien du site du château de Pau"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1364"
          date="1364"
          era="Le bourg médiéval"
          title="Quatre-vingt-quatorze propriétaires dans le bourg"
        >
          <p>
            Selon un censier, quatre-vingt-quatorze propriétaires sont présents
            dans le bourg.
          </p>
          <p>
            Chaque colon se voit attribuer un petit espace en forme de lanière,
            sur laquelle il construit une maison appelée ostau. Ces habitations
            sont de modestes constructions campagnardes en colombage, torchis ou
            pisé, aux toits de chaume ou de bardeaux. Elles sont soigneusement
            séparées de leurs voisines par une venelle où débouchent les
            segretes (les latrines).
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1385"
          date="1385"
          era="Le bourg médiéval"
          title="Cent vingt-huit caps d'ostaus"
        >
          <p>
            Un dénombrement mentionne les noms de cent vingt-huit caps d'ostaus,
            définis comme « chefs de maisons de feux allumants ».
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1464"
          date="1464"
          era="Le bourg médiéval"
          title="Pau devient capitale du Béarn"
        >
          <p>Pau devient la capitale de la province historique de Béarn.</p>
          <p>
            La situation topographique (vallée encaissée du Hédas) et la
            configuration domaniale (l'obstacle foncier que représentent les
            jardins du Roi attachés au château) empêchent doublement la
            croissance de la ville vers le nord et imposent ainsi, dans une
            première phase, un développement vers l'est, sur la terrasse étroite
            de l'éperon.
          </p>
          <ArchiveFigure
            src={img04}
            alt="Plan de l'urbanisation ancienne de Pau"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1503"
          date="1503-1555"
          era="Naissance d'un quartier"
          title="Henri II d'Albret et le Hameau de Pau"
        >
          <p>
            Henri II d'Albret, soucieux de transformer une économie agricole
            reposant sur l'élevage extensif, fait venir des familles paysannes
            d'Angoumois et de Saintonge pour mettre en valeur six métairies dont
            il est propriétaire. Ce sont les débuts du Hameau de Pau et
            l'ouverture du premier noyau de colonisation dans la zone du
            Pont-Long au nord.
            <br />
            Au bas de la pente, un ponceau permet de traverser le Hédas.
          </p>
          <p>Une fontaine donne son nom au quartier.</p>
          <p>
            Les jardins du château interdisant une montée directe, une véritable
            rue commence à s'organiser, la rue de la Côte de la Fontaine qui
            représente l'unique accès vers le nord. Après avoir remonté le
            versant nord du Hédas, elle débouche sur la rue Betbeder (appelée
            aujourd'hui rue Tran, parallèle à la rue Bernadotte). Cette dernière
            comporte déjà une dizaine de maisons implantées à la lisière des
            champs et des terrains de parcours, laissant place au-delà à la
            campagne à travers laquelle s'égrènent majoritairement des granges
            et des habitations temporaires.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1520"
          date="1520"
          era="Naissance d'un quartier"
          title="Une véritable rue s'organise"
        >
          <p>
            Une véritable rue s'organise le long de la Côte de la Fontaine. Elle
            débouche sur la rive nord du Hédas où l'on commence à voir
            s'implanter des maisons.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1550"
          date="1550"
          era="Le premier bâtiment"
          title="Construction du premier corps du futur 23 rue Bernadotte"
        >
          <p>
            Construction du premier corps du futur <em>23 rue Bernadotte</em>,
            composé d'un seul étage et couvert d'un toit en chaume.
          </p>
          <ArchiveFigure
            src={img05}
            alt="Plan situant le futur 23 rue Bernadotte en 1550"
            caption="Le futur 23 rue Bernadotte (o sur le plan ci-dessus) est construit à la fin de la montée du Hédas côté nord. Accessible par un petit chemin depuis la Côte de la Fontaine, l'unique axe de communication de Pau vers le nord."
          />
          <p>
            Sur la façade ouest, au rez-de-chaussée, se trouvent trois
            ouvertures excentrées dont les fonctions sont avant tout pratiques,
            alors qu'au 1<sup>er</sup> étage sont aménagées trois fenêtres bien
            centrées. Toutes les ouvertures sont encadrées par des pierres de
            taille. Les chaines d'angles en pierre sont appareillées et harpées.
          </p>
          <p>
            Une des portes ouvre à l'intérieur sur un escalier en pierres et en
            ardoises, donnant un accès direct à une cave située sous l'ensemble
            du bâtiment.
          </p>
          <p>
            Une porte principale, qui va être agrandie sur sa gauche au fil du
            temps, permet le passage d'équipements, de marchandises et d'animaux
            (sur les premiers actes notariés, le bâtiment est désigné comme une
            écurie).
          </p>

          <p>
            Cette façade ouest est la façade principale du bâtiment. Elle est
            tournée vers la rue de la Côte de la Fontaine, accessible par une
            ruelle qui apparaît sur un plan de quartier en 1773. Ce qu'il reste
            aujourd'hui de cette dernière n'est autre que le passage entre la
            cour arrière de l'immeuble et la rue Laclède.
          </p>

          <p>
            Sur le mur sud, une fenêtre unique et centrée plonge sur la rue
            Begbeder en contrebas (aujourd'hui rue Tran), avec un dénivelé de 5
            mètres correspondant à la descente vers le Hédas.
          </p>

          <p>
            A l'intérieur du bâtiment, un escalier accolé au mur sud donne accès
            au 1er étage.
          </p>
          <ArchiveFigure
            src={img06}
            alt="Schéma du sous-sol du bâtiment XVIe"
            caption="Schémas du sous-sol et du rez de chaussée sur la prise au sol"
          />
          <ArchiveFigure
            src={img07}
            alt="Schéma du rez-de-chaussée du bâtiment XVIe"
            caption="A noter l'épaisseur des murs du sous sol : pratiquement deux mètres"
          />
          <ArchiveFigure
            src={img08}
            alt="Dessin du bâtiment du futur 23 rue Bernadotte"
            caption="Dessin du bâtiment du futur 23 rue Bernadotte — o Puisard d'évacuation qui s'écoule au niveau de rue Tran"
          />
          <ArchiveFigure
            src={img09}
            alt="Charpente en bois du bâtiment"
            caption="Structure originelle en bois, renforcée en 1984 par une poutre en béton"
          />
          <ArchiveFigure
            src={img10}
            alt="Gravure du XVIe siècle sur une poutre de charpente"
            caption="Dessin du XVIème siècle sur une poutre intérieure de la charpente, réalisé avec un compas à pointes sèches. Probablement l'œuvre d'un apprenti charpentier ou tailleur de pierres."
          />

          <p>
            Le mur est ne comporte aucune ouverture, car l'accès au bâtiment par
            ce côté ne représente pas d'intérêt, ne donnant que sur des champs
            et des terrains de parcours.
          </p>
          <p>
            Les quatre murs de fondation font 1m60 d'épaisseur (plus du double
            des murs extérieurs). Un puisard d'évacuation situé dans l'angle
            est/ouest de la cave aboutit dans la rue Begbeder en contrebas.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1547"
          date="1547"
          era="Le siècle des rois de Navarre"
          title="Les jardins de Pau, les plus beaux d'Europe"
        >
          <p>
            Sous le règne d'Henri II, les jardins de Pau sont déjà considérés
            comme les plus beaux d'Europe. Ce qui renforce la contrainte
            domaniale imposant un développement de la ville vers le nord.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1552"
          date="1552"
          era="Le siècle des rois de Navarre"
          title="Premier règlement municipal"
        >
          <p>
            Premier règlement municipal instituant le nettoyage des rues,
            l'assainissement des venelles et l'interdiction d'élever oisons et
            porcs dans l'enceinte de la ville.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1568"
          date="1568"
          era="Le siècle des rois de Navarre"
          title="Jeanne d'Albret et la couverture des toits"
        >
          <p>
            Jeanne d'Albret tente de remplacer le chaume en imposant des
            couvertures en tuiles ou en ardoises. Elle prône aussi l'évacuation
            des eaux usées.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1587"
          date="1587"
          era="Le siècle des rois de Navarre"
          title="Henri de Bourbon part à la conquête de Paris"
        >
          <p>
            Henri de Bourbon (1553 - 1610) qui fut Roi de Navarre en 1572, puis
            Henri IV, Roi de France en 1589, part à la conquête de Paris. Pau
            jouera ainsi pleinement sa fonction de résidence de cour princière
            pendant un siècle.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1610"
          date="1610"
          era="Le siècle des rois de Navarre"
          title="Assassinat d'Henri IV"
        >
          <p>
            Assassinat d'Henri IV, peint ci-dessous au XIXème siècle par Charles
            Gustave Housez.
          </p>
          <ArchiveFigure
            src={img11}
            alt="Peinture de l'assassinat d'Henri IV"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1620"
          date="15 octobre 1620"
          era="Le rattachement à la France"
          title="Louis XIII proclame le rattachement du Béarn"
        >
          <p>
            Louis XIII, le fils d'Henri IV, pénètre dans la ville de Pau à la
            tête de son armée. Quelques jours plus tard, il proclame le
            rattachement du Béarn à la France et le rétablissement du
            catholicisme dans tous ses anciens droits.
          </p>
          <p>
            Dès lors, de nombreux ordres religieux s'implantent à proximité de
            la ville, pour donner suite à l'initiative royale (Capucins,
            Jésuites) ou à la dévotion privée, participant en cela au grand
            courant de réforme catholique.
          </p>
          <p>
            En un peu plus d'un demi-siècle, ils colonisent littéralement un
            nouvel espace urbain et permettent, entre autres, le désenclavement
            de la ville vers le nord. Le ravin du Hédas est franchi par les
            Cordeliers (Saint-Jacques).
          </p>
          <ArchiveFigure
            src={img12}
            alt="Plan situant le futur 23 rue Bernadotte dans la continuité de la rue de la Fontaine"
            caption="Le futur 23 Bernadotte se trouve dans la continuité de la Rue de la Fontaine, plus au nord du Pont-Long"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1650"
          date="1650"
          era="Le rattachement à la France"
          title="Installation du couvent des Cordeliers"
        >
          <p>
            L'installation du couvent des Cordeliers au nord du Hédas
            (aujourd'hui place de la Libération) nécessite la construction du
            premier pont franchissant non seulement le ruisseau du Hédas, mais
            aussi la totalité du ravin. Ce pont permettra de faciliter le
            développement de la ville vers le nord, en évitant ainsi la descente
            abrupte de la Côte de la Fontaine.
          </p>
          <p>
            Le processus de développement urbain est discontinu, contraint par
            les jardins du château et le Hédas, privilégiant les zones agricoles
            ou d'élevage.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1672"
          date="1672"
          era="Le rattachement à la France"
          title="Fin de la construction du pont des Cordeliers"
        >
          <p>Fin de la construction du pont des Cordeliers.</p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1676"
          date="1676"
          era="Le rattachement à la France"
          title="Plan du château"
        >
          <p>
            Plan du château ci-dessous, mettant en évidence l'évolution urbaine
            au nord du Hédas, via le pont des Cordeliers.
          </p>
          <ArchiveFigure
            src={img13}
            alt="Plan du château de Pau en 1676"
            caption="Plan avec une distribution géographique « sans échelle » du développement des Cordeliers par rapport aux jardins du château. Nous visualisons que le futur 23 rue Bernadotte se trouve à l'époque au milieu de champs et terrains de parcours."
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1693"
          date="1693"
          era="Le rattachement à la France"
          title="559 maisons composent la ville de Pau"
        >
          <p>559 maisons composent la ville de Pau.</p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1700"
          date="Fin du XVIIème"
          era="Le rattachement à la France"
          title="Peinture d'Henri IV en pied"
        >
          <p>Peinture d'Henri IV en pied ci-dessous.</p>
          <ArchiveFigure src={img14} alt="Peinture d'Henri IV en pied" />
        </ArchiveEntry>

        <ArchiveEntry
          year="1701"
          date="1701-1800"
          era="Le siècle des Lumières"
          title="L'urbanisation du XVIIIème siècle"
        >
          <p>
            Si l'urbanisation du XVIIIème siècle fait apparaître quelques hôtels
            particuliers et immeubles de rapport, nous remarquons aussi la
            constitution de fronts bâtis formés d'unités architecturales souvent
            peu monumentales mais dont la répétition crée l'intérêt patrimonial.
            Le but est de loger une population paloise en augmentation.
            Construits en pierre, de nouveaux quartiers périphériques
            apparaissent, comme autour du couvent des Cordeliers. Les façades à
            travées régulières sont bâties sur plusieurs étages et implantées
            dans l'alignement des rues nouvellement tracées.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1706"
          date="1706"
          era="Le siècle des Lumières"
          title="Ouverture de la rue Neuve-des-Cordeliers"
        >
          <p>
            Ouverture de la rue Neuve-des-Cordeliers (aujourd'hui rue
            Bernadotte). La rue Begbeder est rebaptisée et devient la rue Tran.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1710"
          date="1710"
          era="Le siècle des Lumières"
          title="Représentation des jardins du château"
        >
          <p>
            Représentation des jardins du château (ci-dessous), sur lesquels le
            futur 23 rue Bernadotte jouit d'une position privilégiée. Le nouveau
            tracé de la rue menant au couvent des Cordeliers apparaît.
          </p>
          <ArchiveFigure
            src={img15}
            alt="Représentation des jardins du château de Pau, 1710"
          />
          <ArchiveFigure
            src={img16}
            alt="Plan complémentaire des jardins du château, 1710"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1714"
          date="1714"
          era="Le second corps de bâtiment"
          title="Construction du second corps de bâtiment"
        >
          <p>
            Construction du second corps de bâtiment du futur{" "}
            <em>23 rue Bernadotte</em>, sur toute la longueur d'une double
            parcelle, dans l'alignement de la rue Neuve-des-Cordeliers
            fraichement ouverte. Il est composé de trois étages avec un sous
            toit.
          </p>
          <ArchiveFigure
            src={img17}
            alt="Schéma du sous-sol du bâtiment XVIIIe"
            caption="Schémas du sous-sol mettant en avant l'épaisseur des fondations."
          />
          <ArchiveFigure
            src={img18}
            alt="Schéma du rez-de-chaussée du bâtiment XVIIIe"
            caption="Schéma du rez-de-chaussée et de la galerie suspendue en bois."
          />
          <ArchiveFigure
            src={img19}
            alt="Façade principale du bâtiment XVIIIe"
            caption="Façade principale"
          />
          <p>
            La façade principale nord exprime tout le caractère et le rythme de
            cet immeuble de rapport. Son apparence se veut cohérente avec le
            statut de son propriétaire.
          </p>
          <p>
            Elle est ordonnancée et symétrique, en enduit de chaux, avec des
            chaînages en pierre de taille. Les bâtiments sont bien séparés par
            des venelles d'environ 30cm, mais elle veut aussi se démarquer
            clairement des façades mitoyennes. La modénature est simple avec un
            encadrement de pierres sur toutes les ouvertures extérieures que
            sont la porte d'entrée de l'immeuble et ses quinze fenêtres. Elle
            est traversée sur toute sa longueur par trois bandeaux en pierre (un
            à chaque étage), situés dans l'alignement bas des fenêtres. Le toit
            est souligné par une corniche en bois, trompant un effet pierre. Les
            trois lucarnes sont positionnées dans l'alignement des trois travées
            d'ouvertures centrales, pour affirmer une symétrie parfaite.
          </p>
          <p>
            La façade est, réduite à sa simple fonction de mur porteur, ne
            comporte aucune ouverture compte tenu de la mitoyenneté directe avec
            le futur 21 rue Bernadotte, dont le bâtiment sera construit à la fin
            du XVIIIème.
          </p>
          <p>
            Le muret en briquettes plates rouges, fermant la venelle sur la rue,
            ne sera monté qu'au XIXème.
          </p>
          <p>
            La façade ouest, façade de retour, est également construite comme un
            simple mur porteur, bénéficiant du positionnement privilégié de la
            parcelle du futur <em>23 rue Bernadotte.</em>
          </p>
          <ArchiveFigure src={img20} alt="Façade ouest du bâtiment" />
          <p>
            Deux fenêtres encadrées de pierres sont alignées verticalement, et
            volontairement déportées vers la droite de la façade, permettant de
            maintenir centrés les conduits de cheminée, et préservant la vue sur
            le parc et le château, dans l'éventualité d'une construction sur la
            parcelle avoisinante. La fenêtre située au 2ème étage sera condamnée
            plus tard en raison de la proximité visuelle avec l'immeuble du 4
            rue Laclède (anciennement rue Côte de la Fontaine). La seconde,
            située au 3ème étage, est toujours existante.
          </p>
          <p>
            La fonction de la façade sud, côté cour, est plus "intime" et
            néanmoins vitale. Le rez-de-chaussée est ouvert et couvert, avec une
            seule fenêtre encadrée de pierres. Une galerie en bois suspendue et
            semi-fermée habille les 1<sup>er</sup>, 2<sup>ème</sup> et 3
            <sup>ème</sup> étage, comme le montre le dessin exemple ci-dessous.
          </p>
          <ArchiveFigure
            src={img21}
            alt="Dessin du XIXe siècle d'un immeuble avec galeries en bois"
            caption="Dessin du XIXème représentant un immeuble avec des galeries en bois"
          />
          <p>
            Cette galerie en bois s'intègre entre les deux bâtiments du XVIème
            et du XVIIIème, sans toutefois permettre une communication entre
            eux. Le bâtiment sur cour reste donc accessible exclusivement par la
            ruelle qui débouche dans la rue de la Côte de la Fontaine.
          </p>
          <ArchiveFigure
            src={img22}
            alt="Façade du bâtiment XVIIIe sur la rue Bernadotte"
            caption="Façade bâtiment XVIIIème — sur la rue Bernadotte"
          />
          <ArchiveFigure
            src={img23}
            alt="Façade du bâtiment XVIIIe sur cour"
            caption="Façade bâtiment XVIIIème — sur cour"
          />
          <ArchiveFigure
            src={img24}
            alt="Façade du bâtiment XVIe sur cour"
            caption="Façade bâtiment XVIème — sur cour"
          />
          <p>
            Des ouvertures traversant les 70 cm des murs porteurs du bâtiment
            principal permettent d'accéder aux galeries en bois. Leur
            encadrement en bois de cœur de chêne est encore présent et visible
            partout dans l'immeuble.
          </p>
          <ArchiveFigure
            src={img25}
            alt="Éviers en pierre alignés sur les étages"
          />
          <p>
            Des éviers sculptés en pierre sont intégrés dans le mur ouest au
            rez-de-chaussée, 1<sup>er</sup>, 2ème et 3ème étage. Ils sont
            parfaitement alignés sur toute la hauteur de l'immeuble.
          </p>
          <ArchiveFigure
            src={img26}
            alt="Évier en pierre du premier étage"
            caption="Photo évier du 1er étage"
          />
          <ArchiveFigure
            src={img27}
            alt="Évier en pierre du rez-de-chaussée"
            caption="Photos de l'évier du RdC avec son évacuation sur la droite"
          />
          <ArchiveFigure
            src={img28}
            alt="Évacuation de l'évier du rez-de-chaussée"
            caption="Photos de l'évier du RdC avec son évacuation sur la droite"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1763"
          date="26 janvier 1763"
          era="Une naissance illustre"
          title="Naissance de Jean-Baptiste Bernadotte"
        >
          <p>
            Naissance, dans la « Maison Bernadotte », de Jean-Baptiste
            Bernadotte, Maréchal de Napoléon, Prince héritier de Suède.
          </p>
          <blockquote>
            <p>
              « Les Bernadotte n'étaient ni aisés, ni pauvres. Issu par son père
              d'une famille de tailleurs et par sa mère, Jeanne de Saint-Jean,
              de la petite noblesse des environs, la carrière de Jean-Baptiste
              Jules semblait tracée d'avance. Mais ce fut son frère aîné Henri
              qui devint procureur au même échelon que son père tandis que Jean,
              le benjamin, préféra le métier de tisserand. Ils résidaient dans
              l'une des deux rues traversières de la cité, la rue Neuve, proche
              du centre mais éloignée de la Grande Rue réservée aux Messieurs du
              Parlement. L'enfant Jean-Baptiste fréquenta donc davantage les
              lavandières du lavoir et les galopins chargés d'abreuver le bétail
              plutôt que l'élite locale. »
            </p>
          </blockquote>
          <p>
            Par Sébastien HORION, diplômé d'Histoire et spécialiste de la Maison
            Bernadotte
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1770"
          date="1770"
          era="Projets urbains"
          title="Plan détaillé du projet de la place Gramont"
        >
          <p>Plan détaillé du projet de la place Gramont (ci-dessous).</p>
          <p>
            A noter, l'urbanisme compte établir deux parcelles sur l'emplacement
            actuel du futur <em>23 rue Bernadotte</em> (297 m2 au cadastre).
          </p>
          <p>
            Cette répartition en deux parcelles suivait une logique pratique
            permettant de désenclaver le bâtiment déjà existant (XVème siècle)
            en lui donnant accès à la nouvelle rue Neuve-des-Cordeliers, tout en
            supprimant la ruelle donnant sur la rue Côte de la Fontaine. Ce
            projet ne se réalisera pas, la parcelle ne sera pas divisée en deux,
            et la ruelle sera conservée mais transformée en un chemin privatif
            autorisant un droit de passage.
          </p>
          <p>
            En effet, à cette époque, la maison de ville du XVIIIème présente
            souvent une façade étroite sur la rue et un développement plus
            important sur la profondeur de la parcelle. Le linéaire de la façade
            est souvent limité par la longueur maximale d'une pièce de bois
            (entre six et huit mètres), constituant ainsi le linteau du
            rez-de-chaussée. La maison est construite en maçonnerie de galets du
            Gave, liés à la chaux et au sable du Gave, et les murs comportent
            parfois aussi de la terre ou des débris de terre cuite. Les
            encadrements d'ouvertures sont en calcaire blanc de Lasseube.
          </p>
          <ArchiveFigure
            src={img29}
            alt="Plan détaillé du projet de la place Gramont, 1770"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1773"
          date="1773"
          era="Projets urbains"
          title="Plan esquisse de Moyset pour la place Gramont"
        >
          <p>
            Plan « esquisse » établi par Moyset pour l'aménagement de la place
            Gramont (ci-dessous).
          </p>
          <p>
            On remarquera la petite ruelle partant de la rue Côte de la Fontaine
            (aujourd'hui rue Laclède + rue de la Fontaine) : axe de passage
            depuis le XIIIème siècle, elle a permis le développement urbain du
            nord de Pau depuis le XVème siècle. Cette ruelle est officiellement
            désignée comme telle en 1795, dans le premier acte de vente recensé
            du futur 23 rue Bernadotte.
          </p>
          <ArchiveFigure
            src={img30}
            alt="Plan esquisse établi par Moyset pour la place Gramont, 1773"
          />
          <p>
            Elle restera l'unique accès au tout premier bâtiment du futur{" "}
            <em>23 rue Bernadotte</em> jusqu'en 1850.
          </p>
          <ArchiveFigure
            src={img31}
            alt="Plan complémentaire de la place Gramont"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1774"
          date="1774"
          era="Projets urbains"
          title="Urbanisation de Pau vers le nord"
        >
          <p>
            L'urbanisation de Pau vers le nord, au-delà du Hédas, est concentrée
            entre les jardins et le couvent des Cordeliers (Ci-dessous)
          </p>
          <ArchiveFigure
            src={img32}
            alt="Plan de l'urbanisation de Pau vers le nord, 1774"
          />
          <p>
            Le tintement quotidien de la clochette du valet de ville avertit
            chaque Palois qu'il doit balayer devant sa porte avant 7 heures. Les
            sergents du guet effectuent une ronde de contrôle après 9 heures.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1786"
          date="1786"
          era="Projets urbains"
          title="Fin de la construction du pont Neuf"
        >
          <p>
            Fin de la construction du pont Neuf (aujourd'hui Bordenave d'Abère),
            commencée en 1746.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1789"
          date="Été 1789"
          era="La Révolution"
          title="La panique nobiliaire"
        >
          <p>
            La panique nobiliaire, dès juillet-août 1789, la nouvelle de la
            prise de la Bastille le 14 juillet, et les effets de la Grande Peur
            fin juillet se répandent rapidement dans tout le Sud-Ouest.
          </p>
          <p>
            Dans le Béarn, comme dans de nombreuses régions rurales, la
            population redoute l'arrivée de « brigands » ou de supposées «
            bandes nobiliaires ».
          </p>
          <p>
            Ce climat d'inquiétude provoque une vive tension sociale.
            Conséquence directe, la plupart de la petite noblesse locale ou des
            propriétaires de fiefs quittent leurs terres, se réfugient à Pau ou
            émigrent temporairement. D'autres préfèrent vendre précipitamment
            leurs biens, souvent à des bourgeois ou à des artisans récemment
            enrichis (aubergistes, notaires, négociants, etc.).
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1789"
          date="1789-1792"
          era="La Révolution"
          title="La Révolution dans le cadre constitutionnel"
        >
          <p>
            La Révolution se déroule encore dans le cadre dit constitutionnel.
          </p>
          <p>
            Le climat politique se durcit progressivement : les nobles sont
            surveillés, certains sont arrêtés ou poussés à l'exil.
          </p>
          <p>
            Cependant, durant cette période, aucune exécution par guillotine n'a
            encore lieu à Pau. En 1791-1792, lorsque des condamnations à mort
            sont prononcées, on applique encore les méthodes de l'Ancien Régime
            (pendaison ou sabre).
          </p>
          <p>
            Les premières guillotines apparaissent à Paris en 1792, puis sont
            progressivement installées dans les chefs-lieux de département.
          </p>
          <p>
            C'est très probablement dans ce contexte de 1789-1790 que
            l'aubergiste Bertrand Mirasson, dit Lestanguet, a pu acquérir
            l'immeuble.
          </p>
          <p>
            Les nobles cherchaient alors à liquider leurs propriétés avant
            d'éventuelles saisies ou avant que les biens nationaux (biens du
            clergé et des émigrés) ne soient confisqués.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1791"
          date="1791-1792"
          era="La Révolution"
          title="L'exil de la noblesse"
        >
          <p>
            À partir de 1791, les nobles hostiles à la Révolution commencent à
            émigrer massivement, notamment vers l'Espagne, c'est la période dite
            de l'exil.
          </p>
          <p>
            Les principales voies de passage se situent à Oloron,
            Saint-Jean-Pied-de-Port, Bayonne, et parfois même Pau.
          </p>
          <p>
            Ceux qui choisissent de rester sur place sont étroitement surveillés
            ; certains seront emprisonnés à partir de 1793.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1793"
          date="1793"
          era="La Révolution"
          title="Confiscation des biens nationaux"
        >
          <p>
            L'État révolutionnaire procède à la confiscation des biens
            appartenant aux émigrés et au clergé. Ces propriétés deviennent
            officiellement des biens nationaux, destinés à être vendus par
            l'administration.
          </p>
          <p>
            Les sources locales, notamment les travaux de l'historien béarnais
            André Cazaurang, indiquent que la première guillotine paloise est
            installée en 1793, pendant la Terreur (an II de la République).
          </p>
          <p>
            Elle est placée sur la place Gramont, alors principale place
            publique de la ville, rebaptisée place de la Révolution.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1793"
          date="1793-1794"
          era="La Révolution"
          title="Les exécutions à Pau"
        >
          <p>Exécutions à Pau, on en recense 11 à 14 connues.</p>
          <p>
            Parmi les condamnés figurent plusieurs anciens nobles locaux ainsi
            que des prêtres réfractaires.
          </p>
          <p>
            Toutefois, la répression reste limitée : rien de comparable avec
            Paris ou Lyon.
          </p>
          <p>Pau demeure un chef-lieu relativement calme durant la Terreur.</p>
          <ArchiveFigure
            src={img33}
            alt="Illustration de la place Gramont pendant la Révolution"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1795"
          date="5 mars 1795"
          era="La Révolution"
          title="Vente à Guilhaume d'Abadie"
        >
          <p>
            Mr Bertrand Mirasson dit Lestanguet (Aubergiste) vend le futur 23
            rue Bernadotte à Mr Guilhaume d'Abadie (Négociant).
          </p>
          <p>
            La mention « des dits immeubles » sur l'acte de vente confirme la
            présence de plusieurs bâtiments sur la parcelle.
          </p>
          <p>
            En se référant à des actes plus récents, plus détaillés, et
            spécifiquement à celui du 11 février 1841, la description fait état
            d'une maison (le bâtiment du XVIIIème), d'une écurie (le bâtiment du
            XVIème), et d'une remise dont la date de construction est inconnue.
          </p>
          <p>
            Cette dernière est accolée au mur de la maison mitoyenne côté ouest
            de la cour. Elle est constituée de matériaux légers, notamment de
            bois.
          </p>
          <ArchiveFigure
            src={img34}
            alt="Trace de la charpente de la remise sur le mur mitoyen"
            caption="Des preuves évoquant la présence de la charpente de la remise, sur le mur du bâtiment mitoyen à la cour."
          />
          <ArchiveFigure
            src={img35}
            alt="Plan cadastral montrant la remise"
            caption="Celle-ci n'apparaît sur le cadastre qu'au début du XIXème siècle, sur des plans qui se veulent plus détaillés afin de mieux ajuster les taxes"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1810"
          date="21 août 1810"
          era="Le Béarnais devenu roi"
          title="Jean-Baptiste Bernadotte élu roi de Suède"
        >
          <p>Le Palois Jean-Baptiste Bernadotte est élu roi de Suède.</p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1810"
          date="7 novembre 1810"
          era="Le Béarnais devenu roi"
          title="Vente à Pierre Lehimas"
        >
          <p>
            Mr Guilhaume d'Abadie vend le futur 23 rue Bernadotte à Mr Pierre
            Lehimas (Rentier) pour 10,000 Frs.
          </p>
          <p>
            L'acte de vente mentionne une « maison et énoncés », confirmant la
            présence d'une maison principale (le bâtiment du XVIIIème) et de
            dépendances non habitées (le bâtiment du XVIème et la remise en
            bois).
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1811"
          date="12 mars 1811"
          era="Le Béarnais devenu roi"
          title="Vente à Laurent Lanacastet père"
        >
          <p>
            Quelques mois plus tard, Mr Pierre Lehimas vend le futur 23 rue
            Bernadotte à Mr Laurent Lanacastet - père (Négociant) pour 10,000
            Frs.
          </p>
          <p>
            L'acte de vente mentionne seulement une maison (le bâtiment du
            XVIIème) et une écurie (le bâtiment du XVIème).
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1825"
          date="1825"
          era="Le Béarnais devenu roi"
          title="Le château et ses parcs"
        >
          <p>Le château et ses parcs environnants (ci-dessous).</p>
          <ArchiveFigure
            src={img36}
            alt="Le château de Pau et ses parcs environnants, 1825"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1830"
          date="27, 28 et 29 juillet 1830"
          era="Le Béarnais devenu roi"
          title="La révolution des Trois Glorieuses"
        >
          <p>La révolution des Trois Glorieuses.</p>
          <p>
            Le tableau d'Eugène Delacroix, par son aspect allégorique et sa
            portée politique, a été fréquemment choisi comme symbole de la
            République Française ou de la démocratie.
          </p>
          <ArchiveFigure
            src={img37}
            alt="La Liberté guidant le peuple, Eugène Delacroix"
            caption="La Liberté guidant le peuple 1830 - Eugene Delacroix - Huile"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1836"
          date="1836"
          era="Le Béarnais devenu roi"
          title="La montée du Hédas"
        >
          <p>
            La montée du Hédas, par la rue de la Côte de la Fontaine
            (ci-dessous).
          </p>
          <ArchiveFigure
            src={img38}
            alt="La montée du Hédas par la rue de la Côte de la Fontaine, 1836"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1840"
          date="1840"
          era="Le Béarnais devenu roi"
          title="Plan de l'urbanisation de Pau"
        >
          <p>Plan de l'urbanisation de Pau (ci-dessous).</p>
          <ArchiveFigure
            src={img39}
            alt="Plan de l'urbanisation de Pau, 1840"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1841"
          date="11 février 1841"
          era="Le Béarnais devenu roi"
          title="Succession en faveur de Henri Lanacastet fils"
        >
          <p>
            Succession de Mr Laurent Lanacastet - père en faveur de Mr Henri
            Lanacastet - fils (Négociant).
          </p>
          <p>
            L'acte de vente mentionne à nouveau une maison (le bâtiment du
            XVIIème), une écurie (le bâtiment du XVIème) et une remise.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1842"
          date="1842"
          era="Le Béarnais devenu roi"
          title="Numérotation des maisons"
        >
          <p>
            Une initiative administrative lance la numérotation des maisons.
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1845"
          date="1845"
          era="La fusion des deux bâtiments"
          title="Regroupement des bâtiments du XVIIIème et du XVIème"
        >
          <p>Regroupement des bâtiments du XVIIIème et du XVIème :</p>

          <p>
            La galerie en bois du bâtiment du XVIIIème est réédifiée en
            briquettes
          </p>
          <p>
            Le bâtiment du XVIème est surélevé d'un étage, et des ouvertures
            vers le bâtiment du XVIIIème sont créées au rez-de-chaussée et au
            premier étage.
          </p>

          <ArchiveFigure
            src={img40}
            alt="Façade du bâtiment XVIIIe sur cour"
            caption="Façade bâtiment XVIIIème sur cour"
          />
          <ArchiveFigure
            src={img41}
            alt="Façade du bâtiment XVIe sur cour"
            caption="Façade bâtiment XVIème sur cour"
          />
          <ArchiveFigure src={img42} alt="Vue du bâtiment sur cour" />
          <ArchiveFigure
            src={img43}
            alt="Vue complémentaire du bâtiment sur cour"
          />
          <ArchiveFigure
            src={img44}
            alt="Photographie des façades sur cour prise en 1989"
            caption="Photos prises en 1989"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1850"
          date="1850"
          era="Le cadastre et la famille Loustalot"
          title="Plan de l'urbanisation de Pau"
        >
          <p>Plan de l'urbanisation de Pau (ci-dessous).</p>
          <ArchiveFigure
            src={img45}
            alt="Plan de l'urbanisation de Pau, 1850"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1851"
          date="1851"
          era="Le cadastre et la famille Loustalot"
          title="Premier plan cadastral avec numérotation"
        >
          <p>
            Premier plan cadastral comportant la numérotation des bâtiments.
          </p>
          <p>
            Le futur <em>23 rue Bernadotte</em> porte le nom de « maison
            Lanacastet » au numéro 7.
          </p>
          <p>
            La délimitation de la transformation de la galerie en bois apparaît.
          </p>
          <p>La ruelle d'accès à la cour est devenue un passage.</p>
          <ArchiveFigure
            src={img46}
            alt="Plan cadastral de 1851 avec numérotation"
          />
          <p>
            1851 : Plan cadastral du Hédas, passage historique du développement
            nord de Pau (ci-dessous).
          </p>
          <ArchiveFigure src={img47} alt="Plan cadastral du Hédas, 1851" />
        </ArchiveEntry>

        <ArchiveEntry
          year="1862"
          date="8 décembre 1862"
          era="Le cadastre et la famille Loustalot"
          title="Vente à Jean Loustalot père"
        >
          <p>
            Mr Henri Lanacastet - fils vend le futur 23 rue Bernadotte à Mr Jean
            Loustalot - père (Notaire) pour 35,000 Frs.
          </p>
          <p>
            L'acte de vente mentionne : « Maison et écurie qui depuis le décès
            de Laurent Lanacastet ont été réédifiées » et « immeuble qui a été
            transformé, comprenait deux maisons ».
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1863"
          date="1863"
          era="Le cadastre et la famille Loustalot"
          title="Le numéro 23 de la rue Bernadotte"
        >
          <p>
            La maison Loustalot porte maintenant le numéro 23 dans la rue
            Bernadotte.
          </p>
          <p>
            A noter, la ruelle d'accès à la cour, qui était devenue un « passage
            » sur le plan cadastral de 1851, apparaît maintenant comme un «
            passage indivis ».
          </p>
          <ArchiveFigure
            src={img48}
            alt="Plan cadastral de 1863 avec le numéro 23"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1872"
          date="1872, 1875, 1889"
          era="Le cadastre et la famille Loustalot"
          title="Construction du réseau d'égouts"
        >
          <p>Construction du réseau d'égouts.</p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1888"
          date="1 mai 1888"
          era="Le cadastre et la famille Loustalot"
          title="Succession en faveur de Jean Joseph Loustalot"
        >
          <p>
            Succession de Mr Jean Loustalot - père en faveur de Mr Jean Joseph
            Loustalot - fils (Notaire).
          </p>
          <p>
            L'acte de succession mentionne pour la première fois « Immeuble ».
          </p>
          <ArchiveFigure
            src={img49}
            alt="Rue Bernadotte à la fin du XIXe siècle"
          />
          <ArchiveFigure
            src={img50}
            alt="Scène de rue à Pau, fin du XIXe siècle"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1923"
          date="20 octobre 1923"
          era="Le XXe siècle"
          title="Vente à Robert Édouard Donnadieu"
        >
          <p>
            Mr Jean Joseph Loustalot et Mme Rose Jeanne Marie Marguerite née
            Arnaud vend le 23 rue Bernadotte à Mr Robert Edouard Donnadieu
            (Commandant des Armées) et Mme Marie Thérèse, née Bonnafon, pour
            80,000 Frs.
          </p>
          <p>
            L'acte de vente mentionne : « Immeuble avec deux corps en aile ».
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1957"
          date="29 août 1957"
          era="Le XXe siècle"
          title="Succession en faveur de Françoise Lapouge"
        >
          <p>
            Succession de Mme Marie Thérèse née Bonnafon, veuve de Mr Robert
            Edouard Donnadieu, en faveur de leur fille, Mme Françoise Marguerite
            Mathilde Lapouge née Donnadieu (Professeur).
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1987"
          date="21 mai 1987"
          era="Le XXe siècle"
          title="Vente à Patrick Louart"
        >
          <p>
            Mme Françoise Marguerite Mathilde Lapouge, née Donnadieu, vend le 23
            rue Bernadotte à Mr Patrick Louart (Formateur).
          </p>
        </ArchiveEntry>

        <ArchiveEntry
          year="1989"
          date="Décembre 1989"
          era="Le XXe siècle"
          title="Ravalement de la façade nord"
        >
          <p>
            Ravalement de la façade nord et projection de béton sur les façades
            côté cour.
          </p>
          <ArchiveFigure src={img51} alt="Façade nord après ravalement, 1989" />
          <ArchiveFigure
            src={img52}
            alt="Détail de la façade après ravalement, 1989"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="1998"
          date="1998"
          era="Le XXe siècle"
          title="Réhabilitation du bâtiment sur cour"
        >
          <p>
            Réhabilitation du 2ème étage du bâtiment côté cour, et création
            d'une terrasse sur le toit. Renforcement du balcon du 3ème étage du
            corps principal, en béton armé.
          </p>
          <ArchiveFigure
            src={img53}
            alt="Façade du bâtiment XVIIIe sur cour après travaux de 1998"
            caption="Façade bâtiment XVIIIème sur cour"
          />
          <ArchiveFigure
            src={img54}
            alt="Façade du bâtiment XVIe sur cour après travaux de 1998"
            caption="Façade bâtiment XVIème sur cour"
          />
          <ArchiveFigure
            src={img42}
            alt="Le deuxième étage avant réhabilitation"
            caption="Le 2ème étage avant"
          />
          <ArchiveFigure
            src={img55}
            alt="Le deuxième étage après réhabilitation"
            caption="Le 2ème étage après"
          />
          <ArchiveFigure
            src={img44}
            alt="Le toit du bâtiment cour avant travaux"
            caption="Le toit du bâtiment cour avant"
          />
          <ArchiveFigure
            src={img56}
            alt="La terrasse aménagée sur le bâtiment cour"
            caption="La terrasse sur le bâtiment cour après"
          />
        </ArchiveEntry>

        <ArchiveEntry
          year="2004"
          date="2004"
          era="Mémoire et archives"
          title="Création du fichier des immeubles de Pau"
        >
          <p>
            Création du fichier des immeubles de Pau, commandé par l'urbanisme.
          </p>
          <p>
            A noter, la date de construction du <em>23 rue Bernadotte</em> est
            erronée, celle-ci ayant été déterminée seulement à partir des
            archives du cadastre de 1870.
          </p>
          <ArchiveFigure src={img57} alt="Ornement de fin de dossier" />
        </ArchiveEntry>

        <ArchiveEntry
          year="2006"
          date="4 septembre 2006"
          era="Mémoire et archives"
          title="Vente a Mr Laurent YVON et Mme Christine YVON née DZIERZBICKI"
        >
          <p>
            Vente du 23 rue Bernadotte par Mr Patrick LOUART en faveur de
            Christine YVON née DZIERZBICKI et Mr Laurent YVON.
          </p>
        </ArchiveEntry>
      </ArchiveTimeline>

      <footer className={styles.footer}>
        Par Christine &amp; Laurent, Aout 2025
      </footer>

      <BackToTop />
    </div>
  );
}
